import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookingsList from '@/components/BookingsList'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingWithDetails = {
  id: string
  pnr_code: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  booked_at: string
  total_price: number
  flight_id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  base_price: number
  seat_number: string
  class: 'economy' | 'business' | 'first'
  extra_fee: number
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      pnr_code,
      status,
      booked_at,
      total_price,
      flight_id,
      flights!bookings_flight_id_fkey (
        flight_no,
        origin,
        destination,
        departs_at,
        arrives_at,
        base_price
      ),
      seats!bookings_seat_id_fkey (
        seat_number,
        class,
        extra_fee
      )
    `,
    )
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false })

  // Supabase's TypeScript inference models joined relations as arrays, but at
  // runtime they are plain objects (or null) because of the relationship
  // directionality. We route through `unknown` to express that.
  type RawRow = {
    id: string
    pnr_code: string
    status: 'confirmed' | 'rescheduled' | 'cancelled'
    booked_at: string
    total_price: number
    flight_id: string
    flights: {
      flight_no: string
      origin: string
      destination: string
      departs_at: string
      arrives_at: string
      base_price: number
    } | null
    seats: {
      seat_number: string
      class: 'economy' | 'business' | 'first'
      extra_fee: number
    } | null
  }

  const bookings: BookingWithDetails[] = error
    ? []
    : ((data ?? []) as unknown as RawRow[])
        .filter((row) => row.flights !== null && row.seats !== null)
        .map((row) => ({
          id: row.id,
          pnr_code: row.pnr_code,
          status: row.status,
          booked_at: row.booked_at,
          total_price: row.total_price,
          flight_id: row.flight_id,
          flight_no: row.flights!.flight_no,
          origin: row.flights!.origin,
          destination: row.flights!.destination,
          departs_at: row.flights!.departs_at,
          arrives_at: row.flights!.arrives_at,
          base_price: row.flights!.base_price,
          seat_number: row.seats!.seat_number,
          class: row.seats!.class,
          extra_fee: row.seats!.extra_fee,
        }))

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Dark gradient header — matches search page */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 px-4 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono tracking-widest text-indigo-300 font-bold uppercase mb-2">
            Your trips
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            My Bookings
          </h1>
          <p className="text-indigo-200 text-sm mt-2">
            View, reschedule, or cancel your upcoming flights.
          </p>
        </div>
      </section>

      {/* Bookings content */}
      <section className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">
              Something went wrong loading your bookings.
            </p>
            <p className="text-red-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : (
          <BookingsList bookings={bookings} />
        )}
      </section>
    </main>
  )
}
