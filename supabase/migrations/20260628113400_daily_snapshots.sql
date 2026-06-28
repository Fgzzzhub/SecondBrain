-- Migration: create daily_snapshots table with user_id support for multi-user personal dashboards

CREATE TABLE IF NOT EXISTS public.daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  balance BIGINT DEFAULT 0,
  income BIGINT DEFAULT 0,
  expense BIGINT DEFAULT 0,
  net BIGINT DEFAULT 0,
  cigarettes INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  tasks_done INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  focus_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT daily_snapshots_user_date_key UNIQUE (user_id, date)
);

-- Enable RLS for daily_snapshots
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily snapshots" ON public.daily_snapshots;
CREATE POLICY "Users can manage their own daily snapshots"
ON public.daily_snapshots
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON public.daily_snapshots(user_id, date DESC);

-- Add status column to tasks table to support overdue flagging
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Backfill status based on is_completed
UPDATE public.tasks SET status = 'done' WHERE is_completed = true AND status = 'pending';
UPDATE public.tasks SET status = 'overdue' WHERE is_completed = false AND due_date < NOW() AND status = 'pending';
