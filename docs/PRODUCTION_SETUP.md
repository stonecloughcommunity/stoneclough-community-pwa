# Stoneclough PWA Production Setup Guide

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Supabase account
- Vercel account (for deployment)
- Domain name (optional but recommended)

## 1. Supabase Production Setup

### Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and set project details:
   - Name: `stoneclough-pwa-production`
   - Database Password: Generate a strong password
   - Region: Choose closest to UK (eu-west-1 or eu-west-2)

### Configure Database

1. In Supabase dashboard, go to SQL Editor
2. Run the following scripts in order:
   ```sql
   -- Run existing scripts first
   \i scripts/001_create_database_schema.sql
   \i scripts/002_create_profile_trigger.sql
   \i scripts/004_create_prayer_wall.sql
   \i scripts/005_create_notifications_system.sql
   \i scripts/006_create_organizational_chart.sql
   
   -- Run new production scripts
   \i scripts/007_create_production_setup.sql
   \i scripts/008_create_production_functions.sql
   ```

### Configure Authentication

1. Go to Authentication > Settings
2. Configure Site URL: `https://your-domain.com`
3. Add Redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
4. Enable Email Auth
5. Configure Email Templates (optional)

### Setup Row Level Security

All RLS policies are created by the production scripts. Verify they're active:

1. Go to Authentication > Policies
2. Ensure all tables have appropriate policies
3. Test with different user roles

## 2. Environment Variables

### Production Environment Variables

Create these in your deployment platform (Vercel):

```bash
# Required - Get from Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Push Notifications - Generate VAPID keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Community Settings
NEXT_PUBLIC_COMMUNITY_NAME="Stoneclough, Prestolee & Ringley"
NEXT_PUBLIC_SUPPORT_EMAIL=support@stoneclough.uk
```

### Generate VAPID Keys

For push notifications, generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

## 3. Vercel Deployment

### Initial Setup

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

### Environment Variables

Add all production environment variables in Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add each variable from the list above
3. Set Environment to "Production"

### Domain Configuration

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Vercel)

## 4. Security Configuration

### Content Security Policy

Update `next.config.mjs`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          },
        ],
      },
    ];
  },
};
```

### Rate Limiting

Set up Upstash Redis for rate limiting:

1. Create Upstash Redis database
2. Add connection details to environment variables
3. Configure rate limiting in middleware

## 5. Monitoring Setup

### Sentry Error Monitoring

1. Create Sentry project
2. Install Sentry SDK: `pnpm add @sentry/nextjs`
3. Configure `sentry.client.config.js` and `sentry.server.config.js`
4. Add Sentry DSN to environment variables

### Performance Monitoring

1. Enable Vercel Analytics
2. Configure Core Web Vitals tracking
3. Set up custom performance metrics

## 6. Backup Strategy

### Database Backups

Supabase automatically backs up your database, but for additional security:

1. Set up daily database dumps
2. Store backups in separate cloud storage
3. Test backup restoration process

### File Storage Backups

If using file uploads:

1. Configure automatic backups of storage bucket
2. Set up versioning for important files
3. Test file restoration process

## 7. SSL/TLS Configuration

### HTTPS Setup

Vercel automatically provides SSL certificates. For custom domains:

1. Ensure DNS is properly configured
2. Verify SSL certificate is active
3. Test HTTPS redirect functionality

### Security Headers

Verify security headers are properly set:

```bash
curl -I https://your-domain.com
```

Check for:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Content-Security-Policy`

## 8. Performance Optimization

### CDN Configuration

Vercel provides global CDN automatically. Additional optimizations:

1. Optimize images with Next.js Image component
2. Enable compression for static assets
3. Configure proper cache headers

### Database Performance

1. Monitor query performance in Supabase
2. Add indexes for frequently queried columns
3. Use database connection pooling

## 9. Testing Production Setup

### Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed and tested
- [ ] Authentication working correctly
- [ ] All features functional
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] SSL certificate active
- [ ] Backup systems tested
- [ ] Monitoring systems active
- [ ] Error tracking configured

### Load Testing

1. Test with multiple concurrent users
2. Monitor database performance under load
3. Verify caching is working correctly
4. Test failover scenarios

## 10. Go-Live Process

### Final Steps

1. Update DNS to point to production
2. Test all functionality on production domain
3. Monitor error rates and performance
4. Have rollback plan ready
5. Notify community of launch

### Post-Launch Monitoring

1. Monitor error rates in Sentry
2. Check performance metrics
3. Monitor database usage
4. Review user feedback
5. Plan first updates based on usage patterns

## Support and Maintenance

### Regular Maintenance Tasks

- Weekly: Review error logs and performance metrics
- Monthly: Update dependencies and security patches
- Quarterly: Review and optimize database performance
- Annually: Security audit and penetration testing

### Emergency Procedures

1. Have emergency contact list ready
2. Document rollback procedures
3. Set up alerting for critical issues
4. Maintain emergency access to all systems
