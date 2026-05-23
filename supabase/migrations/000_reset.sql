-- =============================================================
-- RESET SCRIPT
-- Run this ONCE in the Supabase SQL Editor to wipe and rebuild
-- the database from the canonical migration files (001→004).
--
-- DO NOT run this on a live production database with real users.
-- =============================================================

-- Step 1: Drop everything in the public schema
-- cascade handles all dependent objects (functions, policies, indexes)
drop schema public cascade;
create schema public;

-- Step 2: Restore standard Supabase schema privileges
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
