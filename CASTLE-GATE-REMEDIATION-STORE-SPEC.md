# Castle Security & Quality Gate — Remediation Store Specification
**Document ID:** `SPEC-GATE-REM-STORE-2026-01`  
**Module:** `castle-gate/remediation/remediation-store.js`  
**Storage Model:** JSON Ledger (Append-Only Lifecycle History)  

---

## 1. Storage Architecture

The Remediation Store persists active and closed remediation sessions to filesystem ledgers.

```text
.castle-remediation/
├── REM-SESS-PRJ-001.json
├── REM-SESS-PRJ-002.json
└── ...
```

---

## 2. Ledger Record Schema

```json
{
  "store_schema_version": "1.0.0",
  "last_synced_at": "2026-08-13T18:45:00.000Z",
  "session": {
    "session_id": "REM-SESS-1770938400000",
    "target_system": { "name": "iglesia_cristiana", "environment": "staging" },
    "gate_level": "C2",
    "created_at": "2026-08-13T18:00:00.000Z",
    "total_cycles": 2,
    "is_closed": true,
    "cycles": [
      {
        "cycle_number": 1,
        "recorded_at": "2026-08-13T18:00:00.000Z",
        "evaluation_id": "EVAL-001",
        "cqs_score": 72.00,
        "gate_state": "REQUIRES_REMEDIATION",
        "blockers": [{ "type": "SCORE_DEFICIT", "details": "Score below 78.0" }],
        "remediation_notes": "Identified missing security headers and image optimization deficit.",
        "resolved_blockers": []
      },
      {
        "cycle_number": 2,
        "recorded_at": "2026-08-13T18:45:00.000Z",
        "evaluation_id": "EVAL-002",
        "cqs_score": 85.50,
        "gate_state": "PASSED",
        "blockers": [],
        "remediation_notes": "Implemented WebP image conversion and CSP headers.",
        "resolved_blockers": ["SCORE_DEFICIT"]
      }
    ]
  }
}
```

---

## 3. SLA Expiration Monitoring

The method `checkExpiration(session, windowHours)` computes elapsed time against policy window:
$$\text{Deadline} = \text{created\_at} + \text{windowHours}$$
If $\text{now} > \text{Deadline}$ and `session.is_closed === false`, the store reports `expired: true`, triggering automated CI/CD pipeline blocking.
