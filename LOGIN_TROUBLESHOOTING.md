# Login Issues - Troubleshooting Guide

## Problem: "Page Refreshes Instantly on Login" + Console Shows Nothing

**Root Cause:** Missing or incorrect Supabase credentials on Vercel deployment

## Quick Diagnosis

Run this command to check your Vercel environment variables:

```bash
curl https://new-koding-delta.vercel.app/api/health
```

### Expected Output (✓ Working)
```json
{
  "status": "ok",
  "env": {
    "supabase_url": "✓ Set",
    "supabase_key": "✓ Set",
    "jwt_secret": "✓ Set"
  }
}
```

### Actual Output (✗ Not Working Yet)
If you see `"supabase_url": "✗ Missing"` or `"supabase_key": "✗ Missing"`, follow the steps below.

---

## Step-by-Step Fix

### Step 1: Get Your Supabase Credentials

Go to **Supabase Dashboard**: https://app.supabase.com

1. Click your project
2. Go to **Settings** (gear icon in sidebar)
3. Click **API** in the left menu
4. Copy these two values:
   - **Project URL** → Save as `SUPABASE_URL`
   - **anon | public** key → Save as `SUPABASE_ANON_KEY`

Example:
```
SUPABASE_URL=https://abcdef123456.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 2: Set Environment Variables on Vercel

Go to: **https://vercel.com/dashboard**

1. Click **new-koding-delta** project
2. Click **Settings** tab (top menu)
3. Click **Environment Variables** (left sidebar)
4. Add these variables:

| Name | Value | Example |
|------|-------|---------|
| `SUPABASE_URL` | Your Project URL | `https://abcdef123456.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon key | `eyJhbGciOiJIUzI1NiIs...` |
| `JWT_SECRET` | Random string (32+ chars) | `your-random-secret-key-min-32-chars-long` |
| `FRONTEND_URL` | Your app URL | `https://new-koding-delta.vercel.app` |

**To generate JWT_SECRET**, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator: https://www.random.org/strings/

---

### Step 3: Redeploy on Vercel

1. Still in Vercel Settings
2. Click **Environment Variables** to verify all 4 are added
3. Go to **Deployments** tab
4. Find the latest deployment
5. Click the **⋮** (three dots) menu
6. Select **Redeploy**
7. Wait ~2-3 minutes for the new deployment

**OR** use Vercel CLI:
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET  
vercel env add FRONTEND_URL
vercel deploy --prod
```

---

### Step 4: Create a Test User

After redeployment, create a test user:

```bash
curl -X POST https://new-koding-delta.vercel.app/api/auth/create-test-user \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "email": "test@test.com",
  "password": "password123",
  "role": "admin",
  "message": "Test user created successfully"
}
```

**If you get error:**
- `"error": "Invalid API key"` → SUPABASE_ANON_KEY is wrong or Supabase credentials need regeneration
- `"error": "Test user already exists"` → User already created, use credentials above

---

### Step 5: Test Login in Browser

1. Go to: https://new-koding-delta.vercel.app
2. Login with:
   - Email: `test@test.com`
   - Password: `password123`
3. Should redirect to **Admin Dashboard** (you created the user with `role: 'admin'`)

---

## If Login Still Fails

### Check Browser Console for Errors

1. Open your browser
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Try logging in again
5. Look for red error messages

### Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Invalid email or password` | User doesn't exist. Run the create-test-user endpoint |
| `No authorization token` | Frontend didn't send auth header. Check `api.js` interceptor |
| `CORS error` | Check FRONTEND_URL is correct on Vercel |
| `Cannot POST /api/auth/login` | Vercel hasn't deployed latest code yet. Wait 2-3 min and redeploy manually |

### Verify Supabase Tables Exist

Your Supabase database needs these tables:

```sql
-- Check profiles table
SELECT * FROM profiles;

-- Check user_roles table  
SELECT * FROM user_roles;
```

If tables don't exist, run [backend/database_schema.sql](backend/database_schema.sql) in Supabase SQL Editor.

### Test API Directly

```bash
# Test creating a user
curl -X POST https://new-koding-delta.vercel.app/api/auth/create-test-user

# Test login
curl -X POST https://new-koding-delta.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Should return:
# {"access_token":"eyJ...", "user":{"id":"...", "email":"test@test.com", "role":"admin"}}
```

---

## Complete Environment Variables Checklist

Before testing login, make sure on Vercel you have:

- [ ] `SUPABASE_URL` set (starts with https://)
- [ ] `SUPABASE_ANON_KEY` set (long JWT-looking string)
- [ ] `JWT_SECRET` set (random 32+ character string)
- [ ] `FRONTEND_URL` set to https://new-koding-delta.vercel.app
- [ ] Vercel has redeployed (check Deployments tab for latest timestamp)

---

## Need Help?

If login still doesn't work after these steps:

1. Run health check: `curl https://new-koding-delta.vercel.app/api/health`
2. Check browser console (F12 → Console tab)
3. Verify Supabase tables exist (check SQL Editor)
4. Make sure you didn't accidentally use Supabase **service_role** key instead of **anon** key
5. Try creating a fresh Supabase project and start over

Good luck! 🚀
