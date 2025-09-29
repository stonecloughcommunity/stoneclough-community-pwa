-- Community PWA Database Schema for Stoneclough, Prestolee & Ringley villages

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  phone TEXT,
  address TEXT,
  village TEXT CHECK (village IN ('Stoneclough', 'Prestolee', 'Ringley')),
  is_volunteer BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('community', 'religious', 'social', 'educational', 'health', 'other')),
  is_recurring BOOLEAN DEFAULT FALSE,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('attending', 'maybe', 'not_attending')) DEFAULT 'attending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create community_posts table (for need/offer board)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type TEXT CHECK (post_type IN ('need', 'offer', 'announcement', 'question')) NOT NULL,
  category TEXT CHECK (category IN ('transport', 'shopping', 'gardening', 'childcare', 'elderly_care', 'repairs', 'other')),
  status TEXT CHECK (status IN ('active', 'fulfilled', 'expired')) DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_responses table
CREATE TABLE IF NOT EXISTS public.post_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create directory_entries table (local businesses and services)
CREATE TABLE IF NOT EXISTS public.directory_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('restaurant', 'shop', 'service', 'healthcare', 'education', 'religious', 'other')) NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volunteer_opportunities table
CREATE TABLE IF NOT EXISTS public.volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skills_needed TEXT[],
  time_commitment TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  max_volunteers INTEGER,
  status TEXT CHECK (status IN ('active', 'filled', 'completed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volunteer_applications table
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES public.volunteer_opportunities(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for events
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Event organizers can update their events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Event organizers can delete their events" ON public.events FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for event_attendees
CREATE POLICY "Anyone can view event attendees" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Users can manage their own attendance" ON public.event_attendees FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for community_posts
CREATE POLICY "Anyone can view active posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Post authors can update their posts" ON public.community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Post authors can delete their posts" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for post_responses
CREATE POLICY "Anyone can view post responses" ON public.post_responses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create responses" ON public.post_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Response authors can update their responses" ON public.post_responses FOR UPDATE USING (auth.uid() = responder_id);
CREATE POLICY "Response authors can delete their responses" ON public.post_responses FOR DELETE USING (auth.uid() = responder_id);

-- RLS Policies for directory_entries
CREATE POLICY "Anyone can view directory entries" ON public.directory_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create directory entries" ON public.directory_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Entry owners can update their entries" ON public.directory_entries FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Entry owners can delete their entries" ON public.directory_entries FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for volunteer_opportunities
CREATE POLICY "Anyone can view volunteer opportunities" ON public.volunteer_opportunities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create opportunities" ON public.volunteer_opportunities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Organizers can update their opportunities" ON public.volunteer_opportunities FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their opportunities" ON public.volunteer_opportunities FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for volunteer_applications
CREATE POLICY "Organizers and volunteers can view applications" ON public.volunteer_applications 
  FOR SELECT USING (
    auth.uid() = volunteer_id OR 
    auth.uid() IN (SELECT organizer_id FROM public.volunteer_opportunities WHERE id = opportunity_id)
  );
CREATE POLICY "Volunteers can create applications" ON public.volunteer_applications FOR INSERT WITH CHECK (auth.uid() = volunteer_id);
CREATE POLICY "Volunteers can update their applications" ON public.volunteer_applications FOR UPDATE USING (auth.uid() = volunteer_id);
CREATE POLICY "Volunteers can delete their applications" ON public.volunteer_applications FOR DELETE USING (auth.uid() = volunteer_id);
