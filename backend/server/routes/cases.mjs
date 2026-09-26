import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth.mjs';
import { logAudit } from '../db.mjs';

const router = Router();

// ── POST /api/cases — Create new case from assessment ──
router.post('/', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { transcript, svi, priority, priorityLabel, problemTypes, summary, consequences, factors, indicators, recommendations, languageDetected, audioDurationSeconds, aiMode, latitude, longitude } = req.body;

  if (!transcript || svi === undefined || !priority) {
    return res.status(400).json({ error: 'Transcript, SVI, and priority are required.' });
  }

  const caseNum = Math.floor(10000 + Math.random() * 90000);
  const caseId = `RAH-${new Date().getFullYear()}-${caseNum}`;
  const userDistrict = req.user.district || '';
  const userState = req.user.state || 'Maharashtra';

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO cases (case_id, user_id, transcript, svi, priority, priority_label, problem_types, summary, consequences, status, language_detected, audio_duration_seconds, ai_mode, district, state, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [
        caseId, req.user.id, transcript, svi, priority, priorityLabel || '',
        JSON.stringify(problemTypes || []), summary || '', consequences || '',
        svi >= 80 ? 'Human Review Required' : 'Assessment Pending',
        languageDetected || 'English', audioDurationSeconds || 0, aiMode || 'local',
        userDistrict, userState,
        latitude || null, longitude || null
      ]
    );

    const insertedId = result.rows[0].id;

    // Save factors
    if (factors && Array.isArray(factors)) {
      for (const f of factors) {
        await client.query(
          `INSERT INTO assessment_factors (case_id, label, value, contribution, confidence) VALUES ($1, $2, $3, $4, $5)`,
          [caseId, f.label, f.value, f.contrib || f.contribution, f.conf || f.confidence || 'High']
        );
      }
    }

    // Save indicators
    if (indicators && Array.isArray(indicators)) {
      for (const ind of indicators) {
        if (Array.isArray(ind)) {
          await client.query(
            `INSERT INTO assessment_indicators (case_id, indicator, level) VALUES ($1, $2, $3)`,
            [caseId, ind[0], ind[1]]
          );
        } else {
          await client.query(
            `INSERT INTO assessment_indicators (case_id, indicator, level) VALUES ($1, $2, $3)`,
            [caseId, ind.indicator, ind.level]
          );
        }
      }
    }

    // Save recommendations
    if (recommendations && Array.isArray(recommendations)) {
      for (const r of recommendations) {
        await client.query(
          `INSERT INTO recommendations (case_id, title, priority, priority_color, icon_type, description, cta, urgent, scheme_code, helpline)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [caseId, r.title, r.priority, r.priorityColor || '', r.iconType || 'shield', r.desc || r.description || '', r.cta || '', r.urgent ? 1 : 0, r.schemeCode || '', r.helpline || '']
        );
      }
    }

    // Update user's case_id reference
    await client.query(
      `UPDATE users SET case_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [caseId, req.user.id]
    );

    await client.query('COMMIT');

    await logAudit(db, 'CASE_CREATED', 'user', req.user.id, 'case', caseId, `SVI: ${svi}, Priority: ${priority}`, req.ip);

    res.status(201).json({ ok: true, caseId, id: insertedId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Case creation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  } finally {
    client.release();
  }
});

// ── GET /api/cases — List cases ──
router.get('/', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { priority, status, district, limit = 50, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM cases';
    const conditions = [];
    const params = [];

    // Counsellors can only see cases explicitly assigned to them.
    if (req.user.role === 'counsellor') {
      params.push(req.user.name);
      conditions.push(`assigned_officer = $${params.length}`);
      conditions.push(`assigned_service = 'Counselling'`);
    // Citizens only see their own cases.
    } else if (req.user.role !== 'admin') {
      params.push(req.user.id);
      conditions.push(`user_id = $${params.length}`);
    }

    if (priority && priority !== 'all') {
      params.push(priority);
      conditions.push(`priority = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (district) {
      params.push(district);
      conditions.push(`district = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Count query
    let countQuery = 'SELECT COUNT(*) as total FROM cases';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Main query pagination
    params.push(Number(limit));
    const limitPlaceholder = `$${params.length}`;
    params.push(Number(offset));
    const offsetPlaceholder = `$${params.length}`;

    query += ` ORDER BY created_at DESC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

    const casesRes = await db.query(query, params);
    const cases = casesRes.rows;

    // Enrich cases with user names
    const enriched = await Promise.all(
      cases.map(async (c) => {
        const userRes = await db.query('SELECT name, district FROM users WHERE id = $1', [c.user_id]);
        const user = userRes.rows[0];
        return {
          ...c,
          holder: user?.name || 'Unknown',
          userDistrict: user?.district || c.district,
          problemTypes: tryParse(c.problem_types),
        };
      })
    );

    res.json({ cases: enriched, total, limit: Number(limit), offset: Number(offset) });
  } catch (err) {
    console.error('List cases error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── GET /api/cases/:id — Get case detail ──
router.get('/:id', requireAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const caseRes = await db.query('SELECT * FROM cases WHERE case_id = $1', [req.params.id]);
    const c = caseRes.rows[0];

    if (!c) return res.status(404).json({ error: 'Case not found.' });

    // Counsellors can only open cases explicitly allocated to them.
    const counsellorHasAssignment = req.user.role === 'counsellor' && c.assigned_service === 'Counselling' && c.assigned_officer === req.user.name;
    // Citizens can only view their own cases.
    if (req.user.role !== 'admin' && !counsellorHasAssignment && c.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const [userRes, factorsRes, indicatorsRes, recsRes] = await Promise.all([
      db.query('SELECT name, mobile, email, state, district, category, language FROM users WHERE id = $1', [c.user_id]),
      db.query('SELECT * FROM assessment_factors WHERE case_id = $1', [c.case_id]),
      db.query('SELECT * FROM assessment_indicators WHERE case_id = $1', [c.case_id]),
      db.query('SELECT * FROM recommendations WHERE case_id = $1', [c.case_id]),
    ]);

    const user = userRes.rows[0];
    const factors = factorsRes.rows;
    const indicators = indicatorsRes.rows;
    const recs = recsRes.rows;

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
  } catch (err) {
    console.error('Case detail error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── PUT /api/cases/:id/status — Update status (admin) ──
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  try {
    const caseRes = await db.query('SELECT case_id FROM cases WHERE case_id = $1', [req.params.id]);
    if (caseRes.rows.length === 0) return res.status(404).json({ error: 'Case not found.' });

    await db.query(
      `UPDATE cases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE case_id = $2`,
      [status, req.params.id]
    );

    await logAudit(db, 'CASE_STATUS_UPDATED', 'admin', req.user.id, 'case', req.params.id, `Status → ${status}`, req.ip);

    res.json({ ok: true, message: `Case status updated to: ${status}` });
  } catch (err) {
    console.error('Case status update error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── PUT /api/cases/:id/assign — Assign officer (admin) ──
router.put('/:id/assign', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { officer, service } = req.body;

  try {
    const caseRes = await db.query('SELECT case_id FROM cases WHERE case_id = $1', [req.params.id]);
    if (caseRes.rows.length === 0) return res.status(404).json({ error: 'Case not found.' });

    await db.query(
      `UPDATE cases SET assigned_officer = $1, assigned_service = $2, status = 'Support Assigned', updated_at = CURRENT_TIMESTAMP WHERE case_id = $3`,
      [officer || '', service || '', req.params.id]
    );

    await logAudit(db, 'CASE_ASSIGNED', 'admin', req.user.id, 'case', req.params.id, `Assigned: ${officer} (${service})`, req.ip);

    res.json({ ok: true, message: 'Officer assigned.' });
  } catch (err) {
    console.error('Case assign error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── PUT /api/cases/:id/revoke-assignment — Return a case to the allocation queue ──
router.put('/:id/revoke-assignment', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const caseRes = await db.query('SELECT svi, assigned_officer, assigned_service FROM cases WHERE case_id = $1', [req.params.id]);
    const caseItem = caseRes.rows[0];
    if (!caseItem) return res.status(404).json({ error: 'Case not found.' });

    const nextStatus = Number(caseItem.svi) >= 80 ? 'Human Review Required' : 'Assessment Pending';
    await db.query(
      `UPDATE cases SET assigned_officer = '', assigned_service = '', status = $1, updated_at = CURRENT_TIMESTAMP WHERE case_id = $2`,
      [nextStatus, req.params.id]
    );
    await logAudit(db, 'CASE_ASSIGNMENT_REVOKED', 'admin', req.user.id, 'case', req.params.id, `Revoked: ${caseItem.assigned_officer} (${caseItem.assigned_service})`, req.ip);

    res.json({ ok: true, message: 'Support allocation revoked.' });
  } catch (err) {
    console.error('Case assignment revoke error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── GET /api/admin/stats — Dashboard stats ──
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [
      totalRes,
      criticalRes,
      highRes,
      moderateRes,
      lowRes,
      pendingRes,
      resolvedRes,
      avgSviRes,
      totalUsersRes,
      districtStatsRes,
      recentCasesRes
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM cases'),
      db.query("SELECT COUNT(*) as c FROM cases WHERE priority = 'Critical'"),
      db.query("SELECT COUNT(*) as c FROM cases WHERE priority = 'High'"),
      db.query("SELECT COUNT(*) as c FROM cases WHERE priority = 'Moderate'"),
      db.query("SELECT COUNT(*) as c FROM cases WHERE priority = 'Low'"),
      db.query("SELECT COUNT(*) as c FROM cases WHERE status IN ('Assessment Pending', 'Under Review', 'Human Review Required')"),
      db.query("SELECT COUNT(*) as c FROM cases WHERE status IN ('Resolved', 'Closed')"),
      db.query('SELECT ROUND(AVG(svi), 1) as avg FROM cases'),
      db.query('SELECT COUNT(*) as c FROM users'),
      db.query('SELECT district, COUNT(*) as cases, ROUND(AVG(svi), 1) as "avgSvi" FROM cases GROUP BY district ORDER BY cases DESC'),
      db.query('SELECT c.*, u.name as holder FROM cases c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 10')
    ]);

    const total = parseInt(totalRes.rows[0].c, 10);
    const critical = parseInt(criticalRes.rows[0].c, 10);
    const high = parseInt(highRes.rows[0].c, 10);
    const moderate = parseInt(moderateRes.rows[0].c, 10);
    const low = parseInt(lowRes.rows[0].c, 10);
    const pending = parseInt(pendingRes.rows[0].c, 10);
    const resolved = parseInt(resolvedRes.rows[0].c, 10);
    const avgSvi = parseFloat(avgSviRes.rows[0]?.avg || 0);
    const totalUsers = parseInt(totalUsersRes.rows[0].c, 10);

    const priorityDist = [
      { name: 'Critical', value: critical, color: '#9b1c1c' },
      { name: 'High', value: high, color: '#c2410c' },
      { name: 'Moderate', value: moderate, color: '#b45309' },
      { name: 'Low', value: low, color: '#2e7d52' },
    ];

    res.json({
      total, critical, high, moderate, low, pending, resolved, avgSvi, totalUsers,
      districtStats: districtStatsRes.rows.map(r => ({ district: r.district, cases: parseInt(r.cases, 10), avgSvi: parseFloat(r.avgSvi || 0) })),
      priorityDist,
      recentCases: recentCasesRes.rows.map(c => ({ ...c, problemTypes: tryParse(c.problem_types) })),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── POST /api/cases/support-request — Request specific support ──
router.post('/support-request', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { caseId, service } = req.body;

  if (!caseId || !service) {
    return res.status(400).json({ error: 'Case ID and service are required.' });
  }

  try {
    const caseRes = await db.query('SELECT user_id FROM cases WHERE case_id = $1', [caseId]);
    const c = caseRes.rows[0];
    if (!c) return res.status(404).json({ error: 'Case not found.' });

    if (req.user.role !== 'admin' && c.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await db.query(
      `UPDATE cases SET assigned_service = $1, status = 'Human Review Required', updated_at = CURRENT_TIMESTAMP WHERE case_id = $2`,
      [service, caseId]
    );

    await logAudit(db, 'SUPPORT_REQUESTED', 'user', req.user.id, 'case', caseId, `Service requested: ${service}`, req.ip);

    res.status(201).json({ ok: true, reference: 'REQ-' + Date.now(), service });
  } catch (err) {
    console.error('Support request error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

function tryParse(str) {
  try { return JSON.parse(str); } catch { return []; }
}

export default router;
