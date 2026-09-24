/**
 * 4_backend/init_db.mjs — Initialize PostgreSQL Database
 *
 * 1. Executes schema.postgresql.sql
 * 2. Seeds initial users and admin officers
 * 3. Resets primary key sequences for seamless auto-increment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import getDB from './db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_USERS = [
  {
    id: 2,
    name: 'siddharth khedekar',
    mobile: '9321546064',
    email: null,
    password_hash: '$2b$10$5t3weSitt3bU9EGSm/fYjeKFR2RuOycN574DBR3ty4m3aIiktDMCG',
    dob: '2006-05-30',
    state: 'Maharashtra',
    district: 'raigad',
    address: 'panvel',
    category: 'SC',
    language: 'English',
    case_id: 'RAH-2026-82153',
    created_at: '2026-09-14 03:36:33'
  },
  {
    id: 3,
    name: 'Test User',
    mobile: '+919876543210',
    email: null,
    password_hash: '$2b$10$8RHKqck2JHPRi2PFfOWyUOv63hWnEW3IYHEcJW50zkz471LKHjWuG',
    dob: null,
    state: 'Maharashtra',
    district: '',
    address: '',
    category: '',
    language: 'English',
    case_id: 'RAH-2026-34596',
    created_at: '2026-09-18 13:47:34'
  },
  {
    id: 4,
    name: 'Verify User',
    mobile: '+919000000001',
    email: null,
    password_hash: '$2b$10$OrOZJaxI4/HB56bH6DDLw.T7fmR9vOk/klwF8/PjKtMLACs/oQhy6',
    dob: null,
    state: 'Maharashtra',
    district: '',
    address: '',
    category: '',
    language: 'English',
    case_id: 'RAH-2026-13847',
    created_at: '2026-09-19 11:40:12'
  }
];

const SEED_ADMINS = [
  {
    id: 1,
    officer_id: 'ADM001',
    name: 'Test Admin',
    designation: 'District Magistrate',
    department: 'Social Welfare',
    password_hash: '$2b$10$kcr2ClnIxzwp.pkUdepWGeHNPOGrh6GkvoPYLUO4yJNuY2cN5QSMi',
    email: null,
    phone: null,
    district: 'raigad',
    state: 'Maharashtra',
    created_at: '2026-09-18 13:48:25'
  },
  {
    id: 2,
    officer_id: 'ADM002',
    name: 'No Token Admin',
    designation: 'Nodal Officer',
    department: 'Police Coordination',
    password_hash: '$2b$10$YCSWmvl7XwL3L2rAKRV1h.GRSacmDuryyYvWgZ3rN7GKTPRkUio8i',
    email: null,
    phone: null,
    district: '',
    state: 'Maharashtra',
    created_at: '2026-09-18 13:48:26'
  },
  {
    id: 3,
    officer_id: 'ADM003',
    name: 'Wrong Token Admin',
    designation: 'Special Prosecutor',
    department: 'Legal Aid',
    password_hash: '$2b$10$mQ6LJvXF1o8V9TOsY9AdpONuUwXnN6IG1B4XZgYkfDGceFdbSyGbu',
    email: null,
    phone: null,
    district: '',
    state: 'Maharashtra',
    created_at: '2026-09-18 13:48:44'
  },
  {
    id: 4,
    officer_id: 'ADM-SEC-01',
    name: 'Sec Admin',
    designation: 'Security In-Charge',
    department: 'NHAA HQ',
    password_hash: '$2b$10$X.kTIvdExNC79C8hCHoI7uYJcZH8WSvxbGZBnMmQbxzeJ1eQbw.Oq',
    email: null,
    phone: null,
    district: '',
    state: 'Maharashtra',
    created_at: '2026-09-19 11:40:12'
  },
  {
    id: 5,
    officer_id: 'ADM-SEC-02',
    name: 'Sec Admin 2',
    designation: 'Relief Coordinator',
    department: 'DoSJE',
    password_hash: '$2b$10$KZtj4uN4boAIRe7QGl791.XUnzBDQYABhDqhvUgw2NjOFSpgePqxy',
    email: null,
    phone: null,
    district: '',
    state: 'Maharashtra',
    created_at: '2026-09-19 11:40:12'
  }
];

const SEED_COUNSELLORS = [
  {
    id: 1,
    name: 'Dr. Priya Sharma',
    specialization: 'Trauma & Caste Discrimination',
    language: 'Hindi',
    district_coverage: 'All',
    availability: '24/7',
    assigned_cases: 0,
    status: 'available'
  },
  {
    id: 2,
    name: 'Dr. Rajesh Kumar',
    specialization: 'Crisis Intervention',
    language: 'Hindi, English',
    district_coverage: 'All',
    availability: 'Mon-Sat 9AM-6PM',
    assigned_cases: 0,
    status: 'available'
  }
];

async function init() {
  console.log('🔄 Initializing PostgreSQL database for RAAHAT...');
  const db = getDB();

  // 1. Run PostgreSQL Schema
  const schemaPath = path.join(__dirname, 'db', 'schema.postgresql.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.exec(schemaSql);
  console.log('✅ PostgreSQL schema executed successfully.');

  // 2. Seed initial users
  for (const u of SEED_USERS) {
    await db.query(`
      INSERT INTO users (id, name, mobile, email, password_hash, dob, state, district, address, category, language, case_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile = EXCLUDED.mobile,
        password_hash = EXCLUDED.password_hash
    `, [u.id, u.name, u.mobile, u.email, u.password_hash, u.dob, u.state, u.district, u.address, u.category, u.language, u.case_id, u.created_at, u.created_at]);
  }
  console.log(`✅ Seeded ${SEED_USERS.length} users.`);

  // 3. Seed initial admins
  for (const a of SEED_ADMINS) {
    await db.query(`
      INSERT INTO admins (id, officer_id, name, designation, department, password_hash, email, phone, district, state, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        officer_id = EXCLUDED.officer_id,
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
    `, [a.id, a.officer_id, a.name, a.designation, a.department, a.password_hash, a.email, a.phone, a.district, a.state, a.created_at]);
  }
  console.log(`✅ Seeded ${SEED_ADMINS.length} admins.`);

  // 4. Seed initial counsellors
  for (const c of SEED_COUNSELLORS) {
    await db.query(`
      INSERT INTO counsellors (id, name, specialization, language, district_coverage, availability, assigned_cases, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        specialization = EXCLUDED.specialization,
        status = EXCLUDED.status
    `, [c.id, c.name, c.specialization, c.language, c.district_coverage, c.availability, c.assigned_cases, c.status]);
  }
  console.log(`✅ Seeded ${SEED_COUNSELLORS.length} counsellors.`);

  // 4. Reset sequences to MAX(id) + 1
  const tablesWithSequences = [
    { table: 'users', seq: 'users_id_seq' },
    { table: 'admins', seq: 'admins_id_seq' },
    { table: 'cases', seq: 'cases_id_seq' },
    { table: 'assessment_factors', seq: 'assessment_factors_id_seq' },
    { table: 'assessment_indicators', seq: 'assessment_indicators_id_seq' },
    { table: 'recommendations', seq: 'recommendations_id_seq' },
    { table: 'counsellors', seq: 'counsellors_id_seq' },
    { table: 'assignments', seq: 'assignments_id_seq' },
    { table: 'audit_log', seq: 'audit_log_id_seq' },
    { table: 'case_journey', seq: 'case_journey_id_seq' },
  ];

  for (const { table, seq } of tablesWithSequences) {
    try {
      await db.query(`
        SELECT setval($1, GREATEST(COALESCE((SELECT MAX(id) FROM ${table}), 0), 1), true)
      `, [seq]);
    } catch {
      // ignore
    }
  }
  console.log('✅ Sequences synchronized.');

  // 5. Verification summary
  const tableSummary = await db.all(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('📊 Active PostgreSQL Tables in raahat:');
  for (const { table_name } of tableSummary) {
    const countRes = await db.get(`SELECT COUNT(*) as c FROM ${table_name}`);
    console.log(`   - ${table_name}: ${countRes?.c || 0} rows`);
  }

  await db.close();
  console.log('✨ PostgreSQL initialization finished.');
}

init().catch((err) => {
  console.error('❌ Failed to initialize PostgreSQL:', err);
  process.exit(1);
});
