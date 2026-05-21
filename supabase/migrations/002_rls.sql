-- =============================================================
-- Migration 002: Row Level Security (RLS)
-- Enforces per-user data isolation. All policies are additive;
-- Supabase denies by default once RLS is enabled on a table.
-- =============================================================

-- -------------------------------------------------------------
-- flights — public read, no write from clients
-- -------------------------------------------------------------
alter table public.flights enable row level security;

create policy "flights: anyone can read"
  on public.flights
  for select
  using (true);

-- -------------------------------------------------------------
-- seats — public read, no write from clients
-- (availability is mutated only via the reserve_seat() RPC)
-- -------------------------------------------------------------
alter table public.seats enable row level security;

create policy "seats: anyone can read"
  on public.seats
  for select
  using (true);

-- -------------------------------------------------------------
-- bookings — users can only see and manage their own bookings
-- INSERT/UPDATE are also locked to the authenticated user so a
-- user cannot create bookings on behalf of another user.
-- -------------------------------------------------------------
alter table public.bookings enable row level security;

create policy "bookings: owner can select"
  on public.bookings
  for select
  using (user_id = auth.uid());

create policy "bookings: owner can insert"
  on public.bookings
  for insert
  with check (user_id = auth.uid());

create policy "bookings: owner can update"
  on public.bookings
  for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -------------------------------------------------------------
-- passengers — accessible only through a booking the user owns.
-- We use a sub-select to validate booking ownership rather than
-- a join so the policy stays compatible with all Supabase auth flows.
-- -------------------------------------------------------------
alter table public.passengers enable row level security;

create policy "passengers: owner can select"
  on public.passengers
  for select
  using (
    booking_id in (
      select id from public.bookings where user_id = auth.uid()
    )
  );

create policy "passengers: owner can insert"
  on public.passengers
  for insert
  with check (
    booking_id in (
      select id from public.bookings where user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- reschedules — accessible only through a booking the user owns.
-- -------------------------------------------------------------
alter table public.reschedules enable row level security;

create policy "reschedules: owner can select"
  on public.reschedules
  for select
  using (
    booking_id in (
      select id from public.bookings where user_id = auth.uid()
    )
  );

create policy "reschedules: owner can insert"
  on public.reschedules
  for insert
  with check (
    booking_id in (
      select id from public.bookings where user_id = auth.uid()
    )
  );
