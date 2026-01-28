import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/seller/indicators/[id]/attach
 * Attach an indicator to a Whop experience/product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { experienceId } = body

    if (!experienceId) {
      return NextResponse.json(
        { error: 'experienceId is required' },
        { status: 400 }
      )
    }

    // Verify the indicator belongs to the user's company
    const indicator = await prisma.tradingViewIndicator.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!indicator) {
      return NextResponse.json(
        { error: 'Indicator not found' },
        { status: 404 }
      )
    }

    // Update the indicator with the experience ID
    const updated = await prisma.tradingViewIndicator.update({
      where: { id: params.id },
      data: { experienceId },
    })

    return NextResponse.json({
      success: true,
      indicator: updated,
    })
  } catch (error: any) {
    console.error('Error attaching indicator:', error)
    return NextResponse.json(
      { error: 'Failed to attach indicator' },
      { status: 500 }
    )
  }
}
