'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'
import { useUserStore } from '@/lib/stores/userStore'
import { type BookingWithDetails } from '@/app/bookings/page'
import dynamic from 'next/dynamic'
import { type Flight } from '@/lib/stores/flightStore'

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
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<{ id: string; message: string } | null>(null)
  const [rescheduleBooking, setRescheduleBooking] =
    useState<BookingWithDetails | null>(null)

  const [now] = useState(() => Date.now())

  const { updateBookingStatus } = useUserStore()

  // -------------------------------------------------------------------------
  // Escape key handler for confirm panel
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmCancelId) {
        setConfirmCancelId(null)
        setCancelError(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmCancelId])

  // -------------------------------------------------------------------------
  // Cancel handler
  // -------------------------------------------------------------------------

  async function handleConfirmCancel(booking: BookingWithDetails) {
    setCancellingId(booking.id)
    setCancelError(null)
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
      setConfirmCancelId(null)
    } else {
      const msg = error.message ?? ''
      if (msg.includes('TOO_LATE_TO_CANCEL')) {
        setCancelError({ id: booking.id, message: 'Cancellation is not allowed within 2 hours of departure.' })
      } else if (msg.includes('BOOKING_NOT_FOUND')) {
        setCancelError({ id: booking.id, message: 'This booking could not be found.' })
      } else {
        reportError(error, { tag: 'cancel-booking' })
        setCancelError({ id: booking.id, message: 'Cancellation failed. Please try again.' })
      }
    }

    setCancellingId(null)
  }

  // -------------------------------------------------------------------------
  // Reschedule success callback
  // -------------------------------------------------------------------------

  function handleRescheduled(bookingId: string, newFlight: Flight) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { 
              ...b, 
              status: 'rescheduled', 
              flight_no: newFlight.flight_no,
              flight_id: newFlight.id,
              departs_at: newFlight.departs_at,
              arrives_at: newFlight.arrives_at,
              base_price: newFlight.base_price
            }
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
                <>
                  {confirmCancelId === booking.id ? (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-rose-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-rose-900">Cancel this booking?</h4>
                            <p className="text-sm text-rose-700 mt-0.5">
                              You are about to cancel booking <span className="font-semibold">{booking.pnr_code}</span>. This cannot be undone.
                            </p>
                            {new Date(booking.departs_at).getTime() - now < 24 * 60 * 60 * 1000 && (
                              <p className="text-sm text-rose-700 mt-1 font-medium">
                                Warning: Departure is within 24 hours. Cancellation fees may apply.
                              </p>
                            )}
                            {cancelError?.id === booking.id && (
                              <p className="text-sm text-rose-600 font-semibold mt-2">
                                {cancelError.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmCancelId(null)
                              setCancelError(null)
                            }}
                            disabled={isCancelling}
                            className="text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            Keep booking
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmCancel(booking)}
                            disabled={isCancelling}
                            className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition shadow-sm shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isCancelling ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Cancelling...
                              </>
                            ) : (
                              'Yes, cancel'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                        onClick={() => {
                          setConfirmCancelId(booking.id)
                          setCancelError(null)
                        }}
                        disabled={isCancelling}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-500 disabled:text-rose-300 transition py-1.5 px-3 rounded-lg hover:bg-rose-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
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
          onRescheduled={(newFlight: Flight) =>
            handleRescheduled(rescheduleBooking.id, newFlight)
          }
        />
      )}
    </>
  )
}
