# Castle Security & Quality Gate — Internal Operations Runbook (v1.0.0)
**Document ID:** `RUNBOOK-INTERNAL-OPS-v1.0.0`  
**Classification:** Grupo Castillo Strictly Confidential / Internal Operations Only  
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Objetivo Operacional

Este manual define el procedimiento operativo estándar (SOP) para que el equipo de ingeniería y consultoría de **Grupo Castillo** conduzca clientes a través del ciclo completo de entrega y gobernanza:

```text
LEAD
  │
  ▼
QUALIFICATION (Calificación técnica del repositorio y necesidades)
  │
  ▼
PILOT (Acuerdo de piloto controlado y selección de nivel inicial C1/C2)
  │
  ▼
ONBOARDING (Instalación y configuración en local o CI/CD)
  │
  ▼
FIRST SCAN (Ejecución del baseline y diagnóstico de hallazgos)
  │
  ▼
REMEDIATION (Acompañamiento en corrección de bloqueos)
  │
  ▼
CERTIFICATION (Emisión de Release Certificate y verificación)
  │
  ▼
RELEASE GOVERNANCE (Operación continua en pipeline)
  │
  ▼
FOLLOW-UP & UPGRADE (Escalamiento a niveles superiores o servicios)
```

---

## 2. Calificación del Cliente

Antes de proponer Castle Gate, el consultor técnico debe evaluar:
1. **Pila Tecnológica:** ¿El proyecto utiliza Node.js, JavaScript, TypeScript, HTML5 o componentes web?
2. **Entorno de Despliegue:** ¿Tienen pipeline CI/CD activo (GitHub Actions, GitLab CI) o ejecutan releases manuales?
3. **Nivel de Entrada:**
   * **Recomendar Nivel C1:** Proyectos tempranos, MVPs o equipos sin políticas de calidad previas.
   * **Recomendar Nivel C2:** Aplicaciones comerciales establecidas, portales B2B y APIs en producción.

---

## 3. Matriz de Selección de Nivel Inicial

```text
+---------------------------+-------------------+-------------------+-------------------+
| TIPO DE CLIENTE           | MADUREZ TÉCNICA   | PERFIL DE RIESGO  | NIVEL INICIAL     |
+---------------------------+-------------------+-------------------+-------------------+
| Startup / MVP             | Inicial           | Bajo a Medio      | **C1 Foundation** |
| Agencia de Desarrollo     | Media             | Medio a Alto      | **C2 Standard**   |
| Plataforma SaaS B2B       | Media a Alta      | Alto              | **C2 a C3**       |
| Fintech / Transaccional   | Alta              | Crítico           | **C3 a C4**       |
| Entorno Regulado          | Muy Alta          | Crítico / Misión  | **C4 a C5**       |
+---------------------------+-------------------+-------------------+-------------------+
```

---

## 4. Procedimiento Oficial para Pilotos

```text
================================================================================
                    CHECKLIST DE EJECUCIÓN DE PILOTO
================================================================================
[ ] Paso 1: Seleccionar el repositorio objetivo con el responsable del cliente.
[ ] Paso 2: Acordar formalmente el nivel de Gate objetivo (C1 o C2).
[ ] Paso 3: Entregar el paquete distribuible y el `CASTLE-GATE-CUSTOMER-RUNBOOK.md`.
[ ] Paso 4: Ejecutar el scan baseline inicial en presencia del cliente o en CI/CD.
[ ] Paso 5: Abrir y revisar conjuntamente el `.castle/compliance-report.html`.
[ ] Paso 6: Identificar bloqueos mandatorios (Gate Breakers) o déficit de score.
[ ] Paso 7: Guiar al cliente en la remediación higiénica de los hallazgos.
[ ] Paso 8: Ejecutar el segundo scan y validar obtención de Exit Code 0 (PASSED).
[ ] Paso 9: Verificar la validez del `.castle/release-certificate.json` con `verify-cert`.
[ ] Paso 10: Completar el informe de cierre de piloto y definir siguientes pasos.
================================================================================
```

---

## 5. Gestión y Conservación de Evidencia

* **Qué debe conservar Grupo Castillo:**
  * Versión exacta del motor (`1.0.0`) y de CQS (`1.1.0-candidate`).
  * Copia del `release-certificate.json` emitido y su SHA-256 digest.
  * Registro de fecha, commit hash y nivel de Gate acordado.
* **Política de Confidencialidad:** **Nunca almacenar código fuente ni secretos del cliente.** El análisis se realiza localmente en el entorno del cliente.
* **Almacenamiento Central:** `[Almacenamiento central en la nube pendiente de implementación en roadmap v1.2]`.

---

## 6. Gobernanza del Release Certificate

1. **Emisión Automática:** El certificado solo se emite cuando `GateDecision === 'PASSED'` y `GateBreakers === 'CLEARED'`.
2. **Inmutabilidad:** El payload del certificado incluye el digest SHA-256 del `EvidencePackage`. Cualquier modificación posterior invalida la verificación.
3. **Límites:** El consultor de Grupo Castillo debe reiterar que el certificado es un comprobante interno de release y no una certificación externa SOC 2 o ISO.

---

## 7. Gestión de Estados de Remediación

```text
+-----------------------+-------------------------------------------------------------------------------+
| ESTADO OPERATIVO      | SIGNIFICADO Y ACCIÓN                                                          |
+-----------------------+-------------------------------------------------------------------------------+
| **OPEN**              | Scan inicial ejecutado; hallazgos identificados en el reporte HTML.           |
| **REMEDIATION**       | El cliente está corrigiendo activamente los hallazgos señalados.              |
| **RE-SCAN**           | Segundo escaneo en progreso para comprobar correcciones.                      |
| **PASSED**            | Nivel satisfecho; Exit Code 0; certificado emitido.                           |
| **BLOCKED**           | Veto activo no remediado; release detenido.                                   |
| **CLOSED**            | Piloto concluido satisfactoriamente o decisión formal de release registrada.  |
+-----------------------+-------------------------------------------------------------------------------+
```

---

## 8. Principio de Escalamiento a Servicios Profesionales

Cuando un cliente requiere asistencia que excede la operación autónoma del CLI, Grupo Castillo escala a la siguiente matriz de servicios:

```text
+---------------------------------------------------+---------------------------------------------------+
| CONDICIÓN DEL CLIENTE                             | SERVICIO PROFESIONAL RECOMENDADO                  |
+---------------------------------------------------+---------------------------------------------------+
| Cliente requiere diagnóstico inicial puntual      | ──> **Castle Checkup**                            |
| Cliente requiere auditoría profunda humana + Gate | ──> **Castle Audit**                              |
| Release bloqueado y cliente no sabe resolverlo   | ──> **Castle Rescue**                             |
| Fuga de secretos crítica o emergencia técnica     | ──> **Castle Emergency**                          |
| Cliente requiere acompañamiento continuo mensual  | ──> **Castle Care**                               |
+---------------------------------------------------+---------------------------------------------------+
[Detalles de tarifas y contratación: FASE COMERCIAL POSTERIOR]
```

---

## 9. Plantilla Oficial de Reporte de Piloto (Pilot Report Template)

```text
================================================================================
                      GRUPO CASTILLO — PILOT REPORT
================================================================================
Cliente:                  [Nombre de la Organización]
Proyecto Evaluado:        [Nombre del Repositorio]
Fecha de Ejecución:       [YYYY-MM-DD]
Nivel Evaluado:           [C1 / C2]
Engine Version:           @grupo-castillo/castle-gate v1.0.0
CQS Version:              v1.1 (Frozen)
--------------------------------------------------------------------------------
Scan Baseline (Pre-Fix):  Score: [X.XX] | Estado: [BLOCKED / REMEDIATION]
Hallazgos Críticos:       [Lista de Gate Breakers o controles fallidos]
Acciones de Remediación:  [Resumen de cambios aplicados en código]
Scan Final (Post-Fix):    Score: [X.XX] | Estado: PASSED (Exit Code 0)
Release Certificate ID:   [REL-CERT-CX-XXXXXXXXXXXXX]
Verificación SHA-256:     [VALIDADA]
Recomendación Siguiente:  [Integración formal en CI/CD / Upgrade a Nivel C2]
================================================================================
```

---

## 10. Control de Cambios e Invarianza de CQS

* **Regla Mandatoria:** **CQS v1.1 permanece FROZEN.** Bajo ninguna circunstancia un consultor o ingeniero de Grupo Castillo modificará los archivos en `cqs/` para facilitar la aprobación de un cliente.
* Si se detecta una necesidad metodológica nueva, se canaliza formalmente al Roadmap de CQS v2.0 mediante proceso de cambio controlado.

---

## 11. Protocolo ante Incidentes Operacionales

Si durante la operación con un cliente ocurre una anomalía técnica:
1. **NO modificar el software en caliente.**
2. Registrar la salida exacta de la terminal y los archivos de entrada.
3. Reproducir el escenario en un entorno aislado de pruebas.
4. Si es un falso positivo documental, registrar en el tracker interno P2/P3.
5. Brindar solución de workaround respetando la seguridad e integridad de CQS.

---

## 12. Política Estricta Anti-Bypass

**Queda estrictamente prohibido a todo personal de Grupo Castillo enseñar o facilitar técnicas de evasión de Gate Breakers a clientes.** Si un proyecto es bloqueado por `GB-01` (clave expuesta), la única respuesta autorizada es la eliminación y rotación de la credencial en el código fuente.

---

## 13 & 14. Checklists Oficiales de Entrega y Cierre

```text
CHECKLIST DE ENTREGA AL CLIENTE:
[ ] Versión v1.0.0 confirmada y verificada mediante SHA-256.
[ ] Nivel objetivo (C1 o C2) acordado por escrito.
[ ] Customer Runbook entregado al equipo de ingeniería.
[ ] Primer scan ejecutado con éxito.

CHECKLIST DE CIERRE DEL PILOTO:
[ ] El cliente ejecutó y entendió el reporte HTML autónomo.
[ ] Remediaciones aplicadas y validadas con Exit Code 0.
[ ] Release Certificate verificado mediante verify-cert.
[ ] Integración CI/CD demostrada.
[ ] Encuesta de satisfacción y feedback técnico completados.
```
