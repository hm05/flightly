-- =============================================================
-- Migration 001: Core Schema
-- Creates the five tables that power the Flightly booking engine.
-- All PKs use UUIDs generated server-side via gen_random_uuid().
-- =============================================================

-- Enable the pgcrypto extension so gen_random_uuid() is available
-- (already enabled on Supabase by default, but declared here for clarity)
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Table: flights
-- One row per flight leg sold on the platform.
-- -------------------------------------------------------------
create table if not exists public.flights (
  id            uuid        primary key default gen_random_uuid(),
  flight_no     text        not null,                        -- e.g. "FL101"
  origin        text        not null,                        -- IATA code, e.g. "BOM"
  destination   text        not null,                        -- IATA code, e.g. "DEL"
  departs_at    timestamptz not null,
  arrives_at    timestamptz not null,
  aircraft_type text        not null,                        -- e.g. "Airbus A320"
  status        text        not null default 'scheduled',    -- scheduled | boarding | departed | landed | cancelled
  base_price    numeric     not null check (base_price >= 0)
);

comment on table public.flights is 'Master list of flights available for booking.';

-- -------------------------------------------------------------
-- Table: seats
-- One row per physical seat on a specific flight.
-- A seat's total price = flights.base_price + seats.extra_fee.
-- -------------------------------------------------------------
create table if not exists public.seats (
  id            uuid        primary key default gen_random_uuid(),
  flight_id     uuid        not null references public.flights (id) on delete cascade,
  seat_number   text        not null,                        -- e.g. "1A", "14C"
  class         text        not null check (class in ('economy', 'business', 'first')),
  is_available  boolean     not null default true,
  extra_fee     numeric     not null default 0 check (extra_fee >= 0),

  unique (flight_id, seat_number)                           -- no duplicate seats per flight
);

comment on table public.seats is 'Seat inventory for every flight, keyed by flight_id.';

-- -------------------------------------------------------------
-- Table: bookings
-- One row per confirmed (or cancelled) ticket purchase.
-- pnr_code is the human-readable 8-char booking reference.
-- -------------------------------------------------------------
create table if not exists public.bookings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete restrict,
  flight_id   uuid        not null references public.flights (id) on delete restrict,
  seat_id     uuid        not null references public.seats (id) on delete restrict,
  status      text        not null default 'confirmed',      -- confirmed | cancelled
  booked_at   timestamptz not null default now(),
  total_price numeric     not null check (total_price >= 0),
  pnr_code    text        not null unique                    -- e.g. "ABCD1234"
);

comment on table public.bookings is 'Ticket purchases linking a user, flight, and seat.';

-- Index for the most common lookup: all bookings by a specific user
create index if not exists bookings_user_id_idx on public.bookings (user_id);

-- -------------------------------------------------------------
-- Table: passengers
-- Passenger travel details attached to a booking.
-- A booking can have exactly one passenger in this schema
-- (extend to a 1-to-many if you add multi-passenger bookings).
-- -------------------------------------------------------------
create table if not exists public.passengers (
  id           uuid    primary key default gen_random_uuid(),
  booking_id   uuid    not null references public.bookings (id) on delete cascade,
  full_name    text    not null,
  passport_no  text    not null,
  nationality  text    not null,
  dob          date    not null,

  -- One passenger record per booking. Enforced at the DB level so no amount
  -- of concurrent inserts can create a second passenger for the same booking.
  unique (booking_id)
);

comment on table public.passengers is 'Travel document details for each booking.';

create index if not exists passengers_booking_id_idx on public.passengers (booking_id);

-- -------------------------------------------------------------
-- Table: reschedules
-- Audit trail whenever a passenger moves to a different flight.
-- fee_charged captures the reschedule penalty at the time of request.
-- -------------------------------------------------------------
create table if not exists public.reschedules (
  id             uuid        primary key default gen_random_uuid(),
  booking_id     uuid        not null references public.bookings (id) on delete cascade,
  old_flight_id  uuid        not null references public.flights (id) on delete restrict,
  new_flight_id  uuid        not null references public.flights (id) on delete restrict,
  requested_at   timestamptz not null default now(),
  fee_charged    numeric     not null default 0 check (fee_charged >= 0)
);

comment on table public.reschedules is 'History of flight reschedule requests and associated fees.';

create index if not exists reschedules_booking_id_idx on public.reschedules (booking_id);
