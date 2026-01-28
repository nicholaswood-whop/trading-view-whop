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

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    position: 'relative' as const,
    zIndex: 1,
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
    textShadow: '0 2px 20px rgba(255, 255, 255, 0.3)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  input: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '2px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  },
  inputFocus: {
    borderColor: 'rgba(102, 126, 234, 0.5)',
    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  button: {
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.5)',
  },
  buttonPrimaryHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5), 0 0 0 4px rgba(102, 126, 234, 0.1)',
  },
  buttonSuccess: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
  },
  buttonDanger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
  },
  message: {
    padding: '1rem 1.5rem',
    marginBottom: '1.5rem',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    animation: 'fadeIn 0.4s ease-out',
  },
  messageSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#065f46',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  messageError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#991b1b',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
  },
  indicatorCard: {
    padding: '1.5rem',
    border: '2px solid rgba(102, 126, 234, 0.1)',
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
  },
  indicatorCardHover: {
    transform: 'translateY(-4px)',
    borderColor: 'rgba(102, 126, 234, 0.3)',
    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.15), 0 0 0 1px rgba(102, 126, 234, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
}

export default function SellerDashboard() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState('')
  const [sessionIdSign, setSessionIdSign] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
    loadIndicators()
  }, [])

  const getCompanyId = (): string | null => {
    // Try to get companyId from URL
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const match = path.match(/\/dashboard\/([^\/]+)/)
      if (match) {
        return match[1]
      }
      
      // Try from Whop context
      const whopContext = (window as any).whop
      if (whopContext?.companyId || whopContext?.company_id) {
        return whopContext.companyId || whopContext.company_id
      }
      
      // Try from URL params
      const params = new URLSearchParams(window.location.search)
      return params.get('companyId')
    }
    return null
  }

  const checkConnection = async () => {
    try {
      const companyId = getCompanyId()
      const url = companyId ? `/api/seller/indicators?companyId=${companyId}` : '/api/seller/indicators'
      const response = await fetch(url)
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
      const companyId = getCompanyId()
      const url = companyId ? `/api/seller/indicators?companyId=${companyId}` : '/api/seller/indicators'
      const response = await fetch(url)
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
      const companyId = getCompanyId()
      const response = await fetch('/api/seller/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionIdSign,
          ...(companyId ? { companyId } : {}),
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
      const companyId = getCompanyId()
      const response = await fetch('/api/seller/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(companyId ? { companyId } : {}),
        }),
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
      const companyId = getCompanyId()
      const url = companyId ? `/api/seller/indicators?companyId=${companyId}` : '/api/seller/indicators'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(companyId ? { companyId } : {}),
        }),
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
      const companyId = getCompanyId()
      const response = await fetch(`/api/seller/indicators/${indicatorId}/attach${companyId ? `?companyId=${companyId}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          experienceId,
          ...(companyId ? { companyId } : {}),
        }),
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
    return (
      <div style={{ ...styles.container, textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '1.5rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={styles.container} className="fade-in">
      <h1 style={styles.title}>TradingView Indicators</h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Manage your TradingView indicators and connect them to Whop experiences
      </p>

      {message && (
        <div
          style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError),
          }}
        >
          {message.text}
        </div>
      )}

      {!connected ? (
        <div style={styles.card} className="slide-in">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
            Connect Your TradingView Account
          </h2>
          <p style={{ marginBottom: '2rem', color: '#666', lineHeight: '1.6' }}>
            To get started, you need to provide your TradingView session cookies.
            <br />
            <strong style={{ color: '#1a1a1a' }}>How to get your cookies:</strong>
            <br />
            <span style={{ fontSize: '0.9rem' }}>
              1. Log into TradingView in your browser
              <br />
              2. Open Developer Tools (F12)
              <br />
              3. Go to Application/Storage → Cookies → tradingview.com
              <br />
              4. Copy the values for <code style={{ background: 'rgba(102, 126, 234, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>sessionid</code> and <code style={{ background: 'rgba(102, 126, 234, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>sessionid_sign</code>
            </span>
          </p>

          <form onSubmit={handleConnect}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="sessionId"
                style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: '#1a1a1a' }}
              >
                Session ID:
              </label>
              <input
                id="sessionId"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                onFocus={() => setFocusedInput('sessionId')}
                onBlur={() => setFocusedInput(null)}
                required
                style={{
                  ...styles.input,
                  ...(focusedInput === 'sessionId' ? styles.inputFocus : {}),
                }}
                placeholder="Paste your sessionid cookie value"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label
                htmlFor="sessionIdSign"
                style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: '#1a1a1a' }}
              >
                Session ID Sign:
              </label>
              <input
                id="sessionIdSign"
                type="text"
                value={sessionIdSign}
                onChange={(e) => setSessionIdSign(e.target.value)}
                onFocus={() => setFocusedInput('sessionIdSign')}
                onBlur={() => setFocusedInput(null)}
                required
                style={{
                  ...styles.input,
                  ...(focusedInput === 'sessionIdSign' ? styles.inputFocus : {}),
                }}
                placeholder="Paste your sessionid_sign cookie value"
              />
            </div>

            <button
              type="submit"
              disabled={connecting}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(!connecting ? { ':hover': styles.buttonPrimaryHover } : {}),
                opacity: connecting ? 0.7 : 1,
                cursor: connecting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!connecting) {
                  Object.assign(e.currentTarget.style, styles.buttonPrimaryHover)
                }
              }}
              onMouseLeave={(e) => {
                if (!connecting) {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = styles.buttonPrimary.boxShadow
                }
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
              ...styles.card,
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap' as const,
              gap: '1rem',
            }}
            className="slide-in"
          >
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1a1a1a' }}>
                TradingView Account Connected
              </h2>
              <p style={{ color: '#666' }}>Your indicators are synced automatically</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' as const }}>
              <button
                onClick={handleImport}
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = styles.buttonSuccess.boxShadow
                }}
              >
                🔄 Refresh Indicators
              </button>
              <button
                onClick={handleDisconnect}
                style={{
                  ...styles.button,
                  ...styles.buttonDanger,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = styles.buttonDanger.boxShadow
                }}
              >
                Disconnect
              </button>
            </div>
          </div>

          <div style={styles.card} className="slide-in">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1a1a1a' }}>
              Your Indicators ({indicators.length})
            </h2>

            {indicators.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                No indicators found. Try refreshing.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {indicators.map((indicator, index) => (
                  <div
                    key={indicator.id}
                    style={{
                      ...styles.indicatorCard,
                      animationDelay: `${index * 0.1}s`,
                    }}
                    className="fade-in"
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, styles.indicatorCardHover)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = ''
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.1)'
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a' }}>
                          {indicator.name}
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                          TradingView ID: <code style={{ background: 'rgba(102, 126, 234, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{indicator.tradingViewId}</code>
                        </p>
                        {indicator.experienceId && (
                          <p style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
                            ✓ Attached to Experience: {indicator.experienceId}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '300px' }}>
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
                            ...styles.input,
                            flex: 1,
                            padding: '0.75rem 1rem',
                            fontSize: '0.9rem',
                          }}
                        />
                      </div>
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
