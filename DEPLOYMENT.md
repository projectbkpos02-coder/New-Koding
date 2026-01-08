# POS Rider System - Vercel Deployment Guide

## Project Structure

This is a **100% Vercel-friendly** POS Rider System. No Python, no VPS needed!

```
/
├── api/                  # Vercel Serverless Functions (Node.js)
│   ├── index.js         # Main API router
│   ├── auth.js          # Authentication endpoints
│   ├── products.js      # Product management
│   ├── categories.js    # Category management
│   ├── distributions.js # Distribution management
│   ├── transactions.js  # POS transactions
│   ├── returns.js       # Return management
│   ├── rejects.js       # Reject management
│   ├── productions.js   # Production records
│   ├── rider-stock.js   # Rider stock management
│   ├── stock-opname.js  # Stock opname
│   ├── gps.js          # GPS tracking
│   └── users.js        # User management
├── frontend/            # React Frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── vercel.json         # Vercel configuration
├── package.json        # Root package.json
└── .env.example        # Environment variables template
```

## Prerequisites

1. **Supabase Account** (Free tier works fine)
   - Create a new project at https://supabase.com
   - Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

2. **Vercel Account**
   - Sign up at https://vercel.com
   - Connect your GitHub repository

## Setup Instructions

### 1. Supabase Database Setup

Run the SQL schema in your Supabase SQL Editor:

```sql
-- Copy all SQL from backend/database_schema.sql
-- Run it in Supabase SQL Editor
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-random-secret-key-min-32-chars
FRONTEND_URL=https://your-domain.vercel.app
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel link              # Link to Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
vercel deploy
```

#### Option B: Using Vercel Dashboard

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL`
5. Click Deploy

### 4. Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install

# Create .env file with Supabase credentials
cp .env.example .env

# Run development server
npm start
```

## API Endpoints

All endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Distributions
- `GET /api/distributions` - List distributions (admin)
- `POST /api/distributions` - Create distribution (admin)

### Transactions (POS)
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction detail

### Returns
- `GET /api/returns` - List returns
- `POST /api/returns` - Create return
- `PUT /api/returns/:id/approve` - Approve return (admin)
- `PUT /api/returns/:id/reject` - Reject return (admin)

### Rejects (Damaged)
- `GET /api/rejects` - List rejects
- `POST /api/rejects` - Create reject
- `PUT /api/rejects/:id/approve` - Approve reject (admin)
- `PUT /api/rejects/:id/reject` - Reject request (admin)

### Stock Opname
- `GET /api/stock-opname` - List stock opnames (admin)
- `POST /api/stock-opname` - Create stock opname (admin)

### GPS Tracking
- `POST /api/gps` - Update location
- `GET /api/gps/:rider_id` - Get rider locations
- `GET /api/gps/all` - Get all riders (admin)

### Users/Riders
- `GET /api/users` - List riders (admin)
- `GET /api/users/leaderboard` - Rider leaderboard
- `GET /api/users/reports` - User reports (admin)

## Database Tables

See `backend/database_schema.sql` for complete schema. Key tables:
- `profiles` - Users
- `user_roles` - User roles
- `products` - Product catalog
- `categories` - Product categories
- `rider_stock` - Rider inventory
- `transactions` - POS sales
- `distributions` - Stock distribution
- `returns` - Product returns
- `rejects` - Damaged products
- `productions` - Production records
- `stock_opnames` - Stock inventories
- `gps_locations` - GPS tracking

## Security Notes

1. **JWT Secret**: Generate a strong random string (min 32 chars)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Environment Variables**: Never commit `.env` file, use `.env.example` template

3. **CORS**: Configured for Vercel deployment

4. **Authentication**: JWT tokens expire after 7 days

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules frontend/node_modules
npm install
cd frontend && npm install
```

### Vercel Deployment Issues
```bash
# Check logs
vercel logs

# Redeploy
vercel --prod
```

### Database Connection Issues
1. Verify Supabase credentials in environment variables
2. Check Supabase project is active
3. Ensure SQL schema is properly created

## Scaling Considerations

- **Max concurrent requests**: Limited by Vercel (default 10)
- **Function timeout**: 60 seconds (configurable in vercel.json)
- **Database connections**: Supabase manages pooling
- **Cost**: Starts at $20/month for production (free tier available)

## Next Steps

1. Set up Supabase database
2. Deploy to Vercel
3. Test API endpoints
4. Configure custom domain
5. Set up CI/CD

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Review API responses for errors
