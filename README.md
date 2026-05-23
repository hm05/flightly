# Flightly: Flight Booking Web App

A modern, multi-step flight booking application built with Next.js App Router, featuring real-time seat selection and a robust PostgreSQL database with Supabase.

## Features

- Flight search by origin, destination, date, and passenger count
- Visual seat map with real-time availability via Supabase Realtime
- Multi-step booking flow: search → seat selection → passenger details → confirmation with PNR
- My Bookings page: view all bookings with status badges (confirmed / rescheduled / cancelled)
- Reschedule: pick an alternative flight on the same route via atomic RPC, automatically charging the price difference
- Cancel: inline confirmation dialog natively in the UI, blocked within 2 hours of departure enforced at the database level
- Authentication: email/password sign-up and login securely managed by Supabase Auth

## Tech Stack

| Category | Technology |
|---|---|
| **Frontend & API** | Next.js 16 (App Router), React 19, TypeScript |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth, Realtime) |
| **State Management** | Zustand 5 (with persist middleware) |
| **Styling** | Tailwind CSS v4 |
| **Error Monitoring** | Sentry |

## Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/hm05/flightly.git
cd flightly
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory by copying the `.env.example` template:
```bash
cp .env.example .env.local
```

Fill in the required keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_PASSWORD=your_db_password
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### 3. Supabase Project Configuration
In your Supabase dashboard, ensure the following are configured:
- **Authentication**: Enable Email/Password authentication.
- **Realtime**: Enable Realtime broadcasts on the `seats` table so seat maps update instantly when someone else books a seat.

### 4. Database Migrations
Open the Supabase SQL Editor and run the following migration scripts from the `/supabase/migrations/` folder in this exact order:
1. `001_schema.sql` (Creates tables: flights, seats, bookings, passengers, reschedules)  
   *> **Note:** If the Supabase SQL Editor displays a "Potential issue detected" warning regarding Row Level Security, select **"Run without RLS"**. RLS is explicitly handled in the subsequent migration.*
2. `002_rls.sql` (Enables Row Level Security ensuring users only access their own data)
3. `003_functions.sql` (Creates RPCs: `reserve_seat`, `cancel_booking`, `reschedule_booking`)
4. `004_seed.sql` (Populates 8 flights across 4 routes and generates seats)

*(If you ever need to reset the database, run `000_reset.sql` first, then re-run 001 through 004).*

### 5. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to view the application.

## Zustand Store Structure

The app's client-side state is handled by Zustand across two main stores:

### `useFlightStore` (`lib/stores/flightStore.ts`)
Manages the multi-step booking flow.
- **State**: `searchQuery`, `selectedFlight`, `selectedSeat`, `currentStep`, `passengerForm`, `confirmedBookingId`, `confirmedPnr`
- **Persistence**: Using Zustand's persist middleware with `partialize`, **only** `searchQuery` and `currentStep` are saved to `localStorage`. 
  - *Security & Privacy Note*: `passengerForm` (which contains sensitive data like `passport_no`), `selectedFlight`, `selectedSeat`, `confirmedBookingId`, and `confirmedPnr` are intentionally excluded from persistence to prevent storing sensitive travel documents in local browser storage.
- **Key Actions**: `setSelectedSeat` (optimistic UI update — marks seat selected before Supabase write confirms), `clearSeatSelection` (rollback on `SEAT_TAKEN` error), and `resetBooking` (called on confirmation and user logout).

### `useUserStore` (`lib/stores/userStore.ts`)
Manages user sessions and local caching for bookings.
- **State**: `sessionToken`, `cachedBookings`
- **Persistence**: Using persist middleware with `partialize`, **only** `sessionToken` is saved to `localStorage`. `cachedBookings` are always freshly fetched from Supabase on mount.
- **Key Actions**: `setCachedBookings`, `addCachedBooking`, `updateBookingStatus`, and `clearUser`.

## Test Account

Since the database seed (`004_seed.sql`) only populates flights and seats, you must manually create a test user via the Supabase Auth dashboard or sign up via the app UI.

- **Email**: test@flightly.com
- **Password**: Test@123

## Live Demo

Live URL - [https://flightly-hm05.vercel.app](https://flightly-hm05.vercel.app)
