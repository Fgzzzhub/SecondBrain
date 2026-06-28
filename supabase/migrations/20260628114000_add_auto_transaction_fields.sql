-- Migration: Add fields for automatic email parsed transactions

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS raw_subject TEXT,
ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 100;

-- Drop check constraint if present that prevents 'auto' or 'pending_review' statuses
-- If the status column didn't exist before, it will default to 'manual'.
-- Let's ensure the status column defaults to 'manual' and is compatible with 'auto' and 'pending_review'.
