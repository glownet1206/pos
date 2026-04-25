const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { masterDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tt_secret_key_2025';
const ADMIN_COOKIE = 'tt_admin_token';
const COOKIE_OPTS = {
  httpOnly: true, sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
};

function requireAdmin(req, res, next) {
  const token = req.cookies[ADMIN_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie(ADMIN_COOKIE);
    return res.status(401).json({ error: 'Session expired' });
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await masterDb.getAsync('SELECT * FROM admins WHERE email=? AND password=?', [email, password]);
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(ADMIN_COOKIE, token, COOKIE_OPTS);
    res.json({ id: admin.id, name: admin.name, email: admin.email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, async (req, res) => {
  try {
    const admin = await masterDb.getAsync('SELECT id,name,email FROM admins WHERE id=?', [req.admin.id]);
    if (!admin) { res.clearCookie(ADMIN_COOKIE); return res.status(401).json({ error: 'Not found' }); }
    res.json(admin);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const { name, email, newPassword, currentPassword } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const admin = await masterDb.getAsync('SELECT * FROM admins WHERE id=?', [req.admin.id]);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      if (admin.password !== currentPassword) return res.status(401).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      await masterDb.runAsync('UPDATE admins SET name=?,email=?,password=? WHERE id=?', [name, email, newPassword, admin.id]);
    } else {
      await masterDb.runAsync('UPDATE admins SET name=?,email=? WHERE id=?', [name, email, admin.id]);
    }
    const updated = await masterDb.getAsync('SELECT id,name,email FROM admins WHERE id=?', [admin.id]);
    const token = jwt.sign({ id: updated.id, email: updated.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(ADMIN_COOKIE, token, COOKIE_OPTS);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await masterDb.allAsync(
      'SELECT id,name,business_name,business_type,email,plan,status,expires_at,created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/activate', requireAdmin, async (req, res) => {
  try {
    const { months } = req.body;
    const user = await masterDb.getAsync('SELECT * FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let expires_at = null;
    let plan = user.plan;

    if (months === 0 || months === '0') {
      plan = 'lifetime';
      expires_at = null;
    } else {
      plan = 'monthly';
      const base = (user.expires_at && new Date(user.expires_at) > new Date())
        ? new Date(user.expires_at)
        : new Date();
      base.setMonth(base.getMonth() + (parseInt(months) || 1));
      expires_at = base.toISOString();
    }

    await masterDb.runAsync(
      "UPDATE users SET status='active', plan=?, expires_at=? WHERE id=?",
      [plan, expires_at, req.params.id]
    );
    res.json({ message: 'User activated', expires_at, plan });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/suspend', requireAdmin, async (req, res) => {
  try {
    await masterDb.runAsync("UPDATE users SET status='suspended' WHERE id=?", [req.params.id]);
    res.json({ message: 'User suspended' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/payment', requireAdmin, async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    await masterDb.runAsync(
      'INSERT INTO payments (user_id,amount,note,activated_by) VALUES (?,?,?,?)',
      [req.params.id, amount, note || null, req.admin.id]
    );
    res.status(201).json({ message: 'Payment recorded' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users/:id/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await masterDb.allAsync(
      'SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(payments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await masterDb.getAsync('SELECT * FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await masterDb.runAsync('DELETE FROM payments WHERE user_id=?', [req.params.id]);
    await masterDb.runAsync('DELETE FROM users WHERE id=?', [req.params.id]);

    const path = require('path');
    const fs = require('fs');
    const dbPath = path.join(__dirname, `../db/tenants/user_${req.params.id}.db`);
    try { fs.unlinkSync(dbPath); } catch (_) {}
    try { fs.unlinkSync(dbPath + '-shm'); } catch (_) {}
    try { fs.unlinkSync(dbPath + '-wal'); } catch (_) {}
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const total     = await masterDb.getAsync('SELECT COUNT(*) as c FROM users');
    const active    = await masterDb.getAsync("SELECT COUNT(*) as c FROM users WHERE status='active'");
    const pending   = await masterDb.getAsync("SELECT COUNT(*) as c FROM users WHERE status='pending'");
    const suspended = await masterDb.getAsync("SELECT COUNT(*) as c FROM users WHERE status='suspended'");
    const revenue   = await masterDb.getAsync('SELECT COALESCE(SUM(amount),0) as total FROM payments');
    const byType    = await masterDb.allAsync('SELECT business_type, COUNT(*) as count FROM users GROUP BY business_type');
    res.json({ total: total.c, active: active.c, pending: pending.c, suspended: suspended.c, revenue: revenue.total, byType });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts/revenue', requireAdmin, async (req, res) => {
  try {
    const rows = await masterDb.allAsync(`
      SELECT strftime('%Y-%m', created_at) as month,
             COALESCE(SUM(amount),0) as revenue,
             COUNT(*) as payments
      FROM payments
      GROUP BY month ORDER BY month DESC LIMIT 6
    `);
    rows.reverse();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const result = rows.map(r => ({
      month: months[parseInt(r.month.split('-')[1]) - 1] + ' ' + r.month.split('-')[0].slice(2),
      revenue: parseFloat(r.revenue),
      payments: r.payments,
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts/growth', requireAdmin, async (req, res) => {
  try {
    const rows = await masterDb.allAsync(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as newUsers
      FROM users GROUP BY month ORDER BY month DESC LIMIT 6
    `);
    rows.reverse();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let cum = 0;
    const result = rows.map(r => {
      cum += r.newUsers;
      return {
        month: months[parseInt(r.month.split('-')[1]) - 1] + ' ' + r.month.split('-')[0].slice(2),
        newUsers: r.newUsers,
        total: cum,
      };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/expiring', requireAdmin, async (req, res) => {
  try {
    const rows = await masterDb.allAsync(`
      SELECT id,name,email,business_name,business_type,plan,status,expires_at
      FROM users
      WHERE status='active' AND plan='monthly'
        AND expires_at IS NOT NULL
        AND DATE(expires_at) BETWEEN DATE('now') AND DATE('now','+30 days')
      ORDER BY expires_at ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/payments/recent', requireAdmin, async (req, res) => {
  try {
    const rows = await masterDb.allAsync(`
      SELECT p.id, p.amount, p.note, p.created_at,
             u.name as user_name, u.business_name, u.business_type
      FROM payments p JOIN users u ON p.user_id=u.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users/top-revenue', requireAdmin, async (req, res) => {
  try {
    const rows = await masterDb.allAsync(`
      SELECT u.id, u.name, u.business_name, u.business_type, u.status,
             COALESCE(SUM(p.amount),0) as total_paid, COUNT(p.id) as payment_count
      FROM users u LEFT JOIN payments p ON p.user_id=u.id
      GROUP BY u.id ORDER BY total_paid DESC LIMIT 5
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts/plans', requireAdmin, async (req, res) => {
  try {
    const rows = await masterDb.allAsync(`SELECT plan, COUNT(*) as count FROM users GROUP BY plan`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/mrr', requireAdmin, async (req, res) => {
  try {
    const thisMonth = await masterDb.getAsync(`
      SELECT COALESCE(SUM(amount),0) as revenue, COUNT(*) as count
      FROM payments WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m','now')
    `);
    const lastMonth = await masterDb.getAsync(`
      SELECT COALESCE(SUM(amount),0) as revenue
      FROM payments WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m','now','-1 month')
    `);
    const newThisMonth = await masterDb.getAsync(`
      SELECT COUNT(*) as count FROM users
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m','now')
    `);
    const churnThisMonth = await masterDb.getAsync(`
      SELECT COUNT(*) as count FROM users WHERE status='suspended'
    `);
    const growth = lastMonth.revenue > 0
      ? (((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100).toFixed(1)
      : null;
    res.json({
      mrr: parseFloat(thisMonth.revenue),
      mrrCount: thisMonth.count,
      lastMrr: parseFloat(lastMonth.revenue),
      growth,
      newThisMonth: newThisMonth.count,
      suspended: churnThisMonth.count,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
