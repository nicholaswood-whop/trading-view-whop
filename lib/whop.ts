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
   * Get experience details using the Whop SDK
   * Experiences have a company property with the company ID
   * @see https://github.com/whopio/whopsdk-typescript
   */
  async getExperience(experienceId: string): Promise<{ id: string; company_id: string; name: string } | null> {
    try {
      const experience = await this.client.experiences.retrieve(experienceId)
      
      // Experience has company.id in the company object
      return {
        id: experience.id,
        company_id: experience.company?.id || '',
        name: experience.name || '',
      }
    } catch (error: any) {
      console.error('Error fetching Whop experience:', error)
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
   * Tries multiple methods to check user roles:
   * 1. Check company.owner_user.id (most reliable, requires company:basic:read)
   * 2. Check authorizedUsers endpoint (requires company:authorized_user:read permission)
   * @param userId The user ID to check
   * @param companyId The company ID to check against
   * @returns true if user is owner or admin, false otherwise
   */
  async isUserOwnerOrAdmin(userId: string, companyId: string): Promise<boolean> {
    console.log(`[WhopClient] Checking if user ${userId} is owner/admin of company ${companyId}`)
    
    // Method 1: Check company.owner_user.id (most reliable, requires company:basic:read)
    try {
      console.log(`[WhopClient] Method 1: Fetching company info for ${companyId}`)
      const company = await this.client.companies.retrieve(companyId)
      console.log(`[WhopClient] Company retrieved:`, {
        id: company.id,
        title: company.title,
        hasOwnerUser: !!(company as any).owner_user,
      })
      
      // Check if user is the company owner via owner_user.id
      const ownerUser = (company as any).owner_user
      if (ownerUser && ownerUser.id === userId) {
        console.log(`[WhopClient] ✓ User ${userId} IS the company owner (from company.owner_user.id)`)
        return true
      } else if (ownerUser) {
        console.log(`[WhopClient] Company owner is ${ownerUser.id}, not ${userId}`)
      } else {
        console.log(`[WhopClient] Company object doesn't have owner_user field`)
      }
    } catch (companyError: any) {
      console.log(`[WhopClient] Could not get company info: ${companyError.message}`)
      if (companyError.status === 403) {
        console.log(`[WhopClient] ⚠️ Missing company:basic:read permission`)
      }
    }
    
    // Method 2: Try authorizedUsers endpoint (requires company:authorized_user:read permission)
    try {
      console.log(`[WhopClient] Method 2: Fetching authorized users for company ${companyId}, user ${userId}`)
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
    } catch (authError: any) {
      console.error(`[WhopClient] ✗ Error checking authorized users:`, {
        message: authError.message,
        status: authError.status,
      })
      // 403 means we don't have permission - this is expected if API key lacks company:authorized_user:read
      if (authError.status === 403) {
        console.log(`[WhopClient] ⚠️ Missing company:authorized_user:read permission`)
        console.log(`[WhopClient] ⚠️ This is OK - we'll rely on company.owner_user check instead`)
      }
    }
    
    // If we couldn't verify via either method, return false
    console.log(`[WhopClient] ✗ Could not verify that user ${userId} is owner/admin of company ${companyId}`)
    console.log(`[WhopClient] ⚠️ This might mean:`)
    console.log(`[WhopClient]   1. API key doesn't have company:basic:read or company:authorized_user:read permissions`)
    console.log(`[WhopClient]   2. User is not actually owner/admin`)
    console.log(`[WhopClient]   3. Company structure doesn't include owner_user field`)
    
    return false
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
