const express = require('express');
const router = express.Router();
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

const cfg = (bizType) => {
  switch (bizType) {
    case 'restaurant':
      return { salesTbl: 'orders', itemsTbl: 'order_items', itemIdCol: 'item_id', itemNameCol: 'item_name', itemJoinCol: 'order_id', invTbl: 'menu_items', invNameCol: 'name' };
    case 'pharmacy':
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemIdCol: 'medicine_id', itemNameCol: 'medicine_name', itemJoinCol: 'sale_id', invTbl: 'medicines', invNameCol: 'name' };
    case 'general_store':
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemIdCol: 'product_id', itemNameCol: 'product_name', itemJoinCol: 'sale_id', invTbl: 'products', invNameCol: 'name' };
    default:
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemIdCol: 'tyre_id', itemNameCol: 'tyre_name', itemJoinCol: 'sale_id', invTbl: 'tyres', invNameCol: 'model' };
  }
};

router.get('/stats/today', async (req, res) => {
  try {
    const { salesTbl } = cfg(req.user.business_type);
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const today     = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const yestD     = new Date(now); yestD.setDate(yestD.getDate() - 1);
    const yesterday = `${yestD.getFullYear()}-${pad(yestD.getMonth()+1)}-${pad(yestD.getDate())}`;

    const stats   = await req.db.getAsync(`SELECT COUNT(*) as totalSales, COALESCE(SUM(total),0) as revenue FROM ${salesTbl} WHERE DATE(created_at)=? AND status='completed'`, [today]);
    const yest    = await req.db.getAsync(`SELECT COUNT(*) as totalSales, COALESCE(SUM(total),0) as revenue FROM ${salesTbl} WHERE DATE(created_at)=? AND status='completed'`, [yesterday]);
    const pending = await req.db.getAsync(`SELECT COUNT(*) as count FROM ${salesTbl} WHERE status='pending'`);

    const pctChange = (curr, prev) => {
      if (prev === 0 && curr === 0) return null;
      if (prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.json({
      ...stats,
      pendingOrders: pending.count,
      revenueTrend:  pctChange(parseFloat(stats.revenue), parseFloat(yest.revenue)),
      salesTrend:    pctChange(stats.totalSales, yest.totalSales),
      yesterdayRevenue: parseFloat(yest.revenue),
      yesterdaySales:   yest.totalSales,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl, itemsTbl, itemNameCol, itemJoinCol } = cfg(req.user.business_type);
    const { date, status, page = 0, limit = 20 } = req.query;
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const offset = Math.max(0, parseInt(page) || 0) * limitNum;
    let where = 'WHERE 1=1'; const p = [];
    if (date)   { where += ' AND DATE(created_at)=?'; p.push(date); }
    if (status) { where += ' AND status=?'; p.push(status); }

    const total = await db.getAsync(`SELECT COUNT(*) as c FROM ${salesTbl} ${where}`, p);
    const sales = await db.allAsync(`SELECT * FROM ${salesTbl} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...p, limitNum, offset]);
    if (!sales.length) return res.json({ sales: [], total: total.c });

    const ids = sales.map(s => s.id);
    const allItems = await db.allAsync(`SELECT ${itemJoinCol} as sale_id, ${itemNameCol} as item_name, quantity FROM ${itemsTbl} WHERE ${itemJoinCol} IN (${ids.map(() => '?').join(',')})`, ids);
    const itemMap = {};
    for (const item of allItems) {
      if (!itemMap[item.sale_id]) itemMap[item.sale_id] = [];
      itemMap[item.sale_id].push(item);
    }
    for (const sale of sales) {
      sale.items = itemMap[sale.id] || [];
      sale.items_summary = sale.items.map(i => `${i.item_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ');
    }
    res.json({ sales, total: total.c });
  } catch (e) { console.error('[sales GET /]', e.message, e.stack); res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl, itemsTbl, itemJoinCol } = cfg(req.user.business_type);
    const sale = await db.getAsync(`SELECT * FROM ${salesTbl} WHERE id=?`, [req.params.id]);
    if (!sale) return res.status(404).json({ error: 'Not found' });
    sale.items = await db.allAsync(`SELECT * FROM ${itemsTbl} WHERE ${itemJoinCol}=?`, [req.params.id]);
    res.json(sale);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl, itemsTbl, itemIdCol, itemNameCol, itemJoinCol, invTbl } = cfg(req.user.business_type);
    const { customer_id, customer_name, items, discount, tax, payment_method, notes, table_id } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

    const subtotal   = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discountAmt = discount || 0;
    const taxAmt      = tax || 0;
    const total       = subtotal - discountAmt + taxAmt;

    const saleResult = await db.runAsync(
      req.user.business_type === 'restaurant'
        ? `INSERT INTO ${salesTbl} (table_id,customer_name,subtotal,discount,tax,total,payment_method,notes,status,created_at) VALUES (?,?,?,?,?,?,?,?,'completed',datetime('now','localtime'))`
        : `INSERT INTO ${salesTbl} (customer_id,customer_name,subtotal,discount,tax,total,payment_method,notes,status,created_at) VALUES (?,?,?,?,?,?,?,?,'completed',datetime('now','localtime'))`,
      req.user.business_type === 'restaurant'
        ? [table_id || null, customer_name || 'Walk-in', subtotal, discountAmt, taxAmt, total, payment_method || 'Cash', notes || null]
        : [customer_id || null, customer_name || 'Walk-in', subtotal, discountAmt, taxAmt, total, payment_method || 'Cash', notes || null]
    );
    const saleId = saleResult.lastID;

    for (const item of items) {
      const itemTotal = (item.unit_price * item.quantity) - (item.discount || 0);
      const itemType = item.item_type || 'tyre';
      const invTable = itemType === 'spare_part' ? 'spare_parts' : invTbl;
      const itemId = item.tyre_id || item.product_id || item.medicine_id || item.item_id;
      const itemName = item.tyre_name || item.product_name || item.medicine_name || item.item_name;

      // Fetch cost_price from inventory at time of sale
      let costPrice = item.cost_price || 0;
      if (!costPrice) {
        try {
          const invItem = await db.getAsync(`SELECT cost_price, cost FROM ${invTable} WHERE id=?`, [itemId]);
          costPrice = invItem ? (invItem.cost_price || invItem.cost || 0) : 0;
        } catch (_) {}
      }

      await db.runAsync(
        `INSERT INTO ${itemsTbl} (${itemJoinCol},${itemIdCol},${itemNameCol},quantity,unit_price,cost_price,discount,total,item_type) VALUES (?,?,?,?,?,?,?,?,?)`,
        [saleId, itemId, itemName, item.quantity, item.unit_price, costPrice, item.discount || 0, itemTotal, itemType]
      ).catch(() =>
        db.runAsync(
          `INSERT INTO ${itemsTbl} (${itemJoinCol},${itemIdCol},${itemNameCol},quantity,unit_price,discount,total,item_type) VALUES (?,?,?,?,?,?,?,?)`,
          [saleId, itemId, itemName, item.quantity, item.unit_price, item.discount || 0, itemTotal, itemType]
        ).catch(() =>
          db.runAsync(
            `INSERT INTO ${itemsTbl} (${itemJoinCol},${itemIdCol},${itemNameCol},quantity,unit_price,discount,total) VALUES (?,?,?,?,?,?,?)`,
            [saleId, itemId, itemName, item.quantity, item.unit_price, item.discount || 0, itemTotal]
          )
        )
      );

      await db.runAsync(`UPDATE ${invTable} SET stock = stock - ? WHERE id = ?`, [item.quantity, itemId]).catch(() => {});
    }
    res.status(201).json({ id: saleId, message: 'Sale created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl, itemsTbl, itemIdCol, itemJoinCol, invTbl } = cfg(req.user.business_type);
    const sale = await db.getAsync(`SELECT * FROM ${salesTbl} WHERE id=?`, [req.params.id]);
    if (!sale) return res.status(404).json({ error: 'Not found' });
    const items = await db.allAsync(`SELECT * FROM ${itemsTbl} WHERE ${itemJoinCol}=?`, [req.params.id]);
    for (const item of items) {
      const invTable = item.item_type === 'spare_part' ? 'spare_parts' : invTbl;
      await db.runAsync(`UPDATE ${invTable} SET stock = stock + ? WHERE id = ?`, [item.quantity, item[itemIdCol]]).catch(() => {});
    }
    await db.runAsync(`DELETE FROM ${itemsTbl} WHERE ${itemJoinCol}=?`, [req.params.id]);
    await db.runAsync(`DELETE FROM ${salesTbl} WHERE id=?`, [req.params.id]);
    res.json({ message: 'Sale deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
