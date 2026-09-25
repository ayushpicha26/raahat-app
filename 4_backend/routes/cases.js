/**
 * routes/cases.js — Case Management Routes (PostgreSQL)
 *
 * Handles: case creation, listing, details, status updates, assignment
 * Role-based access per BRAIN.md
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { filterCasesByRole, canAccessCase } from '../middleware/role_access.js';
import { logAudit } from '../utils/audit_logger.js';
import { initializeJourney, getJourney, completeStep, assignOfficer, getWorkQueue } from '../services/journey_service.js';

const router = Router();

function tryParse(str) {
  if (!str) return [];
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return []; }
}

// ── POST /api/cases — Create new case from assessment ──
router.post('/', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const {
    transcript,
    svi,
    priority,
    priorityLabel,
    problemTypes,
    summary,
    consequences,
    factors,
    indicators,
    recommendations,
    languageDetected,
    audioDurationSeconds,
    aiMode,
    latitude,
    longitude
  } = req.body;

  if (!transcript || svi === undefined || !priority) {
    return res.status(400).json({ error: 'Transcript, SVI, and priority are required.' });
  }

  const caseNum = Math.floor(10000 + Math.random() * 90000);
  const caseId = `RAH-${new Date().getFullYear()}-${caseNum}`;
  const userDistrict = req.user.district || '';
  const userState = req.user.state || 'Maharashtra';

  const result = await db.run(`
    INSERT INTO cases (
      case_id, user_id, transcript, svi, priority, priority_label, problem_types,
      summary, consequences, status, language_detected, audio_duration_seconds,
      ai_mode, district, state, latitude, longitude
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id
  `, [
    caseId,
    req.user.id,
    transcript,
    svi,
    priority,
    priorityLabel || '',
    JSON.stringify(problemTypes || []),
    summary || '',
    consequences || '',
    svi >= 80 ? 'Human Review Required' : 'Assessment Pending',
    languageDetected || 'English',
    audioDurationSeconds || 0,
    aiMode || 'local',
    userDistrict,
    userState,
    latitude || null,
    longitude || null
  ]);

  const caseDbId = result.lastInsertRowid || result.rows?.[0]?.id;

  if (factors && Array.isArray(factors)) {
    for (const f of factors) {
      await db.query(
        'INSERT INTO assessment_factors (case_id, label, value, contribution, confidence) VALUES ($1, $2, $3, $4, $5)',
        [caseId, f.label, f.value, f.contrib || f.contribution, f.conf || f.confidence || 'High']
      );
    }
  }

  if (indicators && Array.isArray(indicators)) {
    for (const ind of indicators) {
      if (Array.isArray(ind)) {
        await db.query('INSERT INTO assessment_indicators (case_id, indicator, level) VALUES ($1, $2, $3)', [caseId, ind[0], ind[1]]);
      } else {
        await db.query('INSERT INTO assessment_indicators (case_id, indicator, level) VALUES ($1, $2, $3)', [caseId, ind.indicator, ind.level]);
      }
    }
  }

  if (recommendations && Array.isArray(recommendations)) {
    for (const r of recommendations) {
      await db.query(
        'INSERT INTO recommendations (case_id, title, priority, priority_color, icon_type, description, cta, urgent, scheme_code, helpline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [caseId, r.title, r.priority, r.priorityColor || '', r.iconType || 'shield', r.desc || r.description || '', r.cta || '', Boolean(r.urgent), r.schemeCode || '', r.helpline || '']
      );
    }
  }

  await db.query('UPDATE users SET case_id = $1, updated_at = NOW() WHERE id = $2', [caseId, req.user.id]);

  // Auto-initialize the journey workflow for this case
  const journeySteps = await initializeJourney(db, caseId, priority);

  // Update case status to show who currently has it (second step = first action)
  const nextStep = journeySteps[1];
  if (nextStep) {
    await db.query(
      'UPDATE cases SET status = $1, assigned_officer = $2, assigned_service = $3, updated_at = NOW() WHERE case_id = $4',
      [
        `With ${nextStep.role === 'counsellor' ? 'Counsellor' : nextStep.role === 'dosje' ? 'DoSJE Officer' : nextStep.role}`,
        nextStep.label,
        nextStep.role,
        caseId
      ]
    );
  }

  await logAudit(
    db,
    'CASE_CREATED',
    'user',
    req.user.id,
    'case',
    caseId,
    `SVI: ${svi}, Priority: ${priority}. Journey initialized with ${journeySteps.length} steps.`,
    req.ip
  );

  res.status(201).json({ ok: true, caseId, id: caseDbId, journey_steps: journeySteps.length });
});

// ── GET /api/cases — List cases (role-filtered) ──
router.get('/', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { priority, status, district, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM cases';
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (req.user.role !== 'admin') {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(req.user.id);
  }

  if (priority && priority !== 'all') {
    conditions.push(`priority = $${paramIndex++}`);
    params.push(priority);
  }
  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (district) {
    conditions.push(`district = $${paramIndex++}`);
    params.push(district);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  const countQuery = 'SELECT COUNT(*) as total FROM cases' + whereClause;
  const countResult = await db.get(countQuery, params);
  const total = parseInt(countResult?.total || 0, 10);

  const paginatedQuery = query + whereClause + ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  const queryParams = [...params, Number(limit), Number(offset)];

  const cases = await db.all(paginatedQuery, queryParams);

  // Batch query user holders to avoid N+1 queries
  const userIds = Array.from(new Set(cases.map(c => c.user_id).filter(Boolean)));
  const userMap = {};
  if (userIds.length > 0) {
    const users = await db.all(
      'SELECT id, name, district FROM users WHERE id = ANY($1)',
      [userIds]
    );
    for (const u of users) {
      userMap[u.id] = u;
    }
  }

  const enriched = cases.map(c => {
    const user = userMap[c.user_id];
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
router.get('/:id', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const c = await db.get('SELECT * FROM cases WHERE case_id = $1', [req.params.id]);

  if (!c) return res.status(404).json({ error: 'Case not found.' });

  if (req.user.role !== 'admin' && c.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const user = await db.get(
    'SELECT name, mobile, email, state, district, category, language FROM users WHERE id = $1',
    [c.user_id]
  );
  const factors = await db.all('SELECT * FROM assessment_factors WHERE case_id = $1', [c.case_id]);
  const indicators = await db.all('SELECT * FROM assessment_indicators WHERE case_id = $1', [c.case_id]);
  const recs = await db.all('SELECT * FROM recommendations WHERE case_id = $1', [c.case_id]);

  res.json({
    ...c,
    holder: user?.name || 'Unknown',
    userInfo: user || {},
    problemTypes: tryParse(c.problem_types),
    factors: factors.map(f => ({ label: f.label, value: f.value, contrib: f.contribution, conf: f.confidence })),
    indicators: indicators.map(i => [i.indicator, i.level]),
    recommendations: recs.map(r => ({
      title: r.title,
      priority: r.priority,
      priorityColor: r.priority_color,
      iconType: r.icon_type,
      desc: r.description,
      cta: r.cta,
      urgent: Boolean(r.urgent),
      schemeCode: r.scheme_code,
      helpline: r.helpline
    })),
  });
});

// ── PUT /api/cases/:id/status — Update status (admin) ──
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const c = await db.get('SELECT case_id FROM cases WHERE case_id = $1', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Case not found.' });

  await db.query("UPDATE cases SET status = $1, updated_at = NOW() WHERE case_id = $2", [status, req.params.id]);
  await logAudit(db, 'CASE_STATUS_UPDATED', 'admin', req.user.id, 'case', req.params.id, `Status → ${status}`, req.ip);

  res.json({ ok: true, message: `Case status updated to: ${status}` });
});

// ── PUT /api/cases/:id/assign — Assign officer (admin) ──
router.put('/:id/assign', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { officer, service } = req.body;

  const c = await db.get('SELECT case_id FROM cases WHERE case_id = $1', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Case not found.' });

  await db.query(
    "UPDATE cases SET assigned_officer = $1, assigned_service = $2, status = 'Support Assigned', updated_at = NOW() WHERE case_id = $3",
    [officer || '', service || '', req.params.id]
  );

  await logAudit(db, 'CASE_ASSIGNED', 'admin', req.user.id, 'case', req.params.id, `Assigned: ${officer} (${service})`, req.ip);

  res.json({ ok: true, message: 'Officer assigned.' });
});

// ── GET /api/cases/:id/journey — Get full case journey ──
router.get('/:id/journey', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const c = await db.get('SELECT case_id, user_id FROM cases WHERE case_id = $1', [req.params.id]);

  if (!c) return res.status(404).json({ error: 'Case not found.' });
  if (req.user.role !== 'admin' && c.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const journey = await getJourney(db, req.params.id);
  if (!journey) return res.status(404).json({ error: 'Journey not initialized for this case.' });

  res.json(journey);
});

// ── POST /api/cases/:id/journey/:stepId/complete — Complete a step & forward ──
router.post('/:id/journey/:stepId/complete', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { notes } = req.body;

  const c = await db.get('SELECT case_id FROM cases WHERE case_id = $1', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Case not found.' });

  const completedBy = req.user.name || req.user.officer_id || 'admin';

  try {
    const result = await completeStep(db, req.params.id, Number(req.params.stepId), completedBy, notes || '');
    await logAudit(
      db,
      'JOURNEY_STEP_COMPLETED',
      'admin',
      req.user.id,
      'case',
      req.params.id,
      `Step ${req.params.stepId} completed. Next: ${result.next?.step_name || 'Case closed'}`,
      req.ip
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /api/cases/:id/journey/:stepId/assign — Assign officer to step ──
router.post('/:id/journey/:stepId/assign', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { officerId, officerName } = req.body;

  if (!officerId || !officerName) {
    return res.status(400).json({ error: 'officerId and officerName are required.' });
  }

  try {
    await assignOfficer(db, req.params.id, Number(req.params.stepId), Number(officerId), officerName);
    await logAudit(
      db,
      'JOURNEY_OFFICER_ASSIGNED',
      'admin',
      req.user.id,
      'case',
      req.params.id,
      `Officer ${officerName} assigned to step ${req.params.stepId}`,
      req.ip
    );
    res.json({ ok: true, message: 'Officer assigned.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── GET /api/cases/admin/work-queue/:role — Get work queue for a role ──
router.get('/admin/work-queue/:role', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const queue = await getWorkQueue(db, req.params.role);
  res.json({ role: req.params.role, count: queue.length, cases: queue });
});

// ── GET /api/cases/admin/stats — Dashboard stats (admin) ──
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;

  const total = parseInt((await db.get('SELECT COUNT(*) as c FROM cases'))?.c || 0, 10);
  const critical = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'Critical'"))?.c || 0, 10);
  const high = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'High'"))?.c || 0, 10);
  const moderate = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'Moderate'"))?.c || 0, 10);
  const low = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'Low'"))?.c || 0, 10);
  const pending = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE status IN ('Assessment Pending', 'Under Review', 'Human Review Required')"))?.c || 0, 10);
  const resolved = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE status IN ('Resolved', 'Closed')"))?.c || 0, 10);
  const avgSviRes = await db.get('SELECT ROUND(AVG(svi)::numeric, 1) as avg FROM cases');
  const avgSvi = parseFloat(avgSviRes?.avg || 0);
  const totalUsers = parseInt((await db.get('SELECT COUNT(*) as c FROM users'))?.c || 0, 10);

  const districtStats = await db.all(`
    SELECT district, COUNT(*) as cases, ROUND(AVG(svi)::numeric, 1) as "avgSvi"
    FROM cases
    GROUP BY district
    ORDER BY cases DESC
  `);

  const priorityDist = [
    { name: 'Critical', value: critical, color: '#9b1c1c' },
    { name: 'High', value: high, color: '#c2410c' },
    { name: 'Moderate', value: moderate, color: '#b45309' },
    { name: 'Low', value: low, color: '#2e7d52' },
  ];

  const recentCases = await db.all(`
    SELECT c.*, u.name as holder
    FROM cases c
    LEFT JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
    LIMIT 10
  `);

  res.json({
    total, critical, high, moderate, low, pending, resolved, avgSvi, totalUsers,
    districtStats,
    priorityDist,
    recentCases: recentCases.map(c => ({ ...c, problemTypes: tryParse(c.problem_types) })),
  });
});

export default router;