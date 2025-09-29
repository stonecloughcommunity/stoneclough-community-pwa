-- Create organizational chart tables
CREATE TABLE IF NOT EXISTS public.organization_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT DEFAULT 'general' CHECK (department IN ('leadership', 'ministry', 'operations', 'volunteers', 'general')),
    level INTEGER DEFAULT 1, -- 1 = top level, 2 = department heads, 3 = team leads, etc.
    parent_role_id UUID REFERENCES public.organization_roles(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    contact_email TEXT,
    contact_phone TEXT,
    responsibilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role assignments table
CREATE TABLE IF NOT EXISTS public.role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.organization_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT true, -- Users can have multiple roles, but one primary
    notes TEXT,
    UNIQUE(user_id, role_id)
);

-- Create committees table
CREATE TABLE IF NOT EXISTS public.committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    purpose TEXT,
    meeting_schedule TEXT, -- e.g., "First Tuesday of each month"
    meeting_location TEXT,
    is_active BOOLEAN DEFAULT true,
    chair_role_id UUID REFERENCES public.organization_roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create committee memberships
CREATE TABLE IF NOT EXISTS public.committee_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_in_committee TEXT DEFAULT 'member' CHECK (role_in_committee IN ('chair', 'vice-chair', 'secretary', 'treasurer', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(committee_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Organization chart is public information
CREATE POLICY "Organization chart is publicly viewable" ON public.organization_roles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Role assignments are publicly viewable" ON public.role_assignments
    FOR SELECT USING (true);

CREATE POLICY "Committees are publicly viewable" ON public.committees
    FOR SELECT USING (is_active = true);

CREATE POLICY "Committee memberships are publicly viewable" ON public.committee_members
    FOR SELECT USING (true);

-- Admin policies for management
CREATE POLICY "Admins can manage organization roles" ON public.organization_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can manage role assignments" ON public.role_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can manage committees" ON public.committees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can manage committee memberships" ON public.committee_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_roles_level ON public.organization_roles(level, display_order);
CREATE INDEX IF NOT EXISTS idx_organization_roles_department ON public.organization_roles(department);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON public.role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON public.role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_committee ON public.committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_user ON public.committee_members(user_id);

-- Insert sample organizational structure
INSERT INTO public.organization_roles (title, description, department, level, display_order, contact_email, responsibilities) VALUES
-- Leadership Level (Level 1)
('Senior Pastor', 'Spiritual leader and primary pastor of the community', 'leadership', 1, 1, 'pastor@community.org', ARRAY['Spiritual guidance', 'Sermon delivery', 'Community vision', 'Pastoral care']),
('Church Council Chair', 'Chairs the church council and oversees governance', 'leadership', 1, 2, 'council@community.org', ARRAY['Council meetings', 'Strategic planning', 'Policy oversight', 'Community representation']),

-- Department Heads (Level 2)
('Worship Director', 'Leads worship services and music ministry', 'ministry', 2, 1, 'worship@community.org', ARRAY['Worship planning', 'Music coordination', 'Sound system', 'Volunteer musicians']),
('Youth Pastor', 'Ministers to children and young people', 'ministry', 2, 2, 'youth@community.org', ARRAY['Youth programs', 'Sunday school', 'Youth events', 'Family ministry']),
('Community Outreach Coordinator', 'Coordinates community service and outreach', 'ministry', 2, 3, 'outreach@community.org', ARRAY['Community events', 'Volunteer coordination', 'Local partnerships', 'Service projects']),
('Facilities Manager', 'Manages building and grounds maintenance', 'operations', 2, 4, 'facilities@community.org', ARRAY['Building maintenance', 'Security systems', 'Cleaning coordination', 'Equipment management']),
('Finance Secretary', 'Manages financial records and reporting', 'operations', 2, 5, 'finance@community.org', ARRAY['Financial reporting', 'Budget management', 'Donation tracking', 'Expense approval']),

-- Team Leads (Level 3)
('Prayer Ministry Lead', 'Coordinates prayer requests and prayer groups', 'ministry', 3, 1, 'prayer@community.org', ARRAY['Prayer wall moderation', 'Prayer groups', 'Prayer events', 'Spiritual support']),
('Welcome Team Lead', 'Coordinates greeting and hospitality', 'ministry', 3, 2, 'welcome@community.org', ARRAY['Visitor welcome', 'New member integration', 'Hospitality events', 'Community connections']),
('Technology Coordinator', 'Manages digital systems and online presence', 'operations', 3, 3, 'tech@community.org', ARRAY['Website management', 'Audio/visual systems', 'Online services', 'Digital communications']),
('Volunteer Coordinator', 'Recruits and manages community volunteers', 'volunteers', 3, 4, 'volunteers@community.org', ARRAY['Volunteer recruitment', 'Training coordination', 'Volunteer scheduling', 'Recognition programs']);

-- Insert sample committees
INSERT INTO public.committees (name, description, purpose, meeting_schedule, meeting_location) VALUES
('Church Council', 'Main governing body of the community', 'Strategic planning, policy decisions, and community oversight', 'Second Tuesday of each month at 7:00 PM', 'Community Hall'),
('Finance Committee', 'Oversees financial planning and budgeting', 'Budget planning, financial oversight, and stewardship', 'Last Thursday of each month at 6:30 PM', 'Office Conference Room'),
('Worship Committee', 'Plans and coordinates worship services', 'Worship planning, music selection, and service coordination', 'First Sunday after service', 'Sanctuary'),
('Outreach Committee', 'Coordinates community service and missions', 'Community outreach, service projects, and local partnerships', 'Third Saturday at 10:00 AM', 'Community Hall'),
('Building & Grounds Committee', 'Maintains facilities and grounds', 'Facility maintenance, improvement projects, and safety', 'Second Saturday at 9:00 AM', 'Maintenance Room');
