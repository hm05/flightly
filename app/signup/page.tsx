'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'
import { AirplaneTilt, CheckCircle } from '@phosphor-icons/react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      reportError(authError, { tag: 'signup' })
      setError(authError.message)
      setLoading(false)
      return
    }

    // Do not redirect — Supabase sends a confirmation email.
    // Show a success message instead and let the user close the tab.
    setConfirmed(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] diffusion-shadow border border-zinc-200/50 p-8 sm:p-10 space-y-8">

        {confirmed ? (
          /* ── Success state ─────────────────────────────── */
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle size={32} weight="fill" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">Check your email</h1>
              <p className="text-sm font-medium text-zinc-500 mt-2 leading-relaxed">
                Check your email to confirm your account.<br/>
                You can safely close this tab.
              </p>
            </div>
          </div>
        ) : (
          /* ── Sign-up form ──────────────────────────────── */
          <>
            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 text-foreground">
                <AirplaneTilt size={32} weight="duotone" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Flightly</h1>
                <p className="text-sm font-medium text-zinc-500 mt-1">Create your account</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              <div className="space-y-2">
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
                >
                  Email address
                </label>
                <input
                  id="signup-email"
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
                  htmlFor="signup-password"
                  className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
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
                className="w-full rounded-xl bg-foreground px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-zinc-900/10 transition-all hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            {/* Footer link */}
            <p className="text-center text-sm font-medium text-zinc-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-foreground hover:opacity-70 transition-opacity"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
