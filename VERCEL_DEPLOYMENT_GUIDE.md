# 🚀 Vercel Deployment Guide - Stoneclough Community PWA

## Quick Deployment Steps

### **Option 1: Deploy via Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in with your GitHub account

2. **Import GitHub Repository**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `stonecloughcommunity/stoneclough-community-pwa`

3. **Configure Project Settings**
   - **Project Name**: `stoneclough-community-pwa`
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (leave default)
   - **Install Command**: `npm ci`

4. **Environment Variables**
   Add these essential environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=https://your-vercel-app.vercel.app
   CSRF_SECRET=your-csrf-secret
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at: `https://stoneclough-community-pwa.vercel.app`

### **Option 2: Deploy via CLI (Alternative)**

If you prefer command line:

```bash
# Login to Vercel (opens browser)
vercel login

# Deploy the project
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: stoneclough-community-pwa
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

## **Environment Variables Setup**

### **Required Variables**
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication (Required)
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-app-name.vercel.app

# Security (Required)
CSRF_SECRET=your-csrf-secret-here
NODE_ENV=production
```

### **Optional Variables (for full features)**
```env
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Email (Resend)
RESEND_API_KEY=re_your-resend-api-key

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+44xxxxxxxxxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_MATOMO_URL=https://your-matomo-instance.com
NEXT_PUBLIC_MATOMO_SITE_ID=1

# Maps & Weather
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
OPENWEATHER_API_KEY=your-openweather-key

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## **Post-Deployment Setup**

### **1. Verify Deployment**
- Visit your Vercel app URL
- Check that the homepage loads correctly
- Test navigation between pages
- Verify PWA features work

### **2. Set Up Custom Domain (Optional)**
- In Vercel dashboard, go to Project Settings → Domains
- Add your custom domain: `community.stoneclough.uk`
- Configure DNS records as instructed

### **3. Configure Supabase**
- Add your Vercel URL to Supabase Auth settings
- Update redirect URLs in Supabase dashboard
- Test authentication flow

### **4. Test Core Features**
- User registration and login
- Creating posts and events
- PWA installation
- Offline functionality

## **Troubleshooting**

### **Build Errors**
If build fails, check:
- All environment variables are set
- No TypeScript errors in code
- Dependencies are properly installed

### **Runtime Errors**
If app loads but has errors:
- Check Vercel function logs
- Verify Supabase connection
- Check browser console for client errors

### **PWA Issues**
If PWA features don't work:
- Ensure HTTPS is enabled (automatic on Vercel)
- Check service worker registration
- Verify manifest.json is accessible

## **Performance Optimization**

### **Automatic Optimizations**
Vercel automatically provides:
- Global CDN
- Image optimization
- Automatic compression
- Edge caching

### **Manual Optimizations**
- Enable Analytics in Vercel dashboard
- Set up monitoring alerts
- Configure custom headers (already in vercel.json)

## **Monitoring & Maintenance**

### **Vercel Analytics**
- Enable in Project Settings → Analytics
- Monitor Core Web Vitals
- Track user engagement

### **Error Monitoring**
- Sentry integration (if configured)
- Vercel function logs
- Real User Monitoring

### **Updates & Deployments**
- Automatic deployments on git push
- Preview deployments for pull requests
- Rollback capability in dashboard

## **Security Checklist**

- ✅ HTTPS enabled (automatic)
- ✅ Environment variables secured
- ✅ CSRF protection active
- ✅ Rate limiting configured
- ✅ Input validation implemented

## **Support**

### **Vercel Support**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: https://vercel.com/support

### **Project Support**
- GitHub Issues: https://github.com/stonecloughcommunity/stoneclough-community-pwa/issues
- Email: support@stoneclough.uk

---

## **Quick Start Commands**

```bash
# Clone and setup locally
git clone https://github.com/stonecloughcommunity/stoneclough-community-pwa.git
cd stoneclough-community-pwa
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev

# Deploy to Vercel
vercel
vercel --prod
```

---

**Your Stoneclough Community PWA will be live and ready to serve the community!** 🏡💚
