# Castle Security & Quality Gate — Release Authorization Specification
**Document ID:** `SPEC-GATE-REL-AUTH-2026-01`  
**Artifact Emitted:** `release-certificate.json`  
**Schema Version:** `1.0.0-ratified`  

---

## 1. Release Authorization Rules

1. **Authorization Exclusivity:** A Release Certificate is generated **only** when `gate_decision.gate_state === 'PASSED'`.
2. **Zero-Tolerance for Gate Breakers:** If any Gate Breaker (`GB-01` to `GB-05`) is triggered, no certificate can be generated.
3. **Cryptographic Integrity:** The certificate contains a SHA-256 canonical digest over all evaluation and governance metadata.
4. **Independent Verifiability:** Any downstream pipeline step can verify certificate validity without re-running the full evaluation using `verifyReleaseCertificate()`.

---

## 2. Release Certificate Structure

```json
{
  "schema_version": "1.0.0-ratified",
  "certificate_id": "REL-CERT-C2-1770938400000",
  "authorization_status": "AUTHORIZED_FOR_RELEASE",
  "issued_at": "2026-08-13T18:45:00.000Z",
  "target_system": {
    "name": "iglesia_cristiana_platform",
    "environment": "production",
    "commit_sha": "a1b2c3d4e5f6..."
  },
  "governance": {
    "cqs_specification_version": "1.1.0-candidate",
    "gate_policy_version": "1.0.0-ratified",
    "gate_level": "C2",
    "gate_level_name": "STANDARD",
    "authority_class": "AUTH_CLASS_2_MULTI_DISCIPLINE"
  },
  "evaluation_reference": {
    "evaluation_id": "CQS-EVAL-1770938400000",
    "gate_decision_id": "GATE-DEC-C2-1770938400000",
    "audit_trail_reference": "AUD-GATE-1770938400000",
    "evidence_package_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "metrics_summary": {
    "cqs_raw_score": 88.50,
    "cqs_display_score": 88.50,
    "final_verdict": "PASS_RELEASE",
    "gate_breakers_status": "CLEARED"
  },
  "post_verification_obligation": {
    "required": false,
    "verification_window_hours": 48,
    "status": "NOT_REQUIRED"
  },
  "integrity": {
    "digest_algorithm": "SHA-256",
    "certificate_digest": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "signature_mode": "GOVERNANCE_DIGEST_VERIFIED",
    "signing_authority": "Grupo Castillo Release Gate Authority"
  }
}
```
