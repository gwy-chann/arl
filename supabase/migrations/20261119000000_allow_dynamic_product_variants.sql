-- Migration: 20261119000000_allow_dynamic_product_variants.sql
-- Feature: ARL-38 (In-Form Category Creation & Dynamic Product Variant Management)

-- 1. Drop any legacy check constraint on product_variants.size restricting enum values
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.product_variants'::regclass 
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%size%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Add non-empty check constraint on size
ALTER TABLE public.product_variants 
    ADD CONSTRAINT product_variants_size_not_empty 
    CHECK (trim(size) <> '');

-- 3. Ensure index exists on product_variants (product_id, size)
CREATE INDEX IF NOT EXISTS product_variants_product_id_size_idx 
    ON public.product_variants (product_id, size);
