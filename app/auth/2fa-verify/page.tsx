'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TwoFactorPrompt } from '@/components/auth/two-factor-prompt'
import { clientTwoFactorService } from '@/lib/auth/two-factor-client'

export default function TwoFactorVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    checkTwoFactorStatus()
  }, [])

  const checkTwoFactorStatus = async () => {
    try {
      const status = await clientTwoFactorService.getTwoFactorStatus()
      
      if (!status.isEnabled) {
        // User doesn't have 2FA enabled, redirect to intended destination
        const redirectUrl = searchParams.get('redirect') || '/'
        router.push(redirectUrl)
        return
      }

      setNeedsVerification(true)
    } catch (error) {
      console.error('Failed to check 2FA status:', error)
      // On error, redirect to login
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccess = () => {
    const redirectUrl = searchParams.get('redirect') || '/'
    
    // Set a flag to indicate 2FA was verified (this will be handled by the API)
    // The actual cookie setting happens server-side for security
    router.push(redirectUrl)
  }

  const handleCancel = () => {
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!needsVerification) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <TwoFactorPrompt onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}
