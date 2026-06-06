-- Upgrade Transactions table with wallet_name and wallet_type
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS wallet_name TEXT NOT NULL DEFAULT 'Cashless',
ADD COLUMN IF NOT EXISTS wallet_type TEXT NOT NULL DEFAULT 'Cashless';

-- Drop existing tables to ensure a clean slate (in case of re-run)
DROP TABLE IF EXISTS cigarette_logs CASCADE;
DROP TABLE IF EXISTS cigarette_packs CASCADE;

-- Create cigarette_packs table
CREATE TABLE cigarette_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    initial_sticks INT NOT NULL CHECK (initial_sticks > 0),
    remaining_sticks INT NOT NULL CHECK (remaining_sticks >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for cigarette_packs
ALTER TABLE cigarette_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cigarette packs"
ON cigarette_packs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create cigarette_logs table (linked to packs)
CREATE TABLE cigarette_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES cigarette_packs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    smoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for cigarette_logs
ALTER TABLE cigarette_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cigarette logs"
ON cigarette_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
