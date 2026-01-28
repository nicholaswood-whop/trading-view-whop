/**
 * Whop configuration utilities
 */

export const WHOP_CONFIG = {
  API_KEY: process.env.WHOP_API_KEY || '',
  APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID || '',
  API_BASE: 'https://api.whop.com/api/v2',
}

/**
 * Verify that Whop configuration is set up
 */
export function verifyWhopConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  
  if (!WHOP_CONFIG.API_KEY) {
    missing.push('WHOP_API_KEY')
  }
  
  if (!WHOP_CONFIG.APP_ID) {
    missing.push('NEXT_PUBLIC_WHOP_APP_ID')
  }
  
  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Get Whop App ID for client-side use
 */
export function getWhopAppId(): string {
  return WHOP_CONFIG.APP_ID
}
