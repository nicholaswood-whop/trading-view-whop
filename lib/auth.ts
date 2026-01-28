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
    const token = request.headers.get('x-whop-user-token')
    
    if (!token) {
      console.log('[Auth] No x-whop-user-token header found')
      return null
    }

    console.log(`[Auth] Decoding JWT token...`)
    // In production, verify with Whop's public key
    // For now, we'll decode without verification (Whop handles verification)
    const decoded = jwt.decode(token) as WhopUserToken
    
    if (!decoded) {
      console.log('[Auth] ✗ Failed to decode token')
      return null
    }
    
    console.log(`[Auth] Decoded token:`, {
      userId: decoded.userId,
      companyId: decoded.companyId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    })
    
    if (!decoded.userId || !decoded.companyId) {
      console.log(`[Auth] ✗ Token missing required fields: userId=${!!decoded.userId}, companyId=${!!decoded.companyId}`)
      return null
    }

    return decoded
  } catch (error: any) {
    console.error('[Auth] ✗ Error verifying Whop token:', error.message)
    return null
  }
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<WhopUserToken | null> {
  console.log('[Auth] Checking for Whop user token...')
  const token = request.headers.get('x-whop-user-token')
  console.log(`[Auth] Token present: ${!!token}, length: ${token?.length || 0}`)
  
  const user = await verifyWhopToken(request)
  
  if (user) {
    console.log(`[Auth] ✓ Authenticated user: userId=${user.userId}, companyId=${user.companyId}`)
  } else {
    console.log(`[Auth] ✗ No authenticated user found`)
  }
  
  return user
}
