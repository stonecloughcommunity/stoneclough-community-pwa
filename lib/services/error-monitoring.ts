// Error monitoring and reporting service for Stoneclough Community PWA
// Comprehensive error tracking, user feedback, and system health monitoring

import { createClient } from '@/lib/supabase/client';

export interface ErrorReport {
  id?: string;
  error_type: 'javascript' | 'network' | 'database' | 'auth' | 'validation' | 'user_reported';
  error_message: string;
  error_stack?: string;
  error_code?: string;
  user_id?: string;
  session_id: string;
  page_url: string;
  user_agent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  resolved: boolean;
  resolution_notes?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  response_time: number;
  error_rate: number;
  active_users: number;
  last_check: string;
  services: {
    database: 'up' | 'down' | 'slow';
    auth: 'up' | 'down' | 'slow';
    storage: 'up' | 'down' | 'slow';
    notifications: 'up' | 'down' | 'slow';
  };
}

export interface UserFeedback {
  id?: string;
  user_id?: string;
  feedback_type: 'bug' | 'feature_request' | 'general' | 'complaint' | 'praise';
  title: string;
  description: string;
  page_url?: string;
  screenshot_url?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

export class ErrorMonitoringService {
  private supabase = createClient();
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private isOnline = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
    this.setupNetworkMonitoring();
    this.startHealthChecks();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup global error handlers
  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        error_type: 'javascript',
        error_message: event.message,
        error_stack: event.error?.stack,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        severity: 'medium',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        error_type: 'javascript',
        error_message: `Unhandled Promise Rejection: ${event.reason}`,
        error_stack: event.reason?.stack,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        severity: 'high',
        context: {
          promise: event.promise,
          reason: event.reason,
        }
      });
    });

    // Network errors (fetch failures)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.reportError({
            error_type: 'network',
            error_message: `HTTP ${response.status}: ${response.statusText}`,
            error_code: response.status.toString(),
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              url: args[0],
              method: args[1]?.method || 'GET',
              status: response.status,
              statusText: response.statusText,
            }
          });
        }
        
        return response;
      } catch (error) {
        this.reportError({
          error_type: 'network',
          error_message: `Network Error: ${error.message}`,
          error_stack: error.stack,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          severity: 'high',
          context: {
            url: args[0],
            method: args[1]?.method || 'GET',
          }
        });
        throw error;
      }
    };
  }

  // Setup network monitoring
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
      this.reportError({
        error_type: 'network',
        error_message: 'Connection restored',
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        severity: 'low',
        context: { event: 'online' }
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.reportError({
        error_type: 'network',
        error_message: 'Connection lost',
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        severity: 'medium',
        context: { event: 'offline' }
      });
    });
  }

  // Start periodic health checks
  private startHealthChecks(): void {
    if (typeof window === 'undefined') return;

    setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Report an error
  async reportError(errorData: Partial<ErrorReport>): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const error: ErrorReport = {
        error_type: errorData.error_type || 'javascript',
        error_message: errorData.error_message || 'Unknown error',
        error_stack: errorData.error_stack,
        error_code: errorData.error_code,
        user_id: user?.id,
        session_id: this.sessionId,
        page_url: errorData.page_url || (typeof window !== 'undefined' ? window.location.href : ''),
        user_agent: errorData.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        timestamp: new Date().toISOString(),
        severity: errorData.severity || 'medium',
        context: errorData.context,
        resolved: false,
      };

      if (this.isOnline) {
        await this.sendErrorReport(error);
      } else {
        this.errorQueue.push(error);
      }
    } catch (err) {
      console.error('Failed to report error:', err);
      // Store in local storage as fallback
      this.storeErrorLocally(errorData);
    }
  }

  // Send error report to database
  private async sendErrorReport(error: ErrorReport): Promise<void> {
    const { error: dbError } = await this.supabase
      .from('error_reports')
      .insert(error);

    if (dbError) {
      console.error('Failed to store error report:', dbError);
      this.storeErrorLocally(error);
    }
  }

  // Store error locally when database is unavailable
  private storeErrorLocally(error: Partial<ErrorReport>): void {
    try {
      const localErrors = JSON.parse(localStorage.getItem('stoneclough-errors') || '[]');
      localErrors.push({
        ...error,
        timestamp: new Date().toISOString(),
        stored_locally: true,
      });
      
      // Keep only last 50 errors
      if (localErrors.length > 50) {
        localErrors.splice(0, localErrors.length - 50);
      }
      
      localStorage.setItem('stoneclough-errors', JSON.stringify(localErrors));
    } catch (err) {
      console.error('Failed to store error locally:', err);
    }
  }

  // Flush error queue when back online
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      for (const error of this.errorQueue) {
        await this.sendErrorReport(error);
      }
      this.errorQueue = [];
      
      // Also flush locally stored errors
      await this.flushLocalErrors();
    } catch (err) {
      console.error('Failed to flush error queue:', err);
    }
  }

  // Flush locally stored errors
  private async flushLocalErrors(): Promise<void> {
    try {
      const localErrors = JSON.parse(localStorage.getItem('stoneclough-errors') || '[]');
      
      for (const error of localErrors) {
        if (error.stored_locally) {
          delete error.stored_locally;
          await this.sendErrorReport(error);
        }
      }
      
      localStorage.removeItem('stoneclough-errors');
    } catch (err) {
      console.error('Failed to flush local errors:', err);
    }
  }

  // Perform system health check
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const dbStart = Date.now();
      const { error: dbError } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const dbTime = Date.now() - dbStart;

      // Test auth service
      const authStart = Date.now();
      const { error: authError } = await this.supabase.auth.getUser();
      const authTime = Date.now() - authStart;

      // Get error rate from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { count: errorCount } = await this.supabase
        .from('error_reports')
        .select('id', { count: 'exact' })
        .gte('timestamp', oneHourAgo.toISOString());

      // Get active users count
      const { count: activeUsers } = await this.supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact' })
        .gte('timestamp', oneHourAgo.toISOString());

      const responseTime = Date.now() - startTime;
      const errorRate = errorCount ? (errorCount / Math.max(activeUsers || 1, 1)) * 100 : 0;

      const health: SystemHealth = {
        status: errorRate > 10 ? 'degraded' : responseTime > 5000 ? 'degraded' : 'healthy',
        uptime: this.calculateUptime(),
        response_time: responseTime,
        error_rate: errorRate,
        active_users: activeUsers || 0,
        last_check: new Date().toISOString(),
        services: {
          database: dbError ? 'down' : dbTime > 2000 ? 'slow' : 'up',
          auth: authError ? 'down' : authTime > 2000 ? 'slow' : 'up',
          storage: 'up', // Would need actual storage test
          notifications: 'up', // Would need actual notification test
        }
      };

      // Store health check result
      await this.supabase
        .from('system_health')
        .insert({
          status: health.status,
          response_time: health.response_time,
          error_rate: health.error_rate,
          active_users: health.active_users,
          services: health.services,
          timestamp: health.last_check,
        });

      return health;
    } catch (error) {
      const health: SystemHealth = {
        status: 'down',
        uptime: 0,
        response_time: Date.now() - startTime,
        error_rate: 100,
        active_users: 0,
        last_check: new Date().toISOString(),
        services: {
          database: 'down',
          auth: 'down',
          storage: 'down',
          notifications: 'down',
        }
      };

      console.error('Health check failed:', error);
      return health;
    }
  }

  // Calculate system uptime
  private calculateUptime(): number {
    // This would typically be calculated from deployment time
    // For now, return a mock value
    return 99.9;
  }

  // Submit user feedback
  async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const feedbackData: Partial<UserFeedback> = {
        ...feedback,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('user_feedback')
        .insert(feedbackData);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  // Get error reports (admin only)
  async getErrorReports(
    filters?: {
      severity?: string;
      error_type?: string;
      resolved?: boolean;
      limit?: number;
    }
  ): Promise<ErrorReport[]> {
    try {
      let query = this.supabase
        .from('error_reports')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters?.error_type) {
        query = query.eq('error_type', filters.error_type);
      }
      
      if (filters?.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved);
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get error reports:', error);
      return [];
    }
  }

  // Get user feedback (admin only)
  async getUserFeedback(
    filters?: {
      feedback_type?: string;
      status?: string;
      priority?: string;
      limit?: number;
    }
  ): Promise<UserFeedback[]> {
    try {
      let query = this.supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.feedback_type) {
        query = query.eq('feedback_type', filters.feedback_type);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return [];
    }
  }

  // Mark error as resolved (admin only)
  async resolveError(errorId: string, resolutionNotes?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('error_reports')
        .update({
          resolved: true,
          resolution_notes: resolutionNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', errorId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to resolve error:', error);
      throw error;
    }
  }

  // Initialize error monitoring
  static initialize(): ErrorMonitoringService {
    return new ErrorMonitoringService();
  }
}
