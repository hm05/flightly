'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type BookingWithDetails } from '@/app/bookings/page'
import { type Flight } from '@/lib/stores/flightStore'
import { reportError } from '@/lib/errors'

import { X, MapPin, ArrowRight, Info } from '@phosphor-icons/react'

type RescheduleModalProps = {
  booking: BookingWithDetails
  onClose: () => void
  onRescheduled: (newFlight: Flight) => void
}

export default function RescheduleModal({
  booking,
  onClose,
  onRescheduled,
}: RescheduleModalProps) {
  const [loading, setLoading] = useState(false)
  const [dateStr, setDateStr] = useState('')
  const [flights, setFlights] = useState<Flight[]>([])
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [searchDone, setSearchDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState(false)

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

  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!dateStr) return

    setLoading(true)
    setError(null)
    setSearchDone(false)
    setSelectedFlight(null)

    try {
      const supabase = createClient()
      const searchDate = new Date(dateStr)
      const startOfDay = new Date(searchDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(searchDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error: sbError } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', booking.origin)
        .eq('destination', booking.destination)
        .gte('departs_at', startOfDay.toISOString())
        .lte('departs_at', endOfDay.toISOString())
        .order('departs_at', { ascending: true })

      if (sbError) throw sbError

      const validFlights = (data as Flight[]).filter(
        (f) => new Date(f.departs_at).getTime() > Date.now(),
      )

      setFlights(validFlights)
    } catch (err) {
      reportError(err, { tag: 'search-reschedule-flights' })
      setError('Failed to search flights. Please try again.')
    } finally {
      setLoading(false)
      setSearchDone(true)
    }
  }

  async function handleConfirm() {
    if (!selectedFlight) return
    setRescheduling(true)
    setRescheduleError(null)

    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('reschedule_booking', {
      p_booking_id: booking.id,
      p_new_flight_id: selectedFlight.id,
    })

    if (!rpcError) {
      onRescheduled(selectedFlight)
    } else {
      const msg = rpcError.message ?? ''
      if (msg.includes('TOO_LATE_TO_RESCHEDULE')) {
        setRescheduleError('It is too late to reschedule this booking (less than 2 hours before departure).')
      } else if (msg.includes('SAME_FLIGHT')) {
        setRescheduleError('You are already booked on this flight.')
      } else if (msg.includes('CLASS_NOT_AVAILABLE')) {
        setRescheduleError(`Your booked class (${booking.class}) is not available on the selected flight.`)
      } else {
        reportError(rpcError, { tag: 'reschedule-booking' })
        setRescheduleError('Failed to reschedule. Please try again.')
      }
      setRescheduling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-[2rem] diffusion-shadow flex flex-col max-h-[90vh] border border-zinc-200/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">
              Reschedule Flight
            </p>
            <div className="flex items-center gap-2">
              <span
                className="font-mono font-black text-lg text-foreground tracking-wider"
                title="Your Booking Reference"
              >
                {booking.pnr_code}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={rescheduling}
            className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-foreground hover:bg-zinc-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Current Flight Info */}
          <div className="bg-zinc-50 rounded-2xl p-5 mb-6 border border-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <MapPin weight="duotone" className="text-zinc-400" size={24} />
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span>{booking.origin}</span>
                <ArrowRight size={14} className="text-zinc-300" weight="bold" />
                <span>{booking.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Current Departure
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatIST(booking.departs_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Class
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {booking.class}
                </p>
              </div>
            </div>
          </div>

          {/* Search New Date */}
          <form onSubmit={handleSearch} className="mb-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="rescheduleDate"
                className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                New Departure Date
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  id="rescheduleDate"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
                <button
                  type="submit"
                  disabled={loading || !dateStr || rescheduling}
                  className="px-6 py-3 rounded-xl bg-foreground text-white font-bold text-sm transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-zinc-900/10 active:scale-95"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-rose-600 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
          </form>

          {/* Search Results */}
          {searchDone && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">
                Available Flights
              </h4>

              {flights.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-sm font-bold text-foreground">
                    No flights found for this date.
                  </p>
                  <p className="text-xs font-medium text-zinc-500 mt-1">
                    Please try selecting another date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flights.map((flight) => {
                    const isSelected = selectedFlight?.id === flight.id
                    return (
                      <div
                        key={flight.id}
                        onClick={() => !rescheduling && setSelectedFlight(flight)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'border-foreground bg-zinc-50'
                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                        } ${rescheduling ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-foreground'
                                  : 'border-zinc-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">
                                {formatIST(flight.departs_at)}
                              </p>
                              <p className="font-medium text-zinc-500 text-xs mt-0.5">
                                {flight.flight_no}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground text-sm flex-shrink-0">
                              {priceFormatter.format(flight.base_price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {rescheduleError && (
            <div className="mt-6 flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl animate-in slide-in-from-bottom-2 duration-200">
              <Info weight="fill" className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-bold">{rescheduleError}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 rounded-b-[2rem]">
          <button
            onClick={onClose}
            disabled={rescheduling}
            className="py-2.5 px-5 rounded-xl text-sm font-bold text-zinc-500 hover:text-foreground hover:bg-white border border-transparent hover:border-zinc-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedFlight || rescheduling}
            className="py-2.5 px-6 rounded-xl text-sm font-bold bg-foreground text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed transition-all shadow-md shadow-zinc-900/10 disabled:shadow-none active:scale-[0.98]"
          >
            {rescheduling ? 'Rescheduling...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}