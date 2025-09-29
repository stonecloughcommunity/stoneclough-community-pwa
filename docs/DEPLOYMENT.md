# Stoneclough PWA Deployment Guide

## Vercel Deployment Configuration

### Prerequisites

1. GitHub repository connected to Vercel
2. Production Supabase project configured
3. Domain name ready (optional)
4. All environment variables prepared

### Vercel Project Setup

#### 1. Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository: `stoneclough.uk/community-pwa`

#### 2. Configure Build Settings

Vercel will auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install`
- **Development Command**: `pnpm dev`

#### 3. Environment Variables

Add these environment variables in Vercel Dashboard > Project Settings > Environment Variables:

**Required Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

**Push Notifications:**
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

**Monitoring & Analytics:**
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
```

**Community Settings:**
```bash
NEXT_PUBLIC_COMMUNITY_NAME="Stoneclough, Prestolee & Ringley"
NEXT_PUBLIC_COMMUNITY_SHORT_NAME="Village Community"
NEXT_PUBLIC_SUPPORT_EMAIL=support@stoneclough.uk
NEXT_PUBLIC_ADMIN_EMAIL=admin@stoneclough.uk
```

**Feature Flags:**
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

#### 4. Domain Configuration

**Using Custom Domain:**

1. Go to Project Settings > Domains
2. Add your domain: `stoneclough.uk`
3. Add www subdomain: `www.stoneclough.uk`
4. Configure DNS records as instructed by Vercel:
   - A record: `76.76.19.61`
   - CNAME record for www: `cname.vercel-dns.com`

**SSL Certificate:**
- Vercel automatically provisions SSL certificates
- Verify HTTPS is working after DNS propagation

### Deployment Process

#### 1. Initial Deployment

1. Push code to main branch
2. Vercel automatically deploys
3. Monitor build logs for any issues
4. Test deployment on preview URL

#### 2. Production Deployment

1. Merge to production branch (if using separate branches)
2. Vercel deploys to production domain
3. Run post-deployment checks

#### 3. Post-Deployment Verification

**Functional Tests:**
- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] Database connections working
- [ ] PWA installation prompt appears
- [ ] Service worker registers correctly
- [ ] Push notifications work (if configured)
- [ ] All major features functional

**Performance Tests:**
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals pass
- [ ] Page load times < 3 seconds
- [ ] Images optimized and loading

**Security Tests:**
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] CSP policy not blocking functionality
- [ ] No mixed content warnings

### Environment-Specific Configurations

#### Development
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

#### Staging (Preview)
```bash
NEXT_PUBLIC_APP_URL=https://your-preview-url.vercel.app
NODE_ENV=production
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true
```

#### Production
```bash
NEXT_PUBLIC_APP_URL=https://stoneclough.uk
NODE_ENV=production
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

### Continuous Deployment

#### Branch Strategy

- **main**: Development branch (auto-deploy to preview)
- **production**: Production branch (auto-deploy to production domain)
- **feature/***: Feature branches (deploy to unique preview URLs)

#### Deployment Triggers

- **Push to main**: Deploy to preview environment
- **Push to production**: Deploy to production domain
- **Pull Request**: Deploy to unique preview URL for testing

#### Build Optimization

The `vercel.json` configuration includes:

- **Caching**: Optimized cache headers for static assets
- **Compression**: Automatic gzip compression
- **Edge Functions**: API routes optimized for edge deployment
- **Cron Jobs**: Scheduled tasks for maintenance

### Monitoring and Alerts

#### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor Core Web Vitals
3. Track user engagement metrics
4. Set up performance alerts

#### Error Monitoring

1. Sentry integration for error tracking
2. Real-time error alerts
3. Performance monitoring
4. User session replay (optional)

#### Uptime Monitoring

1. Set up external uptime monitoring
2. Configure alerts for downtime
3. Monitor API endpoint availability
4. Track response times

### Rollback Procedures

#### Quick Rollback

1. Go to Vercel Dashboard > Deployments
2. Find last known good deployment
3. Click "Promote to Production"
4. Verify rollback successful

#### Database Rollback

1. If database changes were made, restore from backup
2. Run rollback migrations if available
3. Test data integrity after rollback

### Troubleshooting Common Issues

#### Build Failures

**TypeScript Errors:**
- Check for type errors in code
- Verify all dependencies are installed
- Check tsconfig.json configuration

**Environment Variable Issues:**
- Verify all required variables are set
- Check variable names match exactly
- Ensure sensitive variables are not in client bundle

**Memory Issues:**
- Optimize bundle size
- Check for memory leaks in build process
- Consider upgrading Vercel plan if needed

#### Runtime Issues

**Database Connection:**
- Verify Supabase URL and keys
- Check RLS policies
- Monitor connection pool usage

**Performance Issues:**
- Check Core Web Vitals
- Optimize images and assets
- Review database query performance
- Enable caching where appropriate

#### SSL/Domain Issues

**Certificate Problems:**
- Verify DNS configuration
- Check domain ownership
- Wait for DNS propagation (up to 48 hours)

**Redirect Issues:**
- Check redirect configuration in next.config.mjs
- Verify HTTPS redirect is working
- Test all domain variants (www, non-www)

### Maintenance Windows

#### Scheduled Maintenance

- **Weekly**: Dependency updates and security patches
- **Monthly**: Performance optimization and cleanup
- **Quarterly**: Major feature deployments

#### Emergency Maintenance

- Have rollback plan ready
- Communicate with users via status page
- Monitor error rates during deployment
- Be prepared to rollback quickly if issues arise

### Performance Optimization

#### Bundle Analysis

```bash
# Analyze bundle size
pnpm build
pnpm analyze

# Check for unused dependencies
pnpm depcheck
```

#### Image Optimization

- Use Next.js Image component
- Configure Cloudinary for dynamic optimization
- Implement lazy loading for images
- Use modern image formats (WebP, AVIF)

#### Caching Strategy

- Static assets: 1 year cache
- API responses: Appropriate cache headers
- Service worker: Cache-first for static, network-first for dynamic
- CDN: Leverage Vercel's global CDN

### Security Considerations

#### Environment Variables

- Never commit secrets to repository
- Use Vercel's encrypted environment variables
- Rotate keys regularly
- Audit access to sensitive variables

#### Content Security Policy

- Strict CSP headers configured
- Regular security audits
- Monitor for CSP violations
- Update policies as needed

#### Rate Limiting

- Implement rate limiting on API routes
- Monitor for abuse patterns
- Configure appropriate limits for different endpoints
- Use Redis for distributed rate limiting
