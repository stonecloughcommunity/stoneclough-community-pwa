import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { twoFactorService } from '@/lib/auth/two-factor';
import { setTwoFactorVerified } from '@/lib/auth/two-factor-middleware';
import { withRateLimit } from '@/lib/security/rate-limit';
import { withCSRFProtection } from '@/lib/security/csrf';

async function handler(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await twoFactorService.verifyTwoFactor(user.id, token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    // Set 2FA verification cookie
    const response = NextResponse.json({
      success: true,
      message: result.message,
      backupCodeUsed: result.backupCodeUsed,
    });

    const sessionId = request.cookies.get('sb-access-token')?.value || '';
    return setTwoFactorVerified(response, user.id, sessionId);

  } catch (error) {
    console.error('2FA verify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting and CSRF protection
export const POST = withCSRFProtection(withRateLimit(handler));
