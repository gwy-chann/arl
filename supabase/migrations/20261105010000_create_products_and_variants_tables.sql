-- Migration: 20261105010000_create_products_and_variants_tables.sql
-- Feature: ARL-8 (Multi-Variant Product Catalog & Pricing Engine)

-- 1. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness index for product names
CREATE UNIQUE INDEX IF NOT EXISTS products_name_lower_idx 
    ON public.products (lower(trim(name)));

-- Index on category_id for fast relational joins and counts
CREATE INDEX IF NOT EXISTS products_category_id_idx 
    ON public.products (category_id);

-- 2. Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('350', '1L', 'gal')),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_variant_size UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx 
    ON public.product_variants (product_id);

-- 3. Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER set_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to products" ON public.products;
CREATE POLICY "Admins full access to products"
    ON public.products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to product_variants" ON public.product_variants;
CREATE POLICY "Admins full access to product_variants"
    ON public.product_variants
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Seed default 3 products and 9 variants matching ARLQ catalog
DO $$
DECLARE
    cat_soysauce_id UUID;
    cat_vinegar_id UUID;
    cat_fishsauce_id UUID;
    toyo_id UUID;
    suka_id UUID;
    patis_id UUID;
BEGIN
    SELECT id INTO cat_soysauce_id FROM public.categories WHERE lower(name) = 'soy sauce' LIMIT 1;
    SELECT id INTO cat_vinegar_id FROM public.categories WHERE lower(name) = 'vinegar' LIMIT 1;
    SELECT id INTO cat_fishsauce_id FROM public.categories WHERE lower(name) = 'fish sauce' LIMIT 1;

    -- Toyo
    INSERT INTO public.products (name, category_id)
    VALUES ('Toyo', cat_soysauce_id)
    ON CONFLICT (lower(trim(name))) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO toyo_id;

    IF toyo_id IS NOT NULL THEN
        INSERT INTO public.product_variants (product_id, size, cost_price, selling_price, stock_quantity, min_stock_level)
        VALUES
            (toyo_id, '350', 14.00, 20.00, 96, 48),
            (toyo_id, '1L', 38.00, 50.00, 58, 30),
            (toyo_id, 'gal', 125.00, 160.00, 17, 12)
        ON CONFLICT (product_id, size) DO UPDATE SET
            cost_price = EXCLUDED.cost_price,
            selling_price = EXCLUDED.selling_price,
            stock_quantity = EXCLUDED.stock_quantity,
            min_stock_level = EXCLUDED.min_stock_level;
    END IF;

    -- Suka
    INSERT INTO public.products (name, category_id)
    VALUES ('Suka', cat_vinegar_id)
    ON CONFLICT (lower(trim(name))) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO suka_id;

    IF suka_id IS NOT NULL THEN
        INSERT INTO public.product_variants (product_id, size, cost_price, selling_price, stock_quantity, min_stock_level)
        VALUES
            (suka_id, '350', 11.00, 16.00, 72, 48),
            (suka_id, '1L', 30.00, 42.00, 34, 24),
            (suka_id, 'gal', 100.00, 135.00, 6, 12)
        ON CONFLICT (product_id, size) DO UPDATE SET
            cost_price = EXCLUDED.cost_price,
            selling_price = EXCLUDED.selling_price,
            stock_quantity = EXCLUDED.stock_quantity,
            min_stock_level = EXCLUDED.min_stock_level;
    END IF;

    -- Patis
    INSERT INTO public.products (name, category_id)
    VALUES ('Patis', cat_fishsauce_id)
    ON CONFLICT (lower(trim(name))) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO patis_id;

    IF patis_id IS NOT NULL THEN
        INSERT INTO public.product_variants (product_id, size, cost_price, selling_price, stock_quantity, min_stock_level)
        VALUES
            (patis_id, '350', 18.00, 25.00, 21, 36),
            (patis_id, '1L', 48.00, 62.00, 40, 24),
            (patis_id, 'gal', 160.00, 200.00, 14, 12)
        ON CONFLICT (product_id, size) DO UPDATE SET
            cost_price = EXCLUDED.cost_price,
            selling_price = EXCLUDED.selling_price,
            stock_quantity = EXCLUDED.stock_quantity,
            min_stock_level = EXCLUDED.min_stock_level;
    END IF;
END $$;
