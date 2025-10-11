
ALTER TABLE "Farmer Data" 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 
ALTER TABLE "Farmer Data" 
ALTER COLUMN "Farmer_name" TYPE TEXT,
ALTER COLUMN "Farmer_email" TYPE TEXT,
ALTER COLUMN "Phone_number" TYPE TEXT,
ALTER COLUMN "password" TYPE TEXT,
ALTER COLUMN "location" TYPE TEXT;

-- Step 3: Add NOT NULL constraints
ALTER TABLE "Farmer Data" 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();


-- Option A: Disable RLS for development purposes
ALTER TABLE "Farmer Data" DISABLE ROW LEVEL SECURITY;



-- Option B: If RLS is needed, create policies (uncomment if needed)
GRANT ALL ON "Farmer Data" TO anon, authenticated;

-- Step 6: Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Farmer Data' 
ORDER BY ordinal_position;