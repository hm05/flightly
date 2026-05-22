'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore, type Seat } from '@/lib/stores/flightStore'
import { createClient } from '@/lib/supabase/client'
import SeatMap from '@/components/SeatMap'

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
})

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SeatsPage() {
  const router = useRouter()
  const { selectedFlight, selectedSeat, setCurrentStep } = useFlightStore()

  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if no flight selected
  useEffect(() => {
    if (!selectedFlight) {
      router.push('/search')
    }
  }, [selectedFlight, router])

  // Fetch seats
  useEffect(() => {
    if (!selectedFlight) return

    async function fetchSeats() {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        
        const { data, error: dbError } = await supabase
          .from('seats')
          .select('*')
          .eq('flight_id', selectedFlight!.id)
          .order('seat_number', { ascending: true })

        if (dbError) {
          setError(dbError.message)
        } else {
          setSeats((data ?? []) as Seat[])
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch seats')
      } finally {
        setLoading(false)
      }
    }

    fetchSeats()
  }, [selectedFlight])

  if (!selectedFlight) {
    return null // Will redirect in useEffect
  }

  function handleContinue() {
    if (!selectedSeat) return
    setCurrentStep('passenger-details')
    router.push('/book/passengers')
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-28">
      {/* Flight info header */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white px-4 py-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono tracking-widest text-indigo-300 font-bold uppercase mb-1">
              Flight {selectedFlight.flight_no}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {selectedFlight.origin} → {selectedFlight.destination}
            </h1>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-indigo-200 font-medium">Departure (IST)</p>
            <p className="text-sm font-semibold text-white">
              {dateFormatter.format(new Date(selectedFlight.departs_at))}
            </p>
          </div>
        </div>
      </section>

      {/* Main seat selection container */}
      <section className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-medium">Loading seat map...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center max-w-md w-full">
            <p className="text-red-700 font-semibold mb-2">Error loading seats</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Select your seat</h2>
              <p className="text-xs text-slate-500">
                Choose from available seats. Extra fees may apply based on class.
              </p>
            </div>
            <SeatMap key={selectedFlight.id} seats={seats} flightId={selectedFlight.id} />
          </div>
        )}
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 z-40 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Selected Seat
            </p>
            {selectedSeat ? (
              <p className="text-lg font-bold text-slate-800">
                {selectedSeat.seat_number}{' '}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 capitalize ml-2">
                  {selectedSeat.class}
                </span>
                {selectedSeat.extra_fee > 0 && (
                  <span className="text-xs text-emerald-600 font-medium ml-2">
                    +{priceFormatter.format(selectedSeat.extra_fee)}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm font-medium text-slate-500">No seat selected</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedSeat}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm shadow-indigo-600/20 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continue to details
          </button>
        </div>
      </div>
    </main>
  )
}
