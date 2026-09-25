# Backend — Express + PostgreSQL

The API server for RAAHAT. Uses PostgreSQL for persistent relational data and the LOCAL ML engine from 5_ml_engine/ for all NLP processing.

## What's in Here

```
4_backend/
├── README.md                ← You are here
├── server.mjs               ← Main server entry point
├── init_db.mjs              ← Initialize/seed the PostgreSQL database
├── add_admins.cjs           ← Verify admin officers (helper script)
│
├── db/
│   ├── connection.js        ← PostgreSQL connection pool (pg.Pool singleton)
│   ├── schema.postgresql.sql← PostgreSQL schema (all 10 tables + indexes)
│   └── schema.sql           ← Legacy SQLite schema
│
├── routes/
│   ├── auth.js              ← /api/auth/* — register, login, OTP, profile
│   ├── cases.js             ← /api/cases/* — case CRUD, stats, journey
│   └── assessment.js        ← /api/assessment/* — runs ML engine
│
├── services/
│   ├── assessment_service.js ← Business logic for assessments
│   ├── journey_service.js    ← Case journey workflow (stakeholder routing)
│   └── assignment_service.js ← Counsellor assignment (placeholder)
│
├── middleware/
│   ├── auth.js              ← JWT verify, requireAuth, requireAdmin
│   ├── role_access.js       ← Role-based data filtering (BRAIN.md)
│   └── validation.js        ← Input validation
│
└── utils/
    ├── audit_logger.js      ← Audit trail logger
    └── response_helper.js   ← Standardized API responses
```

## How It Fits Together

```
HTTP request
     ↓
[server.mjs] Express app
     ↓
[middleware/auth.js] JWT verification
     ↓
[routes/*.js] Route handler
     ↓
[services/*.js] Business logic
     ↓
[5_ml_engine/index.js] NLP engine (if assessment)
     ↓
[db/connection.js] PostgreSQL connection pool
     ↓
[utils/audit_logger.js] Log action
     ↓
HTTP response
```

## File-by-File

### [server.mjs](server.mjs)
The main server. Sets up:
- Express + JSON middleware
- PostgreSQL connection + schema verification
- JWT auth middleware
- All routes
- Static file serving from 3_frontend/dist
- Error handling

### [db/connection.js](db/connection.js)
- Connection pool with PostgreSQL via `pg.Pool`
- Configurable via `DATABASE_URL` or standard `PG*` env variables
- Async helpers: `query()`, `get()`, `all()`, `run()`, `exec()`, `transaction()`

### [db/schema.postgresql.sql](db/schema.postgresql.sql)
All database tables:
- `users` — Citizens
- `admins` — Officers
- `cases` — Assessment cases
- `assessment_factors` — SVI breakdown
- `assessment_indicators` — Detected indicators
- `recommendations` — Support recommendations
- `counsellors` — Counsellor list (placeholder)
- `assignments` — Case-to-counsellor mapping (placeholder)
- `case_journey` — **Stakeholder workflow tracker** (per-step status, SLA deadlines, current handler)
- `audit_log` — All actions logged
- `assignments` — Case-to-counsellor mapping (placeholder)
- `case_journey` — **Stakeholder workflow tracker** (per-step status, SLA deadlines, current handler)
- `audit_log` — All actions logged

### [routes/auth.js](routes/auth.js)
- `POST /api/auth/register` — New user
- `POST /api/auth/login` — Login (citizen or admin)
- `GET /api/auth/me` — Current user info
- `POST /api/auth/send-otp` — Send OTP (demo)
- `PUT /api/users/profile` — Update profile

### [routes/cases.js](routes/cases.js)
- `GET /api/cases` — List cases (role-filtered)
- `POST /api/cases` — Create case (auto-initializes journey)
- `GET /api/cases/:id` — Case detail
- `GET /api/cases/:id/journey` — **Get stakeholder journey for a case**
- `POST /api/cases/:id/journey/:stepId/complete` — **Mark step done & forward to next stakeholder**
- `POST /api/cases/:id/journey/:stepId/assign` — **Assign specific officer to a step**
- `GET /api/cases/admin/work-queue/:role` — **Get pending cases for a stakeholder role**
- `PUT /api/cases/:id/status` — Update status (admin)
- `PUT /api/cases/:id/assign` — Assign officer (admin)
- `GET /api/cases/admin/stats` — Dashboard stats

### [routes/assessment.js](routes/assessment.js)
- `POST /api/assessment` — **Runs ML engine, saves case, triggers alerts**
- `GET /api/assessment/stats` — Aggregate stats

### [services/assessment_service.js](services/assessment_service.js)
- Wraps the ML engine
- Saves results to database
- Triggers alerts for Critical cases

### [services/assignment_service.js](services/assignment_service.js)
- **STUBBED** — Counsellor portal not yet implemented
- Placeholder for auto-assignment logic

### [services/journey_service.js](services/journey_service.js)
- **Case journey workflow** — tracks a case through stakeholders
- `initializeJourney()` — Creates workflow steps when a case is created (auto-runs on case creation)
- `getJourney()` — Returns full timeline with current handler, progress %, all steps
- `completeStep()` — Marks a step done, auto-advances to next stakeholder, updates case status
- `assignOfficer()` — Assigns specific officer to a step
- `getWorkQueue()` — Returns all pending cases for a given role (e.g., all cases currently with DoSJE)
- `checkOverdueSteps()` — Marks overdue SLA steps

**Journey templates by priority:**
- **Critical:** NLP → Counsellor → DoSJE → FIR (24hr) → Relief (7d) → Investigation (30d) → Special Court (60d) → Closed
- **High:** NLP → Counsellor → DoSJE → FIR (48hr) → Relief (14d) → Closed
- **Moderate:** NLP → Counsellor → District Admin → Closed
- **Low:** NLP → Self-Help → Closed

### [middleware/auth.js](middleware/auth.js)
- `hashPassword()`, `verifyPassword()` — bcrypt
- `generateToken()`, `verifyToken()` — JWT
- `authMiddleware` — Attach user to req
- `requireAuth` — Reject if not logged in
- `requireAdmin` — Reject if not admin

### [middleware/role_access.js](middleware/role_access.js)
- **Enforces BRAIN.md access matrix**
- `filterCasesByRole()` — Filter cases based on user role
- `canAccessCase()` — Check if user can see a specific case
- `getAllowedFields()` — Whitelist of fields per role

### [middleware/validation.js](middleware/validation.js)
- `validateAssessmentInput` — Text length, required fields
- `validateCaseInput` — SVI range, priority values

### [utils/audit_logger.js](utils/audit_logger.js)
- `logAudit()` — Log every action to `audit_log` table
- `getAuditTrail()` — Retrieve logs for a target

## API Quick Reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register |
| POST | `/api/auth/login` | None | Login |
| GET | `/api/auth/me` | User | Current user |
| POST | `/api/assessment` | User | Run assessment |
| GET | `/api/cases` | User/Admin | List cases |
| GET | `/api/cases/:id` | User/Admin | Case detail |
| GET | `/api/cases/:id/journey` | User/Admin | Get case journey timeline |
| POST | `/api/cases/:id/journey/:stepId/complete` | Admin | Mark step done, forward to next stakeholder |
| POST | `/api/cases/:id/journey/:stepId/assign` | Admin | Assign officer to step |
| GET | `/api/cases/admin/work-queue/:role` | Admin | Pending cases for a stakeholder role |
| PUT | `/api/cases/:id/status` | Admin | Update status |
| GET | `/api/cases/admin/stats` | Admin | Dashboard |

## Running the Server

```bash
# From the project root:
npm run backend
# or
node 4_backend/server.mjs
```

Runs on `http://localhost:3000` (or `PORT` env var).

## Adding New Endpoints

1. Create route in `routes/`
2. Use middleware: `requireAuth`, `requireAdmin`, validators
3. Put business logic in `services/`
4. Log the action with `logAudit()`
5. Update this README
