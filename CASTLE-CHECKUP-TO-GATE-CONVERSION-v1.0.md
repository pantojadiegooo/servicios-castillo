# Castle Checkup — Conversion Model to Castle Gate C1→C6 (v1.0.0)
**Document ID:** `CONVERSION-CHECKUP-TO-GATE-v1.0.0`  
**Classification:** Strategic Customer Journey & Gate Progression Blueprint  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. El Embudo de Conversión Natural

Castle Checkup actúa como la puerta de entrada que permite al cliente experimentar el valor de la medición CQS v1.1 sin la fricción inicial de bloquear sus releases, guiándolo orgánicamente hacia la gobernanza permanente con **Castle Gate**:

```text
CASTLE CHECKUP (Diagnóstico Inicial / Visibilidad)
       │
       ▼
PLAN DE REMEDIACIÓN (Corrección de Quick Wins y Gate Breakers)
       │
       ▼
ADOPCIÓN DE CASTLE GATE EN CI/CD
       │
       ├──> Madurez Inicial / Startups      ──> Nivel C1 (Foundation)
       │
       ├──> Aplicaciones Comerciales / APIs ──> Nivel C2 (Standard)
       │
       ├──> Plataformas B2B / Rendimiento   ──> Nivel C3 (Professional)
       │
       ├──> Sistemas Críticos Multicapa    ──> Nivel C4 (Advanced)
       │
       └──> Entornos Altamente Regulados   ──> Nivel C5 (Enterprise) / C6 (Ultimate)
```

---

## 2. Criterios Objetivos para la Recomendación de Nivel

```text
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| NIVEL RECOMENDADO     | PERFIL DEL CLIENTE / DIAGNÓSTICO EN CHECKUP       | REQUISITOS TÉCNICOS EN EL REPOSITORIO             |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **NIVEL C1**          | • Score CQS en Checkup: 45.00 a 65.00.            | • Eliminar claves expuestas (`GB-01`).            |
| *(Foundation)*        | • Equipo pequeño sin políticas previas de CI/CD.  | • Asegurar enlaces externos cifrados (HTTPS).     |
|                       | • Objetivo: Evitar fugas críticas de seguridad.   | • Umbral mínimo de aprobación: Score >= 60.00.    |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **NIVEL C2**          | • Score CQS en Checkup: 66.00 a 80.00.            | • Fijar dependencias en `package-lock.json`.      |
| *(Standard)*          | • Aplicaciones web comerciales y portales de pago.| • Estructura semántica HTML5 y meta tags.         |
|                       | • Objetivo: Estándar de entrega a clientes.       | • Umbral mínimo de aprobación: Score >= 78.00.    |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **NIVEL C3**          | • Score CQS en Checkup: > 80.00.                  | • Cobertura técnica y suite de tests unitarios.   |
| *(Professional)*      | • Plataformas SaaS activas con tráfico constante. | • Auditorías de rendimiento (Lighthouse JSON).    |
|                       | • Objetivo: Resiliencia y estabilidad de entrega. | • Umbral mínimo de aprobación: Score >= 85.00.    |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **NIVEL C4**          | • Sistemas Fintech y portales transaccionales.    | • Ingesta de evidencias multicapa verificadas.    |
| *(Advanced)*          | • Equipos de ingeniería maduros con pipelines CI. | • Cero controles omitidos en dominios clave.      |
|                       | • Objetivo: Rigor arquitectónico estricto.        | • Umbral mínimo de aprobación: Score >= 90.00.    |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **NIVEL C5 / C6**     | • Software crítico de misión cero o bancario.     | • Evidencia cruzada y 100% de controles evaluados.|
| *(Enterprise/Ultimate)* • Organizaciones con auditoría interna exigente.  | • Score CQS >= 95.00 (C5) o Score = 100.00 (C6).  |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
```

---

## 3. Principio de No-Obligación hacia C6

**No todo cliente necesita ni debe aspirar a Nivel C6.**  
Para la gran mayoría de startups y empresas comerciales, **Nivel C1 o C2 proporciona el 90% del valor de protección higiénica y gobernanza**. El consultor de Grupo Castillo debe orientar al cliente hacia el nivel que maximice su retorno de inversión sin imponer sobrecargas operativas innecesarias.
