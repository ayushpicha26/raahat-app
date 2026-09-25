# NLP Engine Documentation

## Overview

The NLP engine analyzes victim narratives and computes Stress Vulnerability Index (SVI) scores. It uses **local pattern matching** — no external API calls.

## How It Works

```
Input: "mar jaayein toh behtar hai..."
       ↓
1. PREPROCESS
   - lowercase, trim, Unicode normalize
   - detect language (Hindi/English/Marathi)
       ↓
2. PATTERN MATCH
   - scan against 1_dataset/patterns/*.json
   - categories: critical_threat, suicidal, fear, isolation, etc.
       ↓
3. SVI CALCULATION
   - base score: 40
   - category weights add points
   - geo-context multiplier applied
   - duration proxy for voice
       ↓
4. SAFETY OVERRIDE
   - if explicit suicidal/severe violence language
   - force SVI >= 85 (Critical)
       ↓
5. CLASSIFICATION
   - 85-100: Critical
   - 65-84: High
   - 45-64: Moderate
   - 0-44: Low
       ↓
Output: { svi: 91, priority: "Critical", ... }
```

## Pattern Categories

All patterns live in `1_dataset/patterns/`:

| File | Purpose | Examples |
|---|---|---|
| `critical_threats.json` | Life-threatening danger | kill, murder, weapon, lynch, burn, beat |
| `hindi_suicide.json` | Hindi suicidal ideation | "mar jaayein toh behtar hai", "koi bacha nahi" |
| `emotional_distress.json` | Psychological distress | cry, hopeless, depressed, sad, trauma |
| `social_isolation.json` | Boycott, abandonment | alone, boycott, outcast, "koi sunta nahi" |
| `fear_patterns.json` | Fear indicators | fear, terror, panic, darr, dar |
| `medical_emergency.json` | Injury/medical need | injured, hospital, bleeding |
| `legal_distress.json` | Legal issues | police, court, FIR, "fir nahi" |

## Safety Override Logic

When explicit self-harm or severe violence language appears, the system **forces Critical** regardless of voice/acoustic score:

```javascript
// In 5_ml_engine/engine/risk_classifier.js
if (text.includes('mar jaayein') || text.includes('koi bacha nahi')) {
  svi = Math.max(svi, 87); // Force Critical
}
```

This prevents a falsely low score when a victim sounds calm but describes lethal threats.

## Geo-Context Weighting

The engine uses district-level data from `1_dataset/geo_context/india_districts.json` to adjust risk:

```javascript
const multiplier = getDistrictMultiplier(district); // e.g., 1.3 for Sant Kabir Nagar
const adjustedSvi = Math.round(svi * multiplier);
```

- High-atrocity districts (Western UP, Bihar): ×1.3
- Medium-risk districts: ×1.0
- Lower-risk districts: ×0.85

## Adding New Patterns

1. Edit the relevant JSON file in `1_dataset/patterns/`
2. Restart server (or call `data_loader.reload()`)
3. No code changes needed

Example — adding a new Hindi suicide phrase:
```json
// 1_dataset/patterns/hindi_suicide.json
[
  { "pattern": "mar jaayein toh behtar hai", "category": "suicidal_ideation", "severity": 5 },
  { "pattern": "NEW PHRASE HERE", "category": "suicidal_ideation", "severity": 5 }
]
```

## Testing

```bash
npm run test:ml
```

Runs the Priya scenario through the full pipeline and shows output.
