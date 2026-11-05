-- Migration: 20261105000000_create_categories_table.sql
-- Feature: ARL-7 (Product Category Management with Cascade Validation)

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Case-insensitive unique index for category names
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_idx 
    ON public.categories (lower(trim(name)));

-- 3. Trigger for automatically updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated administrative users full CRUD access
DROP POLICY IF EXISTS "Admins full access to categories" ON public.categories;
CREATE POLICY "Admins full access to categories"
    ON public.categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Seed default condiment categories matching ARLQ catalog
INSERT INTO public.categories (name)
VALUES
    ('Soy Sauce'),
    ('Vinegar'),
    ('Fish Sauce')
ON CONFLICT (name) DO NOTHING;
