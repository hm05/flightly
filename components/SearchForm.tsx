'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/lib/stores/flightStore'

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
    if (!initialOrigin && !initialDestination && !initialDate && searchQuery) {
      setOrigin(searchQuery.origin)
      setDestination(searchQuery.destination)
      setDate(searchQuery.date)
      setPassengers(searchQuery.passengers)
    }
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
      className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 p-6 md:p-8 w-full max-w-3xl mx-auto"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Origin */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="origin"
            className="text-sm font-semibold text-slate-700"
          >
            Origin
          </label>
          <select
            id="origin"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value)
              setSameRouteError(false)
            }}
            required
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="" disabled>
              Select origin
            </option>
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="destination"
            className="text-sm font-semibold text-slate-700"
          >
            Destination
          </label>
          <select
            id="destination"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value)
              setSameRouteError(false)
            }}
            required
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="" disabled>
              Select destination
            </option>
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="date"
            className="text-sm font-semibold text-slate-700"
          >
            Date
          </label>
          <input
            id="date"
            type="date"
            min={todayISO}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setNoDateError(false)
            }}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        {/* Passengers */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            Passengers
          </span>
          <div className="h-11 flex items-center gap-3">
            <button
              type="button"
              onClick={decrement}
              disabled={passengers <= 1}
              aria-label="Decrease passengers"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              −
            </button>
            <span
              className="w-5 text-center text-sm font-semibold text-slate-900 tabular-nums"
              aria-live="polite"
            >
              {passengers}
            </span>
            <button
              type="button"
              onClick={increment}
              disabled={passengers >= 9}
              aria-label="Increase passengers"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Inline errors */}
      {sameRouteError && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600 font-medium"
        >
          Origin and destination cannot be the same.
        </p>
      )}
      {noDateError && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600 font-medium"
        >
          Please select a travel date.
        </p>
      )}

      <button
        type="submit"
        className="mt-5 w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-sm shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Search flights
      </button>
    </form>
  )
}
