-- Migration: 20261105070000_add_sales_ledger_performance_indexes.sql
-- Feature: ARL-15 (STORY-3.4: Sales Transaction Ledger, Detail View & Status Manager)

-- Add performance indexes for sales ledger searching, sorting and multi-status filtering
CREATE INDEX IF NOT EXISTS sales_created_at_desc_idx 
    ON public.sales (created_at DESC);

CREATE INDEX IF NOT EXISTS sales_payment_status_idx 
    ON public.sales (payment_status);

CREATE INDEX IF NOT EXISTS sales_order_status_idx 
    ON public.sales (order_status);
