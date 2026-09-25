/**
 * text_analyzer.js — Preprocesses input text and detects language
 *
 * Reads patterns from 1_dataset/patterns/
 * No external API calls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATTERNS_DIR = path.join(__dirname, '..', '..', '1_dataset', 'patterns');

// ── Language Detection ──
export function detectLanguage(text) {
  const hindiChars = text.match(/[आ-ह]/g);
  const marathiChars = text.match(/[अ-ऱ]/g);

  const totalChars = text.replace(/\s/g, '').length;
  if (totalChars === 0) return 'English';

  const hindiRatio = (hindiChars ? hindiChars.length : 0) / totalChars;
  const marathiRatio = (marathiChars ? marathiChars.length : 0) / totalChars;

  if (hindiRatio > 0.1) return 'Hindi';
  if (marathiRatio > 0.1) return 'Marathi';
  return 'English';
}

// ── Preprocess ──
export function preprocess(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFC');
}

// ── Load All Patterns ──
export function loadAllPatterns() {
  const categories = [
    'critical_threats.json',
    'emotional_distress.json',
    'social_isolation.json',
    'fear_patterns.json',
    'hindi_suicide.json',
    'medical_emergency.json',
    'legal_distress.json'
  ];

  let allPatterns = [];
  for (const file of categories) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(PATTERNS_DIR, file), 'utf8'));
      allPatterns = allPatterns.concat(data);
    } catch (err) {
      console.warn(`⚠️ Failed to load ${file}: ${err.message}`);
    }
  }
  return allPatterns;
}
