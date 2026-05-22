'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFlightStore } from '@/lib/stores/flightStore'

export default function ConfirmationPage() {
  const router = useRouter()
  const { confirmedBookingId, confirmedPnr, resetBooking } = useFlightStore()

  // Capture values in local component state immediately on load so they remain visible
  // after we reset the global store after 100ms.
  const [localPnr] = useState(() => confirmedPnr)
  const [localBookingId] = useState(() => confirmedBookingId)

  useEffect(() => {
    if (!localBookingId || !localPnr) {
      router.push('/search')
      return
    }

    // Reset the store after 100ms so a browser refresh or back button doesn't maintain state
    const timer = setTimeout(() => {
      resetBooking()
    }, 100)

    return () => clearTimeout(timer)
  }, [confirmedBookingId, confirmedPnr, resetBooking, router])

  if (!localBookingId || !localPnr) {
    return null // Loading or Redirecting
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 flex flex-col items-center text-center gap-6">
        
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-10 h-10"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Your flight has been reserved successfully. A confirmation email with the ticket itinerary is on its way.
          </p>
        </div>

        {/* PNR box */}
        <div className="w-full bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 flex flex-col gap-1.5 items-center select-all">
          <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">
            Your Booking Reference
          </span>
          <span className="text-3xl font-mono font-black text-indigo-800 tracking-wider">
            {localPnr}
          </span>
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3 mt-4">
          <Link
            href="/bookings"
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-sm shadow-indigo-600/30 flex items-center justify-center"
          >
            View my bookings
          </Link>
          <Link
            href="/search"
            className="w-full h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-xl transition flex items-center justify-center"
          >
            Search more flights
          </Link>
        </div>

      </div>
    </main>
  )
}
