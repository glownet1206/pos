const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

const invTable = (biz) => ({ tyre_shop: 'tyres', pharmacy: 'medicines', restaurant: 'menu_items' }[biz] || 'products');

router.get('/', async (req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM suppliers WHERE user_id=$1 ORDER BY name', [req.user.id])).rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const r = await pool.query(
      'INSERT INTO suppliers (user_id,name,phone,email,address) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.user.id, name, phone || null, email || null, address || null]
    );
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    await pool.query(
      'UPDATE suppliers SET name=$1,phone=$2,email=$3,address=$4 WHERE id=$5 AND user_id=$6',
      [name, phone || null, email || null, address || null, req.params.id, req.user.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders', async (req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM supplier_orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id])).rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = (await pool.query('SELECT * FROM supplier_orders WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])).rows[0];
    if (!order) return res.status(404).json({ error: 'Not found' });
    order.items = (await pool.query('SELECT * FROM supplier_order_items WHERE order_id=$1 AND user_id=$2', [req.params.id, req.user.id])).rows;
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', async (req, res) => {
  try {
    const uid = req.user.id;
    const { supplier_id, supplier_name, items, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });
    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const r = await pool.query(
      'INSERT INTO supplier_orders (user_id,supplier_id,supplier_name,total,notes) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [uid, supplier_id || null, supplier_name || '', total, notes || null]
    );
    const orderId = r.rows[0].id;
    for (const item of items) {
      await pool.query(
        'INSERT INTO supplier_order_items (user_id,order_id,item_id,item_name,quantity,unit_price,total) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [uid, orderId, item.tyre_id || item.item_id || null, item.tyre_name || item.item_name || '', item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    res.status(201).json({ id: orderId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id/receive', async (req, res) => {
  try {
    const uid = req.user.id;
    const tbl = invTable(req.user.business_type);
    const items = (await pool.query('SELECT * FROM supplier_order_items WHERE order_id=$1 AND user_id=$2', [req.params.id, uid])).rows;
    for (const item of items) {
      if (item.item_id) {
        await pool.query(`UPDATE ${tbl} SET stock = stock + $1 WHERE id=$2 AND user_id=$3`, [item.quantity, item.item_id, uid]).catch(() => {});
      }
    }
    await pool.query("UPDATE supplier_orders SET status='received' WHERE id=$1 AND user_id=$2", [req.params.id, uid]);
    res.json({ message: 'Stock updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const uid = req.user.id;
    await pool.query('DELETE FROM supplier_order_items WHERE order_id=$1 AND user_id=$2', [req.params.id, uid]);
    await pool.query('DELETE FROM supplier_orders WHERE id=$1 AND user_id=$2', [req.params.id, uid]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
