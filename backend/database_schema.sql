-- =====================================================
-- POS RIDER SYSTEM - DATABASE SCHEMA
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'rider', -- rider, admin, super_admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 3. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    stock_in_warehouse INTEGER NOT NULL DEFAULT 0,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    min_stock INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RIDER STOCK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rider_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rider_id, product_id)
);

-- =====================================================
-- 6. PRODUCTIONS TABLE (Stock additions to warehouse)
-- =====================================================
CREATE TABLE IF NOT EXISTS productions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    admin_id UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. DISTRIBUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    admin_id UUID REFERENCES profiles(id),
    notes TEXT,
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'tunai',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. TRANSACTION ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. RETURNS TABLE (Pending return requests)
-- =====================================================
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES profiles(id),
    returned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 11. RETURN HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS return_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,
    approved_by UUID REFERENCES profiles(id),
    returned_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. REJECTS TABLE (Pending reject requests - damaged products)
-- =====================================================
CREATE TABLE IF NOT EXISTS rejects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 13. REJECT HISTORY TABLE (Loss calculation)
-- =====================================================
CREATE TABLE IF NOT EXISTS reject_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 14. STOCK OPNAME TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_opname (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id),
    total_sales DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 15. GPS LOCATIONS TABLE (1 per rider - updates replace old)
-- =====================================================
CREATE TABLE IF NOT EXISTS gps_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_rider_stock_rider_id ON rider_stock(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_stock_product_id ON rider_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_distributions_rider_id ON distributions(rider_id);
CREATE INDEX IF NOT EXISTS idx_distributions_distributed_at ON distributions(distributed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_rider_id ON transactions(rider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_returns_rider_id ON returns(rider_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_rejects_status ON rejects(status);
CREATE INDEX IF NOT EXISTS idx_stock_opname_rider_id ON stock_opname(rider_id);
CREATE INDEX IF NOT EXISTS idx_stock_opname_created_at ON stock_opname(created_at);

-- =====================================================
-- DISABLE RLS FOR SIMPLICITY (Using API authentication)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reject_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations via service role / anon key
CREATE POLICY "Allow all for profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for user_roles" ON user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for rider_stock" ON rider_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for productions" ON productions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for distributions" ON distributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transaction_items" ON transaction_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for returns" ON returns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for return_history" ON return_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for rejects" ON rejects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for reject_history" ON reject_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for stock_opname" ON stock_opname FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for gps_locations" ON gps_locations FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- INSERT DEFAULT SUPER ADMIN
-- Password: admin123 (hashed with bcrypt)
-- =====================================================
INSERT INTO profiles (id, email, full_name, phone, password_hash, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'superadmin@pos.com',
    'Super Admin',
    '08123456789',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.gBZPJHJB.K1cGi',
    NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (id, user_id, role)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'super_admin'
) ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- INSERT SAMPLE CATEGORIES
-- =====================================================
INSERT INTO categories (id, name, created_at) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Minuman', NOW()),
    ('c0000000-0000-0000-0000-000000000002', 'Makanan', NOW()),
    ('c0000000-0000-0000-0000-000000000003', 'Add On', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Database schema created successfully!
-- Default Super Admin:
-- Email: superadmin@pos.com
-- Password: admin123
