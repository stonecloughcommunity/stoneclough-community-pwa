import { NextRequest, NextResponse } from 'next/server';
import { getCSRFToken } from '@/lib/security/csrf';
import { applyAPISecurityHeaders } from '@/lib/security/headers';

/**
 * GET /api/csrf-token
 * 
 * Returns a CSRF token for client-side use.
 * This endpoint is exempt from CSRF protection to allow initial token generation.
 */
export async function GET(request: NextRequest) {
  try {
    // Generate CSRF token and set cookies
    const { token, response } = await getCSRFToken(request);
    
    // Apply security headers
    const secureResponse = applyAPISecurityHeaders(response);
    
    return secureResponse;
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to generate CSRF token',
        code: 'CSRF_GENERATION_FAILED'
      },
      { status: 500 }
    );
    
    return applyAPISecurityHeaders(errorResponse);
  }
}

/**
 * OPTIONS /api/csrf-token
 * 
 * Handle preflight requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return applyAPISecurityHeaders(response);
}
