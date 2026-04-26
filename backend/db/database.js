const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Helper: run query and return rows
pool.query_ = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  return res.rows;
};

// Helper: get single row
pool.get_ = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  return res.rows[0] || null;
};

// Helper: run INSERT/UPDATE/DELETE, return result
pool.run_ = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  return res;
};

// ─── MASTER DB HELPERS ───────────────────────────────────────────────────────
const masterDb = {
  getAsync:  (sql, p) => pool.get_(convertSql(sql), convertParams(p)),
  allAsync:  (sql, p) => pool.query_(convertSql(sql), convertParams(p)),
  runAsync:  (sql, p) => pool.run_(convertSql(sql), convertParams(p)),
};

// ─── TENANT DB HELPERS ───────────────────────────────────────────────────────
// All tenant queries get an extra user_id filter injected via getTenantDb
const makeTenantDb = (userId) => ({
  userId,
  getAsync:  (sql, p) => pool.get_(convertSql(sql), convertParams(p)),
  allAsync:  (sql, p) => pool.query_(convertSql(sql), convertParams(p)),
  runAsync:  (sql, p) => pool.run_(convertSql(sql), convertParams(p)),
});

// ─── SQL CONVERSION: SQLite → PostgreSQL ─────────────────────────────────────
function convertSql(sql) {
  // Replace ? placeholders with $1, $2, ...
  let i = 0;
  sql = sql.replace(/\?/g, () => `$${++i}`);

  // SQLite date functions → PostgreSQL
  sql = sql.replace(/DATE\('now'\)/gi, "CURRENT_DATE");
  sql = sql.replace(/DATE\('now',\s*'([^']+)'\)/gi, (_, interval) => {
    const m = interval.match(/([+-]\d+)\s*(day|month|year)s?/i);
    if (m) return `(CURRENT_DATE + INTERVAL '${m[1]} ${m[2]}')`;
    return 'CURRENT_DATE';
  });
  sql = sql.replace(/datetime\('now','localtime'\)/gi, "NOW()");
  sql = sql.replace(/datetime\('now'\)/gi, "NOW()");

  // strftime('%Y-%m', col) → to_char(col, 'YYYY-MM')
  sql = sql.replace(/strftime\('%Y-%m',\s*([^)]+)\)/gi, "to_char($1, 'YYYY-MM')");
  // strftime('%Y', col) → to_char(col, 'YYYY')
  sql = sql.replace(/strftime\('%Y',\s*([^)]+)\)/gi, "to_char($1, 'YYYY')");

  // DATE(col) → col::date
  sql = sql.replace(/DATE\(([^)]+)\)/gi, "$1::date");

  // AUTOINCREMENT → SERIAL (handled in schema, not needed here)
  // INTEGER PRIMARY KEY AUTOINCREMENT → handled in initDb

  // COALESCE stays same
  // BETWEEN stays same

  return sql;
}

function convertParams(p = []) {
  return p.map(v => v === undefined ? null : v);
}

// ─── SCHEMA INIT ─────────────────────────────────────────────────────────────
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── MASTER TABLES ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL UNIQUE,
        password   TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          TEXT NOT NULL,
        business_name TEXT,
        business_type TEXT NOT NULL DEFAULT 'general_store',
        email         TEXT NOT NULL UNIQUE,
        password      TEXT NOT NULL,
        plan          TEXT NOT NULL DEFAULT 'monthly',
        status        TEXT NOT NULL DEFAULT 'pending',
        expires_at    TIMESTAMPTZ,
        phone         TEXT,
        address       TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount       NUMERIC NOT NULL,
        note         TEXT,
        activated_by INTEGER,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── TENANT TABLES (all with user_id) ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        name       TEXT NOT NULL,
        phone      TEXT,
        email      TEXT,
        address    TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        name       TEXT NOT NULL,
        phone      TEXT,
        email      TEXT,
        address    TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_orders (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL,
        supplier_id   INTEGER,
        supplier_name TEXT,
        total         NUMERIC DEFAULT 0,
        status        TEXT DEFAULT 'pending',
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_order_items (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        order_id   INTEGER NOT NULL,
        item_id    INTEGER,
        item_name  TEXT NOT NULL,
        quantity   INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        total      NUMERIC NOT NULL
      )
    `);

    // ── TYRE SHOP ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS tyres (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER NOT NULL,
        brand               TEXT NOT NULL,
        model               TEXT NOT NULL,
        size                TEXT NOT NULL,
        type                TEXT DEFAULT 'Passenger',
        price               NUMERIC NOT NULL,
        cost_price          NUMERIC DEFAULT 0,
        car_type            TEXT DEFAULT '',
        stock               INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        barcode             TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tyres_barcode
      ON tyres(user_id, barcode)
      WHERE barcode IS NOT NULL AND barcode != ''
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS spare_parts (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER NOT NULL,
        name                TEXT NOT NULL,
        category            TEXT DEFAULT 'General',
        brand               TEXT,
        price               NUMERIC NOT NULL,
        cost_price          NUMERIC DEFAULT 0,
        car_type            TEXT DEFAULT '',
        stock               INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        barcode             TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_spare_parts_barcode
      ON spare_parts(user_id, barcode)
      WHERE barcode IS NOT NULL AND barcode != ''
    `);

    // ── RESTAURANT ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        name       TEXT NOT NULL,
        category   TEXT,
        size       TEXT DEFAULT 'Regular',
        price      NUMERIC NOT NULL,
        cost       NUMERIC DEFAULT 0,
        available  INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL,
        table_id       INTEGER,
        customer_name  TEXT,
        subtotal       NUMERIC NOT NULL,
        discount       NUMERIC DEFAULT 0,
        tax            NUMERIC DEFAULT 0,
        total          NUMERIC NOT NULL,
        payment_method TEXT DEFAULT 'Cash',
        status         TEXT DEFAULT 'completed',
        notes          TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL,
        order_id       INTEGER NOT NULL,
        item_id        INTEGER NOT NULL,
        item_name      TEXT NOT NULL,
        quantity       INTEGER NOT NULL,
        unit_price     NUMERIC NOT NULL,
        cost_price     NUMERIC DEFAULT 0,
        discount       NUMERIC DEFAULT 0,
        total          NUMERIC NOT NULL
      )
    `);

    // ── GENERAL STORE ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER NOT NULL,
        name                TEXT NOT NULL,
        category            TEXT,
        brand               TEXT,
        barcode             TEXT,
        price               NUMERIC NOT NULL,
        cost                NUMERIC DEFAULT 0,
        stock               INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode
      ON products(user_id, barcode)
      WHERE barcode IS NOT NULL AND barcode != ''
    `);

    // ── PHARMACY ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER NOT NULL,
        name                TEXT NOT NULL,
        generic_name        TEXT,
        company             TEXT,
        category            TEXT,
        barcode             TEXT,
        price               NUMERIC NOT NULL,
        cost                NUMERIC DEFAULT 0,
        stock               INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        expiry_date         DATE,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_medicines_barcode
      ON medicines(user_id, barcode)
      WHERE barcode IS NOT NULL AND barcode != ''
    `);

    // ── SALES (shared: tyre_shop, general_store, pharmacy) ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL,
        customer_id    INTEGER,
        customer_name  TEXT,
        subtotal       NUMERIC NOT NULL,
        discount       NUMERIC DEFAULT 0,
        tax            NUMERIC DEFAULT 0,
        total          NUMERIC NOT NULL,
        payment_method TEXT DEFAULT 'Cash',
        status         TEXT DEFAULT 'completed',
        notes          TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL,
        sale_id      INTEGER NOT NULL,
        tyre_id      INTEGER,
        tyre_name    TEXT,
        product_id   INTEGER,
        product_name TEXT,
        medicine_id  INTEGER,
        medicine_name TEXT,
        quantity     INTEGER NOT NULL,
        unit_price   NUMERIC NOT NULL,
        cost_price   NUMERIC DEFAULT 0,
        discount     NUMERIC DEFAULT 0,
        total        NUMERIC NOT NULL,
        item_type    TEXT DEFAULT 'tyre'
      )
    `);

    // ── DEFAULT ADMIN ──
    const adminCount = await client.query('SELECT COUNT(*) as c FROM admins');
    if (parseInt(adminCount.rows[0].c) === 0) {
      await client.query(
        'INSERT INTO admins (name,email,password) VALUES ($1,$2,$3)',
        ['Super Admin', 'ahsanraza@PrimePOS.com', 'AhsanRaza@1630']
      );
      console.log('Default admin created');
    }

    await client.query('COMMIT');
    console.log('PostgreSQL DB ready');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('DB init error:', e.message);
    throw e;
  } finally {
    client.release();
  }
};

initDb().catch(console.error);

const getTenantDb = (userId) => makeTenantDb(userId);

module.exports = { masterDb, getTenantDb, pool };
