import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://gepyxwypyguwemgisxqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcHl4d3lweWd1d2VtZ2lzeHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTg2NzcsImV4cCI6MjA3OTg3NDY3N30.spBvPOV8Vd1UZSKUycmR3WepXCO19PpDmxLVeph5Ph8';

export const supabase = createClient(supabaseUrl, supabaseKey, {
	global: { headers: { apikey: supabaseKey } }
});
