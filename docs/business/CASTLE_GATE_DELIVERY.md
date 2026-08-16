# Protocolo de Integración de Castle Gate en la Entrega (Castle Gate Delivery)
## Procedimiento de Validación CQS v1.1 y Generación de Evidencia Criptográfica

**Versión:** 1.1.0  
**Ámbito:** Todas las liberaciones y entregas de software de Grupo Castillo.

---

### 1. PROPÓSITO Y ROL DE CASTLE GATE EN CADA ENTREGA

Cada proyecto entregado por Grupo Castillo incluye como valor agregado fundamental la **evaluación formal de calidad y seguridad mediante el motor Castle Security & Quality Gate (CQS v1.1)**. 

Este procedimiento garantiza que ningún release llegue a producción sin evidencia verificable de cumplimiento en 7 dominios técnicos esenciales.

```
┌────────────────────────────────────────────────────────────────────────┐
│  REPOSITORIO CONGELADO (Release Commit SHA)                            │
│           │                                                            │
│           ▼                                                            │
│  EJECUCIÓN DEL RUNNER CASTLE GATE (In-Memory, Nivel C1-C6)             │
│           │                                                            │
│           ▼                                                            │
│  VERIFICACIÓN DE UMBRALES Y CERO GATE BREAKERS                         │
│           │                                                            │
│     ┌─────┴────────────────────────┐                                   │
│     ▼                              ▼                                   │
│  [ PASS ]                       [ FAIL ]                               │
│     │                              │                                   │
│     ▼                              ▼                                   │
│  1. Generación Validation ID    1. Veto automático de release          │
│  2. Certificado JSON firmado    2. Notificación de remediación         │
│  3. Reporte HTML de cumplimiento 3. Corrección requerida               │
│  4. Entrega formal al Cliente                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. QUÉ RECIBE EL CLIENTE CON CASTLE GATE

Al momento del cierre técnico, el Cliente recibe en la raíz de su repositorio un paquete `.castle/` compuesto por:

1. **Certificado Criptográfico de Release (`release-certificate.json`):**
   - Identificador único de validación (`Validation ID`: `CG-YYYY-XXXXXX`).
   - Política CQS contratada (ej. `C4_ADVANCED`).
   - Hash exacto del commit liberado (`target_release_sha`).
   - Puntuación compuesta obtenida (0 a 100).
   - Conteo de secretos detectados (0) y Gate Breakers activos (0).
   - Firma criptográfica `signature_digest_sha256` calculada sobre la estructura canónica del certificado.

2. **Reporte Visual de Cumplimiento (`compliance-report.html`):**
   - Documento HTML independiente, autocontenido y estilizado con la identidad visual técnica de Grupo Castillo.
   - Detalle exhaustivo de los 7 dominios auditados, hallazgos, estado de controles y notas de remediación.
   - Diseñado para ser presentado a directores de tecnología (CTO), comités de auditoría interna o inversionistas como evidencia de buenas prácticas de ingeniería.

3. **Sello Digital de Validación Técnica:**
   - Componente visual interactivo incorporable en el pie de página del producto.
   - Enlaza a la página informativa oficial de verificación: `https://servicios-castillo.vercel.app/castle-gate.html#validacion`.

---

### 3. PROCEDIMIENTO OPERATIVO DE CERTIFICACIÓN PRE-ENTREGA

El ingeniero responsable debe ejecutar la siguiente secuencia en el entorno del release:

```bash
# 1. Compilación estática limpia
npm run check
npm run build

# 2. Ejecución del motor Castle Gate sobre el release
node bin/castle-gate.js scan --dir . --level C4 --out .castle

# 3. Verificación de la firma criptográfica del certificado emitido
node bin/castle-gate.js verify-cert --cert .castle/release-certificate.json
```

**Criterio de Aprobación:**
- `Exit Code` debe ser estrictamente **0**.
- `Puntuación Compuesta` $\ge$ umbral del nivel pactado (ej. $\ge 90.0\%$ para C4).
- `Gate Breakers` = **0**.
- `Secretos` = **0**.

---

### 4. ACLARACIONES TÉCNICAS Y LÍMITES DEL PROTOCOLO

Para mantener una postura de estricta honestidad técnica con el Cliente:
- **No es una garantía de invulnerabilidad eterna:** Certifica que el release congelado cumplió con todos los controles estáticos de código, dependencias, accesibilidad y configuración al momento de su evaluación.
- **No es una certificación regulatoria de terceros:** No sustituye auditorías gubernamentales obligatorias ni certificaciones externas de cumplimiento organizacional como ISO/IEC 27001 o SOC 2 Type II.
- **Ámbito Estático:** La evaluación se ejecuta en frío sobre el código y configuración; la seguridad operativa en caliente depende de la gestión continua de la infraestructura.
