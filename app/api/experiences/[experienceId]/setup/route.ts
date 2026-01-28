import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WhopClient } from '@/lib/whop'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/experiences/[experienceId]/setup
 * Check if owner/admin needs to set up indicator for this experience
 * Returns setup status and available indicators
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { experienceId: string } }
) {
  const logs: string[] = []
  logs.push(`🔍 [START] Setup check for experience ${params.experienceId}`)

  try {
    const experienceId = params.experienceId

    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user || !user.userId) {
      logs.push(`✗ No authenticated user found`)
      return NextResponse.json(
        { error: 'Not authenticated', logs },
        { status: 401 }
      )
    }
    logs.push(`✓ Authenticated user: userId=${user.userId}`)

    // Get companyId from experience
    const whopClient = new WhopClient()
    const experience = await whopClient.getExperience(experienceId)
    if (!experience || !experience.company_id) {
      logs.push(`✗ Could not get company from experience`)
      return NextResponse.json(
        { error: 'Experience not found', logs },
        { status: 404 }
      )
    }
    const companyId = experience.company_id
    logs.push(`✓ Got companyId from experience: ${companyId}`)

    // Check if user is owner/admin
    const isOwnerOrAdmin = await whopClient.isUserOwnerOrAdmin(user.userId, companyId)
    if (!isOwnerOrAdmin) {
      logs.push(`✗ User is not owner/admin`)
      return NextResponse.json(
        { error: 'Only company owners/admins can set up indicators', logs },
        { status: 403 }
      )
    }
    logs.push(`✓ User is owner/admin`)

    // Check if indicator already exists for this experience
    const existingIndicator = await prisma.tradingViewIndicator.findFirst({
      where: {
        experienceId,
        companyId,
      },
      include: {
        connection: true,
      },
    })

    if (existingIndicator) {
      logs.push(`✓ Indicator already set up: ${existingIndicator.id}`)
      return NextResponse.json({
        setupNeeded: false,
        indicator: {
          id: existingIndicator.id,
          name: existingIndicator.name,
          tradingViewId: existingIndicator.tradingViewId,
        },
        logs,
      })
    }

    // Check if TradingView is connected
    const connection = await prisma.tradingViewConnection.findFirst({
      where: { companyId },
    })

    if (!connection) {
      logs.push(`⚠️ No TradingView connection found`)
      return NextResponse.json({
        setupNeeded: true,
        step: 'connect',
        connectionExists: false,
        companyId,
        logs,
      })
    }
    logs.push(`✓ TradingView connection exists`)

    // Get available indicators
    const indicators = await prisma.tradingViewIndicator.findMany({
      where: {
        connectionId: connection.id,
        companyId,
        experienceId: null, // Not yet attached to any experience
      },
    })
    logs.push(`✓ Found ${indicators.length} available indicators`)

    return NextResponse.json({
      setupNeeded: true,
      step: indicators.length > 0 ? 'attach' : 'import',
      connectionExists: true,
      indicators,
      companyId,
      logs,
    })
  } catch (error: any) {
    logs.push(`✗ Error: ${error.message}`)
    console.error('Error checking setup status:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status', details: error.message, logs },
      { status: 500 }
    )
  }
}
