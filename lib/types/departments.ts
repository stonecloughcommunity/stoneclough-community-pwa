// Department system types for Stoneclough Digital Community Centre

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentStats {
  posts_count: number;
  events_count: number;
  resources_count: number;
  groups_count: number;
  members_count: number;
}

export interface UserDepartmentPreferences {
  department_interests: string[];
  faith_preference: 'christian' | 'other-faith' | 'no-preference' | 'private';
  content_filter_enabled: boolean;
}

export interface DepartmentContent {
  id: string;
  title: string;
  content?: string;
  department_id: string;
  is_faith_content: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    display_name: string;
  };
}

export interface MarketplaceItem extends DepartmentContent {
  seller_id: string;
  category: 'free' | 'for-sale' | 'wanted' | 'services' | 'housing' | 'transport';
  price?: number;
  currency: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  location?: string;
  images: string[];
  status: 'active' | 'sold' | 'expired' | 'removed';
  expires_at?: string;
  view_count: number;
}

export interface LearningResource extends DepartmentContent {
  resource_type: 'article' | 'video' | 'document' | 'link' | 'course';
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number; // in minutes
  file_url?: string;
  external_url?: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  status: 'draft' | 'published' | 'archived';
}

export interface CommunityChallenge extends DepartmentContent {
  organizer_id: string;
  challenge_type: 'individual' | 'team' | 'community-wide';
  start_date: string;
  end_date: string;
  rules?: string;
  prizes?: string;
  max_participants?: number;
  current_participants: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  metrics?: Record<string, any>;
}

export interface CommunityGroup extends DepartmentContent {
  creator_id: string;
  group_type: 'public' | 'private' | 'invite-only';
  max_members?: number;
  current_members: number;
  is_faith_based: boolean;
  meeting_schedule?: string;
  location?: string;
  rules?: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface FaithContent {
  id: string;
  title: string;
  content: string;
  content_type: 'devotional' | 'prayer' | 'scripture' | 'reflection' | 'sermon' | 'study';
  author_id?: string;
  scripture_reference?: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  like_count: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRelationship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  department_id?: string;
  focus_area: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  meeting_frequency?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced user profile with demographic data
export interface EnhancedProfile {
  id: string;
  display_name?: string;
  bio?: string;
  phone?: string;
  address?: string;
  village?: 'Stoneclough' | 'Prestolee' | 'Ringley';
  is_volunteer: boolean;
  is_admin: boolean;
  
  // New demographic fields
  age_group?: 'under-18' | '18-30' | '31-50' | '51-70' | 'over-70';
  faith_preference?: 'christian' | 'other-faith' | 'no-preference' | 'private';
  department_interests: string[];
  accessibility_needs: string[];
  senior_mode_enabled: boolean;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy_settings: {
    profile_visible: boolean;
    contact_visible: boolean;
  };
  skills: string[];
  interests: string[];
  availability?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  created_at: string;
  updated_at: string;
}

// Department navigation and filtering
export interface DepartmentFilter {
  department_ids?: string[];
  include_faith_content?: boolean;
  exclude_faith_content?: boolean;
  tags?: string[];
  age_group?: string;
  content_type?: string;
}

export interface DepartmentNavigation {
  current_department?: Department;
  available_departments: Department[];
  user_interests: string[];
  content_filter: DepartmentFilter;
}

// Content creation interfaces
export interface CreateDepartmentContentRequest {
  title: string;
  content?: string;
  department_id: string;
  is_faith_content: boolean;
  tags: string[];
}

export interface CreateMarketplaceItemRequest extends CreateDepartmentContentRequest {
  category: MarketplaceItem['category'];
  price?: number;
  condition?: MarketplaceItem['condition'];
  location?: string;
  images?: string[];
  expires_at?: string;
}

export interface CreateLearningResourceRequest extends CreateDepartmentContentRequest {
  resource_type: LearningResource['resource_type'];
  difficulty_level?: LearningResource['difficulty_level'];
  estimated_duration?: number;
  file_url?: string;
  external_url?: string;
}

export interface CreateCommunityGroupRequest extends CreateDepartmentContentRequest {
  group_type: CommunityGroup['group_type'];
  max_members?: number;
  is_faith_based: boolean;
  meeting_schedule?: string;
  location?: string;
  rules?: string;
}

// API response types
export interface DepartmentContentResponse<T = DepartmentContent> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface DepartmentStatsResponse {
  department: Department;
  stats: DepartmentStats;
  recent_activity: DepartmentContent[];
}

// Constants
export const DEPARTMENT_COLORS = {
  'faith-culture': '#8B5CF6',
  'community-wellbeing': '#EF4444',
  'economy-enterprise': '#F59E0B',
  'land-food-sustainability': '#10B981',
  'technology-platform': '#3B82F6',
  'governance-growth': '#6366F1',
} as const;

export const DEPARTMENT_ICONS = {
  'faith-culture': 'church',
  'community-wellbeing': 'heart',
  'economy-enterprise': 'briefcase',
  'land-food-sustainability': 'leaf',
  'technology-platform': 'monitor',
  'governance-growth': 'users',
} as const;

export const AGE_GROUPS = [
  { value: 'under-18', label: 'Under 18' },
  { value: '18-30', label: '18-30' },
  { value: '31-50', label: '31-50' },
  { value: '51-70', label: '51-70' },
  { value: 'over-70', label: 'Over 70' },
] as const;

export const FAITH_PREFERENCES = [
  { value: 'christian', label: 'Christian' },
  { value: 'other-faith', label: 'Other Faith' },
  { value: 'no-preference', label: 'No Preference' },
  { value: 'private', label: 'Prefer Not to Say' },
] as const;
