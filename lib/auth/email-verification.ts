import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';
import { env } from '@/lib/config/environment';

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  error?: string;
  needsVerification?: boolean;
}

export interface ResendVerificationResult {
  success: boolean;
  message: string;
  error?: string;
  rateLimited?: boolean;
  nextAllowedTime?: Date;
}

// Server-side email verification utilities
export class EmailVerificationService {
  private supabase = createClient();

  async checkVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    email: string | null;
    lastVerificationSent?: Date;
  }> {
    try {
      const { data: user, error } = await (await this.supabase).auth.admin.getUserById(userId);
      
      if (error || !user) {
        throw new Error('User not found');
      }

      return {
        isVerified: !!user.user.email_confirmed_at,
        email: user.user.email,
        lastVerificationSent: user.user.confirmation_sent_at ? new Date(user.user.confirmation_sent_at) : undefined,
      };
    } catch (error) {
      captureException(error instanceof Error ? error : new Error('Failed to check verification status'), {
        userId,
      });
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
    try {
      // Check rate limiting for verification emails
      const rateLimitKey = `email_verification:${email}`;
      const lastSent = await this.getLastVerificationTime(email);
      
      if (lastSent) {
        const timeSinceLastSent = Date.now() - lastSent.getTime();
        const minInterval = 5 * 60 * 1000; // 5 minutes
        
        if (timeSinceLastSent < minInterval) {
          const nextAllowedTime = new Date(lastSent.getTime() + minInterval);
          return {
            success: false,
            message: 'Please wait before requesting another verification email',
            rateLimited: true,
            nextAllowedTime,
          };
        }
      }

      const { error } = await (await this.supabase).auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${env.appUrl}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // Log successful resend
      await this.logVerificationAttempt(email, 'resend', true);

      captureMessage('Email verification resent successfully', 'info', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
      });

      return {
        success: true,
        message: 'Verification email sent successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        operation: 'resend_verification',
      });

      // Log failed resend
      await this.logVerificationAttempt(email, 'resend', false, errorMessage);

      return {
        success: false,
        message: 'Failed to send verification email',
        error: errorMessage,
      };
    }
  }

  async verifyEmailToken(token: string): Promise<EmailVerificationResult> {
    try {
      const { data, error } = await (await this.supabase).auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user found for verification token');
      }

      // Log successful verification
      await this.logVerificationAttempt(data.user.email || '', 'verify', true);

      captureMessage('Email verification completed successfully', 'info', {
        userId: data.user.id,
      });

      return {
        success: true,
        message: 'Email verified successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        token: token.substring(0, 10) + '...', // Log partial token for debugging
        operation: 'verify_email',
      });

      return {
        success: false,
        message: 'Email verification failed',
        error: errorMessage,
      };
    }
  }

  private async getLastVerificationTime(email: string): Promise<Date | null> {
    try {
      const { data, error } = await (await this.supabase)
        .from('email_verification_log')
        .select('created_at')
        .eq('email', email)
        .eq('action', 'resend')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.created_at);
    } catch (error) {
      console.warn('Failed to get last verification time:', error);
      return null;
    }
  }

  private async logVerificationAttempt(
    email: string,
    action: 'send' | 'resend' | 'verify',
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await (await this.supabase)
        .from('email_verification_log')
        .insert({
          email,
          action,
          success,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.warn('Failed to log verification attempt:', error);
    }
  }
}

// Client-side email verification utilities
export class ClientEmailVerificationService {
  private supabase = createBrowserClient();

  async resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend verification email');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      
      return {
        success: false,
        message: 'Failed to send verification email',
        error: errorMessage,
      };
    }
  }

  async checkVerificationStatus(): Promise<{
    isVerified: boolean;
    email: string | null;
  }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return { isVerified: false, email: null };
      }

      return {
        isVerified: !!user.email_confirmed_at,
        email: user.email,
      };
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return { isVerified: false, email: null };
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      return !!data.session;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }
}

// Export singleton instances
export const emailVerificationService = new EmailVerificationService();
export const clientEmailVerificationService = new ClientEmailVerificationService();
