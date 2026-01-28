import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'

/**
 * GET /api/seller/indicators
 * Get all indicators for the seller
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
