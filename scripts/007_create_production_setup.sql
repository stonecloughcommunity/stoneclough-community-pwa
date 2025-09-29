-- Production Supabase Setup Script
-- Run this script in your production Supabase instance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create departments table with the 6 core departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color_theme TEXT DEFAULT '#16a34a',
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 6 core departments
INSERT INTO public.departments (name, slug, description, color_theme, icon, display_order) VALUES
('Faith & Culture', 'faith-culture', 'Religious services, cultural events, and spiritual community activities', '#7c3aed', 'church', 1),
('Community Wellbeing', 'community-wellbeing', 'Health services, mental health support, and community care initiatives', '#dc2626', 'heart', 2),
('Economy & Enterprise', 'economy-enterprise', 'Local businesses, job opportunities, and economic development', '#059669', 'briefcase', 3),
('Land/Food/Sustainability', 'land-food-sustainability', 'Environmental initiatives, community gardens, and sustainability projects', '#16a34a', 'leaf', 4),
('Technology & Platform', 'technology-platform', 'Digital services, tech support, and platform management', '#2563eb', 'monitor', 5),
('Governance/Partnerships', 'governance-partnerships', 'Local government, partnerships, and community governance', '#7c2d12', 'users', 6)
ON CONFLICT (slug) DO NOTHING;

-- Add demographic and preference fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('18-30', '31-50', '51-70', '70+')),
ADD COLUMN IF NOT EXISTS faith_preference TEXT CHECK (faith_preference IN ('christian', 'secular', 'both')) DEFAULT 'both',
ADD COLUMN IF NOT EXISTS department_interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accessibility_needs JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS senior_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}';

-- Create job postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'GBP',
    employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'temporary', 'volunteer')) DEFAULT 'full-time',
    location TEXT,
    remote_allowed BOOLEAN DEFAULT false,
    department_id UUID REFERENCES public.departments(id),
    posted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_email TEXT,
    contact_phone TEXT,
    application_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('active', 'filled', 'expired', 'draft')) DEFAULT 'active',
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cover_letter TEXT,
    resume_url TEXT,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')) DEFAULT 'pending',
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id)
);

-- Create environmental initiatives table
CREATE TABLE IF NOT EXISTS public.environmental_initiatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    initiative_type TEXT CHECK (initiative_type IN ('recycling', 'gardening', 'energy', 'transport', 'conservation', 'education')) NOT NULL,
    location TEXT,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    participant_limit INTEGER,
    current_participants INTEGER DEFAULT 0,
    resources_needed TEXT[],
    contact_info JSONB,
    status TEXT CHECK (status IN ('planning', 'active', 'completed', 'cancelled')) DEFAULT 'planning',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create environmental participants table
CREATE TABLE IF NOT EXISTS public.environmental_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    initiative_id UUID REFERENCES public.environmental_initiatives(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'volunteer', 'coordinator')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(initiative_id, participant_id)
);

-- Add department and faith content fields to existing tables
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS is_faith_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_demographics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS is_faith_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_demographics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_url TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB;

ALTER TABLE public.directory_entries 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS services_offered TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS price_range TEXT CHECK (price_range IN ('£', '££', '£££', '££££')),
ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Create business reviews table
CREATE TABLE IF NOT EXISTS public.business_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.directory_entries(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    photos TEXT[] DEFAULT '{}',
    visit_date DATE,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, reviewer_id)
);

-- Create audit log table for tracking all changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES public.profiles(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_slug ON public.departments(slug);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_village ON public.profiles(village);
CREATE INDEX IF NOT EXISTS idx_profiles_age_group ON public.profiles(age_group);
CREATE INDEX IF NOT EXISTS idx_profiles_faith_preference ON public.profiles(faith_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_department_interests ON public.profiles USING GIN(department_interests);

CREATE INDEX IF NOT EXISTS idx_job_postings_department ON public.job_postings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON public.job_postings(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON public.job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON public.job_postings(location);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

CREATE INDEX IF NOT EXISTS idx_environmental_initiatives_type ON public.environmental_initiatives(initiative_type);
CREATE INDEX IF NOT EXISTS idx_environmental_initiatives_status ON public.environmental_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_environmental_initiatives_department ON public.environmental_initiatives(department_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_department ON public.community_posts(department_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_faith_content ON public.community_posts(is_faith_content);
CREATE INDEX IF NOT EXISTS idx_community_posts_target_demographics ON public.community_posts USING GIN(target_demographics);

CREATE INDEX IF NOT EXISTS idx_events_department ON public.events(department_id);
CREATE INDEX IF NOT EXISTS idx_events_faith_content ON public.events(is_faith_content);
CREATE INDEX IF NOT EXISTS idx_events_registration_deadline ON public.events(registration_deadline);

CREATE INDEX IF NOT EXISTS idx_directory_entries_department ON public.directory_entries(department_id);
CREATE INDEX IF NOT EXISTS idx_directory_entries_verification ON public.directory_entries(verification_status);
CREATE INDEX IF NOT EXISTS idx_directory_entries_rating ON public.directory_entries(rating_average);

CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON public.business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_rating ON public.business_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable RLS on all new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments (public read access)
CREATE POLICY "Departments are publicly viewable" ON public.departments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify departments" ON public.departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for job postings
CREATE POLICY "Anyone can view active job postings" ON public.job_postings
    FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Authenticated users can create job postings" ON public.job_postings
    FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Job posters can update their own postings" ON public.job_postings
    FOR UPDATE USING (auth.uid() = posted_by);

CREATE POLICY "Job posters can delete their own postings" ON public.job_postings
    FOR DELETE USING (auth.uid() = posted_by);

-- RLS Policies for job applications
CREATE POLICY "Applicants can view their own applications" ON public.job_applications
    FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Job posters can view applications for their jobs" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.job_postings
            WHERE job_postings.id = job_applications.job_id
            AND job_postings.posted_by = auth.uid()
        )
    );

CREATE POLICY "Users can create job applications" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update their own applications" ON public.job_applications
    FOR UPDATE USING (auth.uid() = applicant_id);

-- RLS Policies for environmental initiatives
CREATE POLICY "Anyone can view active environmental initiatives" ON public.environmental_initiatives
    FOR SELECT USING (status IN ('planning', 'active'));

CREATE POLICY "Authenticated users can create environmental initiatives" ON public.environmental_initiatives
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own initiatives" ON public.environmental_initiatives
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own initiatives" ON public.environmental_initiatives
    FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for environmental participants
CREATE POLICY "Anyone can view environmental participants" ON public.environmental_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own participation" ON public.environmental_participants
    FOR ALL USING (auth.uid() = participant_id);

CREATE POLICY "Initiative organizers can manage participants" ON public.environmental_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.environmental_initiatives
            WHERE environmental_initiatives.id = environmental_participants.initiative_id
            AND environmental_initiatives.organizer_id = auth.uid()
        )
    );

-- RLS Policies for business reviews
CREATE POLICY "Anyone can view business reviews" ON public.business_reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.business_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews" ON public.business_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete their own reviews" ON public.business_reviews
    FOR DELETE USING (auth.uid() = reviewer_id);

-- RLS Policies for audit logs (admin only)
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
