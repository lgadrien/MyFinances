-- Create table for storing daily portfolio snapshots
CREATE TABLE IF NOT EXISTS portfolio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    total_value NUMERIC NOT NULL,
    total_invested NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - though for single user app it's open for now
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (dev mode)
CREATE POLICY "Public access for portfolio_history" ON portfolio_history
FOR ALL USING (true);
