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
  const [manualScriptId, setManualScriptId] = useState('')
  const [manualName, setManualName] = useState('')

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
        
        // Always start with connection check
        setConnected(data.connectionExists)
        if (!data.connectionExists) {
          // No connection - must start at step 1
          setStep('connect')
        } else {
          // Connection exists - check what step we're on
          if (data.step === 'attach' && data.indicators && data.indicators.length > 0) {
            setIndicators(data.indicators)
            setStep('attach')
          } else {
            // Need to import indicators
            setStep('import')
            // Also try to load existing indicators if any
            if (data.indicators && data.indicators.length > 0) {
              setIndicators(data.indicators)
            }
          }
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
        const importedCount = data.indicatorsImported || 0
        setMessage({
          type: 'success',
          text: `Successfully connected! ${importedCount} indicator${importedCount !== 1 ? 's' : ''} imported automatically.`,
        })
        setSessionId('')
        setSessionIdSign('')
        
        // Move to next step
        if (importedCount > 0) {
          // Refresh indicators and move to attach step
          await checkSetupStatus()
        } else {
          // No indicators imported automatically, move to import step
          setStep('import')
          // Refresh to get any existing indicators
          await checkSetupStatus()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect. Please check your session cookies and try again.' })
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
        const importedCount = data.count ?? 0
        if (importedCount > 0) {
          setMessage({
            type: 'success',
            text: `Successfully imported ${importedCount} indicator${importedCount !== 1 ? 's' : ''}!`,
          })
          await checkSetupStatus()
          setTimeout(() => setStep('attach'), 1000)
        } else {
          setMessage({
            type: 'success',
            text: "TradingView doesn't provide an API to list scripts. Add your indicator manually below using the Script ID from your script's URL.",
          })
          await checkSetupStatus()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to import. Ensure your TradingView account is connected.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Import failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualScriptId.trim() || !manualName.trim()) {
      setMessage({ type: 'error', text: 'Please enter both Script ID and indicator name.' })
      return
    }
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/seller/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          scriptId: manualScriptId.trim(),
          name: manualName.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const addedName = manualName.trim()
        setMessage({
          type: 'success',
          text: `"${addedName}" added. You can add another or continue to Attach.`,
        })
        setManualScriptId('')
        setManualName('')
        await checkSetupStatus()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add indicator.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Add failed' })
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
            <p style={{ marginBottom: '1.5rem', color: '#6b7280', lineHeight: '1.6' }}>
              To get started, you need to provide your TradingView session cookies.
              <br />
              <strong style={{ color: '#1f2937', display: 'block', marginTop: '1rem' }}>How to get your cookies:</strong>
              <span style={{ fontSize: '0.9rem', display: 'block', marginTop: '0.5rem' }}>
                1. Log into TradingView in your browser
                <br />
                2. Open Developer Tools (F12 or right-click → Inspect)
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
                  placeholder="Paste your sessionid cookie value"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  required
                  style={styles.input}
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
                  placeholder="Paste your sessionid_sign cookie value"
                  value={sessionIdSign}
                  onChange={(e) => setSessionIdSign(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Connecting...' : 'Connect TradingView Account'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Import / Add Indicators */}
        {step === 'import' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
              Import or Add Your Indicator
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280', lineHeight: '1.6' }}>
              TradingView does not provide a public API to list your scripts. Try &quot;Import Indicators&quot; once; if nothing is found, add your indicator manually using the <strong>Script ID</strong> from your script&apos;s URL on TradingView (e.g. <code style={{ background: 'rgba(102, 126, 234, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>ABC123-My-Indicator</code> or the numeric ID).
            </p>
            {!connected && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                color: '#991b1b',
              }}>
                ⚠️ TradingView account not connected. Please go back to step 1 to connect your account first.
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setStep('connect')}
                style={{
                  ...styles.button,
                  background: '#6b7280',
                  flex: 1,
                }}
              >
                ← Back to Connect
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={loading || !connected}
                style={{
                  ...styles.button,
                  flex: 2,
                  opacity: (!connected || loading) ? 0.7 : 1,
                  cursor: (!connected || loading) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Importing...' : 'Import Indicators'}
              </button>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              border: '2px solid rgba(102, 126, 234, 0.25)',
              borderRadius: '12px',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1f2937' }}>
                Add indicator manually
              </h3>
              <form onSubmit={handleAddManual}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="manualScriptId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Script ID
                  </label>
                  <input
                    id="manualScriptId"
                    type="text"
                    placeholder="e.g. from URL: tradingview.com/script/YourScriptId/"
                    value={manualScriptId}
                    onChange={(e) => setManualScriptId(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="manualName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Indicator name
                  </label>
                  <input
                    id="manualName"
                    type="text"
                    placeholder="e.g. My Custom Indicator"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? 'Adding...' : 'Add indicator'}
                </button>
              </form>
            </div>

            {indicators.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('attach')}
                  style={{
                    ...styles.button,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  Continue to Attach ({indicators.length} indicator{indicators.length !== 1 ? 's' : ''})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Attach Indicator */}
        {step === 'attach' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
              Select Indicator to Attach
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280', lineHeight: '1.6' }}>
              Choose which indicator to attach to this experience. Buyers will get access to this indicator when they purchase.
            </p>
            {indicators.length === 0 ? (
              <div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  color: '#991b1b',
                }}>
                  ⚠️ No indicators available. Please import indicators first.
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => setStep('import')} 
                    style={{
                      ...styles.button,
                      background: '#6b7280',
                      flex: 1,
                    }}
                  >
                    ← Back to Import
                  </button>
                  <button 
                    onClick={() => setStep('connect')} 
                    style={{
                      ...styles.button,
                      background: '#6b7280',
                      flex: 1,
                    }}
                  >
                    ← Back to Connect
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {indicators.map((indicator) => (
                    <div
                      key={indicator.id}
                      onClick={() => setSelectedIndicatorId(indicator.id)}
                      style={{
                        ...styles.indicatorCard,
                        ...(selectedIndicatorId === indicator.id ? styles.indicatorCardSelected : {}),
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#1f2937' }}>
                        {indicator.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        TradingView ID: {indicator.tradingViewId}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => setStep('import')} 
                    style={{
                      ...styles.button,
                      background: '#6b7280',
                      flex: 1,
                    }}
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleAttach} 
                    disabled={loading || !selectedIndicatorId} 
                    style={{
                      ...styles.button,
                      flex: 2,
                      opacity: (!selectedIndicatorId || loading) ? 0.7 : 1,
                      cursor: (!selectedIndicatorId || loading) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Attaching...' : selectedIndicatorId ? '✓ Attach Selected Indicator' : 'Select an Indicator First'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
