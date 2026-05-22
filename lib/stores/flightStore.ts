import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Flight = {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: string
  base_price: number
}

export type Seat = {
  id: string
  flight_id: string
  seat_number: string
  class: 'economy' | 'business' | 'first'
  is_available: boolean
  extra_fee: number
}

export type PassengerForm = {
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export type BookingStep =
  | 'search'
  | 'select-flight'
  | 'select-seat'
  | 'passenger-details'
  | 'confirmation'

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface FlightStore {
  // State
  searchQuery: {
    origin: string
    destination: string
    date: string
    passengers: number
  } | null
  selectedFlight: Flight | null
  selectedSeat: Seat | null
  currentStep: BookingStep
  passengerForm: PassengerForm
  confirmedBookingId: string | null
  confirmedPnr: string | null

  // Actions

  /** Updates the search query used on the flights listing page. */
  setSearchQuery(query: FlightStore['searchQuery']): void

  /** Stores the flight the user tapped/clicked in the search results. */
  setSelectedFlight(flight: Flight): void

  /**
   * OPTIMISTIC action — sets `selectedSeat` immediately before Supabase
   * confirms the reservation. If the Supabase write fails (e.g. SEAT_TAKEN),
   * the caller is responsible for calling `clearSeatSelection()` to rollback.
   */
  setSelectedSeat(seat: Seat): void

  /**
   * Sets `selectedSeat` back to `null`.
   * Call this on a SEAT_TAKEN error to rollback the optimistic update.
   */
  clearSeatSelection(): void

  /** Advances or retreats the multi-step booking wizard. */
  setCurrentStep(step: BookingStep): void

  /** Merges partial passenger form fields into the existing form state. */
  updatePassengerForm(fields: Partial<PassengerForm>): void

  /** Stores the confirmed booking ID and PNR returned by the RPC. */
  setConfirmedBookingId(id: string, pnr: string): void

  /**
   * Resets `selectedFlight`, `selectedSeat`, `currentStep` (back to `'search'`),
   * and `passengerForm` (back to empty strings).
   * Does NOT reset `searchQuery` — the user can re-search with the same query.
   */
  resetBooking(): void
}

// ---------------------------------------------------------------------------
// Default passenger form
// ---------------------------------------------------------------------------

const emptyPassengerForm: PassengerForm = {
  full_name: '',
  passport_no: '',
  nationality: '',
  dob: '',
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      // Initial state
      searchQuery: null,
      selectedFlight: null,
      selectedSeat: null,
      currentStep: 'search',
      passengerForm: emptyPassengerForm,
      confirmedBookingId: null,
      confirmedPnr: null,

      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedFlight: (flight) => set({ selectedFlight: flight }),

      setSelectedSeat: (seat) => set({ selectedSeat: seat }),

      clearSeatSelection: () => set({ selectedSeat: null }),

      setCurrentStep: (step) => set({ currentStep: step }),

      updatePassengerForm: (fields) =>
        set((state) => ({
          passengerForm: { ...state.passengerForm, ...fields },
        })),

      setConfirmedBookingId: (id, pnr) =>
        set({ confirmedBookingId: id, confirmedPnr: pnr }),

      resetBooking: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          currentStep: 'search',
          passengerForm: emptyPassengerForm,
        }),
    }),
    {
      name: 'flightly-booking',
      // Only persist searchQuery and currentStep.
      // selectedFlight, selectedSeat, passengerForm (contains passport_no),
      // confirmedBookingId, and confirmedPnr are intentionally excluded.
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        currentStep: state.currentStep,
      }),
    },
  ),
)
