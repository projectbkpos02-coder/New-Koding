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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
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
    if (pathname === '/api/users/leaderboard' && req.method === 'GET') {
      return await users.getRiderLeaderboard(req, res);
    }
    if (pathname === '/api/users/reports' && req.method === 'GET') {
      return await users.getUserReports(req, res);
    }

    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      return res.json({ status: 'ok' });
    }

    // Serve static files and SPA fallback
    // For any non-API path, serve from static or fall back to index.html
    if (!pathname.startsWith('/api/')) {
      try {
        // Try to serve static files
        let filePath;
        if (pathname.startsWith('/static/')) {
          filePath = path.join(__dirname, '..', pathname);
        } else if (pathname === '/' || pathname === '') {
          filePath = path.join(__dirname, '..', 'index.html');
        } else {
          // Try exact file first, then fall back to index.html for SPA routing
          filePath = path.join(__dirname, '..', pathname);
          if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, '..', 'index.html');
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
          }
          return res.send(content);
        }
      } catch (err) {
        console.error('Static file error:', err);
      }
    }

    // 404
    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
