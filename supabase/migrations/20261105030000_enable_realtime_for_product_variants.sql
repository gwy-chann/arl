-- Migration: 20261105030000_enable_realtime_for_product_variants.sql
-- Feature: ARL-12 (Live Stock Inventory Monitor & Capacity Level Meters)

-- 1. Enable REPLICA IDENTITY FULL on product_variants for complete payload broadcasts
ALTER TABLE IF EXISTS public.product_variants REPLICA IDENTITY FULL;

-- 2. Add product_variants table to supabase_realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'product_variants'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
        END IF;
    END IF;
END $$;
