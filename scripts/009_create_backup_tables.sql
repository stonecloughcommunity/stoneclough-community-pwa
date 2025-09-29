-- Backup and Recovery System for Stoneclough PWA

-- Create backup metadata table
CREATE TABLE IF NOT EXISTS public.backup_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_status TEXT NOT NULL CHECK (backup_status IN ('started', 'completed', 'failed')) DEFAULT 'started',
    backup_size_bytes BIGINT,
    backup_location TEXT,
    backup_hash TEXT,
    tables_included TEXT[],
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    retention_until TIMESTAMP WITH TIME ZONE
);

-- Create backup verification table
CREATE TABLE IF NOT EXISTS public.backup_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_id UUID REFERENCES public.backup_metadata(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('integrity', 'restore_test', 'data_consistency')),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('passed', 'failed', 'warning')) DEFAULT 'passed',
    verification_details JSONB,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES auth.users(id)
);

-- Create disaster recovery log table
CREATE TABLE IF NOT EXISTS public.disaster_recovery_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_type TEXT NOT NULL CHECK (incident_type IN ('data_loss', 'corruption', 'system_failure', 'security_breach')),
    incident_severity TEXT NOT NULL CHECK (incident_severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    incident_description TEXT NOT NULL,
    recovery_actions TEXT[],
    recovery_status TEXT NOT NULL CHECK (recovery_status IN ('investigating', 'in_progress', 'resolved', 'escalated')) DEFAULT 'investigating',
    data_affected TEXT[],
    downtime_minutes INTEGER DEFAULT 0,
    incident_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    incident_resolved_at TIMESTAMP WITH TIME ZONE,
    reported_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    post_mortem_notes TEXT
);

-- Create performance alerts table (for monitoring)
CREATE TABLE IF NOT EXISTS public.performance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_rating TEXT NOT NULL CHECK (metric_rating IN ('good', 'needs-improvement', 'poor')),
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on backup tables
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disaster_recovery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backup tables (admin only)
CREATE POLICY "Only admins can access backup metadata" ON public.backup_metadata
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can access backup verifications" ON public.backup_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can access disaster recovery log" ON public.disaster_recovery_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "System can insert performance alerts" ON public.performance_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view performance alerts" ON public.performance_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_metadata_type_status ON public.backup_metadata(backup_type, backup_status);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_started_at ON public.backup_metadata(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_verifications_backup_id ON public.backup_verifications(backup_id);
CREATE INDEX IF NOT EXISTS idx_disaster_recovery_severity ON public.disaster_recovery_log(incident_severity);
CREATE INDEX IF NOT EXISTS idx_disaster_recovery_status ON public.disaster_recovery_log(recovery_status);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON public.performance_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_metric ON public.performance_alerts(metric_name, metric_rating);

-- Function to clean up old backups based on retention policy
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
    -- Mark expired backups for deletion
    UPDATE public.backup_metadata 
    SET backup_status = 'expired'
    WHERE retention_until < NOW() 
    AND backup_status = 'completed';
    
    -- Clean up old performance alerts (keep 30 days)
    DELETE FROM public.performance_alerts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up resolved disaster recovery logs (keep 1 year)
    DELETE FROM public.disaster_recovery_log 
    WHERE recovery_status = 'resolved' 
    AND incident_resolved_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Function to create backup metadata entry
CREATE OR REPLACE FUNCTION create_backup_entry(
    p_backup_type TEXT,
    p_tables_included TEXT[],
    p_retention_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
BEGIN
    INSERT INTO public.backup_metadata (
        backup_type,
        tables_included,
        retention_until,
        created_by
    ) VALUES (
        p_backup_type,
        p_tables_included,
        NOW() + (p_retention_days || ' days')::INTERVAL,
        auth.uid()
    ) RETURNING id INTO backup_id;
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete backup entry
CREATE OR REPLACE FUNCTION complete_backup_entry(
    p_backup_id UUID,
    p_backup_size BIGINT,
    p_backup_location TEXT,
    p_backup_hash TEXT,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE public.backup_metadata 
    SET 
        backup_status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
        backup_size_bytes = p_backup_size,
        backup_location = p_backup_location,
        backup_hash = p_backup_hash,
        completed_at = NOW(),
        error_message = p_error_message
    WHERE id = p_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log disaster recovery incident
CREATE OR REPLACE FUNCTION log_disaster_recovery_incident(
    p_incident_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_data_affected TEXT[] DEFAULT '{}',
    p_assigned_to UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    incident_id UUID;
BEGIN
    INSERT INTO public.disaster_recovery_log (
        incident_type,
        incident_severity,
        incident_description,
        data_affected,
        reported_by,
        assigned_to
    ) VALUES (
        p_incident_type,
        p_severity,
        p_description,
        p_data_affected,
        auth.uid(),
        p_assigned_to
    ) RETURNING id INTO incident_id;
    
    RETURN incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get backup statistics
CREATE OR REPLACE FUNCTION get_backup_statistics()
RETURNS TABLE (
    total_backups BIGINT,
    successful_backups BIGINT,
    failed_backups BIGINT,
    total_backup_size BIGINT,
    last_backup_date TIMESTAMP WITH TIME ZONE,
    oldest_backup_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE backup_status = 'completed') as successful_backups,
        COUNT(*) FILTER (WHERE backup_status = 'failed') as failed_backups,
        COALESCE(SUM(backup_size_bytes) FILTER (WHERE backup_status = 'completed'), 0) as total_backup_size,
        MAX(completed_at) as last_backup_date,
        MIN(started_at) as oldest_backup_date
    FROM public.backup_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up old data
CREATE OR REPLACE FUNCTION trigger_cleanup_old_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Run cleanup every 100 backup entries
    IF (SELECT COUNT(*) FROM public.backup_metadata) % 100 = 0 THEN
        PERFORM cleanup_old_backups();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backup_cleanup
    AFTER INSERT ON public.backup_metadata
    FOR EACH ROW EXECUTE FUNCTION trigger_cleanup_old_data();

-- Create email verification log table
CREATE TABLE IF NOT EXISTS public.email_verification_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('send', 'resend', 'verify')),
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on email verification log
ALTER TABLE public.email_verification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for email verification log (admin only)
CREATE POLICY "Only admins can access email verification log" ON public.email_verification_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create index for email verification log
CREATE INDEX IF NOT EXISTS idx_email_verification_log_email ON public.email_verification_log(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_log_created_at ON public.email_verification_log(created_at DESC);

-- Create password reset log table
CREATE TABLE IF NOT EXISTS public.password_reset_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('initiate', 'complete', 'verify')),
    success BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES auth.users(id),
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on password reset log
ALTER TABLE public.password_reset_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for password reset log (admin only)
CREATE POLICY "Only admins can access password reset log" ON public.password_reset_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create index for password reset log
CREATE INDEX IF NOT EXISTS idx_password_reset_log_email ON public.password_reset_log(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_log_created_at ON public.password_reset_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_log_user_id ON public.password_reset_log(user_id);

-- Create two-factor authentication table
CREATE TABLE IF NOT EXISTS public.user_two_factor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    secret TEXT NOT NULL,
    backup_codes TEXT[] DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP WITH TIME ZONE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create two-factor authentication log table
CREATE TABLE IF NOT EXISTS public.two_factor_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('enabled', 'disabled', 'verified', 'backup_codes_regenerated')),
    success BOOLEAN NOT NULL DEFAULT false,
    method TEXT CHECK (method IN ('totp', 'backup_code')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on two-factor tables
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for two-factor authentication
CREATE POLICY "Users can manage their own 2FA settings" ON public.user_two_factor
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own 2FA log" ON public.two_factor_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert 2FA log entries" ON public.two_factor_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view all 2FA logs" ON public.two_factor_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create indexes for two-factor tables
CREATE INDEX IF NOT EXISTS idx_user_two_factor_user_id ON public.user_two_factor(user_id);
CREATE INDEX IF NOT EXISTS idx_user_two_factor_enabled ON public.user_two_factor(is_enabled);
CREATE INDEX IF NOT EXISTS idx_two_factor_log_user_id ON public.two_factor_log(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_log_created_at ON public.two_factor_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_two_factor_log_action ON public.two_factor_log(action);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.user_sessions
    FOR ALL USING (true);

CREATE POLICY "Only admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON public.user_sessions(ip_address);
