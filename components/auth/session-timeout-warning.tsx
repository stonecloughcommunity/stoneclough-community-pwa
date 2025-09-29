'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { clientSessionManagementService } from '@/lib/auth/session-management'

interface SessionTimeoutWarningProps {
  warningThresholdMinutes?: number // Show warning when this many minutes remain
  sessionTimeoutMinutes?: number // Total session timeout in minutes
  onSessionExpired?: () => void
  onSessionExtended?: () => void
}

export function SessionTimeoutWarning({
  warningThresholdMinutes = 5,
  sessionTimeoutMinutes = 30,
  onSessionExpired,
  onSessionExtended,
}: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExtending, setIsExtending] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Extend session
  const extendSession = async () => {
    setIsExtending(true)
    
    try {
      const success = await clientSessionManagementService.refreshSession()
      
      if (success) {
        updateActivity()
        setShowWarning(false)
        onSessionExtended?.()
      } else {
        // Session refresh failed, user needs to re-authenticate
        onSessionExpired?.()
      }
    } catch (error) {
      console.error('Failed to extend session:', error)
      onSessionExpired?.()
    } finally {
      setIsExtending(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await clientSessionManagementService.signOut()
      onSessionExpired?.()
    } catch (error) {
      console.error('Failed to sign out:', error)
      onSessionExpired?.()
    }
  }

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const activityHandler = () => {
      updateActivity()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true)
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true)
      })
    }
  }, [updateActivity])

  // Session timeout logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivity
      const timeoutMs = sessionTimeoutMinutes * 60 * 1000
      const warningThresholdMs = warningThresholdMinutes * 60 * 1000
      
      const remaining = timeoutMs - timeSinceActivity
      const remainingMinutes = Math.max(0, Math.ceil(remaining / (60 * 1000)))
      
      setTimeRemaining(remainingMinutes)

      // Show warning when approaching timeout
      if (remaining <= warningThresholdMs && remaining > 0) {
        setShowWarning(true)
      }

      // Session expired
      if (remaining <= 0) {
        setShowWarning(false)
        onSessionExpired?.()
      }
    }, 1000) // Check every second

    return () => clearInterval(interval)
  }, [lastActivity, sessionTimeoutMinutes, warningThresholdMinutes, onSessionExpired])

  const formatTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
    return `${minutes}m`
  }

  const progressPercentage = Math.max(0, (timeRemaining / warningThresholdMinutes) * 100)

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            Your session will expire soon due to inactivity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">
                  remaining
                </div>
              </div>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="w-full h-2 mb-4"
            />
            
            <p className="text-sm text-muted-foreground">
              You'll be automatically signed out in {formatTime(timeRemaining)} unless you extend your session.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={extendSession}
              disabled={isExtending}
              className="flex-1"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Stay Signed In
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={signOut}
              disabled={isExtending}
              className="flex-1"
            >
              Sign Out Now
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Your session will be extended for another {sessionTimeoutMinutes} minutes of inactivity.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for using session timeout in components
export function useSessionTimeout(options: SessionTimeoutWarningProps = {}) {
  const [isSessionActive, setIsSessionActive] = useState(true)

  const handleSessionExpired = () => {
    setIsSessionActive(false)
    options.onSessionExpired?.()
  }

  const handleSessionExtended = () => {
    setIsSessionActive(true)
    options.onSessionExtended?.()
  }

  return {
    isSessionActive,
    SessionTimeoutWarning: () => (
      <SessionTimeoutWarning
        {...options}
        onSessionExpired={handleSessionExpired}
        onSessionExtended={handleSessionExtended}
      />
    ),
  }
}
