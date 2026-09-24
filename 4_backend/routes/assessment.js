/**
 * routes/assessment.js — Assessment Routes (PostgreSQL)
 *
 * Uses LOCAL ML engine from 5_ml_engine/ — NO external API calls
 * Gemini is ONLY a fallback if ML engine fails
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateAssessmentInput } from '../middleware/validation.js';
import { performAssessment, saveAssessmentToDB } from '../services/assessment_service.js';
import { autoAssignCounsellor } from '../services/assignment_service.js';
import { logAudit } from '../utils/audit_logger.js';

const router = Router();

/**
 * POST /api/assess
 * Performs assessment using LOCAL ML engine
 * No external API calls for primary processing
 */
router.post('/', requireAuth, validateAssessmentInput, async (req, res) => {
  const { text, duration, lang, district } = req.body;
  const db = req.app.locals.db;

  // Perform assessment using LOCAL ML engine
  const result = performAssessment(text, duration, district, lang);

  // Save to database
  const userDistrict = req.user.district || district || '';
  const userState = req.user.state || 'Maharashtra';

  const caseId = await saveAssessmentToDB(db, result, req.user.id, userDistrict, userState);

  // Auto-assign counsellor for Critical/High priority
  let autoAssigned = null;
  if (result.priority === 'Critical' || result.priority === 'High') {
    autoAssigned = await autoAssignCounsellor(db, caseId, result.priority, userDistrict);
  }

  // Log audit trail
  await logAudit(
    db,
    'ASSESSMENT_CREATED',
    'user',
    req.user.id,
    'case',
    caseId,
    `SVI: ${result.svi}, Priority: ${result.priority}, Mode: ${result.aiMode}`,
    req.ip
  );

  // Alert district admin for Critical cases
  if (result.priority === 'Critical') {
    await logAudit(
      db,
      'CRITICAL_ALERT',
      'system',
      0,
      'case',
      caseId,
      `CRITICAL SVI ${result.svi} - District: ${userDistrict}`,
      req.ip
    );
    console.log(`🚨 CRITICAL CASE ALERT: ${caseId} - District: ${userDistrict}`);
  }

  res.status(201).json({
    ok: true,
    caseId,
    assessment: result,
    autoAssigned: autoAssigned ? { counsellor: autoAssigned.name } : null
  });
});

/**
 * GET /api/assess/stats
 * Get assessment statistics (for admin dashboard)
 */
router.get('/stats', requireAuth, async (req, res) => {
  const db = req.app.locals.db;

  const total = parseInt((await db.get('SELECT COUNT(*) as c FROM cases'))?.c || 0, 10);
  const critical = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'Critical'"))?.c || 0, 10);
  const high = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'High'"))?.c || 0, 10);
  const moderate = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'Moderate'"))?.c || 0, 10);
  const low = parseInt((await db.get("SELECT COUNT(*) as c FROM cases WHERE priority = 'Low'"))?.c || 0, 10);
  const avgSvi = parseFloat((await db.get('SELECT ROUND(AVG(svi)::numeric, 1) as avg FROM cases'))?.avg || 0);

  res.json({
    ok: true,
    stats: { total, critical, high, moderate, low, avgSvi }
  });
});

export default router;