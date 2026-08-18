# Castle Security & Quality Gate — CI/CD Pipeline Integration Guide
**Document ID:** `GUIDE-GATE-CICD-2026-01`  
**Target Environments:** GitHub Actions, GitLab CI, Bitbucket Pipelines, Jenkins  

---

## 1. Pipeline Execution Flow

```text
+---------------------+
| git push / PR merge |
+----------+----------+
           |
           v
+---------------------+
| Automated Test Runs |
+----------+----------+
           |
           v
+---------------------+
| Telemetry Ingestion | (e.g. Lighthouse, OWASP, Test reports)
+----------+----------+
           |
           v
+-----------------------------------------------------------+
| Castle Gate Evaluation (CLI)                              |
| node castle-gate/cli/bin.js evaluate --level C2 ...       |
+-----------------------------+-----------------------------+
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
[Exit Code 0: PASSED]                    [Exit Code 1 / 2: BLOCKED / HELD]
       |                                             |
       v                                             v
• release-certificate.json emitted       • Pipeline halted immediately
• Audit trail saved to artifacts         • Remediation session opened
• Deployment step executes               • Notification sent to engineering
```

---

## 2. Integration Command Example

```bash
# In CI Step:
node castle-gate/cli/bin.js evaluate \
  --level C2 \
  --evidence ./.castle-evidence/raw-evidence.json \
  --output-dir ./dist-gate-artifacts \
  --project "Iglesia Cristiana Platform" \
  --commit "$GITHUB_SHA"

# Exit code propagates to CI runner:
# 0 -> Build Success
# 1 -> Build Failed (Veto)
# 2 -> Build Held (Remediation)
```
