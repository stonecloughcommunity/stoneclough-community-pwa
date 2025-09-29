-- Create missing tables to complete the database schema
-- Based on the backup system's expected tables

-- Create business reviews table for directory entries
CREATE TABLE IF NOT EXISTS public.business_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.directory_entries(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, reviewer_id)
);

-- Create job postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'temporary', 'volunteer')) NOT NULL,
    salary_range TEXT,
    requirements TEXT[],
    benefits TEXT[],
    contact_email TEXT,
    contact_phone TEXT,
    posted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('active', 'filled', 'expired', 'closed')) DEFAULT 'active',
    is_featured BOOLEAN DEFAULT false,
    application_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    resume_url TEXT,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')) DEFAULT 'pending',
    notes TEXT, -- For employer notes
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id)
);

-- Create environmental initiatives table
CREATE TABLE IF NOT EXISTS public.environmental_initiatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('recycling', 'energy', 'transport', 'gardening', 'cleanup', 'education', 'other')) NOT NULL,
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('planning', 'active', 'completed', 'cancelled')) DEFAULT 'planning',
    impact_metrics JSONB, -- For tracking environmental impact
    resources_needed TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create environmental participants table
CREATE TABLE IF NOT EXISTS public.environmental_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    initiative_id UUID REFERENCES public.environmental_initiatives(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('participant', 'volunteer', 'coordinator')) DEFAULT 'participant',
    commitment_level TEXT CHECK (commitment_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    skills_offered TEXT[],
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(initiative_id, participant_id)
);

-- Create session management table for enhanced security
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location_info JSONB,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Create content moderation table
CREATE TABLE IF NOT EXISTS public.content_moderation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'review', 'prayer', 'job', 'event')),
    content_id UUID NOT NULL,
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'misinformation', 'other')) NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'escalated')) DEFAULT 'pending',
    moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create system settings table for configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_reviews
CREATE POLICY "Anyone can view approved business reviews" ON public.business_reviews
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Users can create business reviews" ON public.business_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can view their own reviews" ON public.business_reviews
    FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Business owners can view reviews of their business" ON public.business_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.directory_entries 
            WHERE directory_entries.id = business_reviews.business_id 
            AND directory_entries.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all business reviews" ON public.business_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for job_postings
CREATE POLICY "Anyone can view active job postings" ON public.job_postings
    FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can create job postings" ON public.job_postings
    FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can manage their own job postings" ON public.job_postings
    FOR ALL USING (auth.uid() = posted_by);

CREATE POLICY "Admins can manage all job postings" ON public.job_postings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for job_applications
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

-- RLS Policies for environmental_initiatives
CREATE POLICY "Anyone can view active environmental initiatives" ON public.environmental_initiatives
    FOR SELECT USING (status IN ('planning', 'active'));

CREATE POLICY "Users can create environmental initiatives" ON public.environmental_initiatives
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage their own initiatives" ON public.environmental_initiatives
    FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can manage all environmental initiatives" ON public.environmental_initiatives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for environmental_participants
CREATE POLICY "Anyone can view participants of active initiatives" ON public.environmental_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.environmental_initiatives 
            WHERE environmental_initiatives.id = environmental_participants.initiative_id 
            AND environmental_initiatives.status IN ('planning', 'active')
        )
    );

CREATE POLICY "Users can join environmental initiatives" ON public.environmental_participants
    FOR INSERT WITH CHECK (auth.uid() = participant_id);

CREATE POLICY "Users can manage their own participation" ON public.environmental_participants
    FOR ALL USING (auth.uid() = participant_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for audit_log
CREATE POLICY "Admins can view audit logs" ON public.audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for rate_limits
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (true); -- This table is managed by the system

-- RLS Policies for content_moderation
CREATE POLICY "Users can view their own reports" ON public.content_moderation
    FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Users can create moderation reports" ON public.content_moderation
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can manage all moderation reports" ON public.content_moderation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for system_settings
CREATE POLICY "Anyone can view public system settings" ON public.system_settings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON public.business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_rating ON public.business_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON public.job_postings(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_environmental_initiatives_status ON public.environmental_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_environmental_initiatives_category ON public.environmental_initiatives(category);
CREATE INDEX IF NOT EXISTS idx_environmental_participants_initiative_id ON public.environmental_participants(initiative_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON public.content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON public.content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category, is_public) VALUES
('site_name', '"Stoneclough Community"', 'Name of the community site', 'general', true),
('site_description', '"Community platform for Stoneclough, Prestolee & Ringley villages"', 'Site description for SEO', 'general', true),
('maintenance_mode', 'false', 'Enable maintenance mode', 'system', false),
('registration_enabled', 'true', 'Allow new user registrations', 'auth', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'uploads', false),
('session_timeout_minutes', '30', 'Session timeout in minutes', 'auth', false),
('rate_limit_requests_per_minute', '60', 'Rate limit for API requests per minute', 'security', false),
('content_moderation_enabled', 'true', 'Enable content moderation features', 'moderation', false),
('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications', false),
('push_notifications_enabled', 'true', 'Enable push notifications', 'notifications', false)
ON CONFLICT (key) DO NOTHING;
