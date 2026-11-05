-- Migration: 20261105030000_create_system_settings_table.sql
-- Feature: ARL-21 (System Settings for Reminder Thresholds, Stock Minimums & Admin Security)

-- 1. Create singleton system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'singleton_store_settings',
    reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days >= 1),
    admin_mobile TEXT NOT NULL DEFAULT '0917 555 0142',
    notification_channel TEXT NOT NULL DEFAULT 'SMS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT singleton_store_settings_id_check CHECK (id = 'singleton_store_settings')
);

-- 2. Trigger for updated_at timestamps
DROP TRIGGER IF EXISTS set_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER set_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to system_settings" ON public.system_settings;
CREATE POLICY "Admins full access to system_settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Seed default singleton settings row
INSERT INTO public.system_settings (id, reminder_days, admin_mobile, notification_channel)
VALUES ('singleton_store_settings', 7, '0917 555 0142', 'SMS')
ON CONFLICT (id) DO NOTHING;
