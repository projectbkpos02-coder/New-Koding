# Vercel Deployment Guide - POS Rider System

## Prerequisites
- GitHub account with this repository pushed
- Vercel account (https://vercel.com)
- Supabase project credentials (URL and Anon Key)

---

## Step 1: Push Your Code to GitHub

```bash
cd /workspaces/New-Koding
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## Step 2: Create Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"+ New Project"**
3. Select your GitHub repository (New-Koding)
4. Click **"Import"**

### Option B: Via CLI

```bash
npm i -g vercel
vercel
# Follow the prompts to link your project
```

---

## Step 3: Configure Environment Variables

In **Vercel Dashboard → Your Project → Settings → Environment Variables**, add:

| Variable | Value | Example |
|----------|-------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://ekygcyodswoobxoyzysu.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiI...` |
| `JWT_SECRET` | Your JWT secret key | `Rw7COxf3vwxTAQDYUlk+mloP...` |
| `FRONTEND_URL` | Your production URL | `https://your-app.vercel.app` |
| `REACT_APP_BACKEND_URL` | Relative or production URL | `/api` |

**⚠️ Important:**
- For local development: `REACT_APP_BACKEND_URL=/api`
- All environments should use `/api` (requests are proxied automatically)

---

## Step 4: Verify vercel.json Configuration

Your `vercel.json` should have:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/frontend/build/$1" }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "JWT_SECRET": "@jwt_secret",
    "FRONTEND_URL": "@frontend_url"
  }
}
```

This configuration:
- Builds the frontend and serves it as static files
- Routes all `/api/*` requests to serverless functions
- Falls back to `index.html` for React Router (SPA)

---

## Step 5: Deploy

1. **Automatic Deployment:**
   - Every push to `main` branch triggers automatic deployment
   - Monitor progress at https://vercel.com/dashboard

2. **Manual Deployment:**
   ```bash
   vercel --prod
   ```

---

## Step 6: Verify Deployment

After deployment completes:

1. **Check API Health:**
   ```bash
   curl https://your-app.vercel.app/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Test Login:**
   - Go to https://your-app.vercel.app/login
   - Use your Supabase credentials to login

3. **View Logs:**
   - Vercel Dashboard → Your Project → Deployments → (latest) → Logs
   - Check for any runtime errors

---

## Troubleshooting

### Issue: 502 Bad Gateway on `/api/*` routes

**Cause:** Environment variables not set or database tables don't exist

**Fix:**
1. Verify env vars in Vercel Dashboard
2. Run database schema in Supabase SQL Editor (see `/backend/database_schema.sql`)

### Issue: "supabaseUrl is required"

**Cause:** `SUPABASE_URL` not set in environment

**Fix:** Add `SUPABASE_URL` to Vercel env vars (Settings → Environment Variables)

### Issue: Login returns 401 "Invalid email or password"

**Cause:** 
- User doesn't exist in Supabase `profiles` table
- Database tables not initialized

**Fix:**
1. Go to Supabase Dashboard
2. SQL Editor → Paste `/workspaces/New-Koding/backend/database_schema.sql` → Run
3. Ensure user email exists in `profiles` table

### Issue: Frontend returns 404

**Cause:** Build directory not correctly configured

**Fix:**
1. Verify `frontend/build/` directory exists locally
2. Check `vercel.json` `outputDirectory` points to `frontend/build`
3. Run `npm run build` locally to test

---

## Production Environment Variables Reference

Create a `.env.production` file (or set in Vercel):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=your_jwt_secret_here

# Frontend
FRONTEND_URL=https://your-app.vercel.app
REACT_APP_BACKEND_URL=/api
```

---

## Database Setup (One-Time)

Before first deployment, run the schema in Supabase:

1. Go to https://app.supabase.com
2. Select your project
3. Open **SQL Editor**
4. Paste contents of `/workspaces/New-Koding/backend/database_schema.sql`
5. Click **Run**

This creates:
- `profiles` table (users)
- `user_roles` table (role assignments)
- `products`, `categories`, `rider_stock` tables
- All other business logic tables

---

## Monitoring & Logs

### View Real-Time Logs
```bash
vercel logs [PROJECT_URL]
```

### View Function Metrics
- Vercel Dashboard → Deployments → View Function Metrics

### Set Up Alerts
- Vercel Dashboard → Project Settings → Alerts
- Configure thresholds for errors, response time, etc.

---

## Scaling & Performance

### Default Configuration
- **Node.js Runtime:** 18.x
- **Memory:** 1GB per function
- **Timeout:** 60 seconds (Pro plan: 900s)

### Optimize Performance
1. **API Caching:** Add `Cache-Control` headers in `server.js`
2. **Image Optimization:** Use Vercel Image Optimization
3. **Database Connection Pooling:** Configure in Supabase
4. **CDN:** Vercel automatically caches static assets globally

---

## Custom Domain

1. Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (auto-issued)

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Issues:** Check application logs for detailed error messages

---

## Summary Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked
- [ ] Environment variables configured in Vercel
- [ ] Database schema executed in Supabase
- [ ] First deployment successful
- [ ] API `/health` endpoint responding
- [ ] Login page accessible and working
- [ ] Mobile responsive on rider pages

---

**Deployment Status:** Ready for production ✅
