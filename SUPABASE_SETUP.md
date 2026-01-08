# Supabase Configuration Guide

The login issue is caused by **missing or incorrect Supabase environment variables** on Vercel.

## Issue
Your Vercel deployment shows: `"error": "Invalid API key"` when trying to login, which means the Supabase connection is failing.

## Solution: Set Environment Variables on Vercel

You need to configure these environment variables in your Vercel project:

### Required Environment Variables

1. **SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_ANON_KEY** - Your Supabase anonymous key  
3. **JWT_SECRET** - A secret key for JWT tokens
4. **FRONTEND_URL** - Your frontend URL (https://new-koding-delta.vercel.app)

## How to Find Your Supabase Credentials

### Step 1: Go to Supabase Dashboard
- Visit: https://app.supabase.com
- Select your project

### Step 2: Get Your URL and Anon Key
- Click on **Settings** (gear icon) in the sidebar
- Click on **API**
- You'll see:
  - **Project URL** → Copy this as `SUPABASE_URL`
  - **Project API Keys** → Copy the **anon public** key as `SUPABASE_ANON_KEY`

### Step 3: Generate JWT_SECRET
- Use a strong random string. You can generate one:
  ```bash
  openssl rand -base64 32
  ```
- Or use an online generator: https://www.random.org/
- Example: `your-secret-key-here-at-least-32-chars-long`

## How to Set Environment Variables on Vercel

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to: https://vercel.com/dashboard
2. Select your project **new-koding-delta**
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Add these variables:
   - Name: `SUPABASE_URL` | Value: `https://your-project.supabase.co`
   - Name: `SUPABASE_ANON_KEY` | Value: `eyJ0eXAiOiJKV1QiLCJhbGc...`
   - Name: `JWT_SECRET` | Value: `your-random-secret-key`
   - Name: `FRONTEND_URL` | Value: `https://new-koding-delta.vercel.app`
6. Click **Save**
7. **Redeploy** the project:
   - Click **Deployments** tab
   - Click the ⋮ (three dots) on the latest deployment
   - Select **Redeploy**

### Option 2: Via Vercel CLI
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
vercel deploy --prod
```

## After Setting Environment Variables

1. Wait 30 seconds for the deployment to rebuild
2. Test the login with these credentials:
   ```
   Email: test@test.com
   Password: password123
   ```
3. If login still fails, try creating a test user:
   ```bash
   curl -X POST https://new-koding-delta.vercel.app/api/auth/create-test-user
   ```

## Database Tables Required

Make sure these tables exist in your Supabase database:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP
);
```

See [database_schema.sql](backend/database_schema.sql) for the complete schema.

## Troubleshooting

- **"Invalid API key"** → Check SUPABASE_URL and SUPABASE_ANON_KEY are correct
- **"Not found" error** → Check the database tables exist and have test data
- **Page refreshes on login** → Frontend auth context issue; check browser console for errors
- **CORS errors** → Check FRONTEND_URL is set correctly on Vercel

## Testing Login Flow

1. Create a test user:
   ```bash
   curl -X POST https://new-koding-delta.vercel.app/api/auth/create-test-user
   ```
   Response should show:
   ```json
   {
     "email": "test@test.com",
     "password": "password123",
     "role": "admin"
   }
   ```

2. Try logging in with those credentials on the site

3. Check browser console (F12 → Console tab) for any JavaScript errors
