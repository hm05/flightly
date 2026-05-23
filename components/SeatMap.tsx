'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore, type Seat } from '@/lib/stores/flightStore'
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from '@phosphor-icons/react'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

type SeatWithParsed = Seat & {
  row: number
  letter: string
}

type SeatButtonProps = {
  seat?: SeatWithParsed
  selectedSeatId?: string
  onClick: (seat: Seat) => void
}

function SeatButton({ seat, selectedSeatId, onClick }: SeatButtonProps) {
  if (!seat) {
    return <div className="w-10 h-10" /> 
  }

  const isSelected = seat.id === selectedSeatId
  const isOccupied = !seat.is_available

  const feeText = seat.extra_fee > 0 ? ` (+${priceFormatter.format(seat.extra_fee)})` : ' (No extra fee)'
  const tooltip = `${seat.class.charAt(0).toUpperCase() + seat.class.slice(1)} Class · ${seat.seat_number}${feeText}`

  let btnClasses = 'w-10 h-10 rounded-[10px] text-xs font-bold flex items-center justify-center border transition-all duration-300 relative overflow-hidden '

  if (isOccupied) {
    btnClasses += 'bg-zinc-100/50 text-zinc-300 border-zinc-200 cursor-not-allowed'
  } else if (isSelected) {
    btnClasses += 'bg-foreground text-white border-foreground shadow-md shadow-zinc-900/10'
  } else {
    btnClasses += 'bg-white text-zinc-400 hover:text-foreground border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer active:scale-95'
  }

  return (
    <button
      type="button"
      disabled={isOccupied}
      title={tooltip}
      onClick={() => onClick(seat)}
      className={btnClasses}
    >
      <AnimatePresence mode="popLayout">
        {isSelected ? (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CheckCircle weight="bold" size={16} />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {seat.seat_number}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

type SeatMapProps = {
  seats: Seat[]
  flightId: string
}

export default function SeatMap({ seats, flightId }: SeatMapProps) {
  const { selectedSeat, setSelectedSeat, clearSeatSelection } = useFlightStore()
  const [localSeats, setLocalSeats] = useState<Seat[]>(seats)

  const selectedSeatRef = useRef<Seat | null>(selectedSeat)
  useEffect(() => {
    selectedSeatRef.current = selectedSeat
  }, [selectedSeat])

  const handleRealtimeUpdate = useCallback((updatedSeat: Seat) => {
    const current = selectedSeatRef.current
    if (!updatedSeat.is_available && current && current.id === updatedSeat.id) {
      clearSeatSelection()
      alert('Another passenger just booked this seat. Please select another.')
    }
  }, [clearSeatSelection])

  useEffect(() => {
    const supabase = createClient()
    const channelName = `seats-${flightId}`

    const channel = supabase
      .channel(channelName)
      .on<Seat>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload: RealtimePostgresChangesPayload<Seat>) => {
          const updatedSeat = payload.new as Seat
          setLocalSeats((prev) =>
            prev.map((s) => (s.id === updatedSeat.id ? updatedSeat : s)),
          )
          handleRealtimeUpdate(updatedSeat)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flightId, handleRealtimeUpdate])

  const parsedSeats: SeatWithParsed[] = localSeats.map((seat) => {
    const match = seat.seat_number.match(/^(\d+)([A-Z])$/)
    return {
      ...seat,
      row: match ? parseInt(match[1], 10) : 99,
      letter: match ? match[2] : '',
    }
  })

  const firstClass = parsedSeats.filter((s) => s.row >= 1 && s.row <= 2)
  const businessClass = parsedSeats.filter((s) => s.row >= 3 && s.row <= 6)
  const economyClass = parsedSeats.filter((s) => s.row >= 7 && s.row <= 15)

  function renderSectionRows(sectionSeats: SeatWithParsed[], isEconomy: boolean) {
    const rowsMap: Record<number, SeatWithParsed[]> = {}
    sectionSeats.forEach((s) => {
      if (!rowsMap[s.row]) rowsMap[s.row] = []
      rowsMap[s.row].push(s)
    })

    const sortedRowNums = Object.keys(rowsMap)
      .map(Number)
      .sort((a, b) => a - b)

    return (
      <div className="flex flex-col gap-3 py-4">
        {sortedRowNums.map((rowNum) => {
          const rowSeats = rowsMap[rowNum]

          if (isEconomy) {
            const seatA = rowSeats.find((s) => s.letter === 'A')
            const seatB = rowSeats.find((s) => s.letter === 'B')
            const seatC = rowSeats.find((s) => s.letter === 'C')

            return (
              <div key={rowNum} className="flex items-center justify-center gap-3 relative">
                <div className="flex items-center gap-3">
                  <SeatButton seat={seatA} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                  <SeatButton seat={seatB} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                </div>
                <div className="w-16 flex justify-center text-zinc-300 text-[10px] font-mono font-bold select-none uppercase tracking-widest">
                  Row {rowNum}
                </div>
                <div className="flex items-center gap-3">
                  <SeatButton seat={seatC} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                  <div className="w-10 h-10" /> 
                </div>
              </div>
            )
          } else {
            const seatA = rowSeats.find((s) => s.letter === 'A')
            const seatB = rowSeats.find((s) => s.letter === 'B')

            return (
              <div key={rowNum} className="flex items-center justify-center gap-3 relative">
                <SeatButton seat={seatA} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                <div className="w-16 flex justify-center text-zinc-300 text-[10px] font-mono font-bold select-none uppercase tracking-widest">
                  Row {rowNum}
                </div>
                <SeatButton seat={seatB} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
              </div>
            )
          }
        })}
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Scrollable airplane seat map container */}
      <div className="w-full max-w-md max-h-[60vh] overflow-y-auto border border-zinc-200/50 rounded-[2.5rem] bg-zinc-50/30 p-8 shadow-inner mb-8 scrollbar-thin scrollbar-thumb-zinc-200">
        <div className="flex flex-col gap-8 relative">
           
          {/* Fuselage Lines (decorative) */}
          <div className="absolute top-0 bottom-0 left-[20%] w-px bg-zinc-200/50" />
          <div className="absolute top-0 bottom-0 right-[20%] w-px bg-zinc-200/50" />

          {/* Section 1: First Class */}
          {firstClass.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-zinc-200/50" />
                <span className="text-[10px] font-bold text-accent tracking-widest uppercase">First Class</span>
                <div className="flex-1 h-px bg-zinc-200/50" />
              </div>
              {renderSectionRows(firstClass, false)}
            </div>
          )}

          {/* Section 2: Business Class */}
          {businessClass.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-zinc-200/50" />
                <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Business</span>
                <div className="flex-1 h-px bg-zinc-200/50" />
              </div>
              {renderSectionRows(businessClass, false)}
            </div>
          )}

          {/* Section 3: Economy Class */}
          {economyClass.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-zinc-200/50" />
                <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Economy</span>
                <div className="flex-1 h-px bg-zinc-200/50" />
              </div>
              {renderSectionRows(economyClass, true)}
            </div>
          )}

        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-white border border-zinc-200 rounded-[4px]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-foreground rounded-[4px] shadow-sm" />
          <span className="text-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-zinc-100 border border-zinc-200 rounded-[4px]" />
          <span>Occupied</span>
        </div>
      </div>
    </div>
  )
}
