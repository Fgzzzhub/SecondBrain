-- Migration: Add user_id to trip_templates and configure RLS policies for trip checklist

-- 1. Ensure trip_templates table exists and has user_id
CREATE TABLE IF NOT EXISTS public.trip_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check if user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'trip_templates'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.trip_templates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent duplicates
DROP POLICY IF EXISTS "Users can manage their own templates" ON public.trip_templates;
DROP POLICY IF EXISTS "Allow public select and insert" ON public.trip_templates;

-- Create policies for trip_templates (Authenticated users can manage only their own templates)
CREATE POLICY "Users can manage their own templates" ON public.trip_templates
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 2. Ensure template_items table exists
CREATE TABLE IF NOT EXISTS public.template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.trip_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS for template_items
ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own template items" ON public.template_items;

-- Create policies for template_items (Enforce ownership via the linked template)
CREATE POLICY "Users can manage their own template items" ON public.template_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trip_templates
            WHERE public.trip_templates.id = public.template_items.template_id
              AND public.trip_templates.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trip_templates
            WHERE public.trip_templates.id = public.template_items.template_id
              AND public.trip_templates.user_id = auth.uid()
        )
    );

-- Reload PostgREST schema cache to make sure the app sees the changes immediately
NOTIFY pgrst, 'reload schema';
