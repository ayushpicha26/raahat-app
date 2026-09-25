# BRAIN.md — RAAHAT Stakeholder Information Mapping

This document defines WHAT each stakeholder sees and receives from the system,
ensuring role-based data access. Nobody sees everything — each gets only what they
need for their specific function.

---

## 👥 Stakeholder Groups & Their Assigned Information

### 1. VICTIM / COMPLAINANT
**What they get:**
- Their own case transcript, SVI score, priority, problem types
- Assigned counsellor name & contact (if High/Critical)
- Recommendations tailored to their case
- Three-second case brief (summary of incident + safety flags)
- Follow-up scheduling status
- Language-matched resources
- Consent controls (can opt-out of AI analysis)

**What they DON'T get:**
- Other victims' cases
- Full SVI breakdown (just their own score)
- District-level analytics
- Police/medical internal notes

**Data Access:** `GET /api/cases/:id` (own cases only via auth)

---

### 2. COUNSELLOR
**What they get:**
- Assigned cases (cases assigned to them via admin)
- Case SVI, priority, summary
- Problem types & indicators list
- Transcript excerpt (sanitized — no repeated trauma narration)
- Risk flags (suicidal ideation, intimidation, boycott, etc.)
- Case status & last updated
- Scheduled follow-up dates
- Available messaging/communication tools with victim

**What they DON'T get:**
- Cases assigned to other counsellors
- District-level aggregate data
- Victim personal details beyond what's in their case
- Admin dashboard metrics

**Data Access:** `GET /api/cases?assigned_to_counsellor=true` (filtered view)

---

### 3. DISTRICT ADMINISTRATOR
**What they get:**
- All cases in their district (filtered by `district` in user profile)
- Aggregate SVI trends for district
- Count of Critical/High/Moderate/Low cases
- Resource utilization (counsellors assigned vs cases)
- Follow-up completion rates
- Pending safety alerts
- FIR registration status tracking

**What they DON'T get:**
- Individual victim identities without proper authorization
- Cases from other districts (unless viewing aggregate)
- Counsellor personal notes or assessments

**Data Access:** `GET /api/admin/stats?district={districtId}` (role-based)

---

### 4. STATE GOVERNMENT / UT
**What they get:**
- State-level aggregates (total cases, avg SVI)
- District comparison charts
- Scheme utilization metrics
- Critical case hotspots
- Resource gap analysis (counsellors vs cases ratio)
- Monthly/quarterly reports
- Compliance tracking with PoA Act timelines

**What they DON'T get:**
- Individual case details
- Victim-identifiable information
- Counsellor operational notes

**Data Access:** `GET /api/admin/stats?scope=state` (requires super-admin)

---

### 5. LAW ENFORCEMENT / POLICE
**What they get:**
- Cases flagged for police intervention (Critical + intimidation/witness risk)
- FIR status for cases in their jurisdiction
- Witness protection alerts
- Fast-track FIR filing assistance
- Coordination with district admin on safety reviews

**What they DON'T get:**
- Full psychological assessment details
- Victim counselling progress notes
- Medical forensic details (unless shared via approved channel)

**Data Access:** `GET /api/cases?priority=Critical&flagged_for_police=true`

---

### 6. REHABILITATION / WELFARE AUTHORITIES
**What they get:**
- Cases needing shelter/relocation (High/Critical + displacement)
- Social boycott + livelihood loss referrals
- Long-term welfare scheme recommendations
- Rehabilitation progress tracking
- District social-welfare resource availability

**What they DON'T get:**
- Psychological assessment details
- Legal case proceedings
- Individual victim narratives beyond case summary

**Data Access:** `GET /api/cases?needs=rehabilitation|shelter|welfare`

---

### 7. NHAA (14566) ADMINISTRATION
**What they get:**
- National-level dashboard
- All-state case counts
- Critical alert system
- Helpline performance metrics
- Integration health checks
- Policy compliance overview

**What they DON'T get:**
- Individual victim data without proper case ownership
- Counsellor-patient confidentiality details
- District-specific operational data (unless admin)

**Data Access:** `GET /api/admin/national-dashboard` (highest role)

---

### 8. DEPARTMENT OF SOCIAL JUSTICE & EMPOWERMENT (DoSJE)
**Who they are (per the SC/ST PoA Act, 1989 & Rules, 1995):**
- **Central body:** Department of Social Justice & Empowerment, Ministry of Social Justice & Empowerment, GoI
- **District representative:** **District Social Welfare Officer (DSWO)** — serves as **Member Secretary** of the District Level Vigilance & Monitoring Committee (DLVMC) under Rule 17
- **State representative:** Secretary-level Nodal Officer coordinating with the State Level V&MC

**Real-world workflow they own:**
1. Run the **Centrally Sponsored Scheme (CSS)** for implementation of the SC/ST (PoA) Act — released ₹495.29 crore in 2024–25 to 99,965 victims
2. Sanction and disburse **monetary relief** under Section 21(2)(iii) + Rule 12(4) — minimum ₹85,000 to ₹8.25 lakh (proposed 2024 revision: ₹1 lakh to ₹12 lakh)
3. Coordinate with **Exclusive Special Courts** and Special Public Prosecutors for trial within 60 days of chargesheet
4. **Quarterly DLVMC meetings** to review case implementation, relief, prosecution
5. Track **FIR within 24 hours** compliance (Rule 7) and **chargesheet within 60 days** compliance
6. Coordinate with NALSA on legal aid (signed MoU July 2025)
7. Run awareness campaigns and the **National Helpline against Atrocities**

**What they get from RAAHAT:**
- All atrocity-flagged cases in their jurisdiction (district / state / national based on role)
- **Relief disbursement status** per case — flag if relief not paid within 7 days (Rule 12(4))
- **FIR registration status** + **24-hour spot-visit compliance** by District Magistrate & SP
- **Chargesheet filing status** — flag if pending beyond 60 days
- **Trial status** — flag if not completed within 60 days of chargesheet (Section 14)
- **DLVMC quarterly review pack** — auto-generated case summary for meetings
- Aggregate PoA Act compliance metrics (district/state/national)
- Relief amount recommendations per case (based on offence type, as per Annexure-I)
- Coordination alerts — link cases to legal aid, NALSA, Special Courts
- District-wise atrocity hotspot maps (overlaid on existing Geo Analysis)
- Scheme utilization metrics (CSS funds released vs. disbursed vs. beneficiaries)

**What they DON'T get:**
- Full psychological assessment details (SVI breakdown, transcript) — only summary
- Counsellor-patient session notes
- Medical/forensic details beyond case-level flags
- Cases NOT flagged as atrocity (poverty, general welfare, OBC matters) — those go elsewhere

**Data Access:**
- `GET /api/admin/dosje/cases?jurisdiction=district&flags=atrocity`
- `GET /api/admin/dosje/relief-status`
- `GET /api/admin/dosje/fir-compliance`
- `GET /api/admin/dosje/chargesheet-compliance`
- `GET /api/admin/dosje/dlvmc-pack` (auto-generated quarterly review)
- `GET /api/admin/dosje/scheme-utilization`

---

## 🔐 Access Control Matrix

| Data Category | Victim | Counsellor | District Admin | State Gov | Police | Welfare | DoSJE | NHAA Admin |
|---------------|--------|------------|----------------|-----------|--------|---------|-------|------------|
| Own case data | ✅ | ✅ (if assigned) | ✅ (district) | ❌ | ❌ | ❌ | ✅ (atrocity flagged) | ❌ |
| District aggregate | ❌ | ❌ | ✅ | ✅ | ⚠️ (filtered) | ⚠️ (filtered) | ✅ (atrocity) | ✅ |
| State-level metrics | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Critical alerts | ❌ | ✅ (assigned) | ✅ | ✅ | ✅ | ⚠️ | ✅ (atrocity) | ✅ |
| Full transcript | ❌ (limited) | ✅ (own cases) | ❌ | ❌ | ❌ | ❌ | ❌ (summary only) | ❌ |
| Scheme recommendations | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (PoA relief) | ✅ |
| SVI score breakdown | ✅ (own) | ✅ (own cases) | ⚠️ (aggregates) | ⚠️ (trends) | ❌ | ❌ | ⚠️ (severity flag only) | ✅ |
| FIR compliance status | ❌ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Relief disbursement status | ✅ (own) | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ✅ (full) | ✅ |
| Chargesheet / trial status | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ (60-day compliance) | ✅ |
| DLVMC review pack | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (quarterly) | ✅ |
| Atrocity hotspot map | ❌ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |

---

## 📊 Information Flow Logic

```
VICTIM submits narrative
        ↓
NLP ENGINE computes SVI + flags (incl. atrocity indicator)
        ↓
AUTO-ROUTE based on risk:
  - Critical/High → Auto-assign to counsellor (or user chooses from list)
  - Moderate/Low → Info + optional follow-up
        ↓
District admin sees alert (Critical only)
        ↓
Police see flag if intimidation/witness risk
        ↓
Welfare see referral if displacement/boycott
        ↓
DoSJE (via DSWO) sees case if atrocity-flagged →
   - Tracks FIR within 24 hrs, chargesheet within 60 days
   - Disburses PoA relief within 7 days
   - Pulls quarterly DLVMC review pack
        ↓
State dashboard tracks metrics
        ↓
NHAA admin sees national overview
```

---

## 🎯 Core Principle

**LEAST PRIVILEGE ACCESS:**
- Each stakeholder sees ONLY what they need for their function
- No stakeholder sees raw victim narratives except their direct counterpart
- All data flows through role-based access gates
- Audit trail records every data access event