-- ============================================================
-- Backfill products.image_url + products.images from the assets we
-- uploaded to Supabase Storage bucket `product-images/<slug>/<n>.ext`.
--
-- 35 of 37 Drive folders matched against the CRM product list.
-- Unmatched (handle manually if needed):
--   * "מזרן דגם אימפריאל - Impreal"  (no "אימפריאל" in CRM)
--   * "עלית ויסקו"                  (no "עלית ויסקו" in CRM)
--
-- BEFORE RUNNING: replace YOUR_PROJECT_REF with the kcrm Supabase
-- project reference (e.g. abcd1234efgh). You can find it in
-- Supabase Dashboard → Project Settings → General → Reference ID.
-- ============================================================
DO $$
DECLARE
  base text := 'https://njfrqbzkwwalwpzzxecy.supabase.co/storage/v1/object/public/product-images';
BEGIN

UPDATE public.products SET
  image_url = base || '/Carbon-Pro-X7/1.jpg',
  images    = ARRAY[base||'/Carbon-Pro-X7/1.jpg', base||'/Carbon-Pro-X7/2.jpg']
WHERE name LIKE 'Carbon Pro X7%';

UPDATE public.products SET
  image_url = base || '/3M-COMFORT/1.jpg',
  images    = ARRAY[base||'/3M-COMFORT/1.jpg', base||'/3M-COMFORT/2.jpg', base||'/3M-COMFORT/3.jpg']
WHERE name LIKE '3M קומפורט%';

UPDATE public.products SET
  image_url = base || '/Ultimate/1.jpg',
  images    = ARRAY[base||'/Ultimate/1.jpg', base||'/Ultimate/2.jpg', base||'/Ultimate/3.jpg']
WHERE name LIKE 'אולטימייט%';

UPDATE public.products SET
  image_url = base || '/Euphoria-XLV/1.jpg',
  images    = ARRAY[base||'/Euphoria-XLV/1.jpg', base||'/Euphoria-XLV/2.jpg', base||'/Euphoria-XLV/3.jpg', base||'/Euphoria-XLV/4.jpg']
WHERE name LIKE 'אופוריה%';

UPDATE public.products SET
  image_url = base || '/Orto-Teva-Filotop/1.jpg',
  images    = ARRAY[base||'/Orto-Teva-Filotop/1.jpg', base||'/Orto-Teva-Filotop/2.jpg', base||'/Orto-Teva-Filotop/3.jpg']
WHERE name LIKE 'אורטו טבע%';

UPDATE public.products SET
  image_url = base || '/Orto-Medical/1.jpg',
  images    = ARRAY[base||'/Orto-Medical/1.jpg', base||'/Orto-Medical/2.jpg', base||'/Orto-Medical/3.jpg']
WHERE name LIKE 'אורטו מדיקל%';

-- אנטומי אורטופדי לטקס (without פילוטופ)
UPDATE public.products SET
  image_url = base || '/Orthopedic-Anatomy/1.jpg',
  images    = ARRAY[base||'/Orthopedic-Anatomy/1.jpg', base||'/Orthopedic-Anatomy/2.jpg', base||'/Orthopedic-Anatomy/3.jpg']
WHERE name LIKE 'אנטומי אורטופדי לטקס (%';

-- אנטומי אורטופדי לטקס פילוטופ
UPDATE public.products SET
  image_url = base || '/Anatomy-Latex-Pilotop/1.jpg',
  images    = ARRAY[base||'/Anatomy-Latex-Pilotop/1.jpg', base||'/Anatomy-Latex-Pilotop/2.jpg', base||'/Anatomy-Latex-Pilotop/3.jpg']
WHERE name LIKE 'אנטומי אורטופדי לטקס פילוטופ%';

UPDATE public.products SET
  image_url = base || '/Impact/1.jpg',
  images    = ARRAY[base||'/Impact/1.jpg', base||'/Impact/2.jpg', base||'/Impact/3.jpg']
WHERE name LIKE 'אימפקט%';

UPDATE public.products SET
  image_url = base || '/Inter-Medic-Visco-Pilotop/1.jpg',
  images    = ARRAY[base||'/Inter-Medic-Visco-Pilotop/1.jpg', base||'/Inter-Medic-Visco-Pilotop/2.jpg', base||'/Inter-Medic-Visco-Pilotop/3.jpg']
WHERE name LIKE 'אינטר מדיק%';

UPDATE public.products SET
  image_url = base || '/Inspire/1.jpg',
  images    = ARRAY[base||'/Inspire/1.jpg', base||'/Inspire/2.jpg', base||'/Inspire/3.jpg']
WHERE name LIKE 'אינספייר%';

UPDATE public.products SET
  image_url = base || '/Elegance-Residance/1.jpg',
  images    = ARRAY[base||'/Elegance-Residance/1.jpg', base||'/Elegance-Residance/2.jpg', base||'/Elegance-Residance/3.jpg']
WHERE name LIKE 'אלגנס רזידנס%';

-- אלסטיק מדיק בד אלוורה (without פילוטופ)
UPDATE public.products SET
  image_url = base || '/Elastic-Medic/1.jpg',
  images    = ARRAY[base||'/Elastic-Medic/1.jpg', base||'/Elastic-Medic/2.jpg', base||'/Elastic-Medic/3.jpg']
WHERE name LIKE 'אלסטיק מדיק בד%';

-- אלסטיק מדיק פילו' בד אלוורה
UPDATE public.products SET
  image_url = base || '/Elastic-Medic-Filotop/1.jpg',
  images    = ARRAY[base||'/Elastic-Medic-Filotop/1.jpg', base||'/Elastic-Medic-Filotop/2.jpg', base||'/Elastic-Medic-Filotop/3.jpg']
WHERE name LIKE 'אלסטיק מדיק פילו%';

-- אנרג'י (without פילוטופ)
UPDATE public.products SET
  image_url = base || '/_-Energy/1.jpg',
  images    = ARRAY[base||'/_-Energy/1.jpg', base||'/_-Energy/2.jpg', base||'/_-Energy/3.jpg']
WHERE name LIKE 'אנרג''י (%';

-- אנרג'י פילוטופ
UPDATE public.products SET
  image_url = base || '/_-Energy-Pilotop/1.jpg',
  images    = ARRAY[base||'/_-Energy-Pilotop/1.jpg', base||'/_-Energy-Pilotop/2.jpg', base||'/_-Energy-Pilotop/3.jpg']
WHERE name LIKE 'אנרג''י פילוטופ%';

UPDATE public.products SET
  image_url = base || '/Excellent-King/1.jpg',
  images    = ARRAY[base||'/Excellent-King/1.jpg', base||'/Excellent-King/2.jpg', base||'/Excellent-King/3.jpg', base||'/Excellent-King/4.jpg']
WHERE name LIKE 'אקסלנט קינג%';

UPDATE public.products SET
  image_url = base || '/Harmony/1.jpg',
  images    = ARRAY[base||'/Harmony/1.jpg', base||'/Harmony/2.jpg', base||'/Harmony/3.jpg']
WHERE name LIKE 'הרמוני%';

-- ויסקו דה לקס (without פילוטופ)
UPDATE public.products SET
  image_url = base || '/Visco-Deluxe/1.jpg',
  images    = ARRAY[base||'/Visco-Deluxe/1.jpg', base||'/Visco-Deluxe/2.jpg', base||'/Visco-Deluxe/3.jpg']
WHERE name LIKE 'ויסקו דה לקס%';

-- ויסקו דלקס פילוטופ פלוס (note: CRM uses "דלקס" without ה)
UPDATE public.products SET
  image_url = base || '/Visco-Deluxe-Filotop/1.jpg',
  images    = ARRAY[base||'/Visco-Deluxe-Filotop/1.jpg', base||'/Visco-Deluxe-Filotop/2.jpg', base||'/Visco-Deluxe-Filotop/3.jpg']
WHERE name LIKE 'ויסקו דלקס%';

UPDATE public.products SET
  image_url = base || '/Visco-Medic-Filotop/1.jpg',
  images    = ARRAY[base||'/Visco-Medic-Filotop/1.jpg', base||'/Visco-Medic-Filotop/2.jpg', base||'/Visco-Medic-Filotop/3.jpg']
WHERE name LIKE 'ויסקו מדיק%';

UPDATE public.products SET
  image_url = base || '/Cashmere-Visco/1.jpg',
  images    = ARRAY[base||'/Cashmere-Visco/1.jpg', base||'/Cashmere-Visco/2.jpg', base||'/Cashmere-Visco/3.jpg']
WHERE name LIKE 'קשמיר ויסקו%';

UPDATE public.products SET
  image_url = base || '/Triple-Balance/1.jpg',
  images    = ARRAY[base||'/Triple-Balance/1.jpg', base||'/Triple-Balance/2.jpg', base||'/Triple-Balance/3.jpg']
WHERE name LIKE 'טריפל בלאנס%';

UPDATE public.products SET
  image_url = base || '/LEDER/1.jpg',
  images    = ARRAY[base||'/LEDER/1.jpg', base||'/LEDER/2.jpg', base||'/LEDER/3.jpg', base||'/LEDER/4.jpg', base||'/LEDER/5.jpg']
WHERE name LIKE 'לידר%';

UPDATE public.products SET
  image_url = base || '/DK/1.jpg',
  images    = ARRAY[base||'/DK/1.jpg', base||'/DK/2.jpg', base||'/DK/3.jpg']
WHERE name LIKE 'נטורל ספא דאבל קדר%';

UPDATE public.products SET
  image_url = base || '/Natural-Spa-Filotop/1.jpg',
  images    = ARRAY[base||'/Natural-Spa-Filotop/1.jpg', base||'/Natural-Spa-Filotop/2.jpg', base||'/Natural-Spa-Filotop/3.jpg']
WHERE name LIKE 'נטורל ספא פילוטופ%';

UPDATE public.products SET
  image_url = base || '/Natural-Therapy/1.jpg',
  images    = ARRAY[base||'/Natural-Therapy/1.jpg', base||'/Natural-Therapy/2.jpg', base||'/Natural-Therapy/3.jpg']
WHERE name LIKE 'נטורל תראפי%';

UPDATE public.products SET
  image_url = base || '/Night-Therapy/1.jpg',
  images    = ARRAY[base||'/Night-Therapy/1.jpg', base||'/Night-Therapy/2.jpg', base||'/Night-Therapy/3.jpg']
WHERE name LIKE 'נייט תראפי%';

UPDATE public.products SET
  image_url = base || '/Silver-Pocket/1.jpg',
  images    = ARRAY[base||'/Silver-Pocket/1.jpg', base||'/Silver-Pocket/2.jpg', base||'/Silver-Pocket/3.jpg', base||'/Silver-Pocket/4.jpg']
WHERE name LIKE 'סילבר%';

UPDATE public.products SET
  image_url = base || '/Space-Pilotop/1.jpg',
  images    = ARRAY[base||'/Space-Pilotop/1.jpg', base||'/Space-Pilotop/2.jpg', base||'/Space-Pilotop/3.jpg']
WHERE name LIKE 'ספייס פילוטופ%';

UPDATE public.products SET
  image_url = base || '/Premier-Multi-Visco/1.jpg',
  images    = ARRAY[base||'/Premier-Multi-Visco/1.jpg', base||'/Premier-Multi-Visco/2.jpg', base||'/Premier-Multi-Visco/3.jpg', base||'/Premier-Multi-Visco/4.jpg']
WHERE name LIKE 'מולטי ויסקו פרימייר%';

-- Drive has only one "Perfection" folder; CRM has both ויסקו and לטקס variants.
-- Apply the same images to both — same visual product, different internals.
UPDATE public.products SET
  image_url = base || '/Perfection/1.jpg',
  images    = ARRAY[base||'/Perfection/1.jpg', base||'/Perfection/2.jpg', base||'/Perfection/3.jpg']
WHERE name LIKE 'פרפקשיין%';

UPDATE public.products SET
  image_url = base || '/K/1.jpg',
  images    = ARRAY[base||'/K/1.jpg', base||'/K/2.jpg']
WHERE name LIKE 'קוואטרו K%';

UPDATE public.products SET
  image_url = base || '/S/1.jpg',
  images    = ARRAY[base||'/S/1.jpg', base||'/S/2.jpg', base||'/S/3.jpg', base||'/S/4.jpg']
WHERE name LIKE 'קוואטרו מולטי ויסקו%S%';

-- Note CRM typo: "תארפי" not "תראפי" — match by prefix.
UPDATE public.products SET
  image_url = base || '/Relax-Therapy-Visco/1.jpg',
  images    = ARRAY[base||'/Relax-Therapy-Visco/1.jpg', base||'/Relax-Therapy-Visco/2.jpg', base||'/Relax-Therapy-Visco/3.jpg']
WHERE name LIKE 'רילקס%';

END $$;

-- Sanity check: how many products now have an image_url from product-images bucket?
-- Run this separately after the DO block to verify.
-- SELECT count(*) FROM public.products WHERE image_url LIKE '%/product-images/%';
