import { NextResponse } from 'next/server'
import { verifyWhopConfig } from '@/lib/whop-config'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/config/verify
 * Verify that Whop configuration is set up correctly
 */
export async function GET() {
  const config = verifyWhopConfig()
  
  return NextResponse.json({
    ...config,
    // Don't expose actual keys, just show if they're set
    hasApiKey: !!process.env.WHOP_API_KEY,
    hasAppId: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
    appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || null,
  })
}
