const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

const getTable = (biz) => ({ tyre_shop: 'tyres', restaurant: 'menu_items', general_store: 'products', pharmacy: 'medicines' }[biz] || 'products');

const getSearchCols = (biz) => ({
  tyre_shop:     ['brand', 'model', 'size', 'barcode'],
  restaurant:    ['name', 'category'],
  general_store: ['name', 'brand', 'category', 'barcode'],
  pharmacy:      ['name', 'generic_name', 'company', 'barcode'],
}[biz] || ['name']);

router.get('/stats/summary', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const table = getTable(biz);
    let total, lowStock = { count: 0 }, outOfStock = { count: 0 };

    if (biz === 'restaurant') {
      total = (await pool.query(`SELECT COUNT(*) as total, 0 as totalstock FROM ${table} WHERE user_id=$1`, [uid])).rows[0];
      outOfStock = (await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE user_id=$1 AND available=0`, [uid])).rows[0];
    } else {
      total      = (await pool.query(`SELECT COUNT(*) as total, COALESCE(SUM(stock),0) as totalstock FROM ${table} WHERE user_id=$1`, [uid])).rows[0];
      lowStock   = (await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE user_id=$1 AND stock <= low_stock_threshold AND stock > 0`, [uid])).rows[0];
      outOfStock = (await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE user_id=$1 AND stock = 0`, [uid])).rows[0];
    }
    res.json({ total: parseInt(total.total), totalStock: parseInt(total.totalstock), lowStock: parseInt(lowStock.count), outOfStock: parseInt(outOfStock.count) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const table = getTable(req.user.business_type);
    const { type, category, search } = req.query;
    let query = `SELECT * FROM ${table} WHERE user_id=$1`;
    const params = [uid];
    let idx = 2;

    if (type && type !== 'All') { query += ` AND type = $${idx++}`; params.push(type); }
    if (category && category !== 'All') { query += ` AND category = $${idx++}`; params.push(category); }

    if (search) {
      const cols = getSearchCols(req.user.business_type);
      query += ' AND (' + cols.map(c => `${c} ILIKE $${idx++}`).join(' OR ') + ')';
      cols.forEach(() => params.push(`%${search}%`));
    }

    query += ' ORDER BY ' + (req.user.business_type === 'tyre_shop' ? 'brand, model' : 'name');
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const table = getTable(req.user.business_type);
    const r = await pool.query(`SELECT * FROM ${table} WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const table = getTable(req.user.business_type);
    const data = { ...req.body, user_id: uid };
    const keys = Object.keys(data).filter(k => data[k] !== '' && data[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No data provided' });

    let i = 1;
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => `$${i++}`).join(',')}) RETURNING id`;
    const r = await pool.query(sql, keys.map(k => data[k]));
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const uid = req.user.id;
    const table = getTable(req.user.business_type);
    const data = req.body;
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'user_id');
    let i = 1;
    const sql = `UPDATE ${table} SET ${keys.map(k => `${k}=$${i++}`).join(',')} WHERE id=$${i++} AND user_id=$${i++}`;
    await pool.query(sql, [...keys.map(k => data[k]), req.params.id, uid]);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const table = getTable(req.user.business_type);
    await pool.query(`DELETE FROM ${table} WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
