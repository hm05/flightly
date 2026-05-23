'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/lib/stores/flightStore'
import { MagnifyingGlass, Users, CalendarBlank, MapPin, CaretDown } from '@phosphor-icons/react'

type Airport = {
  code: string
  label: string
}

const AIRPORTS: Airport[] = [
  { code: 'BOM', label: 'BOM (Mumbai)' },
  { code: 'DEL', label: 'DEL (Delhi)' },
  { code: 'BLR', label: 'BLR (Bengaluru)' },
  { code: 'HYD', label: 'HYD (Hyderabad)' },
]

type SearchFormProps = {
  initialOrigin?: string
  initialDestination?: string
  initialDate?: string
  initialPassengers?: number
}

export default function SearchForm({
  initialOrigin,
  initialDestination,
  initialDate,
  initialPassengers,
}: SearchFormProps) {
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useFlightStore()

  const [origin, setOrigin] = useState(initialOrigin ?? '')
  const [destination, setDestination] = useState(initialDestination ?? '')
  const [date, setDate] = useState(initialDate ?? '')
  const [passengers, setPassengers] = useState(initialPassengers ?? 1)
  const [sameRouteError, setSameRouteError] = useState(false)
  const [noDateError, setNoDateError] = useState(false)

  // Pre-fill from the store on return visits (only if no initial props provided)
  useEffect(() => {
    const updateState = () => {
      if (!initialOrigin && !initialDestination && !initialDate && searchQuery) {
        setOrigin(searchQuery.origin)
        setDestination(searchQuery.destination)
        setDate(searchQuery.date)
        setPassengers(searchQuery.passengers)
      }
    }
    updateState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayISO = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSameRouteError(false)
    setNoDateError(false)

    let hasError = false

    if (origin && destination && origin === destination) {
      setSameRouteError(true)
      hasError = true
    }

    if (!date) {
      setNoDateError(true)
      hasError = true
    }

    if (hasError || !origin || !destination) return

    setSearchQuery({ origin, destination, date, passengers })
    router.push(
      `/search?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`,
    )
  }

  function decrement() {
    setPassengers((p) => Math.max(1, p - 1))
  }

  function increment() {
    setPassengers((p) => Math.min(9, p + 1))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-zinc-200 p-2 w-full max-w-4xl mx-auto diffusion-shadow flex flex-col md:flex-row gap-2"
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
        {/* Origin */}
        <div className="relative flex flex-col justify-center bg-zinc-50 hover:bg-zinc-100/50 rounded-2xl px-4 py-3 border border-transparent transition-colors focus-within:border-zinc-300 focus-within:bg-white group cursor-pointer">
          <label
            htmlFor="origin"
            className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 group-focus-within:text-accent transition-colors"
          >
            Origin
          </label>
          <div className="flex items-center gap-2">
            <MapPin size={16} weight="bold" className="text-zinc-400" />
            <select
              id="origin"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value)
                setSameRouteError(false)
              }}
              required
              className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>Where from?</option>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>{a.label}</option>
              ))}
            </select>
            <CaretDown size={14} weight="bold" className="text-zinc-400 absolute right-4 pointer-events-none" />
          </div>
        </div>

        {/* Destination */}
        <div className="relative flex flex-col justify-center bg-zinc-50 hover:bg-zinc-100/50 rounded-2xl px-4 py-3 border border-transparent transition-colors focus-within:border-zinc-300 focus-within:bg-white group cursor-pointer">
          <label
            htmlFor="destination"
            className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 group-focus-within:text-accent transition-colors"
          >
            Destination
          </label>
          <div className="flex items-center gap-2">
            <MapPin size={16} weight="bold" className="text-zinc-400" />
            <select
              id="destination"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setSameRouteError(false)
              }}
              required
              className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>Where to?</option>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>{a.label}</option>
              ))}
            </select>
            <CaretDown size={14} weight="bold" className="text-zinc-400 absolute right-4 pointer-events-none" />
          </div>
        </div>

        {/* Date */}
        <div className="relative flex flex-col justify-center bg-zinc-50 hover:bg-zinc-100/50 rounded-2xl px-4 py-3 border border-transparent transition-colors focus-within:border-zinc-300 focus-within:bg-white group cursor-pointer">
          <label
            htmlFor="date"
            className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 group-focus-within:text-accent transition-colors"
          >
            Date
          </label>
          <div className="flex items-center gap-2">
            <CalendarBlank size={16} weight="bold" className="text-zinc-400" />
            <input
              id="date"
              type="date"
              min={todayISO}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setNoDateError(false)
              }}
              className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="relative flex flex-col justify-center bg-zinc-50 rounded-2xl px-4 py-3 border border-transparent transition-colors focus-within:border-zinc-300">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Passengers
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Users size={16} weight="bold" className="text-zinc-400" />
               <span className="text-sm font-semibold text-foreground tabular-nums min-w-[20px]">{passengers}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={decrement}
                disabled={passengers <= 1}
                className="w-6 h-6 rounded-md bg-white border border-zinc-200 text-zinc-500 font-bold flex items-center justify-center hover:border-zinc-300 hover:text-foreground disabled:opacity-40 active:scale-95 transition-all"
              >
                −
              </button>
              <button
                type="button"
                onClick={increment}
                disabled={passengers >= 9}
                className="w-6 h-6 rounded-md bg-white border border-zinc-200 text-zinc-500 font-bold flex items-center justify-center hover:border-zinc-300 hover:text-foreground disabled:opacity-40 active:scale-95 transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full md:w-auto h-auto min-h-[60px] md:min-w-[120px] bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all shadow-md shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2 px-6"
      >
        <MagnifyingGlass size={20} weight="bold" />
        <span className="md:hidden">Search</span>
      </button>

      {/* Inline errors */}
      {(sameRouteError || noDateError) && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          {sameRouteError && <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Origin and destination cannot be the same</span>}
          {noDateError && <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Please select a travel date</span>}
        </div>
      )}
    </form>
  )
}
