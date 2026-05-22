import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Utility for use in Server Components, Server Functions, and Route Handlers.
// NEVER import this in a "use client" component — it will throw at runtime
// because next/headers is not available in the browser runtime.
//
// cookies() is async in Next.js 15+ — always await it.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) {
          // set() can only be called from Server Functions / Route Handlers,
          // not during Server Component rendering — Supabase only calls this
          // when it needs to refresh a session token.
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: Parameters<typeof cookieStore.set>[2]) {
          // Deleting = setting the cookie with an empty value and maxAge 0.
          // Using set() keeps the implementation compatible with the
          // next/headers cookie store across all Next.js 15+ contexts.
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}
