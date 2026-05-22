'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'
import { type Flight } from '@/lib/stores/flightStore'
import { type BookingWithDetails } from '@/app/bookings/page'

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
// Props
// ---------------------------------------------------------------------------

type RescheduleModalProps = {
  booking: BookingWithDetails
  onClose(): void
  onRescheduled(newFlightNo: string): void
}

// ---------------------------------------------------------------------------
// Modal content (inner component, portal wraps this)
// ---------------------------------------------------------------------------

function ModalContent({
  booking,
  onClose,
  onRescheduled,
}: RescheduleModalProps) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [error, setError] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Fetch alternative flights on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchAlternatives() {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const now = new Date().toISOString()

      const { data, error: dbError } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', booking.origin)
        .eq('destination', booking.destination)
        .gt('departs_at', now)
        .neq('status', 'cancelled')
        .neq('id', booking.flight_id)
        .order('departs_at', { ascending: true })

      if (dbError) {
        setError('Failed to load alternative flights. Please try again.')
        reportError(dbError, { tag: 'reschedule-fetch-flights' })
      } else {
        setFlights((data ?? []) as Flight[])
      }

      setLoading(false)
    }

    fetchAlternatives()
  }, [booking.flight_id, booking.origin, booking.destination])

  // -------------------------------------------------------------------------
  // Fee calculation
  // -------------------------------------------------------------------------

  const fee = selectedFlight
    ? Math.max(0, selectedFlight.base_price - booking.base_price)
    : 0

  // -------------------------------------------------------------------------
  // Confirm reschedule
  // -------------------------------------------------------------------------

  async function handleConfirm() {
    if (!selectedFlight) return

    // Snapshot fee at confirm time so it can't change mid-function
    const confirmedFee = Math.max(
      0,
      selectedFlight.base_price - booking.base_price,
    )

    const msg =
      confirmedFee > 0
        ? `Reschedule to ${selectedFlight.flight_no}? ${priceFormatter.format(confirmedFee)} will be charged for the price difference.`
        : `Reschedule to ${selectedFlight.flight_no}? No extra charge.`

    const confirmed = window.confirm(msg)
    if (!confirmed) return

    setSubmitting(true)
    setError(null)

    const supabase = createClient()

    // a. Insert reschedule record
    const { error: insertError } = await supabase.from('reschedules').insert({
      booking_id: booking.id,
      old_flight_id: booking.flight_id,
      new_flight_id: selectedFlight.id,
      fee_charged: confirmedFee,
    })

    if (insertError) {
      setError('Failed to reschedule. Please try again.')
      reportError(insertError, { tag: 'reschedule-insert' })
      setSubmitting(false)
      return
    }

    // b. Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        flight_id: selectedFlight.id,
        status: 'rescheduled',
      })
      .eq('id', booking.id)

    if (updateError) {
      setError('Booking record could not be updated. Please contact support.')
      reportError(updateError, { tag: 'reschedule-update-booking' })
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onRescheduled(selectedFlight.flight_no)
  }

  // -------------------------------------------------------------------------
  // Close on Escape key
  // -------------------------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, submitting])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="reschedule-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Reschedule Booking
            </p>
            <h2
              id="reschedule-modal-title"
              className="font-mono font-black text-lg text-indigo-800 tracking-wider"
            >
              {booking.pnr_code}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">
                Finding alternative flights…
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-semibold text-sm">{error}</p>
            </div>
          ) : flights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <p className="text-slate-600 font-semibold">
                No alternative flights available on this route.
              </p>
              <p className="text-slate-400 text-sm">
                {booking.origin} → {booking.destination}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Select a new flight for{' '}
                <span className="font-semibold text-slate-700">
                  {booking.origin} → {booking.destination}
                </span>
              </p>

              <div className="flex flex-col gap-2">
                {flights.map((flight) => {
                  const isSelected = selectedFlight?.id === flight.id
                  return (
                    <button
                      key={flight.id}
                      type="button"
                      onClick={() => setSelectedFlight(flight)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Radio indicator */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">
                            {flight.flight_no}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {formatIST(flight.departs_at)}
                          </p>
                        </div>

                        <p className="font-bold text-slate-800 text-sm flex-shrink-0">
                          {priceFormatter.format(flight.base_price)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Fee summary */}
              {selectedFlight && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                    fee > 0
                      ? 'bg-amber-50 border border-amber-200 text-amber-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}
                >
                  {fee > 0
                    ? `Price difference: +${priceFormatter.format(fee)}`
                    : 'No additional charge'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="py-2 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedFlight || submitting || loading}
            className="py-2 px-5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition shadow-sm shadow-indigo-600/20 disabled:shadow-none"
          >
            {submitting ? 'Rescheduling…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Portal wrapper — appends modal to document.body to avoid z-index issues.
//
// No mounted guard needed: BookingsList imports this component via
// dynamic(..., { ssr: false }), so Next.js never renders it on the server.
// document.body is always available here.
// ---------------------------------------------------------------------------

export default function RescheduleModal(props: RescheduleModalProps) {
  return createPortal(<ModalContent {...props} />, document.body)
}