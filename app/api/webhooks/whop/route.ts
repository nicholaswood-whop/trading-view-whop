import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'
import { WhopClient } from '@/lib/whop'

/**
 * POST /api/webhooks/whop
 * Handle Whop webhook events (membership created, updated, cancelled)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const eventType = body.type || body.event_type

    // Log the webhook event
    await prisma.webhookEvent.create({
      data: {
        eventType,
        payload: body,
        processed: false,
      },
    })

    // Handle membership events
    if (eventType === 'membership.created' || eventType === 'membership.updated') {
      await handleMembershipEvent(body, 'grant')
    } else if (
      eventType === 'membership.cancelled' ||
      eventType === 'membership.expired' ||
      eventType === 'membership.past_due'
    ) {
      await handleMembershipEvent(body, 'revoke')
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
      where: {
        eventType,
        processed: false,
      },
      data: {
        processed: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    
    // Mark as processed with error
    try {
      await prisma.webhookEvent.updateMany({
        where: {
          processed: false,
        },
        data: {
          processed: true,
          error: error.message,
        },
      })
    } catch (updateError) {
      console.error('Error updating webhook event:', updateError)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleMembershipEvent(
  payload: any,
  action: 'grant' | 'revoke'
) {
  const membershipId = payload.data?.id || payload.membership_id
  const userId = payload.data?.user_id || payload.user_id
  const productId = payload.data?.product_id || payload.product_id
  const status = payload.data?.status || payload.status

  if (!membershipId || !userId) {
    console.error('Missing membership or user ID in webhook payload')
    return
  }

  // Get all active access records for this user
  const accesses = await prisma.userIndicatorAccess.findMany({
    where: {
      userId,
      isActive: action === 'grant',
      membershipId: action === 'grant' ? undefined : membershipId,
    },
    include: {
      indicator: {
        include: {
          connection: true,
        },
      },
    },
  })

  const whopClient = new WhopClient()

  for (const access of accesses) {
    try {
      const tvClient = new TradingViewClient(
        access.indicator.connection.sessionId,
        access.indicator.connection.sessionIdSign
      )

      if (action === 'grant') {
        // Verify membership is still active
        if (productId) {
          const membership = await whopClient.getMembership(membershipId)
          if (!membership || !whopClient.isMembershipActive(membership)) {
            continue
          }
        }

        // Grant access
        const granted = await tvClient.grantAccess(
          access.indicator.tradingViewId,
          access.tradingViewUserId
        )

        if (granted) {
          await prisma.userIndicatorAccess.update({
            where: { id: access.id },
            data: {
              isActive: true,
              membershipId,
              revokedAt: null,
              updatedAt: new Date(),
            },
          })
        }
      } else {
        // Revoke access
        const revoked = await tvClient.revokeAccess(
          access.indicator.tradingViewId,
          access.tradingViewUserId
        )

        if (revoked) {
          await prisma.userIndicatorAccess.update({
            where: { id: access.id },
            data: {
              isActive: false,
              revokedAt: new Date(),
              updatedAt: new Date(),
            },
          })
        }
      }
    } catch (error: any) {
      console.error(
        `Error ${action}ing access for user ${userId}, indicator ${access.indicatorId}:`,
        error
      )
      // Continue processing other accesses
    }
  }
}
