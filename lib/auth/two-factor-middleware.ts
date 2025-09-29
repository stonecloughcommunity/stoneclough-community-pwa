import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface TwoFactorCheckResult {
  requiresTwoFactor: boolean;
  isVerified: boolean;
  redirectUrl?: string;
}

export async function checkTwoFactorRequirement(
  request: NextRequest
): Promise<TwoFactorCheckResult> {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        requiresTwoFactor: false,
        isVerified: false,
      };
    }

    // Check if user has 2FA enabled
    const { data: twoFactorData } = await supabase
      .from('user_two_factor')
      .select('is_enabled')
      .eq('user_id', user.id)
      .eq('is_enabled', true)
      .single();

    if (!twoFactorData) {
      // User doesn't have 2FA enabled
      return {
        requiresTwoFactor: false,
        isVerified: true,
      };
    }

    // Check if 2FA is already verified in this session
    const twoFactorVerified = request.cookies.get('2fa_verified')?.value;
    const sessionId = request.cookies.get('sb-access-token')?.value;

    if (twoFactorVerified && sessionId) {
      // Verify the 2FA verification is for the current session
      const verificationData = JSON.parse(
        Buffer.from(twoFactorVerified, 'base64').toString('utf-8')
      );

      if (
        verificationData.userId === user.id &&
        verificationData.sessionId === sessionId &&
        verificationData.expiresAt > Date.now()
      ) {
        return {
          requiresTwoFactor: true,
          isVerified: true,
        };
      }
    }

    // 2FA is required but not verified
    return {
      requiresTwoFactor: true,
      isVerified: false,
      redirectUrl: `/auth/2fa-verify?redirect=${encodeURIComponent(request.url)}`,
    };

  } catch (error) {
    console.error('2FA check error:', error);
    return {
      requiresTwoFactor: false,
      isVerified: false,
    };
  }
}

export function setTwoFactorVerified(
  response: NextResponse,
  userId: string,
  sessionId: string
): NextResponse {
  const verificationData = {
    userId,
    sessionId,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  const verificationToken = Buffer.from(
    JSON.stringify(verificationData)
  ).toString('base64');

  response.cookies.set('2fa_verified', verificationToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
}

export function clearTwoFactorVerification(response: NextResponse): NextResponse {
  response.cookies.delete('2fa_verified');
  return response;
}

// Middleware function to protect routes that require 2FA
export async function withTwoFactorAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const twoFactorCheck = await checkTwoFactorRequirement(request);

  if (twoFactorCheck.requiresTwoFactor && !twoFactorCheck.isVerified) {
    return NextResponse.redirect(new URL(twoFactorCheck.redirectUrl!, request.url));
  }

  return handler(request);
}

// Routes that should be protected with 2FA
export const TWO_FACTOR_PROTECTED_ROUTES = [
  '/settings',
  '/admin',
  '/profile/edit',
  '/api/admin',
  '/api/user/sensitive',
];

// Check if a route requires 2FA protection
export function requiresTwoFactorAuth(pathname: string): boolean {
  return TWO_FACTOR_PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
}
