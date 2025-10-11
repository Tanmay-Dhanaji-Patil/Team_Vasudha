-- SQL script to fix the password column type in Supabase
-- Run this in your Supabase SQL editor

-- Option 1: If the table is empty or you don't mind losing data
ALTER TABLE "Farmer Data" ALTER COLUMN password TYPE TEXT;

