import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config/environment";

// Custom error types for better categorization
export class DatabaseError extends Error {
  constructor(message: string, public query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public userId?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public endpoint?: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Utility functions for error reporting
export function captureException(error: Error, context?: Record<string, any>) {
  if (!env.sentryDsn) {
    console.error('Error (Sentry not configured):', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    
    // Set user context if available
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Set tags for better filtering
    if (error instanceof DatabaseError) {
      scope.setTag('error_type', 'database');
      scope.setContext('database', { query: error.query });
    } else if (error instanceof AuthenticationError) {
      scope.setTag('error_type', 'authentication');
      scope.setContext('auth', { userId: error.userId });
    } else if (error instanceof ValidationError) {
      scope.setTag('error_type', 'validation');
      scope.setContext('validation', { field: error.field });
    } else if (error instanceof RateLimitError) {
      scope.setTag('error_type', 'rate_limit');
      scope.setContext('rate_limit', { endpoint: error.endpoint });
    }
    
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (!env.sentryDsn) {
    console.log(`Message (${level}):`, message, context);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    
    Sentry.captureMessage(message);
  });
}

// Performance monitoring utilities
export function startTransaction(name: string, op: string) {
  if (!env.sentryDsn) {
    return {
      setTag: () => {},
      setData: () => {},
      finish: () => {},
    };
  }

  return Sentry.startTransaction({ name, op });
}

export function addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
  if (!env.sentryDsn) {
    console.log(`Breadcrumb (${category}):`, message, data);
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

// User context management
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.setUser(user);
}

export function clearUserContext() {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.setUser(null);
}

// Custom tags for better error categorization
export function setCustomTags(tags: Record<string, string>) {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.withScope((scope) => {
    Object.keys(tags).forEach((key) => {
      scope.setTag(key, tags[key]);
    });
  });
}

// Error boundary helper
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
): T {
  if (!env.sentryDsn) {
    return Component;
  }

  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || (({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={resetError}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    )),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('error_boundary', true);
      scope.setContext('error_info', errorInfo);
    },
  }) as T;
}

// API route error handler
export function withSentryAPI<T extends (...args: any[]) => any>(handler: T): T {
  if (!env.sentryDsn) {
    return handler;
  }

  return Sentry.wrapApiHandlerWithSentry(handler, '/api/') as T;
}

// Database operation wrapper
export async function withDatabaseMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  query?: string
): Promise<T> {
  const transaction = startTransaction(`db.${operationName}`, 'db');
  
  if (query) {
    transaction.setData('query', query);
  }
  
  try {
    addBreadcrumb(`Starting database operation: ${operationName}`, 'database');
    const result = await operation();
    addBreadcrumb(`Completed database operation: ${operationName}`, 'database');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      captureException(new DatabaseError(error.message, query), {
        operation: operationName,
      });
    }
    throw error;
  } finally {
    transaction.finish();
  }
}
