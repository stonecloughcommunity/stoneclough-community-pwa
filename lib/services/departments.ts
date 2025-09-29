// Department service layer for Stoneclough Digital Community Centre

import { createClient } from '@/lib/supabase/client';
import type {
  Department,
  DepartmentStats,
  DepartmentContent,
  DepartmentFilter,
  DepartmentContentResponse,
  DepartmentStatsResponse,
  EnhancedProfile,
} from '@/lib/types/departments';

const supabase = createClient();

export class DepartmentService {
  // Get all active departments
  static async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  // Get department by slug
  static async getDepartmentBySlug(slug: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  }

  // Get department statistics
  static async getDepartmentStats(departmentId: string): Promise<DepartmentStatsResponse> {
    const [department, stats] = await Promise.all([
      this.getDepartmentById(departmentId),
      this.calculateDepartmentStats(departmentId),
    ]);

    if (!department) {
      throw new Error('Department not found');
    }

    const recentActivity = await this.getRecentDepartmentActivity(departmentId);

    return {
      department,
      stats,
      recent_activity: recentActivity,
    };
  }

  // Get department by ID
  static async getDepartmentById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  // Calculate department statistics
  static async calculateDepartmentStats(departmentId: string): Promise<DepartmentStats> {
    const { data, error } = await supabase
      .rpc('get_department_content_count', { dept_id: departmentId });

    if (error) {
      console.error('Error calculating department stats:', error);
      return {
        posts_count: 0,
        events_count: 0,
        resources_count: 0,
        groups_count: 0,
        members_count: 0,
      };
    }

    // Get members count (users interested in this department)
    const { count: membersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .contains('department_interests', [departmentId]);

    return {
      posts_count: data[0]?.posts_count || 0,
      events_count: data[0]?.events_count || 0,
      resources_count: data[0]?.resources_count || 0,
      groups_count: data[0]?.groups_count || 0,
      members_count: membersCount || 0,
    };
  }

  // Get recent activity for a department
  static async getRecentDepartmentActivity(departmentId: string, limit = 10): Promise<DepartmentContent[]> {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        department_id,
        is_faith_content,
        tags,
        created_at,
        updated_at,
        author:profiles(id, display_name)
      `)
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data || [];
  }

  // Get department content with filtering
  static async getDepartmentContent(
    departmentId: string,
    filter: DepartmentFilter = {},
    page = 1,
    perPage = 20
  ): Promise<DepartmentContentResponse> {
    let query = supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        department_id,
        is_faith_content,
        tags,
        created_at,
        updated_at,
        author:profiles(id, display_name)
      `, { count: 'exact' })
      .eq('department_id', departmentId);

    // Apply filters
    if (filter.include_faith_content === false) {
      query = query.eq('is_faith_content', false);
    }
    if (filter.exclude_faith_content === true) {
      query = query.eq('is_faith_content', false);
    }
    if (filter.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      has_more: (count || 0) > page * perPage,
    };
  }

  // Get user's department interests
  static async getUserDepartmentInterests(userId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .rpc('get_user_department_interests', { user_id: userId });

    if (error) {
      console.error('Error fetching user department interests:', error);
      return [];
    }

    return data || [];
  }

  // Update user's department interests
  static async updateUserDepartmentInterests(
    userId: string,
    departmentIds: string[]
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ department_interests: departmentIds })
      .eq('id', userId);

    if (error) throw error;
  }

  // Get personalized content feed based on user's department interests
  static async getPersonalizedFeed(
    userId: string,
    filter: DepartmentFilter = {},
    page = 1,
    perPage = 20
  ): Promise<DepartmentContentResponse> {
    // Get user's profile to understand their preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('department_interests, faith_preference')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Unable to fetch user preferences');
    }

    let query = supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        department_id,
        is_faith_content,
        tags,
        created_at,
        updated_at,
        author:profiles(id, display_name),
        department:departments(name, slug, color)
      `, { count: 'exact' });

    // Filter by user's department interests
    if (profile.department_interests && profile.department_interests.length > 0) {
      query = query.in('department_id', profile.department_interests);
    }

    // Apply faith content filtering based on user preference
    if (profile.faith_preference === 'no-preference') {
      query = query.eq('is_faith_content', false);
    }

    // Apply additional filters
    if (filter.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    // Order by creation date with some randomization for diversity
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      has_more: (count || 0) > page * perPage,
    };
  }

  // Search across all departments
  static async searchDepartmentContent(
    searchTerm: string,
    filter: DepartmentFilter = {},
    page = 1,
    perPage = 20
  ): Promise<DepartmentContentResponse> {
    let query = supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        department_id,
        is_faith_content,
        tags,
        created_at,
        updated_at,
        author:profiles(id, display_name),
        department:departments(name, slug, color)
      `, { count: 'exact' })
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

    // Apply department filter
    if (filter.department_ids && filter.department_ids.length > 0) {
      query = query.in('department_id', filter.department_ids);
    }

    // Apply faith content filter
    if (filter.include_faith_content === false) {
      query = query.eq('is_faith_content', false);
    }

    // Apply tag filter
    if (filter.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    // Order by relevance (could be enhanced with full-text search)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      has_more: (count || 0) > page * perPage,
    };
  }

  // Get trending content across departments
  static async getTrendingContent(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit = 10
  ): Promise<DepartmentContent[]> {
    const timeframeHours = {
      day: 24,
      week: 168,
      month: 720,
    };

    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        department_id,
        is_faith_content,
        tags,
        created_at,
        updated_at,
        author:profiles(id, display_name),
        department:departments(name, slug, color)
      `)
      .gte('created_at', new Date(Date.now() - timeframeHours[timeframe] * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending content:', error);
      return [];
    }

    return data || [];
  }
}
