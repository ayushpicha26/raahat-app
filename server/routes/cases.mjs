import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth.mjs';
import { logAudit } from '../db.mjs';

const router = Router();

// ── POST /api/cases — Create new case from assessment ──
router.post('/', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { transcript, svi, priority, priorityLabel, problemTypes, summary, consequences, factors, indicators, recommendations, languageDetected, audioDurationSeconds, aiMode } = req.body;

  if (!transcript || svi === undefined || !priority) {
    return res.status(400).json({ error: 'Transcript, SVI, and priority are required.' });
  }

  const caseNum = Math.floor(10000 + Math.random() * 90000);
  const caseId = `RAH-${new Date().getFullYear()}-${caseNum}`;
  const userDistrict = req.user.district || '';
  const userState = req.user.state || 'Maharashtra';

  const result = db.prepare(`
    INSERT INTO cases (case_id, user_id, transcript, svi, priority, priority_label, problem_types, summary, consequences, status, language_detected, audio_duration_seconds, ai_mode, district, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    caseId, req.user.id, transcript, svi, priority, priorityLabel || '',
    JSON.stringify(problemTypes || []), summary || '', consequences || '',
    svi >= 80 ? 'Human Review Required' : 'Assessment Pending',
    languageDetected || 'English', audioDurationSeconds || 0, aiMode || 'local',
    userDistrict, userState
  );

  // Save factors
  if (factors && Array.isArray(factors)) {
    const insertFactor = db.prepare('INSERT INTO assessment_factors (case_id, label, value, contribution, confidence) VALUES (?, ?, ?, ?, ?)');
    const saveFacts = db.transaction(() => {
      for (const f of factors) {
        insertFactor.run(caseId, f.label, f.value, f.contrib || f.contribution, f.conf || f.confidence || 'High');
      }
    });
    saveFacts();
  }

  // Save indicators
  if (indicators && Array.isArray(indicators)) {
    const insertIndicator = db.prepare('INSERT INTO assessment_indicators (case_id, indicator, level) VALUES (?, ?, ?)');
    const saveInds = db.transaction(() => {
      for (const ind of indicators) {
        if (Array.isArray(ind)) {
          insertIndicator.run(caseId, ind[0], ind[1]);
        } else {
          insertIndicator.run(caseId, ind.indicator, ind.level);
        }
      }
    });
    saveInds();
  }

  // Save recommendations
  if (recommendations && Array.isArray(recommendations)) {
    const insertRec = db.prepare('INSERT INTO recommendations (case_id, title, priority, priority_color, icon_type, description, cta, urgent, scheme_code, helpline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const saveRecs = db.transaction(() => {
      for (const r of recommendations) {
        insertRec.run(caseId, r.title, r.priority, r.priorityColor || '', r.iconType || 'shield', r.desc || r.description || '', r.cta || '', r.urgent ? 1 : 0, r.schemeCode || '', r.helpline || '');
      }
    });
    saveRecs();
  }

  // Update user's case_id reference
  db.prepare('UPDATE users SET case_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(caseId, req.user.id);

  logAudit(db, 'CASE_CREATED', 'user', req.user.id, 'case', caseId, `SVI: ${svi}, Priority: ${priority}`, req.ip);

  res.status(201).json({ ok: true, caseId, id: result.lastInsertRowid });
});

// ── GET /api/cases — List cases ──
router.get('/', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { priority, status, district, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM cases';
  const conditions = [];
  const params = [];

  // Citizens only see their own cases
  if (req.user.role !== 'admin') {
    conditions.push('user_id = ?');
    params.push(req.user.id);
  }

  if (priority && priority !== 'all') {
    conditions.push('priority = ?');
    params.push(priority);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (district) {
    conditions.push('district = ?');
    params.push(district);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const cases = db.prepare(query).all(...params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM cases';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  const total = db.prepare(countQuery).get(...params.slice(0, -2)).total;

  // Enrich cases with user names
  const enriched = cases.map(c => {
    const user = db.prepare('SELECT name, district FROM users WHERE id = ?').get(c.user_id);
    return {
      ...c,
      holder: user?.name || 'Unknown',
      userDistrict: user?.district || c.district,
      problemTypes: tryParse(c.problem_types),
    };
  });

  res.json({ cases: enriched, total, limit: Number(limit), offset: Number(offset) });
});

// ── GET /api/cases/:id — Get case detail ──
router.get('/:id', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const c = db.prepare('SELECT * FROM cases WHERE case_id = ?').get(req.params.id);

  if (!c) return res.status(404).json({ error: 'Case not found.' });

  // Citizens can only view their own cases
  if (req.user.role !== 'admin' && c.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const user = db.prepare('SELECT name, mobile, email, state, district, category, language FROM users WHERE id = ?').get(c.user_id);
  const factors = db.prepare('SELECT * FROM assessment_factors WHERE case_id = ?').all(c.case_id);
  const indicators = db.prepare('SELECT * FROM assessment_indicators WHERE case_id = ?').all(c.case_id);
  const recs = db.prepare('SELECT * FROM recommendations WHERE case_id = ?').all(c.case_id);

  res.json({
    ...c,
    holder: user?.name || 'Unknown',
    userInfo: user || {},
    problemTypes: tryParse(c.problem_types),
    factors: factors.map(f => ({ label: f.label, value: f.value, contrib: f.contribution, conf: f.confidence })),
    indicators: indicators.map(i => [i.indicator, i.level]),
    recommendations: recs.map(r => ({
      title: r.title, priority: r.priority, priorityColor: r.priority_color, iconType: r.icon_type,
      desc: r.description, cta: r.cta, urgent: Boolean(r.urgent), schemeCode: r.scheme_code, helpline: r.helpline
    })),
  });
});

// ── PUT /api/cases/:id/status — Update status (admin) ──
router.put('/:id/status', requireAuth, requireAdmin, (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const c = db.prepare('SELECT case_id FROM cases WHERE case_id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found.' });

  db.prepare("UPDATE cases SET status = ?, updated_at = datetime('now') WHERE case_id = ?").run(status, req.params.id);
  logAudit(db, 'CASE_STATUS_UPDATED', 'admin', req.user.id, 'case', req.params.id, `Status → ${status}`, req.ip);

  res.json({ ok: true, message: `Case status updated to: ${status}` });
});

// ── PUT /api/cases/:id/assign — Assign officer (admin) ──
router.put('/:id/assign', requireAuth, requireAdmin, (req, res) => {
  const db = req.app.locals.db;
  const { officer, service } = req.body;

  const c = db.prepare('SELECT case_id FROM cases WHERE case_id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found.' });

  db.prepare("UPDATE cases SET assigned_officer = ?, assigned_service = ?, status = 'Support Assigned', updated_at = datetime('now') WHERE case_id = ?")
    .run(officer || '', service || '', req.params.id);

  logAudit(db, 'CASE_ASSIGNED', 'admin', req.user.id, 'case', req.params.id, `Assigned: ${officer} (${service})`, req.ip);

  res.json({ ok: true, message: 'Officer assigned.' });
});

// ── GET /api/admin/stats — Dashboard stats ──
router.get('/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const db = req.app.locals.db;

  const total = db.prepare('SELECT COUNT(*) as c FROM cases').get().c;
  const critical = db.prepare("SELECT COUNT(*) as c FROM cases WHERE priority = 'Critical'").get().c;
  const high = db.prepare("SELECT COUNT(*) as c FROM cases WHERE priority = 'High'").get().c;
  const moderate = db.prepare("SELECT COUNT(*) as c FROM cases WHERE priority = 'Moderate'").get().c;
  const low = db.prepare("SELECT COUNT(*) as c FROM cases WHERE priority = 'Low'").get().c;
  const pending = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'Assessment Pending' OR status = 'Under Review' OR status = 'Human Review Required'").get().c;
  const resolved = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'Resolved' OR status = 'Closed'").get().c;
  const avgSvi = db.prepare('SELECT ROUND(AVG(svi), 1) as avg FROM cases').get().avg || 0;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

  // District breakdown
  const districtStats = db.prepare('SELECT district, COUNT(*) as cases, ROUND(AVG(svi),1) as avgSvi FROM cases GROUP BY district ORDER BY cases DESC').all();

  // Priority distribution
  const priorityDist = [
    { name: 'Critical', value: critical, color: '#9b1c1c' },
    { name: 'High', value: high, color: '#c2410c' },
    { name: 'Moderate', value: moderate, color: '#b45309' },
    { name: 'Low', value: low, color: '#2e7d52' },
  ];

  // Recent cases
  const recentCases = db.prepare('SELECT c.*, u.name as holder FROM cases c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 10').all();

  res.json({
    total, critical, high, moderate, low, pending, resolved, avgSvi, totalUsers,
    districtStats,
    priorityDist,
    recentCases: recentCases.map(c => ({ ...c, problemTypes: tryParse(c.problem_types) })),
  });
});

// ── POST /api/cases/support-request — Request specific support ──
router.post('/support-request', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { caseId, service } = req.body;

  if (!caseId || !service) {
    return res.status(400).json({ error: 'Case ID and service are required.' });
  }

  // Verify case belongs to user (or is admin)
  const c = db.prepare('SELECT user_id FROM cases WHERE case_id = ?').get(caseId);
  if (!c) return res.status(404).json({ error: 'Case not found.' });

  if (req.user.role !== 'admin' && c.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  // Update case status/assigned service
  db.prepare("UPDATE cases SET assigned_service = ?, status = 'Human Review Required', updated_at = datetime('now') WHERE case_id = ?")
    .run(service, caseId);

  logAudit(db, 'SUPPORT_REQUESTED', 'user', req.user.id, 'case', caseId, `Service requested: ${service}`, req.ip);

  res.status(201).json({ ok: true, reference: 'REQ-' + Date.now(), service });
});

function tryParse(str) {
  try { return JSON.parse(str); } catch { return []; }
}

export default router;
