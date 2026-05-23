'use client'

import { useState, useEffect } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const checkState = () => {
      // Detect iOS
      const ua = window.navigator.userAgent
      const webkit = !!ua.match(/WebKit/i)
      const ios = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
      const safari = ios && webkit && !ua.match(/CriOS/i)
      if (ios && safari) {
        setIsIOS(true)
      }

      // Detect standalone mode (already installed)
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && !!(window.navigator as unknown as { standalone: boolean }).standalone) ||
        document.referrer.includes('android-app://')
      
      if (standalone) {
        setIsStandalone(true)
      }
      return { standalone, ios, safari }
    }
    
    const { standalone, ios, safari } = checkState()
    if (standalone) return

    // Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const hasDismissed = localStorage.getItem('installPromptDismissed')
      if (!hasDismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Fallback for iOS since it doesn't support beforeinstallprompt
    if (ios && safari) {
      const hasDismissed = localStorage.getItem('installPromptDismissed')
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome flow
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
      setShowPrompt(false)
    } else if (isIOS) {
      // iOS doesn't have an API, just tell them how
      alert('To install: tap the Share button below, then select "Add to Home Screen".')
      setShowPrompt(false)
    }
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 backdrop-blur-xl p-4 diffusion-shadow animate-in slide-in-from-bottom-full duration-300">
      <div className="mx-auto flex max-w-lg items-center gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-foreground">
          <DownloadSimple size={24} weight="duotone" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            Get the Flightly App
          </p>
          <p className="text-xs font-medium text-zinc-500 mt-0.5">
            Install on your home screen for quick access and offline boarding passes.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={handleDismiss}
            className="rounded-xl px-3 py-2 text-xs font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-foreground"
          >
            Not now
          </button>
          <button
            onClick={handleInstallClick}
            className="rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-white shadow-md shadow-zinc-900/10 transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
