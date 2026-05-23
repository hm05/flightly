'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'
import { useUserStore } from '@/lib/stores/userStore'
import { type BookingWithDetails } from '@/app/bookings/page'
import dynamic from 'next/dynamic'
import { type Flight } from '@/lib/stores/flightStore'
import { Ticket } from '@phosphor-icons/react'

const RescheduleModal = dynamic(() => import('./RescheduleModal'), { ssr: false })

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

function StatusBadge({ status }: { status: BookingWithDetails['status'] }) {
  const styles: Record<BookingWithDetails['status'], string> = {
    confirmed:
      'bg-emerald-50 text-emerald-600 border border-emerald-200',
    rescheduled:
      'bg-amber-50 text-amber-600 border border-amber-200',
    cancelled:
      'bg-zinc-50 text-zinc-400 border border-zinc-200',
  }
  const labels: Record<BookingWithDetails['status'], string> = {
    confirmed: 'Confirmed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

type BookingsListProps = {
  bookings: BookingWithDetails[]
}

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

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-white rounded-[2rem] border border-zinc-200/50 diffusion-shadow">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
          <Ticket size={32} weight="duotone" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">No bookings yet</h2>
          <p className="text-zinc-500 font-medium mt-1">
            Start by searching for a flight
          </p>
        </div>
        <Link
          href="/search"
          className="bg-foreground hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-zinc-900/10 active:scale-[0.98]"
        >
          Search flights
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6 relative z-10">
        {bookings.map((booking) => {
          const isCancelled = booking.status === 'cancelled'
          const isActionable = !isCancelled
          const isCancelling = cancellingId === booking.id

          return (
            <article
              key={booking.id}
              className={`bg-white rounded-3xl p-6 diffusion-shadow transition-all ${
                isCancelled
                  ? 'border border-zinc-100 opacity-60 grayscale-[0.5]'
                  : 'border border-zinc-200/50 hover:border-zinc-300'
              }`}
            >
              {/* Top row: PNR + status */}
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">
                    Booking Reference
                  </p>
                  <p className="font-mono font-black text-2xl text-foreground tracking-wider">
                    {booking.pnr_code}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {/* Flight info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                      Flight
                    </span>
                    <p className="font-bold text-foreground">
                      {booking.flight_no} · {booking.origin} →{' '}
                      {booking.destination}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                      Departs
                    </span>
                    <p className="font-bold text-foreground">
                      {formatIST(booking.departs_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                      Seat
                    </span>
                    <p className="font-bold text-foreground capitalize">
                      {booking.seat_number}{' '}
                      <span className="text-xs font-semibold text-zinc-400">
                        ({booking.class})
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                      Total paid
                    </span>
                    <p className="font-bold text-foreground">
                      {priceFormatter.format(booking.total_price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isActionable && (
                <>
                  {confirmCancelId === booking.id ? (
                    <div className="mt-4 pt-4 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-rose-900">Cancel this booking?</h4>
                            <p className="text-sm font-medium text-rose-700 mt-1">
                              You are about to cancel booking <span className="font-bold">{booking.pnr_code}</span>. This cannot be undone.
                            </p>
                            {new Date(booking.departs_at).getTime() - now < 24 * 60 * 60 * 1000 && (
                              <p className="text-sm text-rose-700 mt-2 font-bold">
                                Warning: Departure is within 24 hours. Cancellation fees may apply.
                              </p>
                            )}
                            {cancelError?.id === booking.id && (
                              <p className="text-sm text-rose-600 font-bold mt-2">
                                {cancelError.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmCancelId(null)
                              setCancelError(null)
                            }}
                            disabled={isCancelling}
                            className="text-xs font-bold text-zinc-500 hover:text-foreground hover:bg-white border border-transparent hover:border-zinc-200 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                          >
                            Keep booking
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmCancel(booking)}
                            disabled={isCancelling}
                            className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-4 mt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setRescheduleBooking(booking)}
                        className="text-[10px] font-bold uppercase tracking-wider text-foreground hover:opacity-70 transition-all py-2 px-4 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200"
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
                        className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-all py-2 px-4 rounded-xl hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-rose-100"
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
