import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError } from '@/lib/errors'

// Route Handler — no "use client". This is server-only code.
//
// Supabase's PKCE auth flow redirects users here after they click
// the confirmation link in their email. The URL contains a short-lived
// `code` that must be exchanged for a real session (access + refresh tokens).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')

  if (code) {
    // Exchange the one-time code for a persistent session.
    // createClient() uses next/headers under the hood and will write the
    // resulting session cookies to the response via the server cookie store.
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // This is high-signal — a broken callback means users can't
      // confirm their accounts. Always report.
      reportError(error, { tag: 'auth-callback' })
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to the main app after a successful exchange.
    return NextResponse.redirect(new URL('/search', request.url))
  }

  // No code in the URL — something went wrong (e.g. link was already used).
  // Send the user back to login so they can request a new link.
  return NextResponse.redirect(new URL('/login', request.url))
}

