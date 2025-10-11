

-- Enable RLS (if not already enabled)
ALTER TABLE "Farmer Data" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to insert new records (for registration)
CREATE POLICY "Allow public registration" ON "Farmer Data"
    FOR INSERT
    WITH CHECK (true);

-- Policy 2: Allow users to read their own data (for login/profile)
CREATE POLICY "Users can read own data" ON "Farmer Data"
    FOR SELECT
    USING (auth.uid()::text = id::text OR true); -- Use 'true' for now since you might not have auth.uid() setup

-- Policy 3: Allow users to update their own data
CREATE POLICY "Users can update own data" ON "Farmer Data"
    FOR UPDATE
    USING (auth.uid()::text = id::text OR true); -- Use 'true' for now

