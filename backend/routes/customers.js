const express = require('express');
const router = express.Router();
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let q = 'SELECT * FROM customers WHERE 1=1';
    const p = [];
    if (search) { q += ' AND (name LIKE ? OR phone LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
    res.json(await req.db.allAsync(q + ' ORDER BY name', p));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const r = await req.db.runAsync('INSERT INTO customers (name,phone,email,address) VALUES (?,?,?,?)',
      [name, phone || null, email || null, address || null]);
    res.status(201).json({ id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    await req.db.runAsync('UPDATE customers SET name=?,phone=?,email=?,address=? WHERE id=?',
      [name, phone, email, address, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.db.runAsync('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
