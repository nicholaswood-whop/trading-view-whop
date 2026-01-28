import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'
import { WhopClient } from '@/lib/whop'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/buyer/access
 * Buyer enters their TradingView username to get access
 */
export async function POST(request: NextRequest) {
  try {
    // For buyer access, we need to be more flexible with authentication
    // Buyers may access through Whop iframe with different auth context
    const user = await getAuthenticatedUser(request)
    
    // If no user token, try to get from request body (passed from frontend)
    let userId: string | null = null
    let companyId: string | null = null
    
    if (user) {
      userId = user.userId
      companyId = user.companyId
    }

    const body = await request.json()
    const { tradingViewUsername, experienceId, membershipId, userId: bodyUserId } = body

    // Use userId from token, body, or membership lookup
    if (!userId && bodyUserId) {
      userId = bodyUserId
    }

    if (!tradingViewUsername || !experienceId) {
      return NextResponse.json(
        { error: 'tradingViewUsername and experienceId are required' },
        { status: 400 }
      )
    }

    // Find the indicator attached to this experience
    // If we have companyId from auth, use it; otherwise find by experienceId only
    const indicator = await prisma.tradingViewIndicator.findFirst({
      where: {
        experienceId,
        ...(companyId ? { companyId } : {}), // Only filter by company if we have it
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

    // If we don't have userId yet, we need to get it from membership
    if (!userId && membershipId) {
      try {
        const whopClient = new WhopClient()
        const membership = await whopClient.getMembership(membershipId)
        if (membership) {
          userId = membership.user_id
        }
      } catch (error) {
        console.error('Error fetching membership for userId:', error)
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to determine user. Please ensure you are logged in.' },
        { status: 401 }
      )
    }

    // Check if access already exists
    let access = await prisma.userIndicatorAccess.findUnique({
      where: {
        userId_indicatorId: {
          userId,
          indicatorId: indicator.id,
        },
      },
    })

    if (access && access.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Access already granted. Your access is automatically managed based on membership status.',
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
          userId,
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
