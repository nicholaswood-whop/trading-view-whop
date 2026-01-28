'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

/**
 * Settings page for company owners/admins
 * Allows configuration of TradingView connections and app settings
 */
export default function SettingsPage() {
  const params = useParams()
  const companyId = params?.companyId as string
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState('')
  const [sessionIdSign, setSessionIdSign] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [companyId])

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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
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
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Connection failed' })
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
        setMessage({ type: 'success', text: 'Disconnected successfully' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect' })
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '1.5rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1 }} className="fade-in">
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '0.5rem',
        textShadow: '0 2px 20px rgba(255, 255, 255, 0.3)',
      }}>
        App Settings
      </h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Configure your TradingView integration and app settings
      </p>

      {message && (
        <div style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          animation: 'fadeIn 0.4s ease-out',
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          boxShadow: message.type === 'success' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.2)',
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        marginBottom: '2rem',
      }} className="slide-in">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
          TradingView Connection
        </h2>

        {!connected ? (
          <>
            <p style={{ marginBottom: '2rem', color: '#666', lineHeight: '1.6' }}>
              Connect your TradingView account to start selling indicators. The app will automatically
              grant and revoke access based on membership status.
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
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    ...(focusedInput === 'sessionId' ? {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)',
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    } : {}),
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
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    ...(focusedInput === 'sessionIdSign' ? {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)',
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    } : {}),
                  }}
                  placeholder="Paste your sessionid_sign cookie value"
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                Connect TradingView Account
              </button>
            </form>
          </>
        ) : (
          <div>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              ✅ TradingView account connected. Access is automatically managed based on membership status.
            </p>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              Disconnect Account
            </button>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }} className="slide-in">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
          Automatic Access Management
        </h2>
        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
          The app automatically manages TradingView indicator access based on membership status:
        </p>
        <ul style={{ color: '#666', lineHeight: '2', paddingLeft: '1.5rem' }}>
          <li>✅ <strong>On Purchase:</strong> Access is automatically granted when a membership is created</li>
          <li>✅ <strong>On Renewal:</strong> Access continues automatically for active memberships</li>
          <li>✅ <strong>On Cancellation:</strong> Access is automatically revoked when membership is cancelled</li>
          <li>✅ <strong>On Expiration:</strong> Access is automatically revoked when membership expires</li>
        </ul>
        <p style={{ color: '#666', lineHeight: '1.6', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          This is handled via webhooks from Whop. Make sure your webhook URL is configured in your Whop dashboard:
          <code style={{ 
            background: 'rgba(102, 126, 234, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            marginLeft: '0.5rem',
          }}>
            https://trading-view-whop.vercel.app/api/webhooks/whop
          </code>
        </p>
      </div>
    </div>
  )
}
