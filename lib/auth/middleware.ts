import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Authentication middleware wrapper
 */
export function withAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Add user to request context
      const requestWithUser = new NextRequest(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-user-id': session.user.id,
          'x-user-email': session.user.email || '',
        },
        body: request.body,
      });

      return handler(requestWithUser, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Require authentication middleware
 */
export function requireAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler);
}

/**
 * Optional authentication middleware
 */
export function optionalAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // Add user to request context if authenticated
      if (session?.user) {
        const requestWithUser = new NextRequest(request.url, {
          method: request.method,
          headers: {
            ...Object.fromEntries(request.headers.entries()),
            'x-user-id': session.user.id,
            'x-user-email': session.user.email || '',
          },
          body: request.body,
        });

        return handler(requestWithUser, context);
      }

      return handler(request, context);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      return handler(request, context);
    }
  };
}

/**
 * Admin authentication middleware
 */
export function requireAdmin(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Add user to request context
      const requestWithUser = new NextRequest(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-user-id': session.user.id,
          'x-user-email': session.user.email || '',
          'x-user-admin': 'true',
        },
        body: request.body,
      });

      return handler(requestWithUser, context);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}
