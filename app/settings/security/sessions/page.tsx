'use client'

import { useState, useEffect } from 'react'
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { clientSessionManagementService, SessionInfo } from '@/lib/auth/session-management'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const userSessions = await clientSessionManagementService.getSessions()
      setSessions(userSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      setError('Failed to load active sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    setError(null)
    setMessage(null)

    try {
      const result = await clientSessionManagementService.revokeSession(sessionId)

      if (result.success) {
        setMessage(result.message)
        await loadSessions() // Reload sessions
      } else {
        setError(result.error || result.message)
      }
    } catch (error) {
      setError('Failed to revoke session')
    } finally {
      setRevokingSessionId(null)
    }
  }

  const handleRevokeAllOthers = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await clientSessionManagementService.revokeAllOtherSessions()

      if (result.success) {
        setMessage(result.message)
        await loadSessions() // Reload sessions
      } else {
        setError(result.error || result.message)
      }
    } catch (error) {
      setError('Failed to revoke other sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const getDeviceIcon = (deviceInfo: string) => {
    const device = deviceInfo.toLowerCase()
    if (device.includes('iphone') || device.includes('android') || device.includes('mobile')) {
      return <Smartphone className="w-5 h-5" />
    }
    if (device.includes('ipad') || device.includes('tablet')) {
      return <Tablet className="w-5 h-5" />
    }
    return <Monitor className="w-5 h-5" />
  }

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const isCurrentSession = (session: SessionInfo) => {
    // Simple heuristic: the most recently active session is likely the current one
    const mostRecent = sessions.reduce((latest, current) => 
      current.lastActivity > latest.lastActivity ? current : latest
    )
    return session.id === mostRecent.id
  }

  if (isLoading && sessions.length === 0) {
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
          Active Sessions
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage where you're signed in to your account
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

      <div className="space-y-6">
        {/* Session Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Session Overview</CardTitle>
            <CardDescription>
              You have {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                For your security, sign out of sessions you don't recognize
              </div>
              {sessions.length > 1 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sign out all other sessions
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign out all other sessions?</DialogTitle>
                      <DialogDescription>
                        This will sign you out of all other devices and browsers. 
                        You'll need to sign in again on those devices.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" onClick={() => {}}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleRevokeAllOthers}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing out...' : 'Sign out all others'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Sessions</h2>
          
          {sessions.map((session) => {
            const isCurrent = isCurrentSession(session)
            
            return (
              <Card key={session.id} className={isCurrent ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getDeviceIcon(session.deviceInfo)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{session.deviceInfo}</h3>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current Session
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>IP: {session.ipAddress}</span>
                            {session.location && <span>• {session.location}</span>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Last active: {formatLastActivity(session.lastActivity)}</span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            Expires: {session.expiresAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokingSessionId === session.id}
                      >
                        {revokingSessionId === session.id ? 'Signing out...' : 'Sign out'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {sessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No active sessions</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any active sessions at the moment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Sign out of unfamiliar sessions:</strong> If you see a session you don't recognize, sign out immediately.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Use secure networks:</strong> Avoid signing in on public or unsecured Wi-Fi networks.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Keep devices secure:</strong> Always lock your devices and use strong passwords or biometric authentication.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Regular cleanup:</strong> Periodically review and sign out of sessions you no longer use.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
