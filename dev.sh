#!/bin/bash
# Development server untuk menjalankan frontend + backend

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting POS Rider System Development Server${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file tidak ditemukan!"
    echo "📋 Please create .env file using .env.example as template"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Kill any existing processes on port 3000 and 3001
echo "🔍 Checking ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

# Install root dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install > /dev/null 2>&1 && cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

echo ""
echo -e "${BLUE}Starting servers...${NC}"
echo ""

# Start backend server on port 3001
echo "🚀 Starting Backend API Server (Port 3001)..."
node -e "
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import all route handlers
const auth = require('./api/auth.js');
const categories = require('./api/categories.js');
const products = require('./api/products.js');
const productions = require('./api/productions.js');
const distributions = require('./api/distributions.js');
const riderStock = require('./api/rider-stock.js');
const transactions = require('./api/transactions.js');
const returns = require('./api/returns.js');
const rejects = require('./api/rejects.js');
const stockOpname = require('./api/stock-opname.js');
const gps = require('./api/gps.js');
const users = require('./api/users.js');

// Helper function to parse path parameters
function extractIdFromPath(path, pattern) {
  const match = path.match(pattern);
  return match ? match[1] : null;
}

// Route handlers
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);
app.get('/api/auth/me', auth.getMe);
app.put('/api/auth/profile', auth.updateProfile);

app.get('/api/categories', categories.getCategories);
app.post('/api/categories', categories.createCategory);
app.delete('/api/categories/:id', categories.deleteCategory);

app.get('/api/products', products.getProducts);
app.post('/api/products', products.createProduct);
app.put('/api/products/:id', products.updateProduct);
app.delete('/api/products/:id', products.deleteProduct);

app.post('/api/productions', productions.createProduction);
app.get('/api/productions', productions.getProductions);

app.post('/api/distributions', distributions.createDistribution);
app.get('/api/distributions', distributions.getDistributions);

app.get('/api/rider-stock', riderStock.getRiderStock);
app.get('/api/rider-stock/:rider_id', riderStock.getRiderStockById);

app.post('/api/transactions', transactions.createTransaction);
app.get('/api/transactions', transactions.getTransactions);
app.get('/api/transactions/:id', transactions.getTransactionDetail);

app.post('/api/returns', returns.createReturn);
app.get('/api/returns', returns.getReturns);
app.put('/api/returns/:return_id/approve', returns.approveReturn);
app.put('/api/returns/:return_id/reject', returns.rejectReturn);

app.post('/api/rejects', rejects.createReject);
app.get('/api/rejects', rejects.getRejects);
app.put('/api/rejects/:reject_id/approve', rejects.approveReject);
app.put('/api/rejects/:reject_id/reject', rejects.rejectReject);

app.post('/api/stock-opname', stockOpname.createStockOpname);
app.get('/api/stock-opname', stockOpname.getStockOpnames);

app.post('/api/gps', gps.updateGPS);
app.get('/api/gps/:rider_id', gps.getRiderGPS);
app.get('/api/gps/all', gps.getAllRidersGPS);

app.get('/api/users', users.getRiders);
app.get('/api/users/leaderboard', users.getRiderLeaderboard);
app.get('/api/users/reports', users.getUserReports);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3001, () => {
  console.log('✅ Backend API Server running on http://localhost:3001');
});
" &

BACKEND_PID=\$!

# Wait a moment for backend to start
sleep 2

# Start frontend on port 3000
echo ""
echo "🚀 Starting Frontend Dev Server (Port 3000)..."
echo ""
echo -e "${GREEN}📱 Frontend available at: http://localhost:3000${NC}"
echo -e "${GREEN}🔌 Backend API at: http://localhost:3001/api${NC}"
echo ""

cd frontend && REACT_APP_BACKEND_URL=http://localhost:3001 npm start

# Cleanup on exit
trap "kill \$BACKEND_PID 2>/dev/null" EXIT
