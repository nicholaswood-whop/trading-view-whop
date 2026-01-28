'use client'

import { useEffect, useState } from 'react'
import SellerDashboard from '@/components/SellerDashboard'

/**
 * Dashboard page - shown to sellers/company owners
 * This is where sellers manage their TradingView connections and indicators
 */
export default function DashboardPage({
  params,
}: {
  params: { companyId: string }
}) {
  const [companyId, setCompanyId] = useState<string>('')

  useEffect(() => {
    // Get companyId from params or URL
    const id = params?.companyId || new URLSearchParams(window.location.search).get('companyId') || ''
    setCompanyId(id)
  }, [params])

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <SellerDashboard />
    </main>
  )
}
