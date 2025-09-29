// CSRF protection middleware for Next.js
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export interface CSRFConfig {
  secret: string;
  tokenLength: number;
  cookieName: string;
  headerName: string;
  excludePaths: string[];
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  httpOnly: boolean;
  maxAge: number;
}

const defaultConfig: CSRFConfig = {
  secret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  excludePaths: ['/api/auth', '/api/webhook'],
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // Needs to be accessible to client-side JavaScript
  maxAge: 30 * 60, // 30 minutes
};

export class CSRFMiddleware {
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Generate a CSRF token
  generateToken(): string {
    const token = randomBytes(this.config.tokenLength).toString('hex');
    const timestamp = Date.now().toString();
    const signature = this.signToken(token, timestamp);
    
    return `${token}.${timestamp}.${signature}`;
  }

  // Sign a token with timestamp
  private signToken(token: string, timestamp: string): string {
    const data = `${token}.${timestamp}`;
    return createHash('sha256')
      .update(data + this.config.secret)
      .digest('hex')
      .substring(0, 16);
  }

  // Validate a CSRF token
  validateToken(token: string): boolean {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [tokenPart, timestampPart, signature] = parts;
    
    // Check signature
    const expectedSignature = this.signToken(tokenPart, timestampPart);
    if (signature !== expectedSignature) return false;

    // Check expiration
    const timestamp = parseInt(timestampPart, 10);
    const now = Date.now();
    const maxAge = this.config.maxAge * 1000; // Convert to milliseconds
    
    return (now - timestamp) <= maxAge;
  }

  // Check if path should be excluded from CSRF protection
  private isExcludedPath(pathname: string): boolean {
    return this.config.excludePaths.some(path => 
      pathname.startsWith(path)
    );
  }

  // Get CSRF token from request
  private getTokenFromRequest(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.config.headerName);
    if (headerToken) return headerToken;

    // Try cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value;
    if (cookieToken) return cookieToken;

    // Try form data for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        // This would need to be handled in the API route since we can't read body here
        return null;
      }
    }

    return null;
  }

  // Main middleware function
  async protect(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Skip CSRF protection for excluded paths
    if (this.isExcludedPath(pathname)) {
      return NextResponse.next();
    }

    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const response = NextResponse.next();
      
      // Set CSRF token cookie for future requests
      const existingToken = request.cookies.get(this.config.cookieName)?.value;
      if (!existingToken || !this.validateToken(existingToken)) {
        const newToken = this.generateToken();
        response.cookies.set(this.config.cookieName, newToken, {
          sameSite: this.config.sameSite,
          secure: this.config.secure,
          httpOnly: this.config.httpOnly,
          maxAge: this.config.maxAge,
          path: '/',
        });
      }
      
      return response;
    }

    // For state-changing requests, validate CSRF token
    const token = this.getTokenFromRequest(request);
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF token missing' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!this.validateToken(token)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Token is valid, proceed with request
    return NextResponse.next();
  }

  // Get token for client-side use
  getTokenForClient(request: NextRequest): string {
    const existingToken = request.cookies.get(this.config.cookieName)?.value;
    
    if (existingToken && this.validateToken(existingToken)) {
      return existingToken;
    }
    
    return this.generateToken();
  }
}

// Default instance
export const csrfProtection = new CSRFMiddleware();

// Convenience function for use in middleware.ts
export function csrfMiddleware(request: NextRequest): Promise<NextResponse> {
  return csrfProtection.protect(request);
}

// API route helper for validating CSRF tokens
export async function validateCSRFFromRequest(request: Request): Promise<boolean> {
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return csrfProtection.validateToken(headerToken);
  }

  // Check form data
  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      const formToken = formData.get('csrf_token') as string;
      if (formToken) {
        return csrfProtection.validateToken(formToken);
      }
    } catch (error) {
      // Not form data, ignore
    }
  }

  return false;
}

// Generate token for API responses
export function generateCSRFToken(): string {
  return csrfProtection.generateToken();
}
