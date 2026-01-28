'use client'

import { useEffect, useState } from 'react'
import BuyerAccess from '@/components/BuyerAccess'

/**
 * Experience page - shown when users access a Whop experience
 * This is the buyer-facing page where users enter their TradingView username
 */
export default function ExperiencePage({
  params,
}: {
  params: { experienceId: string }
}) {
  const [experienceId, setExperienceId] = useState<string>('')

  useEffect(() => {
    // Get experienceId from params or URL
    const id = params?.experienceId || new URLSearchParams(window.location.search).get('experienceId') || ''
    setExperienceId(id)
  }, [params])

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <BuyerAccess />
    </main>
  )
}
