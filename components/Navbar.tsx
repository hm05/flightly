import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AirplaneTilt } from '@phosphor-icons/react/dist/ssr'

async function logout() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-6 px-4 pointer-events-none">
      <header className="pointer-events-auto liquid-glass rounded-full px-6 py-3 flex items-center justify-between gap-12 shadow-xl shadow-black/5 transition-all w-full max-w-4xl">
        {/* Logo */}
        <Link
          href={user ? '/search' : '/'}
          className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <AirplaneTilt weight="fill" className="text-foreground w-5 h-5" />
          Flightly
        </Link>

        {/* Nav links + auth */}
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/search"
                className="text-xs font-semibold text-foreground hover:opacity-70 py-2 px-3 rounded-full hover:bg-zinc-100 transition-all"
              >
                Search
              </Link>
              <Link
                href="/bookings"
                className="text-xs font-semibold text-foreground hover:opacity-70 py-2 px-3 rounded-full hover:bg-zinc-100 transition-all"
              >
                Bookings
              </Link>
              <div className="w-px h-4 bg-zinc-200 mx-1" />
              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 py-2 px-3 rounded-full hover:bg-rose-50 transition-colors active:scale-95"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-foreground hover:opacity-70 py-2 px-3 rounded-full hover:bg-zinc-100 transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-xs font-bold bg-foreground hover:bg-zinc-800 text-white py-2 px-4 rounded-full transition-all active:scale-95 shadow-md shadow-zinc-900/10"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
    </div>
  )
}
