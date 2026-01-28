'use client'

import { useEffect, useState } from 'react'
import SellerDashboard from '@/components/SellerDashboard'
import BuyerAccess from '@/components/BuyerAccess'

export default function Home() {
  const [isSeller, setIsSeller] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, you'd check the user's role from the Whop token
    // For now, we'll show both views or detect based on URL params
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') || 'seller'
    setIsSeller(view === 'seller')
    setLoading(false)
  }, [])

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

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {isSeller ? <SellerDashboard /> : <BuyerAccess />}
    </main>
  )
}
