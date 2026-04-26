const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const { search } = req.query;
    let q = 'SELECT * FROM customers WHERE user_id=$1';
    const p = [uid]; let idx = 2;
    if (search) { q += ` AND (name ILIKE $${idx} OR phone ILIKE $${idx+1})`; p.push(`%${search}%`, `%${search}%`); }
    res.json((await pool.query(q + ' ORDER BY name', p)).rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const r = await pool.query(
      'INSERT INTO customers (user_id,name,phone,email,address) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.user.id, name, phone || null, email || null, address || null]
    );
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    await pool.query(
      'UPDATE customers SET name=$1,phone=$2,email=$3,address=$4 WHERE id=$5 AND user_id=$6',
      [name, phone, email, address, req.params.id, req.user.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
