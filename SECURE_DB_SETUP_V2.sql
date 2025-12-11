-- ==========================================
-- SECURE DATABASE SETUP (V2) - UPDATED
-- ==========================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard -> SQL Editor.
-- 2. Paste this ENTIRE script.
-- 3. Run it.
-- ==========================================

-- 1. Create a secure function to SUBMIT scores
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
  MAX_SCORE int := 5000; -- No score above 5000 allowed
  new_id bigint;
BEGIN
  IF p_score < 0 THEN RAISE EXCEPTION 'Score cannot be negative'; END IF;
  IF p_score > MAX_SCORE THEN RAISE EXCEPTION 'Score is suspiciously high. Rejected.'; END IF;
  IF length(p_player_name) < 1 THEN p_player_name := 'Anonymous'; END IF;

  INSERT INTO game_scores (game_name, player_name, player_avatar, score, player_fid)
  VALUES (p_game_name, p_player_name, p_player_avatar, p_score, p_player_fid)
  RETURNING id INTO new_id;

  RETURN json_build_object('id', new_id, 'status', 'success');
END;
$$;

-- 2. Create a secure function to UPDATE scores
CREATE OR REPLACE FUNCTION update_score(
  p_id bigint,
  p_new_score int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  MAX_SCORE int := 5000;
BEGIN
  IF p_new_score < 0 THEN RAISE EXCEPTION 'Score cannot be negative'; END IF;
  IF p_new_score > MAX_SCORE THEN RAISE EXCEPTION 'Score is suspiciously high. Rejected.'; END IF;

  UPDATE game_scores
  SET score = p_new_score
  WHERE id = p_id;

  RETURN json_build_object('status', 'success');
END;
$$;


-- 3. LOCK THE DOORS (Revoke Direct Access)
REVOKE INSERT, UPDATE, DELETE ON TABLE game_scores FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE game_scores FROM authenticated;

-- 4. OPEN THE MAIL SLOTS (Grant Function Access)
GRANT EXECUTE ON FUNCTION submit_score TO anon;
GRANT EXECUTE ON FUNCTION submit_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_score TO anon;
GRANT EXECUTE ON FUNCTION update_score TO authenticated;

-- ==========================================
-- DONE! Your database is now secured.
-- ==========================================
