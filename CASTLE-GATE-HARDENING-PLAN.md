# Castle Security & Quality Gate — Hardening Plan
**Document ID:** `PLAN-HARDENING-PHASE-11-2026-01`  
**Classification:** Pre-Pilot Engineering Hardening Specification  
**Focus:** Elimination of Real Edge-Case Failure Vectors & False Positives  

---

## 1. Concrete Hardening Measures Implemented / Required

```text
+----+---------------------------------------+-------------------------------------------------------+-----------------------+
| #  | ISSUE / EDGE CASE IDENTIFIED          | TECHNICAL REMEDIATION                                 | STATUS                |
+----+---------------------------------------+-------------------------------------------------------+-----------------------+
| 1  | Rescanning Artifacts in `.castle/`    | `.castle` added to `DEFAULT_IGNORED_DIRS` in base.    | [HARDENED & TESTED]   |
| 2  | Dual Audit Output Filenames           | Writes both `<id>.json` and canonical `audit-trail.json`| [HARDENED & TESTED]   |
| 3  | Missing Cert File Exit Code Ambiguity | `verify-cert` explicitly returns exit code 3 on 404.  | [HARDENED & TESTED]   |
| 4  | Cross-Platform Path Normalization     | Relative paths in findings normalized to POSIX `/`.   | [HARDENED & TESTED]   |
| 5  | Massive Repo Protection (10,000+ files)| Strict traversal limit of 5,000 files per scan.       | [HARDENED & TESTED]   |
| 6  | 5MB Heap Buffer Protection            | `safeReadFile()` returns null for files >5MB.         | [HARDENED & TESTED]   |
| 7  | Comments in JS Flagging Regex         | Pre-filter single-line & multi-line comments in probe.| [SCHEDULED V1.1]      |
+----+---------------------------------------+-------------------------------------------------------+-----------------------+
```

---

## 2. Path Normalization Hardening

To ensure deterministic SHA-256 digests across Windows and Linux build runners:
* All file paths stored inside `EvidencePackage` and `ReleaseCertificate` are normalized using `path.posix.relative()` or replacing `\\` with `/`.
* This prevents cross-OS digest mismatches where a certificate generated on Windows fails verification on a Linux CI/CD worker.

---

## 3. Memory & Resource Bounds

* **Max Memory Footprint:** $< 80\text{ MB}$ RSS across 1,000 files.
* **Scan Timeout Guard:** Orchestrator wraps probe execution with execution duration timers.
* **Stream Buffer Limits:** Max single file allocation capped at $5\text{ MB}$.
