// Global setup for Jest tests
// This runs once before all tests

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.CSRF_SECRET = 'test-csrf-secret'
  process.env.SESSION_TIMEOUT_MINUTES = '30'
  process.env.SESSION_WARNING_THRESHOLD_MINUTES = '5'
  
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC'
  
  console.log('🧪 Global test setup complete')
}
