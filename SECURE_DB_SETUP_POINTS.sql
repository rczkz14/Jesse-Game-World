-- SECURE DB SETUP - POINTS SYSTEM
-- Run this in Supabase SQL Editor

-- 1. Create player_stats table if missing
CREATE TABLE IF NOT EXISTS player_stats (
    player_fid text PRIMARY KEY,
    total_jesse_spent numeric DEFAULT 0,
    points bigint DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- 2. Add points column if table existed but column didn't
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_stats' AND column_name='points') THEN 
        ALTER TABLE player_stats ADD COLUMN points bigint DEFAULT 0; 
    END IF; 
END $$;

-- 3. Function to add points safely
CREATE OR REPLACE FUNCTION add_points(p_fid text, p_amount int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO player_stats (player_fid, points, updated_at)
  VALUES (p_fid, p_amount, now())
  ON CONFLICT (player_fid)
  DO UPDATE SET 
    points = COALESCE(player_stats.points, 0) + p_amount,
    updated_at = now();
    
  RETURN json_build_object('success', true, 'new_total', (SELECT points FROM player_stats WHERE player_fid = p_fid));
END;
$$;

GRANT EXECUTE ON FUNCTION add_points TO anon;
GRANT EXECUTE ON FUNCTION add_points TO authenticated;
