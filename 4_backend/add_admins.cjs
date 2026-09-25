const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/raahat'
});

async function main() {
  try {
    const res = await pool.query("SELECT officer_id, name, designation, department, district FROM admins ORDER BY id");
    console.log(`✅ Connected to PostgreSQL. Found ${res.rows.length} admins:`);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();