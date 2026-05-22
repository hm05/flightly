import { createClient } from '@/lib/supabase/server'
import { type Flight } from '@/lib/stores/flightStore'
import SearchForm from '@/components/SearchForm'
import FlightList from '@/components/FlightList'

// searchParams is a Promise in Next.js 16 (changed from v15.0.0-RC onward)
type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  // Extract and normalise — always take the first value when an array
  const origin =
    typeof params.origin === 'string' ? params.origin : undefined
  const destination =
    typeof params.destination === 'string' ? params.destination : undefined
  const date =
    typeof params.date === 'string' ? params.date : undefined
  const passengersRaw =
    typeof params.passengers === 'string' ? params.passengers : undefined
  const passengers = passengersRaw ? parseInt(passengersRaw, 10) : 1

  const hasAllParams = Boolean(origin && destination && date)

  // -------------------------------------------------------------------------
  // Database query (only when all params are present)
  // -------------------------------------------------------------------------

  let flights: Flight[] = []
  let dbError = false

  if (hasAllParams) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin!)
      .eq('destination', destination!)
      .filter('departs_at', 'gte', `${date}T00:00:00`)
      .filter('departs_at', 'lt', `${date}T23:59:59`)
      .neq('status', 'cancelled')
      .order('departs_at', { ascending: true })

    if (error) {
      dbError = true
    } else {
      flights = (data ?? []) as Flight[]
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Page header / form section */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-6 tracking-tight">
          Search for flights
        </h1>
        <SearchForm
          initialOrigin={origin}
          initialDestination={destination}
          initialDate={date}
          initialPassengers={passengers}
        />
      </section>

      {/* Results section */}
      <section className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {dbError ? (
          <p className="text-center text-slate-600 font-medium">
            Something went wrong. Please try again.
          </p>
        ) : hasAllParams ? (
          <FlightList flights={flights} passengers={passengers} />
        ) : null}
      </section>
    </main>
  )
}
