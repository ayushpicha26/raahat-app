-- ── PostgreSQL Schema for RAAHAT ──
-- Converted from SQLite: SERIAL instead of AUTOINCREMENT, NOW() instead of datetime('now'),
-- BOOLEAN instead of INTEGER flags, JSONB for structured data

-- ── Users ──
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  dob DATE,
  state TEXT DEFAULT 'Maharashtra',
  district TEXT DEFAULT '',
  address TEXT DEFAULT '',
  category TEXT DEFAULT '',
  language TEXT DEFAULT 'English',
  case_id TEXT,
  latitude REAL,
  longitude REAL,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  otp_hash TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admins ──
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  officer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  designation TEXT DEFAULT '',
  department TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  district TEXT DEFAULT '',
  state TEXT DEFAULT 'Maharashtra',
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Cases ──
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Assessment Factors ──
CREATE TABLE IF NOT EXISTS assessment_factors (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  contribution TEXT,
  confidence TEXT DEFAULT 'High'
);

-- ── Assessment Indicators ──
CREATE TABLE IF NOT EXISTS assessment_indicators (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  indicator TEXT NOT NULL,
  level TEXT NOT NULL
);

-- ── Recommendations ──
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  title TEXT NOT NULL,
  priority TEXT,
  priority_color TEXT,
  icon_type TEXT DEFAULT 'shield',
  description TEXT,
  cta TEXT,
  urgent BOOLEAN DEFAULT false,
  scheme_code TEXT,
  helpline TEXT
);

-- ── Counsellors ──
CREATE TABLE IF NOT EXISTS counsellors (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  counsellor_id INTEGER REFERENCES counsellors(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'assigned',
  notes TEXT
);

-- ── Audit Log ──
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  actor_type TEXT CHECK(actor_type IN ('user','admin','system')),
  actor_id INTEGER,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  request_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Case Journey (Stakeholder Workflow Tracker) ──
-- Each row = one step in the case's journey through stakeholders
-- e.g. NLP assessment → Counsellor → DoSJE → Police → Special Court → Closed
CREATE TABLE IF NOT EXISTS case_journey (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  stakeholder_role TEXT NOT NULL,
  assigned_user_id INTEGER,
  assigned_user_name TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','skipped','overdue')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sla_hours INTEGER DEFAULT 0,
  sla_deadline TIMESTAMPTZ,
  notes TEXT,
  next_step_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_factors_case ON assessment_factors(case_id);
CREATE INDEX IF NOT EXISTS idx_indicators_case ON assessment_indicators(case_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_case ON recommendations(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_counsellors_status ON counsellors(status);
CREATE INDEX IF NOT EXISTS idx_assignments_counsellor ON assignments(counsellor_id);
CREATE INDEX IF NOT EXISTS idx_journey_case ON case_journey(case_id);
CREATE INDEX IF NOT EXISTS idx_journey_status ON case_journey(status);
CREATE INDEX IF NOT EXISTS idx_journey_assigned ON case_journey(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_admins_officer ON admins(officer_id);