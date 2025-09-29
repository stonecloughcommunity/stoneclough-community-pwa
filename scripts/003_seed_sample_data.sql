-- Sample data for development and testing

-- Insert sample directory entries (no user_id needed for public listings)
INSERT INTO public.directory_entries (name, description, category, address, phone, opening_hours, is_verified) VALUES
('The Village Bakery', 'Fresh bread and pastries daily', 'shop', 'High Street, Stoneclough', '01204 123456', '{"monday": "7:00-17:00", "tuesday": "7:00-17:00", "wednesday": "7:00-17:00", "thursday": "7:00-17:00", "friday": "7:00-17:00", "saturday": "7:00-15:00", "sunday": "closed"}', true),
('Prestolee Post Office', 'Postal services and local shop', 'service', 'Main Road, Prestolee', '01204 234567', '{"monday": "9:00-17:30", "tuesday": "9:00-17:30", "wednesday": "9:00-17:30", "thursday": "9:00-17:30", "friday": "9:00-17:30", "saturday": "9:00-13:00", "sunday": "closed"}', true),
('St Bartholomew Church', 'Anglican church serving the community', 'religious', 'Church Lane, Ringley', '01204 345678', '{"sunday": "10:00-11:30"}', true),
('Village Hall', 'Community events and meetings', 'other', 'Village Green, Stoneclough', '01204 456789', '{"monday": "available", "tuesday": "available", "wednesday": "available", "thursday": "available", "friday": "available", "saturday": "available", "sunday": "available"}', true);

-- Note: Events, posts, and volunteer opportunities will be created by users after they sign up
-- This ensures proper RLS compliance and realistic data flow
