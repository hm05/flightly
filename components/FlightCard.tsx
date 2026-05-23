'use client'

import { useRouter } from 'next/navigation'
import { useFlightStore, type Flight } from '@/lib/stores/flightStore'
import { motion } from 'framer-motion'
import { AirplaneTilt } from '@phosphor-icons/react'

function formatDuration(departsAt: string, arrivesAt: string): string {
  const diffMs =
    new Date(arrivesAt).getTime() - new Date(departsAt).getTime()
  const totalMinutes = Math.max(0, Math.round(diffMs / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
})

function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  delayed: {
    label: 'Delayed',
    className: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-600 border border-rose-200',
  },
  boarding: {
    label: 'Boarding',
    className: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
}

type FlightCardProps = {
  flight: Flight
  passengers: number
  classOptions?: string[]
}

const itemVariants: import('framer-motion').Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
}

export default function FlightCard({
  flight,
  passengers,
  classOptions,
}: FlightCardProps) {
  const router = useRouter()
  const { setSelectedFlight, setCurrentStep } = useFlightStore()

  const totalPrice = flight.base_price * passengers
  const statusBadge = STATUS_BADGE[flight.status]

  function handleSelect() {
    setSelectedFlight(flight)
    setCurrentStep('select-seat')
    router.push('/book/seats')
  }

  return (
    <motion.article 
      variants={itemVariants}
      className="group bg-white rounded-3xl border border-zinc-200/50 p-6 flex flex-col md:flex-row gap-6 transition-all hover:border-zinc-300 diffusion-shadow"
    >
      {/* Route & Times */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top meta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <AirplaneTilt size={16} weight="bold" />
            <span className="font-mono font-bold text-xs tracking-widest uppercase">
              {flight.flight_no}
            </span>
          </div>
          {statusBadge && (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
          {classOptions && classOptions.length > 0 &&
            classOptions.map((cls) => (
              <span
                key={cls}
                className="text-[10px] uppercase font-bold tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full"
              >
                {cls}
              </span>
            ))}
        </div>

        {/* Big Times */}
        <div className="flex flex-row items-center justify-between w-full max-w-sm">
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold text-foreground tracking-tighter">
              {formatTime(flight.departs_at)}
            </span>
            <span className="text-sm font-semibold text-zinc-400 mt-1 uppercase tracking-widest">
              {flight.origin}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1 mx-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {formatDuration(flight.departs_at, flight.arrives_at)}
            </span>
            <div className="relative w-full h-px bg-zinc-200">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-accent transition-colors" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-transparent">
              Direct
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-3xl font-extrabold text-foreground tracking-tighter">
              {formatTime(flight.arrives_at)}
            </span>
            <span className="text-sm font-semibold text-zinc-400 mt-1 uppercase tracking-widest">
              {flight.destination}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="md:w-48 md:border-l border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
        <div className="flex flex-col md:text-right">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            {passengers} Traveler{passengers > 1 ? 's' : ''}
          </span>
          <span className="text-2xl font-bold text-foreground">
            {priceFormatter.format(totalPrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSelect}
          className="bg-foreground hover:bg-zinc-800 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-zinc-900/10 active:scale-[0.98] w-full md:w-auto text-center"
        >
          Select
        </button>
      </div>
    </motion.article>
  )
}
