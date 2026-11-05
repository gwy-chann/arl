-- Migration: 20261105020000_create_customers_and_sales_tables.sql
-- Feature: ARL-9 (Customer Directory with Contact Book & Balance Rollup)

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive index for customer search
CREATE INDEX IF NOT EXISTS customers_name_lower_idx 
    ON public.customers (lower(trim(name)));

CREATE INDEX IF NOT EXISTS customers_phone_idx 
    ON public.customers (trim(phone));

-- Automatically update updated_at timestamp
DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to customers" ON public.customers;
CREATE POLICY "Admins full access to customers"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Create sales transactions table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('Paid', 'Partially Paid', 'Not Yet Paid')),
    order_status TEXT NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Delivered', 'Picked Up')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_customer_id_idx 
    ON public.sales (customer_id);

CREATE INDEX IF NOT EXISTS sales_receipt_number_idx 
    ON public.sales (receipt_number);

-- Automatically update updated_at timestamp on sales
DROP TRIGGER IF EXISTS set_sales_updated_at ON public.sales;
CREATE TRIGGER set_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS) on sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to sales" ON public.sales;
CREATE POLICY "Admins full access to sales"
    ON public.sales
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Seed default commercial customers and initial sales for debt rollups
DO $$
DECLARE
    nena_id UUID;
    tonyo_id UUID;
    remedios_id UUID;
    kristine_id UUID;
    ben_id UUID;
    marites_id UUID;
    boy_id UUID;
    junjun_id UUID;
BEGIN
    -- Insert default customers if not present
    INSERT INTO public.customers (name, phone, address)
    VALUES ('Aling Nena''s Sari-Sari Store', '0917 301 4488', 'Purok 3, Brgy. San Roque')
    RETURNING id INTO nena_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Mang Tonyo Carinderia', '0928 554 1290', 'Public Market Stall 14')
    RETURNING id INTO tonyo_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Lola Remedios Eatery', '0935 882 7013', 'Rizal St., Brgy. Poblacion')
    RETURNING id INTO remedios_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Kristine Dela Cruz', '0906 447 2251', 'Lot 8, Mabini Subdivision')
    RETURNING id INTO kristine_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Bigasan ni Ben', '0919 660 3382', 'National Highway, Brgy. Bagong Silang')
    RETURNING id INTO ben_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Marites Food Stall', '0945 213 9904', 'Terminal Road')
    RETURNING id INTO marites_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Tito Boy Lechon Haus', '0927 774 1156', 'Brgy. Santo Niño')
    RETURNING id INTO boy_id;

    INSERT INTO public.customers (name, phone, address)
    VALUES ('Jun-Jun''s Turo-Turo', '0998 120 6677', 'Corner Luna and Bonifacio St.')
    RETURNING id INTO junjun_id;

    -- Seed initial sales transactions
    -- Aling Nena: ₱1,340.00 outstanding debt across sales (matching ARL-9 Acceptance Scenario 3)
    IF nena_id IS NOT NULL THEN
        INSERT INTO public.sales (receipt_number, customer_id, total_amount, amount_paid, payment_status, order_status, created_at)
        VALUES 
            ('ARLQ-01041', nena_id, 500.00, 500.00, 'Paid', 'Delivered', now() - interval '25 days'),
            ('ARLQ-01050', nena_id, 1340.00, 0.00, 'Not Yet Paid', 'Delivered', now() - interval '8 days');
    END IF;

    -- Mang Tonyo: ₱240.00 debt
    IF tonyo_id IS NOT NULL THEN
        INSERT INTO public.sales (receipt_number, customer_id, total_amount, amount_paid, payment_status, order_status, created_at)
        VALUES 
            ('ARLQ-01045', tonyo_id, 650.00, 650.00, 'Paid', 'Delivered', now() - interval '6 days'),
            ('ARLQ-01063', tonyo_id, 560.00, 320.00, 'Partially Paid', 'Pending', now());
    END IF;

    -- Kristine Dela Cruz: Fully settled ($0 debt, matching ARL-9 Acceptance Scenario 4)
    IF kristine_id IS NOT NULL THEN
        INSERT INTO public.sales (receipt_number, customer_id, total_amount, amount_paid, payment_status, order_status, created_at)
        VALUES 
            ('ARLQ-01048', kristine_id, 120.00, 120.00, 'Paid', 'Picked Up', now() - interval '5 days');
    END IF;
END $$;
