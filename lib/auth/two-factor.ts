import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';
import { env } from '@/lib/config/environment';
import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

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
  backupCodeUsed?: boolean;
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  backupCodesRemaining?: number;
}

// Server-side two-factor authentication utilities
export class TwoFactorService {
  private supabase = createClient();

  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
    try {
      // Check if 2FA is already enabled
      const { data: existingSetup } = await (await this.supabase)
        .from('user_two_factor')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .single();

      if (existingSetup) {
        return {
          success: false,
          error: 'Two-factor authentication is already enabled',
        };
      }

      // Get user profile for display name
      const { data: profile } = await (await this.supabase)
        .from('profiles')
        .select('display_name, email')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Generate secret
      const secret = new Secret({ size: 32 });
      const totp = new TOTP({
        issuer: env.communityName,
        label: profile.email || profile.display_name,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store in database (not enabled yet)
      const { error: insertError } = await (await this.supabase)
        .from('user_two_factor')
        .upsert({
          user_id: userId,
          secret: secret.base32,
          backup_codes: backupCodes,
          is_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(totp.toString());

      captureMessage('2FA setup initiated', 'info', {
        userId,
        hasBackupCodes: backupCodes.length > 0,
      });

      return {
        success: true,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup 2FA';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        operation: 'setup_2fa',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async enableTwoFactor(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    try {
      // Get the setup data
      const { data: twoFactorData, error: fetchError } = await (await this.supabase)
        .from('user_two_factor')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', false)
        .single();

      if (fetchError || !twoFactorData) {
        return {
          success: false,
          message: 'No pending 2FA setup found',
          error: 'Setup not found',
        };
      }

      // Verify the token
      const isValid = this.verifyTOTPToken(twoFactorData.secret, token);
      
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid verification code',
          error: 'Invalid token',
        };
      }

      // Enable 2FA
      const { error: updateError } = await (await this.supabase)
        .from('user_two_factor')
        .update({
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Log the enablement
      await this.logTwoFactorEvent(userId, 'enabled', true);

      captureMessage('2FA enabled successfully', 'info', {
        userId,
      });

      return {
        success: true,
        message: 'Two-factor authentication enabled successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        operation: 'enable_2fa',
      });

      return {
        success: false,
        message: 'Failed to enable two-factor authentication',
        error: errorMessage,
      };
    }
  }

  async verifyTwoFactor(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    try {
      // Get user's 2FA data
      const { data: twoFactorData, error: fetchError } = await (await this.supabase)
        .from('user_two_factor')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .single();

      if (fetchError || !twoFactorData) {
        return {
          success: false,
          message: 'Two-factor authentication not enabled',
          error: '2FA not enabled',
        };
      }

      // First try TOTP verification
      const isTOTPValid = this.verifyTOTPToken(twoFactorData.secret, token);
      
      if (isTOTPValid) {
        await this.logTwoFactorEvent(userId, 'verified', true, 'totp');
        
        return {
          success: true,
          message: 'Two-factor authentication verified',
        };
      }

      // Try backup code verification
      const backupCodes = twoFactorData.backup_codes || [];
      const backupCodeIndex = backupCodes.findIndex(code => code === token);
      
      if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedBackupCodes = backupCodes.filter((_, index) => index !== backupCodeIndex);
        
        await (await this.supabase)
          .from('user_two_factor')
          .update({
            backup_codes: updatedBackupCodes,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        await this.logTwoFactorEvent(userId, 'verified', true, 'backup_code');

        return {
          success: true,
          message: 'Backup code verified successfully',
          backupCodeUsed: true,
        };
      }

      // Log failed attempt
      await this.logTwoFactorEvent(userId, 'verified', false);

      return {
        success: false,
        message: 'Invalid verification code',
        error: 'Invalid token',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify 2FA';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        operation: 'verify_2fa',
      });

      return {
        success: false,
        message: 'Failed to verify two-factor authentication',
        error: errorMessage,
      };
    }
  }

  async disableTwoFactor(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    try {
      // First verify the current token
      const verifyResult = await this.verifyTwoFactor(userId, token);
      
      if (!verifyResult.success) {
        return verifyResult;
      }

      // Disable 2FA
      const { error: updateError } = await (await this.supabase)
        .from('user_two_factor')
        .update({
          is_enabled: false,
          disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      await this.logTwoFactorEvent(userId, 'disabled', true);

      captureMessage('2FA disabled', 'info', {
        userId,
      });

      return {
        success: true,
        message: 'Two-factor authentication disabled successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable 2FA';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        operation: 'disable_2fa',
      });

      return {
        success: false,
        message: 'Failed to disable two-factor authentication',
        error: errorMessage,
      };
    }
  }

  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const { data: twoFactorData } = await (await this.supabase)
        .from('user_two_factor')
        .select('is_enabled, backup_codes')
        .eq('user_id', userId)
        .single();

      if (!twoFactorData) {
        return {
          isEnabled: false,
          hasBackupCodes: false,
        };
      }

      return {
        isEnabled: twoFactorData.is_enabled,
        hasBackupCodes: (twoFactorData.backup_codes || []).length > 0,
        backupCodesRemaining: (twoFactorData.backup_codes || []).length,
      };

    } catch (error) {
      console.warn('Failed to get 2FA status:', error);
      return {
        isEnabled: false,
        hasBackupCodes: false,
      };
    }
  }

  async regenerateBackupCodes(userId: string, token: string): Promise<TwoFactorSetupResult> {
    try {
      // Verify current token first
      const verifyResult = await this.verifyTwoFactor(userId, token);
      
      if (!verifyResult.success) {
        return {
          success: false,
          error: 'Invalid verification code',
        };
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();

      // Update in database
      const { error: updateError } = await (await this.supabase)
        .from('user_two_factor')
        .update({
          backup_codes: backupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      await this.logTwoFactorEvent(userId, 'backup_codes_regenerated', true);

      return {
        success: true,
        backupCodes,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate backup codes';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        operation: 'regenerate_backup_codes',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private verifyTOTPToken(secret: string, token: string): boolean {
    try {
      const totp = new TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secret),
      });

      // Allow for time drift (check current and previous/next periods)
      const currentTime = Math.floor(Date.now() / 1000);
      const periods = [-1, 0, 1]; // Previous, current, next 30-second periods

      for (const period of periods) {
        const timeStep = currentTime + (period * 30);
        const expectedToken = totp.generate({ timestamp: timeStep * 1000 });
        
        if (expectedToken === token) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric codes
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  private async logTwoFactorEvent(
    userId: string,
    action: string,
    success: boolean,
    method?: string
  ): Promise<void> {
    try {
      await (await this.supabase)
        .from('two_factor_log')
        .insert({
          user_id: userId,
          action,
          success,
          method,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.warn('Failed to log 2FA event:', error);
    }
  }
}

// Client-side two-factor authentication utilities
export class ClientTwoFactorService {
  private supabase = createBrowserClient();

  async setupTwoFactor(): Promise<TwoFactorSetupResult> {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup 2FA');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup 2FA';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async enableTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enable 2FA');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA';
      
      return {
        success: false,
        message: 'Failed to enable two-factor authentication',
        error: errorMessage,
      };
    }
  }

  async verifyTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify 2FA');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify 2FA';
      
      return {
        success: false,
        message: 'Failed to verify two-factor authentication',
        error: errorMessage,
      };
    }
  }

  async disableTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to disable 2FA');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable 2FA';
      
      return {
        success: false,
        message: 'Failed to disable two-factor authentication',
        error: errorMessage,
      };
    }
  }

  async getTwoFactorStatus(): Promise<TwoFactorStatus> {
    try {
      const response = await fetch('/api/auth/2fa/status');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get 2FA status');
      }

      return result;
    } catch (error) {
      console.error('Failed to get 2FA status:', error);
      return {
        isEnabled: false,
        hasBackupCodes: false,
      };
    }
  }

  async regenerateBackupCodes(token: string): Promise<TwoFactorSetupResult> {
    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to regenerate backup codes');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate backup codes';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Export singleton instances
export const twoFactorService = new TwoFactorService();
export const clientTwoFactorService = new ClientTwoFactorService();
