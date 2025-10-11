-- =====================================================
-- SMART NOTIFICATIONS DATABASE SCHEMA
-- Vasu Vaidya - Farming Companion Application
-- =====================================================

-- This script creates all necessary tables for storing:
-- 1. Planting Recommendations (Sowing Plans)
-- 2. Soil Health Actions
-- 3. Task Rescheduling
-- 4. Smart Notifications
-- 5. Weather Recommendations
-- 6. Market Updates
-- 7. Irrigation Reminders

-- =====================================================
-- 1. SOWING PLANS TABLE
-- Stores planting recommendations and sowing plans
-- =====================================================

CREATE TABLE IF NOT EXISTS "Sowing Plans" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    notification_id TEXT, -- Reference to the original notification
    crop_type VARCHAR(50) NOT NULL CHECK (crop_type IN ('wheat', 'gram', 'mustard', 'barley', 'lentil', 'pea')),
    crop_label VARCHAR(100) NOT NULL, -- Human-readable crop name
    plot_number VARCHAR(50), -- Optional plot assignment
    sowing_date DATE NOT NULL,
    sowing_time TIME, -- Optional specific time
    notes TEXT, -- Additional requirements or notes
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. SOIL HEALTH ACTIONS TABLE
-- Stores soil improvement actions and recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS "Soil Health Actions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    notification_id TEXT, -- Reference to the original notification
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'lime_application', 'compost_addition', 'soil_testing', 
        'mulching', 'cover_crop', 'fertilizer_adjustment'
    )),
    action_label VARCHAR(100) NOT NULL, -- Human-readable action name
    plot_number VARCHAR(50), -- Optional plot assignment
    action_date DATE NOT NULL,
    action_time TIME, -- Optional specific time
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    notes TEXT, -- Additional requirements or notes
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 3. TASK RESCHEDULING TABLE
-- Stores rescheduled agricultural tasks
-- =====================================================

CREATE TABLE IF NOT EXISTS "Task Rescheduling" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    original_task_id TEXT, -- Reference to original task
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('irrigation', 'fertilizer', 'pest', 'harvest', 'planting')),
    crop_name VARCHAR(100) NOT NULL,
    original_due_date DATE NOT NULL,
    original_due_text VARCHAR(100) NOT NULL, -- "Tomorrow", "In 3 days", etc.
    new_due_date DATE NOT NULL,
    new_due_text VARCHAR(100) NOT NULL,
    rescheduled_time TIME, -- Optional specific time
    reschedule_reason TEXT, -- Why the task was rescheduled
    status VARCHAR(20) DEFAULT 'rescheduled' CHECK (status IN ('rescheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SMART NOTIFICATIONS TABLE
-- Stores all types of smart notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS "Smart Notifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'planting', 'soil', 'irrigation', 'market', 'weather', 'pest', 'harvest'
    )),
    sub_type VARCHAR(50), -- For weather: 'irrigation', 'pesticide', 'heat', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    action_button_text VARCHAR(50), -- "Plan Sowing", "Take Action", etc.
    action_taken BOOLEAN DEFAULT FALSE, -- Whether user clicked the action button
    action_data JSONB, -- Store the action data (sowing plan, soil action, etc.)
    is_weather_alert BOOLEAN DEFAULT FALSE,
    is_fallback BOOLEAN DEFAULT FALSE, -- For weather data fallbacks
    location VARCHAR(200), -- Location context for the notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    action_taken_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. WEATHER RECOMMENDATIONS TABLE
-- Stores weather-based farming recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS "Weather Recommendations" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    location VARCHAR(200) NOT NULL,
    temperature DECIMAL(5,2), -- Temperature in Celsius
    humidity DECIMAL(5,2), -- Humidity percentage
    precipitation_chance DECIMAL(5,2), -- Precipitation chance percentage
    wind_speed DECIMAL(5,2), -- Wind speed in km/h
    weather_condition VARCHAR(100), -- "sunny", "cloudy", "rainy", etc.
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
        'irrigation', 'pesticide', 'heat', 'wind', 'humidity', 'planting', 'general'
    )),
    recommendation_message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    action_suggested VARCHAR(100), -- Suggested action
    is_fallback BOOLEAN DEFAULT FALSE, -- Whether this is estimated data
    forecast_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. MARKET UPDATES TABLE
-- Stores market price and trend information
-- =====================================================

CREATE TABLE IF NOT EXISTS "Market Updates" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    crop_variety VARCHAR(100), -- "hybrid", "organic", etc.
    price_per_unit DECIMAL(10,2), -- Price per kg/quintal
    price_unit VARCHAR(20), -- "kg", "quintal", "ton"
    price_trend VARCHAR(20) CHECK (price_trend IN ('rising', 'falling', 'stable')),
    market_location VARCHAR(200),
    update_source VARCHAR(100), -- Source of the market data
    notes TEXT,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 7. IRRIGATION REMINDERS TABLE
-- Stores irrigation scheduling and reminders
-- =====================================================

CREATE TABLE IF NOT EXISTS "Irrigation Reminders" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES "Plot Details"(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    irrigation_type VARCHAR(50) CHECK (irrigation_type IN ('drip', 'sprinkler', 'flood', 'manual')),
    soil_moisture_level DECIMAL(5,2), -- Soil moisture percentage
    recommended_amount DECIMAL(8,2), -- Recommended water amount in liters
    recommended_time VARCHAR(50), -- "Morning", "Evening", etc.
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    reminder_date DATE NOT NULL,
    reminder_time TIME,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 8. PEST MANAGEMENT TABLE
-- Stores pest monitoring and control recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS "Pest Management" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES "Farmer Data"(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES "Plot Details"(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    pest_type VARCHAR(100) NOT NULL, -- "bollworm", "aphids", "whitefly", etc.
    pest_severity VARCHAR(20) CHECK (pest_severity IN ('low', 'medium', 'high', 'critical')),
    detection_method VARCHAR(100), -- "visual", "trap", "soil_test", etc.
    recommended_action VARCHAR(200), -- Recommended control method
    pesticide_suggested VARCHAR(200), -- Specific pesticide recommendation
    organic_alternative VARCHAR(200), -- Organic control method
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    action_date DATE NOT NULL,
    action_time TIME,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Sowing Plans indexes
CREATE INDEX IF NOT EXISTS idx_sowing_plans_farmer_id ON "Sowing Plans"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_sowing_plans_sowing_date ON "Sowing Plans"(sowing_date);
CREATE INDEX IF NOT EXISTS idx_sowing_plans_status ON "Sowing Plans"(status);

-- Soil Health Actions indexes
CREATE INDEX IF NOT EXISTS idx_soil_actions_farmer_id ON "Soil Health Actions"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_soil_actions_action_date ON "Soil Health Actions"(action_date);
CREATE INDEX IF NOT EXISTS idx_soil_actions_urgency ON "Soil Health Actions"(urgency);

-- Task Rescheduling indexes
CREATE INDEX IF NOT EXISTS idx_task_rescheduling_farmer_id ON "Task Rescheduling"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_task_rescheduling_new_due_date ON "Task Rescheduling"(new_due_date);

-- Smart Notifications indexes
CREATE INDEX IF NOT EXISTS idx_smart_notifications_farmer_id ON "Smart Notifications"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_type ON "Smart Notifications"(notification_type);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_created_at ON "Smart Notifications"(created_at);

-- Weather Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_weather_recommendations_farmer_id ON "Weather Recommendations"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_weather_recommendations_forecast_date ON "Weather Recommendations"(forecast_date);

-- Market Updates indexes
CREATE INDEX IF NOT EXISTS idx_market_updates_farmer_id ON "Market Updates"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_market_updates_crop_name ON "Market Updates"(crop_name);

-- Irrigation Reminders indexes
CREATE INDEX IF NOT EXISTS idx_irrigation_reminders_farmer_id ON "Irrigation Reminders"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_reminders_reminder_date ON "Irrigation Reminders"(reminder_date);

-- Pest Management indexes
CREATE INDEX IF NOT EXISTS idx_pest_management_farmer_id ON "Pest Management"(farmer_id);
CREATE INDEX IF NOT EXISTS idx_pest_management_action_date ON "Pest Management"(action_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Sowing Plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Soil Health Actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task Rescheduling" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Smart Notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Weather Recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Market Updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Irrigation Reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pest Management" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their own data
CREATE POLICY "Users can view their own sowing plans" ON "Sowing Plans"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own sowing plans" ON "Sowing Plans"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can update their own sowing plans" ON "Sowing Plans"
    FOR UPDATE USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own soil actions" ON "Soil Health Actions"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own soil actions" ON "Soil Health Actions"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can update their own soil actions" ON "Soil Health Actions"
    FOR UPDATE USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own task rescheduling" ON "Task Rescheduling"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own task rescheduling" ON "Task Rescheduling"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own smart notifications" ON "Smart Notifications"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own smart notifications" ON "Smart Notifications"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can update their own smart notifications" ON "Smart Notifications"
    FOR UPDATE USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own weather recommendations" ON "Weather Recommendations"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own weather recommendations" ON "Weather Recommendations"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own market updates" ON "Market Updates"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own market updates" ON "Market Updates"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own irrigation reminders" ON "Irrigation Reminders"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own irrigation reminders" ON "Irrigation Reminders"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can update their own irrigation reminders" ON "Irrigation Reminders"
    FOR UPDATE USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can view their own pest management" ON "Pest Management"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can insert their own pest management" ON "Pest Management"
    FOR INSERT WITH CHECK (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can update their own pest management" ON "Pest Management"
    FOR UPDATE USING (auth.uid()::text = farmer_id::text);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON "Sowing Plans" TO authenticated;
GRANT ALL ON "Soil Health Actions" TO authenticated;
GRANT ALL ON "Task Rescheduling" TO authenticated;
GRANT ALL ON "Smart Notifications" TO authenticated;
GRANT ALL ON "Weather Recommendations" TO authenticated;
GRANT ALL ON "Market Updates" TO authenticated;
GRANT ALL ON "Irrigation Reminders" TO authenticated;
GRANT ALL ON "Pest Management" TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Smart Notifications Database Schema created successfully!' as status;
