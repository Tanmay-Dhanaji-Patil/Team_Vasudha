import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// 
const SUPABASE_URL = 'https://aundcwgdakyttydeqbca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bmRjd2dkYWt5dHR5ZGVxYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxNTQsImV4cCI6MjA3NDk5MzE1NH0.3Oe6OmH6tQOOPh5Il9cmGPEzmgeM1_WTTPSvveITXb8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pool = new Pool({
  connectionString: 'postgresql://postgres.aundcwgdakyttydeqbca:VASUDHA@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

export default pool;
