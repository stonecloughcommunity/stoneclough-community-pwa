import { NextRequest, NextResponse } from 'next/server';
import { applyAPISecurityHeaders } from '@/lib/security/headers';

export async function GET(request: NextRequest) {
  // Simple test endpoint that returns headers for security audit
  const response = NextResponse.json({
    message: 'Security headers test endpoint',
    timestamp: new Date().toISOString(),
    headers: request.headers ? Object.fromEntries(request.headers.entries()) : {},
  });

  return applyAPISecurityHeaders(response);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
