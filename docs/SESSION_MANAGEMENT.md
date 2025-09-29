# Session Management

This document describes the comprehensive session management system implemented in the Stoneclough Community PWA.

## Overview

The session management system provides:
- **Secure session tracking** with database persistence
- **Automatic timeout warnings** to prevent data loss
- **Multi-device session management** with device identification
- **Session cleanup** for expired and inactive sessions
- **Integration with 2FA** for enhanced security

## Architecture

### Components

1. **SessionManagementService** (Server-side)
   - Creates and validates sessions
   - Manages session lifecycle
   - Handles cleanup operations

2. **ClientSessionManagementService** (Client-side)
   - Provides API interface for frontend
   - Handles session refresh and logout

3. **SessionProvider** (React Context)
   - Manages authentication state
   - Provides session timeout warnings
   - Handles automatic session refresh

4. **SessionTimeoutWarning** (Component)
   - Shows countdown before session expiry
   - Allows users to extend or end sessions
   - Tracks user activity

## Database Schema

### user_sessions Table

```sql
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration

### Environment Variables

```bash
# Session timeout in minutes (default: 30)
SESSION_TIMEOUT_MINUTES=30

# Warning threshold in minutes (default: 5)
SESSION_WARNING_THRESHOLD_MINUTES=5

# Secret for cron job authentication
CRON_SECRET=your_random_secret_key
```

### Session Provider Configuration

```tsx
<SessionProvider
  enableTimeoutWarning={true}
  sessionTimeoutMinutes={30}
  warningThresholdMinutes={5}
>
  {children}
</SessionProvider>
```

## Features

### 1. Session Creation

When a user signs in:
- A unique session ID is generated
- Device information is extracted from User-Agent
- IP address and location are recorded
- Session expiry is set (default: 30 days)

### 2. Activity Tracking

User activity is tracked through:
- Mouse movements and clicks
- Keyboard input
- Touch events
- Scroll actions

### 3. Timeout Warnings

When a session approaches timeout:
- Warning dialog appears 5 minutes before expiry
- Countdown timer shows remaining time
- Users can extend session or sign out
- Automatic sign-out if no action taken

### 4. Multi-Device Management

Users can:
- View all active sessions
- See device information and last activity
- Revoke individual sessions
- Sign out of all other devices

### 5. Automatic Cleanup

- Expired sessions are automatically deactivated
- Cleanup job runs via cron endpoint
- Old sessions are removed to maintain performance

## API Endpoints

### Session Management

- `GET /api/auth/sessions` - Get user's active sessions
- `POST /api/auth/sessions/revoke` - Revoke a specific session
- `POST /api/auth/sessions/revoke-others` - Revoke all other sessions

### Cleanup

- `GET /api/cron/cleanup-sessions` - Cleanup expired sessions (cron job)

## Security Features

### 1. Session Validation

- Sessions are validated on each request
- Expired sessions are automatically revoked
- Invalid sessions redirect to login

### 2. Device Fingerprinting

- Basic device identification from User-Agent
- IP address tracking for suspicious activity
- Location information when available

### 3. Rate Limiting

- Session creation is rate-limited
- API endpoints have CSRF protection
- Brute force protection on session endpoints

### 4. Integration with 2FA

- 2FA verification is session-specific
- Separate verification tracking
- Automatic cleanup on session end

## Usage Examples

### Using the Session Hook

```tsx
import { useSession } from '@/components/providers/session-provider'

function MyComponent() {
  const { isAuthenticated, user, signOut } = useSession()
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Protected Route HOC

```tsx
import { withAuth } from '@/components/providers/session-provider'

const ProtectedPage = withAuth(() => {
  return <div>This page requires authentication</div>
})

export default ProtectedPage
```

### Manual Session Management

```tsx
import { clientSessionManagementService } from '@/lib/auth/session-management'

// Get all sessions
const sessions = await clientSessionManagementService.getSessions()

// Revoke a session
await clientSessionManagementService.revokeSession(sessionId)

// Sign out of all other devices
await clientSessionManagementService.revokeAllOtherSessions()
```

## Monitoring and Logging

### Session Events

All session events are logged with Sentry:
- Session creation
- Session expiry
- Manual revocation
- Cleanup operations

### Metrics Tracked

- Active session count
- Session duration
- Device distribution
- Geographic distribution
- Timeout vs manual logout rates

## Best Practices

### For Developers

1. **Always use SessionProvider** at the app root level
2. **Use useSession hook** instead of direct Supabase auth
3. **Implement timeout warnings** for long forms
4. **Test session expiry scenarios** in development

### For Users

1. **Sign out when finished** on shared devices
2. **Review active sessions** regularly
3. **Use strong passwords** and enable 2FA
4. **Report suspicious sessions** immediately

## Troubleshooting

### Common Issues

1. **Session timeout too aggressive**
   - Increase `SESSION_TIMEOUT_MINUTES`
   - Reduce `SESSION_WARNING_THRESHOLD_MINUTES`

2. **Warning not showing**
   - Check if `enableTimeoutWarning` is true
   - Verify SessionProvider is wrapping the app

3. **Sessions not cleaning up**
   - Verify cron job is running
   - Check `CRON_SECRET` configuration

### Debug Mode

Enable debug logging in development:

```tsx
<SessionProvider enableTimeoutWarning={true}>
  {children}
</SessionProvider>
```

## Performance Considerations

### Database Optimization

- Indexes on frequently queried columns
- Regular cleanup of old sessions
- Partitioning for high-volume deployments

### Client-side Optimization

- Debounced activity tracking
- Efficient event listeners
- Minimal re-renders on activity

### Caching Strategy

- Session validation caching
- Device information caching
- Location lookup caching

## Future Enhancements

### Planned Features

1. **Advanced device fingerprinting**
2. **Geolocation-based security**
3. **Session analytics dashboard**
4. **Suspicious activity detection**
5. **Push notification for new sessions**

### Integration Opportunities

1. **WebAuthn support**
2. **OAuth provider sessions**
3. **Enterprise SSO integration**
4. **Mobile app session sync**

## Compliance

### Data Protection

- Session data is encrypted at rest
- IP addresses are hashed for privacy
- User consent for location tracking
- GDPR-compliant data retention

### Security Standards

- Follows OWASP session management guidelines
- Implements secure session tokens
- Regular security audits
- Penetration testing coverage
