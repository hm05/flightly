import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CachedBooking = {
  id: string
  pnr_code: string
  flight_no: string
  origin: string
  destination: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  departs_at: string
  seat_number: string
  total_price: number
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface UserStore {
  // State
  sessionToken: string | null
  cachedBookings: CachedBooking[]

  // Actions

  /**
   * Stores or clears the session token.
   * Call this after a successful login (pass the token) or logout (pass null).
   */
  setSessionToken(token: string | null): void

  /**
   * Replaces the entire cached bookings list.
   * Call this when the My Bookings page fetches fresh data from Supabase.
   */
  setCachedBookings(bookings: CachedBooking[]): void

  /**
   * Appends a single booking to the cached list.
   * Call this immediately after `reserve_seat` RPC succeeds to optimistically
   * update the UI without waiting for a full refetch.
   */
  addCachedBooking(booking: CachedBooking): void

  /**
   * Mutates the `status` field of one booking identified by `id`.
   * Call this after a cancel or reschedule action succeeds.
   */
  updateBookingStatus(id: string, status: CachedBooking['status']): void

  /**
   * Resets `sessionToken` to `null` and `cachedBookings` to an empty array.
   * Call this on logout.
   */
  clearUser(): void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Initial state
      sessionToken: null,
      cachedBookings: [],

      // Actions
      setSessionToken: (token) => set({ sessionToken: token }),

      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),

      addCachedBooking: (booking) =>
        set((state) => ({
          cachedBookings: [...state.cachedBookings, booking],
        })),

      updateBookingStatus: (id, status) =>
        set((state) => ({
          cachedBookings: state.cachedBookings.map((booking) =>
            booking.id === id ? { ...booking, status } : booking,
          ),
        })),

      clearUser: () => set({ sessionToken: null, cachedBookings: [] }),
    }),
    {
      name: 'flightly-user',
      // Only persist sessionToken.
      // cachedBookings is intentionally excluded — always re-fetch from
      // Supabase on mount so the UI never shows stale booking data.
      partialize: (state) => ({
        sessionToken: state.sessionToken,
      }),
    },
  ),
)
