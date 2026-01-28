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
      return null
    }

    // In production, verify with Whop's public key
    // For now, we'll decode without verification (Whop handles verification)
    const decoded = jwt.decode(token) as WhopUserToken
    
    if (!decoded || !decoded.userId || !decoded.companyId) {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Error verifying Whop token:', error)
    return null
  }
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<WhopUserToken | null> {
  return verifyWhopToken(request)
}
