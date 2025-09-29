'use client'

import { useState, useEffect } from 'react'
import { Shield, Smartphone, Key, Download, AlertTriangle, CheckCircle, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CSRFProtectedForm } from '@/components/csrf-protected-form'
import { clientTwoFactorService } from '@/lib/auth/two-factor-client'

export default function TwoFactorAuthPage() {
  const [status, setStatus] = useState<TwoFactorStatus>({ isEnabled: false, hasBackupCodes: false })
  const [isLoading, setIsLoading] = useState(true)
  const [setupData, setSetupData] = useState<{
    secret?: string
    qrCodeUrl?: string
    backupCodes?: string[]
  }>({})
  const [verificationToken, setVerificationToken] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    loadTwoFactorStatus()
  }, [])

  const loadTwoFactorStatus = async () => {
    try {
      const twoFactorStatus = await clientTwoFactorService.getTwoFactorStatus()
      setStatus(twoFactorStatus)
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupTwoFactor = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await clientTwoFactorService.setupTwoFactor()

      if (result.success) {
        setSetupData({
          secret: result.secret,
          qrCodeUrl: result.qrCodeUrl,
          backupCodes: result.backupCodes,
        })
        setIsSetupMode(true)
        setMessage('Scan the QR code with your authenticator app')
      } else {
        setError(result.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      setError('Failed to setup two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationToken.trim()) {
      setError('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await clientTwoFactorService.enableTwoFactor(verificationToken.trim())

      if (result.success) {
        setMessage(result.message)
        setIsSetupMode(false)
        setVerificationToken('')
        setShowBackupCodes(true)
        await loadTwoFactorStatus()
      } else {
        setError(result.error || result.message)
      }
    } catch (error) {
      setError('Failed to enable two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!disableToken.trim()) {
      setError('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await clientTwoFactorService.disableTwoFactor(disableToken.trim())

      if (result.success) {
        setMessage(result.message)
        setDisableToken('')
        await loadTwoFactorStatus()
      } else {
        setError(result.error || result.message)
      }
    } catch (error) {
      setError('Failed to disable two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!verificationToken.trim()) {
      setError('Please enter a verification code to regenerate backup codes')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await clientTwoFactorService.regenerateBackupCodes(verificationToken.trim())

      if (result.success) {
        setSetupData({ ...setupData, backupCodes: result.backupCodes })
        setShowBackupCodes(true)
        setMessage('New backup codes generated successfully')
        setVerificationToken('')
      } else {
        setError(result.error || 'Failed to regenerate backup codes')
      }
    } catch (error) {
      setError('Failed to regenerate backup codes')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage('Copied to clipboard')
    setTimeout(() => setMessage(null), 2000)
  }

  const downloadBackupCodes = () => {
    if (!setupData.backupCodes) return

    const content = `Stoneclough Community PWA - Two-Factor Authentication Backup Codes

Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to sign in.
After using a backup code, it will no longer be valid.`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stoneclough-2fa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading && !isSetupMode) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Two-Factor Authentication
        </h1>
        <p className="text-muted-foreground mt-2">
          Add an extra layer of security to your account with two-factor authentication
        </p>
      </div>

      {message && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Status</span>
              <Badge variant={status.isEnabled ? "default" : "secondary"}>
                {status.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Two-factor authentication {status.isEnabled ? "is" : "is not"} currently enabled for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${status.isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm">
                  Two-factor authentication: {status.isEnabled ? "Active" : "Inactive"}
                </span>
              </div>
              
              {status.isEnabled && (
                <div className="flex items-center gap-3">
                  <Key className={`w-5 h-5 ${status.hasBackupCodes ? 'text-green-600' : 'text-yellow-600'}`} />
                  <span className="text-sm">
                    Backup codes: {status.backupCodesRemaining || 0} remaining
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup or Manage 2FA */}
        {!status.isEnabled && !isSetupMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Enable Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Secure your account with an authenticator app like Google Authenticator, Authy, or 1Password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Install an authenticator app on your phone</li>
                    <li>2. Scan the QR code we provide</li>
                    <li>3. Enter the 6-digit code from your app</li>
                    <li>4. Save your backup codes in a safe place</li>
                  </ol>
                </div>
                
                <Button onClick={handleSetupTwoFactor} disabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Process */}
        {isSetupMode && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Your Authenticator App</CardTitle>
              <CardDescription>
                Scan the QR code with your authenticator app, then enter the verification code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {setupData.qrCodeUrl && (
                <div className="text-center">
                  <img 
                    src={setupData.qrCodeUrl} 
                    alt="2FA QR Code" 
                    className="mx-auto border rounded-lg p-4 bg-white"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Can't scan? Enter this code manually: 
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {setupData.secret}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(setupData.secret || '')}
                      className="ml-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </p>
                </div>
              )}

              <Separator />

              <CSRFProtectedForm onSubmit={handleEnableTwoFactor} className="space-y-4">
                <div>
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isLoading || verificationToken.length !== 6}>
                    {isLoading ? 'Verifying...' : 'Enable Two-Factor Authentication'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsSetupMode(false)
                      setSetupData({})
                      setVerificationToken('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CSRFProtectedForm>
            </CardContent>
          </Card>
        )}

        {/* Backup Codes */}
        {(showBackupCodes || (status.isEnabled && setupData.backupCodes)) && setupData.backupCodes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Backup Codes
              </CardTitle>
              <CardDescription>
                Save these codes in a safe place. You can use them to access your account if you lose your phone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Important:</strong> Each backup code can only be used once. Store them securely.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{index + 1}. {code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={downloadBackupCodes} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Backup Codes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manage 2FA (when enabled) */}
        {status.isEnabled && !isSetupMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Disable Two-Factor Authentication</CardTitle>
              <CardDescription>
                Remove two-factor authentication from your account. This will make your account less secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Disabling 2FA will make your account less secure. Only do this if absolutely necessary.
                </AlertDescription>
              </Alert>

              <CSRFProtectedForm onSubmit={handleDisableTwoFactor} className="space-y-4">
                <div>
                  <Label htmlFor="disable-code">Verification Code</Label>
                  <Input
                    id="disable-code"
                    type="text"
                    placeholder="Enter code from your app or backup code"
                    value={disableToken}
                    onChange={(e) => setDisableToken(e.target.value)}
                    className="text-center"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="destructive" 
                  disabled={isLoading || !disableToken.trim()}
                >
                  {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                </Button>
              </CSRFProtectedForm>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium">Regenerate Backup Codes</h4>
                <p className="text-sm text-muted-foreground">
                  Generate new backup codes if you've lost your current ones or used most of them.
                </p>
                
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    className="text-center"
                  />
                  <Button 
                    onClick={handleRegenerateBackupCodes}
                    disabled={isLoading || !verificationToken.trim()}
                    variant="outline"
                  >
                    Regenerate Codes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
