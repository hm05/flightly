'use client'

import { useFlightStore, type Flight } from '@/lib/stores/flightStore'
import FlightCard from '@/components/FlightCard'

type FlightListProps = {
  flights: Flight[]
  passengers: number
}

export default function FlightList({ flights, passengers }: FlightListProps) {
  const searchQuery = useFlightStore((s) => s.searchQuery)

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 text-slate-300"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
          />
        </svg>
        <h2 className="text-xl font-bold text-slate-700">No flights found</h2>
        <p className="text-slate-500 text-sm">
          Try a different date or route.
        </p>
      </div>
    )
  }

  const origin = searchQuery?.origin
  const destination = searchQuery?.destination

  return (
    <section className="flex flex-col gap-4">
      {/* Results summary */}
      <p className="text-sm font-medium text-slate-500">
        <span className="text-slate-800 font-semibold">{flights.length}</span>{' '}
        flight{flights.length !== 1 ? 's' : ''} found
        {origin && destination ? (
          <>
            {' · '}
            <span className="text-slate-800 font-semibold">{origin}</span>
            {' → '}
            <span className="text-slate-800 font-semibold">{destination}</span>
          </>
        ) : null}
      </p>

      {/* Flight cards */}
      <div className="flex flex-col gap-4">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            passengers={passengers}
          />
        ))}
      </div>
    </section>
  )
}
