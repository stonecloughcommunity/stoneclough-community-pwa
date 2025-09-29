# Testing Guide

This document describes the testing infrastructure and best practices for the Stoneclough Community PWA.

## Overview

The project uses a comprehensive testing setup with:
- **Jest** as the test runner
- **React Testing Library** for component testing
- **jsdom** as the test environment
- **Custom test utilities** for common testing patterns

## Test Structure

```
__tests__/
├── setup/
│   ├── globalSetup.js      # Global test setup
│   └── globalTeardown.js   # Global test cleanup
├── utils/
│   └── test-utils.tsx      # Custom testing utilities
├── unit/
│   ├── components/         # Component tests
│   ├── lib/               # Library/utility tests
│   └── hooks/             # Custom hook tests
├── integration/           # Integration tests
└── e2e/                  # End-to-end tests (Playwright)
```

## Configuration Files

### jest.config.js
- Main Jest configuration
- Module name mapping for absolute imports
- Coverage settings and thresholds
- Test environment setup

### jest.setup.js
- Global test setup and mocks
- Mock implementations for Next.js, Supabase, etc.
- Environment variable setup
- Global utilities and helpers

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Utilities

### Custom Render Function

```tsx
import { render, screen } from '@/__tests__/utils/test-utils'

// Automatically wraps components with providers
render(<MyComponent />)
```

### Mock Data Factories

```tsx
import { 
  createMockUser, 
  createMockProfile, 
  createMockSession 
} from '@/__tests__/utils/test-utils'

const user = createMockUser({ email: 'test@example.com' })
const profile = createMockProfile({ is_admin: true })
```

### API Response Mocking

```tsx
import { mockApiResponse, mockApiError } from '@/__tests__/utils/test-utils'

global.fetch = jest.fn(() => Promise.resolve(
  mockApiResponse({ data: 'test' })
))
```

## Writing Tests

### Component Testing

```tsx
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interactions', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Hook Testing

```tsx
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(null)
  })

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.setValue('test')
    })
    
    expect(result.current.value).toBe('test')
  })
})
```

### API Testing

```tsx
import { sessionManagementService } from '@/lib/auth/session-management'

// Mock the service
jest.mock('@/lib/auth/session-management')
const mockService = sessionManagementService as jest.Mocked<typeof sessionManagementService>

describe('API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls service correctly', async () => {
    mockService.getUserSessions.mockResolvedValue([])
    
    const result = await mockService.getUserSessions('user-id')
    
    expect(mockService.getUserSessions).toHaveBeenCalledWith('user-id')
    expect(result).toEqual([])
  })
})
```

## Mocking Strategy

### Automatic Mocks

The following are automatically mocked in `jest.setup.js`:
- Next.js router and navigation
- Next.js Image and Link components
- Supabase client (browser and server)
- Fetch API
- Browser APIs (IntersectionObserver, ResizeObserver, etc.)
- Local/Session Storage
- Console methods (filtered for noise reduction)

### Custom Mocks

For component-specific mocking:

```tsx
// Mock a specific module
jest.mock('@/lib/my-module', () => ({
  myFunction: jest.fn(() => 'mocked result'),
}))

// Mock with implementation
jest.mock('@/hooks/useMyHook', () => ({
  useMyHook: () => ({
    data: 'mocked data',
    loading: false,
    error: null,
  }),
}))
```

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** on a single behavior

### Test Data

1. **Use factories** for creating test data
2. **Make tests independent** - don't rely on shared state
3. **Use realistic data** that matches production scenarios
4. **Clean up after tests** to prevent side effects

### Assertions

1. **Use specific matchers** from jest-dom
2. **Test user-visible behavior** rather than implementation details
3. **Use semantic queries** (getByRole, getByLabelText, etc.)
4. **Test accessibility** with appropriate ARIA queries

### Performance

1. **Mock heavy dependencies** to keep tests fast
2. **Use `beforeEach`/`afterEach`** for setup/cleanup
3. **Avoid unnecessary re-renders** in component tests
4. **Use `waitFor`** for async operations

## Coverage Requirements

Current coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Excluded from Coverage

- Configuration files
- Next.js special files (layout.tsx, loading.tsx, etc.)
- Type definition files
- Test files themselves

## Debugging Tests

### Common Issues

1. **Act Warnings**: Wrap state updates in `act()`
2. **Async Operations**: Use `waitFor` or `findBy` queries
3. **Mock Issues**: Check mock implementations and calls
4. **Environment Variables**: Ensure test env vars are set

### Debug Commands

```bash
# Run specific test file
npm test -- MyComponent.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Run with verbose output
npm test -- --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VS Code Integration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Release branches

### CI Configuration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:coverage
```

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing** with Chromatic
2. **Performance Testing** with Lighthouse CI
3. **Accessibility Testing** with axe-core
4. **Contract Testing** with Pact
5. **Mutation Testing** with Stryker

### Integration Opportunities

1. **Storybook Integration** for component testing
2. **MSW Integration** for API mocking
3. **Testing Library Queries** for better accessibility testing
4. **Playwright Component Testing** for complex interactions
