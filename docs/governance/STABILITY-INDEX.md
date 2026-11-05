# Stability Index — QIROX Platform

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Overview

The Stability Index scores every module from **0 to 100**.
A higher score means the module is more stable, better understood, and lower risk.
Scores guide migration prioritisation: low-scoring modules are high-risk and should
be migrated sooner. Scores are reviewed at every governance cycle.

---

## Scoring Dimensions

Total: **100 points** across 6 dimensions.

---

### Dimension 1 — Test Coverage (0–20 points)

Measures whether the module's behaviour is protected by automated tests.

| Score | Criteria |
|---|---|
| 20 | >80% coverage; unit + integration tests exist; CI enforced |
| 15 | 50–80% coverage; most critical paths covered |
| 10 | 20–50% coverage; happy-path tests only |
| 5 | <20% coverage; sparse or ad-hoc tests |
| 0 | No tests whatsoever |

---

### Dimension 2 — Technical Debt (0–20 points)

Measures the burden of open TECH-IDs and known workarounds.

| Score | Criteria |
|---|---|
| 20 | Zero open TECH-IDs; no known workarounds |
| 15 | 1–2 low-risk TECH-IDs; all tracked |
| 10 | 3–4 TECH-IDs; at least one medium-risk |
| 5 | 5+ TECH-IDs or at least one high-risk item |
| 0 | Untracked debt; unknown scope of workarounds |

---

### Dimension 3 — Complexity (0–15 points)

Measures structural complexity and cognitive load.

| Score | Criteria |
|---|---|
| 15 | Layered domain module; <200 LOC per file; clear boundaries |
| 10 | Partially extracted; mixed concerns; some large functions |
| 5 | Monolithic file; >500 LOC; multiple concerns in one place |
| 2 | Monolithic file; >1000 LOC; unclear boundaries |
| 0 | Unstructured; no discernible architecture |

---

### Dimension 4 — Production Incidents (0–15 points)

Measures the module's production reliability track record.

| Score | Criteria |
|---|---|
| 15 | Zero known production incidents |
| 10 | 1–2 minor incidents; resolved quickly; no data loss |
| 5 | 3–5 incidents; at least one required rollback |
| 2 | Frequent incidents; on-going instability |
| 0 | Caused a major outage or data loss event |

_Note: Incident history for this platform is not yet formally tracked.
All modules default to 15 (no incidents recorded) until an incident register is established._

---

### Dimension 5 — Documentation Completeness (0–15 points)

Measures the quality and completeness of documentation.

| Score | Criteria |
|---|---|
| 15 | Full domain README; ADR(s) covering key decisions; inline JSDoc on all public functions |
| 10 | README exists; ADR exists; partial JSDoc |
| 5 | README exists; no ADR; minimal comments |
| 2 | Partial README or comments only |
| 0 | No documentation of any kind |

---

### Dimension 6 — Architecture Compliance (0–15 points)

Measures adherence to ADR-001 (layered domain architecture) and ADR-002 (zero downtime rules).

| Score | Criteria |
|---|---|
| 15 | Fully compliant: layered domain; no dynamic imports; no cross-domain direct imports; typed mappers |
| 10 | Mostly compliant: domain structure exists; 1–2 known violations tracked as TECH-IDs |
| 5 | Partially compliant: in migration; legacy code active alongside domain |
| 2 | Non-compliant: monolithic; no domain structure; violations not tracked |
| 0 | Actively violates architecture rules; introduces regression risk |

---

## Score Bands

| Score | Band | Interpretation |
|---|---|---|
| 85–100 | 🟢 **Green** | Production-hardened; low priority for migration |
| 65–84 | 🟡 **Yellow** | Stable but improvable; schedule in next cycle |
| 45–64 | 🟠 **Amber** | Notable risk; plan migration within 2–3 releases |
| 25–44 | 🔴 **Red** | High risk; prioritise for next migration |
| 0–24 | ⛔ **Critical** | Immediate action required |

---

## Current Scores

Scored as of Enterprise Governance migration. Reassess after each migration.

| Module | Tests | Debt | Complexity | Incidents | Docs | Compliance | **Total** | Band |
|---|---|---|---|---|---|---|---|---|
| connection-manager | 0 | 20 | 15 | 15 | 10 | 10 | **70** | 🟡 Yellow |
| cron | 0 | 20 | 10 | 15 | 5 | 12 | **62** | 🟡 Yellow |
| ai | 0 | 20 | 12 | 15 | 5 | 8 | **60** | 🟡 Yellow |
| models | 0 | 20 | 10 | 15 | 5 | 10 | **60** | 🟡 Yellow |
| auth | 0 | 18 | 8 | 15 | 4 | 10 | **55** | 🟠 Amber |
| payments | 0 | 20 | 12 | 15 | 5 | 3 | **55** | 🟠 Amber |
| deployment-cloud | 0 | 20 | 12 | 15 | 5 | 3 | **55** | 🟠 Amber |
| notifications | 0 | 20 | 12 | 15 | 4 | 7 | **58** | 🟡 Yellow |
| qmeet | 0 | 15 | 10 | 15 | 4 | 8 | **52** | 🟠 Amber |
| email-marketing | 0 | 20 | 8 | 15 | 4 | 3 | **50** | 🟠 Amber |
| crm domain | 0 | 15 | 12 | 15 | 10 | ****| **48** | 🟠 Amber |
| mail domain | 0 | 15 | 12 | 15 | 8 | 10 | **45** | 🟠 Amber |
| email domain | 0 | 10 | 10 | 15 | 12 | 10 | **42** | 🔴 Red |
| routes | 0 | 15 | 2 | 15 | 2 | 3 | **28** | 🔴 Red |
| sandbox | 0 | 20 | 5 | 15 | 2 | 3 | **35** | 🔴 Red |

> **Observation:** The universal 0 on Test Coverage (Dimension 1) suppresses every module's
> score by 20 points. Introducing a test suite (TECH-006) would be the single highest-impact
> improvement to platform stability — raising all scores by up to 20 points immediately.

---

## Recalculation Schedule

- After every migration: recalculate affected module(s).
- At governance review cycle: recalculate all modules.
- When a TECH-ID is closed: update Debt dimension for affected module.
- When a README or ADR is added: update Documentation dimension.

---

## Score Change Log

| Date | Module | Old Score | New Score | Reason |
|---|---|---|---|---|
| Enterprise Gov. migration | All | — | (baseline above) | Initial scoring |
