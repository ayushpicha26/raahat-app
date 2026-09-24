/**
 * services/assessment_service.js — Assessment Business Logic
 *
 * Uses LOCAL ML engine from ml_engine/ — NO external API calls
 * Gemini is ONLY a fallback if ML engine fails
 */

import { assess as mlAssess } from '../../5_ml_engine/index.js';

/**
 * Perform assessment using ML engine
 * @param {string} text - Victim narrative
 * @param {number} durationSeconds - Audio duration
 * @param {string} district - Victim's district
 * @param {string} lang - Language hint
 * @returns {object} Full assessment result
 */
export function performAssessment(text, durationSeconds = 0, district = '', lang = '') {
  try {
    const result = mlAssess(text, durationSeconds, district, lang);
    return {
      ...result,
      aiMode: 'local-ml-engine'
    };
  } catch (err) {
    console.error('ML Engine error:', err.message);
    // Fallback to basic assessment if ML engine fails
    return basicAssessment(text, durationSeconds, lang);
  }
}

/**
 * Basic fallback assessment when ML engine is unavailable
 */
function basicAssessment(text, durationSeconds, lang) {
  const lower = text.toLowerCase();
  let baseScore = 40;

  // Critical threat detection
  if (/kill|murder|weapon|lynch|burn|assault|beaten|marna|jaan/i.test(lower)) {
    baseScore += 30;
  }
  // Fear/distress
  if (/fear|terror|panic|threat|unsafe|dar|darr|khauf/i.test(lower)) {
    baseScore += 18;
  }
  // Emotional distress
  if (/cry|hopeless|depressed|sad|trauma|rona|dukh/i.test(lower)) {
    baseScore += 15;
  }
  // Social isolation
  if (/alone|isolated|boycott|outcast|koi nahi|sunta nahi/i.test(lower)) {
    baseScore += 14;
  }

  const svi = Math.min(96, Math.max(28, Math.round(baseScore)));
  const priority = svi >= 85 ? 'Critical' : svi >= 65 ? 'High' : svi >= 45 ? 'Moderate' : 'Low';

  return {
    svi,
    priority,
    priorityLabel: `${priority.toUpperCase()} PRIORITY`,
    safetyOverride: null,
    summary: `Assessment indicates ${priority.toLowerCase()} vulnerability level.`,
    problemTypes: [],
    factors: [],
    indicators: [],
    consequences: 'Delayed support may escalate risk.',
    recommendations: [],
    languageDetected: lang || 'English',
    audioDurationSeconds: durationSeconds,
    aiMode: 'basic-fallback'
  };
}

/**
 * Save assessment to database
 */
export async function saveAssessmentToDB(db, assessment, userId, district = '', state = 'Maharashtra') {
  const caseNum = Math.floor(10000 + Math.random() * 90000);
  const caseId = `RAH-${new Date().getFullYear()}-${caseNum}`;

  // Determine initial status based on priority
  const initialStatus = assessment.priority === 'Critical'
    ? 'Human Review Required'
    : assessment.priority === 'High'
      ? 'Under Review'
      : 'Assessment Pending';

  await db.query(`
    INSERT INTO cases (case_id, user_id, transcript, svi, priority, priority_label, problem_types, summary, consequences, status, language_detected, audio_duration_seconds, ai_mode, district, state)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    caseId, userId,
    assessment.transcript || '',
    assessment.svi,
    assessment.priority,
    assessment.priorityLabel || `${assessment.priority} PRIORITY`,
    JSON.stringify(assessment.problemTypes || []),
    assessment.summary || '',
    assessment.consequences || '',
    initialStatus,
    assessment.languageDetected || 'English',
    assessment.audioDurationSeconds || 0,
    assessment.aiMode || 'local',
    district,
    state
  ]);

  return caseId;
}