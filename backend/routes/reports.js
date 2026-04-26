const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { requireAuth, requireActive } = require('./auth');

router.use(requireAuth, requireActive);

const cfg = (biz) => {
  switch (biz) {
    case 'restaurant':
      return { salesTbl: 'orders', itemsTbl: 'order_items', itemNameCol: 'item_name', itemJoinCol: 'order_id' };
    case 'pharmacy':
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemNameCol: 'medicine_name', itemJoinCol: 'sale_id' };
    case 'general_store':
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemNameCol: 'product_name', itemJoinCol: 'sale_id' };
    default:
      return { salesTbl: 'sales', itemsTbl: 'sale_items', itemNameCol: 'tyre_name', itemJoinCol: 'sale_id' };
  }
};

// Cost expression per business type
const costExpr = (biz, siAlias = 'si') => {
  if (biz === 'tyre_shop') {
    return `CASE
      WHEN ${siAlias}.cost_price > 0 THEN ${siAlias}.cost_price * ${siAlias}.quantity
      WHEN ${siAlias}.item_type = 'spare_part'
        THEN COALESCE((SELECT sp.cost_price FROM spare_parts sp WHERE sp.id = ${siAlias}.tyre_id AND sp.user_id = ${siAlias}.user_id), 0) * ${siAlias}.quantity
      ELSE COALESCE((SELECT t.cost_price FROM tyres t WHERE t.id = ${siAlias}.tyre_id AND t.user_id = ${siAlias}.user_id), 0) * ${siAlias}.quantity
    END`;
  }
  if (biz === 'pharmacy') {
    return `CASE
      WHEN ${siAlias}.cost_price > 0 THEN ${siAlias}.cost_price * ${siAlias}.quantity
      ELSE COALESCE((SELECT m.cost FROM medicines m WHERE m.id = ${siAlias}.medicine_id AND m.user_id = ${siAlias}.user_id), 0) * ${siAlias}.quantity
    END`;
  }
  if (biz === 'general_store') {
    return `CASE
      WHEN ${siAlias}.cost_price > 0 THEN ${siAlias}.cost_price * ${siAlias}.quantity
      ELSE COALESCE((SELECT p.cost FROM products p WHERE p.id = ${siAlias}.product_id AND p.user_id = ${siAlias}.user_id), 0) * ${siAlias}.quantity
    END`;
  }
  if (biz === 'restaurant') {
    return `CASE
      WHEN ${siAlias}.cost_price > 0 THEN ${siAlias}.cost_price * ${siAlias}.quantity
      ELSE COALESCE((SELECT m.cost FROM menu_items m WHERE m.id = ${siAlias}.item_id AND m.user_id = ${siAlias}.user_id), 0) * ${siAlias}.quantity
    END`;
  }
  return `COALESCE(${siAlias}.cost_price, 0) * ${siAlias}.quantity`;
};

router.get('/sales', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl, itemsTbl, itemNameCol, itemJoinCol } = cfg(biz);
    const fromDate = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate   = req.query.to   || new Date().toISOString().split('T')[0];

    const summary = (await pool.query(
      `SELECT COUNT(*) as totalsales, COALESCE(SUM(total),0) as revenue,
       COALESCE(SUM(discount),0) as totaldiscount, COALESCE(SUM(tax),0) as totaltax
       FROM ${salesTbl} WHERE user_id=$1 AND created_at::date BETWEEN $2 AND $3 AND status='completed'`,
      [uid, fromDate, toDate]
    )).rows[0];

    let totalCost = 0, totalProfit = 0;
    try {
      const expr = costExpr(biz);
      const costData = (await pool.query(
        `SELECT COALESCE(SUM(${expr}), 0) as totalcost
         FROM ${itemsTbl} si JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
         WHERE s.user_id=$1 AND s.created_at::date BETWEEN $2 AND $3 AND s.status='completed'`,
        [uid, fromDate, toDate]
      )).rows[0];
      totalCost   = parseFloat(costData.totalcost || 0);
      totalProfit = parseFloat(summary.revenue || 0) - totalCost;
    } catch (_) {}

    const daily = (await pool.query(
      `SELECT created_at::date as date, COUNT(*) as sales, SUM(total) as revenue
       FROM ${salesTbl} WHERE user_id=$1 AND created_at::date BETWEEN $2 AND $3 AND status='completed'
       GROUP BY created_at::date ORDER BY date`,
      [uid, fromDate, toDate]
    )).rows;

    const expr2 = costExpr(biz);
    for (const day of daily) {
      try {
        const dayCost = (await pool.query(
          `SELECT COALESCE(SUM(${expr2}), 0) as cost
           FROM ${itemsTbl} si JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
           WHERE s.user_id=$1 AND s.created_at::date=$2 AND s.status='completed'`,
          [uid, day.date]
        )).rows[0];
        day.cost   = parseFloat(dayCost.cost || 0);
        day.profit = parseFloat(day.revenue || 0) - day.cost;
      } catch (_) {
        day.cost   = 0;
        day.profit = parseFloat(day.revenue || 0);
      }
    }

    const topItems = (await pool.query(
      `SELECT si.${itemNameCol} as name, SUM(si.quantity) as qty, SUM(si.total) as revenue
       FROM ${itemsTbl} si JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
       WHERE s.user_id=$1 AND s.created_at::date BETWEEN $2 AND $3 AND s.status='completed'
       GROUP BY si.${itemNameCol} ORDER BY qty DESC LIMIT 5`,
      [uid, fromDate, toDate]
    )).rows;

    res.json({
      summary: {
        totalSales: parseInt(summary.totalsales),
        revenue: parseFloat(summary.revenue),
        totalDiscount: parseFloat(summary.totaldiscount),
        totalTax: parseFloat(summary.totaltax),
        totalCost, totalProfit
      },
      daily,
      topTyres: topItems
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/inventory', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const tbl = biz === 'tyre_shop' ? 'tyres' : biz === 'pharmacy' ? 'medicines' : biz === 'restaurant' ? 'menu_items' : 'products';

    const all = (await pool.query(`SELECT * FROM ${tbl} WHERE user_id=$1 ORDER BY id`, [uid])).rows;

    let lowStock = [], outOfStock = [];
    if (biz === 'restaurant') {
      outOfStock = (await pool.query(`SELECT * FROM ${tbl} WHERE user_id=$1 AND available=0`, [uid])).rows;
    } else if (biz === 'tyre_shop') {
      lowStock   = (await pool.query(`SELECT * FROM ${tbl} WHERE user_id=$1 AND stock <= COALESCE(low_stock_threshold,5) AND stock > 0`, [uid])).rows;
      outOfStock = (await pool.query(`SELECT * FROM ${tbl} WHERE user_id=$1 AND stock = 0`, [uid])).rows;
    } else {
      lowStock   = (await pool.query(`SELECT * FROM ${tbl} WHERE user_id=$1 AND stock <= COALESCE(low_stock_threshold,10) AND stock > 0`, [uid])).rows;
      outOfStock = (await pool.query(`SELECT * FROM ${tbl} WHERE user_id=$1 AND stock = 0`, [uid])).rows;
    }

    const totalValue = biz === 'restaurant'
      ? (await pool.query(`SELECT COALESCE(SUM(price),0) as value FROM ${tbl} WHERE user_id=$1`, [uid])).rows[0]
      : (await pool.query(`SELECT COALESCE(SUM(price*stock),0) as value FROM ${tbl} WHERE user_id=$1`, [uid])).rows[0];

    res.json({ all, lowStock, outOfStock, totalValue: parseFloat(totalValue.value) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/chart/weekly', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl, itemsTbl, itemJoinCol } = cfg(biz);
    const days = parseInt(req.query.days) || 14;

    const rows = (await pool.query(
      `SELECT created_at::date as date, COUNT(*) as sales, COALESCE(SUM(total),0) as revenue
       FROM ${salesTbl}
       WHERE user_id=$1 AND created_at::date >= CURRENT_DATE - INTERVAL '${days - 1} days' AND status='completed'
       GROUP BY created_at::date ORDER BY date`,
      [uid]
    )).rows;

    let costRows = [];
    try {
      const expr = costExpr(biz);
      costRows = (await pool.query(
        `SELECT s.created_at::date as date, COALESCE(SUM(${expr}), 0) as cost
         FROM ${itemsTbl} si JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
         WHERE s.user_id=$1 AND s.created_at::date >= CURRENT_DATE - INTERVAL '${days - 1} days' AND s.status='completed'
         GROUP BY s.created_at::date`,
        [uid]
      )).rows;
    } catch (_) {}

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const found     = rows.find(r => r.date && r.date.toISOString ? r.date.toISOString().split('T')[0] === key : String(r.date) === key);
      const costFound = costRows.find(r => r.date && r.date.toISOString ? r.date.toISOString().split('T')[0] === key : String(r.date) === key);
      const revenue = parseFloat((found ? found.revenue : 0));
      const cost    = parseFloat((costFound ? costFound.cost : 0));
      result.push({
        date: key,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: found ? parseInt(found.sales) : 0,
        revenue: parseFloat(revenue.toFixed(2)),
        cost:    parseFloat(cost.toFixed(2)),
        profit:  parseFloat((revenue - cost).toFixed(2)),
      });
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/chart/payments', async (req, res) => {
  try {
    const uid = req.user.id;
    const { salesTbl } = cfg(req.user.business_type);
    const rows = (await pool.query(
      `SELECT payment_method as name, COUNT(*) as value FROM ${salesTbl} WHERE user_id=$1 AND status='completed' GROUP BY payment_method`,
      [uid]
    )).rows;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/db-stats', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl } = cfg(biz);

    const totalSales     = (await pool.query(`SELECT COUNT(*) as c FROM ${salesTbl} WHERE user_id=$1`, [uid])).rows[0];
    const totalCustomers = (await pool.query('SELECT COUNT(*) as c FROM customers WHERE user_id=$1', [uid])).rows[0];
    const revenue        = (await pool.query(`SELECT COALESCE(SUM(total),0) as v FROM ${salesTbl} WHERE user_id=$1 AND status='completed'`, [uid])).rows[0];

    res.json({
      sizeBytes: 0, dbSizeKB: 0, dbSizeMB: 0,
      totalSales: parseInt(totalSales.c),
      totalCustomers: parseInt(totalCustomers.c),
      totalRevenue: parseFloat(revenue.v).toFixed(2),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/yearly', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl, itemsTbl, itemJoinCol } = cfg(biz);

    const years = (await pool.query(
      `SELECT to_char(created_at,'YYYY') as year, COUNT(*) as totalsales,
       COALESCE(SUM(total),0) as revenue, COALESCE(SUM(discount),0) as totaldiscount,
       COALESCE(SUM(tax),0) as totaltax
       FROM ${salesTbl} WHERE user_id=$1 AND status='completed' GROUP BY year ORDER BY year DESC`,
      [uid]
    )).rows;

    for (const y of years) {
      const units = (await pool.query(
        `SELECT COALESCE(SUM(si.quantity),0) as u FROM ${itemsTbl} si
         JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
         WHERE s.user_id=$1 AND to_char(s.created_at,'YYYY')=$2 AND s.status='completed'`,
        [uid, y.year]
      )).rows[0];
      y.unitsSold = parseInt(units.u);
      y.totalSales = parseInt(y.totalsales);
      y.revenue = parseFloat(y.revenue);

      try {
        const expr = costExpr(biz);
        const costData = (await pool.query(
          `SELECT COALESCE(SUM(${expr}), 0) as totalcost
           FROM ${itemsTbl} si JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
           WHERE s.user_id=$1 AND to_char(s.created_at,'YYYY')=$2 AND s.status='completed'`,
          [uid, y.year]
        )).rows[0];
        y.totalCost = parseFloat(costData.totalcost || 0);
        y.profit    = Math.round(y.revenue - y.totalCost);
      } catch (_) { y.profit = 0; y.totalCost = 0; }
    }

    const invTbl = biz === 'tyre_shop' ? 'tyres' : biz === 'pharmacy' ? 'medicines' : biz === 'restaurant' ? 'menu_items' : 'products';
    let invStats;
    if (biz === 'restaurant') {
      invStats = (await pool.query(`SELECT COUNT(*) as total, COUNT(*) as totalstock, COALESCE(SUM(price),0) as value FROM ${invTbl} WHERE user_id=$1 AND available=1`, [uid])).rows[0];
    } else {
      invStats = (await pool.query(`SELECT COUNT(*) as total, COALESCE(SUM(stock),0) as totalstock, COALESCE(SUM(price*stock),0) as value FROM ${invTbl} WHERE user_id=$1`, [uid])).rows[0];
    }

    res.json({
      yearly: years,
      totalProducts: parseInt(invStats.total),
      currentStock:  parseInt(invStats.totalstock),
      inventoryValue: parseFloat(invStats.value),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/notifications', async (req, res) => {
  try {
    const uid = req.user.id;
    const biz = req.user.business_type;
    const { salesTbl } = cfg(biz);
    const notifs = [];
    const today = new Date().toISOString().split('T')[0];

    const user = (await pool.query('SELECT plan, expires_at FROM users WHERE id=$1', [uid])).rows[0];
    if (user && user.plan === 'monthly' && user.expires_at) {
      const days = Math.ceil((new Date(user.expires_at) - new Date()) / 86400000);
      if (days <= 7 && days >= 0) {
        notifs.push({
          id: 'sub-expiry',
          type: days <= 2 ? 'danger' : 'warning',
          title: 'Subscription Expiring',
          msg: days === 0 ? 'Your subscription expires today!' : `Your subscription expires in ${days} day${days > 1 ? 's' : ''}. Contact admin to renew.`,
        });
      }
    }

    const todaySales = (await pool.query(
      `SELECT COUNT(*) as c, COALESCE(SUM(total),0) as rev FROM ${salesTbl} WHERE user_id=$1 AND created_at::date=$2 AND status='completed'`,
      [uid, today]
    )).rows[0];

    const invTbl = biz === 'tyre_shop' ? 'tyres' : biz === 'pharmacy' ? 'medicines' : biz === 'restaurant' ? 'menu_items' : 'products';
    try {
      if (biz === 'restaurant') {
        const outOfStock = (await pool.query(`SELECT * FROM ${invTbl} WHERE user_id=$1 AND available=0`, [uid])).rows;
        outOfStock.forEach(t => notifs.push({ id: 'oos-' + t.id, type: 'danger', title: 'Unavailable Item', msg: t.name }));
      } else {
        const lowStock   = (await pool.query(`SELECT * FROM ${invTbl} WHERE user_id=$1 AND stock <= COALESCE(low_stock_threshold,10) AND stock > 0`, [uid])).rows;
        const outOfStock = (await pool.query(`SELECT * FROM ${invTbl} WHERE user_id=$1 AND stock = 0`, [uid])).rows;
        outOfStock.forEach(t => notifs.push({ id: 'oos-' + t.id, type: 'danger',  title: 'Out of Stock', msg: t.name || `${t.brand} ${t.model}` }));
        lowStock.forEach(t   => notifs.push({ id: 'low-' + t.id, type: 'warning', title: 'Low Stock',    msg: `${t.name || `${t.brand} ${t.model}`} — ${t.stock} left` }));
      }
    } catch (_) {}

    if (todaySales && parseInt(todaySales.c) > 0)
      notifs.push({ id: 'today-sales', type: 'success', title: "Today's Sales", msg: `${todaySales.c} sales · Rs.${parseFloat(todaySales.rev).toFixed(2)}` });

    res.json(notifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
