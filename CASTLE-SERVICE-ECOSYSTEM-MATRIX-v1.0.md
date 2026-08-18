# Castle Ecosystem — Master Service Boundaries Matrix (v1.0.0)
**Document ID:** `ECOSYSTEM-MATRIX-v1.0.0`  
**Classification:** Grupo Castillo Ecosystem Architecture & Service Taxonomy  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Core Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Matriz Canónica del Ecosistema de Servicios Grupo Castillo

```text
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| SERVICIO          | PREGUNTA CENTRAL                  | TRIGGER DE COMPRA     | ENTRADA PRINCIPAL     | TRABAJO REALIZADO     | SALIDA PRINCIPAL      | SIGUIENTE PASO NATURAL|
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **Castle**        | *"¿Cuál es el estado técnico      | Duda sobre calidad,   | Repositorio de código | Escaneo estático CQS  | Checkup Report +      | ──> Castle Gate (C1)  |
| **Checkup**       | actual de mi código y riesgos?"*  | pre-lanzamiento o MVP.| fuente (Node.js/Web). | + revisión experta.   | Gate Readiness.       |     o Castle Rescue   |
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **Castle**        | *"¿Cómo automatizo la decisión    | Necesidad de gobernar | Repositorio integrado | Evaluación estática   | Release Certificate   | ──> Castle Care       |
| **Gate**          | de release en mi CI/CD?"*         | releases continuos.   | en GitHub / GitLab.   | determinista C1→C6.   | sellado con SHA-256.  |     (Supervisión)     |
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **Castle**        | *"Necesito una auditoría técnica  | Due Diligence M&A,    | Código fuente +       | Auditoría profunda    | Comprehensive Audit   | ──> Castle Rescue     |
| **Audit**         | y arquitectónica exhaustiva."*    | lanzamiento crítico.  | diagramas de sistema. | multicapa (1-2 sem).  | Report + Backlog Arq. |     o Gate C3/C4      |
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **Castle**        | *"Mi release está bloqueado y     | Exit Code 1 / 2 en CI,| Reporte de bloqueo    | Refactorización e     | Pull Requests limpios | ──> Re-Scan Gate (0)  |
| **Rescue**        | necesito ayuda para resolverlo."* | o hallazgos graves.   | o Checkup Report.     | ingeniería directa.   | + Gate PASSED.        |     ──> Castle Care   |
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **Castle**        | *"Tengo un incidente crítico y    | Fuga activa de claves | Repositorio con fuga  | Purga de secretos y   | Hotfix PR + Post-     | ──> Castle Care       |
| **Emergency**     | requiero intervención inmediata."*| o release bloqueado.  | o pipeline roto.      | contención (<4h).     | Mortem + Gate PASS.   |     (Prevención)      |
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **Castle**        | *"Quiero supervisión continua y   | Retención de calidad, | Repositorios bajo     | Auditorías periódicas,| Monthly Governance    | ──> Upgrade de Gate   |
| **Care**          | acompañamiento mensual experto."* | gobernanza mensual.   | gobernanza de Gate.   | reuniones y soporte.  | Digest + Acompañamient|     (C1 $\to$ C2/C3)  |
+-------------------+-----------------------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
```
