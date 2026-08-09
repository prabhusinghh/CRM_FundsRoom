const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// Atomically adjusts a product's current_stock and writes a ledger row.
// Locks the product row for the duration of the transaction so concurrent
// movements on the same product can't race each other into negative stock.
//
// reference_type/reference_id let this be reused by other flows (e.g. a
// confirmed sales challan passes reference_type: 'CHALLAN', reference_id:
// challanId instead of the default 'MANUAL').
//
// Throws ApiError(404) if the product doesn't exist, ApiError(409) if an
// OUT movement would take stock negative.
const recordMovement = async (
  productId,
  { quantity_changed, movement_type, reason, reference_type = 'MANUAL', reference_id = null },
  userId,
  externalConn = null
) => {
  const conn = externalConn || (await pool.getConnection());
  const ownsConnection = !externalConn;

  try {
    if (ownsConnection) await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [
      productId,
    ]);
    const product = rows[0];
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const delta = movement_type === 'IN' ? quantity_changed : -quantity_changed;
    const newStock = product.current_stock + delta;

    if (newStock < 0) {
      throw new ApiError(
        409,
        `Insufficient stock for "${product.name}" (${product.sku}). Available: ${product.current_stock}, requested: ${quantity_changed}`
      );
    }

    await conn.query('UPDATE products SET current_stock = ? WHERE id = ?', [newStock, productId]);

    const [result] = await conn.query(
      `INSERT INTO stock_movements
        (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, quantity_changed, movement_type, reason || null, reference_type, reference_id, userId]
    );

    if (ownsConnection) await conn.commit();

    const [movementRows] = await conn.query('SELECT * FROM stock_movements WHERE id = ?', [
      result.insertId,
    ]);

    return { movement: movementRows[0], newStock };
  } catch (err) {
    if (ownsConnection) await conn.rollback();
    throw err;
  } finally {
    if (ownsConnection) conn.release();
  }
};

const findByProduct = async (productId, { page = 1, limit = 20 }) => {
  const safeLimit = Number(limit) || 20;
  const safePage = Number(page) || 1;
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [productId, safeLimit, offset]
  );

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS total FROM stock_movements WHERE product_id = ?',
    [productId]
  );

  return { rows, total: countRows[0].total };
};

module.exports = { recordMovement, findByProduct };
