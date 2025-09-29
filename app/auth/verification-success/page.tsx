'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Home, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clientEmailVerificationService } from '@/lib/auth/email-verification'

export default function VerificationSuccessPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean
    email: string | null
  }>({ isVerified: false, email: null })
  const router = useRouter()

  useEffect(() => {
    const checkVerification = async () => {
      try {
        // Refresh session to get updated user data
        await clientEmailVerificationService.refreshSession()
        
        // Check verification status
        const status = await clientEmailVerificationService.checkVerificationStatus()
        setVerificationStatus(status)
        
        // If not verified, redirect to verification pending page
        if (!status.isVerified) {
          router.push('/auth/verification-pending')
          return
        }
      } catch (error) {
        console.error('Failed to check verification status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkVerification()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Email Verified Successfully!
            </CardTitle>
            <CardDescription className="text-green-600">
              Your account is now active and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-2 text-green-700 bg-green-50 p-4 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Account Activated</span>
            </div>
            
            {verificationStatus.email && (
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700 mb-1">Verified Email:</p>
                <p className="text-gray-600">{verificationStatus.email}</p>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Welcome to the Stoneclough, Prestolee & Ringley community platform! 
                You can now access all features and connect with your neighbors.
              </p>
              
              <div className="space-y-3">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Community Home
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Complete Your Profile
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Need help getting started? Check out our{' '}
                <Link href="/help" className="text-green-600 hover:underline">
                  community guide
                </Link>
                {' '}or{' '}
                <Link href="/about" className="text-green-600 hover:underline">
                  learn more about us
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
