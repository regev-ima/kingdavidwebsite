-- ============================================================
-- KING DAVID CLUB signups — storefront-facing table + RPC.
--
-- The website is anon-only, so it cannot insert directly into CRM
-- tables. We expose a single SECURITY DEFINER function,
-- website_create_club_signup(signup_data jsonb), that validates the
-- payload and inserts a new row into public.club_signups.
--
-- Mirror this migration in the kcrm (CRM) repo so both environments
-- share the exact same schema. See the root README for the cross-repo
-- prompt used when asking the CRM assistant to mirror this change.
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.club_signups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    text NOT NULL,
  phone        text NOT NULL,
  email        text NOT NULL,
  city         text,
  notes        text,
  source       text NOT NULL DEFAULT 'website',
  status       text NOT NULL DEFAULT 'new',     -- new | contacted | member | unsubscribed
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS club_signups_created_at_idx
  ON public.club_signups (created_at DESC);

CREATE INDEX IF NOT EXISTS club_signups_email_idx
  ON public.club_signups (lower(email));

CREATE INDEX IF NOT EXISTS club_signups_phone_idx
  ON public.club_signups (phone);

-- Lock the table down — only the RPC can write from the anon key.
ALTER TABLE public.club_signups ENABLE ROW LEVEL SECURITY;

-- No public policies: all anon access is mediated by the RPC below.

DROP FUNCTION IF EXISTS public.website_create_club_signup(jsonb);

CREATE OR REPLACE FUNCTION public.website_create_club_signup(signup_data jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name text := trim(coalesce(signup_data->>'full_name', ''));
  v_phone     text := trim(coalesce(signup_data->>'phone', ''));
  v_email     text := lower(trim(coalesce(signup_data->>'email', '')));
  v_city      text := nullif(trim(coalesce(signup_data->>'city', '')), '');
  v_notes     text := nullif(trim(coalesce(signup_data->>'notes', '')), '');
  v_source    text := nullif(trim(coalesce(signup_data->>'source', '')), '');
  v_id        uuid;
BEGIN
  IF length(v_full_name) < 2 THEN
    RAISE EXCEPTION 'full_name is required';
  END IF;
  IF v_phone !~ '^05\d-?\d{7}$' THEN
    RAISE EXCEPTION 'phone is invalid';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'email is invalid';
  END IF;

  INSERT INTO public.club_signups (full_name, phone, email, city, notes, source)
  VALUES (v_full_name, v_phone, v_email, v_city, v_notes, coalesce(v_source, 'website'))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.website_create_club_signup(jsonb) TO anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
