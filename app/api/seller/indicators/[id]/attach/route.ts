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
    // Try to get companyId from URL params or request body
    const url = new URL(request.url)
    const companyIdParam = url.searchParams.get('companyId')
    
    let user = await getAuthenticatedUser(request)
    
    // If we have companyId from body and no auth, allow access with companyId override
    const body = await request.json()
    const { experienceId, companyId: bodyCompanyId } = body
    const companyId = companyIdParam || bodyCompanyId
    
    if (!user && companyId) {
      user = await getAuthenticatedUser(request, {
        allowCompanyIdOverride: true,
        companyId: companyId,
      })
    }
    
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized - companyId required' }, { status: 401 })
    }

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
