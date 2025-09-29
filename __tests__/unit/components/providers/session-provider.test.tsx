import { render, screen, waitFor } from '@testing-library/react'
import { SessionProvider, useSession } from '@/components/providers/session-provider'
import { createMockUser, createMockSession } from '@/__tests__/utils/test-utils'

// Test component to access session context
const TestComponent = () => {
  const { isAuthenticated, user, isLoading } = useSession()
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <div data-testid="user-email">
        {user?.email || 'No user'}
      </div>
    </div>
  )
}

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    refreshSession: jest.fn(),
    signOut: jest.fn(),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('SessionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('renders children correctly', () => {
    render(
      <SessionProvider>
        <div>Test content</div>
      </SessionProvider>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('provides unauthenticated state by default', async () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated')
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
    })
  })

  it('provides authenticated state when session exists', async () => {
    const mockUser = createMockUser({ email: 'test@example.com' })
    const mockSession = createMockSession({ user: mockUser })
    
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('shows loading state initially', () => {
    // Make getSession hang to test loading state
    mockSupabaseClient.auth.getSession.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles session errors gracefully', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session error'),
    })
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated')
    })
  })

  it('listens for auth state changes', async () => {
    const mockCallback = jest.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      mockCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )
    
    expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
  })

  it('cleans up auth listener on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
    
    const { unmount } = render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )
    
    unmount()
    
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('disables timeout warning when specified', () => {
    render(
      <SessionProvider enableTimeoutWarning={false}>
        <TestComponent />
      </SessionProvider>
    )
    
    // Should not render timeout warning component
    expect(screen.queryByText(/session will expire/i)).not.toBeInTheDocument()
  })
})
