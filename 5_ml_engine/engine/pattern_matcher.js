/**
 * pattern_matcher.js — Matches text against NLP patterns from dataset/
 *
 * Returns matched categories with severity scores
 * No external API calls
 */

export function matchPatterns(text, patterns) {
  const results = [];
  const lowerText = text.toLowerCase();

  for (const p of patterns) {
    if (lowerText.includes(p.pattern.toLowerCase())) {
      results.push({
        pattern: p.pattern,
        category: p.category,
        severity: p.severity
      });
    }
  }
  return results;
}