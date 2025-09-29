// Analytics service for Stoneclough Community PWA
// Privacy-friendly analytics and community insights

import { createClient } from '@/lib/supabase/client';

export interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: string;
  page_url?: string;
  user_agent?: string;
  department_id?: string;
}

export interface CommunityMetrics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  total_posts: number;
  total_events: number;
  total_marketplace_items: number;
  total_groups: number;
  engagement_rate: number;
  retention_rate: number;
}

export interface DepartmentMetrics {
  department_id: string;
  department_name: string;
  member_count: number;
  post_count: number;
  event_count: number;
  engagement_score: number;
  growth_rate: number;
  top_content: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
    engagement: number;
  }>;
}

export interface UserEngagementMetrics {
  user_id: string;
  session_count: number;
  page_views: number;
  time_spent: number;
  posts_created: number;
  events_attended: number;
  marketplace_interactions: number;
  last_active: string;
  favorite_departments: string[];
}

export class AnalyticsService {
  private supabase = createClient();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track page view
  async trackPageView(page: string, additionalData?: Record<string, any>): Promise<void> {
    try {
      await this.trackEvent('page_view', {
        page,
        ...additionalData,
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Track user action
  async trackEvent(eventType: string, eventData: Record<string, any> = {}): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: user?.id,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        department_id: eventData.department_id,
      };

      // Store in analytics table
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(event);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Track content interaction
  async trackContentInteraction(
    contentType: 'post' | 'event' | 'marketplace' | 'resource' | 'group',
    contentId: string,
    action: 'view' | 'like' | 'share' | 'comment' | 'bookmark',
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('content_interaction', {
      content_type: contentType,
      content_id: contentId,
      action,
      ...additionalData,
    });
  }

  // Track search query
  async trackSearch(query: string, resultCount: number, filters?: Record<string, any>): Promise<void> {
    await this.trackEvent('search', {
      query,
      result_count: resultCount,
      filters,
    });
  }

  // Track user engagement
  async trackEngagement(
    engagementType: 'post_create' | 'event_attend' | 'group_join' | 'marketplace_list' | 'volunteer_signup',
    targetId: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('user_engagement', {
      engagement_type: engagementType,
      target_id: targetId,
      ...additionalData,
    });
  }

  // Get community overview metrics
  async getCommunityMetrics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<CommunityMetrics> {
    try {
      const timeframeHours = {
        day: 24,
        week: 168,
        month: 720,
        year: 8760,
      };

      const cutoffDate = new Date(Date.now() - timeframeHours[timeframe] * 60 * 60 * 1000);

      // Get basic counts
      const [
        { count: totalUsers },
        { count: totalPosts },
        { count: totalEvents },
        { count: totalMarketplaceItems },
        { count: totalGroups }
      ] = await Promise.all([
        this.supabase.from('profiles').select('id', { count: 'exact' }),
        this.supabase.from('community_posts').select('id', { count: 'exact' }),
        this.supabase.from('events').select('id', { count: 'exact' }),
        this.supabase.from('marketplace_items').select('id', { count: 'exact' }),
        this.supabase.from('community_groups').select('id', { count: 'exact' })
      ]);

      // Get active users
      const { data: activeUsersData } = await this.supabase
        .rpc('get_active_users_by_timeframe', {
          timeframe_hours: timeframeHours[timeframe]
        });

      const activeUsers = activeUsersData?.[0] || { today: 0, week: 0, month: 0 };

      // Calculate engagement rate (simplified)
      const engagementRate = totalUsers > 0 ? (activeUsers.month / totalUsers) * 100 : 0;

      // Calculate retention rate (users active in last 30 days who were also active 30-60 days ago)
      const { data: retentionData } = await this.supabase
        .rpc('calculate_retention_rate');

      const retentionRate = retentionData?.[0]?.retention_rate || 0;

      return {
        total_users: totalUsers || 0,
        active_users_today: activeUsers.today || 0,
        active_users_week: activeUsers.week || 0,
        active_users_month: activeUsers.month || 0,
        total_posts: totalPosts || 0,
        total_events: totalEvents || 0,
        total_marketplace_items: totalMarketplaceItems || 0,
        total_groups: totalGroups || 0,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        retention_rate: Math.round(retentionRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting community metrics:', error);
      return {
        total_users: 0,
        active_users_today: 0,
        active_users_week: 0,
        active_users_month: 0,
        total_posts: 0,
        total_events: 0,
        total_marketplace_items: 0,
        total_groups: 0,
        engagement_rate: 0,
        retention_rate: 0,
      };
    }
  }

  // Get department-specific metrics
  async getDepartmentMetrics(departmentId?: string): Promise<DepartmentMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_department_metrics', { dept_id: departmentId });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting department metrics:', error);
      return [];
    }
  }

  // Get user engagement metrics
  async getUserEngagementMetrics(userId: string): Promise<UserEngagementMetrics | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_engagement_metrics', { user_id: userId });

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting user engagement metrics:', error);
      return null;
    }
  }

  // Get popular content
  async getPopularContent(
    contentType?: 'post' | 'event' | 'marketplace' | 'resource',
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit = 10
  ): Promise<any[]> {
    try {
      const timeframeHours = {
        day: 24,
        week: 168,
        month: 720,
      };

      const { data, error } = await this.supabase
        .rpc('get_popular_content', {
          content_type: contentType,
          timeframe_hours: timeframeHours[timeframe],
          result_limit: limit
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting popular content:', error);
      return [];
    }
  }

  // Get search analytics
  async getSearchAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any[]> {
    try {
      const timeframeHours = {
        day: 24,
        week: 168,
        month: 720,
      };

      const cutoffDate = new Date(Date.now() - timeframeHours[timeframe] * 60 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'search')
        .gte('timestamp', cutoffDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Process search data to get popular queries
      const searchQueries: Record<string, number> = {};
      data?.forEach(event => {
        const query = event.event_data?.query;
        if (query) {
          searchQueries[query] = (searchQueries[query] || 0) + 1;
        }
      });

      return Object.entries(searchQueries)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return [];
    }
  }

  // Get platform usage statistics
  async getPlatformUsage(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const timeframeHours = {
        day: 24,
        week: 168,
        month: 720,
      };

      const { data, error } = await this.supabase
        .rpc('get_platform_usage_stats', {
          timeframe_hours: timeframeHours[timeframe]
        });

      if (error) throw error;

      return data?.[0] || {
        page_views: 0,
        unique_visitors: 0,
        session_duration_avg: 0,
        bounce_rate: 0,
        top_pages: [],
        device_breakdown: {},
        time_distribution: {}
      };
    } catch (error) {
      console.error('Error getting platform usage:', error);
      return {
        page_views: 0,
        unique_visitors: 0,
        session_duration_avg: 0,
        bounce_rate: 0,
        top_pages: [],
        device_breakdown: {},
        time_distribution: {}
      };
    }
  }

  // Export analytics data (for transparency/GDPR)
  async exportUserData(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return {
        user_id: userId,
        export_date: new Date().toISOString(),
        events: data || [],
        summary: {
          total_events: data?.length || 0,
          first_activity: data?.[data.length - 1]?.timestamp,
          last_activity: data?.[0]?.timestamp,
        }
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }

  // Delete user analytics data (for GDPR compliance)
  async deleteUserData(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      console.log(`Analytics data deleted for user: ${userId}`);
    } catch (error) {
      console.error('Error deleting user analytics data:', error);
      throw error;
    }
  }

  // Initialize analytics service
  static async initialize(): Promise<AnalyticsService> {
    const service = new AnalyticsService();
    
    // Track initial page load
    if (typeof window !== 'undefined') {
      await service.trackPageView(window.location.pathname);
      
      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          service.trackEvent('page_focus');
        } else {
          service.trackEvent('page_blur');
        }
      });
    }

    return service;
  }
}
