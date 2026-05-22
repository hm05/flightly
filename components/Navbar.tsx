import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Server action — must be async, must be defined in a Server Component file
// ---------------------------------------------------------------------------

async function logout() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ---------------------------------------------------------------------------
// Navbar (Server Component)
// Reads the current session server-side so the UI is always in sync with
// the auth state without a client-side fetch on every page load.
// ---------------------------------------------------------------------------

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={user ? '/search' : '/'}
          className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-indigo-600"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
          Flightly
        </Link>

        {/* Nav links + auth */}
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link
                href="/search"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition"
              >
                Search
              </Link>
              <Link
                href="/bookings"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition"
              >
                My Bookings
              </Link>
              {/* Logout — server action so no client-side JS needed */}
              <form action={logout}>
                <button
                  type="submit"
                  className="ml-2 text-sm font-semibold text-rose-600 hover:text-rose-700 py-1.5 px-3 rounded-lg hover:bg-rose-50 transition"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="ml-1 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-4 rounded-lg transition shadow-sm shadow-indigo-600/20"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
