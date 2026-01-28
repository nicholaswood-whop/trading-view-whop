import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'

/**
 * POST /api/seller/connect
 * Connect seller's TradingView account
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, sessionIdSign } = body

    if (!sessionId || !sessionIdSign) {
      return NextResponse.json(
        { error: 'sessionId and sessionIdSign are required' },
        { status: 400 }
      )
    }

    // Verify the connection works
    const tvClient = new TradingViewClient(sessionId, sessionIdSign)
    const isValid = await tvClient.verifyConnection()

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid TradingView credentials. Please check your cookies.' },
        { status: 400 }
      )
    }

    // Create or update the connection
    const connection = await prisma.tradingViewConnection.upsert({
      where: { companyId: user.companyId },
      update: {
        sessionId,
        sessionIdSign,
        updatedAt: new Date(),
      },
      create: {
        companyId: user.companyId,
        sessionId,
        sessionIdSign,
      },
    })

    // Import indicators automatically
    try {
      const indicators = await tvClient.getIndicators()
      
      // Store indicators in database
      for (const indicator of indicators) {
        await prisma.tradingViewIndicator.upsert({
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
      }

      return NextResponse.json({
        success: true,
        connection: {
          id: connection.id,
          companyId: connection.companyId,
        },
        indicatorsImported: indicators.length,
      })
    } catch (importError) {
      // Connection is valid but import failed - still save connection
      console.error('Failed to import indicators:', importError)
      return NextResponse.json({
        success: true,
        connection: {
          id: connection.id,
          companyId: connection.companyId,
        },
        warning: 'Connection established but failed to import indicators. You can try importing them manually.',
      })
    }
  } catch (error: any) {
    console.error('Error connecting TradingView account:', error)
    return NextResponse.json(
      { error: 'Failed to connect TradingView account', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/seller/connect
 * Disconnect TradingView account
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.tradingViewConnection.delete({
      where: { companyId: user.companyId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error disconnecting TradingView account:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    )
  }
}
