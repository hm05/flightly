'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFlightStore, type Flight, type Seat } from '@/lib/stores/flightStore'

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const istDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata',
})

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function formatIST(isoString: string): string {
  const parts = istDateFormatter.formatToParts(new Date(isoString))
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')} · ${get('hour')}:${get('minute')} IST`
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ConfirmationPage() {
  const router = useRouter()
  const { confirmedBookingId, confirmedPnr, selectedFlight, selectedSeat, resetBooking } =
    useFlightStore()

  // Capture all booking details in local state immediately on first render so
  // they remain visible after resetBooking() clears the global store.
  const [localPnr] = useState(() => confirmedPnr)
  const [localBookingId] = useState(() => confirmedBookingId)
  const [localFlight] = useState<Flight | null>(() => selectedFlight)
  const [localSeat] = useState<Seat | null>(() => selectedSeat)

  useEffect(() => {
    if (!localBookingId || !localPnr) {
      router.push('/search')
      return
    }

    // Reset the store after 100 ms — a browser refresh or back button won't
    // maintain booking state, which is the right behaviour post-confirmation.
    const timer = setTimeout(() => {
      resetBooking()
    }, 100)

    return () => clearTimeout(timer)
  }, [localBookingId, localPnr, resetBooking, router])


  if (!localBookingId || !localPnr) {
    return null // Redirecting
  }

  const totalPrice =
    localFlight && localSeat
      ? localFlight.base_price + localSeat.extra_fee
      : null

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
            Your seat is reserved. Safe travels!
          </p>
        </div>

        {/* PNR box */}
        <div className="w-full bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 flex flex-col gap-1.5 items-center select-all">
          <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">
            Booking Reference
          </span>
          <span className="text-3xl font-mono font-black text-indigo-800 tracking-wider">
            {localPnr}
          </span>
        </div>

        {/* Flight + seat details */}
        {localFlight && localSeat && (
          <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 text-left flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Itinerary
            </p>

            {/* Route */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Flight</span>
                <span className="font-bold text-slate-800 text-sm">
                  {localFlight.flight_no}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <span>{localFlight.origin}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-slate-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{localFlight.destination}</span>
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Departs & Arrives */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 font-medium">Departs</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">
                  {formatIST(localFlight.departs_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Arrives</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">
                  {formatIST(localFlight.arrives_at)}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Seat + price */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">Seat</p>
                <p className="font-bold text-slate-800 capitalize">
                  {localSeat.seat_number}{' '}
                  <span className="font-medium text-slate-500 text-xs">
                    ({localSeat.class} class)
                  </span>
                </p>
              </div>
              {totalPrice !== null && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Total paid</p>
                  <p className="font-bold text-slate-800">
                    {priceFormatter.format(totalPrice)}
                  </p>
                </div>
              )}
            </div>

            {/* Aircraft */}
            <p className="text-xs text-slate-400 font-medium">
              Aircraft: {localFlight.aircraft_type}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3">
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
