# System Architecture

## Overview

RAAHAT adds a real-time psychological triage layer to NHAA's existing legal grievance workflow. It analyzes victim narratives, computes vulnerability scores, and routes cases to the right human support.

## High-Level Flow

```
┌──────────────────────────────────────────────────────────┐
│                FRONTEND (3_frontend/)                    │
│  Voice/Text Input → Assessment UI → Results Display      │
└──────────────────────────────────────────────────────────┘
                       │ HTTP (fetch)
                       ▼
┌──────────────────────────────────────────────────────────┐
│                 BACKEND (4_backend/)                      │
│  Routes → Services → Role-Based Filter → Response        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Uses ML engine from 5_ml_engine/ (NO external API) │    │
│  └──────────────────────────────────────────────────┘    │
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────┐    │
│  │            ML ENGINE (5_ml_engine/)              │    │
│  │  text → pattern match → SVI score → classify     │
│  │  → safety override → geo-context weighting        │
│  └────────────────────┬─────────────────────────────┘    │
│                       │ reads from                        │
│  ┌────────────────────▼─────────────────────────────┐    │
│  │           DATASET (1_dataset/)                    │    │
│  │  patterns/*.json, geo_context/*.json, cases       │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                       │ stores in
                       ▼
┌──────────────────────────────────────────────────────────┐
│              SQLite Database (4_backend/db/raahat.db)      │
│  users, cases, factors, indicators, recommendations,      │
│  counsellors, assignments, audit_log                      │
└──────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. No External API Calls
- All NLP analysis is done locally using pattern matching
- The ML engine reads from `1_dataset/patterns/*.json`
- This means the system works offline and has no API costs

### 2. Dataset-Driven NLP
- All patterns live in `1_dataset/patterns/` as JSON files
- Adding new patterns requires zero code changes
- Patterns are loaded at engine startup and cached

### 3. Role-Based Data Access
- BRAIN.md defines exactly what each stakeholder sees
- `4_backend/middleware/role_access.js` enforces data filtering
- Citizens see only their own cases
- Admins see only their district's cases

### 4. SQLite for Hackathon
- Single-file database for portability
- No cloud dependency needed
- Easy to reset/seed for demos

### 5. Counsellor Portal Stubbed
- Per user request, counsellor portal is deferred
- A placeholder exists at `3_frontend/pages/Counsellor/`
- Assignment logic exists in `4_backend/services/assignment_service.js`

## Data Flow Example (Priya Scenario)

1. Priya calls 14566, her text is captured
2. Text goes to `5_ml_engine/index.js` via `POST /api/assessment`
3. ML engine matches patterns from `1_dataset/patterns/hindi_suicide.json`
4. "mar jaayein toh behtar hai" triggers safety override
5. SVI = 87+, Priority = Critical
6. Geo-context: Sant Kabir Nagar = 1.3x multiplier
7. Case saved to DB with auto-assigned counsellor
8. District admin sees Critical alert in audit log
9. Victim sees results in UI
10. Counsellor would see the case in their portal (stubbed)
