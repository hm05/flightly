import { createBrowserClient } from '@supabase/ssr'

// Utility for use in Client Components and browser-side code only.
// Never import this in Server Components, Server Functions, or Route Handlers
// — use @/lib/supabase/server instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
