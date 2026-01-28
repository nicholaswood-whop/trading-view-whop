'use client'

import { useState, useEffect } from 'react'

interface SetupIndicatorProps {
  experienceId: string
  companyId: string
  onComplete: () => void
}

interface Indicator {
  id: string
  name: string
  tradingViewId: string
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
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
  stepIndicator: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    position: 'relative' as const,
  },
  step: {
    flex: 1,
    textAlign: 'center' as const,
    position: 'relative' as const,
    zIndex: 2,
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
  },
  stepActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  stepCompleted: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  stepPending: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
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
    marginBottom: '1rem',
  },
  inputFocus: {
    borderColor: 'rgba(102, 126, 234, 0.5)',
    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
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
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)',
  },
  indicatorCard: {
    padding: '1rem',
    border: '2px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '12px',
    marginBottom: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  indicatorCardSelected: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
  },
  message: {
    padding: '1rem 1.5rem',
    marginBottom: '1.5rem',
    borderRadius: '12px',
  },
  messageSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#065f46',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  messageError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#991b1b',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
}

export default function SetupIndicator({ experienceId, companyId, onComplete }: SetupIndicatorProps) {
  const [step, setStep] = useState<'connect' | 'import' | 'attach'>('connect')
  const [sessionId, setSessionId] = useState('')
  const [sessionIdSign, setSessionIdSign] = useState('')
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    checkSetupStatus()
  }, [experienceId, companyId])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`/api/experiences/${experienceId}/setup`)
      if (response.ok) {
        const data = await response.json()
        if (!data.setupNeeded) {
          // Already set up
          onComplete()
          return
        }
        
        setConnected(data.connectionExists)
        if (data.connectionExists) {
          if (data.step === 'attach' && data.indicators) {
            setIndicators(data.indicators)
            setStep('attach')
          } else {
            setStep('import')
          }
        } else {
          setStep('connect')
        }
      }
    } catch (error) {
      console.error('Error checking setup status:', error)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/seller/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionIdSign,
          companyId,
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
        
        // Move to next step
        if (data.indicatorsImported > 0) {
          // Refresh indicators and move to attach step
          await checkSetupStatus()
        } else {
          setStep('import')
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Connection failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/seller/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully imported ${data.indicatorsImported || 0} indicators!`,
        })
        await checkSetupStatus()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to import indicators' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Import failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleAttach = async () => {
    if (!selectedIndicatorId) {
      setMessage({ type: 'error', text: 'Please select an indicator' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/seller/indicators/${selectedIndicatorId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId,
          companyId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Indicator attached successfully! Your experience is now set up.',
        })
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to attach indicator' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Attach failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Set Up Your Indicator</h1>
        <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
          As a company owner/admin, you need to set up an indicator for this experience.
        </p>

        {/* Step Indicator */}
        <div style={styles.stepIndicator}>
          <div style={styles.step}>
            <div
              style={{
                ...styles.stepNumber,
                ...(step === 'connect' ? styles.stepActive : connected ? styles.stepCompleted : styles.stepPending),
              }}
            >
              {connected ? '✓' : '1'}
            </div>
            <div style={{ fontSize: '0.875rem', color: step === 'connect' ? '#667eea' : '#6b7280' }}>
              Connect
            </div>
          </div>
          <div style={styles.step}>
            <div
              style={{
                ...styles.stepNumber,
                ...(step === 'import' ? styles.stepActive : indicators.length > 0 ? styles.stepCompleted : styles.stepPending),
              }}
            >
              {indicators.length > 0 ? '✓' : '2'}
            </div>
            <div style={{ fontSize: '0.875rem', color: step === 'import' ? '#667eea' : '#6b7280' }}>
              Import
            </div>
          </div>
          <div style={styles.step}>
            <div
              style={{
                ...styles.stepNumber,
                ...(step === 'attach' && selectedIndicatorId ? styles.stepActive : styles.stepPending),
              }}
            >
              3
            </div>
            <div style={{ fontSize: '0.875rem', color: step === 'attach' ? '#667eea' : '#6b7280' }}>
              Attach
            </div>
          </div>
        </div>

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

        {/* Step 1: Connect TradingView */}
        {step === 'connect' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
              Connect Your TradingView Account
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Enter your TradingView session cookies to connect your account. You can find these in your browser's developer tools.
            </p>
            <form onSubmit={handleConnect}>
              <input
                type="text"
                placeholder="Session ID (sessionid cookie)"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Session ID Sign (sessionid_sign cookie)"
                value={sessionIdSign}
                onChange={(e) => setSessionIdSign(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Connecting...' : 'Connect TradingView'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Import Indicators */}
        {step === 'import' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
              Import Your Indicators
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Import your TradingView indicators. This will fetch all indicators from your connected account.
            </p>
            <button onClick={handleImport} disabled={loading} style={styles.button}>
              {loading ? 'Importing...' : 'Import Indicators'}
            </button>
          </div>
        )}

        {/* Step 3: Attach Indicator */}
        {step === 'attach' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
              Select Indicator to Attach
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Choose which indicator to attach to this experience.
            </p>
            {indicators.length === 0 ? (
              <div>
                <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                  No indicators available. Please import indicators first.
                </p>
                <button onClick={() => setStep('import')} style={styles.button}>
                  Go Back to Import
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  {indicators.map((indicator) => (
                    <div
                      key={indicator.id}
                      onClick={() => setSelectedIndicatorId(indicator.id)}
                      style={{
                        ...styles.indicatorCard,
                        ...(selectedIndicatorId === indicator.id ? styles.indicatorCardSelected : {}),
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{indicator.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        ID: {indicator.tradingViewId}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleAttach} disabled={loading || !selectedIndicatorId} style={styles.button}>
                  {loading ? 'Attaching...' : 'Attach Indicator'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
