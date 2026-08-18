# Castle GTM — Competitive Positioning & Market Differentiation (v1.0.0)
**Document ID:** `GTM-POSITIONING-v1.0.0`  
**Classification:** Grupo Castillo Market Strategy & Competitive Intelligence  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Declaración de Posicionamiento Estratégico

> *"Castle Gate no compite contra SonarQube, Snyk o Semgrep; actúa como la capa de gobernanza y corte de release determinista que unifica la medición técnica, aplica políticas de veto (Gate Breakers) y emite un Release Certificate criptográfico inmutable que ninguna de ellas proporciona."*

---

## 2. Matriz Comparativa de Capacidades

```text
+---------------------------+---------------+---------------+---------------+-----------------------+
| CAPACIDAD / ENFOQUE       | SONARQUBE     | SNYK          | SEMGREP       | **CASTLE GATE v1.0**  |
+---------------------------+---------------+---------------+---------------+-----------------------+
| **Enfoque Principal**     | Calidad SAST  | Base de CVEs  | Reglas Regex  | **Gobernanza y Corte**|
|                           | profunda AST  | de paquetes   | de seguridad  | **de Release CI/CD**  |
+---------------------------+---------------+---------------+---------------+-----------------------+
| **Dependencias Runtime**  | Pesado (Java/ | Requiere red/ | Python /      | **ZERO-DEPS (0 Dep)** |
|                           | Base de datos)| Nube externa  | Binario local | **100% Offline / Node**|
+---------------------------+---------------+---------------+---------------+-----------------------+
| **Velocidad de Escaneo**  | Varios minutos| Segundos (Red)| Rápido        | **< 500 ms (Memoria)**|
+---------------------------+---------------+---------------+---------------+-----------------------+
| **Metodología Integrada** | Reglas Sonar  | Base CVE Snyk | Reglas YAML   | **CQS v1.1 Frozen**   |
|                           | propietarias  | dinámicas     | personalizadas| **(65 Controles /100p)**|
+---------------------------+---------------+---------------+---------------+-----------------------+
| **Release Certificate**   | No emite      | No emite      | No emite      | **Emite certificado** |
| **Criptográfico SHA-256** | certificado   | certificado   | certificado   | **sellado inmutable** |
+---------------------------+---------------+---------------+---------------+-----------------------+
| **Niveles de Política**   | Quality Gates | Severidad de  | Rule packs    | **C1 a C6 Ratificados**|
| **Deterministas**         | configurables | vulnerabilidad| booleanos     | **con Gate Breakers** |
+---------------------------+---------------+---------------+---------------+-----------------------+
```
