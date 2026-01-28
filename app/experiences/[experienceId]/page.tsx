'use client'

import { useEffect, useState } from 'react'
import BuyerAccess from '@/components/BuyerAccess'

/**
 * Experience page - shown when users access a Whop experience
 * This is the buyer-facing page where users enter their TradingView username
 * Access is automatically managed via webhooks based on membership status
 */
export default function ExperiencePage({
  params,
}: {
  params: { experienceId: string }
}) {
  const [experienceId, setExperienceId] = useState<string>('')
  const [membershipId, setMembershipId] = useState<string | null>(null)

  useEffect(() => {
    // Get experienceId from route params (this comes from the URL path)
    const id = params?.experienceId || ''
    setExperienceId(id)

    // Try to get membershipId and check if user is owner/admin
    if (typeof window !== 'undefined') {
      // Check Whop iframe context
      const whopContext = (window as any).whop
      if (whopContext?.membershipId) {
        setMembershipId(whopContext.membershipId)
      } else {
        // Fall back to URL params
        const urlParams = new URLSearchParams(window.location.search)
        setMembershipId(urlParams.get('membershipId'))
      }

      // Check if user is owner/admin - they get automatic access
      // This will be handled on the backend, but we can show a message
      if (whopContext?.isOwner || whopContext?.isAdmin) {
        // Owner/admin - access will be granted automatically
      }
    }
  }, [params])

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <BuyerAccess 
        experienceId={experienceId}
        membershipId={membershipId}
      />
    </main>
  )
}
