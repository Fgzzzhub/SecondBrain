-- Migration: Add start_date and trigger_hour to auto_transactions
ALTER TABLE public.auto_transactions 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS trigger_hour INTEGER DEFAULT 0;
