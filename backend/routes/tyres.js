const express = require('express');
const router = express.Router();
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);
const getTable = (businessType) => {
  const map = {
    tyre_shop:     'tyres',
    restaurant:    'menu_items',
    general_store: 'products',
    pharmacy:      'medicines',
  };
  return map[businessType] || 'products';
};
const getSearchCols = (businessType) => {
  const map = {
    tyre_shop:     ['brand', 'model', 'size', 'barcode'],
    restaurant:    ['name', 'category'],
    general_store: ['name', 'brand', 'category', 'barcode'],
    pharmacy:      ['name', 'generic_name', 'company', 'barcode'],
  };
  return map[businessType] || ['name'];
};

router.get('/stats/summary', async (req, res) => {
  try {
    const db = req.db;
    const biz = req.user.business_type;
    const table = getTable(biz);
    const total = await db.getAsync(`SELECT COUNT(*) as total, COALESCE(SUM(stock),0) as totalStock FROM ${table}`);
    let lowStock = { count: 0 }, outOfStock = { count: 0 };
    if (biz !== 'restaurant') {
      lowStock   = await db.getAsync(`SELECT COUNT(*) as count FROM ${table} WHERE stock <= low_stock_threshold AND stock > 0`);
      outOfStock = await db.getAsync(`SELECT COUNT(*) as count FROM ${table} WHERE stock = 0`);
    } else {
      lowStock   = await db.getAsync(`SELECT COUNT(*) as count FROM ${table} WHERE stock <= 10 AND stock > 0`);
      outOfStock = await db.getAsync(`SELECT COUNT(*) as count FROM ${table} WHERE stock = 0`);
    }
    res.json({ total: total.total, totalStock: total.totalStock, lowStock: lowStock.count, outOfStock: outOfStock.count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const table = getTable(req.user.business_type);
    const { type, category, search } = req.query;
    let query = `SELECT * FROM ${table} WHERE 1=1`;
    const params = [];

    if (type && type !== 'All') { query += ' AND type = ?'; params.push(type); }
    if (category && category !== 'All') { query += ' AND category = ?'; params.push(category); }

    if (search) {
      const cols = getSearchCols(req.user.business_type);
      query += ' AND (' + cols.map(c => `${c} LIKE ?`).join(' OR ') + ')';
      cols.forEach(() => params.push(`%${search}%`));
    }

    query += ' ORDER BY ' + (req.user.business_type === 'tyre_shop' ? 'brand, model' : 'name');
    res.json(await db.allAsync(query, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const table = getTable(req.user.business_type);
    const item = await req.db.getAsync(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = req.db;
    const table = getTable(req.user.business_type);
    const data = req.body;
    const keys = Object.keys(data).filter(k => data[k] !== '' && data[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No data provided' });

    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
    const result = await db.runAsync(sql, keys.map(k => data[k]));
    res.status(201).json({ id: result.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const db = req.db;
    const table = getTable(req.user.business_type);
    const data = req.body;
    const keys = Object.keys(data).filter(k => k !== 'id');
    const sql = `UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`;
    await db.runAsync(sql, [...keys.map(k => data[k]), req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const table = getTable(req.user.business_type);
    await req.db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
