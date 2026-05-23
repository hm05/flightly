'use client'

import { useUserStore } from '@/lib/stores/userStore'

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

function formatIST(isoString: string): string {
  const parts = istDateFormatter.formatToParts(new Date(isoString))
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')} · ${get('hour')}:${get('minute')} IST`
}

// ---------------------------------------------------------------------------
// Status badge — mirrors BookingsList colours
// ---------------------------------------------------------------------------

type Status = 'confirmed' | 'rescheduled' | 'cancelled'

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
  }
  const labels: Record<Status, string> = {
    confirmed: 'Confirmed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfflinePage() {
  // Read from Zustand — persisted to localStorage so it works offline.
  // NOTE: cachedBookings is NOT persisted (see userStore partialize), so
  // this will always be an empty array when the store rehydrates from
  // localStorage. The offline page gracefully handles this below.
  const cachedBookings = useUserStore((s) => s.cachedBookings)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        {/* Wifi-off icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M8.111 8.111A7.5 7.5 0 0 0 4.5 12a7.5 7.5 0 0 0 7.5 7.5 7.5 7.5 0 0 0 5.196-2.085M9.75 9.75a3 3 0 0 0 4.24 4.243M6.228 6.228A10.451 10.451 0 0 0 1.5 12a10.452 10.452 0 0 0 10.5 10.5c2.657 0 5.083-.989 6.9-2.61M12 4.5A10.452 10.452 0 0 1 22.5 12a10.45 10.45 0 0 1-1.94 6.04"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
          You&apos;re offline
        </h1>
        <p className="text-sm text-slate-500">
          Showing your last saved bookings
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Booking list or empty state                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-full max-w-lg">
        {cachedBookings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cachedBookings.map((booking) => (
              <article
                key={booking.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm shadow-slate-100 ${
                  booking.status === 'cancelled'
                    ? 'border-slate-100 opacity-60'
                    : 'border-slate-200'
                }`}
              >
                {/* PNR + status */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Booking Reference
                    </p>
                    <p className="font-mono text-xl font-black tracking-wider text-indigo-800">
                      {booking.pnr_code}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Flight details */}
                <div className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-medium text-slate-400">
                      Flight
                    </span>
                    <p className="font-semibold text-slate-800">
                      {booking.flight_no} · {booking.origin} →{' '}
                      {booking.destination}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400">
                      Departs
                    </span>
                    <p className="font-semibold text-slate-800">
                      {formatIST(booking.departs_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400">
                      Seat
                    </span>
                    <p className="font-semibold text-slate-800">
                      {booking.seat_number}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              No cached bookings found.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Connect to the internet to view your bookings.
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Reconnect button                                                    */}
      {/* ----------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500"
      >
        Try reconnecting
      </button>
    </main>
  )
}
