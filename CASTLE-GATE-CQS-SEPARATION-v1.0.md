# Castle Security & Quality Gate — CQS Separation & Boundary Specification (v1.0.0)
**Document ID:** `SEPARATION-CQS-GATE-v1.0.0`  
**Classification:** Formal Architectural Boundary Specification  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Software Implementation:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Declaración Fundamental de Separación

El sistema establece una frontera estricta entre la **metodología de medición (CQS)** y el **mecanismo de gobernanza y decisión (Castle Gate)**.

```text
+---------------------------------------------------------------------------------------------------+
| PREGUNTA METODOLÓGICA (CQS v1.1)                                                                  |
| "¿Cómo medimos matemáticamente la calidad y seguridad técnica de este producto digital?"          |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| PREGUNTA DE GOBERNANZA (Castle Gate)                                                              |
| "¿Bajo qué política permitimos, retenemos o bloqueamos el release a producción?"                  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Asignación Estricta de Responsabilidades

```text
+------------------------------------+------------------------------------+
| CAPA METODOLÓGICA (CQS v1.1)       | CAPA DE GOBERNANZA (Castle Gate)   |
| Ubicación: cqs/                    | Ubicación: castle-gate/            |
+------------------------------------+------------------------------------+
| • 65 Controles Atómicos            | • Native Probes (Sensores de código)|
| • 7 Dominios de Calidad            | • Gate Decision Engine             |
| • Matriz de Pesos (100.00 pts)     | • Políticas C1 a C6                |
| • Fórmulas de Normalización        | • Gate Breakers (GB-01 a GB-04)    |
| • Invariantes de Evaluación        | • Release Authorizer               |
| • CQS Raw Score & Display Score    | • Generador de Reportes HTML       |
| • Reglas de Evidencia Canónica     | • Emisor y Verificador de Certs    |
| • ESTADO: COMPLETAMENTE CONGELADO  | • ESTADO: PRODUCTO v1.0 CONGELADO  |
+------------------------------------+------------------------------------+
```

---

## 3. Invariantes de la Capa de Medición (CQS v1.1)

1. **Invarianza de Hashes:** Los 11 archivos de `cqs/` permanecen 100% byte-identical contra su baseline SHA-256 ratificado.
2. **Invarianza Nominal:** El peso total de los 65 controles suma exactamente **100.00 puntos nominales**.
3. **Independencia del Entorno:** El evaluador CQS no ejecuta comandos de shell, no lee el sistema de archivos directamente y no realiza llamadas de red; opera como una función pura sobre el `EvidencePackage`.

---

## 4. Dinámica de Evolución Independiente

* **CQS v1.1:** Permanece inmutable como la referencia metodológica estándar para toda la organización y clientes.
* **Castle Gate:** Puede evolucionar en capas externas (ej. adaptadores para herramientas externas en futuras versiones, interfaces gráficas de reportes, optimizaciones de CLI) **sin alterar una sola línea de CQS v1.1**.

---

## 5. Fronteras de No-Confusión para Clientes y Auditores

1. **CQS NO es una certificación:** Es una taxonomía y sistema de scoring técnico interno de Grupo Castillo.
2. **Castle Gate NO es un auditor humano:** Es un motor de software determinista que aplica reglas de release programáticas.
3. **El Release Certificate NO garantiza infalibilidad:** Acredita que la versión evaluada satisfizo la política configurada sin violaciones a los controles evaluados.
