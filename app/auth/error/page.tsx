'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const message = searchParams.get('message')

    if (message) {
      setErrorMessage(message)
    } else if (error === 'access_denied') {
      setErrorMessage('Access was denied. You may have cancelled the sign in process.')
    } else {
      setErrorMessage(errorDescription || 'An unexpected error occurred during authentication.')
    }
  }, [searchParams])

  const getErrorDetails = (message: string) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('email') && lowerMessage.includes('confirm')) {
      return {
        title: 'Email Verification Required',
        description: 'Please check your email and click the verification link to activate your account.',
        action: 'verification-pending',
        actionText: 'Check Verification Status'
      }
    }

    if (lowerMessage.includes('invalid') && lowerMessage.includes('token')) {
      return {
        title: 'Invalid or Expired Link',
        description: 'The verification link may have expired or is invalid. Please request a new one.',
        action: 'verification-pending',
        actionText: 'Request New Link'
      }
    }

    if (lowerMessage.includes('rate limit')) {
      return {
        title: 'Too Many Attempts',
        description: 'Please wait a few minutes before trying again.',
        action: 'login',
        actionText: 'Back to Sign In'
      }
    }

    return {
      title: 'Authentication Error',
      description: 'Something went wrong during authentication. Please try again.',
      action: 'login',
      actionText: 'Back to Sign In'
    }
  }

  const errorDetails = getErrorDetails(errorMessage)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-red-600">
              {errorDetails.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Error:</strong> {errorMessage}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">What you can do:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Try using a different browser</li>
                  <li>• Wait a few minutes and try again</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href={`/auth/${errorDetails.action}`}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {errorDetails.actionText}
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Still having trouble?{' '}
                <Link href="/contact" className="text-red-600 hover:underline">
                  Contact our support team
                </Link>
                {' '}for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
