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
  const logs: string[] = []
  logs.push(`🔍 [START] Buyer access request received`)
  logs.push(`📅 Timestamp: ${new Date().toISOString()}`)

  try {
    // Check for DATABASE_URL before proceeding
    if (!process.env.DATABASE_URL) {
      logs.push('✗ DATABASE_URL environment variable is missing')
      return NextResponse.json(
        { 
          error: 'Database not configured. Please set DATABASE_URL environment variable.',
          details: 'The app requires a database connection to function. Please configure your Supabase database connection string in the .env file.',
          logs,
        },
        { status: 500 }
      )
    }
    logs.push('✓ DATABASE_URL is configured')

    // For buyer access, we need to be more flexible with authentication
    // Buyers may access through Whop iframe with different auth context
    logs.push('🔐 Checking authentication...')
    const user = await getAuthenticatedUser(request)
    
    // If no user token, try to get from request body (passed from frontend)
    let userId: string | null = null
    let companyId: string | null = null
    
    if (user) {
      userId = user.userId
      companyId = user.companyId
      logs.push(`✓ Authenticated user found: userId=${userId}, companyId=${companyId}`)
    } else {
      logs.push('⚠️ No authenticated user from token header')
    }

    const body = await request.json()
    const { tradingViewUsername, experienceId, membershipId, userId: bodyUserId } = body
    logs.push(`📦 Request body: experienceId=${experienceId}, membershipId=${membershipId || 'none'}, bodyUserId=${bodyUserId || 'none'}, tradingViewUsername=${tradingViewUsername || 'none'}`)

    // Use userId from token, body, or membership lookup
    if (!userId && bodyUserId) {
      userId = bodyUserId
      logs.push(`✓ Using userId from request body: ${userId}`)
    }

    if (!tradingViewUsername || !experienceId) {
      logs.push(`✗ Missing required fields: tradingViewUsername=${!!tradingViewUsername}, experienceId=${!!experienceId}`)
      return NextResponse.json(
        { error: 'tradingViewUsername and experienceId are required', logs },
        { status: 400 }
      )
    }

    // Initialize Whop client early so we can use it for owner checks
    const whopClient = new WhopClient()

    // Find the indicator attached to this experience
    logs.push(`🔍 Looking for indicator with experienceId=${experienceId}, companyId=${companyId || 'any'}`)
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
      logs.push(`✗ No indicator found for experienceId=${experienceId}`)
      
      // If user is owner/admin, they should set up the indicator first
      // Try to get companyId to check if they're the owner
      let isOwner = false
      let detectedCompanyId = companyId
      
      // Try to get companyId from product if we have experienceId
      if (!detectedCompanyId && experienceId) {
        try {
          // Experience ID might be a product ID - try to get product info
          logs.push(`🔍 Trying to get companyId from experience/product...`)
          // Note: We'd need product API access, but for now we'll suggest dashboard access
        } catch (error: any) {
          logs.push(`⚠️ Could not get company from experience: ${error.message}`)
        }
      }
      
      if (detectedCompanyId && userId) {
        try {
          isOwner = await whopClient.isUserOwnerOrAdmin(userId, detectedCompanyId)
          logs.push(`🔍 Owner check for company ${detectedCompanyId}: ${isOwner ? 'YES' : 'NO'}`)
        } catch (error: any) {
          logs.push(`⚠️ Could not check owner status: ${error.message}`)
        }
      } else {
        logs.push(`⚠️ Cannot check owner status: companyId=${detectedCompanyId || 'none'}, userId=${userId || 'none'}`)
        logs.push(`💡 Tip: If you're the seller, access your dashboard at /dashboard/[companyId] to set up indicators`)
      }
      
      return NextResponse.json(
        { 
          error: 'No indicator found for this experience',
          isOwner,
          companyId: detectedCompanyId || null,
          message: isOwner 
            ? 'You need to connect your TradingView account and attach an indicator to this experience first. Go to your seller dashboard to set this up.'
            : 'This experience does not have an indicator attached yet. If you are the seller, go to your dashboard to set this up.',
          logs,
        },
        { status: 404 }
      )
    }
    logs.push(`✓ Found indicator: id=${indicator.id}, name=${indicator.name}, companyId=${indicator.companyId}, tradingViewId=${indicator.tradingViewId}`)

    // If we don't have userId yet, we need to get it from membership
    if (!userId && membershipId) {
      logs.push(`🔍 Looking up userId from membershipId=${membershipId}`)
      try {
        const membership = await whopClient.getMembership(membershipId)
        if (membership) {
          userId = membership.user_id
          logs.push(`✓ Got userId from membership: ${userId}`)
        } else {
          logs.push(`⚠️ Membership not found for membershipId=${membershipId}`)
        }
      } catch (error: any) {
        logs.push(`✗ Error fetching membership: ${error.message}`)
        console.error('Error fetching membership for userId:', error)
      }
    }

    if (!userId) {
      logs.push(`✗ Unable to determine userId`)
      return NextResponse.json(
        { error: 'Unable to determine user. Please ensure you are logged in.', logs },
        { status: 401 }
      )
    }
    logs.push(`✓ Final userId: ${userId}`)

    // Check if user is company owner or admin - they get automatic access
    logs.push(`🔍 Checking if user ${userId} is owner/admin of company ${indicator.companyId}`)
    let isOwnerOrAdmin = false
    if (indicator.companyId) {
      try {
        isOwnerOrAdmin = await whopClient.isUserOwnerOrAdmin(userId, indicator.companyId)
        logs.push(`✓ Owner/admin check result: ${isOwnerOrAdmin ? 'YES - User is owner/admin' : 'NO - User is not owner/admin'}`)
        
        if (isOwnerOrAdmin) {
          logs.push(`👑 Processing owner/admin access grant...`)
          // Owner/admin gets automatic access - check if already exists
          let ownerAccess = await prisma.userIndicatorAccess.findUnique({
            where: {
              userId_indicatorId: {
                userId,
                indicatorId: indicator.id,
              },
            },
          })

          if (!ownerAccess) {
            // Create access record for owner/admin
            ownerAccess = await prisma.userIndicatorAccess.create({
              data: {
                userId,
                tradingViewUserId: tradingViewUsername.trim(),
                indicatorId: indicator.id,
                membershipId: null, // Owners don't need membership
                isActive: true,
              },
            })
          } else if (!ownerAccess.isActive) {
            // Reactivate if it was revoked
            ownerAccess = await prisma.userIndicatorAccess.update({
              where: { id: ownerAccess.id },
              data: {
                isActive: true,
                tradingViewUserId: tradingViewUsername.trim(),
                updatedAt: new Date(),
              },
            })
          }

          // Grant access on TradingView
          const tvClient = new TradingViewClient(
            indicator.connection.sessionId,
            indicator.connection.sessionIdSign
          )

          const granted = await tvClient.grantAccess(
            indicator.tradingViewId,
            tradingViewUsername.trim()
          )

          if (granted) {
            return NextResponse.json({
              success: true,
              message: 'Access granted! As a company owner/admin, you have automatic access to all indicators.',
              access: ownerAccess,
              isOwnerOrAdmin: true,
              logs: [
                `✓ User ID: ${userId}`,
                `✓ Company ID: ${indicator.companyId}`,
                `✓ Role: Owner/Admin`,
                `✓ Indicator ID: ${indicator.id}`,
                `✓ TradingView Indicator ID: ${indicator.tradingViewId}`,
                `✓ TradingView Username: ${tradingViewUsername.trim()}`,
                `✓ Access granted on TradingView`,
              ],
            })
          } else {
            return NextResponse.json(
              { 
                error: 'Failed to grant access on TradingView. Please verify your username.',
                logs: [
                  `✓ User ID: ${userId}`,
                  `✓ Company ID: ${indicator.companyId}`,
                  `✓ Role: Owner/Admin`,
                  `✓ Indicator ID: ${indicator.id}`,
                  `✓ TradingView Indicator ID: ${indicator.tradingViewId}`,
                  `✓ TradingView Username: ${tradingViewUsername.trim()}`,
                  `✗ Failed to grant access on TradingView - check TradingView connection or username`,
                ],
              },
              { status: 500 }
            )
          }
        }
      } catch (error: any) {
        logs.push(`✗ Error checking user role: ${error.message || 'Unknown error'}`)
        console.error('Error checking user role:', error)
        // Continue with normal flow if role check fails
      }
    } else {
      logs.push(`⚠️ No companyId on indicator, skipping owner/admin check`)
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
      logs.push(`✓ Access already exists and is active`)
      return NextResponse.json({
        success: true,
        message: 'Access already granted. Your access is automatically managed based on membership status.',
        access,
        logs,
      })
    }

    // Grant access via TradingView
    logs.push(`🔧 Granting access via TradingView...`)
    const tvClient = new TradingViewClient(
      indicator.connection.sessionId,
      indicator.connection.sessionIdSign
    )

    logs.push(`User ID: ${userId}`)
    logs.push(`Company ID: ${indicator.companyId || 'N/A'}`)
    logs.push(`Indicator ID: ${indicator.id}`)
    logs.push(`TradingView Indicator ID: ${indicator.tradingViewId}`)
    logs.push(`TradingView Username: ${tradingViewUsername}`)
    logs.push(`Membership ID: ${membershipId || 'N/A'}`)

    // Check TradingView connection first
    const connectionValid = await tvClient.verifyConnection()
    if (!connectionValid) {
      logs.push('✗ TradingView connection invalid - session cookies may have expired')
      return NextResponse.json(
        { 
          error: 'TradingView connection invalid. The seller needs to reconnect their TradingView account.',
          logs,
        },
        { status: 500 }
      )
    }
    logs.push('✓ TradingView connection verified')

    const granted = await tvClient.grantAccess(
      indicator.tradingViewId,
      tradingViewUsername
    )

    if (!granted) {
      logs.push('✗ Failed to grant access on TradingView - check username or indicator permissions')
      return NextResponse.json(
        { 
          error: 'Failed to grant access on TradingView. Please verify your username is correct and the indicator exists.',
          logs,
        },
        { status: 500 }
      )
    }
    logs.push('✓ Access granted on TradingView')

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

    logs.push('✓ Access record created/updated in database')
    
    return NextResponse.json({
      success: true,
      message: 'Access granted successfully',
      access,
      logs,
    })
  } catch (error: any) {
    console.error('Error granting access:', error)
    const errorLogs = [
      `✗ Error: ${error.message || 'Unknown error'}`,
      `Error type: ${error.constructor?.name || 'Unknown'}`,
      error.stack ? `Stack: ${error.stack.split('\n').slice(0, 3).join(' ')}` : '',
    ]
    return NextResponse.json(
      { 
        error: 'Failed to grant access', 
        details: error.message,
        logs: errorLogs,
      },
      { status: 500 }
    )
  }
}
