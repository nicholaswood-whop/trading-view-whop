'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SellerDashboard from '@/components/SellerDashboard'
import BuyerAccess from '@/components/BuyerAccess'

/**
 * Home page - redirects to appropriate view based on context
 * In Whop apps, this is typically the discover page or redirects to dashboard
 */
export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we're in a Whop iframe context
    // If so, we might want to redirect to dashboard or show appropriate view
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    
    if (view === 'seller' || view === 'dashboard') {
      // Show seller dashboard
      setLoading(false)
    } else if (view === 'buyer' || view === 'experience') {
      // Show buyer access
      setLoading(false)
    } else {
      // Default: show discover/landing page
      // Or redirect to discover page
      router.push('/discover')
      return
    }
  }, [router])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 500,
          textShadow: '0 2px 20px rgba(255, 255, 255, 0.3)',
        }}>
          Loading...
        </div>
      </div>
    )
  }

  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  const isSeller = view === 'seller' || view === 'dashboard'

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {isSeller ? <SellerDashboard /> : <BuyerAccess />}
    </main>
  )
}
