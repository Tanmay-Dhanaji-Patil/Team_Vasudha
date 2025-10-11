-- SQL script to fix the password column type in Supabase
-- Run this in your Supabase SQL editor

-- Option 1: If the table is empty or you don't mind losing data
ALTER TABLE "Farmer Data" ALTER COLUMN password TYPE TEXT;

-- Option 2: If you have data and want to preserve it (more complex)
-- First, add a new column
-- ALTER TABLE "Farmer Data" ADD COLUMN password_new TEXT;
-- 
-- Copy any existing data (if needed)
-- UPDATE "Farmer Data" SET password_new = password::TEXT WHERE password IS NOT NULL;
-- 
-- Drop the old column and rename the new one
-- ALTER TABLE "Farmer Data" DROP COLUMN password;
-- ALTER TABLE "Farmer Data" RENAME COLUMN password_new TO password;