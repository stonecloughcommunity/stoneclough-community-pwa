import { NextRequest, NextResponse } from 'next/server';
import { emailVerificationService } from '@/lib/auth/email-verification';
import { withRateLimit } from '@/lib/security/rate-limit';

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await emailVerificationService.verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || result.message,
          needsVerification: result.needsVerification 
        },
        { status: 400 }
      );
    }

    // Redirect to success page
    const redirectUrl = new URL('/auth/verification-success', request.url);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting
export const GET = withRateLimit(handler);
export const POST = withRateLimit(handler);
