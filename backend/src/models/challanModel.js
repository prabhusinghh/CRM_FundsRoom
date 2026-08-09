const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const stockMovementModel = require('./stockMovementModel');

// Generates the next challan number for the current calendar year, e.g.
// CH-2026-00001. Runs on the SAME connection/transaction as the challan
// insert — the UPSERT below locks the counter row for its duration, so
// concurrent requests can't land on the same number or skip one.
const nextChallanNumber = async (conn) => {
  const year = new Date().getFullYear();

  await conn.query(
    `INSERT INTO challan_counters (year, last_number) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
    [year]
  );
  const [rows] = await conn.query('SELECT last_number FROM challan_counters WHERE year = ?', [
    year,
  ]);
  return `CH-${year}-${String(rows[0].last_number).padStart(5, '0')}`;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT c.*, cu.name AS customer_name, cu.mobile AS customer_mobile
     FROM challans c
     JOIN customers cu ON cu.id = c.customer_id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;

  const [items] = await pool.query('SELECT * FROM challan_items WHERE challan_id = ? ORDER BY id', [
    id,
  ]);

  return { ...rows[0], items };
};

const findAll = async ({ status, customerId, page = 1, limit = 20 }) => {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  if (customerId) {
    conditions.push('c.customer_id = ?');
    params.push(customerId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Number(limit) || 20;
  const safePage = Number(page) || 1;
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT c.*, cu.name AS customer_name
     FROM challans c
     JOIN customers cu ON cu.id = c.customer_id
     ${whereClause}
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM challans c ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
};

// Creates a challan with product snapshots. If status is 'Confirmed', stock
// is deducted as part of THIS SAME transaction — so if any item has
// insufficient stock, the whole challan is rolled back and never created at
// all, rather than being left behind as an inconsistent draft.
const create = async ({ customer_id, items, status }, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query('SELECT id FROM customers WHERE id = ? LIMIT 1', [
      customer_id,
    ]);
    if (!custRows[0]) {
      throw new ApiError(404, 'Customer not found');
    }

    const snapshotItems = [];
    let totalQuantity = 0;
    for (const item of items) {
      const [prodRows] = await conn.query('SELECT * FROM products WHERE id = ? LIMIT 1', [
        item.product_id,
      ]);
      const product = prodRows[0];
      if (!product) {
        throw new ApiError(404, `Product id ${item.product_id} not found`);
      }
      snapshotItems.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        product_sku_snapshot: product.sku,
        unit_price_snapshot: product.unit_price,
        quantity: item.quantity,
      });
      totalQuantity += item.quantity;
    }

    const challanNumber = await nextChallanNumber(conn);
    const finalStatus = status === 'Confirmed' ? 'Confirmed' : 'Draft';

    const [result] = await conn.query(
      `INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by, confirmed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        challanNumber,
        customer_id,
        totalQuantity,
        finalStatus,
        userId,
        finalStatus === 'Confirmed' ? new Date() : null,
      ]
    );
    const challanId = result.insertId;

    for (const item of snapshotItems) {
      await conn.query(
        `INSERT INTO challan_items
          (challan_id, product_id, product_name_snapshot, product_sku_snapshot, unit_price_snapshot, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          challanId,
          item.product_id,
          item.product_name_snapshot,
          item.product_sku_snapshot,
          item.unit_price_snapshot,
          item.quantity,
        ]
      );
    }

    if (finalStatus === 'Confirmed') {
      for (const item of snapshotItems) {
        // Reuses the same locking/negative-stock-guard logic as manual
        // stock movements, on the SAME connection so it's part of this
        // transaction — one insufficient item aborts the entire challan.
        await stockMovementModel.recordMovement(
          item.product_id,
          {
            quantity_changed: item.quantity,
            movement_type: 'OUT',
            reason: `Sales challan ${challanNumber}`,
            reference_type: 'CHALLAN',
            reference_id: challanId,
          },
          userId,
          conn
        );
      }
    }

    await conn.commit();
    return findById(challanId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Replaces customer_id and/or the full item list. Only allowed while Draft.
const updateDraft = async (id, { customer_id, items }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [challanRows] = await conn.query('SELECT * FROM challans WHERE id = ? FOR UPDATE', [id]);
    const challan = challanRows[0];
    if (!challan) {
      throw new ApiError(404, 'Challan not found');
    }
    if (challan.status !== 'Draft') {
      throw new ApiError(409, `Only Draft challans can be edited (current status: ${challan.status})`);
    }

    let newCustomerId = challan.customer_id;
    if (customer_id !== undefined) {
      const [custRows] = await conn.query('SELECT id FROM customers WHERE id = ? LIMIT 1', [
        customer_id,
      ]);
      if (!custRows[0]) {
        throw new ApiError(404, 'Customer not found');
      }
      newCustomerId = customer_id;
    }

    let totalQuantity = challan.total_quantity;

    if (items !== undefined) {
      await conn.query('DELETE FROM challan_items WHERE challan_id = ?', [id]);

      totalQuantity = 0;
      for (const item of items) {
        const [prodRows] = await conn.query('SELECT * FROM products WHERE id = ? LIMIT 1', [
          item.product_id,
        ]);
        const product = prodRows[0];
        if (!product) {
          throw new ApiError(404, `Product id ${item.product_id} not found`);
        }

        await conn.query(
          `INSERT INTO challan_items
            (challan_id, product_id, product_name_snapshot, product_sku_snapshot, unit_price_snapshot, quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, product.id, product.name, product.sku, product.unit_price, item.quantity]
        );
        totalQuantity += item.quantity;
      }
    }

    await conn.query('UPDATE challans SET customer_id = ?, total_quantity = ? WHERE id = ?', [
      newCustomerId,
      totalQuantity,
      id,
    ]);

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Confirms a Draft challan: deducts stock for every line item inside one
// transaction. Any single insufficient item rolls back ALL of them — the
// challan stays Draft and no stock moves at all, rather than partially
// fulfilling the order.
const confirm = async (id, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [challanRows] = await conn.query('SELECT * FROM challans WHERE id = ? FOR UPDATE', [id]);
    const challan = challanRows[0];
    if (!challan) {
      throw new ApiError(404, 'Challan not found');
    }
    if (challan.status !== 'Draft') {
      throw new ApiError(
        409,
        `Only Draft challans can be confirmed (current status: ${challan.status})`
      );
    }

    const [items] = await conn.query('SELECT * FROM challan_items WHERE challan_id = ?', [id]);
    if (items.length === 0) {
      throw new ApiError(400, 'Cannot confirm a challan with no items');
    }

    for (const item of items) {
      await stockMovementModel.recordMovement(
        item.product_id,
        {
          quantity_changed: item.quantity,
          movement_type: 'OUT',
          reason: `Sales challan ${challan.challan_number}`,
          reference_type: 'CHALLAN',
          reference_id: id,
        },
        userId,
        conn
      );
    }

    await conn.query("UPDATE challans SET status = 'Confirmed', confirmed_at = NOW() WHERE id = ?", [
      id,
    ]);

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Draft -> Cancelled: no stock effect (nothing was ever deducted).
// Confirmed -> Cancelled: reverses the stock the challan had taken out.
const cancel = async (id, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [challanRows] = await conn.query('SELECT * FROM challans WHERE id = ? FOR UPDATE', [id]);
    const challan = challanRows[0];
    if (!challan) {
      throw new ApiError(404, 'Challan not found');
    }
    if (challan.status === 'Cancelled') {
      throw new ApiError(409, 'Challan is already cancelled');
    }

    if (challan.status === 'Confirmed') {
      const [items] = await conn.query('SELECT * FROM challan_items WHERE challan_id = ?', [id]);
      for (const item of items) {
        await stockMovementModel.recordMovement(
          item.product_id,
          {
            quantity_changed: item.quantity,
            movement_type: 'IN',
            reason: `Cancelled challan ${challan.challan_number} — stock reversal`,
            reference_type: 'CHALLAN',
            reference_id: id,
          },
          userId,
          conn
        );
      }
    }

    await conn.query("UPDATE challans SET status = 'Cancelled' WHERE id = ?", [id]);

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { create, findById, findAll, updateDraft, confirm, cancel };
