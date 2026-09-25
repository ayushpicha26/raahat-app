-- ── Users ──
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  dob TEXT,
  state TEXT DEFAULT 'Maharashtra',
  district TEXT DEFAULT '',
  address TEXT DEFAULT '',
  category TEXT DEFAULT '',
  language TEXT DEFAULT 'English',
  case_id TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Admins ──
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
  created_at TEXT DEFAULT (datetime('now'))
);

-- ── Cases ──
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
  ai_mode TEXT DEFAULT 'local',
  district TEXT DEFAULT '',
  state TEXT DEFAULT 'Maharashtra',
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Assessment Factors ──
CREATE TABLE IF NOT EXISTS assessment_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  contribution TEXT,
  confidence TEXT DEFAULT 'High'
);

-- ── Assessment Indicators ──
CREATE TABLE IF NOT EXISTS assessment_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  indicator TEXT NOT NULL,
  level TEXT NOT NULL
);

-- ── Recommendations ──
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

-- ── Counsellors ──
CREATE TABLE IF NOT EXISTS counsellors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  specialization TEXT DEFAULT '',
  language TEXT DEFAULT 'English',
  district_coverage TEXT DEFAULT '',
  availability TEXT DEFAULT '24/7',
  contact_phone TEXT,
  assigned_cases INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available'
);

-- ── Assignments ──
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  counsellor_id INTEGER REFERENCES counsellors(id),
  assigned_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'assigned',
  notes TEXT
);

-- ── Audit Log ──
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  actor_type TEXT CHECK(actor_type IN ('user','admin','system')),
  actor_id INTEGER,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ── Case Journey (Stakeholder Workflow Tracker) ──
-- Each row = one step in the case's journey through stakeholders
-- e.g. NLP assessment → Counsellor → DoSJE → Police → Special Court → Closed
CREATE TABLE IF NOT EXISTS case_journey (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  stakeholder_role TEXT NOT NULL,
  assigned_user_id INTEGER,
  assigned_user_name TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','skipped','overdue')),
  started_at TEXT,
  completed_at TEXT,
  sla_hours INTEGER DEFAULT 0,
  sla_deadline TEXT,
  notes TEXT,
  next_step_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_factors_case ON assessment_factors(case_id);
CREATE INDEX IF NOT EXISTS idx_indicators_case ON assessment_indicators(case_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_case ON recommendations(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_counsellors_status ON counsellors(status);
CREATE INDEX IF NOT EXISTS idx_assignments_counsellor ON assignments(counsellor_id);
CREATE INDEX IF NOT EXISTS idx_journey_case ON case_journey(case_id);
CREATE INDEX IF NOT EXISTS idx_journey_status ON case_journey(status);
CREATE INDEX IF NOT EXISTS idx_journey_assigned ON case_journey(assigned_user_id);
