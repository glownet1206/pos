const express = require('express');
const router = express.Router();
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

const invTable = (biz) => {
  if (biz === 'tyre_shop') return 'tyres';
  if (biz === 'pharmacy') return 'medicines';
  if (biz === 'restaurant') return 'menu_items';
  return 'products';
};

router.get('/', async (req, res) => {
  try { res.json(await req.db.allAsync('SELECT * FROM suppliers ORDER BY name')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const r = await req.db.runAsync('INSERT INTO suppliers (name,phone,email,address) VALUES (?,?,?,?)',
      [name, phone || null, email || null, address || null]);
    res.status(201).json({ id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders', async (req, res) => {
  try { res.json(await req.db.allAsync('SELECT * FROM supplier_orders ORDER BY created_at DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await req.db.getAsync('SELECT * FROM supplier_orders WHERE id=?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    order.items = await req.db.allAsync('SELECT * FROM supplier_order_items WHERE order_id=?', [req.params.id]);
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', async (req, res) => {
  try {
    const { supplier_id, supplier_name, items, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });
    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const r = await req.db.runAsync(
      'INSERT INTO supplier_orders (supplier_id,supplier_name,total,notes) VALUES (?,?,?,?)',
      [supplier_id || null, supplier_name || '', total, notes || null]
    );
    const orderId = r.lastID;
    for (const item of items) {
      await req.db.runAsync(
        'INSERT INTO supplier_order_items (order_id,item_id,item_name,quantity,unit_price,total) VALUES (?,?,?,?,?,?)',
        [orderId, item.tyre_id || item.item_id || null, item.tyre_name || item.item_name || '', item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    res.status(201).json({ id: orderId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id/receive', async (req, res) => {
  try {
    const tbl = invTable(req.user.business_type);
    const items = await req.db.allAsync('SELECT * FROM supplier_order_items WHERE order_id=?', [req.params.id]);
    for (const item of items) {
      if (item.item_id) {
        await req.db.runAsync(`UPDATE ${tbl} SET stock = stock + ? WHERE id = ?`, [item.quantity, item.item_id]).catch(() => {});
      }
    }
    await req.db.runAsync("UPDATE supplier_orders SET status='received' WHERE id=?", [req.params.id]);
    res.json({ message: 'Stock updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    await req.db.runAsync('DELETE FROM suppliers WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    await req.db.runAsync(
      'UPDATE suppliers SET name=?, phone=?, email=?, address=? WHERE id=?',
      [name, phone || null, email || null, address || null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete order
router.delete('/orders/:id', async (req, res) => {
  try {
    await req.db.runAsync('DELETE FROM supplier_order_items WHERE order_id=?', [req.params.id]);
    await req.db.runAsync('DELETE FROM supplier_orders WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
