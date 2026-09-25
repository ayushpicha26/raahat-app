/**
 * services/journey_service.js — Case Journey Tracker (Stakeholder Workflow)
 *
 * Manages the multi-stakeholder workflow for a case:
 * NLP Assessment → Counsellor → DoSJE → Police → Special Court → Closed
 *
 * Each step has:
 *  - A stakeholder role responsible
 *  - An SLA (hours) based on PoA Act / scheme rules
 *  - Status: pending | in_progress | completed | skipped | overdue
 *  - Auto-routing to next stakeholder when marked complete
 */

const JOURNEY_TEMPLATE = {
  // Critical / High / Atrocity cases — full workflow
  Critical: [
    { step: 'NLP Assessment',     role: 'system',         sla_hours: 0,   label: 'AI analysis complete' },
    { step: 'Counsellor Review',  role: 'counsellor',     sla_hours: 4,   label: 'Counsellor assigned' },
    { step: 'DoSJE Review',       role: 'dosje',          sla_hours: 24,  label: 'DSWO reviewing case' },
    { step: 'FIR Registration',   role: 'police',         sla_hours: 24,  label: 'FIR to be filed (24hr rule)' },
    { step: 'Relief Disbursement', role: 'dosje',         sla_hours: 168, label: 'PoA relief within 7 days' },
    { step: 'Investigation',      role: 'police',         sla_hours: 720, label: 'Chargesheet within 30 days' },
    { step: 'Special Court Trial', role: 'dosje',         sla_hours: 1440, label: 'Trial within 60 days of chargesheet' },
    { step: 'Case Closure',       role: 'nhaa_admin',     sla_hours: 0,   label: 'Final closure & archive' }
  ],
  High: [
    { step: 'NLP Assessment',     role: 'system',         sla_hours: 0,   label: 'AI analysis complete' },
    { step: 'Counsellor Review',  role: 'counsellor',     sla_hours: 8,   label: 'Counsellor assigned' },
    { step: 'DoSJE Review',       role: 'dosje',          sla_hours: 48,  label: 'DSWO reviewing case' },
    { step: 'FIR Registration',   role: 'police',         sla_hours: 48,  label: 'FIR to be filed' },
    { step: 'Relief Disbursement', role: 'dosje',         sla_hours: 336, label: 'PoA relief within 14 days' },
    { step: 'Case Closure',       role: 'nhaa_admin',     sla_hours: 0,   label: 'Final closure & archive' }
  ],
  Moderate: [
    { step: 'NLP Assessment',     role: 'system',         sla_hours: 0,   label: 'AI analysis complete' },
    { step: 'Counsellor Review',  role: 'counsellor',     sla_hours: 24,  label: 'Counsellor follow-up' },
    { step: 'District Admin',     role: 'admin',          sla_hours: 72,  label: 'District admin review' },
    { step: 'Case Closure',       role: 'nhaa_admin',     sla_hours: 0,   label: 'Final closure & archive' }
  ],
  Low: [
    { step: 'NLP Assessment',     role: 'system',         sla_hours: 0,   label: 'AI analysis complete' },
    { step: 'Self-Help Resources', role: 'system',        sla_hours: 0,   label: 'Resources provided' },
    { step: 'Case Closure',       role: 'nhaa_admin',     sla_hours: 0,   label: 'Final closure & archive' }
  ]
};

/**
 * Initialize the journey for a new case
 * Auto-creates all steps in the workflow, marks first step as in_progress
 */
export async function initializeJourney(db, caseId, priority) {
  const template = JOURNEY_TEMPLATE[priority] || JOURNEY_TEMPLATE.Low;
  const now = new Date().toISOString();

  for (let idx = 0; idx < template.length; idx++) {
    const step = template[idx];
    const deadline = step.sla_hours > 0
      ? new Date(Date.now() + step.sla_hours * 3600 * 1000).toISOString()
      : null;
    const status = idx === 0 ? 'completed' : (idx === 1 ? 'in_progress' : 'pending');
    const startedAt = idx <= 1 ? now : null;

    await db.query(`
      INSERT INTO case_journey
      (case_id, step_order, step_name, stakeholder_role, status, started_at, sla_hours, sla_deadline)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      caseId,
      idx + 1,
      step.step,
      step.role,
      status,
      startedAt,
      step.sla_hours,
      deadline
    ]);
  }

  await logAudit(db, 'journey_init', caseId, `Journey initialized with ${template.length} steps for ${priority} priority`);
  return template;
}

/**
 * Get full journey for a case
 */
export async function getJourney(db, caseId) {
  const steps = await db.all(`
    SELECT * FROM case_journey
    WHERE case_id = $1
    ORDER BY step_order ASC
  `, [caseId]);

  if (steps.length === 0) return null;

  // Find current step (first non-completed)
  const currentStep = steps.find(s => s.status === 'in_progress') || steps.find(s => s.status === 'pending');
  const completedCount = steps.filter(s => s.status === 'completed').length;

  return {
    case_id: caseId,
    total_steps: steps.length,
    completed_steps: completedCount,
    progress_percent: Math.round((completedCount / steps.length) * 100),
    current_step: currentStep,
    current_handler: currentStep ? {
      role: currentStep.stakeholder_role,
      name: currentStep.assigned_user_name || getRoleLabel(currentStep.stakeholder_role),
      step_name: currentStep.step_name,
      label: currentStep.notes
    } : null,
    steps
  };
}

/**
 * Mark a step as complete and auto-advance to the next
 * Returns the next step's info
 */
export async function completeStep(db, caseId, stepId, completedBy, notes = '') {
  const now = new Date().toISOString();

  // Get the step being completed
  const step = await db.get(`
    SELECT * FROM case_journey WHERE id = $1 AND case_id = $2
  `, [stepId, caseId]);

  if (!step) throw new Error('Step not found');
  if (step.status === 'completed') throw new Error('Step already completed');

  // Mark current step as complete
  await db.query(`
    UPDATE case_journey
    SET status = 'completed', completed_at = $1, notes = $2, updated_at = $3
    WHERE id = $4
  `, [now, notes, now, stepId]);

  // Find next step
  const nextStep = await db.get(`
    SELECT * FROM case_journey
    WHERE case_id = $1 AND step_order = $2
  `, [caseId, step.step_order + 1]);

  if (nextStep) {
    // Activate next step
    const newDeadline = nextStep.sla_hours > 0
      ? new Date(Date.now() + nextStep.sla_hours * 3600 * 1000).toISOString()
      : null;

    await db.query(`
      UPDATE case_journey
      SET status = 'in_progress', started_at = $1, sla_deadline = $2, updated_at = $3
      WHERE id = $4
    `, [now, newDeadline, now, nextStep.id]);

    // Update case status to reflect current handler
    await db.query(`
      UPDATE cases
      SET status = $1, assigned_officer = $2, updated_at = $3
      WHERE case_id = $4
    `, [
      `With ${getRoleLabel(nextStep.stakeholder_role)}`,
      getRoleLabel(nextStep.stakeholder_role),
      now,
      caseId
    ]);

    await logAudit(db, 'step_completed', caseId,
      `Step "${step.step_name}" completed by ${completedBy}. Now with: ${nextStep.step_name} (${getRoleLabel(nextStep.stakeholder_role)})`,
      { completed_step: step.step_name, next_step: nextStep.step_name }
    );

    return { completed: step, next: nextStep };
  } else {
    // No next step - case fully closed
    await db.query(`
      UPDATE cases SET status = 'Case Closed', updated_at = $1 WHERE case_id = $2
    `, [now, caseId]);

    await logAudit(db, 'case_closed', caseId, `Case fully closed by ${completedBy}`);

    return { completed: step, next: null, case_closed: true };
  }
}

/**
 * Assign a specific officer to a step
 */
export async function assignOfficer(db, caseId, stepId, officerId, officerName) {
  const now = new Date().toISOString();

  await db.query(`
    UPDATE case_journey
    SET assigned_user_id = $1, assigned_user_name = $2, updated_at = $3
    WHERE id = $4 AND case_id = $5
  `, [officerId, officerName, now, stepId, caseId]);

  await logAudit(db, 'officer_assigned', caseId,
    `Officer ${officerName} (ID:${officerId}) assigned to step ${stepId}`);
}

/**
 * Get all cases currently with a specific stakeholder role (their work queue)
 */
export async function getWorkQueue(db, role) {
  return db.all(`
    SELECT j.*, c.priority, c.svi, c.summary, c.district, c.state
    FROM case_journey j
    JOIN cases c ON c.case_id = j.case_id
    WHERE j.stakeholder_role = $1 AND j.status = 'in_progress'
    ORDER BY
      CASE c.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Moderate' THEN 3
        WHEN 'Low' THEN 4
      END,
      j.sla_deadline ASC
  `, [role]);
}

/**
 * Check for overdue steps and update their status
 * Should be called periodically (e.g., on every API request)
 */
export async function checkOverdueSteps(db) {
  const now = new Date().toISOString();
  const result = await db.query(`
    UPDATE case_journey
    SET status = 'overdue', updated_at = $1
    WHERE status = 'in_progress'
    AND sla_deadline IS NOT NULL
    AND sla_deadline < $2
  `, [now, now]);

  return result.rowCount;
}

// ── Helpers ──

function getRoleLabel(role) {
  const labels = {
    system: 'System',
    counsellor: 'Counsellor',
    dosje: 'DoSJE Officer (DSWO)',
    police: 'Police Officer',
    admin: 'District Admin',
    nhaa_admin: 'NHAA Admin',
    welfare: 'Welfare Officer'
  };
  return labels[role] || role;
}

async function logAudit(db, action, targetId, details, extra = {}) {
  try {
    await db.query(`
      INSERT INTO audit_log (action, actor_type, target_type, target_id, details, created_at)
      VALUES ($1, 'system', 'case_journey', $2, $3, NOW())
    `, [action, String(targetId), JSON.stringify({ message: details, ...extra })]);
  } catch (err) {
    console.warn('Audit log failed:', err.message);
  }
}
