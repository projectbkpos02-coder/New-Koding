# Vercel Environment Variables Setup

This guide explains how to set up environment variables for your Vercel deployment.

## Required Variables

### 1. SUPABASE_URL
Your Supabase project URL

**Where to find:**
1. Go to https://app.supabase.com
2. Select your project
3. Click Settings → API
4. Copy "Project URL"

**Example:** `https://abcdefghijklmnop.supabase.co`

### 2. SUPABASE_ANON_KEY
Your Supabase anonymous key

**Where to find:**
1. Go to https://app.supabase.com
2. Select your project
3. Click Settings → API
4. Copy "anon" key (under "Project API keys")

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. JWT_SECRET
Secret key for signing JWT tokens (min 32 characters)

**Generate one:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use: https://generate-random.org/ (make sure it's at least 32 characters)

**Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t`

### 4. FRONTEND_URL (Optional but Recommended)
Your Vercel deployment URL

**Set after first deployment:** `https://your-domain.vercel.app`

Or your custom domain: `https://yourdomain.com`

## Setting Variables on Vercel

### Method 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add SUPABASE_URL
# Paste: https://your-project.supabase.co

vercel env add SUPABASE_ANON_KEY
# Paste: your-supabase-anon-key

vercel env add JWT_SECRET
# Paste: your-32-char-secret

vercel env add FRONTEND_URL
# Paste: https://your-domain.vercel.app

# Deploy
vercel deploy --prod
```

### Method 2: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings"
4. Go to "Environment Variables"
5. Add each variable:
   - Name: `SUPABASE_URL`
   - Value: (your Supabase URL)
   - Select all environments (Production, Preview, Development)
   - Click "Save"
6. Repeat for all variables
7. Redeploy from "Deployments" tab

## Local Development

Create `.env` file in root directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
REACT_APP_BACKEND_URL=http://localhost:3000
```

## Frontend Environment Variables

The frontend build automatically sets `REACT_APP_BACKEND_URL` to `/api` for production.

**Local development:** `http://localhost:3000`
**Production:** `/api` (relative URL, routes to Vercel API)

## Verifying Variables

After deployment, verify variables are set:

```bash
vercel env ls
```

You should see:
```
SUPABASE_URL
SUPABASE_ANON_KEY
JWT_SECRET
FRONTEND_URL
```

## Troubleshooting

### "Cannot connect to Supabase"
- Check SUPABASE_URL is correct (no trailing slash)
- Verify SUPABASE_ANON_KEY is not truncated
- Check Supabase project is active

### "Invalid token"
- Regenerate JWT_SECRET
- Redeploy with new secret
- Users will need to login again

### "CORS errors"
- FRONTEND_URL should match your deployment domain
- Update FRONTEND_URL if you change domain

### "Build fails"
- Check no syntax errors in variables
- Ensure no extra spaces or quotes
- Try redeploying

## Security Best Practices

1. ✅ Use strong JWT_SECRET (32+ characters, random)
2. ✅ Never commit .env file
3. ✅ Use .env.example with placeholder values
4. ✅ Rotate JWT_SECRET periodically
5. ✅ Use different secrets for dev/prod
6. ✅ Keep Supabase keys secret
7. ✅ Monitor Vercel logs for unauthorized access

## Support

If having issues:
1. Check Vercel logs: `vercel logs`
2. Verify variables: `vercel env ls`
3. Test Supabase connection separately
4. Check API responses in browser console
