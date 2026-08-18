# Castle Security & Quality Gate — Distribution & Packaging Specification
**Document ID:** `SPEC-DIST-PHASE-10-2026-01`  
**Package Scope:** `@grupo-castillo/castle-gate`  
**Distribution Channel:** NPM Public Registry / Private Enterprise Registry  
**Runtime Requirement:** Node.js `>= 18.0.0` (Zero External Runtime Dependencies)  

---

## 1. Package Identity & Directory Layout

```text
@grupo-castillo/castle-gate/
├── bin/
│   └── castle-gate.js             # Executable CLI entrypoint (#!/usr/bin/env node)
├── castle-gate/
│   ├── analyzers/                 # Castle Native Probes (Security, DOM, Maintainability)
│   ├── engine/                    # Gate Decision Engine, Authorizer, Verifier
│   ├── policy/                    # Ratified C1..C6 Policy Matrix & Validator
│   ├── remediation/               # Remediation Store & Session Tracker
│   └── index.js                   # Unified Programmatic JavaScript API
├── cqs/                           # CQS v1.1 Frozen Mathematical Core (Byte-Identical)
│   ├── engine/
│   ├── evidence/
│   ├── governance/
│   ├── registry/
│   ├── scoring/
│   └── specification/
├── package.json                   # Zero-dependency manifest
├── README.md                      # Comprehensive user & developer documentation
└── LICENSE                        # Grupo Castillo Commercial / Community License
```

---

## 2. Canonical `package.json` Specification

```json
{
  "name": "@grupo-castillo/castle-gate",
  "version": "1.0.0",
  "description": "Deterministic Multi-Domain Quality & Security Gate Engine for Software Releases",
  "main": "castle-gate/index.js",
  "bin": {
    "castle-gate": "bin/castle-gate.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "bin/",
    "castle-gate/",
    "cqs/",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "quality-gate",
    "release-management",
    "cqs",
    "security-gate",
    "devsecops",
    "compliance",
    "grupo-castillo"
  ],
  "author": "Grupo Castillo Engineering <engineering@grupocastillo.com>",
  "license": "SEE LICENSE IN LICENSE",
  "dependencies": {},
  "devDependencies": {}
}
```

---

## 3. Package Characteristics & Guarantees

1. **Zero External Runtime Dependencies (`dependencies: {}`):**
   - Eliminates supply chain attack vectors (no rogue npm dependency hijacking).
   - Guarantees $100\%$ offline, air-gapped functionality.
2. **Ultra-Lightweight Footprint:**
   - Unpacked size: **$\approx 180\text{ KB}$**
   - Tarball / npm download size: **$\approx 45\text{ KB}$**
   - Installs in $< 1\text{ second}$ on CI runners.
3. **Execution Speed:**
   - Cold CLI startup to gate decision: **$< 30\text{ ms}$**.
