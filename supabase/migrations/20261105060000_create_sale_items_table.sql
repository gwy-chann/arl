-- Migration: 20261105060000_create_sale_items_table.sql
-- Feature: ARL-14 (STORY-3.3: POS-Style Multi-Line New Sale Checkout Wizard with Stock Validation)

-- 1. Create sale_items table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes for lookup and joins
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx 
    ON public.sale_items (sale_id);

CREATE INDEX IF NOT EXISTS sale_items_variant_id_idx 
    ON public.sale_items (variant_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to sale_items" ON public.sale_items;
CREATE POLICY "Admins full access to sale_items"
    ON public.sale_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Seed historical baseline line items for seeded sales transactions
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
    s_id UUID;
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

    -- Seed line items for ARLQ-01048 (₱120 total: 1x Patis 1L at ₱95 + 1x Suka 350 at ₱25)
    SELECT id INTO s_id FROM public.sales WHERE receipt_number = 'ARLQ-01048' LIMIT 1;
    IF s_id IS NOT NULL AND v_patis_1L IS NOT NULL AND v_suka_350 IS NOT NULL THEN
        INSERT INTO public.sale_items (sale_id, variant_id, quantity, unit_price, unit_cost)
        VALUES 
            (s_id, v_patis_1L, 1, 95.00, 72.00),
            (s_id, v_suka_350, 1, 25.00, 18.00)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Seed line items for ARLQ-01041 (₱500 total: 2x Patis 1gal at ₱200 + 1x Suka 1gal at ₱100)
    SELECT id INTO s_id FROM public.sales WHERE receipt_number = 'ARLQ-01041' LIMIT 1;
    IF s_id IS NOT NULL AND v_patis_gal IS NOT NULL AND v_suka_gal IS NOT NULL THEN
        INSERT INTO public.sale_items (sale_id, variant_id, quantity, unit_price, unit_cost)
        VALUES 
            (s_id, v_patis_gal, 2, 200.00, 160.00),
            (s_id, v_suka_gal, 1, 100.00, 75.00)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Seed line items for ARLQ-01063 (₱560 total: 2x Patis 1gal at ₱200 + 1x Toyo 1gal at ₱160)
    SELECT id INTO s_id FROM public.sales WHERE receipt_number = 'ARLQ-01063' LIMIT 1;
    IF s_id IS NOT NULL AND v_patis_gal IS NOT NULL AND v_toyo_gal IS NOT NULL THEN
        INSERT INTO public.sale_items (sale_id, variant_id, quantity, unit_price, unit_cost)
        VALUES 
            (s_id, v_patis_gal, 2, 200.00, 160.00),
            (s_id, v_toyo_gal, 1, 160.00, 125.00)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
