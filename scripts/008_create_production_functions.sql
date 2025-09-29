-- Production Functions and Triggers for Stoneclough PWA

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables that need them
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environmental_initiatives_updated_at BEFORE UPDATE ON public.environmental_initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_reviews_updated_at BEFORE UPDATE ON public.business_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update business rating when reviews are added/updated/deleted
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
DECLARE
    business_id_to_update UUID;
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Determine which business to update
    IF TG_OP = 'DELETE' THEN
        business_id_to_update := OLD.business_id;
    ELSE
        business_id_to_update := NEW.business_id;
    END IF;

    -- Calculate new average rating and count
    SELECT 
        COALESCE(AVG(rating), 0.0)::DECIMAL(3,2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM public.business_reviews 
    WHERE business_id = business_id_to_update;

    -- Update the business entry
    UPDATE public.directory_entries 
    SET 
        rating_average = avg_rating,
        rating_count = review_count,
        updated_at = NOW()
    WHERE id = business_id_to_update;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update business ratings
CREATE TRIGGER update_business_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.business_reviews
    FOR EACH ROW EXECUTE FUNCTION update_business_rating();

-- Function to update environmental initiative participant count
CREATE OR REPLACE FUNCTION update_environmental_participant_count()
RETURNS TRIGGER AS $$
DECLARE
    initiative_id_to_update UUID;
    participant_count INTEGER;
BEGIN
    -- Determine which initiative to update
    IF TG_OP = 'DELETE' THEN
        initiative_id_to_update := OLD.initiative_id;
    ELSE
        initiative_id_to_update := NEW.initiative_id;
    END IF;

    -- Count current participants
    SELECT COUNT(*) INTO participant_count
    FROM public.environmental_participants 
    WHERE initiative_id = initiative_id_to_update;

    -- Update the initiative
    UPDATE public.environmental_initiatives 
    SET 
        current_participants = participant_count,
        updated_at = NOW()
    WHERE id = initiative_id_to_update;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update environmental participant counts
CREATE TRIGGER update_environmental_participant_count_trigger
    AFTER INSERT OR DELETE ON public.environmental_participants
    FOR EACH ROW EXECUTE FUNCTION update_environmental_participant_count();

-- Function to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
DECLARE
    job_id_to_update UUID;
    application_count INTEGER;
BEGIN
    -- Determine which job to update
    IF TG_OP = 'DELETE' THEN
        job_id_to_update := OLD.job_id;
    ELSE
        job_id_to_update := NEW.job_id;
    END IF;

    -- Count current applications
    SELECT COUNT(*) INTO application_count
    FROM public.job_applications 
    WHERE job_id = job_id_to_update;

    -- Update the job posting
    UPDATE public.job_postings 
    SET 
        application_count = application_count,
        updated_at = NOW()
    WHERE id = job_id_to_update;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job application counts
CREATE TRIGGER update_job_application_count_trigger
    AFTER INSERT OR DELETE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        auth.uid()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to important tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_job_postings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.job_postings
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_environmental_initiatives_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.environmental_initiatives
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_directory_entries_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.directory_entries
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Function to automatically expire old content
CREATE OR REPLACE FUNCTION expire_old_content()
RETURNS void AS $$
BEGIN
    -- Expire old job postings
    UPDATE public.job_postings 
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at < NOW() 
    AND status = 'active';

    -- Archive old prayer requests (from existing prayer wall)
    UPDATE public.prayer_requests 
    SET status = 'archived', updated_at = NOW()
    WHERE expires_at < NOW() 
    AND status = 'approved';

    -- Mark old community posts as expired if they have expiration dates
    UPDATE public.community_posts 
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at < NOW() 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get user's personalized content based on preferences
CREATE OR REPLACE FUNCTION get_personalized_content(user_id UUID)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    title TEXT,
    relevance_score INTEGER
) AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- Get user profile with preferences
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = user_id;

    -- Return personalized content based on user preferences
    RETURN QUERY
    WITH content_scores AS (
        -- Job postings
        SELECT 
            'job_posting' as content_type,
            jp.id as content_id,
            jp.title,
            (
                CASE WHEN jp.department_id = ANY(user_profile.department_interests::UUID[]) THEN 50 ELSE 0 END +
                CASE WHEN jp.location = user_profile.village THEN 30 ELSE 0 END +
                CASE WHEN jp.is_featured THEN 20 ELSE 0 END
            ) as relevance_score
        FROM public.job_postings jp
        WHERE jp.status = 'active'
        AND (jp.expires_at IS NULL OR jp.expires_at > NOW())
        
        UNION ALL
        
        -- Environmental initiatives
        SELECT 
            'environmental_initiative' as content_type,
            ei.id as content_id,
            ei.title,
            (
                CASE WHEN ei.department_id = ANY(user_profile.department_interests::UUID[]) THEN 50 ELSE 0 END +
                CASE WHEN ei.location = user_profile.village THEN 30 ELSE 0 END +
                CASE WHEN ei.status = 'active' THEN 20 ELSE 0 END
            ) as relevance_score
        FROM public.environmental_initiatives ei
        WHERE ei.status IN ('planning', 'active')
        
        UNION ALL
        
        -- Community posts
        SELECT 
            'community_post' as content_type,
            cp.id as content_id,
            cp.title,
            (
                CASE WHEN cp.department_id = ANY(user_profile.department_interests::UUID[]) THEN 50 ELSE 0 END +
                CASE WHEN user_profile.age_group = ANY(cp.target_demographics) THEN 30 ELSE 0 END +
                CASE WHEN cp.is_faith_content = false OR user_profile.faith_preference IN ('christian', 'both') THEN 20 ELSE 0 END
            ) as relevance_score
        FROM public.community_posts cp
        WHERE cp.status = 'active'
        AND (cp.expires_at IS NULL OR cp.expires_at > NOW())
    )
    SELECT cs.content_type, cs.content_id, cs.title, cs.relevance_score
    FROM content_scores cs
    WHERE cs.relevance_score > 0
    ORDER BY cs.relevance_score DESC, cs.content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
