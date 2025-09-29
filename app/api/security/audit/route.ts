import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyAPISecurityHeaders } from '@/lib/security/headers';
import { env } from '@/lib/config/environment';

interface SecurityAuditResult {
  timestamp: string;
  headers: {
    [key: string]: {
      present: boolean;
      value?: string;
      recommendation?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    };
  };
  score: number;
  recommendations: string[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileResult = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const profile = profileResult?.data;

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Perform security audit by checking a test request
    const testUrl = new URL('/api/security/test', env.appUrl);
    const testResponse = await fetch(testUrl.toString());
    
    const auditResult = auditSecurityHeaders(testResponse);

    const response = NextResponse.json(auditResult);
    return applyAPISecurityHeaders(response);

  } catch (error) {
    console.error('Security audit error:', error);
    const response = NextResponse.json(
      { error: 'Security audit failed' },
      { status: 500 }
    );
    return applyAPISecurityHeaders(response);
  }
}

function auditSecurityHeaders(response: Response): SecurityAuditResult {
  const headers = response.headers;
  const audit: SecurityAuditResult = {
    timestamp: new Date().toISOString(),
    headers: {},
    score: 0,
    recommendations: [],
  };

  // Define expected security headers
  const securityHeaders = {
    'content-security-policy': {
      weight: 25,
      severity: 'critical' as const,
      recommendation: 'Implement Content Security Policy to prevent XSS attacks',
    },
    'strict-transport-security': {
      weight: 20,
      severity: 'high' as const,
      recommendation: 'Enable HSTS to enforce HTTPS connections',
    },
    'x-frame-options': {
      weight: 15,
      severity: 'high' as const,
      recommendation: 'Set X-Frame-Options to prevent clickjacking attacks',
    },
    'x-content-type-options': {
      weight: 10,
      severity: 'medium' as const,
      recommendation: 'Set X-Content-Type-Options to prevent MIME type sniffing',
    },
    'x-xss-protection': {
      weight: 10,
      severity: 'medium' as const,
      recommendation: 'Enable XSS protection in browsers',
    },
    'referrer-policy': {
      weight: 8,
      severity: 'medium' as const,
      recommendation: 'Set Referrer Policy to control referrer information',
    },
    'permissions-policy': {
      weight: 7,
      severity: 'medium' as const,
      recommendation: 'Implement Permissions Policy to control browser features',
    },
    'cross-origin-embedder-policy': {
      weight: 3,
      severity: 'low' as const,
      recommendation: 'Set COEP for enhanced security isolation',
    },
    'cross-origin-opener-policy': {
      weight: 2,
      severity: 'low' as const,
      recommendation: 'Set COOP for enhanced security isolation',
    },
  };

  let totalScore = 0;
  const maxScore = Object.values(securityHeaders).reduce((sum, header) => sum + header.weight, 0);

  // Audit each header
  Object.entries(securityHeaders).forEach(([headerName, config]) => {
    const headerValue = headers.get(headerName);
    const isPresent = !!headerValue;

    audit.headers[headerName] = {
      present: isPresent,
      value: headerValue || undefined,
      recommendation: config.recommendation,
      severity: config.severity,
    };

    if (isPresent) {
      totalScore += config.weight;
    } else {
      audit.recommendations.push(config.recommendation);
    }
  });

  // Calculate percentage score
  audit.score = Math.round((totalScore / maxScore) * 100);

  // Add specific recommendations based on header values
  const csp = headers.get('content-security-policy');
  if (csp) {
    if (csp.includes("'unsafe-inline'")) {
      audit.recommendations.push('Remove unsafe-inline from CSP for better security');
    }
    if (csp.includes("'unsafe-eval'")) {
      audit.recommendations.push('Remove unsafe-eval from CSP if possible');
    }
    if (!csp.includes('report-uri') && !csp.includes('report-to')) {
      audit.recommendations.push('Add CSP reporting to monitor violations');
    }
  }

  const hsts = headers.get('strict-transport-security');
  if (hsts && !hsts.includes('includeSubDomains')) {
    audit.recommendations.push('Include subdomains in HSTS policy');
  }

  const frameOptions = headers.get('x-frame-options');
  if (frameOptions && frameOptions.toLowerCase() !== 'deny') {
    audit.recommendations.push('Consider using DENY for X-Frame-Options for maximum protection');
  }

  return audit;
}

// Test endpoint for security header audit
export async function POST(request: NextRequest) {
  // This is used by the audit function to test headers
  const response = NextResponse.json({ test: 'security headers' });
  return applyAPISecurityHeaders(response);
}
