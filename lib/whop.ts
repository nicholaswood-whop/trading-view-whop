import Whop from '@whop/sdk'
import { getWhopAppId } from './whop-config'

export interface WhopMembership {
  id: string
  user_id: string
  product_id: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  created_at: string
  updated_at: string
}

export interface WhopUser {
  id: string
  email: string
  username?: string
}

export interface WhopProduct {
  id: string
  name: string
  company_id: string
}

/**
 * Whop API client using the official Whop SDK
 * @see https://docs.whop.com/developer/api/getting-started#whop-sdks
 * @see https://github.com/whopio/whopsdk-typescript
 */
export class WhopClient {
  private client: Whop

  constructor(apiKey?: string, appId?: string) {
    // Use provided API key or fall back to environment variable
    const key = apiKey || process.env.WHOP_API_KEY || ''
    const appID = appId || getWhopAppId() || undefined
    
    if (!key) {
      console.warn('WhopClient: No API key provided')
    }

    // Initialize the Whop SDK client
    // appID is only required when building an app
    this.client = new Whop({
      apiKey: key,
      ...(appID && { appID }),
    })
  }

  /**
   * Get membership details using the Whop SDK
   * @see https://github.com/whopio/whopsdk-typescript
   */
  async getMembership(membershipId: string): Promise<WhopMembership | null> {
    try {
      const membership = await this.client.memberships.retrieve(membershipId)
      
      // Map SDK response to our interface
      // The SDK uses nested objects: membership.user.id and membership.product.id
      return {
        id: membership.id,
        user_id: membership.user?.id || '',
        product_id: membership.product?.id || '',
        status: membership.status as 'active' | 'cancelled' | 'expired' | 'past_due',
        created_at: membership.created_at || new Date().toISOString(),
        updated_at: membership.updated_at || new Date().toISOString(),
      }
    } catch (error: any) {
      console.error('Error fetching Whop membership:', error)
      return null
    }
  }

  /**
   * Get user details using the Whop SDK
   * Note: The SDK's UserRetrieveResponse doesn't include email for privacy reasons
   * @see https://github.com/whopio/whopsdk-typescript
   */
  async getUser(userId: string): Promise<WhopUser | null> {
    try {
      const user = await this.client.users.retrieve(userId)
      
      // Map SDK response to our interface
      // Note: email is not available in UserRetrieveResponse for privacy
      return {
        id: user.id,
        email: '', // Email is not available in the user retrieve response
        username: user.username || undefined,
      }
    } catch (error: any) {
      console.error('Error fetching Whop user:', error)
      return null
    }
  }

  /**
   * Get product details using the Whop SDK
   * @see https://github.com/whopio/whopsdk-typescript
   */
  async getProduct(productId: string): Promise<WhopProduct | null> {
    try {
      const product = await this.client.products.retrieve(productId)
      
      // Map SDK response to our interface
      // The SDK uses nested objects: product.company.id
      return {
        id: product.id,
        name: product.title || '',
        company_id: product.company?.id || '',
      }
    } catch (error: any) {
      console.error('Error fetching Whop product:', error)
      return null
    }
  }

  /**
   * Check if membership is active
   */
  isMembershipActive(membership: WhopMembership): boolean {
    return membership.status === 'active'
  }

  /**
   * Check if a user is an owner or admin of a company
   * Uses the authorizedUsers endpoint to check user roles
   * @param userId The user ID to check
   * @param companyId The company ID to check against
   * @returns true if user is owner or admin, false otherwise
   */
  async isUserOwnerOrAdmin(userId: string, companyId: string): Promise<boolean> {
    console.log(`[WhopClient] Checking if user ${userId} is owner/admin of company ${companyId}`)
    try {
      // List authorized users for the company, filtering by user_id for efficiency
      console.log(`[WhopClient] Fetching authorized users for company ${companyId}, user ${userId}`)
      const authorizedUsers = this.client.authorizedUsers.list({
        company_id: companyId,
        user_id: userId, // Filter by user_id to only get this user's authorized status
      })

      let foundUser = false
      // Check if user is in the authorized users list with owner/admin role
      for await (const authorizedUser of authorizedUsers) {
        console.log(`[WhopClient] Found authorized user: id=${authorizedUser.id}, role=${authorizedUser.role}, user.id=${authorizedUser.user?.id}`)
        foundUser = true
        // The user object contains the user ID
        if (authorizedUser.user?.id === userId) {
          // Check if role is owner or admin
          const role = authorizedUser.role
          console.log(`[WhopClient] User ${userId} has role: ${role}`)
          if (role === 'owner' || role === 'admin') {
            console.log(`[WhopClient] ✓ User ${userId} IS owner/admin`)
            return true
          } else {
            console.log(`[WhopClient] ✗ User ${userId} has role ${role}, not owner/admin`)
          }
        } else {
          console.log(`[WhopClient] User ID mismatch: expected ${userId}, got ${authorizedUser.user?.id}`)
        }
      }

      if (!foundUser) {
        console.log(`[WhopClient] ✗ User ${userId} not found in authorized users list`)
      }
      return false
    } catch (error: any) {
      console.error(`[WhopClient] ✗ Error checking user role:`, error)
      console.error(`[WhopClient] Error details:`, {
        message: error.message,
        status: error.status,
        response: error.response?.data,
      })
      // If we can't check, return false to be safe
      return false
    }
  }

  /**
   * Get company details
   */
  async getCompany(companyId: string): Promise<any> {
    try {
      const company = await this.client.companies.retrieve(companyId)
      return company
    } catch (error: any) {
      console.error('Error fetching company:', error)
      return null
    }
  }

  /**
   * Get the underlying Whop SDK client for advanced usage
   * This allows direct access to all SDK methods like:
   * - client.memberships.list()
   * - client.payments.list()
   * - client.products.list()
   * - etc.
   * @see https://github.com/whopio/whopsdk-typescript
   */
  getSDKClient(): Whop {
    return this.client
  }
}
