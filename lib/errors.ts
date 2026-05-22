import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────
// Centralised error reporter.
//
// WHY THIS EXISTS:
//   Sentry's SDK auto-captures *thrown* exceptions, but Supabase
//   (and many other SDKs) return errors as `{ error }` values
//   instead of throwing. Those silently disappear unless we
//   explicitly call captureException.
//
//   This util is the single place in the codebase where that call
//   lives. If you ever swap Sentry for another provider, change
//   this file only.
// ─────────────────────────────────────────────────────────────────

interface ReportErrorOptions {
  /** A short label for the area of the app (e.g. "auth-callback", "booking") */
  tag: string
  /** Any extra key-value context you want attached to the Sentry event */
  extra?: Record<string, unknown>
}

/**
 * Report a non-thrown error to Sentry.
 *
 * Use this for errors returned as values (e.g. Supabase `{ error }`),
 * NOT for errors that are already thrown — Sentry catches those automatically.
 *
 * @example
 *   const { error } = await supabase.auth.signInWithPassword(...)
 *   if (error) {
 *     reportError(error, { tag: 'login' })
 *     setError(error.message)
 *   }
 */
export function reportError(
  error: unknown,
  { tag, extra }: ReportErrorOptions,
): void {
  let exception: Error
  let supabaseContext: Record<string, unknown> = {}

  if (error instanceof Error) {
    exception = error
  } else if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    // Supabase PostgrestError / AuthError: { message, code, details, hint }
    // Build a real Error so Sentry titles are readable instead of showing
    // "Object captured as exception with keys: code, details, hint, message"
    const raw = error as Record<string, unknown>
    exception = new Error(raw.message as string)
    exception.name =
      typeof raw.code === 'string' ? `SupabaseError[${raw.code}]` : 'SupabaseError'
    supabaseContext = raw
  } else {
    exception = new Error(
      typeof error === 'string' ? error : JSON.stringify(error),
    )
  }

  Sentry.captureException(exception, {
    tags: { flow: tag },
    extra: { ...supabaseContext, ...extra },
  })
}
