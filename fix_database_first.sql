-- CRITICAL: Fix UUID error before login integration
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Farmer Data' 
ORDER BY ordinal_position;

-- Step 2: Ensure proper UUID generation for id column
ALTER TABLE "Farmer Data" 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 3: Disable RLS temporarily for development (this fixes permission issues)
ALTER TABLE "Farmer Data" DISABLE ROW LEVEL SECURITY;

-- Step 4: Grant proper permissions
GRANT ALL ON "Farmer Data" TO anon, authenticated;

-- Step 5: Ensure password column is TEXT type (not UUID)
ALTER TABLE "Farmer Data" 
ALTER COLUMN password TYPE TEXT;

-- Step 6: Add created_at if missing
ALTER TABLE "Farmer Data" 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 7: Verify the fix
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Farmer Data'
AND column_name IN ('id', 'password', 'created_at');

-- Success message
SELECT 'Database fixed successfully!' as status;