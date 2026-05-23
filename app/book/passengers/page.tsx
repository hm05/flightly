'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/lib/stores/flightStore'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/errors'

export default function PassengerDetailsPage() {
  const router = useRouter()
  const { selectedFlight, selectedSeat } = useFlightStore()

  // Always use standard base price if there's no selectedFlight
  const basePrice = selectedFlight?.base_price ?? 5000
  // Basic mockup logic for seat class pricing
  const seatClass = selectedSeat ? selectedSeat.class : 'economy'
  const classMultiplier = seatClass === 'first' ? 2.5 : seatClass === 'business' ? 1.5 : 1
  const totalPrice = basePrice * classMultiplier + (selectedSeat?.extra_fee ?? 0)

  const [formData, setFormData] = useState({
    fullName: '',
    passportNo: '',
    nationality: '',
    dob: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // If we came here without selecting a flight/seat, usually we should bounce back.
  // We'll just gracefully let them fill it if they refreshed, but booking will fail 
  // if they don't have a flight selected.
  useEffect(() => {
    if (!selectedFlight || !selectedSeat) {
      router.replace('/search')
    }
  }, [selectedFlight, selectedSeat, router])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.fullName.trim()) errs.full_name = 'Full name is required'
    if (!formData.passportNo.trim()) errs.passport_no = 'Passport / ID number is required'
    if (!formData.nationality.trim()) errs.nationality = 'Nationality is required'
    if (!formData.dob) errs.dob = 'Date of birth is required'
    
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (!selectedFlight || !selectedSeat) {
      setError('Missing flight or seat information. Please start over.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        throw new Error('Please log in to complete booking')
      }

      const { data, error: bookingError } = await supabase.rpc('book_flight', {
        p_user_id: userData.user.id,
        p_flight_id: selectedFlight.id,
        p_seat_number: selectedSeat.seat_number,
        p_class: seatClass,
        p_price_paid: totalPrice,
        p_passenger_name: formData.fullName,
        p_passport_no: formData.passportNo,
        p_nationality: formData.nationality,
        p_dob: formData.dob
      })

      if (bookingError) throw bookingError

      // Use the returned PNR code to redirect
      const pnrCode = data
      router.push(`/book/confirmation?pnr=${pnrCode}`)

    } catch (err: unknown) {
      const error = err as Error
      reportError(error, { tag: 'book-flight' })
      setError(error.message || 'Failed to complete booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  })

  return (
    <main className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Summary */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Passenger Details</h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Please enter passport and identification details to complete booking.</p>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-zinc-200/50 diffusion-shadow p-6 flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100">
              Booking Summary
            </h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Flight</p>
                <p className="font-bold text-foreground">
                  {selectedFlight ? `${selectedFlight.flight_no} · ${selectedFlight.origin} to ${selectedFlight.destination}` : 'Not selected'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Selected Seat</p>
                <p className="font-bold text-foreground capitalize">
                  {selectedSeat?.seat_number || 'Not selected'} <span className="text-zinc-400 font-medium">({seatClass})</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-2">
              <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Total Price</span>
              <span className="text-xl font-black text-foreground tracking-tight">{priceFormatter.format(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-zinc-200/50 diffusion-shadow p-6 md:p-8 flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Full Name (as on ID)
              </label>
              <input 
                id="fullName"
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="John Doe"
                className={`h-12 rounded-xl border px-4 text-sm font-medium text-foreground bg-zinc-50/50 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all ${
                  formErrors.full_name ? 'border-rose-300 focus:ring-rose-500 bg-rose-50' : 'border-zinc-200'
                }`}
              />
              {formErrors.full_name && <span className="text-rose-500 text-xs font-bold">{formErrors.full_name}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="passportNo" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Passport / ID Number
              </label>
              <input 
                id="passportNo"
                type="text" 
                value={formData.passportNo}
                onChange={e => setFormData({...formData, passportNo: e.target.value})}
                placeholder="A12345678"
                className={`h-12 rounded-xl border px-4 text-sm font-medium text-foreground bg-zinc-50/50 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all ${
                  formErrors.passport_no ? 'border-rose-300 focus:ring-rose-500 bg-rose-50' : 'border-zinc-200'
                }`}
              />
              {formErrors.passport_no && <span className="text-rose-500 text-xs font-bold">{formErrors.passport_no}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="nationality" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Nationality
                </label>
                <input 
                  id="nationality"
                  type="text" 
                  value={formData.nationality}
                  onChange={e => setFormData({...formData, nationality: e.target.value})}
                  placeholder="e.g. Indian"
                  className={`h-12 rounded-xl border px-4 text-sm font-medium text-foreground bg-zinc-50/50 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all ${
                    formErrors.nationality ? 'border-rose-300 focus:ring-rose-500 bg-rose-50' : 'border-zinc-200'
                  }`}
                />
                {formErrors.nationality && <span className="text-rose-500 text-xs font-bold">{formErrors.nationality}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="dob" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Date of Birth
                </label>
                <input 
                  id="dob"
                  type="date" 
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className={`h-12 rounded-xl border px-4 text-sm font-medium text-foreground bg-zinc-50/50 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all ${
                    formErrors.dob ? 'border-rose-300 focus:ring-rose-500 bg-rose-50' : 'border-zinc-200'
                  }`}
                />
                {formErrors.dob && <span className="text-rose-500 text-xs font-bold">{formErrors.dob}</span>}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 w-full h-12 bg-foreground hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-zinc-900/10 flex items-center justify-center gap-2 active:scale-[0.98] disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : 'Confirm & Pay'}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
