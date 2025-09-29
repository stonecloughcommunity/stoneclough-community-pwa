'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { clientEmailVerificationService } from '@/lib/auth/email-verification'

export default function VerificationPendingPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [nextAllowedTime, setNextAllowedTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const checkStatus = async () => {
      const status = await clientEmailVerificationService.checkVerificationStatus()
      
      if (status.isVerified) {
        router.push('/auth/verification-success')
        return
      }
      
      setEmail(status.email)
    }

    checkStatus()
  }, [router])

  useEffect(() => {
    if (!nextAllowedTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, nextAllowedTime.getTime() - now)
      setTimeRemaining(Math.ceil(remaining / 1000))

      if (remaining <= 0) {
        setNextAllowedTime(null)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [nextAllowedTime])

  const handleResendVerification = async () => {
    if (!email || isResending || timeRemaining > 0) return

    setIsResending(true)
    setResendMessage(null)
    setResendError(null)

    try {
      const result = await clientEmailVerificationService.resendVerificationEmail(email)

      if (result.success) {
        setResendMessage(result.message)
      } else if (result.rateLimited && result.nextAllowedTime) {
        setNextAllowedTime(new Date(result.nextAllowedTime))
        setResendError(result.message)
      } else {
        setResendError(result.error || result.message)
      }
    } catch (error) {
      setResendError('Failed to resend verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-yellow-800">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Please check your email and click the verification link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {email && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  We sent a verification email to:
                </p>
                <p className="font-medium text-gray-700 bg-gray-50 p-2 rounded">
                  {email}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 text-yellow-700 bg-yellow-50 p-4 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Verification pending</span>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Click the verification link in your email to activate your account. 
                The email may take a few minutes to arrive.
              </p>

              {resendMessage && (
                <Alert className="border-green-200 bg-green-50">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {resendMessage}
                  </AlertDescription>
                </Alert>
              )}

              {resendError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {resendError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending || timeRemaining > 0}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : timeRemaining > 0 ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Resend in {formatTimeRemaining(timeRemaining)}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/auth/login">
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Check your spam folder if you don't see the email. 
                Need help?{' '}
                <Link href="/contact" className="text-yellow-600 hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
