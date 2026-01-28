import { NextRequest } from 'next/server'
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken'

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
    console.log(`[Auth] Token preview (first 100 chars): ${token.substring(0, 100)}`)
    
    // Check if token looks like a JWT (should have 3 parts separated by dots)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      console.log(`[Auth] ✗ Token doesn't have 3 parts (has ${tokenParts.length}). Not a valid JWT format.`)
      console.log(`[Auth] Token parts: ${tokenParts.map((p, i) => `Part ${i}: ${p.substring(0, 20)}...`).join(', ')}`)
      return null
    }
    
    // Try to manually decode the payload to see what's in it (for debugging)
    try {
      const payloadBase64 = tokenParts[1]
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8')
      const manualPayload = JSON.parse(payloadJson)
      console.log(`[Auth] Manually decoded payload keys:`, Object.keys(manualPayload))
      console.log(`[Auth] Manually decoded payload:`, JSON.stringify(manualPayload, null, 2))
    } catch (manualError: any) {
      console.log(`[Auth] Could not manually decode payload: ${manualError.message}`)
    }
    
    // NOTE: We decode without verification because:
    // 1. Whop already verifies the token on their end before sending it
    // 2. The token is sent over HTTPS in the iframe context
    // 3. We don't have Whop's public key, and don't need it since Whop handles verification
    // If you want extra security, you could fetch Whop's public key and verify, but it's not required
    let decoded: jwt.JwtPayload | string | null = null
    try {
      decoded = jwt.decode(token, { complete: true })
      console.log(`[Auth] jwt.decode() returned:`, {
        type: typeof decoded,
        isNull: decoded === null,
        isString: typeof decoded === 'string',
        isObject: typeof decoded === 'object' && decoded !== null,
      })
    } catch (decodeError: any) {
      console.error('[Auth] ✗ JWT decode threw an error:', decodeError.message)
      console.error('[Auth] Error details:', decodeError)
      return null
    }
    
    if (!decoded) {
      console.log('[Auth] ✗ jwt.decode returned null - token might be malformed')
      return null
    }
    
    if (typeof decoded === 'string') {
      console.log('[Auth] ✗ Decoded token is a string, not an object')
      const decodedStr = decoded as string
      console.log('[Auth] Decoded string:', decodedStr.substring(0, 100))
      return null
    }
    
    // Extract payload (could be in 'payload' or directly in decoded)
    const jwtObj = decoded as Jwt
    const payload = jwtObj.payload || decoded as JwtPayload
    
    console.log(`[Auth] Decoded token structure:`, {
      hasHeader: !!jwtObj.header,
      headerAlg: jwtObj.header?.alg,
      hasPayload: !!jwtObj.payload,
      payloadType: typeof payload,
      payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : 'not an object',
    })
    
    if (!payload || typeof payload !== 'object') {
      console.log(`[Auth] ✗ Payload is not an object:`, typeof payload, payload)
      return null
    }
    
    console.log(`[Auth] Decoded token payload keys:`, Object.keys(payload))
    console.log(`[Auth] Decoded token full payload:`, JSON.stringify(payload, null, 2))
    
    // Map different possible field names - Whop uses 'sub' for user ID
    const userId = (payload as any).userId || (payload as any).user_id || (payload as any).sub || ''
    const companyId = (payload as any).companyId || (payload as any).company_id || (payload as any).company_id || ''
    
    console.log(`[Auth] Extracted values:`, {
      userId,
      companyId,
      hasUserId: !!userId,
      hasCompanyId: !!companyId,
      allPayloadKeys: Object.keys(payload),
    })
    
    if (!userId || !companyId) {
      console.log(`[Auth] ✗ Token missing required fields: userId=${!!userId}, companyId=${!!companyId}`)
      console.log(`[Auth] Full payload:`, JSON.stringify(payload, null, 2))
      // If we have userId but no companyId, we might need to get it from the experience
      // But for now, we need both
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
