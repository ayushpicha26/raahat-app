import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;

class MemoryStore {
  constructor() {
    this.tables = {
      users: [],
      admins: [],
      cases: [],
      help_centers: [],
      assessment_factors: [],
      assessment_indicators: [],
      recommendations: [],
      audit_log: []
    };
    this.autoIncrement = { users: 1, admins: 1, cases: 1, help_centers: 1, assessment_factors: 1, assessment_indicators: 1, recommendations: 1, audit_log: 1 };
  }

  async query(sql, params = []) {
    const s = sql.trim().replace(/;\s*$/, '');
    
    // Simple table creation / indexing - no-op for memory
    if (/^CREATE\s+/i.test(s)) {
      return { rows: [] };
    }
    if (/^BEGIN|^COMMIT|^ROLLBACK/i.test(s)) {
      return { rows: [] };
    }

    // INSERT INTO table (...) VALUES (...)
    const insertMatch = s.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const table = insertMatch[1].toLowerCase();
      const cols = insertMatch[2].split(',').map(c => c.trim());
      const row = {};
      
      const nextId = this.autoIncrement[table] ? this.autoIncrement[table]++ : Math.floor(Math.random() * 100000);
      row.id = nextId;
      row.created_at = new Date().toISOString();
      row.updated_at = new Date().toISOString();

      cols.forEach((col, idx) => {
        row[col] = params[idx] !== undefined ? params[idx] : null;
      });

      if (!this.tables[table]) this.tables[table] = [];
      this.tables[table].push(row);
      return { rows: [{ id: row.id, ...row }] };
    }

    // SELECT COUNT(*) FROM table ...
    if (/SELECT\s+COUNT\(\*\)/i.test(s)) {
      const tableMatch = s.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      const table = tableMatch ? tableMatch[1].toLowerCase() : 'cases';
      let list = this.tables[table] || [];
      if (/WHERE\s+priority\s*=\s*'Critical'/i.test(s)) list = list.filter(r => r.priority === 'Critical');
      else if (/WHERE\s+priority\s*=\s*'High'/i.test(s)) list = list.filter(r => r.priority === 'High');
      else if (/WHERE\s+priority\s*=\s*'Moderate'/i.test(s)) list = list.filter(r => r.priority === 'Moderate');
      else if (/WHERE\s+priority\s*=\s*'Low'/i.test(s)) list = list.filter(r => r.priority === 'Low');
      else if (/WHERE\s+status\s+IN/i.test(s)) list = list.filter(r => ['Assessment Pending', 'Under Review', 'Human Review Required'].includes(r.status));
      return { rows: [{ c: list.length }] };
    }

    // SELECT AVG(svi)
    if (/AVG\(svi\)/i.test(s)) {
      const cases = this.tables.cases || [];
      const avg = cases.length ? (cases.reduce((sum, c) => sum + Number(c.svi || 0), 0) / cases.length).toFixed(1) : 0;
      return { rows: [{ avg, "avgSvi": avg, cases: cases.length }] };
    }

    // SELECT * FROM table WHERE col = $1 OR col = $2 ...
    const selectMatch = s.match(/SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (selectMatch) {
      const table = selectMatch[2].toLowerCase();
      let list = [...(this.tables[table] || [])];
      const whereClause = selectMatch[3];

      if (whereClause && params.length > 0) {
        if (/officer_id\s*=\s*\$1/i.test(whereClause)) {
          list = list.filter(r => r.officer_id === params[0]);
        } else if (/(?:mobile\s*=\s*\$1\s+OR\s+email\s*=\s*\$2)/i.test(whereClause)) {
          list = list.filter(r => r.mobile === params[0] || r.email === params[1]);
        } else if (/mobile\s*=\s*\$1/i.test(whereClause)) {
          list = list.filter(r => r.mobile === params[0]);
        } else if (/email\s*=\s*\$1/i.test(whereClause)) {
          list = list.filter(r => r.email === params[0]);
        } else if (/case_id\s*=\s*\$1/i.test(whereClause)) {
          list = list.filter(r => r.case_id === params[0]);
        } else if (/user_id\s*=\s*\$1/i.test(whereClause)) {
          list = list.filter(r => String(r.user_id) === String(params[0]));
        } else if (/id\s*=\s*\$1/i.test(whereClause)) {
          list = list.filter(r => String(r.id) === String(params[0]));
        }
      }

      return { rows: list };
    }

    // UPDATE table SET ...
    const updateMatch = s.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i);
    if (updateMatch) {
      const table = updateMatch[1].toLowerCase();
      const list = this.tables[table] || [];
      if (table === 'users' && /counselor_id\s*=\s*\$1/i.test(updateMatch[2]) && /id\s*=\s*\$2/i.test(updateMatch[3] || '')) {
        const user = list.find(row => String(row.id) === String(params[1]));
        if (!user) return { rows: [] };
        user.counselor_id = params[0];
        user.updated_at = new Date().toISOString();
        return { rows: [{ ...user }] };
      }
      return { rows: list };
    }

    return { rows: [] };
  }

  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }

  on() {}
}

class SQLiteWrapper {
  constructor(db) {
    this.db = db;
  }
  
  async query(sql, params = []) {
    let cleanSql = sql.trim();
    // Replace $1, $2, etc with ?
    const convertedSql = cleanSql.replace(/\$\d+/g, '?');
    
    // Convert boolean params to 1/0 for sqlite
    const convertedParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : p);
    
    const hasReturning = /RETURNING\s+/i.test(convertedSql);
    
    try {
      const stmt = this.db.prepare(convertedSql);
      
      if (stmt.reader) {
        const rows = stmt.all(...convertedParams);
        return { rows: rows || [] };
      } else if (hasReturning) {
        try {
          const rows = stmt.all(...convertedParams);
          return { rows: rows || [] };
        } catch {
          const info = stmt.run(...convertedParams);
          const lastId = typeof info.lastInsertRowid === 'bigint' ? Number(info.lastInsertRowid) : info.lastInsertRowid;
          return { rows: [{ id: lastId, ...info }] };
        }
      } else {
        const info = stmt.run(...convertedParams);
        const lastId = typeof info.lastInsertRowid === 'bigint' ? Number(info.lastInsertRowid) : info.lastInsertRowid;
        return { rows: [{ id: lastId, ...info }] };
      }
    } catch (err) {
      console.error(`SQLite query error: ${err.message}\nSQL: ${convertedSql}`);
      throw err;
    }
  }

  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {},
    };
  }

  on(event, cb) {}
}

export async function getDB() {
  if (pool) return pool;

  // 1. PostgreSQL (if DATABASE_URL provided)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    try {
      const isSSL = dbUrl.includes('sslmode=require') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase.co');
      const pgPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: isSSL ? { rejectUnauthorized: false } : false,
      });
      const client = await pgPool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();
      pool = pgPool;
    } catch (err) {
      console.warn('⚠️ Could not connect to PostgreSQL, falling back:', err.message);
      pool = null;
    }
  }

  // 2. Try better-sqlite3 dynamically
  if (!pool) {
    try {
      const betterSqlite3Module = await import('better-sqlite3');
      const Database = betterSqlite3Module.default || betterSqlite3Module;
      const dbPath = process.env.DATABASE_PATH || (process.env.VERCEL ? '/tmp/raahat.db' : 'raahat.db');
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      
      pool = new SQLiteWrapper(db);
      console.log(`✅ Connected to SQLite database at ${dbPath}`);
    } catch (err) {
      console.warn('⚠️ better-sqlite3 unavailable, using in-memory database:', err.message);
      pool = new MemoryStore();
    }
  }

  // ── Schema Initialization ──
  await initSchema(pool);

  return pool;
}

async function initSchema(p) {
  try {
    // Create tables (converting SERIAL to INTEGER PRIMARY KEY AUTOINCREMENT)
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT UNIQUE,
        email TEXT UNIQUE,
        alternate_phone TEXT,
        password_hash TEXT NOT NULL,
        dob TEXT,
        state TEXT DEFAULT 'Maharashtra',
        district TEXT DEFAULT '',
        address TEXT DEFAULT '',
        category TEXT DEFAULT '',
        language TEXT DEFAULT 'English',
        counselor_id TEXT DEFAULT '',
        case_id TEXT,
        account_type TEXT DEFAULT 'registered',
        is_guest INTEGER DEFAULT 0,
        guest_id TEXT,
        latitude REAL,
        longitude REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist on already-initialized databases
    try { await p.query("ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'registered'"); } catch {}
    try { await p.query("ALTER TABLE users ADD COLUMN is_guest INTEGER DEFAULT 0"); } catch {}
    try { await p.query("ALTER TABLE users ADD COLUMN guest_id TEXT"); } catch {}
    try { await p.query("ALTER TABLE users ADD COLUMN counselor_id TEXT DEFAULT ''"); } catch {}
    
    await p.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        officer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        designation TEXT DEFAULT '',
        department TEXT DEFAULT '',
        password_hash TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        district TEXT DEFAULT '',
        state TEXT DEFAULT 'Maharashtra',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        transcript TEXT NOT NULL,
        svi INTEGER NOT NULL,
        priority TEXT NOT NULL CHECK(priority IN ('Critical','High','Moderate','Low')),
        priority_label TEXT,
        problem_types TEXT,
        summary TEXT,
        consequences TEXT,
        status TEXT DEFAULT 'Assessment Pending',
        assigned_officer TEXT DEFAULT '',
        assigned_service TEXT DEFAULT '',
        language_detected TEXT DEFAULT 'English',
        audio_duration_seconds INTEGER DEFAULT 0,
        flagged_for_review INTEGER DEFAULT 0,
        ai_mode TEXT DEFAULT 'local',
        district TEXT DEFAULT '',
        state TEXT DEFAULT 'Maharashtra',
        latitude REAL,
        longitude REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS help_centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('shelter','police','legal','ngo','hospital','helpline')),
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        district TEXT DEFAULT '',
        state TEXT DEFAULT 'Maharashtra',
        timings TEXT DEFAULT '24/7',
        services TEXT DEFAULT ''
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS assessment_factors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL REFERENCES cases(case_id),
        label TEXT NOT NULL,
        value INTEGER NOT NULL,
        contribution TEXT,
        confidence TEXT DEFAULT 'High'
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS assessment_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL REFERENCES cases(case_id),
        indicator TEXT NOT NULL,
        level TEXT NOT NULL
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL REFERENCES cases(case_id),
        title TEXT NOT NULL,
        priority TEXT,
        priority_color TEXT,
        icon_type TEXT DEFAULT 'shield',
        description TEXT,
        cta TEXT,
        urgent INTEGER DEFAULT 0,
        scheme_code TEXT,
        helpline TEXT
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        actor_type TEXT CHECK(actor_type IN ('user','admin','system')),
        actor_id INTEGER,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await p.query('CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_factors_case ON assessment_factors(case_id);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_indicators_case ON assessment_indicators(case_id);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_recommendations_case ON recommendations(case_id);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);');
    await p.query('CREATE INDEX IF NOT EXISTS idx_help_centers_type ON help_centers(type);');

    // ── Seed if empty ──
    const caseRes = await p.query('SELECT COUNT(*) as c FROM cases');
    const userRes = await p.query('SELECT COUNT(*) as c FROM users');
    if (parseInt(caseRes.rows[0]?.c || 0, 10) === 0 || parseInt(userRes.rows[0]?.c || 0, 10) === 0) {
      await seedDatabase(p);
    }

    // Ensure counsellor demo accounts are available even when the database was seeded earlier.
    await seedCounsellorAccounts(p);

    // ── Seed help centers if empty ──
    const hcRes = await p.query('SELECT COUNT(*) as c FROM help_centers');
    if (parseInt(hcRes.rows[0]?.c || 0, 10) === 0) {
      await seedHelpCenters(p);
    }
  } catch (err) {
    console.warn('⚠️ Schema initialization / seeding skipped or failed:', err.message);
  }
}

async function seedDatabase(p) {
  const salt = bcrypt.genSaltSync(10);
  const demoPass = bcrypt.hashSync('raahat123', salt);
  const adminPass = bcrypt.hashSync('admin123', salt);

  // ── Seed Users ──
  const users = [
    ['Priya Sharma', '9876543210', 'priya.sharma@email.com', demoPass, '1992-03-15', 'Maharashtra', 'Nagpur', 'SC', 'English', 'RAH-2026-00124'],
    ['Ravi Meshram', '9876543211', 'ravi.m@email.com', demoPass, '1988-07-22', 'Maharashtra', 'Nashik', 'SC', 'Hindi', 'RAH-2026-00125'],
    ['Savita Bansode', '9876543212', 'savita.b@email.com', demoPass, '1995-11-08', 'Maharashtra', 'Pune', 'SC', 'Marathi', 'RAH-2026-00126'],
    ['Dinesh Kamble', '9876543213', 'dinesh.k@email.com', demoPass, '1990-01-30', 'Maharashtra', 'Solapur', 'SC', 'Hindi', 'RAH-2026-00127'],
    ['Meena Rathod', '9876543214', 'meena.r@email.com', demoPass, '1985-06-12', 'Maharashtra', 'Amravati', 'ST', 'Marathi', 'RAH-2026-00128'],
    ['Ashok Thorat', '9876543215', 'ashok.t@email.com', demoPass, '1978-09-25', 'Maharashtra', 'Chhatrapati Sambhajinagar', 'OBC', 'Hindi', 'RAH-2026-00129'],
    ['Lakshmi Pawar', '9876543216', 'lakshmi.p@email.com', demoPass, '1993-02-18', 'Maharashtra', 'Latur', 'SC', 'Marathi', 'RAH-2026-00130'],
    ['Suresh Nikam', '9876543217', 'suresh.n@email.com', demoPass, '1982-12-05', 'Maharashtra', 'Kolhapur', 'SC', 'English', 'RAH-2026-00131'],
    ['Gita Vishwakarma', '9876543218', 'gita.v@email.com', demoPass, '1997-04-20', 'Maharashtra', 'Jalgaon', 'OBC', 'Hindi', 'RAH-2026-00132'],
    ['Ramesh Dhale', '9876543219', 'ramesh.d@email.com', demoPass, '1975-08-14', 'Maharashtra', 'Satara', 'SC', 'Marathi', 'RAH-2026-00133'],
    ['Anita Gaikwad', '9876543220', 'anita.g@email.com', demoPass, '1991-10-03', 'Maharashtra', 'Sangli', 'SC', 'English', 'RAH-2026-00134'],
    ['Mohan Sonawane', '9876543221', 'mohan.s@email.com', demoPass, '1986-05-27', 'Maharashtra', 'Raigad', 'OBC', 'Marathi', 'RAH-2026-00135'],
  ];

  for (const u of users) {
    await p.query(
      `INSERT INTO users (name, mobile, email, password_hash, dob, state, district, category, language, case_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (mobile) DO NOTHING`,
      u
    );
  }

  const counsellorPass = bcrypt.hashSync('counsellor123', salt);

  // ── Seed Admin & Counsellors ──
  const admins = [
    ['ADM-MH-001', 'Dr. Anjali Deshmukh', 'District Collector', 'Revenue & Welfare', adminPass, 'anjali.deshmukh@gov.in', '020-25501000', 'Pune', 'Maharashtra'],
    ['ADM-MH-002', 'Shri Rajesh Patil', 'SP (Atrocity Cell)', 'Police', adminPass, 'rajesh.patil@police.gov.in', '020-26127337', 'Nagpur', 'Maharashtra'],
    ['CNS-MH-001', 'Dr. Meera Joshi', 'Counsellor — Trauma & Crisis', 'Counselling Services', counsellorPass, 'meera.joshi@raahat.gov.in', '0712-2560123', 'Nagpur', 'Maharashtra'],
    ['CNS-MH-002', 'Dr. Anjali Deshmukh', 'Counsellor — Women & Family Support', 'Counselling Services', counsellorPass, 'anjali.deshmukh@raahat.gov.in', '020-25501000', 'Pune', 'Maharashtra'],
    ['CNS-MH-003', 'Mr. Vikram Kulkarni', 'Counsellor — Youth & Psychosocial Support', 'Counselling Services', counsellorPass, 'vikram.kulkarni@raahat.gov.in', '0253-2578901', 'Nashik', 'Maharashtra'],
  ];

  for (const a of admins) {
    await p.query(
      `INSERT INTO admins (officer_id, name, designation, department, password_hash, email, phone, district, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (officer_id) DO UPDATE SET password_hash = excluded.password_hash`,
      a
    );
  }

  // ── Seed Cases ──
  const casesData = [
    ['RAH-2026-00124', 1, 'I am afraid to return home. They have been threatening my family. I cannot sleep at night and I feel very unsafe.', 91, 'Critical', 'CRITICAL PRIORITY', '["Threat / Intimidation","Acute Emotional Distress"]', 'Complainant reports severe threats to personal and family safety with acute fear indicators.', 'Delayed support may escalate physical risk.', 'Human Review Required', '', '', 'English', 22, 'Nagpur', 'Maharashtra', '2026-08-22 10:30:00'],
    ['RAH-2026-00125', 2, 'Our entire community has been boycotted. Nobody sells us supplies. Children cannot attend school.', 84, 'High', 'HIGH PRIORITY', '["Social Boycott","Identity-based Discrimination"]', 'Complainant reports community-wide social boycott affecting livelihood and education.', 'Continued boycott may cause severe socio-economic deprivation.', 'Counsellor Assigned', 'Dr. Meera Joshi', 'Counselling', 'Hindi', 18, 'Nashik', 'Maharashtra', '2026-08-22 14:15:00'],
    ['RAH-2026-00126', 3, 'I was denied entry to the temple and public water source. They used caste slurs and humiliated me publicly.', 78, 'High', 'HIGH PRIORITY', '["Caste-based Discrimination","Social Isolation"]', 'Complainant reports caste-based discrimination including denial of public amenities.', 'Sustained discrimination may cause psychological trauma.', 'Legal Aid Requested', '', 'Legal Aid', 'Marathi', 15, 'Pune', 'Maharashtra', '2026-08-21 09:45:00'],
    ['RAH-2026-00127', 4, 'I was beaten badly by a group of men near the market. I have injuries on my head and arms. I need immediate medical help and protection.', 72, 'High', 'HIGH PRIORITY', '["Violence / Physical Assault","Physical Safety & Medical Risk"]', 'Complainant reports physical assault with injuries requiring medical attention.', 'Delayed medical and legal intervention may worsen injuries.', 'Under Review', '', 'Medical + Legal', 'Hindi', 12, 'Solapur', 'Maharashtra', '2026-08-21 16:20:00'],
    ['RAH-2026-00128', 5, 'We were forced to leave our village after continuous harassment. We have nowhere to go. My children are very young.', 68, 'High', 'HIGH PRIORITY', '["Displacement","Housing / Displacement"]', 'Complainant reports forced displacement from village with young dependents.', 'Continued displacement without shelter may endanger dependents.', 'Support Assigned', 'Shri Anil Kumar', 'Counselling', 'Marathi', 20, 'Amravati', 'Maharashtra', '2026-08-20 11:00:00'],
    ['RAH-2026-00129', 6, 'I have a court case going on but I cannot afford a lawyer. The other party has political connections and I feel helpless.', 57, 'Moderate', 'MODERATE PRIORITY', '["Legal Proceeding Distress"]', 'Complainant reports legal distress due to inability to afford representation.', 'Lack of legal aid may result in unjust outcome.', 'In Progress', '', 'Legal Aid', 'Hindi', 14, 'Chhatrapati Sambhajinagar', 'Maharashtra', '2026-08-20 13:30:00'],
    ['RAH-2026-00130', 7, 'People in our mohalla have stopped talking to us. They refuse to let our children play with theirs.', 52, 'Moderate', 'MODERATE PRIORITY', '["Social Boycott"]', 'Complainant reports neighbourhood-level social boycott affecting family.', 'Social exclusion may escalate to more severe forms of discrimination.', 'Assessment Pending', '', '', 'Marathi', 10, 'Latur', 'Maharashtra', '2026-08-19 08:15:00'],
    ['RAH-2026-00131', 8, 'I was called derogatory names at my workplace because of my caste. My supervisor ignores my complaints.', 48, 'Moderate', 'MODERATE PRIORITY', '["Caste-based Discrimination"]', 'Complainant reports workplace caste-based harassment with unresponsive management.', 'Continued harassment may cause psychological harm and job loss.', 'Counsellor Assigned', 'Dr. Priya Sen', 'Counselling', 'English', 16, 'Kolhapur', 'Maharashtra', '2026-08-19 15:00:00'],
    ['RAH-2026-00132', 9, 'Some people from the upper caste have been threatening us to vacate our land. We have been living here for 30 years.', 44, 'Moderate', 'MODERATE PRIORITY', '["Threat / Intimidation","Housing / Displacement"]', 'Complainant reports land encroachment threats from dominant caste groups.', 'Loss of generational property may cause permanent displacement.', 'Under Review', '', '', 'Hindi', 18, 'Jalgaon', 'Maharashtra', '2026-08-18 10:45:00'],
    ['RAH-2026-00133', 10, 'I need legal help with my ongoing case. The hearing is next week and I still do not have proper documents.', 38, 'Low', 'LOW PRIORITY', '["Legal Proceeding Distress"]', 'Complainant requires document assistance for upcoming hearing.', 'Missing documents may weaken legal position.', 'Support Assigned', '', 'Legal Aid', 'Marathi', 8, 'Satara', 'Maharashtra', '2026-08-18 14:20:00'],
    ['RAH-2026-00134', 11, 'The boycott situation in our area has improved after the district administration intervened. We are cautiously hopeful.', 32, 'Low', 'LOW PRIORITY', '["Social Boycott"]', 'Complainant reports improving situation post-administrative intervention.', 'Monitoring recommended to ensure sustained improvement.', 'Resolved', 'Shri Vikram Rao', 'Counselling', 'English', 6, 'Sangli', 'Maharashtra', '2026-08-17 09:30:00'],
    ['RAH-2026-00135', 12, 'I would like to report that the counselling sessions have been helpful. I am feeling better now.', 28, 'Low', 'LOW PRIORITY', '["General Support"]', 'Complainant reports positive progress from counselling support.', 'Continued follow-up recommended.', 'Closed', 'Dr. Sonal Mehta', 'Counselling', 'Marathi', 5, 'Raigad', 'Maharashtra', '2026-08-17 16:00:00'],
  ];

  for (const c of casesData) {
    await p.query(
      `INSERT INTO cases (case_id, user_id, transcript, svi, priority, priority_label, problem_types, summary, consequences, status, assigned_officer, assigned_service, language_detected, audio_duration_seconds, district, state, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (case_id) DO NOTHING`,
      c
    );
  }

  // ── Seed Factors & Indicators for first case ──
  const cid = 'RAH-2026-00124';
  const factors = [
    [cid, 'Emotional Distress', 82, 'Critical', 'High'],
    [cid, 'Fear / Threat Level', 94, 'Critical', 'High'],
    [cid, 'Anxiety Indicators', 78, 'High', 'Moderate'],
    [cid, 'Social Isolation', 86, 'High', 'Moderate'],
    [cid, 'Immediate Safety Concerns', 92, 'Critical', 'High'],
    [cid, 'Overall Case Severity', 91, 'Critical', 'High'],
    [cid, 'Local Support Availability', 22, 'Low (Adverse)', 'High'],
  ];

  for (const f of factors) {
    await p.query(
      `INSERT INTO assessment_factors (case_id, label, value, contribution, confidence) VALUES ($1, $2, $3, $4, $5)`,
      f
    );
  }

  const indicators = [
    [cid, 'Perceived Threat Level', 'Critical'],
    [cid, 'Reported Fear', 'High'],
    [cid, 'Emotional Distress', 'High'],
    [cid, 'Anxiety Indicators', 'High'],
    [cid, 'Social Isolation', 'High'],
    [cid, 'Immediate Safety Concerns', 'Critical'],
  ];

  for (const ind of indicators) {
    await p.query(
      `INSERT INTO assessment_indicators (case_id, indicator, level) VALUES ($1, $2, $3)`,
      ind
    );
  }

  // ── Seed Recommendations ──
  const recs = [
    [cid, 'Immediate Safety & Protection', 'Immediate Attention', 'text-critical-700 bg-critical-50', 'shield', 'Emergency protection under Section 357A CrPC and Witness Protection Scheme 2018.', 'Contact Emergency: 14566 / 112', 1, 'WPS-2018', '14566'],
    [cid, 'Free Legal Aid (NALSA)', 'High Priority', 'text-high-700 bg-high-50', 'gavel', 'Connect with District Legal Services Authority (DLSA) for free legal representation under Legal Services Authorities Act 1987.', 'Contact DLSA Nagpur: 0712-2564911', 0, 'NALSA-LSA-1987', '0712-2564911'],
    [cid, 'Counselling & Psychological Support', 'High Priority', 'text-high-700 bg-high-50', 'message', 'Trauma-informed counselling through One Stop Centre (Sakhi) — Scheme for Women in Difficult Circumstances.', 'Request Counselling Session', 0, 'OSC-SAKHI', '181'],
    [cid, 'SC/ST Atrocity Relief', 'Recommended', 'text-navy-700 bg-navy-50', 'shield-check', 'Compensation under SC/ST (Prevention of Atrocities) Act 1989, Rule 12(4) — immediate relief and rehabilitation.', 'Apply for Atrocity Relief', 0, 'SCST-POA-1989', '14566'],
  ];

  for (const r of recs) {
    await p.query(
      `INSERT INTO recommendations (case_id, title, priority, priority_color, icon_type, description, cta, urgent, scheme_code, helpline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      r
    );
  }
}

async function seedCounsellorAccounts(p) {
  const counsellorPass = bcrypt.hashSync('counsellor123', bcrypt.genSaltSync(10));
  const counsellors = [
    ['CNS-MH-001', 'Dr. Meera Joshi', 'Counsellor — Trauma & Crisis', 'Counselling Services', 'meera.joshi@raahat.gov.in', 'Nagpur'],
    ['CNS-MH-002', 'Dr. Anjali Deshmukh', 'Counsellor — Women & Family Support', 'Counselling Services', 'anjali.deshmukh@raahat.gov.in', 'Pune'],
    ['CNS-MH-003', 'Mr. Vikram Kulkarni', 'Counsellor — Youth & Psychosocial Support', 'Counselling Services', 'vikram.kulkarni@raahat.gov.in', 'Nashik'],
  ];

  for (const [officerId, name, designation, department, email, district] of counsellors) {
    await p.query(
      `INSERT INTO admins (officer_id, name, designation, department, password_hash, email, district, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (officer_id) DO NOTHING`,
      [officerId, name, designation, department, counsellorPass, email, district, 'Maharashtra']
    );
  }
}

async function seedHelpCenters(p) {
  const centers = [
    ['Sakhi One Stop Centre, Pune', 'shelter', 18.5204, 73.8567, 'Sassoon Hospital Campus, Pune 411001', '020-26128282', 'Pune', 'Maharashtra', '24/7', 'Shelter, Medical, Legal, Counselling'],
    ['Sakhi One Stop Centre, Nagpur', 'shelter', 21.1458, 79.0882, 'Government Medical College Campus, Nagpur 440003', '0712-2740505', 'Nagpur', 'Maharashtra', '24/7', 'Shelter, Medical, Legal, Counselling'],
    ['Sakhi One Stop Centre, Mumbai', 'shelter', 19.0176, 72.8562, 'KEM Hospital Campus, Parel, Mumbai 400012', '022-24107000', 'Mumbai', 'Maharashtra', '24/7', 'Shelter, Medical, Legal, Counselling'],
    ['Sakhi One Stop Centre, Nashik', 'shelter', 20.0063, 73.7810, 'Civil Hospital Campus, Nashik 422002', '0253-2508585', 'Nashik', 'Maharashtra', '24/7', 'Shelter, Medical, Legal, Counselling'],
    ['Ujjawala Shelter Home, Kolhapur', 'shelter', 16.7050, 74.2433, 'Shivaji Nagar, Kolhapur 416005', '0231-2651234', 'Kolhapur', 'Maharashtra', '24/7', 'Shelter, Rehabilitation, Counselling'],
    ['Swadhar Greh Shelter, Aurangabad', 'shelter', 19.8762, 75.3433, 'CIDCO, Aurangabad 431003', '0240-2481234', 'Chhatrapati Sambhajinagar', 'Maharashtra', '24/7', 'Shelter, Skill Training, Counselling'],
    ['Women Protection Cell, Pune', 'police', 18.5308, 73.8474, 'Pune Police Commissioner Office, Shivajinagar 411004', '020-26122880', 'Pune', 'Maharashtra', '24/7', 'FIR, Protection Orders, Rescue'],
    ['Women Protection Cell, Mumbai', 'police', 19.0760, 72.8777, 'DN Nagar Police Station, Andheri W, Mumbai 400053', '022-26362526', 'Mumbai', 'Maharashtra', '24/7', 'FIR, Protection Orders, Rescue'],
    ['Women Protection Cell, Nagpur', 'police', 21.1500, 79.0800, 'CP Office, Civil Lines, Nagpur 440001', '0712-2565022', 'Nagpur', 'Maharashtra', '24/7', 'FIR, Protection Orders, Rescue'],
    ['SC/ST Atrocity Cell, Pune', 'police', 18.5158, 73.8553, 'Special IG Office, Shivajinagar, Pune 411005', '020-26123344', 'Pune', 'Maharashtra', 'Mon-Sat 10AM-6PM', 'FIR under PoA Act, Investigation'],
    ['SC/ST Atrocity Cell, Nagpur', 'police', 21.1530, 79.0850, 'Range IG Office, Civil Lines, Nagpur 440001', '0712-2562233', 'Nagpur', 'Maharashtra', 'Mon-Sat 10AM-6PM', 'FIR under PoA Act, Investigation'],
    ['Cyber Crime Cell, Mumbai', 'police', 19.0890, 72.8680, 'BKC Police Complex, Bandra E, Mumbai 400051', '022-22641261', 'Mumbai', 'Maharashtra', 'Mon-Sat 10AM-6PM', 'Cyber Crime FIR, Digital Evidence'],
    ['DLSA Pune', 'legal', 18.5290, 73.8750, 'District Court Complex, Shivajinagar, Pune 411004', '020-25501900', 'Pune', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Free Legal Aid, Lok Adalat, Mediation'],
    ['DLSA Nagpur', 'legal', 21.1480, 79.0830, 'District Court Complex, Civil Lines, Nagpur 440001', '0712-2564911', 'Nagpur', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Free Legal Aid, Lok Adalat, Mediation'],
    ['DLSA Mumbai', 'legal', 18.9488, 72.8340, 'City Civil Court, Fort, Mumbai 400001', '022-22620662', 'Mumbai', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Free Legal Aid, Lok Adalat, Mediation'],
    ['DLSA Nashik', 'legal', 20.0000, 73.7900, 'District Court, Trimbak Road, Nashik 422002', '0253-2314411', 'Nashik', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Free Legal Aid, Lok Adalat'],
    ['DLSA Solapur', 'legal', 17.6599, 75.9064, 'District Court Complex, Solapur 413003', '0217-2315500', 'Solapur', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Free Legal Aid, Lok Adalat'],
    ['DLSA Amravati', 'legal', 20.9320, 77.7523, 'District Court Complex, Amravati 444601', '0721-2662233', 'Amravati', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Free Legal Aid, Lok Adalat'],
    ['ICRW India (Women Rights)', 'ngo', 19.1136, 72.8697, 'Andheri East, Mumbai 400059', '022-26827091', 'Mumbai', 'Maharashtra', 'Mon-Fri 10AM-6PM', 'Counselling, Legal Aid, Advocacy'],
    ['Stree Mukti Sanghatana', 'ngo', 19.0380, 72.8400, 'Dadar West, Mumbai 400028', '022-24221598', 'Mumbai', 'Maharashtra', 'Mon-Sat 10AM-6PM', 'Women Empowerment, Counselling'],
    ['Majlis Legal Centre', 'ngo', 18.9698, 72.8310, 'Fort, Mumbai 400001', '022-22010044', 'Mumbai', 'Maharashtra', 'Mon-Fri 10AM-5PM', 'Free Legal Aid for Women'],
    ['Lokshahi Hakk Sanghatana', 'ngo', 21.1400, 79.0700, 'Sitabuldi, Nagpur 440012', '0712-2723456', 'Nagpur', 'Maharashtra', 'Mon-Sat 10AM-6PM', 'Dalit Rights, Legal Aid'],
    ['Rashtriya Seva Dal (Women Wing)', 'ngo', 18.5100, 73.8600, 'Deccan Gymkhana, Pune 411004', '020-25675432', 'Pune', 'Maharashtra', 'Mon-Sat 10AM-5PM', 'Women Welfare, Counselling'],
    ['Sassoon General Hospital', 'hospital', 18.5178, 73.8633, 'Near Pune Railway Station, Pune 411001', '020-26128282', 'Pune', 'Maharashtra', '24/7', 'Medical, Forensic, Victim Support'],
    ['Government Medical College & Hospital, Nagpur', 'hospital', 21.1435, 79.0905, 'Hanuman Nagar, Nagpur 440003', '0712-2748485', 'Nagpur', 'Maharashtra', '24/7', 'Medical, Forensic, Victim Support'],
    ['KEM Hospital', 'hospital', 19.0000, 72.8420, 'Acharya Donde Marg, Parel, Mumbai 400012', '022-24107000', 'Mumbai', 'Maharashtra', '24/7', 'Medical, Forensic, Victim Support'],
    ['Civil Hospital Nashik', 'hospital', 20.0063, 73.7812, 'Old Agra Road, Nashik 422002', '0253-2508585', 'Nashik', 'Maharashtra', '24/7', 'Medical, Forensic, Victim Support'],
  ];

  for (const c of centers) {
    await p.query(
      `INSERT INTO help_centers (name, type, latitude, longitude, address, phone, district, state, timings, services)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      c
    );
  }

  console.log(`✅ Seeded ${centers.length} help centers in SQLite.`);
}

export async function logAudit(db, action, actorType, actorId, targetType, targetId, details, ip) {
  try {
    await db.query(
      `INSERT INTO audit_log (action, actor_type, actor_id, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action, actorType, actorId || 0, targetType || '', targetId || '', details || '', ip || '']
    );
  } catch (err) {
    console.warn('⚠️ logAudit error:', err.message);
  }
}
