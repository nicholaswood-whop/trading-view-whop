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
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      {isSeller ? <SellerDashboard /> : <BuyerAccess />}
    </main>
  )
}
