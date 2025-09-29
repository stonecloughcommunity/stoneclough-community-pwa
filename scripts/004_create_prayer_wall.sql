-- Create prayer wall table with moderation and privacy features
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'healing', 'guidance', 'thanksgiving', 'family', 'community')),
    prayer_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moderated_by UUID REFERENCES auth.users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT
);

-- Create prayer responses table for people to say they've prayed
CREATE TABLE IF NOT EXISTS public.prayer_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_id UUID REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prayer_id, user_id)
);

-- Enable RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prayer_requests
CREATE POLICY "Anyone can view approved prayer requests" ON public.prayer_requests
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own prayer requests" ON public.prayer_requests
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create prayer requests" ON public.prayer_requests
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own prayer requests" ON public.prayer_requests
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all prayer requests" ON public.prayer_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update prayer requests for moderation" ON public.prayer_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for prayer_responses
CREATE POLICY "Anyone can view prayer responses for approved requests" ON public.prayer_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.prayer_requests 
            WHERE prayer_requests.id = prayer_responses.prayer_id 
            AND prayer_requests.status = 'approved'
        )
    );

CREATE POLICY "Users can create prayer responses" ON public.prayer_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own prayer responses" ON public.prayer_responses
    FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON public.prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON public.prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_author ON public.prayer_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_prayer_id ON public.prayer_responses(prayer_id);

-- Create function to update prayer count
CREATE OR REPLACE FUNCTION update_prayer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.prayer_requests 
        SET prayer_count = prayer_count + 1 
        WHERE id = NEW.prayer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.prayer_requests 
        SET prayer_count = prayer_count - 1 
        WHERE id = OLD.prayer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update prayer count
CREATE TRIGGER trigger_update_prayer_count
    AFTER INSERT OR DELETE ON public.prayer_responses
    FOR EACH ROW EXECUTE FUNCTION update_prayer_count();

-- Create function to auto-archive expired prayers
CREATE OR REPLACE FUNCTION archive_expired_prayers()
RETURNS void AS $$
BEGIN
    UPDATE public.prayer_requests 
    SET status = 'archived', updated_at = NOW()
    WHERE expires_at < NOW() 
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql;
