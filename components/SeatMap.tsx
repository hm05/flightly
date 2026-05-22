'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore, type Seat } from '@/lib/stores/flightStore'
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Format helper
// ---------------------------------------------------------------------------

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// ---------------------------------------------------------------------------
// Parsed seat type
// ---------------------------------------------------------------------------

type SeatWithParsed = Seat & {
  row: number
  letter: string
}

// ---------------------------------------------------------------------------
// Seat button component
// ---------------------------------------------------------------------------

type SeatButtonProps = {
  seat?: SeatWithParsed
  selectedSeatId?: string
  onClick: (seat: Seat) => void
}

function SeatButton({ seat, selectedSeatId, onClick }: SeatButtonProps) {
  if (!seat) {
    return <div className="w-10 h-10" /> // Spacer for missing seat config
  }

  const isSelected = seat.id === selectedSeatId
  const isOccupied = !seat.is_available

  const feeText = seat.extra_fee > 0 ? ` (+${priceFormatter.format(seat.extra_fee)})` : ' (No extra fee)'
  const tooltip = `${seat.class.charAt(0).toUpperCase() + seat.class.slice(1)} Class · ${seat.seat_number}${feeText}`

  let btnClasses = 'w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center border transition duration-150 '

  if (isOccupied) {
    btnClasses += 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
  } else if (isSelected) {
    btnClasses += 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30 scale-105'
  } else {
    btnClasses += 'bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer'
  }

  return (
    <button
      type="button"
      disabled={isOccupied}
      title={tooltip}
      onClick={() => onClick(seat)}
      className={btnClasses}
    >
      {seat.seat_number}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type SeatMapProps = {
  seats: Seat[]
  flightId: string
}

export default function SeatMap({ seats, flightId }: SeatMapProps) {
  const { selectedSeat, setSelectedSeat, clearSeatSelection } = useFlightStore()
  const [localSeats, setLocalSeats] = useState<Seat[]>(seats)

  // Keep a stable ref to the latest selectedSeat so the Realtime callback can
  // read the current value without needing to re-subscribe on every change.
  const selectedSeatRef = useRef<Seat | null>(selectedSeat)
  useEffect(() => {
    selectedSeatRef.current = selectedSeat
  }, [selectedSeat])

  // Stable callback that always reads the latest ref — identity never changes.
  const handleRealtimeUpdate = useCallback((updatedSeat: Seat) => {
    const current = selectedSeatRef.current
    if (!updatedSeat.is_available && current && current.id === updatedSeat.id) {
      clearSeatSelection()
      alert('Another passenger just booked this seat. Please select another.')
    }
  }, [clearSeatSelection])

  // Supabase Realtime subscription
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

  // Group and parse localSeats
  const parsedSeats: SeatWithParsed[] = localSeats.map((seat) => {
    const match = seat.seat_number.match(/^(\d+)([A-Z])$/)
    return {
      ...seat,
      row: match ? parseInt(match[1], 10) : 99,
      letter: match ? match[2] : '',
    }
  })

  // Categorize rows
  const firstClass = parsedSeats.filter((s) => s.row >= 1 && s.row <= 2)
  const businessClass = parsedSeats.filter((s) => s.row >= 3 && s.row <= 6)
  const economyClass = parsedSeats.filter((s) => s.row >= 7 && s.row <= 15)

  // Section grouping helper
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
      <div className="flex flex-col gap-3 py-2">
        {sortedRowNums.map((rowNum) => {
          const rowSeats = rowsMap[rowNum]

          if (isEconomy) {
            const seatA = rowSeats.find((s) => s.letter === 'A')
            const seatB = rowSeats.find((s) => s.letter === 'B')
            const seatC = rowSeats.find((s) => s.letter === 'C')

            return (
              <div key={rowNum} className="flex items-center justify-center gap-3">
                {/* Left side: A B */}
                <div className="flex items-center gap-3">
                  <SeatButton seat={seatA} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                  <SeatButton seat={seatB} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                </div>

                {/* Aisle gap / Row label */}
                <div className="w-16 flex justify-center text-slate-400 text-xs font-mono font-bold select-none">
                  Row {rowNum}
                </div>

                {/* Right side: C */}
                <div className="flex items-center gap-3">
                  <SeatButton seat={seatC} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />
                  <div className="w-10 h-10" /> {/* Balanced visual placeholder */}
                </div>
              </div>
            )
          } else {
            // First / Business (A | B)
            const seatA = rowSeats.find((s) => s.letter === 'A')
            const seatB = rowSeats.find((s) => s.letter === 'B')

            return (
              <div key={rowNum} className="flex items-center justify-center gap-3">
                <SeatButton seat={seatA} selectedSeatId={selectedSeat?.id} onClick={setSelectedSeat} />

                {/* Aisle gap / Row label */}
                <div className="w-16 flex justify-center text-slate-400 text-xs font-mono font-bold select-none">
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
      <div className="w-full max-w-md max-h-[60vh] overflow-y-auto border border-slate-200 rounded-2xl bg-slate-50/50 p-6 shadow-inner mb-6 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="flex flex-col gap-6">

          {/* Section 1: First Class */}
          {firstClass.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">First Class</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {renderSectionRows(firstClass, false)}
            </div>
          )}

          {/* Section 2: Business Class */}
          {businessClass.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">Business Class</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {renderSectionRows(businessClass, false)}
            </div>
          )}

          {/* Section 3: Economy Class */}
          {economyClass.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">Economy</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {renderSectionRows(economyClass, true)}
            </div>
          )}

        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-slate-200 rounded-md" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded-md" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded-md" />
          <span>Occupied</span>
        </div>
      </div>
    </div>
  )
}

