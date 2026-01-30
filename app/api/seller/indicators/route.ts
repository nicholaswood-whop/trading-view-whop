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
    
    // If user exists but doesn't have companyId, and we have companyId from URL, use it
    // This handles the case where token has userId but not companyId (normal for Whop tokens)
    if (user && !user.companyId && companyIdParam) {
      user = await getAuthenticatedUser(request, {
        allowCompanyIdOverride: true,
        companyId: companyIdParam,
      })
    }
    
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
 * POST /api/seller/indicators
 * - Import: refresh indicators from TradingView (body: { companyId }).
 *   TradingView has no public API, so this often returns 0; use "add manually" instead.
 * - Add manually: create one indicator (body: { companyId, scriptId, name }).
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const companyIdParam = url.searchParams.get('companyId')

    let user = await getAuthenticatedUser(request)

    const body = await request.json().catch(() => ({}))
    const { companyId: bodyCompanyId, scriptId: bodyScriptId, name: bodyName } = body
    const companyId = companyIdParam || bodyCompanyId
    const isManualAdd = typeof bodyScriptId === 'string' && bodyScriptId.trim() && typeof bodyName === 'string' && bodyName.trim()

    if (user && !user.companyId && companyId) {
      user = await getAuthenticatedUser(request, {
        allowCompanyIdOverride: true,
        companyId: companyId,
      })
    }
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

    // Manual add: create one indicator by script ID and name (TradingView has no list API)
    if (isManualAdd) {
      const scriptId = bodyScriptId.trim()
      const name = bodyName.trim()
      const tradingViewId = scriptId // use scriptId as unique ID for manual entries
      const saved = await prisma.tradingViewIndicator.upsert({
        where: {
          connectionId_tradingViewId: {
            connectionId: connection.id,
            tradingViewId,
          },
        },
        update: {
          name,
          scriptId: scriptId,
          updatedAt: new Date(),
        },
        create: {
          connectionId: connection.id,
          tradingViewId,
          name,
          scriptId: scriptId,
          companyId: user.companyId,
        },
      })
      return NextResponse.json({
        success: true,
        indicators: [saved],
        count: 1,
        manual: true,
      })
    }

    // Auto-import from TradingView (often returns 0; endpoints are undocumented)
    const tvClient = new TradingViewClient(
      connection.sessionId,
      connection.sessionIdSign
    )
    const indicators = await tvClient.getIndicators()

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
    console.error('Error in seller indicators POST:', error)
    return NextResponse.json(
      { error: 'Failed to import or add indicator', details: error.message },
      { status: 500 }
    )
  }
}
