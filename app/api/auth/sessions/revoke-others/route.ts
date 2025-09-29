import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionManagementService } from '@/lib/auth/session-management';
import { withRateLimit } from '@/lib/security/rate-limit';
import { withCSRFProtection } from '@/lib/security/csrf';

async function handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session ID from cookies or headers
    const currentSessionId = request.cookies.get('session_id')?.value || 
                            request.headers.get('x-session-id') || 
                            'current_session';

    const result = await sessionManagementService.revokeAllOtherSessions(currentSessionId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Revoke other sessions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting and CSRF protection
export const POST = withCSRFProtection(withRateLimit(handler));
