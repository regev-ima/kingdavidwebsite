-- ============================================================
-- Website leads — storefront-facing table + RPC.
--
-- Every "contact us" / "call me back" form on the website (anything
-- that is NOT the club-signup or a product order) lands here, tagged
-- with source='website' so the CRM can route them as real leads.
--
-- As with the other storefront tables, the website is anon-only and
-- cannot insert directly — it calls a single SECURITY DEFINER
-- function, website_create_lead(lead_data jsonb).
--
-- Mirror this migration in the kcrm (CRM) repo so both environments
-- share the exact same schema.
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL,
  phone           text NOT NULL,
  email           text,
  subject         text,
  message         text,
  source          text NOT NULL DEFAULT 'website',
  source_form     text,     -- e.g. 'contact_page', 'quick_callback', etc.
  tags            text[] NOT NULL DEFAULT ARRAY['אתר']::text[],
  status          text NOT NULL DEFAULT 'new',    -- new | in_progress | converted | closed | spam
  assigned_to     uuid,                            -- CRM user id (optional)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx  ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_phone_idx       ON public.leads (phone);
CREATE INDEX IF NOT EXISTS leads_email_idx       ON public.leads (lower(email));
CREATE INDEX IF NOT EXISTS leads_status_idx      ON public.leads (status);
CREATE INDEX IF NOT EXISTS leads_source_form_idx ON public.leads (source_form);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- No public policies: all anon access is mediated by the RPC below.

DROP FUNCTION IF EXISTS public.website_create_lead(jsonb);

CREATE OR REPLACE FUNCTION public.website_create_lead(lead_data jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name   text   := trim(coalesce(lead_data->>'full_name', ''));
  v_phone       text   := trim(coalesce(lead_data->>'phone', ''));
  v_email       text   := nullif(lower(trim(coalesce(lead_data->>'email', ''))), '');
  v_subject     text   := nullif(trim(coalesce(lead_data->>'subject', '')), '');
  v_message     text   := nullif(trim(coalesce(lead_data->>'message', '')), '');
  v_source      text   := nullif(trim(coalesce(lead_data->>'source', '')), '');
  v_source_form text   := nullif(trim(coalesce(lead_data->>'source_form', '')), '');
  v_tags        text[];
  v_id          uuid;
BEGIN
  IF length(v_full_name) < 2 THEN
    RAISE EXCEPTION 'full_name is required';
  END IF;
  IF v_phone !~ '^05\d-?\d{7}$' AND v_phone !~ '^0\d{1,2}-?\d{6,7}$' THEN
    RAISE EXCEPTION 'phone is invalid';
  END IF;
  IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'email is invalid';
  END IF;

  -- tags: accept jsonb array; default to ['אתר'] and always ensure 'אתר' is present.
  IF jsonb_typeof(lead_data->'tags') = 'array' THEN
    SELECT array_agg(value::text) INTO v_tags
    FROM jsonb_array_elements_text(lead_data->'tags');
  END IF;
  v_tags := coalesce(v_tags, ARRAY[]::text[]);
  IF NOT ('אתר' = ANY(v_tags)) THEN
    v_tags := array_append(v_tags, 'אתר');
  END IF;

  INSERT INTO public.leads (
    full_name, phone, email, subject, message, source, source_form, tags
  )
  VALUES (
    v_full_name, v_phone, v_email, v_subject, v_message,
    coalesce(v_source, 'website'),
    v_source_form,
    v_tags
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.website_create_lead(jsonb) TO anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
