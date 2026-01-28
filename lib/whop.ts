import axios from 'axios'

const WHOP_API_BASE = 'https://api.whop.com/api/v2'

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
 * Whop API client
 */
export class WhopClient {
  private apiKey: string

  constructor(apiKey?: string) {
    // Use provided API key or fall back to environment variable
    this.apiKey = apiKey || process.env.WHOP_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('WhopClient: No API key provided')
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Get membership details
   */
  async getMembership(membershipId: string): Promise<WhopMembership | null> {
    try {
      const response = await axios.get(
        `${WHOP_API_BASE}/memberships/${membershipId}`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error fetching Whop membership:', error)
      return null
    }
  }

  /**
   * Get user details
   */
  async getUser(userId: string): Promise<WhopUser | null> {
    try {
      const response = await axios.get(
        `${WHOP_API_BASE}/users/${userId}`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error fetching Whop user:', error)
      return null
    }
  }

  /**
   * Get product details
   */
  async getProduct(productId: string): Promise<WhopProduct | null> {
    try {
      const response = await axios.get(
        `${WHOP_API_BASE}/products/${productId}`,
        { headers: this.getHeaders() }
      )
      return response.data
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
}
