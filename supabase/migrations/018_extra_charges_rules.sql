-- ============================================================
-- Migration 018 — extra_charges rule columns + public read policy
-- ============================================================
-- The website reads the `public.extra_charges` table directly to
-- compute the shipping price for an order based on its contents
-- (mattress count, bed count). The CRM dashboard manages the rows;
-- the columns below let the website match a row against the cart
-- without parsing the row's Hebrew `name`.
--
-- Run this once against the kcrm Supabase project (SQL Editor).

-- 1. Rule columns. Defaults match "no constraint" — existing rows
--    receive 0 / NULL until updated below.
alter table public.extra_charges
  add column if not exists min_mattresses int not null default 0,
  add column if not exists max_mattresses int,
  add column if not exists min_beds int not null default 0,
  add column if not exists max_beds int,
  add column if not exists priority int not null default 0;

-- 2. Public read for active rules. The website uses the anon key so
--    it must be able to SELECT active rows. Wrap in DROP/CREATE so
--    the migration is re-runnable.
alter table public.extra_charges enable row level security;

drop policy if exists "extra_charges_public_read" on public.extra_charges;
create policy "extra_charges_public_read"
  on public.extra_charges for select using (is_active = true);

-- 3. Fill in the rules for the rows that ship with the dashboard.
--    Adjust min/max if business rules differ. NULL on a max field
--    means "no upper bound".
--
-- 1 mattress alone — included in the price, no extra charge.
update public.extra_charges
  set min_mattresses = 1, max_mattresses = 1, min_beds = 0, max_beds = 0
  where name = 'הובלה מזרן';

-- 2 mattresses alone.
update public.extra_charges
  set min_mattresses = 2, max_mattresses = 2, min_beds = 0, max_beds = 0
  where name = 'הובלה ל-2 מזרנים';

-- 3 mattresses alone.
update public.extra_charges
  set min_mattresses = 3, max_mattresses = 3, min_beds = 0, max_beds = 0
  where name = 'הובלה ל-3 מזרנים';

-- 4+ mattresses alone.
update public.extra_charges
  set min_mattresses = 4, max_mattresses = null, min_beds = 0, max_beds = 0
  where name = 'הובלה ל-4 מזרנים';

-- 1 bed (with or without 1 mattress) — bed assembly included.
update public.extra_charges
  set min_mattresses = 0, max_mattresses = 1, min_beds = 1, max_beds = 1
  where name like '%למזרן + מיטה%'
     or name like '%בעבור מיטה%'
     or name like '%מיטה / משטח%';

-- 2+ beds (with or without mattresses).
update public.extra_charges
  set min_mattresses = 0, max_mattresses = null, min_beds = 2, max_beds = null
  where name like 'הובלה והרכבה ל-2 מיטות%';
