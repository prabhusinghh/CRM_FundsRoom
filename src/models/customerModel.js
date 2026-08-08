const pool = require('../config/db');

const CUSTOMER_FIELDS = [
  'name',
  'mobile',
  'email',
  'business_name',
  'gst_number',
  'customer_type',
  'address',
  'status',
  'follow_up_date',
  'notes',
];

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

const create = async (input, userId) => {
  const {
    name,
    mobile,
    email,
    business_name,
    gst_number,
    customer_type,
    address,
    status,
    follow_up_date,
    notes,
  } = input;

  const [result] = await pool.query(
    `INSERT INTO customers
      (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      mobile,
      email || null,
      business_name || null,
      gst_number || null,
      customer_type || 'Retail',
      address || null,
      status || 'Lead',
      follow_up_date || null,
      notes || null,
      userId,
    ]
  );

  return findById(result.insertId);
};

// search: matches name, mobile, business_name, or email (partial, case-insensitive)
const findAll = async ({ search, status, customerType, page = 1, limit = 20 }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR mobile LIKE ? OR business_name LIKE ? OR email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (customerType) {
    conditions.push('customer_type = ?');
    params.push(customerType);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Number(limit) || 20;
  const safePage = Number(page) || 1;
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM customers ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
};

// Partial update — only touches fields that were actually sent.
const update = async (id, input) => {
  const setClauses = [];
  const params = [];

  for (const key of CUSTOMER_FIELDS) {
    if (input[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      params.push(input[key] === '' ? null : input[key]);
    }
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  params.push(id);
  await pool.query(`UPDATE customers SET ${setClauses.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

const addFollowup = async (customerId, { note, follow_up_date }, userId) => {
  const [result] = await pool.query(
    `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
     VALUES (?, ?, ?, ?)`,
    [customerId, note, follow_up_date || null, userId]
  );

  // Keep the customer's "next follow-up" pointer in sync when one is given.
  if (follow_up_date) {
    await pool.query('UPDATE customers SET follow_up_date = ? WHERE id = ?', [
      follow_up_date,
      customerId,
    ]);
  }

  const [rows] = await pool.query('SELECT * FROM customer_followups WHERE id = ?', [
    result.insertId,
  ]);
  return rows[0];
};

const getFollowups = async (customerId) => {
  const [rows] = await pool.query(
    'SELECT * FROM customer_followups WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );
  return rows;
};

module.exports = { create, findById, findAll, update, addFollowup, getFollowups };
