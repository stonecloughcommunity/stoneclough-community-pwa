import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/security/rate-limit"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware processing:", request.nextUrl.pathname)

  // Apply rate limiting to all requests
  const rateLimitResult = await checkRateLimit(request)

  if (!rateLimitResult.success) {
    console.log("[v0] Rate limit exceeded for:", request.nextUrl.pathname)
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User authenticated:", !!user)

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
  const isAuthCallback = request.nextUrl.pathname === "/auth/callback"
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/about") ||
    request.nextUrl.pathname.startsWith("/_vercel") // Added Vercel internal routes as public to prevent redirect loops

  console.log("[v0] Route info:", {
    pathname: request.nextUrl.pathname,
    isAuthRoute,
    isPublicRoute,
    hasUser: !!user,
  })

  // Only redirect to login if user is not authenticated and trying to access protected routes
  if (!user && !isPublicRoute) {
    console.log("[v0] Redirecting to login")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (user && isAuthRoute && !isAuthCallback && request.nextUrl.pathname !== "/auth/logout") {
    console.log("[v0] Redirecting authenticated user to home")
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Add rate limit headers to response
  supabaseResponse.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  supabaseResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  supabaseResponse.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString())

  console.log("[v0] Allowing request to continue")
  return supabaseResponse
}
