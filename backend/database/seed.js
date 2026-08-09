// Seeds one demo user per role so you can log in and test immediately.
// Run: npm run seed  (after schema.sql has been applied and .env is configured)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const users = [
  { name: 'Admin User', email: 'admin@erp.local', password: 'Admin@123', role: 'Admin' },
  { name: 'Sales User', email: 'sales@erp.local', password: 'Sales@123', role: 'Sales' },
  { name: 'Warehouse User', email: 'warehouse@erp.local', password: 'Warehouse@123', role: 'Warehouse' },
  { name: 'Accounts User', email: 'accounts@erp.local', password: 'Accounts@123', role: 'Accounts' },
];

const run = async () => {
  try {
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
        [u.name, u.email, hash, u.role]
      );
    }
    console.log('Seed complete. Demo logins:');
    users.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email} / ${u.password}`));
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

run();
