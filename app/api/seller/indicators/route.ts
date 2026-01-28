import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/seller/indicators
 * Get all indicators for the seller
 * Allows companyId from URL params for seller dashboard access
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get companyId from URL params (for seller dashboard access)
    const url = new URL(request.url)
    const companyIdParam = url.searchParams.get('companyId')
    
    let user = await getAuthenticatedUser(request)
    
    // If we have companyId from URL and no auth, allow access with companyId override
    if (!user && companyIdParam) {
      user = await getAuthenticatedUser(request, {
        allowCompanyIdOverride: true,
        companyId: companyIdParam,
      })
    }
    
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized - companyId required' }, { status: 401 })
    }

    const connection = await prisma.tradingViewConnection.findUnique({
      where: { companyId: user.companyId },
      include: {
        indicators: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'TradingView account not connected' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      indicators: connection.indicators,
    })
  } catch (error: any) {
    console.error('Error fetching indicators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch indicators' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/seller/indicators/import
 * Manually import/refresh indicators from TradingView
 * Allows companyId from URL params or request body for seller dashboard access
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get companyId from URL params (for seller dashboard access)
    const url = new URL(request.url)
    const companyIdParam = url.searchParams.get('companyId')
    
    let user = await getAuthenticatedUser(request)
    
    // If we have companyId from URL/body and no auth, allow access with companyId override
    const body = await request.json().catch(() => ({}))
    const { companyId: bodyCompanyId } = body
    const companyId = companyIdParam || bodyCompanyId
    
    if (!user && companyId) {
      user = await getAuthenticatedUser(request, {
        allowCompanyIdOverride: true,
        companyId: companyId,
      })
    }
    
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized - companyId required' }, { status: 401 })
    }

    const connection = await prisma.tradingViewConnection.findUnique({
      where: { companyId: user.companyId },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'TradingView account not connected' },
        { status: 404 }
      )
    }

    const tvClient = new TradingViewClient(
      connection.sessionId,
      connection.sessionIdSign
    )

    const indicators = await tvClient.getIndicators()

    // Store indicators in database
    const imported = []
    for (const indicator of indicators) {
      const saved = await prisma.tradingViewIndicator.upsert({
        where: {
          connectionId_tradingViewId: {
            connectionId: connection.id,
            tradingViewId: indicator.id,
          },
        },
        update: {
          name: indicator.name,
          scriptId: indicator.scriptId,
          updatedAt: new Date(),
        },
        create: {
          connectionId: connection.id,
          tradingViewId: indicator.id,
          name: indicator.name,
          scriptId: indicator.scriptId,
          companyId: user.companyId,
        },
      })
      imported.push(saved)
    }

    return NextResponse.json({
      success: true,
      indicators: imported,
      count: imported.length,
    })
  } catch (error: any) {
    console.error('Error importing indicators:', error)
    return NextResponse.json(
      { error: 'Failed to import indicators', details: error.message },
      { status: 500 }
    )
  }
}
