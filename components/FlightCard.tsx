'use client'

import { useRouter } from 'next/navigation'
import { useFlightStore, type Flight } from '@/lib/stores/flightStore'

// ---------------------------------------------------------------------------
// Duration helper
// ---------------------------------------------------------------------------

function formatDuration(departsAt: string, arrivesAt: string): string {
  const diffMs =
    new Date(arrivesAt).getTime() - new Date(departsAt).getTime()
  const totalMinutes = Math.max(0, Math.round(diffMs / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

// ---------------------------------------------------------------------------
// Time formatter — IST
// ---------------------------------------------------------------------------

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
})

function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

// ---------------------------------------------------------------------------
// Price formatter — INR
// ---------------------------------------------------------------------------

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  delayed: {
    label: 'Delayed',
    className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  },
  boarding: {
    label: 'Boarding',
    className: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type FlightCardProps = {
  flight: Flight
  passengers: number
  classOptions?: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FlightCard({
  flight,
  passengers,
  classOptions,
}: FlightCardProps) {
  const router = useRouter()
  const { setSelectedFlight, setCurrentStep } = useFlightStore()

  const totalPrice = flight.base_price * passengers
  const statusBadge = STATUS_BADGE[flight.status]

  function handleSelect() {
    setSelectedFlight(flight)
    setCurrentStep('select-seat')
    router.push('/book/seats')
  }

  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 p-5 md:p-6 flex flex-col gap-4 transition hover:shadow-md hover:shadow-slate-200/60">
      {/* Top row — flight number + status badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-mono font-bold text-indigo-700 text-sm tracking-widest">
          {flight.flight_no}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {classOptions && classOptions.length > 0 &&
            classOptions.map((cls) => (
              <span
                key={cls}
                className="text-xs font-medium bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 px-2 py-0.5 rounded-full capitalize"
              >
                {cls}
              </span>
            ))}
          {statusBadge && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Route row */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-extrabold text-slate-900">
            {flight.origin}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            {formatTime(flight.departs_at)}
          </span>
        </div>

        {/* Arrow + duration */}
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xs text-slate-400 font-medium">
            {formatDuration(flight.departs_at, flight.arrives_at)}
          </span>
          <div className="relative w-full flex items-center">
            <div className="flex-1 h-px bg-slate-200" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-indigo-400 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-extrabold text-slate-900">
            {flight.destination}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            {formatTime(flight.arrives_at)}
          </span>
        </div>
      </div>

      {/* Bottom row — price + CTA */}
      <div className="flex items-end justify-between gap-4 pt-2 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400 font-medium">
            Total · {passengers} pax
          </p>
          <p className="text-xl font-bold text-slate-900">
            {priceFormatter.format(totalPrice)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSelect}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition shadow-sm shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Select flight
        </button>
      </div>
    </article>
  )
}
