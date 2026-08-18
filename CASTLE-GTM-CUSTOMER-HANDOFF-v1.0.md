# Castle GTM — Customer Handoff & Artifact Traceability (v1.0.0)
**Document ID:** `GTM-HANDOFF-v1.0.0`  
**Classification:** Grupo Castillo Delivery Governance & Artifact Archive  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Protocolo Formal de Entrega de Artefactos (Handoff Matrix)

```text
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| ARTEFACTO             | FORMATO               | RESPONSABLE   | REVISOR INTERNO       | MEDIO DE ENTREGA      | REPOSITORIO DE ARCHIVO|
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| **Checkup Report**    | PDF + Markdown        | Consultor     | Lead Architect        | Email Seguro / Sesión | Archivo de Clientes   |
|                       |                       | Asignado      | Grupo Castillo        | Virtual de Entrega    | Grupo Castillo        |
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| **Audit Report**      | PDF Exhaustivo + Deck | Panel Auditor | Director de Consultoría| Presentación Formal  | Bóveda Confidencial   |
|                       | (30-40 páginas)       | Senior        | Grupo Castillo        | Ejecutiva (2 horas)   | de Auditorías         |
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| **Compliance HTML**   | HTML Autónomo         | Software      | Consultor             | Directorio `.castle/` | Copia en paquete      |
|                       | Offline Interactivo   | Engine (CLI)  | Técnico               | local del cliente     | de evidencias cliente |
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| **Release Cert.**     | JSON sellado con      | Release       | Motor CQS v1.1        | Archivo `.castle/`    | Registro Digest       |
|                       | SHA-256 Digest        | Authorizer    | (Evaluación)          | en repo del cliente   | SHA-256 de Releases   |
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| **Pilot Closure**     | Acta Formal Firmada   | Gerencia      | CTO / Lead Dev        | Firma Digital         | Expediente Histórico  |
| **Report**            | en PDF                | Grupo Castillo| del Cliente           | de Cierre de Proyecto | de Pilotos            |
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
| **Monthly Care**      | PDF Sintético         | Customer      | Lead Architect        | Canal Compartido      | Registro Mensual      |
| **Digest**            | (3 páginas)           | Success Lead  | Asignado              | (Slack / Teams / Mail)| de Gobernanza         |
+-----------------------+-----------------------+---------------+-----------------------+-----------------------+-----------------------+
```
