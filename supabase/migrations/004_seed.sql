-- =============================================================
-- Migration 004: Seed Data
-- Populates the database with realistic demo flights and a full
-- seat map for each flight.
--
-- Routes:  BOM→DEL | DEL→BLR | BLR→HYD | HYD→BOM
-- Flights: 2 per route = 8 total, spread across next 7 days.
-- Seats:   30 per flight
--   • First class  : rows 1–2,  columns A-B  → 4 seats  (extra_fee = 3000)
--   • Business     : rows 3–6,  columns A-B  → 8 seats  (extra_fee = 1500)
--   • Economy      : rows 7–15, columns A-C  → 27 seats (extra_fee = 0)
--
-- All timestamps use NOW() + interval offsets so the data stays
-- "in the future" relative to whenever this migration is applied.
-- =============================================================

-- We use a temporary staging table to hold the flight UUIDs so the
-- seat-insertion block can reference them cleanly.

do $$
declare
  -- ── Flight UUID variables ──────────────────────────────────────────────
  -- BOM → DEL
  flt_bom_del_1  uuid;
  flt_bom_del_2  uuid;
  -- DEL → BLR
  flt_del_blr_1  uuid;
  flt_del_blr_2  uuid;
  -- BLR → HYD
  flt_blr_hyd_1  uuid;
  flt_blr_hyd_2  uuid;
  -- HYD → BOM
  flt_hyd_bom_1  uuid;
  flt_hyd_bom_2  uuid;

  -- ── Loop helpers ───────────────────────────────────────────────────────
  v_flight_id    uuid;
  v_row          int;
  v_col          text;
  v_seat_no      text;
  v_class        text;
  v_extra_fee    numeric;
  v_flight_ids   uuid[];
  i              int;

begin
  -- ==========================================================
  -- SECTION 1: Insert flights
  -- Departure times are realistic domestic India flight slots.
  -- Flight duration: BOM↔DEL ~2h10m, DEL↔BLR ~2h45m,
  --                 BLR↔HYD ~1h05m, HYD↔BOM ~1h40m
  -- ==========================================================

  -- ── BOM → DEL ─────────────────────────────────────────────
  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL101', 'BOM', 'DEL', now() + interval '1 day' + interval '6 hours',
          now() + interval '1 day' + interval '8 hours 10 minutes', 'Airbus A320', 4500)
  returning id into flt_bom_del_1;

  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL102', 'BOM', 'DEL', now() + interval '3 days' + interval '14 hours',
          now() + interval '3 days' + interval '16 hours 10 minutes', 'Boeing 737', 4800)
  returning id into flt_bom_del_2;

  -- ── DEL → BLR ─────────────────────────────────────────────
  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL201', 'DEL', 'BLR', now() + interval '1 day' + interval '9 hours',
          now() + interval '1 day' + interval '11 hours 45 minutes', 'Airbus A321', 5200)
  returning id into flt_del_blr_1;

  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL202', 'DEL', 'BLR', now() + interval '4 days' + interval '18 hours 30 minutes',
          now() + interval '4 days' + interval '21 hours 15 minutes', 'Boeing 737', 5500)
  returning id into flt_del_blr_2;

  -- ── BLR → HYD ─────────────────────────────────────────────
  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL301', 'BLR', 'HYD', now() + interval '2 days' + interval '7 hours',
          now() + interval '2 days' + interval '8 hours 5 minutes', 'ATR 72', 2800)
  returning id into flt_blr_hyd_1;

  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL302', 'BLR', 'HYD', now() + interval '5 days' + interval '15 hours',
          now() + interval '5 days' + interval '16 hours 5 minutes', 'ATR 72', 3000)
  returning id into flt_blr_hyd_2;

  -- ── HYD → BOM ─────────────────────────────────────────────
  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL401', 'HYD', 'BOM', now() + interval '2 days' + interval '11 hours',
          now() + interval '2 days' + interval '12 hours 40 minutes', 'Airbus A320', 3800)
  returning id into flt_hyd_bom_1;

  insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  values ('FL402', 'HYD', 'BOM', now() + interval '6 days' + interval '8 hours 30 minutes',
          now() + interval '6 days' + interval '10 hours 10 minutes', 'Boeing 737', 4100)
  returning id into flt_hyd_bom_2;

  -- ==========================================================
  -- SECTION 2: Insert seat map for every flight
  -- 30 seats per flight:
  --   First   (extra_fee=3000): rows 1-2,  cols A,B
  --   Business(extra_fee=1500): rows 3-6,  cols A,B
  --   Economy (extra_fee=0)   : rows 7-15, cols A,B,C
  -- ==========================================================

  v_flight_ids := array[
    flt_bom_del_1, flt_bom_del_2,
    flt_del_blr_1, flt_del_blr_2,
    flt_blr_hyd_1, flt_blr_hyd_2,
    flt_hyd_bom_1, flt_hyd_bom_2
  ];

  -- Iterate over each flight
  foreach v_flight_id in array v_flight_ids loop

    -- ── First class: rows 1-2, columns A & B ──────────────
    for v_row in 1..2 loop
      foreach v_col in array['A','B'] loop
        v_seat_no   := v_row::text || v_col;
        v_class     := 'first';
        v_extra_fee := 3000;

        insert into public.seats (flight_id, seat_number, class, extra_fee)
        values (v_flight_id, v_seat_no, v_class, v_extra_fee);
      end loop;
    end loop;

    -- ── Business class: rows 3-6, columns A & B ───────────
    for v_row in 3..6 loop
      foreach v_col in array['A','B'] loop
        v_seat_no   := v_row::text || v_col;
        v_class     := 'business';
        v_extra_fee := 1500;

        insert into public.seats (flight_id, seat_number, class, extra_fee)
        values (v_flight_id, v_seat_no, v_class, v_extra_fee);
      end loop;
    end loop;

    -- ── Economy class: rows 7-15, columns A, B & C ────────
    -- 9 rows × 3 cols = 27 seats
    -- (Note: spec requested 18 economy seats / 30 total; the accurate layout
    --  for 4+8+18 = 30 is rows 7-12 col A-C = 18. Rows 7-12 used below.)
    for v_row in 7..12 loop
      foreach v_col in array['A','B','C'] loop
        v_seat_no   := v_row::text || v_col;
        v_class     := 'economy';
        v_extra_fee := 0;

        insert into public.seats (flight_id, seat_number, class, extra_fee)
        values (v_flight_id, v_seat_no, v_class, v_extra_fee);
      end loop;
    end loop;

  end loop; -- end foreach flight

end;
$$;
