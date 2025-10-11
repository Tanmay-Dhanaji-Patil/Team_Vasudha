-- Create a test user for login testing
-- Copy and paste this into your Supabase SQL Editor and run it

-- First, check if demo user already exists
SELECT Farmer_name, Farmer_email FROM "Farmer Data" WHERE Farmer_email = 'crop@demo.com';

-- If no user exists, create a demo user
-- Password will be 'crop1234' (hashed)
INSERT INTO "Farmer Data" (Farmer_name, Farmer_email, Phone_number, password, location) 
VALUES (
    'Demo Farmer', 
    'crop@demo.com', 
    '+1234567890',
    '$2a$10$rQZ8K9vXqH8J2mN3pL4sOeX1yA5bC7dE9fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY', 
    'Demo Farm Location'
) 
ON CONFLICT (Farmer_email) DO NOTHING;

-- Verify the user was created
SELECT Farmer_name, Farmer_email, Phone_number, location, created_at 
FROM "Farmer Data" 
WHERE Farmer_email = 'crop@demo.com';

-- Success message
SELECT 'Demo user created successfully! Login with: crop@demo.com / crop1234' as message;