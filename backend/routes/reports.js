const express = require('express');
const router = express.Router();
const { requireAuth, requireActive } = require('./auth');
const { masterDb } = require('../db/database');
const path = require('path');
const fs = require('fs');

router.use(requireAuth, requireActive);

const cfg = (bizType) => {
  switch (bizType) {
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

router.get('/sales', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl, itemsTbl, itemNameCol, itemJoinCol } = cfg(req.user.business_type);
    const fromDate = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate   = req.query.to   || new Date().toISOString().split('T')[0];

    const summary = await db.getAsync(
      `SELECT COUNT(*) as totalSales, COALESCE(SUM(total),0) as revenue,
       COALESCE(SUM(discount),0) as totalDiscount, COALESCE(SUM(tax),0) as totalTax
       FROM ${salesTbl} WHERE DATE(created_at) BETWEEN ? AND ? AND status='completed'`,
      [fromDate, toDate]
    );
    const daily = await db.allAsync(
      `SELECT DATE(created_at) as date, COUNT(*) as sales, SUM(total) as revenue
       FROM ${salesTbl} WHERE DATE(created_at) BETWEEN ? AND ? AND status='completed'
       GROUP BY DATE(created_at) ORDER BY date`,
      [fromDate, toDate]
    );
    const topItems = await db.allAsync(
      `SELECT si.${itemNameCol} as name, SUM(si.quantity) as qty, SUM(si.total) as revenue
       FROM ${itemsTbl} si JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
       WHERE DATE(s.created_at) BETWEEN ? AND ? AND s.status='completed'
       GROUP BY si.${itemNameCol} ORDER BY qty DESC LIMIT 5`,
      [fromDate, toDate]
    );
    res.json({ summary, daily, topTyres: topItems });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/inventory', async (req, res) => {
  try {
    const db = req.db;
    const biz = req.user.business_type;
    let tbl = 'products';
    if (biz === 'tyre_shop') tbl = 'tyres';
    else if (biz === 'pharmacy') tbl = 'medicines';
    else if (biz === 'restaurant') tbl = 'menu_items';

    const all = await db.allAsync(`SELECT * FROM ${tbl} ORDER BY id`).catch(() => []);

    let lowStock = [], outOfStock = [];
    if (biz === 'tyre_shop') {

      lowStock   = await db.allAsync(`SELECT * FROM ${tbl} WHERE stock <= COALESCE(low_stock_threshold, 5) AND stock > 0`).catch(() => []);
      outOfStock = await db.allAsync(`SELECT * FROM ${tbl} WHERE stock = 0`).catch(() => []);
    } else if (biz === 'restaurant') {
      lowStock   = await db.allAsync(`SELECT * FROM ${tbl} WHERE stock <= 10 AND stock > 0`).catch(() => []);
      outOfStock = await db.allAsync(`SELECT * FROM ${tbl} WHERE stock = 0`).catch(() => []);
    } else {

      lowStock   = await db.allAsync(`SELECT * FROM ${tbl} WHERE stock <= COALESCE(low_stock_threshold, 10) AND stock > 0`).catch(() => []);
      outOfStock = await db.allAsync(`SELECT * FROM ${tbl} WHERE stock = 0`).catch(() => []);
    }

    const totalValue = await db.getAsync(`SELECT COALESCE(SUM(price*stock),0) as value FROM ${tbl}`).catch(() => ({ value: 0 }));
    res.json({ all, lowStock, outOfStock, totalValue: totalValue.value });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/chart/weekly', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl } = cfg(req.user.business_type);
    const days = parseInt(req.query.days) || 14;
    const rows = await db.allAsync(
      `SELECT DATE(created_at) as date, COUNT(*) as sales, COALESCE(SUM(total),0) as revenue
       FROM ${salesTbl} WHERE DATE(created_at) >= DATE('now','-${days - 1} days') AND status='completed'
       GROUP BY DATE(created_at) ORDER BY date`
    );
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const pad = n => String(n).padStart(2, '0');
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const found = rows.find(r => r.date === key);
      result.push({ date: key, day: d.toLocaleDateString('en-US', { weekday: 'short' }), sales: found ? found.sales : 0, revenue: parseFloat((found ? found.revenue : 0).toFixed(2)) });
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/chart/payments', async (req, res) => {
  try {
    const { salesTbl } = cfg(req.user.business_type);
    const rows = await req.db.allAsync(
      `SELECT payment_method as name, COUNT(*) as value FROM ${salesTbl} WHERE status='completed' GROUP BY payment_method`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/db-stats', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl } = cfg(req.user.business_type);
    const dbPath = path.join(__dirname, `../db/tenants/user_${req.user.id}.db`);
    let sizeBytes = 0;
    try { sizeBytes = fs.statSync(dbPath).size; } catch (_) {}

    const totalSales     = await db.getAsync(`SELECT COUNT(*) as c FROM ${salesTbl}`).catch(() => ({ c: 0 }));
    const totalCustomers = await db.getAsync('SELECT COUNT(*) as c FROM customers').catch(() => ({ c: 0 }));
    const revenue        = await db.getAsync(`SELECT COALESCE(SUM(total),0) as v FROM ${salesTbl} WHERE status='completed'`).catch(() => ({ v: 0 }));

    res.json({
      sizeBytes, dbSizeKB: parseFloat((sizeBytes / 1024).toFixed(2)),
      dbSizeMB: parseFloat((sizeBytes / (1024 * 1024)).toFixed(3)),
      totalSales: totalSales.c, totalCustomers: totalCustomers.c,
      totalRevenue: parseFloat(revenue.v).toFixed(2),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/yearly', async (req, res) => {
  try {
    const db = req.db;
    const biz = req.user.business_type;
    const { salesTbl, itemsTbl, itemJoinCol } = cfg(biz);

    const years = await db.allAsync(
      `SELECT strftime('%Y', created_at) as year, COUNT(*) as totalSales,
       COALESCE(SUM(total),0) as revenue, COALESCE(SUM(discount),0) as totalDiscount,
       COALESCE(SUM(tax),0) as totalTax
       FROM ${salesTbl} WHERE status='completed' GROUP BY year ORDER BY year DESC`
    );

    for (const y of years) {
      const units = await db.getAsync(
        `SELECT COALESCE(SUM(si.quantity),0) as u FROM ${itemsTbl} si
         JOIN ${salesTbl} s ON si.${itemJoinCol}=s.id
         WHERE strftime('%Y', s.created_at)=? AND s.status='completed'`, [y.year]
      ).catch(() => ({ u: 0 }));
      y.unitsSold = units.u;
      y.profit = Math.round(y.revenue * 0.25);
    }

    let invTbl = biz === 'tyre_shop' ? 'tyres' : biz === 'pharmacy' ? 'medicines' : biz === 'restaurant' ? 'menu_items' : 'products';
    const invStats = await db.getAsync(
      `SELECT COUNT(*) as total, COALESCE(SUM(stock),0) as totalStock, COALESCE(SUM(price*stock),0) as value FROM ${invTbl}`
    ).catch(() => ({ total: 0, totalStock: 0, value: 0 }));

    res.json({
      yearly: years,
      totalProducts: invStats.total,
      currentStock: invStats.totalStock,
      inventoryValue: invStats.value,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/notifications', async (req, res) => {
  try {
    const db = req.db;
    const { salesTbl } = cfg(req.user.business_type);
    const biz = req.user.business_type;
    const notifs = [];
    const today = new Date().toISOString().split('T')[0];

    const user = await masterDb.getAsync('SELECT plan, expires_at FROM users WHERE id=?', [req.user.id]);
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

    const todaySales = await db.getAsync(
      `SELECT COUNT(*) as c, COALESCE(SUM(total),0) as rev FROM ${salesTbl} WHERE DATE(created_at)=? AND status='completed'`, [today]
    ).catch(() => null);

    let invTbl = biz === 'tyre_shop' ? 'tyres' : biz === 'pharmacy' ? 'medicines' : biz === 'restaurant' ? 'menu_items' : 'products';
    try {
      let lowStock = [], outOfStock = [];
      if (biz === 'restaurant') {
        lowStock   = await db.allAsync(`SELECT * FROM ${invTbl} WHERE stock <= 10 AND stock > 0`);
        outOfStock = await db.allAsync(`SELECT * FROM ${invTbl} WHERE stock = 0`);
      } else {
        lowStock   = await db.allAsync(`SELECT * FROM ${invTbl} WHERE stock <= COALESCE(low_stock_threshold, 10) AND stock > 0`);
        outOfStock = await db.allAsync(`SELECT * FROM ${invTbl} WHERE stock = 0`);
      }
      outOfStock.forEach(t => notifs.push({ id: 'oos-' + t.id, type: 'danger',  title: 'Out of Stock', msg: t.name || `${t.brand} ${t.model}` }));
      lowStock.forEach(t   => notifs.push({ id: 'low-' + t.id, type: 'warning', title: 'Low Stock',    msg: `${t.name || `${t.brand} ${t.model}`} — ${t.stock} left` }));
    } catch (_) {}

    if (todaySales && todaySales.c > 0)
      notifs.push({ id: 'today-sales', type: 'success', title: "Today's Sales", msg: `${todaySales.c} sales · Rs.${parseFloat(todaySales.rev).toFixed(2)}` });

    res.json(notifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
