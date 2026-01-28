'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SellerDashboard from '@/components/SellerDashboard'

/**
 * Dashboard page - shown to sellers/company owners
 * This is where sellers manage their TradingView connections and indicators
 * Includes navigation to settings page
 */
export default function DashboardPage({
  params,
}: {
  params: { companyId: string }
}) {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Get companyId from params or URL
    const id = params?.companyId || new URLSearchParams(window.location.search).get('companyId') || ''
    setCompanyId(id)
    
    // Check if we should show settings (from URL param)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('view') === 'settings') {
      setShowSettings(true)
    }
  }, [params])

  if (showSettings) {
    // Redirect to settings page
    router.push(`/dashboard/${companyId}/settings`)
    return null
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <div></div>
          <button
            onClick={() => router.push(`/dashboard/${companyId}/settings`)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
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
            ⚙️ Settings
          </button>
        </div>
        <SellerDashboard />
      </div>
    </main>
  )
}
