# Castle Rescue — Official Product Definition (v1.0.0)
**Document ID:** `RESCUE-DEF-v1.0.0`  
**Classification:** Grupo Castillo Remediation Engineering Productization  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. ¿Qué es Castle Rescue?

**Castle Rescue** es el **servicio especializado de ingeniería de remediación y refactorización técnica** de Grupo Castillo. Interviene directamente sobre el código fuente de repositorios bloqueados o con déficit de calidad técnica para neutralizar *Gate Breakers* (ej. credenciales expuestas, enlaces no cifrados), corregir inconsistencias estructurales en dependencias y elevar el score CQS v1.1 hasta alcanzar la autorización formal de release (`PASSED`).

```text
BLOQUEO DE RELEASE (Exit Code 1 / 2) ──> CASTLE RESCUE ──> RE-SCAN (Exit Code 0) ──> CERTIFICADO DE RELEASE
```

---

## 2. ¿Qué problema resuelve?

1. **Equipos de Desarrollo Desbordados:** Desarrolladores que no tienen tiempo o conocimiento específico para limpiar secretos históricos, corregir árboles de dependencias rotos o estructurar semántica HTML5.
2. **Releases Bloqueados en Pipeline:** Proyectos detenidos por políticas de Gate en CI/CD que impiden el despliegue a producción de nuevas funcionalidades.
3. **Brecha entre el Diagnóstico y la Corrección:** Transforma las observaciones de *Castle Checkup* o *Castle Audit* en código real limpio y corregido mediante Pull Requests probados.

---

## 3. ¿Para quién es y cuándo debe contratarse?

* **Compradores:** CTOs, Tech Leads y Gerentes de Ingeniería que tienen un release bloqueado o una fecha límite de entrega comercial.
* **Triggers de Contratación:**  
  * Cuando Castle Gate o CI/CD retorna `Exit Code 1 (BLOCKED)` o `Exit Code 2 (REQUIRES_REMEDIATION)`.
  * Tras recibir un informe de *Castle Checkup* con múltiples Gate Breakers que el equipo interno no puede resolver de inmediato.
  * Antes de una auditoría externa para sanear deuda técnica higiénica acumulada.
* **Cuándo NO Debe Contratarse:**  
  * Para desarrollar nuevas funcionalidades de negocio desde cero (Castle Rescue es remediación, no desarrollo a medida).
  * Si el cliente solo necesita el diagnóstico (contratar *Castle Checkup*).
  * Ante una crisis de fuga activa de datos en producción que requiera contención inmediata (contratar *Castle Emergency*).

---

## 4. Alcance y Límites Operativos

* **Dentro de Alcance:**  
  * Remediación de secretos expuestos y migración a variables de entorno seguras.
  * Sustitución de enlaces y librerías HTTP no seguras por HTTPS.
  * Corrección de estructura de `package.json`, fijación de lockfiles y resolución de dependencias duplicadas.
  * Ajustes de semántica HTML5, meta tags y accesibilidad DOM básica.
  * Validación con re-scans de Castle Gate hasta obtener `Exit Code 0 (PASSED)`.
* **Fuera de Alcance:**  
  * Rediseño completo de la lógica de negocio o desarrollo de módulos de software no relacionados con los hallazgos de CQS.
  * Soporte de infraestructura de bases de datos o servidores en la nube.
