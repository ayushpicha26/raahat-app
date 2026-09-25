/**
 * svi_calculator.js — Computes Stress Vulnerability Index (SVI)
 *
 * Output range: 0-100 (clamped)
 * No external API calls
 */

const CATEGORY_WEIGHTS = {
  suicidal_ideation: 35,
  critical_threat: 30,
  fear_distress: 18,
  emotional_distress: 15,
  social_isolation: 14,
  medical_emergency: 20,
  legal_distress: 10
};

export function calculateSVI(matches) {
  let baseScore = 40;

  const categoryScores = {};
  for (const m of matches) {
    if (!categoryScores[m.category]) {
      categoryScores[m.category] = 0;
    }
    categoryScores[m.category] = Math.max(categoryScores[m.category], m.severity * 6);
  }

  for (const [cat, score] of Object.entries(categoryScores)) {
    const weight = CATEGORY_WEIGHTS[cat] || 5;
    baseScore += Math.min(weight, score);
  }

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(baseScore)));
}