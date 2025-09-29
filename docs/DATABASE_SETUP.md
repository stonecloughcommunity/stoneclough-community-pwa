# Database Setup Guide

This guide walks through setting up the complete database schema for the Stoneclough Community PWA.

## Prerequisites

- Supabase project created and configured
- Environment variables set up (see `.env.example`)
- Node.js and npm installed
- Database access credentials

## Quick Setup

### 1. Environment Configuration

Ensure your `.env.local` file contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Run Migrations

```bash
# Check current migration status
npm run db:migrate:status

# Apply all pending migrations
npm run db:migrate:custom

# Or use Supabase CLI for basic setup
npm run db:migrate
```

### 3. Verify Setup

```bash
# Check migration status again
npm run db:migrate:status

# Seed with sample data (optional)
npm run db:seed
```

## Migration Files

The database schema is defined in numbered SQL migration files:

```
scripts/
├── 001_initial_schema.sql          # Core tables (profiles, posts, etc.)
├── 002_create_directory.sql        # Business directory
├── 003_create_events_volunteers.sql # Events and volunteer management
├── 004_create_prayer_wall.sql      # Prayer requests and responses
├── 005_create_notifications_system.sql # Notification system
├── 006_create_organizational_chart.sql # Organization structure
├── 010_create_missing_tables.sql   # Additional tables
└── run-migrations.ts               # Migration runner script
```

## Manual Setup (Alternative)

If you prefer to run migrations manually:

### 1. Connect to Database

```bash
# Using Supabase CLI
supabase db connect

# Or using psql directly
psql "postgresql://postgres:[password]@[host]:5432/postgres"
```

### 2. Run Migration Files in Order

```sql
-- Run each file in numerical order
\i scripts/001_initial_schema.sql
\i scripts/002_create_directory.sql
\i scripts/003_create_events_volunteers.sql
\i scripts/004_create_prayer_wall.sql
\i scripts/005_create_notifications_system.sql
\i scripts/006_create_organizational_chart.sql
\i scripts/010_create_missing_tables.sql
```

### 3. Verify Tables Created

```sql
-- List all tables
\dt public.*

-- Check specific table structure
\d public.profiles
\d public.posts
\d public.events
```

## Database Schema Overview

### Core Tables

1. **User Management**
   - `profiles` - Extended user information
   - `user_sessions` - Session tracking
   - `audit_log` - Activity logging

2. **Community Features**
   - `posts` - Community posts
   - `post_likes` - Post engagement
   - `comments` - Comments system
   - `prayer_requests` - Prayer wall
   - `prayer_responses` - Prayer interactions

3. **Directory & Business**
   - `directory_entries` - Business listings
   - `business_reviews` - Reviews and ratings

4. **Events & Volunteering**
   - `events` - Community events
   - `event_registrations` - Event signups
   - `volunteer_opportunities` - Volunteer positions
   - `volunteer_applications` - Applications

5. **Organization**
   - `organization_roles` - Organizational chart
   - `role_assignments` - Role assignments
   - `committees` - Committee structure
   - `committee_members` - Memberships

6. **Communication**
   - `notifications` - System notifications
   - `notification_preferences` - User preferences
   - `push_subscriptions` - Push notification endpoints

7. **Additional Features**
   - `job_postings` - Employment opportunities
   - `job_applications` - Job applications
   - `environmental_initiatives` - Green projects
   - `content_moderation` - Content management
   - `system_settings` - Configuration

## Row Level Security (RLS)

All tables implement comprehensive RLS policies:

### Policy Types

1. **Public Read**: Anyone can view approved/active content
2. **Owner Access**: Users can manage their own data
3. **Admin Override**: Administrators have full access
4. **Conditional Access**: Role-based or status-based access

### Example Policies

```sql
-- Users can view their own profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Anyone can view active events
CREATE POLICY "Anyone can view active events" ON events
  FOR SELECT USING (status = 'active');

-- Admins can manage all content
CREATE POLICY "Admins can manage posts" ON posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
```

## Indexes and Performance

### Automatic Indexes

- Primary keys (UUID)
- Foreign key relationships
- Unique constraints

### Custom Indexes

- Timestamp queries (`created_at`, `updated_at`)
- Status filtering (`status`, `is_active`)
- User associations (`user_id`, `author_id`)
- Search optimization (text fields)
- Geographic queries (location data)

### Query Optimization

```sql
-- Example optimized queries
EXPLAIN ANALYZE SELECT * FROM posts 
WHERE status = 'published' 
ORDER BY created_at DESC 
LIMIT 20;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

## Backup and Recovery

### Automated Backups

Supabase provides automatic backups, but you can also create manual backups:

```bash
# Create backup
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" > backup.sql

# Restore from backup
psql "postgresql://postgres:[password]@[host]:5432/postgres" < backup.sql
```

### Migration Rollback

```bash
# Reset database (DANGER: destroys all data)
npm run db:migrate:reset

# Reapply migrations
npm run db:migrate:custom
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   Error: permission denied for table profiles
   ```
   - Check RLS policies are correctly configured
   - Verify user authentication
   - Ensure service role key is used for admin operations

2. **Foreign Key Violations**
   ```
   Error: insert or update on table violates foreign key constraint
   ```
   - Check referenced records exist
   - Verify UUID format is correct
   - Ensure proper cascade settings

3. **Migration Failures**
   ```
   Error: relation "table_name" already exists
   ```
   - Check migration status: `npm run db:migrate:status`
   - Skip already applied migrations
   - Use `IF NOT EXISTS` in CREATE statements

### Debug Commands

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- View table constraints
SELECT conname, contype, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Monitoring

```sql
-- Slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
```

## Development Workflow

### Local Development

1. **Start with clean database**
   ```bash
   npm run db:migrate:reset
   npm run db:migrate:custom
   ```

2. **Make schema changes**
   - Create new migration file with next number
   - Test migration locally
   - Commit changes

3. **Deploy to staging**
   ```bash
   npm run db:migrate:custom
   ```

4. **Deploy to production**
   - Backup production database
   - Apply migrations during maintenance window
   - Verify functionality

### Schema Changes

1. **Create Migration File**
   ```bash
   # Create new migration file
   touch scripts/011_add_new_feature.sql
   ```

2. **Write Migration**
   ```sql
   -- Add new table or modify existing
   CREATE TABLE IF NOT EXISTS public.new_feature (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     -- ... columns
   );
   
   -- Add RLS policies
   ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;
   -- ... policies
   ```

3. **Test Migration**
   ```bash
   npm run db:migrate:custom
   npm run db:migrate:status
   ```

## Security Considerations

### Access Control

- Use service role key only for admin operations
- Implement proper RLS policies for all tables
- Regularly audit user permissions
- Monitor for suspicious activity

### Data Protection

- Encrypt sensitive data at application level
- Use HTTPS for all database connections
- Implement proper backup encryption
- Regular security updates

### Compliance

- GDPR compliance for user data
- Data retention policies
- User consent management
- Right to deletion implementation

## Monitoring and Maintenance

### Regular Tasks

- **Weekly**: Check slow queries and optimize
- **Monthly**: Review and update statistics
- **Quarterly**: Full backup and recovery test
- **Annually**: Security audit and policy review

### Monitoring Queries

```sql
-- Database health check
SELECT 
  pg_database_size(current_database()) as db_size,
  (SELECT count(*) FROM pg_stat_activity) as connections,
  (SELECT count(*) FROM pg_locks) as locks;

-- Table growth monitoring
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_tuples_inserted(c.oid) as inserts,
  pg_stat_get_tuples_updated(c.oid) as updates,
  pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
