-- Migration: Add wallet_name to transactions and create cigarette_packs with logs

-- 1. Upgrade Finance Table (Multi-Wallet)
ALTER TABLE transactions
ADD COLUMN wallet_name TEXT NOT NULL DEFAULT 'Cashless';

-- 2. Drop old cigarette_logs if exists to recreate with relational pack link
DROP TABLE IF EXISTS cigarette_logs;

-- 3. Create cigarette_packs table
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

-- 4. Create new cigarette_logs table (linked to packs)
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
