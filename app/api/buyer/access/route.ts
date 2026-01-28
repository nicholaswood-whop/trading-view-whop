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

    // Log ALL headers to see what Whop is actually sending
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      allHeaders[key] = key.toLowerCase().includes('token') || key.toLowerCase().includes('auth') 
        ? `${value.substring(0, 20)}...` // Truncate tokens for security
        : value
    })
    logs.push(`📋 Request headers received: ${JSON.stringify(Object.keys(allHeaders))}`)
    
    // Check for Whop token in headers (Whop automatically adds this in iframe)
    const whopToken = request.headers.get('x-whop-user-token')
    logs.push(`🔑 Whop token present: ${!!whopToken}, length: ${whopToken?.length || 0}`)
    
    // Also check for other possible Whop auth headers
    const authHeader = request.headers.get('authorization')
    const whopAuthHeader = request.headers.get('x-whop-auth')
    logs.push(`🔑 Authorization header: ${!!authHeader}, x-whop-auth: ${!!whopAuthHeader}`)

    // For buyer access, we need to be more flexible with authentication
    // Buyers may access through Whop iframe with different auth context
    logs.push('🔐 Checking authentication...')
    const user = await getAuthenticatedUser(request)
    
    // If no user token, try to get from request body (passed from frontend)
    let userId: string | null = null
    let companyId: string | null = null
    
    if (user) {
      userId = user.userId
      // Note: Whop tokens don't include companyId, so it might be empty here
      // We'll get companyId from experience lookup below
      companyId = user.companyId || null
      logs.push(`✓ Authenticated user found: userId=${userId}, companyId=${companyId || 'will get from experience'}`)
    } else {
      logs.push('⚠️ No authenticated user from token header')
      if (whopToken) {
        logs.push(`⚠️ Token exists but failed to decode. Token length: ${whopToken.length}`)
        logs.push(`⚠️ Token preview (first 100 chars): ${whopToken.substring(0, 100)}`)
        // Check token format
        const parts = whopToken.split('.')
        if (parts.length !== 3) {
          logs.push(`⚠️ Token format issue: Expected 3 parts separated by dots, got ${parts.length} parts`)
        } else {
          logs.push(`⚠️ Token has correct format (3 parts), but decoding failed`)
          logs.push(`⚠️ This might mean the token payload structure is different than expected`)
        }
      }
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

    // Try to get companyId from the experience/product if we don't have it
    let detectedCompanyId = companyId
    if (!detectedCompanyId && experienceId) {
      try {
        logs.push(`🔍 Trying to get companyId from experience ID: ${experienceId}`)
        
        // First, try to get it as an experience (most likely)
        const experience = await whopClient.getExperience(experienceId)
        if (experience && experience.company_id) {
          detectedCompanyId = experience.company_id
          logs.push(`✓ Got companyId from experience: ${detectedCompanyId} (experience name: ${experience.name})`)
        } else {
          // If not an experience, try as a product ID
          logs.push(`⚠️ Experience ID ${experienceId} is not an experience, trying as product ID...`)
          const product = await whopClient.getProduct(experienceId)
          if (product && product.company_id) {
            detectedCompanyId = product.company_id
            logs.push(`✓ Got companyId from product: ${detectedCompanyId}`)
          } else {
            logs.push(`⚠️ Experience ID ${experienceId} is not a valid experience or product ID`)
          }
        }
      } catch (error: any) {
        logs.push(`⚠️ Could not get company from experience/product: ${error.message}`)
        // Experience ID might not be valid, that's okay
      }
    }

    // Find the indicator attached to this experience
    logs.push(`🔍 Looking for indicator with experienceId=${experienceId}, companyId=${detectedCompanyId || 'any'}`)
    const indicator = await prisma.tradingViewIndicator.findFirst({
      where: {
        experienceId,
        ...(detectedCompanyId ? { companyId: detectedCompanyId } : {}), // Only filter by company if we have it
      },
      include: {
        connection: true,
      },
    })

    if (!indicator) {
      logs.push(`✗ No indicator found for experienceId=${experienceId}`)
      
      // If user is owner/admin, they should set up the indicator first
      // Try to check if they're the owner using the detected companyId
      let isOwner = false
      
      // If we have companyId from experience lookup, try to check owner status
      if (detectedCompanyId) {
        // If we have userId from token, check directly
        if (userId) {
          try {
            logs.push(`🔍 Checking if user ${userId} is owner/admin of company ${detectedCompanyId}...`)
            isOwner = await whopClient.isUserOwnerOrAdmin(userId, detectedCompanyId)
            logs.push(`🔍 Owner check for company ${detectedCompanyId}: ${isOwner ? 'YES - User is owner/admin' : 'NO - User is not owner/admin'}`)
            
            if (isOwner) {
              logs.push(`👑 User is owner/admin - they should have automatic access to set up indicators`)
            }
          } catch (error: any) {
            logs.push(`⚠️ Could not check owner status: ${error.message}`)
            logs.push(`⚠️ Error details: ${JSON.stringify(error)}`)
          }
        } else {
          // No userId from token - this means token decode failed
          logs.push(`⚠️ No userId available for owner check, but companyId=${detectedCompanyId} was found`)
          logs.push(`💡 This usually means the JWT token wasn't decoded correctly`)
          logs.push(`💡 If you're the seller, you can access your dashboard at /dashboard/${detectedCompanyId}`)
          logs.push(`💡 The token should be automatically added by Whop in the x-whop-user-token header`)
        }
      } else {
        logs.push(`⚠️ Cannot determine companyId from experience/product`)
        logs.push(`💡 Tip: If you're the seller, access your dashboard at /dashboard/[companyId] to set up indicators`)
      }
      
      return NextResponse.json(
        { 
          error: 'No indicator found for this experience',
          isOwner,
          companyId: detectedCompanyId || null,
          message: isOwner 
            ? 'You need to connect your TradingView account and attach an indicator to this experience first. Go to your seller dashboard to set this up.'
            : detectedCompanyId
            ? `This experience does not have an indicator attached yet. If you are the seller, go to /dashboard/${detectedCompanyId} to set this up.`
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
