# Castle Rescue — Remediation Operating Model (v1.0.0)
**Document ID:** `OPERATING-MODEL-RESCUE-v1.0.0`  
**Classification:** Standard Operating Procedure (SOP) for Code Remediation  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Ciclo de Vida de una Intervención de Castle Rescue

```text
1. TRIAGE ──> 2. BRANCHING ──> 3. REMEDIATION ──> 4. RE-SCAN ──> 5. PULL REQUEST ──> 6. CERTIFICATE
```

---

## 2. Definición Detallada del Proceso

```text
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| ETAPA                 | RESPONSABLE   | ACCIONES TÉCNICAS Y PROTOCOLO                                                     |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **1. Triage & Gate**  | Consultor     | Ingesta del reporte de bloqueo (`Exit Code 1/2`). Identificación de los           |
| **Analysis**          | Grupo Castillo| Gate Breakers activos y controles fallidos en CQS v1.1.                           |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **2. Isolated**       | Ingeniero     | Creación de una rama de trabajo dedicada (`fix/castle-gate-remediation`) en el   |
| **Branching**         | de Rescate    | repositorio del cliente. Cero modificaciones directas sobre la rama `main`.       |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **3. Engineering**    | Ingeniero     | Ejecución de cambios de código: Extracción de credenciales a `.env.example`,      |
| **Remediation**       | Grupo Castillo| corrección de tags HTML5, actualización de dependencias y fijación de lockfiles.  |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **4. Automated**      | Software      | Ejecución local del motor:                                                        |
| **Re-Scan**           | Engine        | $ castle-gate scan --dir . --level C1/C2                                          |
|                       |               | Comprobación estricta de obtención de `Exit Code 0 (PASSED)`.                     |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **5. Pull Request &** | Tech Lead     | Entrega de Pull Request documentado con diffs claros y explicación de cada cambio |
| **Peer Review**       | del Cliente   | para que el equipo interno del cliente revise y apruebe las modificaciones.       |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **6. Certificate**    | Release       | Merge de la rama remediada en el pipeline principal. Emisión y verificación       |
| **Issuance**          | Authorizer    | del `release-certificate.json` final. Cierre formal del servicio.                 |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
```

---

## 3. Protocolo Estricto Anti-Regresión

Toda intervención de Castle Rescue debe garantizar que las correcciones aplicadas **no rompan los tests funcionales existentes del cliente**. Si una remediación higiénica requiere alterar un módulo sensible de negocio, se coordina previamente con el Tech Lead del cliente.
