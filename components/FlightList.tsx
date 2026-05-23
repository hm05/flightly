'use client'

import { useFlightStore, type Flight } from '@/lib/stores/flightStore'
import FlightCard from '@/components/FlightCard'
import { motion } from 'framer-motion'
import { WarningCircle } from '@phosphor-icons/react'

type FlightListProps = {
  flights: Flight[]
  passengers: number
}

export default function FlightList({ flights, passengers }: FlightListProps) {
  const searchQuery = useFlightStore((s) => s.searchQuery)

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-3xl border border-zinc-200/50 mt-8 diffusion-shadow">
        <WarningCircle size={48} weight="duotone" className="text-zinc-300" />
        <div>
          <h2 className="text-xl font-bold text-foreground">No flights found</h2>
          <p className="text-zinc-500 font-medium">Try a different date or route.</p>
        </div>
      </div>
    )
  }

  const origin = searchQuery?.origin
  const destination = searchQuery?.destination

  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  return (
    <section className="flex flex-col gap-6 mt-8">
      {/* Results summary */}
      <div className="flex items-center gap-2">
         <div className="h-px bg-zinc-200 flex-1" />
         <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-4">
           <span className="text-foreground">{flights.length}</span> flight{flights.length !== 1 ? 's' : ''} found
           {origin && destination && ` · ${origin} → ${destination}`}
         </p>
         <div className="h-px bg-zinc-200 flex-1" />
      </div>

      {/* Flight cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4"
      >
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            passengers={passengers}
          />
        ))}
      </motion.div>
    </section>
  )
}
