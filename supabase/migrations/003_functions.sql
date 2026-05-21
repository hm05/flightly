-- =============================================================
-- Migration 003: Database Functions / RPCs
-- Callable by the client via supabase.rpc('function_name', {...}).
-- Both functions run inside an implicit transaction managed by
-- PostgreSQL, so any uncaught exception rolls the whole unit back.
-- SECURITY DEFINER lets the function bypass RLS for internal
-- mutations while still enforcing business logic in code.
-- =============================================================

-- =============================================================
-- RPC 1: reserve_seat
-- Atomically books a seat for a user.
--
-- Security notes:
--   • p_user_id was REMOVED: accepting a user UUID from the client is
--     unsafe because SECURITY DEFINER bypasses RLS. A malicious caller
--     could supply another user's UUID and book under their account.
--     Identity is now sourced exclusively from auth.uid().
--   • p_total_price was REMOVED: accepting a price from the client
--     allows trivial price manipulation (e.g. passing 0.01). Price is
--     now computed server-side from flights.base_price + seats.extra_fee.
--
-- Steps:
--   0. Reject unauthenticated callers.
--   1. Lock the target seat row (FOR UPDATE) to prevent double-booking.
--   2. Raise 'SEAT_TAKEN' if it is already unavailable.
--   3. Calculate the authoritative total price from the database.
--   4. Generate an 8-char uppercase PNR code.
--   5. Validate and extract passenger JSONB fields.
--   6. Insert into bookings (using auth.uid() and the DB-derived price).
--   7. Insert into passengers.
--   8. Mark the seat as unavailable.
--   9. Return the new booking UUID.
-- =============================================================
create or replace function public.reserve_seat(
  p_flight_id   uuid,
  p_seat_id     uuid,
  -- p_user_id was removed: identity MUST come from auth.uid() so a client
  -- cannot impersonate another user through the SECURITY DEFINER boundary.
  -- p_total_price was removed: price MUST be computed server-side from the
  -- DB to prevent clients from submitting an arbitrary (e.g. zero) amount.
  p_passenger   jsonb    -- { full_name, passport_no, nationality, dob }
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_available  boolean;
  v_pnr_code      text;
  v_booking_id    uuid;
  v_total_price   numeric;  -- computed from DB, never trusted from client
  -- Typed locals for passenger fields — populated after validation.
  v_full_name     text;
  v_passport_no   text;
  v_nationality   text;
  v_dob           date;
begin
  -- Step 0: Reject calls that have no authenticated session.
  -- auth.uid() returns NULL when the JWT is absent or invalid.
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED'
      using hint = 'You must be signed in to reserve a seat.';
  end if;

  -- Step 1 & 2: Lock the seat row and verify availability atomically.
  -- FOR UPDATE ensures no concurrent transaction can read-and-book the same seat
  -- between our check and our UPDATE below (prevents TOCTOU race conditions).
  select is_available
  into   v_is_available
  from   public.seats
  where  id        = p_seat_id
    and  flight_id = p_flight_id
  for update;                             -- acquires a row-level lock

  if not found then
    raise exception 'SEAT_NOT_FOUND'
      using hint = 'The seat does not exist for this flight.';
  end if;

  if not v_is_available then
    raise exception 'SEAT_TAKEN'
      using hint = 'Another passenger has already booked this seat.';
  end if;

  -- Step 3: Calculate the authoritative total price from the database.
  -- This is the only source of truth — the client has no say in what is charged.
  select f.base_price + s.extra_fee
  into   v_total_price
  from   public.flights f, public.seats s
  where  f.id = p_flight_id
    and  s.id = p_seat_id;

  -- Step 4: Generate a unique 8-character uppercase PNR code.
  -- We loop until we find one that doesn't already exist (astronomically rare
  -- but good practice for a unique constraint).
  loop
    -- Pick 6 random bytes → base64 → strip non-alphanumeric → first 8 chars → uppercase
    v_pnr_code := upper(
                    substring(
                      replace(replace(encode(gen_random_bytes(6), 'base64'), '+', ''), '/', ''),
                      1, 8
                    )
                  );

    exit when not exists (
      select 1 from public.bookings where pnr_code = v_pnr_code
    );
  end loop;

  -- Step 5: Validate and extract the passenger JSONB fields.
  -- Raise INVALID_PASSENGER_DATA for any missing or malformed value so the
  -- caller receives a descriptive error instead of a cryptic cast exception.
  v_full_name   := nullif(trim(p_passenger->>'full_name'),   '');
  v_passport_no := nullif(trim(p_passenger->>'passport_no'), '');
  v_nationality := nullif(trim(p_passenger->>'nationality'), '');

  if v_full_name is null then
    raise exception 'INVALID_PASSENGER_DATA'
      using hint = 'full_name is required and must not be blank.';
  end if;

  if v_passport_no is null then
    raise exception 'INVALID_PASSENGER_DATA'
      using hint = 'passport_no is required and must not be blank.';
  end if;

  if v_nationality is null then
    raise exception 'INVALID_PASSENGER_DATA'
      using hint = 'nationality is required and must not be blank.';
  end if;

  -- Safe date cast: wrap in its own sub-block so a bad format produces our
  -- custom error code rather than Postgres'' internal "invalid input syntax" message.
  begin
    v_dob := (p_passenger->>'dob')::date;
  exception
    when others then
      raise exception 'INVALID_PASSENGER_DATA'
        using hint = 'dob must be a valid date in YYYY-MM-DD format (e.g. "1990-06-15").';
  end;

  if v_dob is null then
    raise exception 'INVALID_PASSENGER_DATA'
      using hint = 'dob is required.';
  end if;

  -- Step 6: Create the booking record.
  -- auth.uid() provides the user identity — never a client-supplied value.
  -- v_total_price was calculated from the DB in step 3 — never client-supplied.
  insert into public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  values (auth.uid(), p_flight_id, p_seat_id, v_total_price, v_pnr_code)
  returning id into v_booking_id;

  -- Step 7: Store passenger travel details using the pre-validated local variables.
  insert into public.passengers (booking_id, full_name, passport_no, nationality, dob)
  values (
    v_booking_id,
    v_full_name,
    v_passport_no,
    v_nationality,
    v_dob
  );

  -- Step 8: Mark the seat as taken so no other user can book it.
  update public.seats
  set    is_available = false
  where  id = p_seat_id;

  -- Step 9: Return the new booking ID to the caller.
  return v_booking_id;
end;
$$;

comment on function public.reserve_seat is
  'Atomically reserves a seat: identity sourced from auth.uid(), price computed from DB. Checks availability with a row lock, creates booking + passenger records, marks the seat unavailable. Returns the new booking UUID.';


-- =============================================================
-- RPC 2: cancel_booking
-- Cancels a confirmed booking if the cutoff window has not passed.
--
-- Security note:
--   • p_user_id was REMOVED: even though the WHERE clause checked ownership,
--     a client under SECURITY DEFINER can attempt to pass any UUID. Using
--     auth.uid() closes this surface entirely — ownership is verified
--     against the authenticated session, not a client-supplied value.
--
-- Steps:
--   0. Reject unauthenticated callers.
--   1. Verify the booking belongs to the calling user (auth.uid()).
--   2. Fetch the associated flight's departure time.
--   3. If fewer than 2 hours remain before departure, raise 'TOO_LATE_TO_CANCEL'.
--   4. Set booking status to 'cancelled'.
--   5. Release the seat so it can be rebooked by someone else.
-- =============================================================
create or replace function public.cancel_booking(
  p_booking_id  uuid
  -- p_user_id was removed: ownership MUST be verified against auth.uid() so
  -- a client cannot cancel bookings belonging to other users through the
  -- SECURITY DEFINER boundary.
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seat_id     uuid;
  v_departs_at  timestamptz;
begin
  -- Step 0: Reject calls that have no authenticated session.
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED'
      using hint = 'You must be signed in to cancel a booking.';
  end if;

  -- Step 1 & 2: Confirm ownership and retrieve departure time in one query.
  -- auth.uid() is the sole source of the user identity check — never a
  -- client-supplied parameter.
  -- We join seats here so we can release it in step 5 without a second round-trip.
  select s.id, f.departs_at
  into   v_seat_id, v_departs_at
  from   public.bookings b
  join   public.flights  f on f.id = b.flight_id
  join   public.seats    s on s.id = b.seat_id
  where  b.id      = p_booking_id
    and  b.user_id = auth.uid()           -- ownership verified against the JWT
    and  b.status  = 'confirmed';         -- cannot cancel an already-cancelled booking

  if not found then
    raise exception 'BOOKING_NOT_FOUND'
      using hint = 'Booking does not exist, does not belong to this user, or is already cancelled.';
  end if;

  -- Step 3: Enforce the 2-hour pre-departure cutoff.
  if now() > v_departs_at - interval '2 hours' then
    raise exception 'TOO_LATE_TO_CANCEL'
      using hint = 'Cancellations must be made at least 2 hours before departure.';
  end if;

  -- Step 4: Mark the booking as cancelled.
  update public.bookings
  set    status = 'cancelled'
  where  id = p_booking_id;

  -- Step 5: Release the seat back into available inventory.
  update public.seats
  set    is_available = true
  where  id = v_seat_id;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a confirmed booking if called at least 2 hours before departure. Ownership verified via auth.uid() — no client-supplied user ID accepted. Releases the seat back to available inventory.';
