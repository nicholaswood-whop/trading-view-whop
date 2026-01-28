'use client'

import { useState, useEffect } from 'react'

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    position: 'relative' as const,
    zIndex: 1,
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
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '1rem',
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
    width: '100%',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.5)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5), 0 0 0 4px rgba(102, 126, 234, 0.1)',
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
  infoBox: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(102, 126, 234, 0.1)',
    fontSize: '0.9rem',
    color: '#4b5563',
    lineHeight: '1.6',
  },
}

interface BuyerAccessProps {
  experienceId?: string
  membershipId?: string | null
}

export default function BuyerAccess({ experienceId: propExperienceId, membershipId: propMembershipId }: BuyerAccessProps = {} as BuyerAccessProps) {
  const [tradingViewUsername, setTradingViewUsername] = useState('')
  const [experienceId, setExperienceId] = useState(propExperienceId || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [accessGranted, setAccessGranted] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    // If experienceId is provided as prop, use it
    if (propExperienceId) {
      setExperienceId(propExperienceId)
    } else {
      // Try to get from Whop context or URL
      if (typeof window !== 'undefined') {
        const whopContext = (window as any).whop
        if (whopContext?.experienceId) {
          setExperienceId(whopContext.experienceId)
        } else {
          const params = new URLSearchParams(window.location.search)
          setExperienceId(params.get('experienceId') || '')
        }
      }
    }
  }, [propExperienceId])

  const getExperienceId = () => {
    return experienceId || propExperienceId || ''
  }

  const getMembershipId = () => {
    if (propMembershipId) return propMembershipId
    if (typeof window !== 'undefined') {
      const whopContext = (window as any).whop
      if (whopContext?.membershipId) return whopContext.membershipId
      const params = new URLSearchParams(window.location.search)
      return params.get('membershipId')
    }
    return null
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
      // Get Whop user context if available (from iframe)
      const whopContext = typeof window !== 'undefined' ? (window as any).whop : null
      const userId = whopContext?.userId || whopContext?.user_id || null

      const response = await fetch('/api/buyer/access', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Pass Whop token if available in iframe context
          ...(whopContext?.token ? { 'x-whop-user-token': whopContext.token } : {}),
        },
        body: JSON.stringify({
          tradingViewUsername: tradingViewUsername.trim(),
          experienceId: expId,
          membershipId: getMembershipId(),
          userId, // Pass userId if we have it from context
        }),
      })

      const data = await response.json()

      // Always show logs if available
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs)
        setShowLogs(true)
      }

      if (response.ok) {
        if (data.isOwnerOrAdmin) {
          setMessage({
            type: 'success',
            text: '✨ Access granted! As a company owner/admin, you have automatic access to all indicators.',
          })
        } else {
          setMessage({
            type: 'success',
            text: '✨ Access granted! You should now have access to the indicator on TradingView. Access will be automatically managed based on your membership status.',
          })
        }
        setTradingViewUsername('')
        setAccessGranted(true)
        
        // Note: Access will be automatically managed via webhooks:
        // - When membership is active: access is granted
        // - When membership is cancelled/expired: access is revoked
        // - Owners/admins always have access
      } else {
        const errorText = data.error || 'Failed to grant access'
        const detailsText = data.details ? ` (${data.details})` : ''
        setMessage({ 
          type: 'error', 
          text: `${errorText}${detailsText}`,
        })
        // Show logs on error
        if (data.logs && Array.isArray(data.logs)) {
          setShowLogs(true)
        }
      }
    } catch (error: any) {
      setLogs([`✗ Network error: ${error.message}`, `Check your connection and try again`])
      setShowLogs(true)
      setMessage({ type: 'error', text: error.message || 'Failed to grant access' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.card} className="slide-in">
        <h1 style={styles.title}>Get TradingView Indicator Access</h1>
        <p style={{ marginBottom: '2rem', color: '#666', lineHeight: '1.6' }}>
          Enter your TradingView username to receive access to the indicator you purchased.
          <br />
          <span style={{ fontSize: '0.9rem', color: '#10b981', marginTop: '0.5rem', display: 'block' }}>
            ✓ Access is automatically managed based on your membership status
          </span>
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

        <form onSubmit={handleGrantAccess}>
          {!getExperienceId() && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="experienceId"
                style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: '#1a1a1a' }}
              >
                Experience ID:
              </label>
              <input
                id="experienceId"
                type="text"
                value={experienceId}
                onChange={(e) => setExperienceId(e.target.value)}
                onFocus={() => setFocusedInput('experienceId')}
                onBlur={() => setFocusedInput(null)}
                required
                style={{
                  ...styles.input,
                  ...(focusedInput === 'experienceId' ? styles.inputFocus : {}),
                }}
                placeholder="Enter the experience/product ID"
              />
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <label
              htmlFor="tradingViewUsername"
              style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: '#1a1a1a' }}
            >
              TradingView Username:
            </label>
            <input
              id="tradingViewUsername"
              type="text"
              value={tradingViewUsername}
              onChange={(e) => setTradingViewUsername(e.target.value)}
              onFocus={() => setFocusedInput('tradingViewUsername')}
              onBlur={() => setFocusedInput(null)}
              required
              style={{
                ...styles.input,
                ...(focusedInput === 'tradingViewUsername' ? styles.inputFocus : {}),
              }}
              placeholder="Your TradingView username"
            />
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
              This is the username you use to log into TradingView
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                Object.assign(e.currentTarget.style, styles.buttonHover)
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = styles.button.boxShadow
              }
            }}
          >
            {loading ? 'Granting Access...' : '✨ Grant Access'}
          </button>
        </form>

        {showLogs && logs.length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}>
              <strong style={{ color: '#1a1a1a' }}>🔍 Debug Logs:</strong>
              <button
                onClick={() => setShowLogs(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Hide
              </button>
            </div>
            {logs.map((log, index) => (
              <div 
                key={index}
                style={{
                  padding: '0.25rem 0',
                  color: log.startsWith('✗') ? '#dc2626' : log.startsWith('✓') ? '#059669' : '#4b5563',
                  lineHeight: '1.5',
                }}
              >
                {log}
              </div>
            ))}
          </div>
        )}

        {!showLogs && (message?.type === 'error' || logs.length > 0) && (
          <button
            onClick={() => setShowLogs(true)}
            style={{
              marginTop: '1rem',
              background: 'none',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            🔍 Show Debug Logs
          </button>
        )}

        <div style={styles.infoBox}>
          <strong style={{ color: '#1a1a1a' }}>💡 Note:</strong> After granting access, it may take a few moments for the
          indicator to appear in your TradingView account. If you don't see it, try refreshing
          your TradingView page.
        </div>
      </div>
    </div>
  )
}
