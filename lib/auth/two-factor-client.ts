'use client';

import { createClient } from '@/lib/supabase/client';
import { TOTP } from 'otpauth';

export interface TwoFactorSetupResult {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  error?: string;
}

export interface TwoFactorVerifyResult {
  success: boolean;
  message: string;
  error?: string;
}

export class ClientTwoFactorService {
  private supabase = createClient();

  // Verify TOTP token (client-side)
  async verifyTOTP(token: string): Promise<TwoFactorVerifyResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Call server API to verify
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return { 
        success: false, 
        message: 'Failed to verify token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Verify backup code (client-side)
  async verifyBackupCode(code: string): Promise<TwoFactorVerifyResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Call server API to verify backup code
      const response = await fetch('/api/auth/2fa/verify-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return { 
        success: false, 
        message: 'Failed to verify backup code',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Setup 2FA (client-side)
  async setup2FA(): Promise<TwoFactorSetupResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Call server API to setup 2FA
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enable 2FA (client-side)
  async enable2FA(token: string): Promise<TwoFactorVerifyResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Call server API to enable 2FA
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return { 
        success: false, 
        message: 'Failed to enable 2FA',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Disable 2FA (client-side)
  async disable2FA(token: string): Promise<TwoFactorVerifyResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Call server API to disable 2FA
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { 
        success: false, 
        message: 'Failed to disable 2FA',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if user has 2FA enabled (client-side)
  async is2FAEnabled(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('id', user.id)
        .single();

      return profile?.two_factor_enabled || false;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  // Generate backup codes (client-side)
  async generateBackupCodes(): Promise<string[]> {
    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.backupCodes || [];
    } catch (error) {
      console.error('Error generating backup codes:', error);
      return [];
    }
  }

  // Validate TOTP token format
  validateTOTPFormat(token: string): boolean {
    return /^\d{6}$/.test(token);
  }

  // Validate backup code format
  validateBackupCodeFormat(code: string): boolean {
    return /^[A-Z0-9]{8}$/.test(code.toUpperCase());
  }
}

// Export singleton instance
export const clientTwoFactorService = new ClientTwoFactorService();
