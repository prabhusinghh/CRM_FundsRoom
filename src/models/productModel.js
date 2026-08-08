const pool = require('../config/db');

// current_stock is deliberately excluded — it must only change via
// stockMovementModel.recordMovement() so the stock_movements ledger always
// explains every change in current_stock.
const PRODUCT_FIELDS = ['name', 'sku', 'category', 'unit_price', 'min_stock_alert', 'warehouse_location'];

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

const findBySku = async (sku) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE sku = ? LIMIT 1', [sku]);
  return rows[0] || null;
};

const create = async (input) => {
  const { name, sku, category, unit_price, current_stock, min_stock_alert, warehouse_location } =
    input;

  const [result] = await pool.query(
    `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, warehouse_location)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      sku,
      category || null,
      unit_price,
      current_stock || 0,
      min_stock_alert || 0,
      warehouse_location || null,
    ]
  );

  return findById(result.insertId);
};

// search: matches name or SKU. lowStock: true -> only products at/under their alert threshold.
const findAll = async ({ search, category, lowStock, page = 1, limit = 20 }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR sku LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (lowStock) {
    conditions.push('current_stock <= min_stock_alert');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Number(limit) || 20;
  const safePage = Number(page) || 1;
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
};

// Partial update — only touches fields that were sent. current_stock is
// never accepted here even if present in the body (see PRODUCT_FIELDS above).
const update = async (id, input) => {
  const setClauses = [];
  const params = [];

  for (const key of PRODUCT_FIELDS) {
    if (input[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      params.push(input[key] === '' ? null : input[key]);
    }
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  params.push(id);
  await pool.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

module.exports = { create, findById, findBySku, findAll, update };
