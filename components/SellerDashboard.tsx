'use client'

import { useState, useEffect } from 'react'

interface TradingViewConnection {
  id: string
  companyId: string
}

interface Indicator {
  id: string
  name: string
  tradingViewId: string
  experienceId: string | null
}

export default function SellerDashboard() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState('')
  const [sessionIdSign, setSessionIdSign] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    checkConnection()
    loadIndicators()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/seller/indicators')
      if (response.ok) {
        setConnected(true)
      } else if (response.status === 404) {
        setConnected(false)
      }
    } catch (error) {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const loadIndicators = async () => {
    try {
      const response = await fetch('/api/seller/indicators')
      if (response.ok) {
        const data = await response.json()
        setIndicators(data.indicators || [])
      }
    } catch (error) {
      console.error('Error loading indicators:', error)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/seller/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionIdSign,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setConnected(true)
        setMessage({
          type: 'success',
          text: `Successfully connected! ${data.indicatorsImported || 0} indicators imported.`,
        })
        setSessionId('')
        setSessionIdSign('')
        await loadIndicators()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Connection failed' })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your TradingView account?')) {
      return
    }

    try {
      const response = await fetch('/api/seller/connect', {
        method: 'DELETE',
      })

      if (response.ok) {
        setConnected(false)
        setIndicators([])
        setMessage({ type: 'success', text: 'Disconnected successfully' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect' })
    }
  }

  const handleImport = async () => {
    try {
      const response = await fetch('/api/seller/indicators', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setIndicators(data.indicators || [])
        setMessage({
          type: 'success',
          text: `Imported ${data.count || 0} indicators`,
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Import failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Import failed' })
    }
  }

  const handleAttach = async (indicatorId: string, experienceId: string) => {
    if (!experienceId.trim()) {
      setMessage({ type: 'error', text: 'Please enter an experience ID' })
      return
    }

    try {
      const response = await fetch(`/api/seller/indicators/${indicatorId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Indicator attached successfully' })
        await loadIndicators()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to attach' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to attach indicator' })
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>TradingView Indicators - Seller Dashboard</h1>

      {message && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.text}
        </div>
      )}

      {!connected ? (
        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Connect Your TradingView Account</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            To get started, you need to provide your TradingView session cookies.
            <br />
            <strong>How to get your cookies:</strong>
            <br />
            1. Log into TradingView in your browser
            <br />
            2. Open Developer Tools (F12)
            <br />
            3. Go to Application/Storage → Cookies → tradingview.com
            <br />
            4. Copy the values for <code>sessionid</code> and <code>sessionid_sign</code>
          </p>

          <form onSubmit={handleConnect}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="sessionId"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
              >
                Session ID:
              </label>
              <input
                id="sessionId"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
                placeholder="Paste your sessionid cookie value"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="sessionIdSign"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
              >
                Session ID Sign:
              </label>
              <input
                id="sessionIdSign"
                type="text"
                value={sessionIdSign}
                onChange={(e) => setSessionIdSign(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
                placeholder="Paste your sessionid_sign cookie value"
              />
            </div>

            <button
              type="submit"
              disabled={connecting}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: connecting ? 'not-allowed' : 'pointer',
                opacity: connecting ? 0.6 : 1,
              }}
            >
              {connecting ? 'Connecting...' : 'Connect Account'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>TradingView Account Connected</h2>
              <p style={{ color: '#666' }}>Your indicators are synced automatically</p>
            </div>
            <div>
              <button
                onClick={handleImport}
                style={{
                  padding: '0.5rem 1rem',
                  marginRight: '1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                Refresh Indicators
              </button>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                Disconnect
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Your Indicators ({indicators.length})</h2>

            {indicators.length === 0 ? (
              <p style={{ color: '#666' }}>No indicators found. Try refreshing.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {indicators.map((indicator) => (
                  <div
                    key={indicator.id}
                    style={{
                      padding: '1.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '0.5rem' }}>{indicator.name}</h3>
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        TradingView ID: {indicator.tradingViewId}
                      </p>
                      {indicator.experienceId && (
                        <p style={{ color: '#28a745', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          ✓ Attached to Experience: {indicator.experienceId}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Experience ID"
                        defaultValue={indicator.experienceId || ''}
                        onBlur={(e) => {
                          if (e.target.value !== indicator.experienceId) {
                            handleAttach(indicator.id, e.target.value)
                          }
                        }}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          width: '200px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
