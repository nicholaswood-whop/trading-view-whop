'use client'

import { useEffect, useState } from 'react'
import BuyerAccess from '@/components/BuyerAccess'
import SetupIndicator from '@/components/SetupIndicator'

/**
 * Experience page - shown when users access a Whop experience
 * For owners/admins: Shows setup flow if no indicator is configured
 * For buyers: Shows access form to enter TradingView username
 */
export default function ExperiencePage({
  params,
}: {
  params: { experienceId: string }
}) {
  const [experienceId, setExperienceId] = useState<string>('')
  const [membershipId, setMembershipId] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

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
    }

    // Check if setup is needed
    checkSetupNeeded(id)
  }, [params])

  const checkSetupNeeded = async (expId: string) => {
    if (!expId) {
      setChecking(false)
      return
    }

    try {
      const response = await fetch(`/api/experiences/${expId}/setup`)
      if (response.ok) {
        const data = await response.json()
        if (data.setupNeeded) {
          setShowSetup(true)
          if (data.companyId) {
            setCompanyId(data.companyId)
          }
        } else {
          setShowSetup(false)
        }
      } else if (response.status === 403) {
        // User is not owner/admin, show buyer access
        setShowSetup(false)
      } else {
        // Error or not owner/admin, show buyer access
        setShowSetup(false)
      }
    } catch (error) {
      console.error('Error checking setup status:', error)
      setShowSetup(false)
    } finally {
      setChecking(false)
    }
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    // Refresh to show buyer access form
    window.location.reload()
  }

  if (checking) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {showSetup ? (
        <SetupIndicator
          experienceId={experienceId}
          companyId={companyId || ''}
          onComplete={handleSetupComplete}
        />
      ) : (
        <BuyerAccess 
          experienceId={experienceId}
          membershipId={membershipId}
        />
      )}
    </main>
  )
}
