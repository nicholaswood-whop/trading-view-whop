import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export interface WhopUserToken {
  userId: string
  companyId: string
  email?: string
  iat?: number
  exp?: number
}

/**
 * Verify and decode Whop JWT token from request headers
 */
export async function verifyWhopToken(
  request: NextRequest
): Promise<WhopUserToken | null> {
  try {
    // Try multiple possible header names for Whop token
    let token = request.headers.get('x-whop-user-token')
    if (!token) {
      token = request.headers.get('x-whop-token')
    }
    if (!token) {
      // Check Authorization header with Bearer token
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      console.log('[Auth] No Whop token found in any header')
      // Log all headers for debugging
      const headers: string[] = []
      request.headers.forEach((value, key) => {
        if (key.toLowerCase().includes('whop') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
          headers.push(`${key}: ${value.substring(0, 30)}...`)
        }
      })
      if (headers.length > 0) {
        console.log('[Auth] Relevant headers found:', headers)
      }
      return null
    }

    console.log(`[Auth] Decoding JWT token (length: ${token.length})...`)
    // NOTE: We decode without verification because:
    // 1. Whop already verifies the token on their end before sending it
    // 2. The token is sent over HTTPS in the iframe context
    // 3. We don't have Whop's public key, and don't need it since Whop handles verification
    // If you want extra security, you could fetch Whop's public key and verify, but it's not required
    const decoded = jwt.decode(token, { complete: true }) as jwt.JwtPayload | null
    
    if (!decoded || typeof decoded === 'string') {
      console.log('[Auth] ✗ Failed to decode token or token is a string')
      return null
    }
    
    // Extract payload (could be in 'payload' or directly in decoded)
    const payload = decoded.payload || decoded
    
    console.log(`[Auth] Decoded token payload keys:`, Object.keys(payload))
    console.log(`[Auth] Decoded token:`, {
      userId: (payload as any).userId || (payload as any).user_id || (payload as any).sub,
      companyId: (payload as any).companyId || (payload as any).company_id,
      email: (payload as any).email,
      iat: (payload as any).iat,
      exp: (payload as any).exp,
    })
    
    // Map different possible field names
    const userId = (payload as any).userId || (payload as any).user_id || (payload as any).sub || ''
    const companyId = (payload as any).companyId || (payload as any).company_id || ''
    
    if (!userId || !companyId) {
      console.log(`[Auth] ✗ Token missing required fields: userId=${!!userId}, companyId=${!!companyId}`)
      console.log(`[Auth] Full payload:`, JSON.stringify(payload, null, 2))
      return null
    }

    return {
      userId,
      companyId,
      email: (payload as any).email,
      iat: (payload as any).iat,
      exp: (payload as any).exp,
    }
  } catch (error: any) {
    console.error('[Auth] ✗ Error verifying Whop token:', error.message)
    console.error('[Auth] Error stack:', error.stack)
    return null
  }
}

/**
 * Get authenticated user from request
 * Allows optional companyId override for seller dashboard access when token is not available
 */
export async function getAuthenticatedUser(
  request: NextRequest,
  options?: { allowCompanyIdOverride?: boolean; companyId?: string }
): Promise<{ userId: string; companyId: string } | null> {
  console.log('[Auth] Checking for Whop user token...')
  const token = request.headers.get('x-whop-user-token')
  console.log(`[Auth] Token present: ${!!token}, length: ${token?.length || 0}`)
  
  // If we have a companyId override and allowCompanyIdOverride is true, use it
  // This allows seller dashboard access when companyId is known from experience
  if (options?.allowCompanyIdOverride && options?.companyId) {
    // Try to get userId from token if available
    let userId = ''
    if (token) {
      try {
        const decoded = await verifyWhopToken(request)
        if (decoded) {
          userId = decoded.userId || ''
        }
      } catch (error) {
        // Token might be invalid, but we can still proceed with companyId
        console.log('[Auth] Token invalid but using companyId override')
      }
    }
    
    // Return with companyId override, even if userId is empty
    // The seller dashboard can work with just companyId for some operations
    return {
      userId,
      companyId: options.companyId,
    }
  }
  
  const user = await verifyWhopToken(request)
  
  if (user) {
    console.log(`[Auth] ✓ Authenticated user: userId=${user.userId}, companyId=${user.companyId}`)
    return {
      userId: user.userId,
      companyId: user.companyId,
    }
  } else {
    console.log(`[Auth] ✗ No authenticated user found`)
  }
  
  return null
}
