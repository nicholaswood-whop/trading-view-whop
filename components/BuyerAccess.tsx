'use client'

import { useState } from 'react'

export default function BuyerAccess() {
  const [tradingViewUsername, setTradingViewUsername] = useState('')
  const [experienceId, setExperienceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // In a real app, experienceId and membershipId would come from Whop context
  // For now, we'll get them from URL params or let user enter
  const getExperienceId = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('experienceId') || experienceId
  }

  const getMembershipId = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('membershipId') || null
  }

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!tradingViewUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter your TradingView username' })
      setLoading(false)
      return
    }

    const expId = getExperienceId()
    if (!expId) {
      setMessage({ type: 'error', text: 'Experience ID is required' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/buyer/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradingViewUsername: tradingViewUsername.trim(),
          experienceId: expId,
          membershipId: getMembershipId(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Access granted! You should now have access to the indicator on TradingView.',
        })
        setTradingViewUsername('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to grant access' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to grant access' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginBottom: '1rem' }}>Get TradingView Indicator Access</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Enter your TradingView username to receive access to the indicator you purchased.
        </p>

        {message && (
          <div
            style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '4px',
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleGrantAccess}>
          {!getExperienceId() && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="experienceId"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
              >
                Experience ID:
              </label>
              <input
                id="experienceId"
                type="text"
                value={experienceId}
                onChange={(e) => setExperienceId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
                placeholder="Enter the experience/product ID"
              />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="tradingViewUsername"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              TradingView Username:
            </label>
            <input
              id="tradingViewUsername"
              type="text"
              value={tradingViewUsername}
              onChange={(e) => setTradingViewUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
              placeholder="Your TradingView username"
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              This is the username you use to log into TradingView
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Granting Access...' : 'Grant Access'}
          </button>
        </form>

        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#666',
          }}
        >
          <strong>Note:</strong> After granting access, it may take a few moments for the
          indicator to appear in your TradingView account. If you don't see it, try refreshing
          your TradingView page.
        </div>
      </div>
    </div>
  )
}
