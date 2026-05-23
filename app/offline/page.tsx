'use client'

import { WifiSlash, MapPin, CalendarBlank, Users, Ticket } from '@phosphor-icons/react'
import { useUserStore, type CachedBooking } from '@/lib/stores/userStore'

export default function OfflinePage() {
  const cachedBookings = useUserStore((s) => s.cachedBookings)

  const istDateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })

  function formatIST(isoString: string): string {
    const parts = istDateFormatter.formatToParts(new Date(isoString))
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? ''
    return `${get('day')} ${get('month')} ${get('year')} · ${get('hour')}:${get('minute')} IST`
  }

  function StatusBadge({ status }: { status: CachedBooking['status'] }) {
    const styles: Record<CachedBooking['status'], string> = {
      confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      rescheduled: 'bg-amber-50 text-amber-600 border-amber-200',
      cancelled: 'bg-zinc-50 text-zinc-400 border-zinc-200',
    }
    const labels: Record<CachedBooking['status'], string> = {
      confirmed: 'Confirmed',
      rescheduled: 'Rescheduled',
      cancelled: 'Cancelled',
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Offline Notice Header */}
        <div className="mb-12 text-center flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-foreground">
            <WifiSlash size={32} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              You are offline
            </h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              You can still view your recent boarding passes below.
            </p>
          </div>
        </div>

        {/* Offline Bookings / Boarding Passes */}
        {cachedBookings && cachedBookings.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 px-2">
              Saved Boarding Passes
            </h2>
            <div className="grid gap-6">
              {cachedBookings.map((booking: CachedBooking) => {
                const isCancelled = booking.status === 'cancelled'

                return (
                  <article
                    key={booking.id}
                    className={`rounded-[2rem] border bg-white p-6 diffusion-shadow transition-all ${
                      isCancelled
                        ? 'border-zinc-100 opacity-60 grayscale-[0.5]'
                        : 'border-zinc-200/50 hover:border-zinc-300'
                    }`}
                  >
                    {/* Top row: PNR + status */}
                    <div className="mb-6 flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Booking Reference
                        </p>
                        <p className="font-mono text-2xl font-black tracking-wider text-foreground">
                          {booking.pnr_code}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <MapPin
                            weight="duotone"
                            className="mt-0.5 text-zinc-400"
                            size={20}
                          />
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                              Flight
                            </span>
                            <p className="font-bold text-foreground">
                              {booking.flight_no} · {booking.origin} →{' '}
                              {booking.destination}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <CalendarBlank
                            weight="duotone"
                            className="mt-0.5 text-zinc-400"
                            size={20}
                          />
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                              Departs
                            </span>
                            <p className="font-bold text-foreground">
                              {formatIST(booking.departs_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <Users
                            weight="duotone"
                            className="mt-0.5 text-zinc-400"
                            size={20}
                          />
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                              Seat
                            </span>
                            <p className="font-bold text-foreground capitalize">
                              {booking.seat_number}{' '}
                              <span className="text-xs font-semibold text-zinc-400">
                              { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ }
                              {((booking as any).class || 'Economy')}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-zinc-200/50 bg-white px-6 py-10 text-center diffusion-shadow flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
              <Ticket size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                No offline boarding passes available
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                You haven&apos;t viewed any bookings recently to save them for offline access.
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-white shadow-md shadow-zinc-900/10 transition-all hover:bg-zinc-800 active:scale-[0.98]"
          >
            Try reloading
          </button>
        </div>
      </div>
    </main>
  )
}
