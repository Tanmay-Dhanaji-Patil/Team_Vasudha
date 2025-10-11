-- ALTERNATIVE: Create tables with simpler names
-- Run this if the above doesn't work

-- 1. Create sowing_plans table (without spaces)
CREATE TABLE IF NOT EXISTS sowing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    notification_id TEXT,
    crop_type VARCHAR(50) NOT NULL CHECK (crop_type IN ('wheat', 'gram', 'mustard', 'barley', 'lentil', 'pea')),
    crop_label VARCHAR(100) NOT NULL,
    plot_number VARCHAR(50),
    sowing_date DATE NOT NULL,
    sowing_time TIME,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create soil_health_actions table
CREATE TABLE IF NOT EXISTS soil_health_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    notification_id TEXT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'lime_application', 'compost_addition', 'soil_testing', 
        'mulching', 'cover_crop', 'fertilizer_adjustment'
    )),
    action_label VARCHAR(100) NOT NULL,
    plot_number VARCHAR(50),
    action_date DATE NOT NULL,
    action_time TIME,
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Disable RLS temporarily
ALTER TABLE sowing_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE soil_health_actions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON sowing_plans TO anon, authenticated;
GRANT ALL ON soil_health_actions TO anon, authenticated;

SELECT 'Tables with simple names created successfully!' as status;
