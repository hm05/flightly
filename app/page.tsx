import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* NAVBAR */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-400">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
            Flightly
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-indigo-100 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-white/10 border border-white/20 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* SECTION 1 — Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-24 md:py-32 px-4 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mb-6">
          Book flights. Pick your seat. Travel light.
        </h1>
        <p className="text-lg md:text-xl text-indigo-200 max-w-2xl mb-10 leading-relaxed">
          Real-time seat availability, instant PNR confirmation, and full booking management — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/signup" 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-indigo-600/30 transition-all text-lg"
          >
            Get started
          </Link>
          <Link 
            href="/login" 
            className="bg-transparent border border-indigo-400/30 hover:border-indigo-400 hover:bg-indigo-900/50 text-white font-semibold py-3 px-8 rounded-lg transition-all text-lg"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* SECTION 2 — Features */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Smart flight search</h3>
            <p className="text-slate-600 leading-relaxed">
              Search across routes with live pricing. Filter by date, class, and passenger count.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <rect width="7" height="7" x="4" y="4" rx="1" />
                <rect width="7" height="7" x="13" y="4" rx="1" />
                <rect width="7" height="7" x="4" y="13" rx="1" />
                <rect width="7" height="7" x="13" y="13" rx="1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Live seat selection</h3>
            <p className="text-slate-600 leading-relaxed">
              Visual seat map with real-time availability. Seats update instantly as other passengers book.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Instant PNR confirmation</h3>
            <p className="text-slate-600 leading-relaxed">
              Get your booking reference the moment you confirm. Reschedule or cancel anytime from your dashboard.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 3 — How it works */}
      <section className="bg-slate-50 py-20 px-4 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-6 left-[16.66%] right-[16.66%] h-0.5 bg-slate-200" />
            
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl ring-8 ring-slate-50">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Search</h3>
              <p className="text-slate-600 max-w-xs">Enter your route and travel date</p>
            </div>

            <div className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl ring-8 ring-slate-50">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Select</h3>
              <p className="text-slate-600 max-w-xs">Pick your flight and choose a seat live</p>
            </div>

            <div className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl ring-8 ring-slate-50">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Confirm</h3>
              <p className="text-slate-600 max-w-xs">Fill passenger details and get your PNR</p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4 — Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm">Flightly © 2026</p>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/login" className="text-slate-500 hover:text-indigo-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-slate-500 hover:text-indigo-600 transition-colors">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}