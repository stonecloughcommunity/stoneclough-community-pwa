# Database Schema Documentation

This document describes the complete database schema for the Stoneclough Community PWA.

## Overview

The database uses PostgreSQL with Supabase and implements Row Level Security (RLS) for data protection. The schema is designed to support a comprehensive community platform with features for social interaction, local business directory, events, volunteer management, and more.

## Core Tables

### Authentication & User Management

#### `auth.users` (Supabase managed)
- Core user authentication table managed by Supabase
- Contains email, password hash, and authentication metadata

#### `public.profiles`
- Extended user profile information
- Links to `auth.users` via foreign key
- Contains display name, village, bio, contact info
- Tracks admin and volunteer status

#### `public.user_sessions`
- Enhanced session management for security
- Tracks device info, IP addresses, and session activity
- Supports session revocation and monitoring

### Community Features

#### `public.posts`
- Community posts and announcements
- Supports categories, tags, and rich content
- Tracks likes, comments, and engagement metrics
- Implements content moderation workflow

#### `public.post_likes`
- User likes on community posts
- Prevents duplicate likes per user
- Automatically updates post like counts

#### `public.comments`
- Comments on posts and other content
- Supports nested replies and threading
- Includes moderation and reporting features

#### `public.prayer_requests`
- Prayer wall functionality
- Supports anonymous requests and moderation
- Tracks prayer responses and engagement
- Auto-archives expired requests

#### `public.prayer_responses`
- User responses to prayer requests
- Tracks who has prayed for each request
- Optional message support

### Directory & Business Listings

#### `public.directory_entries`
- Local business and service directory
- Comprehensive business information
- Contact details, hours, categories
- Owner verification and management

#### `public.business_reviews`
- User reviews and ratings for businesses
- 5-star rating system with detailed feedback
- Verification and moderation features
- Helpful vote tracking

### Events & Activities

#### `public.events`
- Community events and activities
- Recurring event support
- Registration and capacity management
- Integration with volunteer opportunities

#### `public.event_registrations`
- User registrations for events
- Tracks attendance and participation
- Supports waitlists and cancellations

#### `public.volunteer_opportunities`
- Volunteer position listings
- Skill matching and requirements
- Application and approval workflow
- Time tracking and recognition

#### `public.volunteer_applications`
- Applications for volunteer positions
- Status tracking and communication
- Background check and approval process

### Environmental Initiatives

#### `public.environmental_initiatives`
- Community environmental projects
- Sustainability and green initiatives
- Impact tracking and metrics
- Participant coordination

#### `public.environmental_participants`
- Participation in environmental projects
- Role assignments and skill tracking
- Commitment level management

### Employment

#### `public.job_postings`
- Local job opportunities
- Full-time, part-time, and volunteer positions
- Application tracking and management
- Expiration and status management

#### `public.job_applications`
- Job applications from community members
- Resume and cover letter storage
- Status tracking and communication

### Organization & Governance

#### `public.organization_roles`
- Organizational chart and role definitions
- Hierarchical structure with departments
- Contact information and responsibilities
- Active status management

#### `public.role_assignments`
- Assignment of users to organizational roles
- Primary role designation
- Assignment tracking and history

#### `public.committees`
- Community committees and groups
- Meeting schedules and locations
- Purpose and description tracking

#### `public.committee_members`
- Committee membership management
- Role assignments within committees
- Join date tracking

### Communication & Notifications

#### `public.notifications`
- System-wide notification management
- Targeted messaging by audience
- Scheduling and delivery tracking
- Emergency alert capabilities

#### `public.notification_preferences`
- User notification preferences
- Channel preferences (push, email)
- Frequency and category settings
- Digest configuration

#### `public.push_subscriptions`
- Web push notification endpoints
- Device and browser tracking
- Subscription management

### Security & Moderation

#### `public.content_moderation`
- Content reporting and moderation
- Multi-stage review process
- Action tracking and appeals
- Automated and manual moderation

#### `public.audit_log`
- System activity logging
- User action tracking
- Security event monitoring
- Compliance and forensics

#### `public.rate_limits`
- API rate limiting enforcement
- Per-user and per-IP tracking
- Sliding window implementation
- Abuse prevention

### System Configuration

#### `public.system_settings`
- Application configuration management
- Feature flags and toggles
- Public and private settings
- Version control and history

## Row Level Security (RLS)

All tables implement comprehensive RLS policies:

### Public Access Patterns
- **Read-only public data**: Events, directory entries, approved posts
- **User-owned data**: Profiles, applications, preferences
- **Admin-managed data**: Moderation, system settings, user management

### Security Principles
1. **Principle of Least Privilege**: Users can only access data they need
2. **Data Ownership**: Users control their own data
3. **Admin Oversight**: Administrators can manage community content
4. **Privacy Protection**: Sensitive data is properly restricted

## Indexes and Performance

### Primary Indexes
- All tables have UUID primary keys with btree indexes
- Foreign key relationships are automatically indexed
- Unique constraints create implicit indexes

### Performance Indexes
- **Temporal queries**: Created/updated timestamps
- **Status filtering**: Active/inactive, published/draft states
- **User associations**: User ID foreign keys
- **Search optimization**: Text search on titles and content
- **Geographic queries**: Location-based filtering

### Query Optimization
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Expression indexes for computed values

## Data Types and Constraints

### Standard Patterns
- **IDs**: UUID with `gen_random_uuid()` default
- **Timestamps**: `TIMESTAMP WITH TIME ZONE` with NOW() default
- **Status fields**: TEXT with CHECK constraints for valid values
- **Counts**: INTEGER with DEFAULT 0 and non-negative constraints
- **JSON data**: JSONB for structured metadata

### Validation Rules
- Email format validation
- Phone number formatting
- URL validation for links
- Text length limits for user input
- Enum-style constraints for categorical data

## Triggers and Functions

### Automatic Updates
- **Updated timestamps**: Auto-update `updated_at` fields
- **Counter maintenance**: Automatic like/comment counting
- **Profile creation**: Auto-create related records for new users
- **Notification preferences**: Default settings for new users

### Data Integrity
- **Cascade deletes**: Proper cleanup of related records
- **Constraint enforcement**: Business rule validation
- **Archive management**: Auto-archive expired content

### Performance Functions
- **Search optimization**: Full-text search functions
- **Aggregation helpers**: Computed statistics and metrics
- **Cleanup routines**: Periodic maintenance tasks

## Migration Strategy

### Version Control
- Sequential numbered migration files
- Rollback scripts for each migration
- Environment-specific configurations
- Data seeding for initial setup

### Deployment Process
1. **Backup current database**
2. **Run migration scripts in order**
3. **Verify data integrity**
4. **Update application configuration**
5. **Monitor for issues**

### Rollback Procedures
- Automated rollback scripts
- Data recovery procedures
- Downtime minimization strategies

## Backup and Recovery

### Backup Strategy
- **Full backups**: Daily complete database dumps
- **Incremental backups**: Hourly transaction log backups
- **Point-in-time recovery**: WAL archiving for precise recovery
- **Cross-region replication**: Geographic redundancy

### Recovery Procedures
- **Automated recovery**: Script-based restoration
- **Manual procedures**: Step-by-step recovery guides
- **Testing protocols**: Regular recovery testing
- **Documentation**: Detailed runbooks

## Monitoring and Maintenance

### Performance Monitoring
- **Query performance**: Slow query identification
- **Index usage**: Unused index cleanup
- **Table statistics**: Regular ANALYZE operations
- **Connection monitoring**: Pool usage and limits

### Maintenance Tasks
- **VACUUM operations**: Regular table maintenance
- **Index rebuilding**: Performance optimization
- **Statistics updates**: Query planner optimization
- **Log rotation**: Storage management

### Health Checks
- **Data integrity**: Constraint validation
- **Referential integrity**: Foreign key consistency
- **Performance metrics**: Response time monitoring
- **Storage usage**: Capacity planning

## Security Considerations

### Access Control
- **Role-based permissions**: Granular access control
- **API security**: Rate limiting and authentication
- **Data encryption**: At-rest and in-transit protection
- **Audit logging**: Complete activity tracking

### Privacy Protection
- **PII handling**: Personal data protection
- **Data retention**: Automatic cleanup policies
- **User consent**: Preference management
- **GDPR compliance**: Right to deletion and portability

### Threat Mitigation
- **SQL injection prevention**: Parameterized queries
- **XSS protection**: Input sanitization
- **CSRF protection**: Token validation
- **Rate limiting**: Abuse prevention
