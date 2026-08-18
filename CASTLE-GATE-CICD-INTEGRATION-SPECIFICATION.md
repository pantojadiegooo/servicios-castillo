# Castle Security & Quality Gate — CI/CD Integration Specification
**Document ID:** `SPEC-CICD-PHASE-10-2026-01`  
**Classification:** Universal Continuous Integration & Delivery Automation Standard  
**Supported Platforms:** GitHub Actions, GitLab CI/CD, Jenkins, Bitbucket Pipelines, Azure DevOps  

---

## 1. Official GitHub Action Specification (`action.yml`)

The official GitHub Action executes Castle Gate directly in the CI runner without downloading external Docker containers:

```yaml
name: 'Castle Security & Quality Gate'
description: 'Deterministic Multi-Domain Quality & Security Gate for Software Releases'
author: 'Grupo Castillo Engineering'
inputs:
  level:
    description: 'Target policy level to enforce (C1, C2, C3, C4, C5, C6)'
    required: true
    default: 'C2'
  directory:
    description: 'Path to source code directory to scan'
    required: false
    default: '.'
  output-dir:
    description: 'Path to directory for output artifacts'
    required: false
    default: '.castle'
  environment:
    description: 'Target deployment environment (production, staging, dev)'
    required: false
    default: 'production'
  fail-on-block:
    description: 'Halt workflow if Gate status is BLOCKED or REQUIRES_REMEDIATION'
    required: false
    default: 'true'

outputs:
  gate-decision:
    description: 'Decision outcome: PASSED, BLOCKED, or REQUIRES_REMEDIATION'
  cqs-score:
    description: 'Calculated CQS score (0.00 to 100.00)'
  certificate-path:
    description: 'Path to the generated release-certificate.json'

runs:
  using: 'node20'
  main: 'dist/index.js'
```

---

## 2. Drop-in Workflow Example (`.github/workflows/castle-gate.yml`)

```yaml
name: "Castle Gate Release Governance"

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  castle-gate-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Execute Castle Gate Scan & Gate Evaluation
        run: |
          npx @grupo-castillo/castle-gate scan \
            --dir . \
            --level C2 \
            --project "${{ github.repository }}" \
            --commit "${{ github.sha }}" \
            --env production

      - name: Archive Release Certificate & Audit Trail
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: castle-gate-artifacts
          path: .castle/
```

---

## 3. GitLab CI Template Example (`.gitlab-ci.yml`)

```yaml
stages:
  - governance
  - deploy

castle-gate-evaluation:
  stage: governance
  image: node:20-alpine
  script:
    - npx @grupo-castillo/castle-gate scan --dir . --level C2 --commit $CI_COMMIT_SHA --env production
  artifacts:
    when: always
    paths:
      - .castle/
```

---

## 4. Pipeline Execution Contract

1. **Deterministic Exit Codes Control Deployment:**
   - Exit Code `0` $\to$ Pipeline succeeds; CD proceeds to cloud deployment.
   - Exit Code `1` $\to$ Pipeline fails immediately with `BLOCKED: Gate Breaker Active`.
   - Exit Code `2` $\to$ Pipeline fails with `REQUIRES_REMEDIATION: Policy Threshold Deficit`.
2. **Zero Overhead:** Adds $< 5\text{ seconds}$ to the total CI build time (including npm cache initialization).
