# POS Rider System - 100% Vercel Ready

A fully serverless POS (Point of Sale) and rider management system built with React, Node.js, and Supabase. **Zero Python, Zero VPS required!**

## ✨ Features

- 🔐 **Authentication** - JWT-based user authentication
- 📦 **Product Management** - Manage products and categories
- 🚚 **Distribution** - Distribute products to riders
- 📱 **POS System** - Sales transactions
- 🔄 **Returns & Rejects** - Handle product returns and damages
- 📊 **Stock Management** - Track inventory and stock opname
- 📍 **GPS Tracking** - Real-time rider location tracking
- 👥 **Role-Based Access** - Admin, Super Admin, and Rider roles
- 📈 **Reports & Analytics** - Sales reports and leaderboard

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd New-Koding
chmod +x setup.sh
./setup.sh
```

### 2. Configure Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`
4. Run SQL schema from `backend/database_schema.sql`

### 3. Set Environment Variables

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel link
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET
vercel deploy --prod
```

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [API Endpoints](./DEPLOYMENT.md#api-endpoints) - Full API reference
- [Database Schema](./backend/database_schema.sql) - Database structure

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend                   │
│    (Vercel Deployment)                  │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  Vercel Functions  │
         │  (Node.js API)     │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │   Supabase         │
         │  (PostgreSQL)      │
         └────────────────────┘
```

## 🔧 Tech Stack

- **Frontend**: React 19, TailwindCSS, Radix UI
- **Backend**: Node.js Serverless (Vercel Functions)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **Hosting**: Vercel (Frontend + API)

## 📝 API Structure

All API endpoints use `/api/` prefix:

```
GET    /api/products          - List products
POST   /api/products          - Create product (admin)
GET    /api/transactions      - List sales
POST   /api/transactions      - Create sale
GET    /api/rider-stock       - Get rider inventory
POST   /api/distributions     - Distribute stock (admin)
GET    /api/returns           - List returns
POST   /api/returns           - Request return
... and more
```

See [DEPLOYMENT.md](./DEPLOYMENT.md#api-endpoints) for complete endpoint list.

## 🗄️ Database

Uses Supabase (PostgreSQL) with tables for:
- Users & Roles
- Products & Categories
- Rider Stock
- Transactions
- Returns & Rejects
- Distributions
- GPS Tracking
- And more...

## 🔐 Authentication

- Uses JWT tokens
- Tokens expire after 7 days
- Environment variable: `JWT_SECRET`
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 📊 Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-min-32-chars
FRONTEND_URL=https://your-domain.vercel.app
REACT_APP_BACKEND_URL=/api  # For production
```

## 🧪 Local Development

```bash
# Install dependencies
npm install && cd frontend && npm install

# Start development server
npm start

# Backend: http://localhost:3000
# Frontend: http://localhost:3000
```

## 📦 Deployment Checklist

- [ ] Set up Supabase project
- [ ] Run database schema SQL
- [ ] Create .env with credentials
- [ ] Install dependencies
- [ ] Deploy to Vercel
- [ ] Add environment variables to Vercel
- [ ] Test API endpoints
- [ ] Verify database connectivity

## 🐛 Troubleshooting

**Build fails?**
```bash
rm -rf node_modules frontend/node_modules
npm install && cd frontend && npm install
```

**API not working?**
- Check Vercel logs: `vercel logs`
- Verify Supabase credentials
- Check database tables exist

**CORS issues?**
- Configured in vercel.json
- Update FRONTEND_URL environment variable

## 💡 Next Steps

1. ✅ Deploy backend API
2. ✅ Deploy frontend
3. Set up CI/CD pipeline
4. Configure custom domain
5. Set up monitoring
6. Add more features

## 📄 License

MIT

## 👨‍💻 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- Review API documentation in code
- Check Vercel and Supabase dashboards for logs

---

**Built with ❤️ for serverless deployment**
