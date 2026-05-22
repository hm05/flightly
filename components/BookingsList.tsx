'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'
import { useUserStore } from '@/lib/stores/userStore'
import { type BookingWithDetails } from '@/app/bookings/page'
import dynamic from 'next/dynamic'

// dynamic() must be called at module level — it returns a component (an expression,
// a value), so the result is stored in a variable and used in JSX like any import.
const RescheduleModal = dynamic(() => import('./RescheduleModal'), { ssr: false })

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
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: BookingWithDetails['status'] }) {
  const styles: Record<BookingWithDetails['status'], string> = {
    confirmed:
      'bg-emerald-50 text-emerald-700 border-emerald-200',
    rescheduled:
      'bg-amber-50 text-amber-700 border-amber-200',
    cancelled:
      'bg-slate-100 text-slate-400 border-slate-200',
  }
  const labels: Record<BookingWithDetails['status'], string> = {
    confirmed: 'Confirmed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type BookingsListProps = {
  bookings: BookingWithDetails[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingsList({
  bookings: initialBookings,
}: BookingsListProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>(initialBookings)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [rescheduleBooking, setRescheduleBooking] =
    useState<BookingWithDetails | null>(null)

  const { updateBookingStatus } = useUserStore()

  // -------------------------------------------------------------------------
  // Cancel handler
  // -------------------------------------------------------------------------

  async function handleCancel(booking: BookingWithDetails) {
    const confirmed = window.confirm(
      `Cancel booking ${booking.pnr_code}? This cannot be undone.`,
    )
    if (!confirmed) return

    setCancellingId(booking.id)
    const supabase = createClient()

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: booking.id,
    })

    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: 'cancelled' } : b,
        ),
      )
      updateBookingStatus(booking.id, 'cancelled')
    } else {
      const msg = error.message ?? ''
      if (msg.includes('TOO_LATE_TO_CANCEL')) {
        alert('Cancellations are not allowed within 2 hours of departure.')
      } else if (msg.includes('BOOKING_NOT_FOUND')) {
        alert('This booking could not be found.')
      } else {
        reportError(error, { tag: 'cancel-booking' })
        alert('Cancellation failed. Please try again.')
      }
    }

    setCancellingId(null)
  }

  // -------------------------------------------------------------------------
  // Reschedule success callback
  // -------------------------------------------------------------------------

  function handleRescheduled(bookingId: string, newFlightNo: string) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'rescheduled', flight_no: newFlightNo }
          : b,
      ),
    )
    setRescheduleBooking(null)
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
          {/* Ticket icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.5 6-9 12m0 0h9m-9 0 9-12"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">No bookings yet</h2>
          <p className="text-slate-500 text-sm mt-1">
            Start by searching for a flight
          </p>
        </div>
        <Link
          href="/search"
          className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl transition shadow-sm shadow-indigo-600/20 text-sm"
        >
          Search flights
        </Link>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Booking cards
  // -------------------------------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-4">
        {bookings.map((booking) => {
          const isCancelled = booking.status === 'cancelled'
          const isActionable = !isCancelled
          const isCancelling = cancellingId === booking.id

          return (
            <article
              key={booking.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm shadow-slate-100 transition ${
                isCancelled
                  ? 'border-slate-100 opacity-60'
                  : 'border-slate-200 hover:shadow-md hover:shadow-slate-200/60'
              }`}
            >
              {/* Top row: PNR + status */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    Booking Reference
                  </p>
                  <p className="font-mono font-black text-xl text-indigo-800 tracking-wider">
                    {booking.pnr_code}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {/* Flight info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-slate-400 text-xs font-medium">
                      Flight
                    </span>
                    <p className="font-semibold text-slate-800">
                      {booking.flight_no} · {booking.origin} →{' '}
                      {booking.destination}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium">
                      Departs
                    </span>
                    <p className="font-semibold text-slate-800">
                      {formatIST(booking.departs_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-slate-400 text-xs font-medium">
                      Seat
                    </span>
                    <p className="font-semibold text-slate-800 capitalize">
                      {booking.seat_number}{' '}
                      <span className="text-xs font-medium text-slate-500">
                        ({booking.class})
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium">
                      Total paid
                    </span>
                    <p className="font-bold text-slate-800">
                      {priceFormatter.format(booking.total_price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isActionable && (
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRescheduleBooking(booking)}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(booking)}
                    disabled={isCancelling}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-500 disabled:text-rose-300 transition py-1.5 px-3 rounded-lg hover:bg-rose-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Reschedule modal */}
      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onRescheduled={(newFlightNo: string) =>
            handleRescheduled(rescheduleBooking.id, newFlightNo)
          }
        />
      )}
    </>
  )
}
