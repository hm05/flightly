'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/lib/stores/flightStore'
import { useUserStore } from '@/lib/stores/userStore'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PassengersPage() {
  const router = useRouter()
  
  const {
    selectedFlight,
    selectedSeat,
    passengerForm,
    updatePassengerForm,
    setConfirmedBookingId,
    setCurrentStep,
    clearSeatSelection,
  } = useFlightStore()

  const { addCachedBooking } = useUserStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Redirect if flight or seat is missing
  useEffect(() => {
    if (!selectedFlight || !selectedSeat) {
      router.push('/search')
    }
  }, [selectedFlight, selectedSeat, router])

  if (!selectedFlight || !selectedSeat) {
    return null // Redirecting
  }

  // Capture non-null references so TypeScript can narrow them inside
  // handleSubmit (async closures lose the narrowing from the guard above).
  const flight = selectedFlight
  const seat = selectedSeat

  // Calculate 18 years ago for maximum DOB input
  const today = new Date()
  const maxDobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const maxDobISO = maxDobDate.toISOString().split('T')[0]

  const totalPrice = flight.base_price + seat.extra_fee

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFormErrors({})

    // Basic fields validation
    const errors: Record<string, string> = {}
    if (!passengerForm.full_name.trim()) errors.full_name = 'Full name is required'
    if (!passengerForm.passport_no.trim()) errors.passport_no = 'Passport number is required'
    if (!passengerForm.nationality.trim()) errors.nationality = 'Nationality is required'
    if (!passengerForm.dob) {
      errors.dob = 'Date of birth is required'
    } else if (new Date(passengerForm.dob) > maxDobDate) {
      errors.dob = 'Passenger must be at least 18 years old'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Check current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      // Reserve seat RPC
      const { data: bookingId, error: rpcError } = await supabase.rpc('reserve_seat', {
        p_flight_id: flight.id,
        p_seat_id: seat.id,
        p_passenger: {
          full_name: passengerForm.full_name,
          passport_no: passengerForm.passport_no,
          nationality: passengerForm.nationality,
          dob: passengerForm.dob,
        },
      })

      if (rpcError) {
        const errorMsg = rpcError.message || ''

        if (errorMsg.includes('SEAT_TAKEN')) {
          clearSeatSelection()
          setError('This seat was just booked by another passenger. Please go back and select a different seat.')
        } else if (errorMsg.includes('UNAUTHENTICATED')) {
          router.push('/login')
        } else {
          // Unexpected database error
          reportError(rpcError, { tag: 'reserve-seat' })
          setError('Booking failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (!bookingId) {
        setError('Booking failed. Please try again.')
        setLoading(false)
        return
      }

      // Fetch PNR code for success step
      const { data: booking, error: pnrError } = await supabase
        .from('bookings')
        .select('pnr_code')
        .eq('id', bookingId)
        .single()

      if (pnrError || !booking) {
        reportError(pnrError ?? new Error('Failed to fetch PNR code'), { tag: 'fetch-pnr' })
        setError('Booking succeeded, but failed to load confirmation details. Please check My Bookings.')
        setLoading(false)
        return
      }

      // Update store state on success
      setConfirmedBookingId(bookingId, booking.pnr_code)

      // Cache booking locally in useUserStore
      addCachedBooking({
        id: bookingId,
        pnr_code: booking.pnr_code,
        flight_no: flight.flight_no,
        origin: flight.origin,
        destination: flight.destination,
        status: 'confirmed',
        departs_at: flight.departs_at,
        seat_number: seat.seat_number,
        total_price: totalPrice,
      })

      setCurrentStep('confirmation')
      router.push('/book/confirmation')
    } catch (err: unknown) {
      reportError(err instanceof Error ? err : new Error('Unknown error in passenger submission'), { tag: 'passenger-submission-catch' })
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Passenger Details</h1>
          <p className="text-slate-500 text-sm mt-1">Please enter passport and identification details to complete booking.</p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
            Booking Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 font-medium">Flight</p>
              <p className="font-semibold text-slate-800">
                {flight.flight_no} ({flight.origin} → {flight.destination})
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Selected Seat</p>
              <p className="font-semibold text-slate-800 capitalize">
                {seat.seat_number} ({seat.class} Class)
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Estimated Price</span>
            <span className="text-xl font-bold text-slate-900">{priceFormatter.format(totalPrice)}</span>
          </div>
        </div>

        {/* Form Error alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-semibold mb-1">Booking Issue</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
              Full Name (as in Passport)
            </label>
            <input
              id="fullName"
              type="text"
              required
              disabled={loading}
              placeholder="E.g. Jane Doe"
              value={passengerForm.full_name}
              onChange={(e) => updatePassengerForm({ full_name: e.target.value })}
              className={`h-11 rounded-xl border px-3 text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                formErrors.full_name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.full_name && <p className="text-xs text-red-600 font-medium">{formErrors.full_name}</p>}
          </div>

          {/* Passport Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="passportNo" className="text-sm font-semibold text-slate-700">
              Passport Number
            </label>
            <input
              id="passportNo"
              type="text"
              required
              disabled={loading}
              placeholder="E.g. A12345678"
              value={passengerForm.passport_no}
              onChange={(e) => updatePassengerForm({ passport_no: e.target.value })}
              className={`h-11 rounded-xl border px-3 text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                formErrors.passport_no ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.passport_no && <p className="text-xs text-red-600 font-medium">{formErrors.passport_no}</p>}
          </div>

          {/* Nationality */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nationality" className="text-sm font-semibold text-slate-700">
              Nationality
            </label>
            <input
              id="nationality"
              type="text"
              required
              disabled={loading}
              placeholder="E.g. Indian"
              value={passengerForm.nationality}
              onChange={(e) => updatePassengerForm({ nationality: e.target.value })}
              className={`h-11 rounded-xl border px-3 text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                formErrors.nationality ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.nationality && <p className="text-xs text-red-600 font-medium">{formErrors.nationality}</p>}
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dob" className="text-sm font-semibold text-slate-700">
              Date of Birth (Must be 18+ years old)
            </label>
            <input
              id="dob"
              type="date"
              required
              disabled={loading}
              max={maxDobISO}
              value={passengerForm.dob}
              onChange={(e) => updatePassengerForm({ dob: e.target.value })}
              className={`h-11 rounded-xl border px-3 text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                formErrors.dob ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.dob && <p className="text-xs text-red-600 font-medium">{formErrors.dob}</p>}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Reserving Seat...</span>
              </>
            ) : (
              <span>Confirm & Book Seat</span>
            )}
          </button>
        </form>

      </div>
    </main>
  )
}
