import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'raahat',
  password: 'admin',
  port: 5432,
});

async function run() {
  try {
    await pool.query("UPDATE admins SET password_hash = $1 WHERE officer_id = $2", ['$2b$10$6ChSakCh5s4wRQ3kdtWv/.JKidfqkkJbjVeHj6LtZQvUKCm3W6Z6a', 'ADM001']);
    console.log('Password updated successfully');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
