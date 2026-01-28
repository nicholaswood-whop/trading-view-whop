import axios, { AxiosInstance } from 'axios'

export interface TradingViewIndicator {
  id: string
  name: string
  scriptId?: string
}

export interface TradingViewUser {
  username: string
  id?: string
}

/**
 * TradingView API client using cookie-based authentication
 * Note: TradingView doesn't have a public API, so we use cookies
 */
export class TradingViewClient {
  private client: AxiosInstance
  private sessionId: string
  private sessionIdSign: string

  constructor(sessionId: string, sessionIdSign: string) {
    this.sessionId = sessionId
    this.sessionIdSign = sessionIdSign

    this.client = axios.create({
      baseURL: 'https://www.tradingview.com',
      headers: {
        'Cookie': `sessionid=${sessionId}; sessionid_sign=${sessionIdSign}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.tradingview.com',
      },
      withCredentials: true,
    })
  }

  /**
   * Get all indicators/pine scripts for the authenticated user
   * 
   * NOTE: TradingView doesn't have a public API. These endpoints are placeholders
   * and may need to be reverse-engineered or replaced with browser automation.
   */
  async getIndicators(): Promise<TradingViewIndicator[]> {
    const endpoints = [
      '/pine_facade/list/',
      '/u/scripts/',
      '/api/v1/user/scripts/',
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.client.get(endpoint, {
          params: {
            order: 'created',
            limit: 100,
          },
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        })

        if (response.status === 200 && response.data) {
          // Try different response structures
          const results = response.data.results || response.data.data || response.data.scripts || response.data
          
          if (Array.isArray(results) && results.length > 0) {
            return results.map((script: any) => ({
              id: script.id?.toString() || script.script_id?.toString() || script.pine_id?.toString(),
              name: script.name || script.script_name || script.title || 'Unnamed Indicator',
              scriptId: script.script_id?.toString() || script.id?.toString() || script.pine_id?.toString(),
            }))
          }
        }
      } catch (error: any) {
        // Continue to next endpoint
        console.log(`Endpoint ${endpoint} failed, trying next...`)
        continue
      }
    }

    // If all endpoints fail, return empty array with warning
    console.warn('Could not fetch indicators from TradingView. Endpoints may need to be updated.')
    return []
  }

  /**
   * Grant access to an indicator for a TradingView user
   */
  async grantAccess(indicatorId: string, tradingViewUsername: string): Promise<boolean> {
    const errors: string[] = []
    
    try {
      // TradingView's endpoint for sharing/granting access
      // This uses their internal sharing mechanism
      const response = await this.client.post(
        `/pine_facade/script/${indicatorId}/share/`,
        {
          username: tradingViewUsername,
          access_type: 'view', // or 'edit' if needed
        },
        {
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        }
      )

      if (response.status === 200 || response.status === 201) {
        return true
      }

      // Log the response for debugging
      errors.push(`Share endpoint returned status ${response.status}: ${JSON.stringify(response.data || response.statusText)}`)
    } catch (error: any) {
      const errorMsg = error.response?.data 
        ? JSON.stringify(error.response.data)
        : error.message || 'Unknown error'
      errors.push(`Share endpoint error: ${errorMsg}`)
      console.error('Error granting TradingView access (share method):', error.response?.data || error.message)
    }
    
    // Alternative method: Use TradingView's invite system
    try {
      const inviteResponse = await this.client.post(
        `/pine_facade/script/${indicatorId}/invite/`,
        {
          username: tradingViewUsername,
        },
        {
          validateStatus: (status) => status < 500,
        }
      )

      if (inviteResponse.status === 200 || inviteResponse.status === 201) {
        return true
      }

      errors.push(`Invite endpoint returned status ${inviteResponse.status}: ${JSON.stringify(inviteResponse.data || inviteResponse.statusText)}`)
    } catch (inviteError: any) {
      const errorMsg = inviteError.response?.data 
        ? JSON.stringify(inviteError.response.data)
        : inviteError.message || 'Unknown error'
      errors.push(`Invite endpoint error: ${errorMsg}`)
      console.error('Invite method also failed:', inviteError.response?.data || inviteError.message)
    }

    // Log all errors for debugging
    console.error('All TradingView access methods failed:', errors)
    return false
  }

  /**
   * Revoke access to an indicator for a TradingView user
   */
  async revokeAccess(indicatorId: string, tradingViewUsername: string): Promise<boolean> {
    try {
      const response = await this.client.delete(
        `/pine_facade/script/${indicatorId}/share/`,
        {
          data: {
            username: tradingViewUsername,
          },
        }
      )

      return response.status === 200 || response.status === 204
    } catch (error: any) {
      console.error('Error revoking TradingView access:', error)
      
      // Alternative method
      try {
        const removeResponse = await this.client.post(
          `/pine_facade/script/${indicatorId}/remove_access/`,
          {
            username: tradingViewUsername,
          }
        )
        return removeResponse.status === 200 || removeResponse.status === 204
      } catch (removeError) {
        console.error('Remove access method also failed:', removeError)
        return false
      }
    }
  }

  /**
   * Verify that the session cookies are still valid
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/u/', {
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      })

      return response.status === 200
    } catch (error) {
      console.error('Error verifying TradingView connection:', error)
      return false
    }
  }
}
