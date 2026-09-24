/**
 * db/connection.js — PostgreSQL Connection Pool & Query Interface
 *
 * Provides connection pooling via 'pg' with helper methods for clean async queries.
 */

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded
dotenv.config({ path: path.join(__dirname, '..', '..', '6_side_work', '.env') });

const { Pool } = pg;

let pool;
let dbWrapper;

/**
 * Normalizes SQL queries by translating '?' placeholders to PostgreSQL '$1, $2, ...'
 */
export function normalizeSql(sql) {
  if (typeof sql !== 'string' || !sql.includes('?')) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

/**
 * Initializes and returns the PostgreSQL database connection wrapper
 */
export function getDB() {
  if (dbWrapper) return dbWrapper;

  const connectionString = process.env.DATABASE_URL || undefined;

  const poolConfig = connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || 'raahat',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  async function query(sql, params = []) {
    const text = normalizeSql(sql);
    return pool.query(text, params);
  }

  async function get(sql, params = []) {
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  async function all(sql, params = []) {
    const res = await query(sql, params);
    return res.rows;
  }

  async function run(sql, params = []) {
    let text = sql;
    const isInsert = /^\s*insert\s+into\s+/i.test(text);
    if (isInsert && !/returning\s+/i.test(text)) {
      text = `${text.trim().replace(/;$/, '')} RETURNING id`;
    }
    const res = await query(text, params);
    const lastInsertRowid = res.rows?.[0]?.id ?? null;
    return {
      rowCount: res.rowCount,
      rows: res.rows,
      lastInsertRowid,
    };
  }

  async function exec(sql) {
    return pool.query(sql);
  }

  async function transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tx = {
        query: async (sql, params = []) => client.query(normalizeSql(sql), params),
        get: async (sql, params = []) => {
          const res = await client.query(normalizeSql(sql), params);
          return res.rows[0] || null;
        },
        all: async (sql, params = []) => {
          const res = await client.query(normalizeSql(sql), params);
          return res.rows;
        },
        run: async (sql, params = []) => {
          let text = sql;
          const isInsert = /^\s*insert\s+into\s+/i.test(text);
          if (isInsert && !/returning\s+/i.test(text)) {
            text = `${text.trim().replace(/;$/, '')} RETURNING id`;
          }
          const res = await client.query(normalizeSql(text), params);
          const lastInsertRowid = res.rows?.[0]?.id ?? null;
          return {
            rowCount: res.rowCount,
            rows: res.rows,
            lastInsertRowid,
          };
        },
      };

      const result = await callback(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async function close() {
    if (pool) {
      await pool.end();
      pool = null;
      dbWrapper = null;
    }
  }

  dbWrapper = {
    pool,
    query,
    get,
    all,
    run,
    exec,
    transaction,
    close,
  };

  return dbWrapper;
}

export default getDB;
