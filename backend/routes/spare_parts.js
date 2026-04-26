const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

router.get('/stats/summary', async (req, res) => {
  try {
    const uid = req.user.id;
    const r   = (await pool.query('SELECT COUNT(*) as total, COALESCE(SUM(stock),0) as totalstock, COALESCE(SUM(price*stock),0) as totalvalue FROM spare_parts WHERE user_id=$1', [uid])).rows[0];
    const low = (await pool.query('SELECT COUNT(*) as count FROM spare_parts WHERE user_id=$1 AND stock <= low_stock_threshold AND stock > 0', [uid])).rows[0];
    const out = (await pool.query('SELECT COUNT(*) as count FROM spare_parts WHERE user_id=$1 AND stock = 0', [uid])).rows[0];
    res.json({ total: parseInt(r.total), totalStock: parseInt(r.totalstock), totalValue: parseFloat(r.totalvalue), lowStock: parseInt(low.count), outOfStock: parseInt(out.count) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const { search, category } = req.query;
    let q = 'SELECT * FROM spare_parts WHERE user_id=$1';
    const p = [uid]; let idx = 2;
    if (category && category !== 'All') { q += ` AND category=$${idx++}`; p.push(category); }
    if (search) { q += ` AND (name ILIKE $${idx} OR brand ILIKE $${idx+1} OR barcode ILIKE $${idx+2})`; p.push(`%${search}%`, `%${search}%`, `%${search}%`); idx += 3; }
    q += ' ORDER BY name';
    res.json((await pool.query(q, p)).rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM spare_parts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const { name, category, brand, price, cost_price, car_type, stock, low_stock_threshold, barcode } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const r = await pool.query(
      'INSERT INTO spare_parts (user_id,name,category,brand,price,cost_price,car_type,stock,low_stock_threshold,barcode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
      [uid, name, category || 'General', brand || null, price, cost_price || 0, car_type || '', stock || 0, low_stock_threshold || 5, barcode || null]
    );
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, brand, price, cost_price, car_type, stock, low_stock_threshold, barcode } = req.body;
    await pool.query(
      'UPDATE spare_parts SET name=$1,category=$2,brand=$3,price=$4,cost_price=$5,car_type=$6,stock=$7,low_stock_threshold=$8,barcode=$9 WHERE id=$10 AND user_id=$11',
      [name, category || 'General', brand || null, price, cost_price || 0, car_type || '', stock || 0, low_stock_threshold || 5, barcode || null, req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM spare_parts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
