const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const addAsync = (db) => {
  db.runAsync = (sql, p = []) => new Promise((res, rej) => db.run(sql, p, function(err) { err ? rej(err) : res(this); }));
  db.getAsync = (sql, p = []) => new Promise((res, rej) => db.get(sql, p, (err, row) => err ? rej(err) : res(row)));
  db.allAsync = (sql, p = []) => new Promise((res, rej) => db.all(sql, p, (err, rows) => err ? rej(err) : res(rows)));
  return db;
};

const masterDb = addAsync(new sqlite3.Database(path.join(__dirname, 'master.db')));

const initMaster = async () => {
  await masterDb.runAsync('PRAGMA journal_mode = WAL');

  await masterDb.runAsync(`CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    business_name TEXT,
    business_type TEXT NOT NULL DEFAULT 'general_store',
    email         TEXT NOT NULL UNIQUE,
    password      TEXT NOT NULL,
    plan          TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'lifetime'
    status        TEXT NOT NULL DEFAULT 'pending',  -- 'active' | 'pending' | 'suspended'
    expires_at    DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await masterDb.runAsync(`CREATE TABLE IF NOT EXISTS payments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    amount       REAL NOT NULL,
    note         TEXT,
    activated_by INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await masterDb.runAsync(`CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const adminCount = await masterDb.getAsync('SELECT COUNT(*) as c FROM admins');
  if (adminCount.c === 0) {
    await masterDb.runAsync('INSERT INTO admins (name,email,password) VALUES (?,?,?)',
      ['Super Admin', 'ahsanraza@PrimePOS.com', 'AhsanRaza@1630']);
    console.log('Default admin created: admin@posplatform.com / admin123');
  }

  await masterDb.runAsync('ALTER TABLE users ADD COLUMN phone TEXT').catch(() => {});
  await masterDb.runAsync('ALTER TABLE users ADD COLUMN address TEXT').catch(() => {});

  console.log('Master DB ready');
};

initMaster().catch(console.error);

const TENANT_DIR = path.join(__dirname, 'tenants');
if (!fs.existsSync(TENANT_DIR)) fs.mkdirSync(TENANT_DIR);

const commonTables = async (db) => {
  await db.runAsync(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT,
    email TEXT, address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT,
    email TEXT, address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS supplier_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER, supplier_name TEXT,
    total REAL DEFAULT 0, status TEXT DEFAULT 'pending', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS supplier_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, item_id INTEGER,
    item_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL, total REAL NOT NULL)`);
};

const tyreShopTables = async (db) => {
  await commonTables(db);
  await db.runAsync(`CREATE TABLE IF NOT EXISTS tyres (
    id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT NOT NULL, model TEXT NOT NULL,
    size TEXT NOT NULL, type TEXT DEFAULT 'Passenger', price REAL NOT NULL,
    cost_price REAL DEFAULT 0, car_type TEXT DEFAULT '',
    stock INTEGER DEFAULT 0, low_stock_threshold INTEGER DEFAULT 10,
    barcode TEXT UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  // Migrations for existing tyres table
  await db.runAsync(`ALTER TABLE tyres ADD COLUMN cost_price REAL DEFAULT 0`).catch(() => {});
  await db.runAsync(`ALTER TABLE tyres ADD COLUMN car_type TEXT DEFAULT ''`).catch(() => {});

  await db.runAsync(`CREATE TABLE IF NOT EXISTS spare_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT 'General',
    brand TEXT, price REAL NOT NULL, cost_price REAL DEFAULT 0,
    car_type TEXT DEFAULT '',
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5, barcode TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  // Migrations for existing spare_parts table
  await db.runAsync(`ALTER TABLE spare_parts ADD COLUMN cost_price REAL DEFAULT 0`).catch(() => {});
  await db.runAsync(`ALTER TABLE spare_parts ADD COLUMN car_type TEXT DEFAULT ''`).catch(() => {});

  await db.runAsync(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, customer_name TEXT,
    subtotal REAL NOT NULL, discount REAL DEFAULT 0, tax REAL DEFAULT 0,
    total REAL NOT NULL, payment_method TEXT DEFAULT 'Cash', status TEXT DEFAULT 'completed',
    notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL, tyre_id INTEGER NOT NULL,
    tyre_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    discount REAL DEFAULT 0, total REAL NOT NULL,
    item_type TEXT DEFAULT 'tyre')`);

  // Migration for existing sale_items table
  await db.runAsync(`ALTER TABLE sale_items ADD COLUMN cost_price REAL DEFAULT 0`).catch(() => {});

  await db.runAsync(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT,
    email TEXT, address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS supplier_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER, supplier_name TEXT,
    total REAL DEFAULT 0, status TEXT DEFAULT 'pending', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS supplier_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, tyre_id INTEGER,
    tyre_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL, total REAL NOT NULL)`);
};

const restaurantTables = async (db) => {
  await commonTables(db);
  await db.runAsync(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT,
    price REAL NOT NULL, stock INTEGER DEFAULT 0, available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT, table_number TEXT NOT NULL,
    capacity INTEGER DEFAULT 4, status TEXT DEFAULT 'available')`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, table_id INTEGER, customer_name TEXT,
    subtotal REAL NOT NULL, discount REAL DEFAULT 0, tax REAL DEFAULT 0,
    total REAL NOT NULL, payment_method TEXT DEFAULT 'Cash',
    status TEXT DEFAULT 'completed', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL, item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
    discount REAL DEFAULT 0, total REAL NOT NULL)`);
};

const generalStoreTables = async (db) => {
  await commonTables(db);
  await db.runAsync(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT,
    brand TEXT, barcode TEXT UNIQUE, price REAL NOT NULL, cost REAL DEFAULT 0,
    stock INTEGER DEFAULT 0, low_stock_threshold INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, customer_name TEXT,
    subtotal REAL NOT NULL, discount REAL DEFAULT 0, tax REAL DEFAULT 0,
    total REAL NOT NULL, payment_method TEXT DEFAULT 'Cash',
    status TEXT DEFAULT 'completed', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL, product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    discount REAL DEFAULT 0, total REAL NOT NULL)`);

  await db.runAsync(`ALTER TABLE sale_items ADD COLUMN cost_price REAL DEFAULT 0`).catch(() => {});
};

const pharmacyTables = async (db) => {
  await commonTables(db);
  await db.runAsync(`CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, generic_name TEXT,
    company TEXT, category TEXT, barcode TEXT UNIQUE,
    price REAL NOT NULL, cost REAL DEFAULT 0,
    stock INTEGER DEFAULT 0, low_stock_threshold INTEGER DEFAULT 10,
    expiry_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, customer_name TEXT,
    subtotal REAL NOT NULL, discount REAL DEFAULT 0, tax REAL DEFAULT 0,
    total REAL NOT NULL, payment_method TEXT DEFAULT 'Cash',
    status TEXT DEFAULT 'completed', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.runAsync(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL, medicine_name TEXT NOT NULL,
    quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    discount REAL DEFAULT 0, total REAL NOT NULL)`);

  await db.runAsync(`ALTER TABLE sale_items ADD COLUMN cost_price REAL DEFAULT 0`).catch(() => {});
};

const SCHEMA_MAP = {
  tyre_shop:     tyreShopTables,
  restaurant:    restaurantTables,
  general_store: generalStoreTables,
  pharmacy:      pharmacyTables,
};

const tenantDbCache = {};

const getTenantDb = (userId, businessType = 'general_store') => {
  const cached = tenantDbCache[userId];
  if (cached && cached._businessType === businessType) return cached;
  if (cached) {
    try { cached.close(); } catch (_) {}
    delete tenantDbCache[userId];
  }

  const dbPath = path.join(TENANT_DIR, `user_${userId}.db`);
  const db = addAsync(new sqlite3.Database(dbPath));

  const initFn = SCHEMA_MAP[businessType] || generalStoreTables;
  initFn(db).catch(console.error);

  db._businessType = businessType;
  tenantDbCache[userId] = db;
  return db;
};

module.exports = { masterDb, getTenantDb };
