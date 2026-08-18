# Castle Security & Quality Gate — Product Maturity Roadmap (D → E → F)
**Document ID:** `ROADMAP-MATURITY-2026-01`  
**Classification:** Strategic Engineering & Product Evolution Standard  
**Maturity Progression:** `D. PRODUCTIZABLE TECHNOLOGY` $\longrightarrow$ `E. COMMERCIAL PRODUCT` $\longrightarrow$ `F. COMMERCIAL PLATFORM`  

---

## 1. The 12 Dimensions of Product Maturity

To transition safely from internal code to a commercial product, Castle Gate is evaluated across 12 rigorous software engineering dimensions:

```text
+----+-----------------------------+-----------------------------------+-----------------------------------+-----------------------------------+
| #  | DIMENSIÓN                   | NIVEL D: TECNOLOGÍA PRODUCTIZABLE | NIVEL E: PRODUCTO COMERCIAL       | NIVEL F: PLATAFORMA COMERCIAL     |
+----+-----------------------------+-----------------------------------+-----------------------------------+-----------------------------------+
| 1  | Funcionalidad               | CLI scan/evaluate local autónomo  | CLI + Probes + Reporte HTML rico  | CLI + Probes + Cloud API + RUM    |
| 2  | Seguridad                   | Inmutabilidad y defensa in-memory | Hashes SHA-256 + Input fuzzing    | Firma Asimétrica PKI (Ed25519)    |
| 3  | Confiabilidad               | 155 tests passing / 45 ataques    | 99.99% ejecución determinista     | SLA de API 99.95% en cloud        |
| 4  | Portabilidad                | Node.js >= 18 en Win/Linux/macOS  | Cero dependencias nativas (C++)   | Binarios compilados (Node SEA)    |
| 5  | Mantenibilidad              | Arquitectura modular (cqs/freeze) | Tipado TypeScript / JSDoc estricto| Arquitectura de plugins versionada|
| 6  | Experiencia de Instalación  | `npm install` local desde repo    | `npx @grupo-castillo/castle-gate` | Homebrew / Scoop / Docker / NPM   |
| 7  | Experiencia CI/CD           | Script shell manual en YAML       | GitHub Action oficial drop-in     | GitHub App / GitLab Bot interactivo|
| 8  | Trazabilidad                | Audit trail y JSON local          | Certificado JSON con provenance   | Ledger inmutable y Badges públicos|
| 9  | Privacidad                  | 100% local, cero llamadas de red  | Cero telemetría de código fuente  | Certificación SOC 2 / ISO 27001   |
| 10 | Soporte y Documentación     | Documentos Markdown internos      | Portal de docs y guía de inicio   | Documentación interactiva y SLA 24/7|
| 11 | Versionado                  | SemVer estricto (`1.0.0`)         | Política de deprecación formal    | Versionado coordinado Core + API  |
| 12 | Backward Compatibility      | Invarianza estricta CQS v1.1      | Certificados v1.0 siempre válidos | Políticas versionadas retrocompatibles|
+----+-----------------------------+-----------------------------------+-----------------------------------+-----------------------------------+
```

---

## 2. Gate Criteria to Pass from Level D to Level E (`COMMERCIAL PRODUCT`)

To achieve **Level E (Commercial Product)**, Castle Gate must satisfy all the following criteria:

1. **Zero-Install Invocation:** A developer can execute `npx @grupo-castillo/castle-gate scan --level C1` on a clean machine in $< 3\text{ seconds}$.
2. **Official GitHub Action Published:** An official action (`grupo-castillo/castle-gate-action@v1`) operates in public/private repositories with zero build friction.
3. **Beautiful Standalone HTML Compliance Report:** The scan produces an interactive `compliance-report.html` that developers can open directly in any browser to review failures and remediation instructions offline.
4. **100% Air-Gapped Test Suite:** Automated CI tests verify that Castle Gate functions with network interfaces completely disabled (`socket.block()`).
5. **Zero Breaking Changes to CQS:** All 65 controls and 7 domains remain mathematically identical.

---

## 3. Future Horizon: Level F (`COMMERCIAL PLATFORM`)

Level F represents the commercial SaaS platform, introducing:
* Multi-tenant organization dashboard (`app.grupocastillo.com`).
* Asymmetric digital signing of release certificates via Cloud KMS.
* Public verification badges (`verify.grupocastillo.com/cert/:id`).
* Centralized policy compliance tracking across multiple repositories.
