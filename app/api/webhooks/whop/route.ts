import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TradingViewClient } from '@/lib/tradingview'
import { WhopClient } from '@/lib/whop'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  const companyId = payload.data?.company_id || payload.company_id

  if (!membershipId || !userId) {
    console.error('Missing membership or user ID in webhook payload')
    return
  }

  const whopClient = new WhopClient()

  // For grant action: Find all indicators attached to products in this membership
  // For revoke action: Find all active accesses for this membership
  if (action === 'grant') {
    // Verify membership is active
    const membership = await whopClient.getMembership(membershipId)
    if (!membership || !whopClient.isMembershipActive(membership)) {
      console.log(`Membership ${membershipId} is not active, skipping grant`)
      return
    }

    // Get the product to find attached indicators
    if (productId) {
      const product = await whopClient.getProduct(productId)
      if (!product) {
        console.error(`Product ${productId} not found`)
        return
      }

      // Find all indicators attached to experiences/products for this company
      const indicators = await prisma.tradingViewIndicator.findMany({
        where: {
          companyId: product.company_id,
          experienceId: productId, // Match product ID with experience ID
        },
        include: {
          connection: true,
        },
      })

      // For each indicator, check if user already has access
      for (const indicator of indicators) {
        try {
          // Check if access already exists
          let access = await prisma.userIndicatorAccess.findUnique({
            where: {
              userId_indicatorId: {
                userId,
                indicatorId: indicator.id,
              },
            },
          })

          // If access exists but is inactive, reactivate it
          // If access doesn't exist, we need the TradingView username
          // This should be collected when the user first accesses the experience
          if (!access) {
            console.log(`No access record found for user ${userId} and indicator ${indicator.id}. User needs to enter TradingView username first.`)
            continue
          }

          // Grant access via TradingView
          const tvClient = new TradingViewClient(
            indicator.connection.sessionId,
            indicator.connection.sessionIdSign
          )

          const granted = await tvClient.grantAccess(
            indicator.tradingViewId,
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
            console.log(`Access granted for user ${userId} to indicator ${indicator.id}`)
          }
        } catch (error: any) {
          console.error(
            `Error granting access for user ${userId}, indicator ${indicator.id}:`,
            error
          )
        }
      }
    }
  } else {
    // Revoke action: Find all active accesses for this membership
    const accesses = await prisma.userIndicatorAccess.findMany({
      where: {
        userId,
        membershipId,
        isActive: true,
      },
      include: {
        indicator: {
          include: {
            connection: true,
          },
        },
      },
    })

    for (const access of accesses) {
      try {
        const tvClient = new TradingViewClient(
          access.indicator.connection.sessionId,
          access.indicator.connection.sessionIdSign
        )

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
          console.log(`Access revoked for user ${userId} from indicator ${access.indicator.id}`)
        }
      } catch (error: any) {
        console.error(
          `Error revoking access for user ${userId}, indicator ${access.indicatorId}:`,
          error
        )
      }
    }
  }
}
