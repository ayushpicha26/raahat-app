# RAAHAT — AI Stress & Trauma Assessment for NHAA (14566)

> National-level hackathon project: Real-time psychological triage for victims of caste-based atrocities.

---

## ⚡ Quick Start (60 seconds)

```bash
# 1. Install dependencies
npm install

# 2. Start the entire project (frontend + backend simultaneously)
npm run dev
# → Frontend: http://localhost:5173
# → Backend:  http://localhost:3000

# 3. Test the ML Scenario
npm run test:ml
```

---

## 📁 Project Structure

```
raahat-app/
│
├── 📂 1_dataset/        ← ALL DATA (patterns, geo, schemes, cases)
├── 📂 2_docs/            ← Documentation
├── 📂 3_frontend/        ← React + Vite (all UI code)
├── 📂 4_backend/         ← Express + PostgreSQL (all API code)
├── 📂 5_ml_engine/       ← Local NLP engine (no API calls)
├── 📂 6_side_work/       ← Scratchpad / Temporary Scripts
│
├── 📄 package.json       ← Workspace dependencies & scripts
├── 📄 BRAIN.md           ← Stakeholder access matrix
└── 📄 README.md          ← You are here
```

**Each section has its own README** explaining what every file does.

---

## 🔍 Where Do I Find...?

| I want to... | Go to |
|---|---|
| Understand the system | [2_docs/ARCHITECTURE.md](2_docs/ARCHITECTURE.md) |
| See who can access what | [BRAIN.md](BRAIN.md) |
| Add NLP patterns | [1_dataset/patterns/](1_dataset/patterns/) |
| Add district risk data | [1_dataset/geo_context/](1_dataset/geo_context/) |
| Modify SVI scoring | [5_ml_engine/engine/svi_calculator.js](5_ml_engine/engine/svi_calculator.js) |
| Modify safety override | [5_ml_engine/engine/risk_classifier.js](5_ml_engine/engine/risk_classifier.js) |
| Add an API endpoint | [4_backend/routes/](4_backend/routes/) |
| Change role-based access | [4_backend/middleware/role_access.js](4_backend/middleware/role_access.js) |
| Change DB schema | [4_backend/db/schema.postgresql.sql](4_backend/db/schema.postgresql.sql) |
| Modify the UI | [3_frontend/pages/](3_frontend/pages/) |
| See schemes data | [1_dataset/government_schemes.mjs](1_dataset/government_schemes.mjs) |

---

## 🏗️ Architecture at a Glance

```
Victim submits text
       ↓
[5_ml_engine/] NLP engine (local, no API)
   - pattern matching from 1_dataset/
   - SVI calculation (0-100)
   - safety override
   - geo-context weighting
       ↓
[4_backend/] stores in DB
   - role-based access (BRAIN.md)
   - audit trail
       ↓
[3_frontend/] displays result
```

---

## 📚 Section READMEs (click to read)

- [3_frontend/README.md](3_frontend/README.md) — React frontend
- [4_backend/README.md](4_backend/README.md) — Express backend
- [5_ml_engine/README.md](5_ml_engine/README.md) — ML engine
- [1_dataset/README.md](1_dataset/README.md) — All data
- [2_docs/README.md](2_docs/README.md) — Documentation index

---

## 🎯 Stakeholders (per BRAIN.md)

| Role | What they see |
|---|---|
| Victim | Own case, recommendations, help centers |
| District Admin | All district cases, aggregate stats |
| State Gov | State-level aggregates |
| Counsellor | (STUBBED — deferred) |
| Police | Cases flagged for protection |
| Welfare | Cases needing shelter/relief |
| NHAA HQ | National dashboard |

---

## 📜 License

SIH 2026 — National Hackathon Project
