// Vercel Serverless Function Router
// This file routes all API requests to appropriate handlers
// and serves static frontend files as a fallback (SPA)

const fs = require('fs');
const path = require('path');
const auth = require('../lib/handlers/auth');
const categories = require('../lib/handlers/categories');
const products = require('../lib/handlers/products');
const productions = require('../lib/handlers/productions');
const distributions = require('../lib/handlers/distributions');
const riderStock = require('../lib/handlers/rider-stock');
const transactions = require('../lib/handlers/transactions');
const returns = require('../lib/handlers/returns');
const rejects = require('../lib/handlers/rejects');
const stockOpname = require('../lib/handlers/stock-opname');
const gps = require('../lib/handlers/gps');
const users = require('../lib/handlers/users');

// Helper to send JSON
function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Health check with env var status
async function healthCheck(req, res) {
  sendJSON(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing',
      supabase_key: process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      jwt_secret: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
      frontend_url: process.env.FRONTEND_URL || 'Not set (using default)',
    }
  });
}

module.exports = async (req, res) => {
  // Debug: log root directory contents on first call
  if (!global.debugLogged) {
    global.debugLogged = true;
    const rootDir = path.dirname(__dirname);
    try {
      const files = fs.readdirSync(rootDir);
      console.log(`[INIT] Root dir: ${rootDir}`);
      console.log(`[INIT] Files: ${files.join(', ')}`);
    } catch (e) {
      console.log(`[INIT] Error listing root: ${e.message}`);
    }
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const { pathname, query } = new URL(req.url, `http://${req.headers.host}`);

  try {
    // Auth routes
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      return await auth.register(req, res);
    }
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      return await auth.login(req, res);
    }
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      return await auth.getMe(req, res);
    }
    if (pathname === '/api/auth/profile' && req.method === 'PUT') {
      return await auth.updateProfile(req, res);
    }
    if (pathname === '/api/auth/create-test-user' && req.method === 'POST') {
      return await auth.createTestUser(req, res);
    }

    // Categories routes
    if (pathname === '/api/categories' && req.method === 'GET') {
      return await categories.getCategories(req, res);
    }
    if (pathname === '/api/categories' && req.method === 'POST') {
      return await categories.createCategory(req, res);
    }
    if (pathname.match(/^\/api\/categories\/[^/]+$/) && req.method === 'DELETE') {
      const id = pathname.split('/').pop();
      req.params = { id };
      return await categories.deleteCategory(req, res);
    }

    // Products routes
    if (pathname === '/api/products' && req.method === 'GET') {
      return await products.getProducts(req, res);
    }
    if (pathname === '/api/products' && req.method === 'POST') {
      return await products.createProduct(req, res);
    }
    if (pathname.match(/^\/api\/products\/[^/]+$/) && req.method === 'PUT') {
      const id = pathname.split('/').pop();
      req.params = { id };
      return await products.updateProduct(req, res);
    }
    if (pathname.match(/^\/api\/products\/[^/]+$/) && req.method === 'DELETE') {
      const id = pathname.split('/').pop();
      req.params = { id };
      return await products.deleteProduct(req, res);
    }

    // Productions routes
    if (pathname === '/api/productions' && req.method === 'POST') {
      return await productions.createProduction(req, res);
    }
    if (pathname === '/api/productions' && req.method === 'GET') {
      return await productions.getProductions(req, res);
    }

    // Distributions routes
    if (pathname === '/api/distributions' && req.method === 'POST') {
      return await distributions.createDistribution(req, res);
    }
    if (pathname === '/api/distributions' && req.method === 'GET') {
      return await distributions.getDistributions(req, res);
    }

    // Rider Stock routes
    if (pathname === '/api/rider-stock' && req.method === 'GET') {
      return await riderStock.getRiderStock(req, res);
    }
    if (pathname.match(/^\/api\/rider-stock\/[^/]+$/) && req.method === 'GET') {
      const rider_id = pathname.split('/').pop();
      req.params = { rider_id };
      return await riderStock.getRiderStockById(req, res);
    }

    // Transactions routes
    if (pathname === '/api/transactions' && req.method === 'POST') {
      return await transactions.createTransaction(req, res);
    }
    if (pathname === '/api/transactions' && req.method === 'GET') {
      return await transactions.getTransactions(req, res);
    }
    if (pathname.match(/^\/api\/transactions\/[^/]+$/) && req.method === 'GET') {
      const id = pathname.split('/').pop();
      req.params = { id };
      return await transactions.getTransactionDetail(req, res);
    }

    // Returns routes
    if (pathname === '/api/returns' && req.method === 'POST') {
      return await returns.createReturn(req, res);
    }
    if (pathname === '/api/returns' && req.method === 'GET') {
      return await returns.getReturns(req, res);
    }
    if (pathname.match(/^\/api\/returns\/[^/]+\/approve$/) && req.method === 'PUT') {
      const return_id = pathname.split('/')[3];
      req.params = { return_id };
      return await returns.approveReturn(req, res);
    }
    if (pathname.match(/^\/api\/returns\/[^/]+\/reject$/) && req.method === 'PUT') {
      const return_id = pathname.split('/')[3];
      req.params = { return_id };
      return await returns.rejectReturn(req, res);
    }

    // Rejects routes
    if (pathname === '/api/rejects' && req.method === 'POST') {
      return await rejects.createReject(req, res);
    }
    if (pathname === '/api/rejects' && req.method === 'GET') {
      return await rejects.getRejects(req, res);
    }
    if (pathname.match(/^\/api\/rejects\/[^/]+\/approve$/) && req.method === 'PUT') {
      const reject_id = pathname.split('/')[3];
      req.params = { reject_id };
      return await rejects.approveReject(req, res);
    }
    if (pathname.match(/^\/api\/rejects\/[^/]+\/reject$/) && req.method === 'PUT') {
      const reject_id = pathname.split('/')[3];
      req.params = { reject_id };
      return await rejects.rejectReject(req, res);
    }

    // Stock Opname routes
    if (pathname === '/api/stock-opname' && req.method === 'POST') {
      return await stockOpname.createStockOpname(req, res);
    }
    if (pathname === '/api/stock-opname' && req.method === 'GET') {
      return await stockOpname.getStockOpnames(req, res);
    }

    // GPS routes
    if (pathname === '/api/gps' && req.method === 'POST') {
      return await gps.updateGPS(req, res);
    }
    if (pathname.match(/^\/api\/gps\/[^/]+$/) && req.method === 'GET') {
      const rider_id = pathname.split('/').pop();
      req.params = { rider_id };
      return await gps.getRiderGPS(req, res);
    }
    if (pathname === '/api/gps/all' && req.method === 'GET') {
      return await gps.getAllRidersGPS(req, res);
    }

    // Users/Riders routes
    if (pathname === '/api/users' && req.method === 'GET') {
      return await users.getRiders(req, res);
    }
    if (pathname === '/api/users/riders' && req.method === 'GET') {
      // Alias for /api/users
      return await users.getRiders(req, res);
    }
    if (pathname === '/api/users/leaderboard' && req.method === 'GET') {
      return await users.getRiderLeaderboard(req, res);
    }
    if (pathname === '/api/users/reports' && req.method === 'GET') {
      return await users.getUserReports(req, res);
    }

    // Reports routes
    if (pathname === '/api/reports/summary' && req.method === 'GET') {
      return await users.getUserReports(req, res);
    }
    if (pathname === '/api/reports/leaderboard' && req.method === 'GET') {
      return await users.getRiderLeaderboard(req, res);
    }

    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      return await healthCheck(req, res);
    }

    // Serve static files and SPA fallback
    // For any non-API path, serve from public/ directory
    if (!pathname.startsWith('/api/')) {
      try {
        // Files are in ../public/ relative to /var/task/api/index.js
        const publicDir = path.join(__dirname, '..', 'public');
        let filePath;
        if (pathname.startsWith('/static/')) {
          filePath = path.join(publicDir, pathname);
        } else if (pathname === '/' || pathname === '') {
          filePath = path.join(publicDir, 'index.html');
        } else {
          // Try exact file first, then fall back to index.html for SPA routing
          filePath = path.join(publicDir, pathname);
          if (!fs.existsSync(filePath)) {
            filePath = path.join(publicDir, 'index.html');
          }
        }

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          // Set appropriate content-type headers
          if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
          } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
          } else if (filePath.endsWith('.map')) {
            res.setHeader('Content-Type', 'application/json');
          }
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.end(content);
        }
      } catch (err) {
        console.error('Static file error:', err);
      }
    }

    // 404
    return sendJSON(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return sendJSON(res, 500, { error: 'Internal server error', message: error.message });
  }
};
