'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'
import { AirplaneTilt } from '@phosphor-icons/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // 400 = wrong credentials (not a bug). Anything else is unexpected.
      if (authError.status !== 400) {
        reportError(authError, { tag: 'login' })
      }
      setError(authError.message)
      setLoading(false)
      return
    }

    // Use a hard redirect so the server fully re-renders the layout with the new auth cookie
    window.location.href = '/search'
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] diffusion-shadow border border-zinc-200/50 p-8 sm:p-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Plane icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 text-foreground">
            <AirplaneTilt size={32} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Flightly</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">Sign in to your account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-foreground font-medium placeholder-zinc-400 shadow-sm outline-none transition-all focus:border-foreground focus:ring-1 focus:ring-foreground disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-foreground font-medium placeholder-zinc-400 shadow-sm outline-none transition-all focus:border-foreground focus:ring-1 focus:ring-foreground disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
            />
          </div>

          {/* Inline error */}
          {error && (
            <p role="alert" className="text-sm text-rose-600 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-foreground px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-zinc-900/10 active:scale-[0.98]"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm font-medium text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-bold text-foreground hover:opacity-70 transition-opacity"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
