const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

const cfg = (biz) => {
  switch (biz) {
    case 'restaurant':
      return { salesTbl: 'orders', itemsTbl: 'order_items', itemIdCol: 'item_id', itemNameCol: 'item_name', itemJoinCol: 'order_id', invTbl: 'menu_items' };
    case 'pharmacy':
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemIdCol: 'medicine_id', itemNameCol: 'medicine_name', itemJoinCol: 'sale_id', invTbl: 'medicines' };
    case 'general_store':
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemIdCol: 'product_id', itemNameCol: 'product_name', itemJoinCol: 'sale_id', invTbl: 'products' };
    default:
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemIdCol: 'tyre_id', itemNameCol: 'tyre_name', itemJoinCol: 'sale_id', invTbl: 'tyres' };
  }
};

router.get('/stats/today', async (req, res) => {
  try {
    const uid = req.user.id;
    const { salesTbl } = cfg(req.user.business_type);
    const today     = new Date().toISOString().split('T')[0];
    const yestD     = new Date(); yestD.setDate(yestD.getDate() - 1);
    const yesterday = yestD.toISOString().split('T')[0];

    const stats   = (await pool.query(`SELECT COUNT(*) as totalsales, COALESCE(SUM(total),0) as revenue FROM ${salesTbl} WHERE user_id=$1 AND created_at::date=$2 AND status='completed'`, [uid, today])).rows[0];
    const yest    = (await pool.query(`SELECT COUNT(*) as totalsales, COALESCE(SUM(total),0) as revenue FROM ${salesTbl} WHERE user_id=$1 AND created_at::date=$2 AND status='completed'`, [uid, yesterday])).rows[0];
    const pending = (await pool.query(`SELECT COUNT(*) as count FROM ${salesTbl} WHERE user_id=$1 AND status='pending'`, [uid])).rows[0];

    const pctChange = (curr, prev) => {
      if (prev == 0 && curr == 0) return null;
      if (prev == 0) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.json({
      totalSales: parseInt(stats.totalsales),
      revenue: parseFloat(stats.revenue),
      pendingOrders: parseInt(pending.count),
      revenueTrend:  pctChange(parseFloat(stats.revenue), parseFloat(yest.revenue)),
      salesTrend:    pctChange(parseInt(stats.totalsales), parseInt(yest.totalsales)),
      yesterdayRevenue: parseFloat(yest.revenue),
      yesterdaySales:   parseInt(yest.totalsales),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const { salesTbl, itemsTbl, itemNameCol, itemJoinCol } = cfg(req.user.business_type);
    const { date, status, page = 0, limit = 20 } = req.query;
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const offset = Math.max(0, parseInt(page) || 0) * limitNum;

    let where = 'WHERE user_id=$1'; const p = [uid]; let idx = 2;
    if (date)   { where += ` AND created_at::date=$${idx++}`; p.push(date); }
    if (status) { where += ` AND status=$${idx++}`; p.push(status); }

    const total = (await pool.query(`SELECT COUNT(*) as c FROM ${salesTbl} ${where}`, p)).rows[0];
    const sales = (await pool.query(`SELECT * FROM ${salesTbl} ${where} ORDER BY id DESC LIMIT $${idx++} OFFSET $${idx++}`, [...p, limitNum, offset])).rows;
    if (!sales.length) return res.json({ sales: [], total: parseInt(total.c) });

    const ids = sales.map(s => s.id);
    const allItems = (await pool.query(
      `SELECT ${itemJoinCol} as sale_id, ${itemNameCol} as item_name, quantity FROM ${itemsTbl} WHERE user_id=$1 AND ${itemJoinCol} = ANY($2)`,
      [uid, ids]
    )).rows;

    const itemMap = {};
    for (const item of allItems) {
      if (!itemMap[item.sale_id]) itemMap[item.sale_id] = [];
      itemMap[item.sale_id].push(item);
    }
    for (const sale of sales) {
      sale.items = itemMap[sale.id] || [];
      sale.items_summary = sale.items.map(i => `${i.item_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ');
    }
    res.json({ sales, total: parseInt(total.c) });
  } catch (e) { console.error('[sales GET /]', e.message); res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const uid = req.user.id;
    const { salesTbl, itemsTbl, itemJoinCol } = cfg(req.user.business_type);
    const sale = (await pool.query(`SELECT * FROM ${salesTbl} WHERE id=$1 AND user_id=$2`, [req.params.id, uid])).rows[0];
    if (!sale) return res.status(404).json({ error: 'Not found' });
    sale.items = (await pool.query(`SELECT * FROM ${itemsTbl} WHERE ${itemJoinCol}=$1 AND user_id=$2`, [req.params.id, uid])).rows;
    res.json(sale);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl, itemsTbl, itemIdCol, itemNameCol, itemJoinCol, invTbl } = cfg(biz);
    const { customer_id, customer_name, items, discount, tax, payment_method, notes, table_id } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

    const subtotal    = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discountAmt = discount || 0;
    const taxAmt      = tax || 0;
    const total       = subtotal - discountAmt + taxAmt;

    let saleId;
    if (biz === 'restaurant') {
      const r = await pool.query(
        `INSERT INTO ${salesTbl} (user_id,table_id,customer_name,subtotal,discount,tax,total,payment_method,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed') RETURNING id`,
        [uid, table_id || null, customer_name || 'Walk-in', subtotal, discountAmt, taxAmt, total, payment_method || 'Cash', notes || null]
      );
      saleId = r.rows[0].id;
    } else {
      const r = await pool.query(
        `INSERT INTO ${salesTbl} (user_id,customer_id,customer_name,subtotal,discount,tax,total,payment_method,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed') RETURNING id`,
        [uid, customer_id || null, customer_name || 'Walk-in', subtotal, discountAmt, taxAmt, total, payment_method || 'Cash', notes || null]
      );
      saleId = r.rows[0].id;
    }

    for (const item of items) {
      const itemTotal = (item.unit_price * item.quantity) - (item.discount || 0);
      const itemType  = item.item_type || 'tyre';
      const invTable  = itemType === 'spare_part' ? 'spare_parts' : invTbl;
      const itemId    = item.tyre_id || item.product_id || item.medicine_id || item.item_id;
      const itemName  = item.tyre_name || item.product_name || item.medicine_name || item.item_name;

      let costPrice = item.cost_price || 0;
      if (!costPrice) {
        try {
          const inv = (await pool.query(`SELECT cost_price, cost FROM ${invTable} WHERE id=$1 AND user_id=$2`, [itemId, uid])).rows[0];
          costPrice = inv ? (inv.cost_price || inv.cost || 0) : 0;
        } catch (_) {}
      }

      // Build insert based on business type
      if (biz === 'restaurant') {
        await pool.query(
          `INSERT INTO ${itemsTbl} (user_id,${itemJoinCol},${itemIdCol},${itemNameCol},quantity,unit_price,cost_price,discount,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [uid, saleId, itemId, itemName, item.quantity, item.unit_price, costPrice, item.discount || 0, itemTotal]
        );
      } else {
        // sale_items has named columns for all types
        const colMap = {
          tyre_shop:     { idCol: 'tyre_id',     nameCol: 'tyre_name' },
          general_store: { idCol: 'product_id',  nameCol: 'product_name' },
          pharmacy:      { idCol: 'medicine_id', nameCol: 'medicine_name' },
        };
        const cols = colMap[biz] || colMap.tyre_shop;
        await pool.query(
          `INSERT INTO sale_items (user_id,sale_id,${cols.idCol},${cols.nameCol},quantity,unit_price,cost_price,discount,total,item_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [uid, saleId, itemId, itemName, item.quantity, item.unit_price, costPrice, item.discount || 0, itemTotal, itemType]
        );
      }

      await pool.query(`UPDATE ${invTable} SET stock = stock - $1 WHERE id=$2 AND user_id=$3`, [item.quantity, itemId, uid]).catch(() => {});
    }

    res.status(201).json({ id: saleId, message: 'Sale created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl, itemsTbl, itemIdCol, itemJoinCol, invTbl } = cfg(biz);
    const sale = (await pool.query(`SELECT * FROM ${salesTbl} WHERE id=$1 AND user_id=$2`, [req.params.id, uid])).rows[0];
    if (!sale) return res.status(404).json({ error: 'Not found' });

    const items = (await pool.query(`SELECT * FROM ${itemsTbl} WHERE ${itemJoinCol}=$1 AND user_id=$2`, [req.params.id, uid])).rows;
    for (const item of items) {
      const invTable = item.item_type === 'spare_part' ? 'spare_parts' : invTbl;
      await pool.query(`UPDATE ${invTable} SET stock = stock + $1 WHERE id=$2 AND user_id=$3`, [item.quantity, item[itemIdCol], uid]).catch(() => {});
    }
    await pool.query(`DELETE FROM ${itemsTbl} WHERE ${itemJoinCol}=$1 AND user_id=$2`, [req.params.id, uid]);
    await pool.query(`DELETE FROM ${salesTbl} WHERE id=$1 AND user_id=$2`, [req.params.id, uid]);
    res.json({ message: 'Sale deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
