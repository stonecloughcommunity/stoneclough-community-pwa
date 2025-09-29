'use client'

import { useState } from 'react'
import { Shield, AlertCircle, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CSRFProtectedForm } from '@/components/csrf-protected-form'
import { clientTwoFactorService } from '@/lib/auth/two-factor-client'

interface TwoFactorPromptProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function TwoFactorPrompt({ onSuccess, onCancel }: TwoFactorPromptProps) {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('authenticator')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token.trim()) {
      setError('Please enter a verification code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await clientTwoFactorService.verifyTwoFactor(token.trim())

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || result.message)
      }
    } catch (error) {
      setError('Failed to verify two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter your verification code to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="authenticator" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="authenticator" className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Open your authenticator app and enter the 6-digit code
            </div>
            
            <CSRFProtectedForm onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-code">Verification Code</Label>
                <Input
                  id="auth-code"
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={isLoading || token.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CSRFProtectedForm>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Enter one of your backup codes if you can't access your authenticator app
            </div>
            
            <CSRFProtectedForm onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code">Backup Code</Label>
                <Input
                  id="backup-code"
                  type="text"
                  placeholder="Enter backup code"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                  className="text-center text-lg tracking-widest font-mono"
                  autoComplete="one-time-code"
                />
              </div>

              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  Each backup code can only be used once. After using this code, it will no longer be valid.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={isLoading || token.length !== 8}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Use Backup Code'}
                </Button>
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CSRFProtectedForm>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble?{' '}
            <button 
              onClick={() => setActiveTab(activeTab === 'authenticator' ? 'backup' : 'authenticator')}
              className="text-blue-600 hover:underline"
            >
              {activeTab === 'authenticator' ? 'Use a backup code' : 'Use authenticator app'}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
