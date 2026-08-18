-- ============================================================
-- Backfill products.image_url + products.images for the bed
-- products imported from the legacy WordPress site.
--
-- 12 of 16 scraped folders matched the CRM products. Skipped:
--   * boxes / gallery-double / gallery-judaic (no CRM equivalent)
--   * pilotop (already handled in 018, slug "Anatomy-Latex-Pilotop")
--
-- Two ambiguous matches (best-guess by Hebrew name semantics):
--   * queens   → כרמים Q   (Q likely stands for Queens)
--   * buttons  → קלאס קפיטונאז' + בסיס רויאל (capitonage = buttons)
-- If wrong, change the LIKE pattern or comment them out.
-- ============================================================
DO $$
DECLARE
  base text := 'https://njfrqbzkwwalwpzzxecy.supabase.co/storage/v1/object/public/product-images';
BEGIN

UPDATE public.products SET
  image_url = base || '/yahalom/1.jpg',
  images    = ARRAY[base||'/yahalom/1.jpg', base||'/yahalom/2.jpg', base||'/yahalom/3.jpg']
WHERE name LIKE 'יהלום%';

UPDATE public.products SET
  image_url = base || '/armitrage/1.jpg',
  images    = ARRAY[base||'/armitrage/1.jpg', base||'/armitrage/2.jpg', base||'/armitrage/3.jpg', base||'/armitrage/4.jpg']
WHERE name LIKE 'ארמיטרז%';

UPDATE public.products SET
  image_url = base || '/cube/1.jpg',
  images    = ARRAY[base||'/cube/1.jpg', base||'/cube/2.jpg', base||'/cube/3.jpg', base||'/cube/4.jpg', base||'/cube/5.jpg', base||'/cube/6.jpg', base||'/cube/7.jpg']
WHERE name LIKE 'קיוב%';

UPDATE public.products SET
  image_url = base || '/kd/1.jpg',
  images    = ARRAY[base||'/kd/1.jpg', base||'/kd/2.jpg', base||'/kd/3.jpg', base||'/kd/4.jpg', base||'/kd/5.jpg']
WHERE name LIKE 'KD%';

UPDATE public.products SET
  image_url = base || '/queens/1.jpg',
  images    = ARRAY[base||'/queens/1.jpg', base||'/queens/2.jpg', base||'/queens/3.jpg', base||'/queens/4.jpg']
WHERE name LIKE 'כרמים Q%';

UPDATE public.products SET
  image_url = base || '/buttons/1.jpg',
  images    = ARRAY[base||'/buttons/1.jpg', base||'/buttons/2.jpg', base||'/buttons/3.jpg', base||'/buttons/4.jpg', base||'/buttons/5.jpg', base||'/buttons/6.jpg']
WHERE name LIKE 'קלאס קפיטונאז%';

UPDATE public.products SET
  image_url = base || '/caprice/1.jpg',
  images    = ARRAY[base||'/caprice/1.jpg', base||'/caprice/2.jpg', base||'/caprice/3.jpg']
WHERE name LIKE 'קפריס%';

UPDATE public.products SET
  image_url = base || '/colini/1.jpg',
  images    = ARRAY[base||'/colini/1.jpg', base||'/colini/2.jpg', base||'/colini/3.jpg', base||'/colini/4.jpg', base||'/colini/5.jpg', base||'/colini/6.jpg', base||'/colini/7.jpg', base||'/colini/8.jpg', base||'/colini/9.jpg']
WHERE name LIKE 'קולוני%';

UPDATE public.products SET
  image_url = base || '/eden/1.jpg',
  images    = ARRAY[base||'/eden/1.jpg', base||'/eden/2.jpg', base||'/eden/3.jpg', base||'/eden/4.jpg']
WHERE name LIKE 'עדן%';

UPDATE public.products SET
  image_url = base || '/lips/1.jpg',
  images    = ARRAY[base||'/lips/1.jpg', base||'/lips/2.jpg', base||'/lips/3.jpg', base||'/lips/4.jpg', base||'/lips/5.jpg', base||'/lips/6.jpg']
WHERE name LIKE 'ליפס%';

UPDATE public.products SET
  image_url = base || '/seychelles/1.jpg',
  images    = ARRAY[base||'/seychelles/1.jpg', base||'/seychelles/2.jpg', base||'/seychelles/3.jpg', base||'/seychelles/4.jpg', base||'/seychelles/5.jpg']
WHERE name LIKE 'סיישל%';

UPDATE public.products SET
  image_url = base || '/wings/1.jpg',
  images    = ARRAY[base||'/wings/1.jpg', base||'/wings/2.jpg', base||'/wings/3.jpg']
WHERE name LIKE 'ווינגס%';

END $$;

-- Sanity check after the upload + this migration:
-- SELECT count(*) FROM public.products WHERE image_url LIKE '%/product-images/%';
