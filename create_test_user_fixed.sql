-- FIXED: Create a test user for login testing
-- Copy and paste this into your Supabase SQL Editor and run it

-- First, check what columns actually exist in your table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Farmer Data' 
ORDER BY ordinal_position;

-- Method 1: Try with exact case-sensitive column names
SELECT "Farmer Data"."Farmer_name", "Farmer Data"."Farmer_email" 
FROM "Farmer Data" 
WHERE "Farmer Data"."Farmer_email" = 'crop@demo.com';

-- Method 2: If Method 1 fails, try with different casing
SELECT farmer_name, farmer_email 
FROM "Farmer Data" 
WHERE farmer_email = 'crop@demo.com';

-- Method 3: If above fail, check all data in table to see column names
SELECT * FROM "Farmer Data" LIMIT 1;

-- Try to insert demo user (Method 1: exact case)
INSERT INTO "Farmer Data" ("Farmer_name", "Farmer_email", "Phone_number", "password", "location") 
VALUES (
    'Demo Farmer', 
    'crop@demo.com', 
    '+1234567890',
    '$2a$10$rQZ8K9vXqH8J2mN3pL4sOeX1yA5bC7dE9fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY', 
    'Demo Farm Location'
) 
ON CONFLICT ("Farmer_email") DO NOTHING;

-- Alternative insert (Method 2: lowercase)
-- INSERT INTO "Farmer Data" (farmer_name, farmer_email, phone_number, password, location) 
-- VALUES (
--     'Demo Farmer', 
--     'crop@demo.com', 
--     '+1234567890',
--     '$2a$10$rQZ8K9vXqH8J2mN3pL4sOeX1yA5bC7dE9fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY', 
--     'Demo Farm Location'
-- );

-- Verify the user was created
SELECT * FROM "Farmer Data" WHERE "Farmer_email" = 'crop@demo.com';

-- Success message
SELECT 'Demo user creation attempted!' as message;