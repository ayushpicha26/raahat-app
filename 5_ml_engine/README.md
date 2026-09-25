# ML Engine — The Brain of RAAHAT

Analyzes victim text and computes SVI scores. **No external API calls.**

## What's in Here

```
5_ml_engine/
├── README.md                ← You are here
├── index.js                 ← Main entry point — call assess() from here
│
└── engine/
    ├── text_analyzer.js     ← Language detection, preprocessing
    ├── pattern_matcher.js   ← Matches text against patterns
    ├── svi_calculator.js    ← Computes SVI score (0-100)
    ├── geo_context.js       ← Applies district risk weighting
    ├── risk_classifier.js   ← Safety override + final priority
    ├── data_loader.js       ← Loads patterns from 1_dataset/
    └── speech_analyzer.js   ← Optional acoustic analysis (legacy)
```

## How It Works

```
Input: "mar jaayein toh behtar hai..."
       ↓
text_analyzer    → Detect language, clean text
       ↓
pattern_matcher  → Match against 1_dataset/patterns/
       ↓
svi_calculator   → Compute base score (0-100)
       ↓
geo_context      → Apply district multiplier
       ↓
risk_classifier  → Safety override + final priority
       ↓
Output: { svi: 91, priority: "Critical", ... }
```

## How to Use

```javascript
import { assess } from '../5_ml_engine/index.js';

const result = assess(
  'mar jaayein toh behtar hai',  // victim's text
  120,                            // audio duration (optional)
  'sant kabir nagar',             // district (optional)
  'Hindi'                         // language hint (optional)
);

console.log(result.svi);          // 91
console.log(result.priority);     // "Critical"
console.log(result.safetyOverride); // "Explicit suicidal ideation..."
```

## File-by-File

### [index.js](index.js)
Main entry point. Exports the `assess()` function. Orchestrates all engine modules.

### [engine/text_analyzer.js](engine/text_analyzer.js)
- Detects language (Hindi/Marathi/English) using Unicode ranges
- Preprocesses text (lowercase, trim, normalize)
- Loads all patterns from `1_dataset/patterns/`

### [engine/pattern_matcher.js](engine/pattern_matcher.js)
- Simple substring matching against patterns
- Returns array of `{ pattern, category, severity }`

### [engine/svi_calculator.js](engine/svi_calculator.js)
- Calculates base SVI score from matched patterns
- Category weights defined here
- Output clamped to 28-96 range

### [engine/geo_context.js](engine/geo_context.js)
- Reads district risk multipliers from `1_dataset/geo_context/india_districts.json`
- Applies multiplier to SVI score
- Higher-risk districts get higher scores

### [engine/risk_classifier.js](engine/risk_classifier.js)
- **Safety override** — Forces Critical for explicit suicidal/violence language
- Final classification into Low/Moderate/High/Critical
- Returns priority + SVI

### [engine/data_loader.js](engine/data_loader.js)
- Caches patterns and geo data at startup
- `reload()` to refresh without restart

## Adding New Logic

| To add... | Edit... |
|---|---|
| New pattern category | Add to [1_dataset/patterns/](../1_dataset/patterns/) + update `CATEGORY_WEIGHTS` in [engine/svi_calculator.js](engine/svi_calculator.js) |
| New safety override trigger | [engine/risk_classifier.js](engine/risk_classifier.js) |
| New district | [1_dataset/geo_context/](../1_dataset/geo_context/) |
| New language support | [engine/text_analyzer.js](engine/text_analyzer.js) |

## Testing

```bash
npm run test:ml
```

Runs the Priya scenario through the full pipeline.
