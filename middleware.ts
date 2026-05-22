import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Middleware runs in the Edge runtime — next/headers is NOT available here.
// Cookies must be read from request.cookies and written to the response directly.
export async function middleware(request: NextRequest) {
  // Step 1: Create a base response that passes the request through.
  // Supabase needs to be able to mutate the response cookies so the
  // refreshed session token reaches the browser.
  const supabaseResponse = NextResponse.next({ request })

  // Step 2: Build a Supabase client that reads from the incoming request
  // and writes the updated session cookie back to the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to the response so the browser receives the refreshed token.
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // Step 3: Refresh the session. This is the critical call — it silently
  // rotates short-lived access tokens using the stored refresh token.
  // The result is intentionally discarded; we only care about side-effects
  // (the updated Set-Cookie header on supabaseResponse).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Step 4: Protect private routes — redirect unauthenticated visitors.
  const pathname = request.nextUrl.pathname
  const isProtected =
    pathname.startsWith('/bookings') || pathname.startsWith('/book')

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Step 5: Return the supabase response so the refreshed session cookie
  // is forwarded to the browser on every request.
  return supabaseResponse
}

// Skip middleware for static assets, images, and any path that looks like
// a file (has a dot-extension). This keeps the Edge runtime overhead minimal.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|css|js|map)$).*)',
  ],
}
