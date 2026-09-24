# Dataset — Single Source of Truth

**This folder contains ALL data the project uses.** The ML engine reads from here. No data is hardcoded in code.

## What's in Here

```
1_dataset/
├── README.md                  ← You are here
│
├── patterns/                  ← NLP keyword patterns
│   ├── critical_threats.json      Kill, murder, weapon, lynch
│   ├── emotional_distress.json    Hopeless, depressed, trauma
│   ├── fear_patterns.json         Fear, terror, panic
│   ├── social_isolation.json      Boycott, alone, abandoned
│   ├── hindi_suicide.json         Hindi suicidal phrases (Priya scenario)
│   ├── medical_emergency.json     Injury, hospital, bleeding
│   └── legal_distress.json        Police, court, FIR
│
├── geo_context/               ← District/state risk data
│   └── india_districts.json       4 states, 54 districts with risk multipliers
│
├── sample_cases/              ← Test/seed cases
│   └── priya_scenario.json       5 demo cases (Priya + 4 others)
│
└── government_schemes.mjs     ← All government schemes, helplines, DLSA data
```

## How Data Is Used

| File | Used By | Purpose |
|---|---|---|
| `patterns/*.json` | `5_ml_engine/engine/text_analyzer.js` | NLP pattern matching |
| `geo_context/india_districts.json` | `5_ml_engine/engine/geo_context.js` | District risk weighting |
| `sample_cases/priya_scenario.json` | `5_ml_engine/test_ml.mjs` | Testing/demo |
| `government_schemes.mjs` | (future) Recommendations engine | Government schemes data |

## How to Add New Data

### Add a new NLP pattern

1. Open the relevant file in `patterns/`
2. Add your entry to the JSON array
3. Restart the server (or call `data_loader.reload()`)

**Example — adding a new Hindi suicide phrase:**
```json
// patterns/hindi_suicide.json
[
  { "pattern": "mar jaayein toh behtar hai", "category": "suicidal_ideation", "severity": 5 },
  { "pattern": "NEW PHRASE HERE", "category": "suicidal_ideation", "severity": 5 }
]
```

### Add a new district

1. Open `geo_context/india_districts.json`
2. Find the relevant state
3. Add a new district entry

**Example:**
```json
{
  "uttar_pradesh": {
    "districts": [
      { "name": "new_district", "risk_multiplier": 1.2, "coordinates": [lat, lng] }
    ]
  }
}
```

## Pattern Format

Each pattern is a JSON object:

```json
{
  "pattern": "the keyword or phrase to match",
  "category": "what type of indicator",
  "severity": "how serious, 1-5"
}
```

### Valid Categories
- `suicidal_ideation` — Self-harm, hopelessness
- `critical_threat` — Life-threatening danger
- `fear_distress` — Fear, terror, panic
- `emotional_distress` — Distress, depression
- `social_isolation` — Boycott, alone, isolated
- `medical_emergency` — Injury, hospital
- `legal_distress` — Police, court, FIR

### Severity Scale
- `5` — Most severe (suicidal, lethal threat)
- `4` — Very severe
- `3` — Moderate
- `2` — Mild
- `1` — Low

## Important Rules

Keep this folder in sync with `5_ml_engine/`. Whenever you add a pattern here, the engine can pick it up on the next restart.
