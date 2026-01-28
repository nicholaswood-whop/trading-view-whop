import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/buyer/access
 * Buyer enters their TradingView username to get access
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tradingViewUsername, experienceId, membershipId } = body

    if (!tradingViewUsername || !experienceId) {
      return NextResponse.json(
        { error: 'tradingViewUsername and experienceId are required' },
        { status: 400 }
      )
    }

    // Find the indicator attached to this experience
    const indicator = await prisma.tradingViewIndicator.findFirst({
      where: {
        experienceId,
        companyId: user.companyId, // Verify it's from the same company
      },
      include: {
        connection: true,
      },
    })

    if (!indicator) {
      return NextResponse.json(
        { error: 'No indicator found for this experience' },
        { status: 404 }
      )
    }

    // Check if access already exists
    let access = await prisma.userIndicatorAccess.findUnique({
      where: {
        userId_indicatorId: {
          userId: user.userId,
          indicatorId: indicator.id,
        },
      },
    })

    if (access && access.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Access already granted',
        access,
      })
    }

    // Grant access via TradingView
    const tvClient = new TradingViewClient(
      indicator.connection.sessionId,
      indicator.connection.sessionIdSign
    )

    const granted = await tvClient.grantAccess(
      indicator.tradingViewId,
      tradingViewUsername
    )

    if (!granted) {
      return NextResponse.json(
        { error: 'Failed to grant access on TradingView. Please verify your username.' },
        { status: 500 }
      )
    }

    // Create or update access record
    if (access) {
      access = await prisma.userIndicatorAccess.update({
        where: { id: access.id },
        data: {
          tradingViewUserId: tradingViewUsername,
          isActive: true,
          membershipId: membershipId || null,
          revokedAt: null,
          updatedAt: new Date(),
        },
      })
    } else {
      access = await prisma.userIndicatorAccess.create({
        data: {
          userId: user.userId,
          tradingViewUserId: tradingViewUsername,
          indicatorId: indicator.id,
          membershipId: membershipId || null,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Access granted successfully',
      access,
    })
  } catch (error: any) {
    console.error('Error granting access:', error)
    return NextResponse.json(
      { error: 'Failed to grant access', details: error.message },
      { status: 500 }
    )
  }
}
