import { updateSession } from "@/lib/supabase/middleware"
import { checkTwoFactorRequirement, requiresTwoFactorAuth } from "@/lib/auth/two-factor-middleware"
import { applySecurityHeaders, getSecurityConfig, generateNonce } from "@/lib/security/headers"
import { csrfProtection } from "@/lib/security/csrf-middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Generate nonce for CSP
  const nonce = generateNonce()

  // Apply CSRF protection first
  const csrfResult = await csrfProtection(request)
  if (csrfResult) {
    // CSRF validation failed, return error response with security headers
    return applySecurityHeaders(csrfResult, { ...getSecurityConfig(), nonce })
  }

  // Update the session
  let response = await updateSession(request)

  // Skip 2FA checks for auth routes and API routes that don't need protection
  const pathname = request.nextUrl.pathname
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    !requiresTwoFactorAuth(pathname)
  ) {
    // Apply security headers and return
    return applySecurityHeaders(response, { ...getSecurityConfig(), nonce })
  }

  // Check if 2FA is required for this route
  const twoFactorCheck = await checkTwoFactorRequirement(request)

  if (twoFactorCheck.requiresTwoFactor && !twoFactorCheck.isVerified) {
    response = NextResponse.redirect(new URL(twoFactorCheck.redirectUrl!, request.url))
  }

  // Apply security headers to the response
  return applySecurityHeaders(response, { ...getSecurityConfig(), nonce })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - _vercel (Vercel internal routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|_vercel|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
