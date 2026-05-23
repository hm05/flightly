'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { AirplaneTilt, Armchair, HandArrowUp, Ticket } from '@phosphor-icons/react'

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    },
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      {/* Dynamic Background Noise / Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-zinc-400/20 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-grow z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col items-start justify-center"
      >
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[60vh]">
          
          <div className="flex flex-col items-start text-left max-w-2xl">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass border-zinc-200/50 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Flightly 1.0 is live</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground mb-6 leading-[1.1]">
              Book flights.<br />
              <span className="text-gradient">Pick your seat.</span><br />
              Travel light.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg text-zinc-500 max-w-lg mb-10 leading-relaxed font-medium">
              Real-time seat availability, instant PNR confirmation, and fluid booking management — engineered for speed.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/signup" 
                className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-foreground hover:bg-zinc-800 rounded-2xl transition-all shadow-xl shadow-zinc-900/10 active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get started
                  <AirplaneTilt weight="bold" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-foreground bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-2xl transition-all active:scale-[0.98] shadow-sm"
              >
                Sign in
              </Link>
            </motion.div>
          </div>
          
          {/* HERO VISUAL (Bento Placeholder) */}
          <motion.div variants={itemVariants} className="w-full relative h-[500px] hidden lg:block perspective-1000">
            <div className="absolute inset-0 rounded-[2.5rem] bg-white border border-zinc-200/60 diffusion-shadow transform rotate-y-[-10deg] rotate-x-[5deg] transition-transform duration-700 hover:rotate-0 flex flex-col overflow-hidden">
               {/* Minimal Mockup UI inside */}
               <div className="h-14 border-b border-zinc-100 flex items-center px-6 gap-2">
                 <div className="w-3 h-3 rounded-full bg-zinc-200" />
                 <div className="w-3 h-3 rounded-full bg-zinc-200" />
                 <div className="w-3 h-3 rounded-full bg-zinc-200" />
               </div>
               <div className="flex-1 bg-zinc-50/50 p-8 flex flex-col gap-4">
                 <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                    className="w-full h-32 bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-20 bg-zinc-100 rounded" />
                      <div className="h-6 w-16 bg-accent/10 rounded-full" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-16 bg-zinc-200 rounded font-mono text-zinc-400 text-xs flex items-center justify-center">SFO</div>
                      <div className="flex-1 h-0.5 bg-zinc-100 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-300"><AirplaneTilt weight="fill" /></div>
                      </div>
                      <div className="h-8 w-16 bg-zinc-200 rounded font-mono text-zinc-400 text-xs flex items-center justify-center">JFK</div>
                    </div>
                  </motion.div>
               </div>
            </div>
          </motion.div>
          
        </div>

        {/* BENTO FEATURES SECTION */}
        <div className="w-full mt-32">
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">The motion-engine <br/><span className="text-zinc-400">for modern travel.</span></h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <motion.div variants={itemVariants} className="group relative bg-white border border-zinc-200/60 rounded-[2rem] p-8 diffusion-shadow overflow-hidden min-h-[300px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                <AirplaneTilt size={120} weight="thin" className="text-zinc-300" />
              </div>
              <div className="relative z-10 w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-foreground mb-8">
                <AirplaneTilt size={24} weight="duotone" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-foreground mb-2">Smart Search</h3>
                <p className="text-zinc-500 font-medium leading-relaxed max-w-[200px]">Live pricing and instant availability across routes.</p>
              </div>
            </motion.div>

            {/* Feature 2 (Spans 2 cols on md) */}
            <motion.div variants={itemVariants} className="group relative bg-white border border-zinc-200/60 rounded-[2rem] p-8 diffusion-shadow overflow-hidden min-h-[300px] flex flex-col justify-between md:col-span-2">
              <div className="absolute right-0 bottom-0 w-2/3 h-full bg-gradient-to-l from-zinc-50 to-transparent pointer-events-none flex items-end justify-end p-8">
                {/* Micro interaction mockup */}
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ duration: 3, repeat: Infinity }}
                  className="grid grid-cols-3 gap-2 opacity-50 translate-x-12 translate-y-12"
                >
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-lg ${i === 4 ? 'bg-accent/20 border-accent border' : 'bg-zinc-100 border-zinc-200 border'}`} />
                  ))}
                </motion.div>
              </div>
              <div className="relative z-10 w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-foreground mb-8">
                <Armchair size={24} weight="duotone" />
              </div>
              <div className="relative z-10 max-w-sm">
                <h3 className="text-xl font-bold text-foreground mb-2">Live Seat Selection</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Visual seat map with real-time availability. Seats update instantly via WebSocket as others book.</p>
              </div>
            </motion.div>

            {/* Feature 3 (Spans 2 cols on md) */}
            <motion.div variants={itemVariants} className="group relative bg-white border border-zinc-200/60 rounded-[2rem] p-8 diffusion-shadow overflow-hidden min-h-[300px] flex flex-col justify-between md:col-span-2">
              <div className="relative z-10 w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-foreground mb-8">
                <Ticket size={24} weight="duotone" />
              </div>
              <div className="relative z-10 max-w-sm">
                <h3 className="text-xl font-bold text-foreground mb-2">Instant PNR Confirmation</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Get your booking reference the moment you confirm. Reschedule or cancel anytime.</p>
              </div>
            </motion.div>

             {/* Feature 4 */}
             <motion.div variants={itemVariants} className="group relative bg-white border border-zinc-200/60 rounded-[2rem] p-8 diffusion-shadow overflow-hidden min-h-[300px] flex flex-col justify-between">
              <div className="relative z-10 w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-foreground mb-8">
                <HandArrowUp size={24} weight="duotone" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-foreground mb-2">1-Click Booking</h3>
                <p className="text-zinc-500 font-medium leading-relaxed max-w-[200px]">Checkout seamlessly with pre-saved profiles.</p>
              </div>
            </motion.div>

          </div>
        </div>

      </motion.main>
      
      {/* MINIMAL FOOTER */}
      <footer className="mt-auto border-t border-zinc-200/50 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-zinc-400 font-medium text-sm tracking-tight">Flightly © 2026</p>
            {/* Better Stack Uptime Badge */}
            <div className="opacity-80 hover:opacity-100 transition-opacity filter grayscale overflow-hidden h-[30px] w-[180px]">
              <iframe src="https://flightly.betteruptime.com/badge" width="100%" height="100%" frameBorder="0" scrolling="no"></iframe>
            </div>
          </div>
          <div className="flex gap-6 text-sm font-semibold">
            <Link href="/login" className="text-zinc-500 hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="text-zinc-500 hover:text-foreground transition-colors">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}