import { NextRequest, NextResponse } from 'next/server';
import { passwordResetService } from '@/lib/auth/password-reset';
import { withRateLimit } from '@/lib/security/rate-limit';
import { withCSRFProtection } from '@/lib/security/csrf';

async function handler(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await passwordResetService.initiatePasswordReset(email);

    if (result.rateLimited) {
      return NextResponse.json(
        {
          error: result.message,
          rateLimited: true,
          nextAllowedTime: result.nextAllowedTime?.toISOString(),
        },
        { status: 429 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting and CSRF protection
export const POST = withCSRFProtection(withRateLimit(handler));
