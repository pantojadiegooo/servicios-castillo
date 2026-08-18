# Castle Security & Quality Gate — Commercial One-Pager (v1.0.0)
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  
**Methodology:** Castle Quality System (CQS v1.1 — Frozen Baseline)  
**Distribution:** Grupo Castillo Sales Collateral  

---

## Despliega Software a Producción con Certeza Absoluta

> **"Elimina el riesgo de filtrar claves de API o desplegar código roto. Castle Gate evalúa automáticamente tu repositorio en < 500 ms y autoriza o bloquea la entrega en tu pipeline de CI/CD."**

---

### ¿Por qué Castle Gate?

```text
+---------------------------+---------------------------+---------------------------+
| 1. HIGIENE Y SECRETOS     | 2. GOBERNANZA DETERMINISTA| 3. PRIVACIDAD TOTAL       |
+---------------------------+---------------------------+---------------------------+
| Detecta credenciales de   | 65 Controles y 7 dominios | 100% Offline / Zero-Deps. |
| AWS, Stripe y links HTTP  | CQS v1.1. Bloquea entregas| Tu código jamás sale de   |
| antes de que lleguen a    | con Gate Breakers activos | tu infraestructura o      |
| producción.               | y emite Release Certs.    | runners de CI/CD.         |
+---------------------------+---------------------------+---------------------------+
```

---

### Cómo Funciona en 3 Pasos

1. **Escaneo Local / CI:** `$ npx @grupo-castillo/castle-gate scan --dir . --level C1`
2. **Decisión de Gate:** Si hay un secreto crítico $\to$ **`BLOCKED (1)`**. Si cumple la política $\to$ **`PASSED (0)`**.
3. **Certificado Inmutable:** Emisión de `release-certificate.json` sellado con digest SHA-256 inalterable.

---

### Comienza Hoy con Castle Checkup

* **Diagnóstico Inicial:** Conoce el estado de tu repositorio en menos de 72 horas por **$350 - $750 USD** `[PROPUESTA COMERCIAL - SUJETA A APROBACIÓN]`.
* **Garantía Total:** El 100% de lo invertido se acredita hacia tu suscripción anual de Castle Gate.

**Contacto:** `contacto@grupocastillo.tech` | `[CANAL DE SOPORTE OFICIAL PENDIENTE]`
