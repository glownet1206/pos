const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db/database');

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
    const r = await pool.query('SELECT * FROM admins WHERE email=$1 AND password=$2', [email, password]);
    const admin = r.rows[0];
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
    const r = await pool.query('SELECT id,name,email FROM admins WHERE id=$1', [req.admin.id]);
    const admin = r.rows[0];
    if (!admin) { res.clearCookie(ADMIN_COOKIE); return res.status(401).json({ error: 'Not found' }); }
    res.json(admin);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const { name, email, newPassword, currentPassword } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const r = await pool.query('SELECT * FROM admins WHERE id=$1', [req.admin.id]);
    const admin = r.rows[0];
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      if (admin.password !== currentPassword) return res.status(401).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      await pool.query('UPDATE admins SET name=$1,email=$2,password=$3 WHERE id=$4', [name, email, newPassword, admin.id]);
    } else {
      await pool.query('UPDATE admins SET name=$1,email=$2 WHERE id=$3', [name, email, admin.id]);
    }
    const updated = (await pool.query('SELECT id,name,email FROM admins WHERE id=$1', [admin.id])).rows[0];
    const token = jwt.sign({ id: updated.id, email: updated.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(ADMIN_COOKIE, token, COOKIE_OPTS);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id,name,business_name,business_type,email,plan,status,expires_at,created_at FROM users ORDER BY created_at DESC'
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/activate', requireAdmin, async (req, res) => {
  try {
    const { months } = req.body;
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    let expires_at = null;
    let plan = user.plan;

    if (months === 0 || months === '0') {
      plan = 'lifetime';
      expires_at = null;
    } else {
      plan = 'monthly';
      const base = (user.expires_at && new Date(user.expires_at) > new Date())
        ? new Date(user.expires_at) : new Date();
      base.setMonth(base.getMonth() + (parseInt(months) || 1));
      expires_at = base.toISOString();
    }

    await pool.query(
      "UPDATE users SET status='active', plan=$1, expires_at=$2 WHERE id=$3",
      [plan, expires_at, req.params.id]
    );
    res.json({ message: 'User activated', expires_at, plan });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/suspend', requireAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE users SET status='suspended' WHERE id=$1", [req.params.id]);
    res.json({ message: 'User suspended' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/payment', requireAdmin, async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    await pool.query(
      'INSERT INTO payments (user_id,amount,note,activated_by) VALUES ($1,$2,$3,$4)',
      [req.params.id, amount, note || null, req.admin.id]
    );
    res.status(201).json({ message: 'Payment recorded' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users/:id/payments', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM payments WHERE user_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    const uid = req.params.id;

    // Delete all tenant data for this user
    const tenantTables = [
      'sale_items','sales','order_items','orders',
      'spare_parts','tyres','menu_items','products','medicines',
      'supplier_order_items','supplier_orders','suppliers','customers'
    ];
    for (const tbl of tenantTables) {
      await pool.query(`DELETE FROM ${tbl} WHERE user_id=$1`, [uid]).catch(() => {});
    }
    await pool.query('DELETE FROM payments WHERE user_id=$1', [uid]);
    await pool.query('DELETE FROM users WHERE id=$1', [uid]);

    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const total     = (await pool.query('SELECT COUNT(*) as c FROM users')).rows[0];
    const active    = (await pool.query("SELECT COUNT(*) as c FROM users WHERE status='active'")).rows[0];
    const pending   = (await pool.query("SELECT COUNT(*) as c FROM users WHERE status='pending'")).rows[0];
    const suspended = (await pool.query("SELECT COUNT(*) as c FROM users WHERE status='suspended'")).rows[0];
    const revenue   = (await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM payments')).rows[0];
    const byType    = (await pool.query('SELECT business_type, COUNT(*) as count FROM users GROUP BY business_type')).rows;
    res.json({ total: total.c, active: active.c, pending: pending.c, suspended: suspended.c, revenue: revenue.total, byType });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts/revenue', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT to_char(created_at, 'YYYY-MM') as month,
             COALESCE(SUM(amount),0) as revenue,
             COUNT(*) as payments
      FROM payments
      GROUP BY month ORDER BY month DESC LIMIT 6
    `);
    const rows = r.rows.reverse();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const result = rows.map(row => ({
      month: months[parseInt(row.month.split('-')[1]) - 1] + ' ' + row.month.split('-')[0].slice(2),
      revenue: parseFloat(row.revenue),
      payments: parseInt(row.payments),
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts/growth', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*) as newusers
      FROM users GROUP BY month ORDER BY month DESC LIMIT 6
    `);
    const rows = r.rows.reverse();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let cum = 0;
    const result = rows.map(row => {
      cum += parseInt(row.newusers);
      return {
        month: months[parseInt(row.month.split('-')[1]) - 1] + ' ' + row.month.split('-')[0].slice(2),
        newUsers: parseInt(row.newusers),
        total: cum,
      };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/expiring', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id,name,email,business_name,business_type,plan,status,expires_at
      FROM users
      WHERE status='active' AND plan='monthly'
        AND expires_at IS NOT NULL
        AND expires_at::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
      ORDER BY expires_at ASC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/payments/recent', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.id, p.amount, p.note, p.created_at,
             u.name as user_name, u.business_name, u.business_type
      FROM payments p JOIN users u ON p.user_id=u.id
      ORDER BY p.created_at DESC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users/top-revenue', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.id, u.name, u.business_name, u.business_type, u.status,
             COALESCE(SUM(p.amount),0) as total_paid, COUNT(p.id) as payment_count
      FROM users u LEFT JOIN payments p ON p.user_id=u.id
      GROUP BY u.id ORDER BY total_paid DESC LIMIT 5
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts/plans', requireAdmin, async (req, res) => {
  try {
    const r = await pool.query('SELECT plan, COUNT(*) as count FROM users GROUP BY plan');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/mrr', requireAdmin, async (req, res) => {
  try {
    const thisMonth = (await pool.query(`
      SELECT COALESCE(SUM(amount),0) as revenue, COUNT(*) as count
      FROM payments WHERE to_char(created_at,'YYYY-MM') = to_char(NOW(),'YYYY-MM')
    `)).rows[0];
    const lastMonth = (await pool.query(`
      SELECT COALESCE(SUM(amount),0) as revenue
      FROM payments WHERE to_char(created_at,'YYYY-MM') = to_char(NOW() - INTERVAL '1 month','YYYY-MM')
    `)).rows[0];
    const newThisMonth = (await pool.query(`
      SELECT COUNT(*) as count FROM users
      WHERE to_char(created_at,'YYYY-MM') = to_char(NOW(),'YYYY-MM')
    `)).rows[0];
    const churn = (await pool.query("SELECT COUNT(*) as count FROM users WHERE status='suspended'")).rows[0];

    const growth = parseFloat(lastMonth.revenue) > 0
      ? (((parseFloat(thisMonth.revenue) - parseFloat(lastMonth.revenue)) / parseFloat(lastMonth.revenue)) * 100).toFixed(1)
      : null;
    res.json({
      mrr: parseFloat(thisMonth.revenue),
      mrrCount: parseInt(thisMonth.count),
      lastMrr: parseFloat(lastMonth.revenue),
      growth,
      newThisMonth: parseInt(newThisMonth.count),
      suspended: parseInt(churn.count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
