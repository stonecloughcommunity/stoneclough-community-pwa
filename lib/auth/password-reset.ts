import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';
import { env } from '@/lib/config/environment';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
  rateLimited?: boolean;
  nextAllowedTime?: Date;
}

export interface PasswordUpdateResult {
  success: boolean;
  message: string;
  error?: string;
  needsReauth?: boolean;
}

// Server-side password reset utilities
export class PasswordResetService {
  private supabase = createClient();

  async initiatePasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      // Check rate limiting for password reset requests
      const lastReset = await this.getLastResetTime(email);
      
      if (lastReset) {
        const timeSinceLastReset = Date.now() - lastReset.getTime();
        const minInterval = 15 * 60 * 1000; // 15 minutes
        
        if (timeSinceLastReset < minInterval) {
          const nextAllowedTime = new Date(lastReset.getTime() + minInterval);
          return {
            success: false,
            message: 'Please wait before requesting another password reset',
            rateLimited: true,
            nextAllowedTime,
          };
        }
      }

      // Check if user exists (but don't reveal this information for security)
      const { data: user } = await (await this.supabase).auth.admin.getUserByEmail(email);
      
      // Always send the reset email request to avoid user enumeration
      const { error } = await (await this.supabase).auth.resetPasswordForEmail(email, {
        redirectTo: `${env.appUrl}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      // Log the reset attempt
      await this.logPasswordResetAttempt(email, 'initiate', true, user?.user?.id);

      captureMessage('Password reset initiated', 'info', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
        userExists: !!user,
      });

      return {
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate password reset';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        operation: 'initiate_password_reset',
      });

      // Log failed attempt
      await this.logPasswordResetAttempt(email, 'initiate', false, undefined, errorMessage);

      return {
        success: false,
        message: 'Failed to send password reset email',
        error: errorMessage,
      };
    }
  }

  async updatePassword(accessToken: string, newPassword: string): Promise<PasswordUpdateResult> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password does not meet security requirements',
          error: passwordValidation.errors.join(', '),
        };
      }

      const { data, error } = await (await this.supabase).auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user found for password update');
      }

      // Log successful password update
      await this.logPasswordResetAttempt(data.user.email || '', 'complete', true, data.user.id);

      captureMessage('Password updated successfully', 'info', {
        userId: data.user.id,
      });

      return {
        success: true,
        message: 'Password updated successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        operation: 'update_password',
      });

      return {
        success: false,
        message: 'Failed to update password',
        error: errorMessage,
      };
    }
  }

  private validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async getLastResetTime(email: string): Promise<Date | null> {
    try {
      const { data, error } = await (await this.supabase)
        .from('password_reset_log')
        .select('created_at')
        .eq('email', email)
        .eq('action', 'initiate')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.created_at);
    } catch (error) {
      console.warn('Failed to get last reset time:', error);
      return null;
    }
  }

  private async logPasswordResetAttempt(
    email: string,
    action: 'initiate' | 'complete' | 'verify',
    success: boolean,
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await (await this.supabase)
        .from('password_reset_log')
        .insert({
          email,
          action,
          success,
          user_id: userId,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.warn('Failed to log password reset attempt:', error);
    }
  }
}

// Client-side password reset utilities
export class ClientPasswordResetService {
  private supabase = createBrowserClient();

  async initiatePasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate password reset');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate password reset';
      
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: errorMessage,
      };
    }
  }

  async updatePassword(newPassword: string): Promise<PasswordUpdateResult> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      
      return {
        success: false,
        message: 'Failed to update password',
        error: errorMessage,
        needsReauth: errorMessage.includes('session') || errorMessage.includes('token'),
      };
    }
  }

  async verifyResetToken(): Promise<{ isValid: boolean; user: any | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return { isValid: false, user: null };
      }

      return { isValid: true, user };
    } catch (error) {
      console.error('Failed to verify reset token:', error);
      return { isValid: false, user: null };
    }
  }
}

// Export singleton instances
export const passwordResetService = new PasswordResetService();
export const clientPasswordResetService = new ClientPasswordResetService();
