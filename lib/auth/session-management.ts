import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';
import { clearTwoFactorVerification } from '@/lib/auth/two-factor-middleware';
import { NextResponse } from 'next/server';

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  location?: string;
}

export interface SessionManagementResult {
  success: boolean;
  message: string;
  error?: string;
  sessions?: SessionInfo[];
}

// Server-side session management utilities
export class SessionManagementService {
  private supabase = createClient();

  async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceInfo?: string
  ): Promise<{ sessionId: string; expiresAt: Date }> {
    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      
      // Store session in database
      const { error } = await (await this.supabase)
        .from('user_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          device_info: deviceInfo || this.parseDeviceInfo(userAgent),
          ip_address: ipAddress,
          user_agent: userAgent,
          last_activity: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Clean up old sessions for this user
      await this.cleanupOldSessions(userId);

      captureMessage('Session created', 'info', {
        userId,
        sessionId,
        deviceInfo: deviceInfo || this.parseDeviceInfo(userAgent),
      });

      return { sessionId, expiresAt };

    } catch (error) {
      captureException(error instanceof Error ? error : new Error('Failed to create session'), {
        userId,
        operation: 'create_session',
      });
      throw error;
    }
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const { error } = await (await this.supabase)
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.warn('Failed to update session activity:', error);
    }
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data, error } = await (await this.supabase)
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(session => ({
        id: session.id,
        userId: session.user_id,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        lastActivity: new Date(session.last_activity),
        expiresAt: new Date(session.expires_at),
        isActive: session.is_active,
        location: session.location,
      }));

    } catch (error) {
      captureException(error instanceof Error ? error : new Error('Failed to get user sessions'), {
        userId,
        operation: 'get_user_sessions',
      });
      return [];
    }
  }

  async revokeSession(sessionId: string, userId: string): Promise<SessionManagementResult> {
    try {
      const { error } = await (await this.supabase)
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      captureMessage('Session revoked', 'info', {
        userId,
        sessionId,
      });

      return {
        success: true,
        message: 'Session revoked successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke session';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        sessionId,
        operation: 'revoke_session',
      });

      return {
        success: false,
        message: 'Failed to revoke session',
        error: errorMessage,
      };
    }
  }

  async revokeAllOtherSessions(currentSessionId: string, userId: string): Promise<SessionManagementResult> {
    try {
      const { error } = await (await this.supabase)
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .neq('id', currentSessionId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      captureMessage('All other sessions revoked', 'info', {
        userId,
        currentSessionId,
      });

      return {
        success: true,
        message: 'All other sessions revoked successfully',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke sessions';
      
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        userId,
        currentSessionId,
        operation: 'revoke_all_other_sessions',
      });

      return {
        success: false,
        message: 'Failed to revoke other sessions',
        error: errorMessage,
      };
    }
  }

  async validateSession(sessionId: string): Promise<{
    isValid: boolean;
    userId?: string;
    needsRefresh?: boolean;
  }> {
    try {
      const { data, error } = await (await this.supabase)
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { isValid: false };
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      const lastActivity = new Date(data.last_activity);

      // Check if session has expired
      if (now > expiresAt) {
        await this.revokeSession(sessionId, data.user_id);
        return { isValid: false };
      }

      // Check if session needs refresh (inactive for more than 1 hour)
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const needsRefresh = lastActivity < oneHourAgo;

      if (needsRefresh) {
        await this.updateSessionActivity(sessionId);
      }

      return {
        isValid: true,
        userId: data.user_id,
        needsRefresh,
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return { isValid: false };
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const { error } = await (await this.supabase)
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  private async cleanupOldSessions(userId: string): Promise<void> {
    try {
      // Keep only the 10 most recent sessions per user
      const { data: sessions } = await (await this.supabase)
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })
        .range(10, 1000); // Get sessions beyond the first 10

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        await (await this.supabase)
          .from('user_sessions')
          .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
          })
          .in('id', sessionIds);
      }
    } catch (error) {
      console.warn('Failed to cleanup old sessions:', error);
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private parseDeviceInfo(userAgent: string): string {
    // Simple device detection
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPhone/.test(userAgent)) return 'iPhone';
      if (/iPad/.test(userAgent)) return 'iPad';
      if (/Android/.test(userAgent)) return 'Android Device';
      return 'Mobile Device';
    }
    
    if (/Windows/.test(userAgent)) return 'Windows Computer';
    if (/Mac/.test(userAgent)) return 'Mac Computer';
    if (/Linux/.test(userAgent)) return 'Linux Computer';
    
    return 'Unknown Device';
  }
}

// Client-side session management utilities
export class ClientSessionManagementService {
  private supabase = createBrowserClient();

  async getSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch('/api/auth/sessions');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get sessions');
      }

      return result.sessions || [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  async revokeSession(sessionId: string): Promise<SessionManagementResult> {
    try {
      const response = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke session');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke session';
      
      return {
        success: false,
        message: 'Failed to revoke session',
        error: errorMessage,
      };
    }
  }

  async revokeAllOtherSessions(): Promise<SessionManagementResult> {
    try {
      const response = await fetch('/api/auth/sessions/revoke-others', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke other sessions');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke other sessions';
      
      return {
        success: false,
        message: 'Failed to revoke other sessions',
        error: errorMessage,
      };
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

  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }
}

// Utility function to clear all session-related data
export function clearSessionData(response: NextResponse): NextResponse {
  // Clear 2FA verification
  clearTwoFactorVerification(response);
  
  // Clear other session cookies if any
  response.cookies.delete('session_id');
  
  return response;
}

// Export singleton instances
export const sessionManagementService = new SessionManagementService();
export const clientSessionManagementService = new ClientSessionManagementService();
