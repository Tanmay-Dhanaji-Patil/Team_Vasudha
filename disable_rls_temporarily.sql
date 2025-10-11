-- TEMPORARY FIX: Disable RLS for testing
-- Run this AFTER creating the tables above

-- Disable RLS temporarily for development
ALTER TABLE "Sowing Plans" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Soil Health Actions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task Rescheduling" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Smart Notifications" DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON "Sowing Plans" TO anon, authenticated;
GRANT ALL ON "Soil Health Actions" TO anon, authenticated;
GRANT ALL ON "Task Rescheduling" TO anon, authenticated;
GRANT ALL ON "Smart Notifications" TO anon, authenticated;

SELECT 'RLS disabled for testing - remember to re-enable later!' as status;
