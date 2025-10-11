-- ESSENTIAL TABLES FOR SMART NOTIFICATIONS
-- Run this in your Supabase SQL Editor

-- 1. Create Sowing Plans table
CREATE TABLE IF NOT EXISTS "Sowing Plans" (
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

-- 2. Create Soil Health Actions table
CREATE TABLE IF NOT EXISTS "Soil Health Actions" (
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

-- 3. Create Task Rescheduling table
CREATE TABLE IF NOT EXISTS "Task Rescheduling" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    original_task_id TEXT,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('irrigation', 'fertilizer', 'pest', 'harvest', 'planting')),
    crop_name VARCHAR(100) NOT NULL,
    original_due_date DATE NOT NULL,
    original_due_text VARCHAR(100) NOT NULL,
    new_due_date DATE NOT NULL,
    new_due_text VARCHAR(100) NOT NULL,
    rescheduled_time TIME,
    reschedule_reason TEXT,
    status VARCHAR(20) DEFAULT 'rescheduled' CHECK (status IN ('rescheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Smart Notifications table
CREATE TABLE IF NOT EXISTS "Smart Notifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'planting', 'soil', 'irrigation', 'market', 'weather', 'pest', 'harvest'
    )),
    sub_type VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    action_button_text VARCHAR(50),
    action_taken BOOLEAN DEFAULT FALSE,
    action_data JSONB,
    is_weather_alert BOOLEAN DEFAULT FALSE,
    is_fallback BOOLEAN DEFAULT FALSE,
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    action_taken_at TIMESTAMP WITH TIME ZONE
);

-- Disable RLS temporarily for testing
ALTER TABLE "Sowing Plans" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Soil Health Actions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task Rescheduling" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Smart Notifications" DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON "Sowing Plans" TO anon, authenticated;
GRANT ALL ON "Soil Health Actions" TO anon, authenticated;
GRANT ALL ON "Task Rescheduling" TO anon, authenticated;
GRANT ALL ON "Smart Notifications" TO anon, authenticated;

-- Success message
SELECT 'Essential tables created successfully!' as status;
