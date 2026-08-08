const pool = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findByEmail, findById };
