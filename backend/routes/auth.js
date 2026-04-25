const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { masterDb, getTenantDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tt_secret_key_2025';
const COOKIE_NAME = 'tt_token';
const COOKIE_OPTS = {
  httpOnly: true, sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
};

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    req.db = getTenantDb(req.user.id, req.user.business_type);
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired' });
  }
}

async function requireActive(req, res, next) {
  try {
    const user = await masterDb.getAsync('SELECT status, plan, expires_at FROM users WHERE id=?', [req.user.id]);
    if (!user || user.status === 'pending') return res.status(403).json({ error: 'subscription_pending' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'subscription_suspended' });
    if (user.plan === 'monthly' && user.expires_at) {
      if (new Date(user.expires_at) < new Date()) {
        await masterDb.runAsync("UPDATE users SET status='suspended' WHERE id=?", [req.user.id]);
        return res.status(403).json({ error: 'subscription_expired' });
      }
    }
    next();
  } catch (e) { console.error('[requireActive]', e.message); res.status(500).json({ error: e.message }); }
}

router.post('/register', async (req, res) => {
  try {
    const { name, business_name, business_type, email, password, plan } = req.body;
    if (!name || !email || !password || !business_type)
      return res.status(400).json({ error: 'Name, email, password and business type required' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const validTypes = ['tyre_shop', 'restaurant', 'general_store', 'pharmacy'];
    if (!validTypes.includes(business_type))
      return res.status(400).json({ error: 'Invalid business type' });

    const existing = await masterDb.getAsync('SELECT id FROM users WHERE email=?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const selectedPlan = plan === 'lifetime' ? 'lifetime' : 'monthly';

    const result = await masterDb.runAsync(
      'INSERT INTO users (name,business_name,business_type,email,password,plan,status) VALUES (?,?,?,?,?,?,?)',
      [name, business_name || null, business_type, email, password, selectedPlan, 'pending']
    );

    getTenantDb(result.lastID, business_type);

    res.status(201).json({
      message: 'Registration successful. Your account is pending activation by admin.',
      id: result.lastID, name, business_name, business_type, plan: selectedPlan, status: 'pending'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await masterDb.getAsync('SELECT * FROM users WHERE email=? AND password=?', [email, password]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.status === 'pending') return res.status(403).json({ error: 'subscription_pending', message: 'Your account is pending activation. Please contact admin.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'subscription_suspended', message: 'Your subscription has expired. Please renew to continue.' });
    if (user.plan === 'monthly' && user.expires_at && new Date(user.expires_at) < new Date()) {
      await masterDb.runAsync("UPDATE users SET status='suspended' WHERE id=?", [user.id]);
      return res.status(403).json({ error: 'subscription_expired', message: 'Your monthly subscription has expired. Please renew.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, business_type: user.business_type },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    res.json({
      id: user.id, name: user.name, business_name: user.business_name,
      business_type: user.business_type, plan: user.plan,
      status: user.status, expires_at: user.expires_at, email: user.email
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await masterDb.getAsync(
      'SELECT id,name,business_name,business_type,email,plan,status,expires_at FROM users WHERE id=?',
      [req.user.id]
    );
    if (!user) { res.clearCookie(COOKIE_NAME); return res.status(401).json({ error: 'User not found' }); }
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await masterDb.getAsync(
      'SELECT id,name,business_name,business_type,email,plan,status,expires_at FROM users WHERE id=?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, business_name, email, newPassword, currentPassword, phone, address } = req.body;
    const user = await masterDb.getAsync('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (newPassword) {
      if (user.password !== currentPassword) return res.status(401).json({ error: 'Current password is incorrect' });
      await masterDb.runAsync('UPDATE users SET name=?,business_name=?,email=?,password=?,phone=?,address=? WHERE id=?',
        [name, business_name, email, newPassword, phone||null, address||null, user.id]);
    } else {
      await masterDb.runAsync('UPDATE users SET name=?,business_name=?,email=?,phone=?,address=? WHERE id=?',
        [name, business_name, email, phone||null, address||null, user.id]);
    }
    const updated = await masterDb.getAsync(
      'SELECT id,name,business_name,business_type,email,plan,status,expires_at,phone,address FROM users WHERE id=?',
      [user.id]
    );
    const token = jwt.sign({ id: updated.id, email: updated.email, business_type: updated.business_type }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireActive = requireActive;
