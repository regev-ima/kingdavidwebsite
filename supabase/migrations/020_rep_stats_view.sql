-- ============================================================
-- rep_stats — one row per rep with total/active/closed_won/closed_lost
-- lead counts plus their last sign-in time from auth.users.
--
-- Buckets:
--   closed_won   = status starts with "נסגרה עסקה" OR equals "deal_closed"
--   closed_lost  = status starts with "לא רלוונטי" OR matches a small
--                  hard-coded list of dead-end statuses
--   active       = everything else (including new, follow-ups, no-answer)
--
-- Used by the rep management page in the CRM.
-- ============================================================
CREATE OR REPLACE VIEW public.rep_stats AS
WITH lead_buckets AS (
  SELECT
    rep1 AS email,
    count(*) AS total_leads,
    count(*) FILTER (
      WHERE status LIKE 'נסגרה עסקה%' OR status = 'deal_closed'
    ) AS closed_won,
    count(*) FILTER (
      WHERE status LIKE 'לא רלוונטי%'
         OR status IN (
           'שמע מחיר ולא מעונין לשמוע עוד',
           'לא מעונין לדבר - מנתק',
           'נסגר ע''י מנהל - הועבר לדיוור',
           'דיוור חוזר - ביקש להסיר'
         )
    ) AS closed_lost
  FROM public.leads
  WHERE rep1 IS NOT NULL AND rep1 <> ''
  GROUP BY rep1
)
SELECT
  lb.email,
  u.last_sign_in_at,
  u.created_at        AS user_created_at,
  lb.total_leads,
  lb.total_leads - lb.closed_won - lb.closed_lost AS active_leads,
  lb.closed_won,
  lb.closed_lost
FROM lead_buckets lb
LEFT JOIN auth.users u ON lower(u.email) = lower(lb.email)
ORDER BY lb.total_leads DESC;

GRANT SELECT ON public.rep_stats TO anon, authenticated;
