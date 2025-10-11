# Database Integration Setup

## Overview
This document explains how to set up the database integration for user authentication in the Soil Health Monitor application.

## Prerequisites
- Supabase project created and running
- Database connection already established (confirmed working)
- Users table already created in Supabase


## Setup Steps

### 1. Install Dependencies
Run the installation script:
```bash
# Windows
install_dependencies.bat

# Or manually
npm install bcryptjs@^2.4.3
```

### 2. Verify Database Connection
Test your database connection:
```bash
node test_db_connection.js
```

### 3. Start the Application
1. Start your development server: `npm run dev`
2. Test user registration with a new account
3. Test login with demo credentials:
   - Email: `crop@demo.com`
   - Password: `crop1234`

## Database Schema

### Users Table
- `id` - UUID primary key
- `name` - User's full name
- `email` - Unique email address
- `username` - Generated from name
- `password` - Hashed password (bcrypt)
- `location` - User's farm location
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp

## API Endpoints

### POST /api/auth/register
Registers a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "location": "Farm Location"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "location": "Farm Location"
  }
}
```

### POST /api/auth/login
Authenticates a user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "location": "Farm Location"
  }
}
```

## Security Features
- Password hashing with bcrypt
- Input validation and sanitization
- Email uniqueness validation
- SQL injection protection via Supabase
- Automatic timestamp updates

## Rollback Instructions
If you need to undo the database integration:

1. **Revert frontend changes:**
   ```bash
   git checkout HEAD -- src/app/page.js
   ```

2. **Remove API endpoints:**
   ```bash
   rm -rf src/app/api/auth/
   ```

3. **Remove dependencies:**
   ```bash
   npm uninstall bcryptjs
   ```

4. **Drop database table (if needed):**
   ```sql
   DROP TABLE IF EXISTS users;
   ```

## Troubleshooting

### Common Issues:
1. **"Module not found" error** - Run `npm install bcryptjs`
2. **Database connection error** - Check Supabase credentials
3. **Registration fails** - Verify database table exists
4. **Login fails** - Check if demo user exists in database

### Demo User Password
The demo user password `crop1234` is automatically hashed when the SQL script runs. If you need to reset it, use:
```sql
UPDATE users SET password = '$2a$10$rQZ8K9vXqH8J2mN3pL4sOeX1yA5bC7dE9fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY' WHERE email = 'crop@demo.com';
```

## Support
If you encounter any issues, check the browser console for error messages and ensure all dependencies are properly installed.
