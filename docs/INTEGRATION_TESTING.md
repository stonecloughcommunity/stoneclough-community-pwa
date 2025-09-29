# Integration Testing Guide

This document describes the integration testing strategy and implementation for the Stoneclough Community PWA API routes.

## Overview

Integration tests verify that different components of the application work together correctly. They test API endpoints, database interactions, authentication flows, and external service integrations.

## Test Structure

```
__tests__/integration/
├── api/
│   ├── auth.test.ts           # Authentication API tests
│   ├── community.test.ts      # Community features API tests
│   ├── security.test.ts       # Security API tests
│   ├── directory.test.ts      # Directory API tests
│   ├── events.test.ts         # Events API tests
│   └── admin.test.ts          # Admin API tests
├── middleware/
│   ├── auth.test.ts           # Authentication middleware tests
│   ├── security.test.ts       # Security middleware tests
│   └── rate-limiting.test.ts  # Rate limiting tests
└── services/
    ├── supabase.test.ts       # Supabase integration tests
    ├── email.test.ts          # Email service tests
    └── monitoring.test.ts     # Monitoring service tests
```

## Testing Strategy

### 1. API Route Testing

#### Authentication Routes
- **Sign In**: Valid/invalid credentials, validation, rate limiting
- **Sign Up**: User creation, validation, duplicate handling
- **Sign Out**: Session cleanup, error handling
- **Password Reset**: Email sending, validation, security

#### Community Routes
- **Posts**: CRUD operations, pagination, filtering, search
- **Likes**: Toggle functionality, duplicate prevention
- **Comments**: Creation, validation, moderation
- **Moderation**: Content filtering, reporting, admin actions

#### Security Routes
- **CSP Reports**: Violation processing, filtering, alerting
- **Security Audit**: Header validation, scoring, recommendations
- **Rate Limiting**: Threshold enforcement, IP tracking

### 2. Middleware Testing

#### Authentication Middleware
```typescript
describe('Authentication Middleware', () => {
  it('should authenticate valid tokens', async () => {
    const request = createMockRequest({
      headers: { Authorization: 'Bearer valid-token' }
    });
    
    const response = await authMiddleware(request);
    expect(response.user).toBeDefined();
  });
});
```

#### Security Middleware
```typescript
describe('Security Middleware', () => {
  it('should apply security headers', async () => {
    const response = await securityMiddleware(request);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
```

### 3. Database Integration

#### Supabase Integration
```typescript
describe('Supabase Integration', () => {
  it('should handle database operations', async () => {
    const result = await supabase.from('posts').select('*');
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});
```

## Mock Strategy

### 1. External Services

#### Supabase Client
```typescript
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};
```

#### Email Service
```typescript
const mockEmailService = {
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendNotificationEmail: jest.fn(),
};
```

### 2. Request/Response Mocking

#### NextRequest Mocking
```typescript
const createMockRequest = (options = {}) => {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(options.body || {}),
  });
};
```

#### Response Validation
```typescript
const validateApiResponse = async (response: Response) => {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(600);
  
  const data = await response.json();
  expect(data).toHaveProperty('success');
  
  if (!data.success) {
    expect(data).toHaveProperty('error');
  }
};
```

## Test Data Management

### 1. Test Users
```typescript
export const TEST_USERS = {
  admin: {
    id: 'admin-123',
    email: 'admin@test.com',
    is_admin: true,
  },
  user: {
    id: 'user-123',
    email: 'user@test.com',
    is_admin: false,
  },
  volunteer: {
    id: 'volunteer-123',
    email: 'volunteer@test.com',
    is_volunteer: true,
  },
};
```

### 2. Test Data Factories
```typescript
export const createTestPost = (overrides = {}) => ({
  id: `post-${Date.now()}`,
  content: 'Test post content',
  author_id: 'user-123',
  created_at: new Date().toISOString(),
  likes_count: 0,
  comments_count: 0,
  ...overrides,
});
```

### 3. Database Seeding
```typescript
const seedTestData = async () => {
  await supabase.from('profiles').insert(TEST_USERS);
  await supabase.from('posts').insert([
    createTestPost({ author_id: TEST_USERS.user.id }),
    createTestPost({ author_id: TEST_USERS.volunteer.id }),
  ]);
};
```

## Authentication Testing

### 1. Token Validation
```typescript
describe('Token Validation', () => {
  it('should validate JWT tokens', async () => {
    const token = generateTestToken(TEST_USERS.user);
    const request = createMockRequest({
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const user = await validateAuthToken(request);
    expect(user.id).toBe(TEST_USERS.user.id);
  });
});
```

### 2. Permission Testing
```typescript
describe('Permission Checks', () => {
  it('should allow admin access to admin routes', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: TEST_USERS.admin },
      error: null,
    });
    
    const response = await adminHandler(request);
    expect(response.status).toBe(200);
  });
  
  it('should deny regular user access to admin routes', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: TEST_USERS.user },
      error: null,
    });
    
    const response = await adminHandler(request);
    expect(response.status).toBe(403);
  });
});
```

## Error Handling Testing

### 1. Database Errors
```typescript
describe('Database Error Handling', () => {
  it('should handle connection failures', async () => {
    mockSupabaseClient.from().select.mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' },
    });
    
    const response = await getPostsHandler(request);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Connection failed');
  });
});
```

### 2. Validation Errors
```typescript
describe('Input Validation', () => {
  it('should validate required fields', async () => {
    const request = createMockRequest({
      body: { email: '', password: '' }
    });
    
    const response = await signInHandler(request);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toContain('required');
  });
});
```

### 3. Rate Limiting
```typescript
describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const requests = Array.from({ length: 10 }, () =>
      createMockRequest({
        headers: { 'X-Forwarded-For': '192.168.1.1' }
      })
    );
    
    const responses = await Promise.all(
      requests.map(req => signInHandler(req))
    );
    
    const rateLimitedResponses = responses.filter(
      res => res.status === 429
    );
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

## Security Testing

### 1. Input Sanitization
```typescript
describe('Input Sanitization', () => {
  it('should sanitize malicious input', async () => {
    const maliciousContent = '<script>alert("xss")</script>';
    const request = createMockRequest({
      body: { content: maliciousContent }
    });
    
    const response = await createPostHandler(request);
    const data = await response.json();
    
    expect(data.post.content).not.toContain('<script>');
  });
});
```

### 2. CSRF Protection
```typescript
describe('CSRF Protection', () => {
  it('should require CSRF token for state-changing operations', async () => {
    const request = createMockRequest({
      method: 'POST',
      // Missing CSRF token
    });
    
    const response = await createPostHandler(request);
    expect(response.status).toBe(403);
  });
});
```

### 3. SQL Injection Prevention
```typescript
describe('SQL Injection Prevention', () => {
  it('should prevent SQL injection in search queries', async () => {
    const maliciousQuery = "'; DROP TABLE posts; --";
    const request = createMockRequest({
      body: { search: maliciousQuery }
    });
    
    // Should not throw database errors
    const response = await searchPostsHandler(request);
    expect(response.status).not.toBe(500);
  });
});
```

## Performance Testing

### 1. Response Time Testing
```typescript
describe('Performance', () => {
  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    const response = await getPostsHandler(request);
    const endTime = Date.now();
    
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(1000); // 1 second
  });
});
```

### 2. Pagination Testing
```typescript
describe('Pagination Performance', () => {
  it('should handle large datasets efficiently', async () => {
    const request = createMockRequest({
      url: '/api/posts?page=100&limit=50'
    });
    
    const response = await getPostsHandler(request);
    expect(response.status).toBe(200);
    
    // Should not timeout or cause memory issues
  });
});
```

## Running Integration Tests

### Local Development
```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- auth.test.ts

# Run with coverage
npm run test:integration:coverage

# Run in watch mode
npm run test:integration:watch
```

### CI/CD Pipeline
```bash
# Run integration tests in CI
npm run test:integration:ci

# Generate test reports
npm run test:integration:report
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use fresh mocks for each test

### 2. Realistic Testing
- Use realistic test data
- Test edge cases and error conditions
- Simulate real-world scenarios

### 3. Performance Considerations
- Keep tests fast and focused
- Mock external dependencies
- Use parallel execution where possible

### 4. Maintainability
- Use descriptive test names
- Group related tests logically
- Keep tests simple and readable

## Troubleshooting

### Common Issues
1. **Mock not working**: Check mock setup and import order
2. **Async issues**: Ensure proper await usage
3. **Database errors**: Verify mock data structure
4. **Authentication failures**: Check token generation and validation

### Debug Techniques
```typescript
// Add debug logging
console.log('Request:', request);
console.log('Response:', await response.json());

// Use Jest debugging
test.only('debug specific test', async () => {
  // Test code here
});
```
