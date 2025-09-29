'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SessionTimeoutWarning } from '@/components/auth/session-timeout-warning'
import { clientSessionManagementService } from '@/lib/auth/session-management'
import { env } from '@/lib/config/environment'

interface SessionContextType {
  isAuthenticated: boolean
  user: any | null
  isLoading: boolean
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
  enableTimeoutWarning?: boolean
  sessionTimeoutMinutes?: number
  warningThresholdMinutes?: number
}

export function SessionProvider({
  children,
  enableTimeoutWarning = true,
  sessionTimeoutMinutes = env.sessionTimeoutMinutes,
  warningThresholdMinutes = env.sessionWarningThresholdMinutes,
}: SessionProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session initialization error:', error)
          setIsAuthenticated(false)
          setUser(null)
        } else if (session) {
          setIsAuthenticated(true)
          setUser(session.user)
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Use setTimeout to avoid act() warnings in tests
    const timeoutId = setTimeout(() => {
      initializeSession()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [supabase.auth])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true)
          setUser(session.user)
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false)
            setUser(null)
          } else if (session) {
            setIsAuthenticated(true)
            setUser(session.user)
          }
        }
        
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Refresh session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }

      if (data.session) {
        setIsAuthenticated(true)
        setUser(data.session.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setUser(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  // Handle session timeout
  const handleSessionExpired = () => {
    setIsAuthenticated(false)
    setUser(null)
    router.push('/auth/login?message=Your session has expired. Please sign in again.')
  }

  // Handle session extended
  const handleSessionExtended = () => {
    console.log('Session extended successfully')
  }

  const contextValue: SessionContextType = {
    isAuthenticated,
    user,
    isLoading,
    refreshSession,
    signOut,
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
      
      {/* Session timeout warning - only show for authenticated users */}
      {enableTimeoutWarning && isAuthenticated && !isLoading && (
        <SessionTimeoutWarning
          sessionTimeoutMinutes={sessionTimeoutMinutes}
          warningThresholdMinutes={warningThresholdMinutes}
          onSessionExpired={handleSessionExpired}
          onSessionExtended={handleSessionExtended}
        />
      )}
    </SessionContext.Provider>
  )
}

// Hook to use session context
export function useSession() {
  const context = useContext(SessionContext)
  
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  
  return context
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

// Higher-order component for protected pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useRequireAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null // Will redirect to login
    }

    return <Component {...props} />
  }
}
