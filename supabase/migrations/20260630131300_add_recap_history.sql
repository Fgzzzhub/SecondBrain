CREATE TABLE IF NOT EXISTS public.recap_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  categories text[] NOT NULL,
  format text NOT NULL DEFAULT 'markdown' CHECK (format = ANY (ARRAY['markdown'::text, 'json'::text])),
  content text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'manual' CHECK (trigger_type = ANY (ARRAY['manual'::text, 'scheduled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recap_history_pkey PRIMARY KEY (id),
  CONSTRAINT recap_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE public.recap_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recap history"
  ON public.recap_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recap_history_period
  ON public.recap_history(user_id, period_start, period_end);
