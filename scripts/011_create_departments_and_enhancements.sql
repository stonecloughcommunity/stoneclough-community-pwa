-- Stoneclough Digital Community Centre - Enhanced Database Schema
-- This migration adds the 6-department structure and all required tables for the comprehensive platform

-- Create departments table (6 core departments)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT, -- Icon name for UI
    color TEXT, -- Brand color for department
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 6 core departments
INSERT INTO public.departments (name, slug, description, icon, color, sort_order) VALUES
('Faith & Culture', 'faith-culture', 'Spiritual life, worship, interfaith dialogue, and cultural heritage preservation', 'church', '#8B5CF6', 1),
('Community & Wellbeing', 'community-wellbeing', 'Health, mental wellbeing, social connections, and community support', 'heart', '#EF4444', 2),
('Economy & Enterprise', 'economy-enterprise', 'Local business, job opportunities, skills development, and economic growth', 'briefcase', '#F59E0B', 3),
('Land, Food & Sustainability', 'land-food-sustainability', 'Environmental stewardship, community gardens, and sustainable living', 'leaf', '#10B981', 4),
('Technology & Platform', 'technology-platform', 'Digital literacy, platform development, and technology support', 'monitor', '#3B82F6', 5),
('Governance & Growth', 'governance-growth', 'Community leadership, partnerships, and strategic development', 'users', '#6366F1', 6)
ON CONFLICT (slug) DO NOTHING;

-- Enhance profiles table with demographic and preference fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('under-18', '18-30', '31-50', '51-70', 'over-70'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faith_preference TEXT CHECK (faith_preference IN ('christian', 'other-faith', 'no-preference', 'private'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_interests UUID[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accessibility_needs TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS senior_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visible": true, "contact_visible": false}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability TEXT; -- For volunteering
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- Add department categorization to existing content tables
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_faith_content BOOLEAN DEFAULT FALSE;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_faith_content BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS age_restrictions TEXT;

ALTER TABLE public.volunteer_opportunities ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.volunteer_opportunities ADD COLUMN IF NOT EXISTS is_faith_content BOOLEAN DEFAULT FALSE;
ALTER TABLE public.volunteer_opportunities ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE public.directory_entries ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.directory_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.directory_entries ADD COLUMN IF NOT EXISTS social_media JSONB;
ALTER TABLE public.directory_entries ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.directory_entries ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Create marketplace table for local buying/selling
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id),
    category TEXT CHECK (category IN ('free', 'for-sale', 'wanted', 'services', 'housing', 'transport')) NOT NULL,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'GBP',
    condition TEXT CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
    location TEXT,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'sold', 'expired', 'removed')) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketplace inquiries table
CREATE TABLE IF NOT EXISTS public.marketplace_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    inquirer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'responded', 'closed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning resources table
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    resource_type TEXT CHECK (resource_type IN ('article', 'video', 'document', 'link', 'course')) NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- in minutes
    tags TEXT[] DEFAULT '{}',
    file_url TEXT,
    external_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mentorship table
CREATE TABLE IF NOT EXISTS public.mentorship_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id),
    focus_area TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    meeting_frequency TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, mentee_id, focus_area)
);

-- Create community challenges table
CREATE TABLE IF NOT EXISTS public.community_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_type TEXT CHECK (challenge_type IN ('individual', 'team', 'community-wide')) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    rules TEXT,
    prizes TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
    metrics JSONB, -- For tracking progress
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES public.community_challenges(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT,
    progress JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, participant_id)
);

-- Create faith content table for spiritual resources
CREATE TABLE IF NOT EXISTS public.faith_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('devotional', 'prayer', 'scripture', 'reflection', 'sermon', 'study')) NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scripture_reference TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community groups table
CREATE TABLE IF NOT EXISTS public.community_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.departments(id),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_type TEXT CHECK (group_type IN ('public', 'private', 'invite-only')) DEFAULT 'public',
    max_members INTEGER,
    current_members INTEGER DEFAULT 1,
    is_faith_based BOOLEAN DEFAULT FALSE,
    meeting_schedule TEXT,
    location TEXT,
    tags TEXT[] DEFAULT '{}',
    rules TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group memberships table
CREATE TABLE IF NOT EXISTS public.group_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create group posts table
CREATE TABLE IF NOT EXISTS public.group_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    post_type TEXT CHECK (post_type IN ('discussion', 'announcement', 'poll', 'event')) DEFAULT 'discussion',
    poll_options JSONB, -- For poll posts
    poll_votes JSONB DEFAULT '{}', -- For poll results
    is_pinned BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments (public read access)
CREATE POLICY "Anyone can view active departments" ON public.departments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for marketplace_items
CREATE POLICY "Anyone can view active marketplace items" ON public.marketplace_items
    FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can create marketplace items" ON public.marketplace_items
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can manage their own marketplace items" ON public.marketplace_items
    FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all marketplace items" ON public.marketplace_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for marketplace_inquiries
CREATE POLICY "Item owners can view inquiries for their items" ON public.marketplace_inquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_items
            WHERE marketplace_items.id = marketplace_inquiries.item_id
            AND marketplace_items.seller_id = auth.uid()
        )
    );

CREATE POLICY "Inquirers can view their own inquiries" ON public.marketplace_inquiries
    FOR SELECT USING (auth.uid() = inquirer_id);

CREATE POLICY "Users can create marketplace inquiries" ON public.marketplace_inquiries
    FOR INSERT WITH CHECK (auth.uid() = inquirer_id);

-- RLS Policies for learning_resources
CREATE POLICY "Anyone can view published learning resources" ON public.learning_resources
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view their own learning resources" ON public.learning_resources
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create learning resources" ON public.learning_resources
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can manage their own learning resources" ON public.learning_resources
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all learning resources" ON public.learning_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for mentorship_relationships
CREATE POLICY "Mentors can view their mentorship relationships" ON public.mentorship_relationships
    FOR SELECT USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can view their mentorship relationships" ON public.mentorship_relationships
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can create mentorship relationships as mentee" ON public.mentorship_relationships
    FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update their mentorship relationships" ON public.mentorship_relationships
    FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can update their mentorship relationships" ON public.mentorship_relationships
    FOR UPDATE USING (auth.uid() = mentee_id);

-- RLS Policies for community_challenges
CREATE POLICY "Anyone can view active community challenges" ON public.community_challenges
    FOR SELECT USING (status IN ('upcoming', 'active'));

CREATE POLICY "Users can create community challenges" ON public.community_challenges
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage their own challenges" ON public.community_challenges
    FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can manage all community challenges" ON public.community_challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for challenge_participants
CREATE POLICY "Anyone can view challenge participants" ON public.challenge_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.community_challenges
            WHERE community_challenges.id = challenge_participants.challenge_id
            AND community_challenges.status IN ('upcoming', 'active', 'completed')
        )
    );

CREATE POLICY "Users can join challenges" ON public.challenge_participants
    FOR INSERT WITH CHECK (auth.uid() = participant_id);

CREATE POLICY "Users can manage their own challenge participation" ON public.challenge_participants
    FOR ALL USING (auth.uid() = participant_id);

-- RLS Policies for faith_content
CREATE POLICY "Anyone can view published faith content" ON public.faith_content
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view their own faith content" ON public.faith_content
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create faith content" ON public.faith_content
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can manage their own faith content" ON public.faith_content
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all faith content" ON public.faith_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for community_groups
CREATE POLICY "Anyone can view public community groups" ON public.community_groups
    FOR SELECT USING (group_type = 'public' AND status = 'active');

CREATE POLICY "Group members can view their groups" ON public.community_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_memberships.group_id = community_groups.id
            AND group_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create community groups" ON public.community_groups
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group creators can manage their groups" ON public.community_groups
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Group admins can manage their groups" ON public.community_groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_memberships.group_id = community_groups.id
            AND group_memberships.user_id = auth.uid()
            AND group_memberships.role = 'admin'
        )
    );

-- RLS Policies for group_memberships
CREATE POLICY "Group members can view group memberships" ON public.group_memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships gm
            WHERE gm.group_id = group_memberships.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join groups" ON public.group_memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_memberships
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Group admins can manage memberships" ON public.group_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships gm
            WHERE gm.group_id = group_memberships.group_id
            AND gm.user_id = auth.uid()
            AND gm.role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for group_posts
CREATE POLICY "Group members can view group posts" ON public.group_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_memberships.group_id = group_posts.group_id
            AND group_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can create posts" ON public.group_posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_memberships.group_id = group_posts.group_id
            AND group_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Authors can manage their own group posts" ON public.group_posts
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Group moderators can manage group posts" ON public.group_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_memberships.group_id = group_posts.group_id
            AND group_memberships.user_id = auth.uid()
            AND group_memberships.role IN ('admin', 'moderator')
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_interests ON public.profiles USING GIN (department_interests);
CREATE INDEX IF NOT EXISTS idx_profiles_age_group ON public.profiles(age_group);
CREATE INDEX IF NOT EXISTS idx_profiles_faith_preference ON public.profiles(faith_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_senior_mode ON public.profiles(senior_mode_enabled);

CREATE INDEX IF NOT EXISTS idx_community_posts_department_id ON public.community_posts(department_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_faith_content ON public.community_posts(is_faith_content);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_events_department_id ON public.events(department_id);
CREATE INDEX IF NOT EXISTS idx_events_is_faith_content ON public.events(is_faith_content);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_events_registration_deadline ON public.events(registration_deadline);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_department_id ON public.marketplace_items(department_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON public.marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON public.marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_price ON public.marketplace_items(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_tags ON public.marketplace_items USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_learning_resources_department_id ON public.learning_resources(department_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_resource_type ON public.learning_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_learning_resources_status ON public.learning_resources(status);
CREATE INDEX IF NOT EXISTS idx_learning_resources_tags ON public.learning_resources USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_mentorship_relationships_mentor_id ON public.mentorship_relationships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_relationships_mentee_id ON public.mentorship_relationships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_relationships_department_id ON public.mentorship_relationships(department_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_relationships_status ON public.mentorship_relationships(status);

CREATE INDEX IF NOT EXISTS idx_community_challenges_department_id ON public.community_challenges(department_id);
CREATE INDEX IF NOT EXISTS idx_community_challenges_status ON public.community_challenges(status);
CREATE INDEX IF NOT EXISTS idx_community_challenges_start_date ON public.community_challenges(start_date);
CREATE INDEX IF NOT EXISTS idx_community_challenges_end_date ON public.community_challenges(end_date);

CREATE INDEX IF NOT EXISTS idx_faith_content_content_type ON public.faith_content(content_type);
CREATE INDEX IF NOT EXISTS idx_faith_content_status ON public.faith_content(status);
CREATE INDEX IF NOT EXISTS idx_faith_content_published_at ON public.faith_content(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_faith_content_tags ON public.faith_content USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_community_groups_department_id ON public.community_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_community_groups_group_type ON public.community_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_community_groups_status ON public.community_groups(status);
CREATE INDEX IF NOT EXISTS idx_community_groups_is_faith_based ON public.community_groups(is_faith_based);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON public.group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_role ON public.group_memberships(role);

CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author_id ON public.group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_post_type ON public.group_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON public.group_posts(created_at DESC);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.get_user_department_interests(user_id UUID)
RETURNS TABLE(department_id UUID, department_name TEXT, department_slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.name, d.slug
    FROM public.departments d
    JOIN public.profiles p ON d.id = ANY(p.department_interests)
    WHERE p.id = user_id AND d.is_active = true
    ORDER BY d.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_department_content_count(dept_id UUID)
RETURNS TABLE(
    posts_count BIGINT,
    events_count BIGINT,
    resources_count BIGINT,
    groups_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.community_posts WHERE department_id = dept_id),
        (SELECT COUNT(*) FROM public.events WHERE department_id = dept_id),
        (SELECT COUNT(*) FROM public.learning_resources WHERE department_id = dept_id AND status = 'published'),
        (SELECT COUNT(*) FROM public.community_groups WHERE department_id = dept_id AND status = 'active');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_groups
        SET current_members = current_members + 1
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_groups
        SET current_members = current_members - 1
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_update_group_member_count
    AFTER INSERT OR DELETE ON public.group_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

CREATE OR REPLACE FUNCTION public.update_challenge_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_challenges
        SET current_participants = current_participants + 1
        WHERE id = NEW.challenge_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_challenges
        SET current_participants = current_participants - 1
        WHERE id = OLD.challenge_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_challenge_participant_count
    AFTER INSERT OR DELETE ON public.challenge_participants
    FOR EACH ROW EXECUTE FUNCTION public.update_challenge_participant_count();

-- Insert additional system settings for new features
INSERT INTO public.system_settings (key, value, description, category, is_public) VALUES
('departments_enabled', 'true', 'Enable department-based organization', 'features', false),
('faith_content_enabled', 'true', 'Enable faith-based content features', 'features', false),
('marketplace_enabled', 'true', 'Enable marketplace features', 'features', false),
('mentorship_enabled', 'true', 'Enable mentorship features', 'features', false),
('challenges_enabled', 'true', 'Enable community challenges', 'features', false),
('groups_enabled', 'true', 'Enable community groups', 'features', false),
('learning_resources_enabled', 'true', 'Enable learning resources', 'features', false),
('max_marketplace_images', '5', 'Maximum images per marketplace item', 'uploads', false),
('max_group_members', '500', 'Maximum members per community group', 'groups', false),
('challenge_duration_max_days', '365', 'Maximum duration for challenges in days', 'challenges', false)
ON CONFLICT (key) DO NOTHING;
