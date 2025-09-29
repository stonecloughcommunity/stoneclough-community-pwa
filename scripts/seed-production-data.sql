-- Stoneclough Community PWA - Production Data Seeding
-- This script seeds the database with initial production data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert departments
INSERT INTO departments (id, name, slug, description, color, icon, sort_order, is_active) VALUES
('1', 'Faith & Culture', 'faith-culture', 'Spiritual life, worship, cultural heritage, and interfaith dialogue', '#8B5CF6', 'church', 1, true),
('2', 'Community & Wellbeing', 'community-wellbeing', 'Health, social connections, community support, and wellbeing initiatives', '#EF4444', 'heart', 2, true),
('3', 'Economy & Enterprise', 'economy-enterprise', 'Local business, jobs, economic development, and entrepreneurship', '#F59E0B', 'briefcase', 3, true),
('4', 'Land, Food & Sustainability', 'land-food-sustainability', 'Environmental stewardship, sustainable living, and community gardens', '#10B981', 'leaf', 4, true),
('5', 'Technology & Platform', 'technology-platform', 'Digital literacy, technology support, and platform development', '#3B82F6', 'monitor', 5, true),
('6', 'Governance & Growth', 'governance-growth', 'Community leadership, partnerships, and organizational development', '#6366F1', 'handshake', 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Insert villages
INSERT INTO villages (name, description, postcode_prefix, coordinates) VALUES
('Stoneclough', 'Historic village with rich heritage and strong community spirit', 'BL9', POINT(-2.3856, 53.5547)),
('Prestolee', 'Charming village known for its community initiatives and local pride', 'BL9', POINT(-2.3789, 53.5523)),
('Ringley', 'Picturesque village with beautiful countryside and close-knit community', 'BL9', POINT(-2.3923, 53.5571))
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  coordinates = EXCLUDED.coordinates;

-- Insert directory categories
INSERT INTO directory_categories (name, description, icon, sort_order) VALUES
('Emergency Services', 'Police, Fire, Ambulance, and emergency contacts', 'phone', 1),
('Healthcare', 'GP surgeries, pharmacies, hospitals, and health services', 'heart-pulse', 2),
('Education', 'Schools, colleges, libraries, and educational resources', 'graduation-cap', 3),
('Transport', 'Bus stops, train stations, taxi services, and transport info', 'bus', 4),
('Local Government', 'Council services, councillors, and civic information', 'building', 5),
('Places of Worship', 'Churches, mosques, temples, and religious organizations', 'church', 6),
('Community Groups', 'Local clubs, societies, and volunteer organizations', 'users', 7),
('Local Business', 'Shops, restaurants, services, and local enterprises', 'store', 8),
('Recreation', 'Parks, sports facilities, entertainment, and leisure', 'tree-pine', 9),
('Utilities', 'Gas, electric, water, internet, and utility providers', 'zap', 10)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- Insert essential directory items
INSERT INTO directory_items (
  title, description, category_id, phone, email, website, address, 
  opening_hours, village, is_emergency, is_featured, tags
) VALUES
-- Emergency Services
('Greater Manchester Police', 'Local police station and emergency services', 
 (SELECT id FROM directory_categories WHERE name = 'Emergency Services'), 
 '101', 'contact@gmp.police.uk', 'https://www.gmp.police.uk', 
 'Bolton Police Station, Chorley Old Road, Bolton BL1 3AX', 
 '24/7', 'Stoneclough', true, true, ARRAY['police', 'emergency', '999']),

('NHS 111', 'Non-emergency medical advice and support', 
 (SELECT id FROM directory_categories WHERE name = 'Healthcare'), 
 '111', NULL, 'https://www.nhs.uk/using-the-nhs/nhs-services/urgent-and-emergency-care/nhs-111/', 
 NULL, '24/7', NULL, true, true, ARRAY['nhs', 'medical', 'advice']),

-- Healthcare
('Stoneclough Medical Centre', 'Local GP surgery serving the community', 
 (SELECT id FROM directory_categories WHERE name = 'Healthcare'), 
 '01204 572345', 'reception@stonecloughmedical.nhs.uk', NULL, 
 'Manchester Road, Stoneclough, Bolton BL9 9ND', 
 'Mon-Fri: 8:00-18:30, Sat: 8:00-12:00', 'Stoneclough', false, true, 
 ARRAY['gp', 'doctor', 'medical', 'nhs']),

-- Education
('Stoneclough Primary School', 'Local primary school for ages 4-11', 
 (SELECT id FROM directory_categories WHERE name = 'Education'), 
 '01204 333456', 'office@stoneclough.bolton.sch.uk', 'https://www.stonecloughprimary.co.uk', 
 'School Lane, Stoneclough, Bolton BL9 9NE', 
 'Mon-Fri: 8:30-15:30', 'Stoneclough', false, true, 
 ARRAY['school', 'primary', 'education', 'children']),

-- Transport
('Kearsley Railway Station', 'Nearest railway station with connections to Manchester', 
 (SELECT id FROM directory_categories WHERE name = 'Transport'), 
 '03457 484950', NULL, 'https://www.nationalrail.co.uk', 
 'Station Road, Kearsley, Bolton BL4 8QH', 
 'Daily: 05:30-23:30', 'Stoneclough', false, true, 
 ARRAY['train', 'railway', 'manchester', 'transport']),

-- Places of Worship
('St. Saviour''s Church', 'Anglican church serving the local community', 
 (SELECT id FROM directory_categories WHERE name = 'Places of Worship'), 
 '01204 572123', 'vicar@stsaviours-stoneclough.org.uk', 'https://www.stsaviours-stoneclough.org.uk', 
 'Church Lane, Stoneclough, Bolton BL9 9NF', 
 'Sunday: 8:00, 10:30, 18:30; Wed: 10:00', 'Stoneclough', false, true, 
 ARRAY['church', 'anglican', 'worship', 'community']),

-- Community Groups
('Stoneclough Community Centre', 'Hub for community activities and events', 
 (SELECT id FROM directory_categories WHERE name = 'Community Groups'), 
 '01204 572789', 'info@stonecloughcommunity.org.uk', 'https://www.stonecloughcommunity.org.uk', 
 'Manchester Road, Stoneclough, Bolton BL9 9ND', 
 'Mon-Fri: 9:00-17:00, Sat: 9:00-13:00', 'Stoneclough', false, true, 
 ARRAY['community', 'centre', 'events', 'activities']),

-- Local Business
('Stoneclough Post Office', 'Local post office and convenience store', 
 (SELECT id FROM directory_categories WHERE name = 'Local Business'), 
 '01204 572456', NULL, NULL, 
 'Manchester Road, Stoneclough, Bolton BL9 9ND', 
 'Mon-Fri: 9:00-17:30, Sat: 9:00-13:00', 'Stoneclough', false, true, 
 ARRAY['post office', 'shop', 'convenience', 'local'])

ON CONFLICT (title, village) DO UPDATE SET
  description = EXCLUDED.description,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  opening_hours = EXCLUDED.opening_hours,
  updated_at = NOW();

-- Insert sample community posts for each department
INSERT INTO community_posts (
  title, content, department_id, author_id, status, is_featured, tags, village
) VALUES
('Welcome to Our Digital Community!', 
 'We''re excited to launch our new community platform connecting Stoneclough, Prestolee, and Ringley. This space is for sharing news, organizing events, supporting each other, and strengthening our community bonds. Please introduce yourself and let us know how you''d like to get involved!', 
 '2', NULL, 'published', true, 
 ARRAY['welcome', 'community', 'introduction'], NULL),

('Sunday Service Times', 
 'Join us for worship at St. Saviour''s Church. Sunday services at 8:00 AM (Traditional), 10:30 AM (Family Service), and 6:30 PM (Evening Prayer). All are welcome regardless of background or faith tradition. We also have a Wednesday morning service at 10:00 AM.', 
 '1', NULL, 'published', true, 
 ARRAY['church', 'worship', 'sunday', 'community'], 'Stoneclough'),

('Community Garden Project', 
 'We''re starting a community garden behind the community centre! Looking for volunteers to help with planning, planting, and maintenance. This is a great opportunity to grow fresh produce, learn about sustainable gardening, and connect with neighbors. No experience necessary - just enthusiasm!', 
 '4', NULL, 'published', true, 
 ARRAY['garden', 'volunteers', 'sustainability', 'community'], 'Stoneclough'),

('Local Business Directory', 
 'Support our local businesses! We''re building a comprehensive directory of all the shops, services, and enterprises in our villages. If you run a business or know of one that should be included, please let us know. Together we can keep our local economy thriving.', 
 '3', NULL, 'published', false, 
 ARRAY['business', 'local', 'directory', 'economy'], NULL),

('Digital Skills Workshop', 
 'Free digital skills workshop every Tuesday at 2:00 PM in the community centre. Learn how to use smartphones, tablets, video calling, online shopping, and this community app! Suitable for all ages and skill levels. Tea and biscuits provided.', 
 '5', NULL, 'published', true, 
 ARRAY['digital', 'workshop', 'learning', 'technology'], 'Stoneclough'),

('Community Leadership Opportunities', 
 'Interested in helping shape our community''s future? We''re looking for residents to join our various committees and working groups. Whether you have experience or just passion for making a difference, there''s a place for you. Contact us to learn more about current opportunities.', 
 '6', NULL, 'published', false, 
 ARRAY['leadership', 'volunteer', 'committees', 'governance'], NULL)

ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (
  title, description, start_time, end_time, location, department_id, 
  organizer_id, max_attendees, is_featured, tags, village, event_type
) VALUES
('Village Coffee Morning', 
 'Join us for our weekly coffee morning! A relaxed opportunity to meet neighbors, catch up on local news, and enjoy homemade cakes. All ages welcome. Donations support local community projects.', 
 NOW() + INTERVAL '3 days' + TIME '10:00', 
 NOW() + INTERVAL '3 days' + TIME '12:00', 
 'Stoneclough Community Centre', '2', NULL, 50, true, 
 ARRAY['coffee', 'social', 'community', 'weekly'], 'Stoneclough', 'social'),

('Sunday Family Service', 
 'Family-friendly church service with children''s activities, modern music, and refreshments afterwards. A warm welcome awaits everyone, whether you''re a regular churchgoer or just curious about faith.', 
 NOW() + INTERVAL '6 days' + TIME '10:30', 
 NOW() + INTERVAL '6 days' + TIME '12:00', 
 'St. Saviour''s Church', '1', NULL, 100, true, 
 ARRAY['church', 'family', 'worship', 'sunday'], 'Stoneclough', 'worship'),

('Community Garden Workday', 
 'Help us prepare the community garden for spring planting! Bring gloves and enthusiasm - tools and refreshments provided. Great for families and a wonderful way to contribute to our sustainable future.', 
 NOW() + INTERVAL '10 days' + TIME '14:00', 
 NOW() + INTERVAL '10 days' + TIME '17:00', 
 'Community Garden (behind Community Centre)', '4', NULL, 30, false, 
 ARRAY['garden', 'volunteer', 'environment', 'community'], 'Stoneclough', 'volunteer'),

('Local Business Networking', 
 'Monthly networking breakfast for local business owners and entrepreneurs. Share experiences, explore collaborations, and support each other''s ventures. Light breakfast provided.', 
 NOW() + INTERVAL '14 days' + TIME '08:00', 
 NOW() + INTERVAL '14 days' + TIME '10:00', 
 'Stoneclough Community Centre', '3', NULL, 25, false, 
 ARRAY['business', 'networking', 'entrepreneurs', 'breakfast'], 'Stoneclough', 'business')

ON CONFLICT DO NOTHING;

-- Insert notification templates
INSERT INTO notification_templates (
  name, subject, body, type, department_id, is_active
) VALUES
('welcome_new_user', 'Welcome to Stoneclough Community!', 
 'Hello {{user_name}}! Welcome to our digital community platform. We''re delighted you''ve joined us. Take a moment to explore the different departments, introduce yourself in the community section, and see what events are coming up. If you need any help getting started, don''t hesitate to reach out.', 
 'email', NULL, true),

('event_reminder', 'Reminder: {{event_title}}', 
 'This is a friendly reminder that {{event_title}} is happening {{event_time}}. We''re looking forward to seeing you there! Location: {{event_location}}. If you can no longer attend, please let us know so we can offer your place to someone else.', 
 'email', NULL, true),

('new_community_post', 'New Community Post: {{post_title}}', 
 'There''s a new post in the {{department_name}} section that might interest you: {{post_title}}. Check it out on the community platform and join the conversation!', 
 'push', NULL, true),

('emergency_alert', 'URGENT: Community Alert', 
 'This is an urgent message for our community: {{alert_message}}. Please take appropriate action and stay safe. For more information, check the community platform or contact emergency services if needed.', 
 'sms', NULL, true)

ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();

-- Insert system settings
INSERT INTO system_settings (key, value, description, category) VALUES
('site_name', 'Stoneclough Community', 'Name of the community platform', 'general'),
('site_description', 'Digital community platform for Stoneclough, Prestolee & Ringley villages', 'Description of the platform', 'general'),
('contact_email', 'hello@stoneclough.uk', 'Main contact email address', 'contact'),
('emergency_contact', '+44xxxxxxxxxx', 'Emergency contact phone number', 'contact'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'uploads'),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx', 'Allowed file upload types', 'uploads'),
('auto_approve_posts', 'false', 'Whether to automatically approve community posts', 'moderation'),
('require_email_verification', 'true', 'Whether email verification is required for new users', 'auth'),
('session_timeout_minutes', '30', 'Session timeout in minutes', 'auth'),
('rate_limit_requests_per_minute', '60', 'Rate limit for API requests per minute', 'security'),
('enable_push_notifications', 'true', 'Whether push notifications are enabled', 'notifications'),
('enable_email_notifications', 'true', 'Whether email notifications are enabled', 'notifications'),
('maintenance_mode', 'false', 'Whether the site is in maintenance mode', 'system'),
('privacy_policy_url', '/privacy', 'URL to the privacy policy', 'legal'),
('terms_of_service_url', '/terms', 'URL to the terms of service', 'legal')

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create initial admin user (this would typically be done through the application)
-- Note: In production, this should be done securely through the application interface

COMMIT;
