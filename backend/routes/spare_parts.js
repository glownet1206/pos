const express = require('express');
const router = express.Router();
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

router.get('/stats/summary', async (req, res) => {
  try {
    const r = await req.db.getAsync('SELECT COUNT(*) as total, COALESCE(SUM(stock),0) as totalStock, COALESCE(SUM(price*stock),0) as totalValue FROM spare_parts');
    const low = await req.db.getAsync('SELECT COUNT(*) as count FROM spare_parts WHERE stock <= low_stock_threshold AND stock > 0');
    const out = await req.db.getAsync('SELECT COUNT(*) as count FROM spare_parts WHERE stock = 0');
    res.json({ total: r.total, totalStock: r.totalStock, totalValue: r.totalValue, lowStock: low.count, outOfStock: out.count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let q = 'SELECT * FROM spare_parts WHERE 1=1';
    const p = [];
    if (category && category !== 'All') { q += ' AND category=?'; p.push(category); }
    if (search) { q += ' AND (name LIKE ? OR brand LIKE ? OR barcode LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ' ORDER BY name';
    const rows = await req.db.allAsync(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await req.db.getAsync('SELECT * FROM spare_parts WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, brand, price, stock, low_stock_threshold, barcode } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const r = await req.db.runAsync(
      'INSERT INTO spare_parts (name,category,brand,price,stock,low_stock_threshold,barcode) VALUES (?,?,?,?,?,?,?)',
      [name, category||'General', brand||null, price, stock||0, low_stock_threshold||5, barcode||null]
    );
    res.status(201).json({ id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, brand, price, stock, low_stock_threshold, barcode } = req.body;
    await req.db.runAsync(
      'UPDATE spare_parts SET name=?,category=?,brand=?,price=?,stock=?,low_stock_threshold=?,barcode=? WHERE id=?',
      [name, category||'General', brand||null, price, stock||0, low_stock_threshold||5, barcode||null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.db.runAsync('DELETE FROM spare_parts WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
