-- SECURE LOCKDOWN & FUNCTION UPDATE
-- Run this in Supabase SQL Editor

-- 1. LOCK DOWN TABLES (Enable Firewall)
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_achievements ENABLE ROW LEVEL SECURITY;

-- 2. REMOVE OLD/INSECURE POLICIES
DROP POLICY IF EXISTS "Enable read access for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable update for all users" ON game_scores;
DROP POLICY IF EXISTS "Public Read" ON game_scores;
DROP POLICY IF EXISTS "Public Read" ON player_stats;
DROP POLICY IF EXISTS "Public Read" ON claimed_achievements;

-- 3. ADD STRICT READ-ONLY POLICIES (Public can see, but NOT edit)
CREATE POLICY "Public Read Scores" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Public Read Stats" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Public Read Ach" ON claimed_achievements FOR SELECT USING (true);

-- 4. REVOKE DIRECT WRITE ACCESS (The "Friend" Fix)
REVOKE INSERT, UPDATE, DELETE ON game_scores FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON player_stats FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON claimed_achievements FROM anon, authenticated;

-- 5. FUNCTION: claim_badge (Safe Achievement Claiming)
CREATE OR REPLACE FUNCTION claim_badge(p_fid text, p_badge_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO claimed_achievements (player_fid, achievement_id, created_at)
  VALUES (p_fid, p_badge_id, now())
  ON CONFLICT DO NOTHING; 
  -- Note: If this fails, ensure you have a UNIQUE constraint on (player_fid, achievement_id)
END;
$$;

-- 6. FUNCTION: record_spending (Safe Spend Recording)
CREATE OR REPLACE FUNCTION record_spending(p_fid text, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO player_stats (player_fid, total_jesse_spent, updated_at)
  VALUES (p_fid, p_amount, now())
  ON CONFLICT (player_fid)
  DO UPDATE SET 
    total_jesse_spent = COALESCE(player_stats.total_jesse_spent, 0) + p_amount,
    updated_at = now();
END;
$$;

-- 7. UPDATE: submit_score (Stricter Limit)
CREATE OR REPLACE FUNCTION submit_score(
  p_game_name text,
  p_player_name text,
  p_player_avatar text,
  p_score int,
  p_player_fid text default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  MAX_SCORE int := 4000; -- Lowered from 5000 to prevent cheating
  new_id bigint;
BEGIN
  IF p_score < 0 THEN RAISE EXCEPTION 'Negative score'; END IF;
  IF p_score > MAX_SCORE THEN RAISE EXCEPTION 'Score too high'; END IF;
  
  IF length(p_player_name) < 1 THEN p_player_name := 'Anonymous'; END IF;

  INSERT INTO game_scores (game_name, player_name, player_avatar, score, player_fid)
  VALUES (p_game_name, p_player_name, p_player_avatar, p_score, p_player_fid)
  RETURNING id INTO new_id;

  RETURN json_build_object('id', new_id, 'status', 'success');
END;
$$;

-- 8. GRANT ACCESS TO FUNCTIONS
GRANT EXECUTE ON FUNCTION claim_badge TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_spending TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_points TO anon, authenticated;
