# Smart Notifications Database Schema
## Vasu Vaidya - Farming Companion Application

This document provides comprehensive information about the database schema created for storing all smart notification data, including Planting Recommendations, Soil Health Actions, Task Rescheduling, and other agricultural management features.

## 📋 Overview

The database schema includes 8 main tables designed to store comprehensive agricultural data:

1. **Sowing Plans** - Planting recommendations and sowing schedules
2. **Soil Health Actions** - Soil improvement actions and recommendations
3. **Task Rescheduling** - Rescheduled agricultural tasks
4. **Smart Notifications** - All types of smart notifications
5. **Weather Recommendations** - Weather-based farming recommendations
6. **Market Updates** - Market price and trend information
7. **Irrigation Reminders** - Irrigation scheduling and reminders
8. **Pest Management** - Pest monitoring and control recommendations

## 🚀 Quick Setup

### Step 1: Run the Database Schema
Copy and paste the entire content of `create_smart_notifications_schema.sql` into your Supabase SQL Editor and execute it.

### Step 2: Verify Tables Created
Run this query to verify all tables were created successfully:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'Sowing Plans', 'Soil Health Actions', 'Task Rescheduling', 
    'Smart Notifications', 'Weather Recommendations', 'Market Updates',
    'Irrigation Reminders', 'Pest Management'
);
```

## 📊 Database Tables Details

### 1. Sowing Plans Table
**Purpose**: Store planting recommendations and sowing schedules

**Key Fields**:
- `crop_type`: wheat, gram, mustard, barley, lentil, pea
- `sowing_date`: Planned sowing date
- `status`: planned, in_progress, completed, cancelled
- `priority`: low, medium, high

**API Endpoint**: `/api/sowing-plans`

### 2. Soil Health Actions Table
**Purpose**: Store soil improvement actions and recommendations

**Key Fields**:
- `action_type`: lime_application, compost_addition, soil_testing, etc.
- `urgency`: low, medium, high
- `action_date`: Planned action date
- `status`: planned, in_progress, completed, cancelled

**API Endpoint**: `/api/soil-actions`

### 3. Task Rescheduling Table
**Purpose**: Store rescheduled agricultural tasks

**Key Fields**:
- `task_type`: irrigation, fertilizer, pest, harvest, planting
- `original_due_date` & `new_due_date`: Date tracking
- `reschedule_reason`: Why the task was rescheduled

**API Endpoint**: `/api/task-rescheduling`

### 4. Smart Notifications Table
**Purpose**: Store all types of smart notifications

**Key Fields**:
- `notification_type`: planting, soil, irrigation, market, weather, pest, harvest
- `action_button_text`: "Plan Sowing", "Take Action", etc.
- `action_taken`: Boolean flag for user interaction
- `action_data`: JSONB field for storing action details

**API Endpoint**: `/api/smart-notifications`

### 5. Weather Recommendations Table
**Purpose**: Store weather-based farming recommendations

**Key Fields**:
- `temperature`, `humidity`, `precipitation_chance`: Weather data
- `recommendation_type`: irrigation, pesticide, heat, wind, humidity, planting, general
- `is_fallback`: Boolean for estimated vs real-time data

### 6. Market Updates Table
**Purpose**: Store market price and trend information

**Key Fields**:
- `crop_name`, `crop_variety`: Crop identification
- `price_per_unit`, `price_unit`: Pricing information
- `price_trend`: rising, falling, stable

### 7. Irrigation Reminders Table
**Purpose**: Store irrigation scheduling and reminders

**Key Fields**:
- `irrigation_type`: drip, sprinkler, flood, manual
- `soil_moisture_level`: Soil moisture percentage
- `recommended_amount`: Water amount in liters
- `urgency`: low, medium, high

### 8. Pest Management Table
**Purpose**: Store pest monitoring and control recommendations

**Key Fields**:
- `pest_type`: bollworm, aphids, whitefly, etc.
- `pest_severity`: low, medium, high, critical
- `recommended_action`: Control method recommendation
- `organic_alternative`: Organic control option

## 🔧 API Endpoints

### Sowing Plans API
- **POST** `/api/sowing-plans` - Create new sowing plan
- **GET** `/api/sowing-plans?farmerId={id}` - Get farmer's sowing plans
- **PUT** `/api/sowing-plans` - Update sowing plan status

### Soil Actions API
- **POST** `/api/soil-actions` - Create new soil health action
- **GET** `/api/soil-actions?farmerId={id}` - Get farmer's soil actions
- **PUT** `/api/soil-actions` - Update soil action status

### Task Rescheduling API
- **POST** `/api/task-rescheduling` - Create new rescheduling record
- **GET** `/api/task-rescheduling?farmerId={id}` - Get farmer's rescheduling records
- **PUT** `/api/task-rescheduling` - Update rescheduling status

### Smart Notifications API
- **POST** `/api/smart-notifications` - Create new notification
- **GET** `/api/smart-notifications?farmerId={id}` - Get farmer's notifications
- **PUT** `/api/smart-notifications` - Update notification (dismiss/action taken)
- **DELETE** `/api/smart-notifications?id={id}` - Delete notification

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring users can only access their own data:

```sql
-- Example policy
CREATE POLICY "Users can view their own sowing plans" ON "Sowing Plans"
    FOR SELECT USING (auth.uid()::text = farmer_id::text);
```

### Data Validation
- Enum constraints for status, priority, urgency fields
- Check constraints for data validation
- Foreign key relationships with cascade deletes

## 📈 Performance Optimizations

### Indexes
Each table has strategic indexes for optimal query performance:
- Farmer ID indexes for user-specific queries
- Date indexes for time-based queries
- Status/priority indexes for filtering

### Query Examples
```sql
-- Get high-priority soil actions for a farmer
SELECT * FROM "Soil Health Actions" 
WHERE farmer_id = 'user-uuid' 
AND urgency = 'high' 
AND status = 'planned'
ORDER BY action_date ASC;

-- Get recent sowing plans
SELECT * FROM "Sowing Plans" 
WHERE farmer_id = 'user-uuid' 
AND sowing_date >= CURRENT_DATE
ORDER BY sowing_date ASC;
```

## 🔄 Integration with Frontend

### Modal Components Updated
- **PlanSowingModal**: Now saves data to `Sowing Plans` table
- **SoilActionModal**: Now saves data to `Soil Health Actions` table
- **RescheduleModal**: Can be updated to save to `Task Rescheduling` table

### Dashboard Integration
The Dashboard component now:
- Creates database records when users take actions
- Shows success notifications with database IDs
- Tracks user interactions with smart notifications

## 📝 Usage Examples

### Creating a Sowing Plan
```javascript
const response = await fetch('/api/sowing-plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    farmerId: 'farmer-uuid',
    cropType: 'wheat',
    cropLabel: 'Wheat',
    sowingDate: '2024-11-15',
    notes: 'Early sowing for better yield'
  })
});
```

### Creating a Soil Action
```javascript
const response = await fetch('/api/soil-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    farmerId: 'farmer-uuid',
    actionType: 'lime_application',
    actionLabel: 'Apply Lime',
    actionDate: '2024-11-10',
    urgency: 'high',
    notes: 'Soil pH is too low'
  })
});
```

## 🛠️ Maintenance

### Data Cleanup
Consider implementing cleanup jobs for:
- Old notifications (older than 30 days)
- Completed actions (older than 90 days)
- Fallback weather data (older than 7 days)

### Monitoring
Monitor table sizes and query performance:
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🎯 Next Steps

1. **Run the schema**: Execute `create_smart_notifications_schema.sql` in Supabase
2. **Test APIs**: Use the provided API endpoints to test functionality
3. **Update Frontend**: Ensure farmer IDs are passed to modal components
4. **Add Analytics**: Consider adding analytics tables for user behavior tracking
5. **Implement Cleanup**: Add automated cleanup jobs for old data

## 📞 Support

For questions or issues with the database schema:
1. Check the Supabase logs for detailed error messages
2. Verify RLS policies are correctly applied
3. Ensure farmer IDs are properly passed from the frontend
4. Test API endpoints individually using the provided examples

---

**Created for Vasu Vaidya - Farming Companion Application**
**Version**: 1.0
**Last Updated**: November 2024
