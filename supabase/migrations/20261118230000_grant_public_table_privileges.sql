-- Migration: 20261118230000_grant_public_table_privileges.sql
-- Feature: ARL-37 (Customer Profile Persistence & Real-Time Balances Cache Invalidation)
-- Purpose: Grant schema usage, table/sequence/routine privileges to anon, authenticated, and service_role,
--          and ensure RLS policies enable storefront and administrative client operations without 42501 errors.

-- 1. Grant schema usage and privileges on existing database objects
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Alter default privileges for future database tables, sequences, and routines
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Idempotently add RLS policies for anon access across core domain tables
DO $$
BEGIN
    -- customers
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Anon full access to customers'
    ) THEN
        CREATE POLICY "Anon full access to customers" ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- sales
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales' AND policyname = 'Anon full access to sales'
    ) THEN
        CREATE POLICY "Anon full access to sales" ON public.sales FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- sale_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sale_items' AND policyname = 'Anon full access to sale_items'
    ) THEN
        CREATE POLICY "Anon full access to sale_items" ON public.sale_items FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Anon full access to categories'
    ) THEN
        CREATE POLICY "Anon full access to categories" ON public.categories FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- products
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Anon full access to products'
    ) THEN
        CREATE POLICY "Anon full access to products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- product_variants
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_variants' AND policyname = 'Anon full access to product_variants'
    ) THEN
        CREATE POLICY "Anon full access to product_variants" ON public.product_variants FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- stock_movements
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'Anon full access to stock_movements'
    ) THEN
        CREATE POLICY "Anon full access to stock_movements" ON public.stock_movements FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    -- system_settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Anon full access to system_settings'
    ) THEN
        CREATE POLICY "Anon full access to system_settings" ON public.system_settings FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
END $$;
