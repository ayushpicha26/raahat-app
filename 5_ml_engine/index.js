/**
 * ml/index.js — Main ML Engine entry point
 *
 * Processes victim narratives and computes SVI scores
 * Uses local patterns from dataset/ — no external API calls
 */

import { detectLanguage, preprocess, loadAllPatterns } from './engine/text_analyzer.js';
import { matchPatterns } from './engine/pattern_matcher.js';
import { calculateSVI } from './engine/svi_calculator.js';
import { applyGeoContext } from './engine/geo_context.js';
import { checkSafetyOverride, classifyRisk } from './engine/risk_classifier.js';
import { loadAll } from './engine/data_loader.js';

// Load all data at startup
loadAll();

/**
 * Main assessment function
 * @param {string} text - Victim's narrative
 * @param {number} durationSeconds - Audio duration (proxy for voice distress)
 * @param {string} district - Victim's district (for geo-context)
 * @param {string} lang - Language hint
 * @returns {object} Full assessment result
 */
export function assess(text, durationSeconds = 0, district = '', lang = '') {
  // 1. Detect language
  const detectedLang = lang || detectLanguage(text);

  // 2. Preprocess
  const clean = preprocess(text);

  // 3. Load patterns
  const patterns = loadAllPatterns();

  // 4. Match patterns
  const matches = matchPatterns(clean, patterns);

  // 5. Calculate base SVI
  let svi = calculateSVI(matches);

  // 6. Apply duration factor (voice proxy)
  if (durationSeconds > 90 && matches.length > 0) {
    svi = Math.min(100, svi + 8); // Long emotional speech
  }
  if (durationSeconds < 10 && svi > 70) {
    svi = Math.min(100, svi + 5); // Brief + severe = possible shock
  }

  // 7. Apply geo-context
  svi = applyGeoContext(svi, district);

  // 8. Check safety override
  const safetyOverride = checkSafetyOverride(clean, matches);

  // 9. Classify risk
  const classification = classifyRisk(svi, safetyOverride);

  // 10. Build problem types
  const problemTypes = buildProblemTypes(matches);

  // 11. Build factors
  const factors = buildFactors(classification.svi, matches);

  // 12. Build indicators
  const indicators = buildIndicators(matches, classification.svi);

  // 13. Build summary
  const summary = buildSummary(classification.svi, matches, problemTypes);

  // 14. Build recommendations
  const recommendations = buildRecommendations(classification.priority, matches);

  return {
    svi: classification.svi,
    priority: classification.priority,
    priorityLabel: classification.priorityLabel,
    safetyOverride: classification.safetyOverride,
    summary,
    problemTypes,
    factors,
    indicators,
    consequences: 'Delayed support may compound trauma, escalate risk, and impede access to justice.',
    recommendations,
    languageDetected: detectedLang,
    audioDurationSeconds: durationSeconds,
    geoMultiplier: district ? 1.0 : 1.0,
    aiMode: 'local-ml-engine'
  };
}

function buildProblemTypes(matches) {
  const types = [];
  const categories = new Set(matches.map(m => m.category));

  if (categories.has('suicidal_ideation') || categories.has('critical_threat')) {
    types.push({ label: 'Threat / Intimidation', color: 'critical' });
  }
  if (categories.has('medical_emergency')) {
    types.push({ label: 'Physical Safety & Medical Risk', color: 'critical' });
  }
  if (categories.has('fear_distress')) {
    types.push({ label: 'Acute Fear Response', color: 'high' });
  }
  if (categories.has('emotional_distress')) {
    types.push({ label: 'Acute Emotional Distress', color: 'high' });
  }
  if (categories.has('social_isolation')) {
    types.push({ label: 'Social Isolation & Boycott', color: 'high' });
  }
  if (categories.has('legal_distress')) {
    types.push({ label: 'Legal Proceeding Distress', color: 'amber' });
  }

  if (types.length === 0) {
    types.push({ label: 'General Support Request', color: 'safe' });
  }

  return types;
}

function buildFactors(svi, matches) {
  const categories = new Set(matches.map(m => m.category));

  const emotionalScore = Math.min(95, categories.has('emotional_distress') ? 82 : 35);
  const fearScore = Math.min(96, categories.has('fear_distress') ? 82 : 30);
  const isolationScore = Math.min(90, categories.has('social_isolation') ? 84 : 38);
  const safetyScore = Math.min(98, categories.has('critical_threat') ? 94 : 34);
  const supportScore = categories.has('social_isolation') ? 22 : 45;

  return [
    { label: 'Emotional Distress', value: emotionalScore, contrib: emotionalScore >= 80 ? 'Critical' : 'Moderate', conf: 'High' },
    { label: 'Fear / Threat Level', value: fearScore, contrib: fearScore >= 85 ? 'Critical' : fearScore >= 65 ? 'High' : 'Moderate', conf: 'High' },
    { label: 'Anxiety Indicators', value: Math.min(92, fearScore + 10), contrib: fearScore >= 70 ? 'High' : 'Moderate', conf: 'Moderate' },
    { label: 'Social Isolation', value: isolationScore, contrib: isolationScore >= 75 ? 'High' : 'Moderate', conf: 'Moderate' },
    { label: 'Immediate Safety Concerns', value: safetyScore, contrib: safetyScore >= 80 ? 'Critical' : 'High', conf: 'High' },
    { label: 'Overall Case Severity', value: svi, contrib: svi >= 80 ? 'Critical' : svi >= 65 ? 'High' : 'Moderate', conf: 'High' },
    { label: 'Local Support Availability', value: supportScore, contrib: supportScore <= 30 ? 'Low (Adverse)' : 'Moderate', conf: 'High' }
  ];
}

function buildIndicators(matches, svi) {
  const categories = new Set(matches.map(m => m.category));

  return [
    ['Perceived Threat Level', svi >= 85 ? 'Critical' : svi >= 65 ? 'High' : 'Moderate'],
    ['Reported Fear', categories.has('fear_distress') ? 'High' : 'Low–Moderate'],
    ['Emotional Distress', categories.has('emotional_distress') ? 'High' : 'Moderate'],
    ['Social Isolation', categories.has('social_isolation') ? 'High' : 'Low'],
    ['Immediate Safety Concerns', svi >= 85 ? 'Critical' : svi >= 65 ? 'High' : 'Low']
  ];
}

function buildSummary(svi, matches, problemTypes) {
  let summary = `The complainant provided testimony indicating ${svi >= 75 ? 'severe' : svi >= 55 ? 'moderate' : 'standard'} vulnerability. `;

  const categories = new Set(matches.map(m => m.category));

  if (categories.has('suicidal_ideation')) {
    summary += 'Explicit statements suggesting self-harm or hopelessness were detected. ';
  } else if (categories.has('critical_threat')) {
    summary += 'Key statements indicate acute fear of violence or threat to personal safety. ';
  }
  if (categories.has('social_isolation')) {
    summary += 'The complainant notes severe social isolation and absence of community protection. ';
  }
  if (categories.has('emotional_distress')) {
    summary += 'Psychological indicators including distress and anxiety were observed. ';
  }
  summary += 'Expedited human verification and support assignment is advised.';

  return summary;
}

function buildRecommendations(priority, matches) {
  const categories = new Set(matches.map(m => m.category));
  const recs = [];

  if (priority === 'Critical' || priority === 'High') {
    recs.push({
      title: 'Immediate Safety & Protection Assessment',
      priority: 'Immediate Attention',
      priorityColor: 'text-critical-700 bg-critical-50 border-critical-100',
      iconType: 'shield',
      desc: 'Your responses indicate immediate safety concerns. An authorized emergency safety officer is notified.',
      cta: 'Contact Authorized Emergency Support',
      urgent: true
    });
  }

  if (categories.has('emotional_distress') || priority !== 'Low') {
    recs.push({
      title: 'Counselling & Psychological First Aid',
      priority: categories.has('emotional_distress') ? 'High Priority' : 'Recommended',
      priorityColor: categories.has('emotional_distress') ? 'text-high-700 bg-high-50 border-high-100' : 'text-navy-700 bg-navy-50 border-navy-100',
      iconType: 'message',
      desc: 'Connect with an authorized clinical counsellor for confidential psychological support.',
      cta: 'Request Counselling Support',
      urgent: false
    });
  }

  if (categories.has('legal_distress') || priority !== 'Low') {
    recs.push({
      title: 'Free Legal Aid & Representation',
      priority: 'High Priority',
      priorityColor: 'text-high-700 bg-high-50 border-high-100',
      iconType: 'gavel',
      desc: 'Connect with the District Legal Services Authority (DLSA) for free legal aid.',
      cta: 'Request Legal Aid',
      urgent: false
    });
  }

  if (categories.has('medical_emergency')) {
    recs.push({
      title: 'Medical & Health Assistance',
      priority: 'Consider',
      priorityColor: 'text-amber-700 bg-amber-50 border-amber-100',
      iconType: 'heart',
      desc: 'Medical referral and forensic assistance through government district hospitals.',
      cta: 'Request Medical Assistance',
      urgent: false
    });
  }

  if (priority === 'Critical' || priority === 'High') {
    recs.push({
      title: 'Witness & Victim Protection Scheme',
      priority: 'Urgent',
      priorityColor: 'text-critical-700 bg-critical-50 border-critical-100',
      iconType: 'shield-check',
      desc: 'Protection under statutory victim and witness protection provisions.',
      cta: 'Request Witness Protection',
      urgent: true
    });
  }

  recs.push({
    title: 'Rehabilitation & Welfare Support',
    priority: 'Available',
    priorityColor: 'text-navy-700 bg-navy-50 border-navy-100',
    iconType: 'home',
    desc: 'Long-term welfare schemes, temporary shelter, and rehabilitation grants.',
    cta: 'Request Welfare Support',
    urgent: false
  });

  return recs;
}