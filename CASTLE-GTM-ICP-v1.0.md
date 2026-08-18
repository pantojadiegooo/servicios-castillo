# Castle GTM — Ideal Customer Profile (ICP) Specification (v1.0.0)
**Document ID:** `GTM-ICP-v1.0.0`  
**Classification:** Grupo Castillo Commercial Go-To-Market Blueprint  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Core Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Matriz de Segmentación de Clientes Ideales (ICP)

```text
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| PERFIL DE CLIENTE     | DOLOR PRINCIPAL       | TRIGGER DE COMPRA     | BUYERS (TECH / ECON)  | SERVICIO & NIVEL GATE | RECURRENCIA POTENCIAL |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **1. Startup**        | Temor a fugas de      | Pre-lanzamiento de MVP| Tech: CTO / Founder   | Entrada: Checkup      | Media: Transición     |
| **Temprana**          | claves y mala calidad | o ronda seed/pre-seed.| Econ: CEO / Founder   | Gate: Nivel C1        | hacia Gate C1 + Care  |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **2. Agencia**        | Riesgo de entregar web| Entrega formal a      | Tech: Líder Técnico   | Entrada: Checkup      | Alta: Checkup recurr. |
| **Digital**           | con bugs a clientes.  | cliente exigente.     | Econ: Director Agencia| Gate: Nivel C1 / C2   | por cada proyecto web |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **3. Software**       | Clientes reclaman por | SLA de entrega o      | Tech: VP Engineering  | Entrada: Checkup/Audit| Muy Alta: Gate en CI  |
| **Factory**           | falta de estándares.  | renovación de contrato| Econ: Director Ops    | Gate: Nivel C2 / C3   | + Suscripción Care Pro|
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **4. SaaS**           | Deuda técnica frena el| Crecimiento acelerado | Tech: Head of Dev / VP| Entrada: Audit / Gate | Alta: Licencia anual  |
| **B2B**               | roadmap de producto.  | o quejas de usuarios. | Econ: CTO / CFO       | Gate: Nivel C2 / C3   | + Castle Care         |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **5. Empresa con Dev**| Falta de visibilidad  | Auditoría interna o   | Tech: Gerente TI / Dev| Entrada: Checkup      | Media-Alta: Gate C2   |
| **Interno Tradicional**| sobre buenas prácticas| migración a la nube.  | Econ: CIO / Director TI| Gate: Nivel C2       | corporativo           |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **6. Organización**   | Dispersión de calidad | Estandarización de    | Tech: Lead Architect  | Entrada: Audit        | Muy Alta: Licencia    |
| **Multi-Repositorio** | entre microservicios. | ingeniería corporativa| Econ: VP Engineering  | Gate: Nivel C3 / C4   | Multi-Repo + Care Ent.|
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **7. Proveedor que**  | Necesidad de probar   | Exigencia de garantía | Tech: QA Lead / PM    | Entrada: Checkup      | Alta: Emisión de      |
| **Entrega a Terceros**| higiene ante cliente. | de calidad en contrato| Econ: Gerente Comercial| Gate: Nivel C2       | Release Certificates  |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
```

---

## 2. A Quién NO Vender (Disqualification Criteria / "Who NOT to Sell To")

Para maximizar la eficiencia comercial y proteger la reputación de Grupo Castillo, **se descalifican prospectos que presenten los siguientes perfiles:**

1. **Buscadores de Certificación Regulatoria Formal:** Clientes que exigen un reporte legal de SOC 2 Tipo II, ISO 27001 formal o certificación PCI-DSS emitida por un QSA. *(Castle Gate emite certificados internos de decisión de release, no certificaciones regulatorias externas)*.
2. **Requerimientos Exclusivos de Pentesting Dinámico en Vivo (DAST):** Clientes que buscan un equipo de hackers éticos atacando servidores en producción.
3. **Proyectos sin Base Web / JavaScript / TypeScript:** Repositorios exclusivamente en lenguajes embebidos C/C++ o ensamblador no soportados actualmente por los Native Probes.
4. **Clientes que Buscan Bypasses de Seguridad:** Empresas que piden "cómo saltarse el Gate Breaker para desplegar rápido a producción". *(Política Anti-Bypass estricta)*.
