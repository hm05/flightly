import { createClient } from '@/lib/supabase/server'
import { type Flight } from '@/lib/stores/flightStore'
import SearchForm from '@/components/SearchForm'
import FlightList from '@/components/FlightList'

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

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

  return (
    <main className="min-h-screen bg-background relative overflow-hidden pb-24">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 blur-[120px] rounded-[100%] pointer-events-none" />

      {/* Page header / form section */}
      <section className="pt-32 pb-12 px-4 relative z-10">
        <div className="max-w-4xl mx-auto mb-8 text-center">
           <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tighter mb-4">
             Where to next?
           </h1>
        </div>
        <SearchForm
          initialOrigin={origin}
          initialDestination={destination}
          initialDate={date}
          initialPassengers={passengers}
        />
      </section>

      {/* Results section */}
      <section className="max-w-4xl mx-auto px-4 relative z-10">
        {dbError ? (
          <div className="text-center p-8 border border-red-200 bg-red-50 rounded-[2rem]">
             <p className="text-red-600 font-semibold">Something went wrong. Please try again.</p>
          </div>
        ) : hasAllParams ? (
          <FlightList flights={flights} passengers={passengers} />
        ) : null}
      </section>
    </main>
  )
}
