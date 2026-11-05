-- Migration: 20261105030000_create_stock_movements_table.sql
-- Feature: ARL-13 (Stock-In & Stock-Out Ledger with Movement Audit)

-- 1. Create stock_movements audit table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('In', 'Out', 'Sale')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes for lookup, filtering, and chronological sorting
CREATE INDEX IF NOT EXISTS stock_movements_variant_id_idx 
    ON public.stock_movements (variant_id);

CREATE INDEX IF NOT EXISTS stock_movements_type_idx 
    ON public.stock_movements (movement_type);

CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx 
    ON public.stock_movements (created_at DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to stock_movements" ON public.stock_movements;
CREATE POLICY "Admins full access to stock_movements"
    ON public.stock_movements
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Seed historical baseline movements matching ARLQ store operations
DO $$
DECLARE
    v_toyo_350 UUID;
    v_toyo_1L UUID;
    v_toyo_gal UUID;
    v_suka_350 UUID;
    v_suka_1L UUID;
    v_suka_gal UUID;
    v_patis_350 UUID;
    v_patis_1L UUID;
    v_patis_gal UUID;
BEGIN
    SELECT pv.id INTO v_toyo_350 FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'toyo' AND pv.size = '350' LIMIT 1;
    SELECT pv.id INTO v_toyo_1L FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'toyo' AND pv.size = '1L' LIMIT 1;
    SELECT pv.id INTO v_toyo_gal FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'toyo' AND pv.size = 'gal' LIMIT 1;

    SELECT pv.id INTO v_suka_350 FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'suka' AND pv.size = '350' LIMIT 1;
    SELECT pv.id INTO v_suka_1L FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'suka' AND pv.size = '1L' LIMIT 1;
    SELECT pv.id INTO v_suka_gal FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'suka' AND pv.size = 'gal' LIMIT 1;

    SELECT pv.id INTO v_patis_350 FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'patis' AND pv.size = '350' LIMIT 1;
    SELECT pv.id INTO v_patis_1L FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'patis' AND pv.size = '1L' LIMIT 1;
    SELECT pv.id INTO v_patis_gal FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id WHERE lower(p.name) = 'patis' AND pv.size = 'gal' LIMIT 1;

    -- Seed historical movements if variants exist
    IF v_toyo_350 IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES 
            (v_toyo_350, 'In', 96, 'Restock from warehouse', '', now() - INTERVAL '2 days'),
            (v_toyo_350, 'Out', 3, 'Used for repacking', 'Spilled during repack', now() - INTERVAL '16 days');
    END IF;

    IF v_suka_350 IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES (v_suka_350, 'In', 72, 'Restock from warehouse', '', now() - INTERVAL '2 days');
    END IF;

    IF v_suka_gal IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES (v_suka_gal, 'Out', 1, 'Damaged or spilled', 'Damaged: cracked cap', now() - INTERVAL '3 days');
    END IF;

    IF v_patis_1L IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES (v_patis_1L, 'In', 48, 'Restock from warehouse', '', now() - INTERVAL '5 days');
    END IF;

    IF v_patis_350 IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES 
            (v_patis_350, 'Out', 2, 'Sample or giveaway', 'Sample for new customer', now() - INTERVAL '7 days'),
            (v_patis_350, 'In', 48, 'Restock from warehouse', '', now() - INTERVAL '27 days');
    END IF;

    IF v_toyo_gal IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES (v_toyo_gal, 'In', 24, 'Restock from warehouse', '', now() - INTERVAL '9 days');
    END IF;

    IF v_suka_1L IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES (v_suka_1L, 'In', 36, 'Restock from warehouse', '', now() - INTERVAL '13 days');
    END IF;

    IF v_patis_gal IS NOT NULL THEN
        INSERT INTO public.stock_movements (variant_id, movement_type, quantity, reason, note, created_at)
        VALUES (v_patis_gal, 'In', 18, 'Restock from warehouse', '', now() - INTERVAL '20 days');
    END IF;
END $$;
