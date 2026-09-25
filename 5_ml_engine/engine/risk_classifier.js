/**
 * risk_classifier.js — Final SVI classification with safety override
 *
 * Forces Critical priority for explicit self-harm/severe violence
 * No external API calls
 */

const SUICIDAL_PATTERNS = [
  'mar jaayein', 'behtar hai', 'koi bacha nahi', 'jaan se maar',
  'maar jaana', 'khud ko', 'apna jathan', 'jeena nahi',
  'mar jana', 'kuch bacha nahi'
];

const SEVERE_VIOLENCE_PATTERNS = [
  'mar dalenge', 'murder', 'lynch', 'dhun', 'burn alive', 'rape', 'gang rape'
];

export function checkSafetyOverride(text, matches) {
  const lower = text.toLowerCase();

  for (const p of SUICIDAL_PATTERNS) {
    if (lower.includes(p)) {
      return {
        forced: true,
        reason: `Explicit suicidal ideation detected: "${p}"`,
        minSVI: 87
      };
    }
  }

  for (const p of SEVERE_VIOLENCE_PATTERNS) {
    if (lower.includes(p)) {
      return {
        forced: true,
        reason: `Severe violence detected: "${p}"`,
        minSVI: 85
      };
    }
  }

  const hasSuicidal = matches.some(m => m.category === 'suicidal_ideation');
  if (hasSuicidal) {
    return {
      forced: true,
      reason: 'Suicidal ideation pattern matched',
      minSVI: 85
    };
  }

  return { forced: false };
}

export function classifyRisk(svi, safetyOverride = {}) {
  let finalSVI = svi;

  if (safetyOverride.forced) {
    finalSVI = Math.max(svi, safetyOverride.minSVI);
  }

  // Clamp to 0-100
  finalSVI = Math.max(0, Math.min(100, finalSVI));

  let priority, priorityLabel;
  if (finalSVI >= 85) {
    priority = 'Critical';
    priorityLabel = 'CRITICAL PRIORITY';
  } else if (finalSVI >= 65) {
    priority = 'High';
    priorityLabel = 'HIGH PRIORITY';
  } else if (finalSVI >= 45) {
    priority = 'Moderate';
    priorityLabel = 'MODERATE PRIORITY';
  } else {
    priority = 'Low';
    priorityLabel = 'LOW PRIORITY';
  }

  return {
    svi: finalSVI,
    priority,
    priorityLabel,
    safetyOverride: safetyOverride.forced ? safetyOverride.reason : null
  };
}