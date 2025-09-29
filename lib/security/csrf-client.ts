// CSRF protection for client-side operations
'use client';

import { createClient } from '@/lib/supabase/client';

export interface CSRFToken {
  token: string;
  expires: number;
}

export class CSRFProtection {
  private static instance: CSRFProtection;
  private token: string | null = null;
  private expires: number = 0;

  private constructor() {}

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  // Generate a CSRF token
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get or create a CSRF token
  async getToken(): Promise<string> {
    const now = Date.now();
    
    // Return existing token if still valid
    if (this.token && this.expires > now) {
      return this.token;
    }

    // Generate new token
    this.token = this.generateToken();
    this.expires = now + (30 * 60 * 1000); // 30 minutes

    // Store in session storage for persistence across tabs
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', this.token);
      sessionStorage.setItem('csrf_expires', this.expires.toString());
    }

    return this.token;
  }

  // Validate a CSRF token
  validateToken(token: string): boolean {
    const now = Date.now();
    return this.token === token && this.expires > now;
  }

  // Add CSRF token to form data
  async addToFormData(formData: FormData): Promise<FormData> {
    const token = await this.getToken();
    formData.append('csrf_token', token);
    return formData;
  }

  // Add CSRF token to request headers
  async addToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }

  // Initialize CSRF protection from session storage
  initialize(): void {
    if (typeof window === 'undefined') return;

    const storedToken = sessionStorage.getItem('csrf_token');
    const storedExpires = sessionStorage.getItem('csrf_expires');

    if (storedToken && storedExpires) {
      const expires = parseInt(storedExpires, 10);
      if (expires > Date.now()) {
        this.token = storedToken;
        this.expires = expires;
      } else {
        // Clean up expired token
        sessionStorage.removeItem('csrf_token');
        sessionStorage.removeItem('csrf_expires');
      }
    }
  }

  // Clear CSRF token
  clear(): void {
    this.token = null;
    this.expires = 0;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('csrf_token');
      sessionStorage.removeItem('csrf_expires');
    }
  }
}

// Convenience functions
export const csrf = CSRFProtection.getInstance();

export async function getCSRFToken(): Promise<string> {
  return csrf.getToken();
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  return csrf.validateToken(token);
}

export async function protectedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await csrf.addToHeaders(options.headers);
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export async function protectedFormSubmit(formData: FormData): Promise<FormData> {
  return csrf.addToFormData(formData);
}

// Initialize CSRF protection when module loads
if (typeof window !== 'undefined') {
  csrf.initialize();
}
