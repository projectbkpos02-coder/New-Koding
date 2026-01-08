// Development server - jalankan API dan proxy ke frontend
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import all API handlers (moved to lib/handlers for Vercel single-function setup)
const auth = require('./lib/handlers/auth');
const categories = require('./lib/handlers/categories');
const products = require('./lib/handlers/products');
const productions = require('./lib/handlers/productions');
const distributions = require('./lib/handlers/distributions');
const riderStock = require('./lib/handlers/rider-stock');
const transactions = require('./lib/handlers/transactions');
const returns = require('./lib/handlers/returns');
const rejects = require('./lib/handlers/rejects');
const stockOpname = require('./lib/handlers/stock-opname');
const gps = require('./lib/handlers/gps');
const users = require('./lib/handlers/users');

// ===========================================
// API ROUTES
// ===========================================

// Auth routes
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);
app.get('/api/auth/me', auth.getMe);
app.put('/api/auth/profile', auth.updateProfile);

// Categories routes
app.get('/api/categories', categories.getCategories);
app.post('/api/categories', categories.createCategory);
app.delete('/api/categories/:id', categories.deleteCategory);

// Products routes
app.get('/api/products', products.getProducts);
app.post('/api/products', products.createProduct);
app.put('/api/products/:id', products.updateProduct);
app.delete('/api/products/:id', products.deleteProduct);

// Productions routes
app.post('/api/productions', productions.createProduction);
app.get('/api/productions', productions.getProductions);

// Distributions routes
app.post('/api/distributions', distributions.createDistribution);
app.get('/api/distributions', distributions.getDistributions);

// Rider Stock routes
app.get('/api/rider-stock', riderStock.getRiderStock);
app.get('/api/rider-stock/:rider_id', riderStock.getRiderStockById);

// Transactions routes
app.post('/api/transactions', transactions.createTransaction);
app.get('/api/transactions', transactions.getTransactions);
app.get('/api/transactions/:id', transactions.getTransactionDetail);

// Returns routes
app.post('/api/returns', returns.createReturn);
app.get('/api/returns', returns.getReturns);
app.put('/api/returns/:return_id/approve', returns.approveReturn);
app.put('/api/returns/:return_id/reject', returns.rejectReturn);

// Rejects routes
app.post('/api/rejects', rejects.createReject);
app.get('/api/rejects', rejects.getRejects);
app.put('/api/rejects/:reject_id/approve', rejects.approveReject);
app.put('/api/rejects/:reject_id/reject', rejects.rejectReject);

// Stock Opname routes
app.post('/api/stock-opname', stockOpname.createStockOpname);
app.get('/api/stock-opname', stockOpname.getStockOpnames);

// GPS routes
app.post('/api/gps', gps.updateGPS);
app.get('/api/gps/:rider_id', gps.getRiderGPS);
app.get('/api/gps/all', gps.getAllRidersGPS);

// Users routes
app.get('/api/users', users.getRiders);
app.get('/api/users/leaderboard', users.getRiderLeaderboard);
app.get('/api/users/reports', users.getUserReports);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if present (production or local build)
const buildPath = path.join(__dirname, 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('/', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ===========================================
// ERROR HANDLING
// ===========================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  ✅ Development Server Running             ║
╠════════════════════════════════════════════╣
║  📱 Frontend: http://localhost:${PORT}      ║
║  🔌 API:     http://localhost:${PORT}/api   ║
║  📊 Health:  http://localhost:${PORT}/api/health ║
╚════════════════════════════════════════════╝
  `);
});
