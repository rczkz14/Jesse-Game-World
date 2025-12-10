-- ==========================================
-- SECURE DATABASE SETUP INSTRUCTIONS
-- ==========================================
-- 1. Go to your Supabase Dashboard
-- 2. Click on the "SQL Editor" tab (Icon with >_)
-- 3. Paste the code below into a new query window
-- 4. Click "Run" (bottom right)
-- ==========================================

-- 1. Create a secure function to submit scores
-- This acts as a "Gatekeeper". It checks the data BEFORE saving it.
CREATE OR REPLACE FUNCTION submit_score(
  p_game_name text,
  p_player_name text,
  p_player_avatar text,
  p_score int,
  p_player_fid text default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass the restrictions we set below
AS $$
DECLARE
  MAX_SCORE int := 5000; -- LIMIT: No score above 5000 is accepted. Adjust this as players get better!
  new_id bigint;
BEGIN
  -- CHECK 1: Is the score negative?
  IF p_score < 0 THEN
    RAISE EXCEPTION 'Score cannot be negative';
  END IF;

  -- CHECK 2: Is the score impossibly high?
  IF p_score > MAX_SCORE THEN
    RAISE EXCEPTION 'Score is suspiciously high. Rejected.';
  END IF;

  -- CHECK 3 (Validation): Ensure Name isn't empty
  IF length(p_player_name) < 1 THEN
     p_player_name := 'Anonymous';
  END IF;

  -- If checks pass, INSERT the data securely
  INSERT INTO game_scores (game_name, player_name, player_avatar, score, player_fid)
  VALUES (p_game_name, p_player_name, p_player_avatar, p_score, p_player_fid)
  RETURNING id INTO new_id;

  RETURN json_build_object('id', new_id, 'status', 'success');
END;
$$;

-- 2. LOCK THE DOORS
-- Revoke direct write access from everyone. 
-- Now, nobody can use "Postman" or scripts to bypass your logic.
REVOKE INSERT, UPDATE, DELETE ON TABLE game_scores FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE game_scores FROM authenticated;

-- 3. OPEN THE MAIL SLOT 
-- Allow everyone to use ONLY the secure function we just created.
GRANT EXECUTE ON FUNCTION submit_score TO anon;
GRANT EXECUTE ON FUNCTION submit_score TO authenticated;

-- ==========================================
-- DONE! Your leaderboard is now much safer.
-- To test: Try to insert a score of 6000, it should fail.
-- ==========================================
