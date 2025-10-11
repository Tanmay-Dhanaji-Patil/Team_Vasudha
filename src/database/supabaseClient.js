import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables. Please check your .env.local file.');
}

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable. Please check your .env.local file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pool = new Pool({
  connectionString: DATABASE_URL
});

export default pool;

