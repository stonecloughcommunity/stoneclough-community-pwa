'use client';

import { createClient } from '@/lib/supabase/client';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface PasswordUpdateResult {
  success: boolean;
  message: string;
  error?: string;
}

export class ClientPasswordResetService {
  private supabase = createClient();

  // Request password reset (client-side)
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address',
          error: 'Invalid email format'
        };
      }

      // Call server API to request password reset
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to send password reset email',
          error: result.error
        };
      }

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update password with reset token (client-side)
  async updatePasswordWithToken(
    token: string, 
    newPassword: string, 
    confirmPassword: string
  ): Promise<PasswordUpdateResult> {
    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match',
          error: 'Password mismatch'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
          error: 'Weak password'
        };
      }

      // Call server API to update password
      const response = await fetch('/api/auth/password-reset/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to update password',
          error: result.error
        };
      }

      return {
        success: true,
        message: 'Password updated successfully. You can now sign in with your new password.',
      };
    } catch (error) {
      console.error('Error updating password:', error);
      return {
        success: false,
        message: 'Failed to update password. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Change password for authenticated user (client-side)
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<PasswordUpdateResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'You must be signed in to change your password',
          error: 'Not authenticated'
        };
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          message: 'New passwords do not match',
          error: 'Password mismatch'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
          error: 'Weak password'
        };
      }

      // Call server API to change password
      const response = await fetch('/api/auth/password-reset/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to change password',
          error: result.error
        };
      }

      return {
        success: true,
        message: 'Password changed successfully.',
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        message: 'Failed to change password. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  private validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter'
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter'
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number'
      };
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character'
      };
    }

    return {
      isValid: true,
      message: 'Password is strong'
    };
  }

  // Check if password reset token is valid
  async validateResetToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/password-reset/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      return result.valid || false;
    } catch (error) {
      console.error('Error validating reset token:', error);
      return false;
    }
  }

  // Get password strength score (0-4)
  getPasswordStrength(password: string): number {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score++;
    
    return Math.min(score, 4);
  }

  // Get password strength label
  getPasswordStrengthLabel(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Unknown';
    }
  }

  // Get password strength color
  getPasswordStrengthColor(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return 'text-red-600';
      case 2:
        return 'text-orange-600';
      case 3:
        return 'text-yellow-600';
      case 4:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }
}

// Export singleton instance
export const clientPasswordResetService = new ClientPasswordResetService();
