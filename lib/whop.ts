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
