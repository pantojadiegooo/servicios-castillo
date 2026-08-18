# Castle Security & Quality Gate — Frequently Asked Questions (FAQ) (v1.0.0)
**Document ID:** `FAQ-CUSTOMER-v1.0.0`  
**Classification:** Customer-Facing Support & Sales Collateral  

---

### P1: ¿Castle Gate envía mi código fuente a servidores externos?
**R:** **No, en absoluto.** Castle Gate es una herramienta 100% offline sin dependencias runtime externas (`dependencies: {}`). Todo el escaneo y análisis se realiza localmente en la memoria de su máquina o en su runner de CI/CD.

### P2: ¿Reemplaza Castle Gate a herramientas como SonarQube o Snyk?
**R:** No. Castle Gate se enfoca en ser la **capa de gobernanza y autorización de entregas (Release Gate)** en CI/CD. Evalúa 65 controles de higiene esenciales y emite un Release Certificate sellado con SHA-256 para asegurar que ningún release crítico se publique con claves expuestas o dependencias rotas.

### P3: ¿El Release Certificate es una certificación legal tipo SOC 2 o ISO 27001?
**R:** No. El Release Certificate es un artefacto técnico auditable que acredita de forma inmutable que ese commit específico cumplió las reglas de la política de Gate seleccionada (C1 a C6). Sirve como evidencia técnica interna para sus auditorías.

### P4: ¿Cuánto tarda en ejecutarse un escaneo en CI/CD?
**R:** Menos de 500 milisegundos para repositorios promedio. No añade demoras perceptibles a sus pipelines de despliegue.

### P5: ¿Qué pasa si el Gate bloquea nuestro despliegue por un secreto expuesto?
**R:** El comando retorna `Exit Code 1 (BLOCKED)` deteniendo el build. Debe mover la credencial a una variable de entorno (`process.env`) y volver a ejecutar el scan para autorizar el release.
