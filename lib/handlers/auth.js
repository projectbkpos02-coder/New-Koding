const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const createAccessToken = (userId, expiresIn = '7d') => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const authenticateUser = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw { status: 401, message: 'No authorization token' };
  }

  try {
    const payload = verifyToken(token);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !data) {
      throw { status: 401, message: 'User not found' };
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', payload.sub)
      .single();

    return { ...data, role: roleData?.role || 'rider' };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 401, message: 'Invalid token' };
  }
};

// Register endpoint
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    let { role = 'rider' } = req.body || {};

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine creator (if any). Only authenticated admin/super_admin can create users.
    let creator = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        creator = await authenticateUser(req);
      }
    } catch (e) {
      // invalid token -> treat as anonymous
      creator = null;
    }

    if (!creator) {
      // No authenticated creator -> registration via UI is disabled
      return res.status(403).json({ error: 'Registrasi dinonaktifkan. Hubungi superadmin/admin untuk menambah pengguna.' });
    }

    // Role assignment rules:
    // - super_admin can create admin or rider (and super_admin if desired)
    // - admin can only create rider
    if (creator.role === 'admin') {
      role = 'rider';
    }
    if (role === 'super_admin' && creator.role !== 'super_admin') {
      return res.status(403).json({ error: 'Hanya super admin yang dapat membuat super admin baru.' });
    }

    // Check if email exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name,
        phone,
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        id: uuidv4(),
        user_id: userId,
        role,
      });

    if (roleError) throw roleError;

    const token = createAccessToken(userId);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: userId,
        email,
        full_name,
        phone,
        role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Registration failed' });
  }
};

// Login endpoint
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('User lookup failed:', { email, error: error?.message });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Support both bcrypt hashes and Supabase auth placeholders
    let isValidPassword = false;
    if (user.password_hash === 'supabase_auth') {
      // For users created via Supabase auth, verify using Supabase
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        isValidPassword = !authError && !!authData.user;
      } catch (e) {
        isValidPassword = false;
      }
    } else if (user.password_hash && user.password_hash.startsWith('$2')) {
      // For bcrypt hashes, use local verification
      isValidPassword = await verifyPassword(password, user.password_hash);
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const token = createAccessToken(user.id);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: roleData?.role || 'rider',
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal mengambil profil' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { full_name, phone, avatar_url } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (avatar_url) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 0) {
      return res.json({ message: 'No updates provided' });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal mengubah profil' });
  }
};

// Debug endpoint - create test user (remove in production)
exports.createTestUser = async (req, res) => {
  try {
    const hashedPassword = await hashPassword('password123');
    const userId = uuidv4();

    // Check if test user exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'test@test.com')
      .single();

    if (existing) {
      return res.json({ 
        message: 'Test user already exists',
        email: 'test@test.com',
        password: 'password123'
      });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'test@test.com',
        full_name: 'Test User',
        phone: '08123456789',
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        id: uuidv4(),
        user_id: userId,
        role: 'admin',
      });

    if (roleError) throw roleError;

    res.json({
      message: 'Test user created successfully',
      email: 'test@test.com',
      password: 'password123',
      role: 'admin'
    });
  } catch (error) {
    console.error('Create test user error:', error);
    res.status(500).json({ error: error.message || 'Failed to create test user' });
  }
};

exports.authenticateUser = authenticateUser;
