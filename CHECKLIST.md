# 🚀 Vercel Deployment Checklist

## Pre-Deployment

- [ ] Supabase account created
  - [ ] Project created
  - [ ] SUPABASE_URL copied
  - [ ] SUPABASE_ANON_KEY copied
  
- [ ] JWT_SECRET generated (32+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] .env file created with all variables
  ```bash
  cp .env.example .env
  # Edit .env with credentials
  ```

- [ ] Dependencies installed
  ```bash
  npm install
  cd frontend && npm install && cd ..
  ```

- [ ] Database schema created
  - [ ] Supabase SQL Editor opened
  - [ ] SQL from `backend/database_schema.sql` copied
  - [ ] SQL executed successfully

- [ ] Local testing completed
  ```bash
  npm start
  # Test at http://localhost:3000
  ```

## Vercel Deployment

- [ ] Vercel account created
- [ ] Repository pushed to GitHub
- [ ] Connected GitHub to Vercel
- [ ] Project imported in Vercel
- [ ] Environment variables added:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] JWT_SECRET
  - [ ] FRONTEND_URL

## Post-Deployment

- [ ] Deployment completed successfully
  - [ ] Check build logs in Vercel dashboard
  - [ ] No error messages
  
- [ ] Test API endpoints
  - [ ] Health check: `/api/health` → 200 OK
  - [ ] Login: `POST /api/auth/login`
  - [ ] Get products: `GET /api/products`
  
- [ ] Test frontend
  - [ ] Can access homepage
  - [ ] Can register new user
  - [ ] Can login
  - [ ] Can view dashboard
  
- [ ] Monitor Vercel logs
  ```bash
  vercel logs
  ```

- [ ] Set up error monitoring
  - [ ] Configure Vercel alerts
  - [ ] Set up email notifications

- [ ] (Optional) Set up custom domain
  - [ ] Domain added in Vercel settings
  - [ ] DNS records configured
  - [ ] SSL certificate (automatic)

## Production Optimization

- [ ] Enable Vercel Analytics
  - [ ] Go to project settings
  - [ ] Enable Web Analytics
  
- [ ] Configure caching headers
  - [ ] Frontend static assets: 1 year
  - [ ] API responses: As needed
  
- [ ] Set up auto-deployments
  - [ ] GitHub branch protection
  - [ ] Required status checks
  - [ ] Auto-deploy on merge

- [ ] Database backups
  - [ ] Supabase backups enabled
  - [ ] Backup schedule set
  - [ ] Test restoration process

- [ ] Security hardening
  - [ ] Change JWT_SECRET from default
  - [ ] Enable Supabase RLS (Row Level Security)
  - [ ] Add API rate limiting
  - [ ] Review database permissions

## Monitoring & Maintenance

- [ ] Weekly checks
  - [ ] Review Vercel logs
  - [ ] Check Supabase metrics
  - [ ] Monitor error rates
  
- [ ] Monthly tasks
  - [ ] Review usage and costs
  - [ ] Check for security updates
  - [ ] Update dependencies
  - [ ] Review analytics
  
- [ ] Security maintenance
  - [ ] Rotate JWT_SECRET if needed
  - [ ] Review access logs
  - [ ] Update Supabase policies
  - [ ] Check for vulnerabilities

## Troubleshooting Commands

```bash
# View deployment logs
vercel logs

# List environment variables
vercel env ls

# Redeploy
vercel deploy --prod

# Link to project
vercel link

# Open Vercel dashboard
vercel

# Test API locally
curl http://localhost:3000/api/health

# Check Supabase connection
npm test
```

## Documentation Files

- 📖 **README.md** - Project overview
- 📋 **DEPLOYMENT.md** - Full deployment guide
- 🔐 **VERCEL_ENV_SETUP.md** - Environment variables
- 🔄 **MIGRATION.md** - Migration summary
- 📊 **database_schema.sql** - Database schema
- ✅ **THIS FILE** - Quick checklist

## Getting Help

1. Check Vercel logs: `vercel logs`
2. Review DEPLOYMENT.md for common issues
3. Check Supabase status: app.supabase.com
4. Read migration notes: MIGRATION.md
5. Check API responses in browser console

## Success Indicators

✅ When you see all these, you're good to go:

- [ ] Homepage loads without errors
- [ ] Login page works
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] API returns 200 for health check
- [ ] No console errors
- [ ] Database queries work
- [ ] Can create products (admin)
- [ ] Can view transactions
- [ ] Vercel dashboard shows 0 errors

## Next Steps After Deployment

1. Set up automated backups
2. Configure monitoring alerts
3. Set up CI/CD pipeline
4. Add rate limiting
5. Implement logging service
6. Set up performance monitoring
7. Plan feature roadmap
8. Collect user feedback

---

**Last updated:** January 2026
**Status:** Ready for deployment ✅
