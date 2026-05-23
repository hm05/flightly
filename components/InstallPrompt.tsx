'use client'

import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt(): Promise<void>
}

// ---------------------------------------------------------------------------
// InstallPrompt
//
// Shows a fixed bottom banner when:
//   1. The browser fires `beforeinstallprompt` (app is installable)
//   2. The user hasn't dismissed it this session
//   3. The app isn't already running in standalone mode
// ---------------------------------------------------------------------------

export default function InstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Already installed in standalone mode — nothing to show
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    function handleBeforeInstallPrompt(e: Event) {
      // Prevent the mini-infobar from appearing automatically on mobile
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
    }
  }, [])

  function handleDismiss() {
    setIsVisible(false)
  }

  async function handleInstall() {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    // Dismiss the banner regardless of whether the user accepted or not
    await deferredPrompt.current.userChoice
    deferredPrompt.current = null
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-indigo-200 bg-white shadow-lg"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        {/* Plane icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
          </svg>
        </div>

        {/* Copy */}
        <p className="flex-1 text-sm font-medium text-slate-700">
          Install Flightly for faster access
        </p>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
