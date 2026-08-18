# Castle Security & Quality Gate — Client Deliverables Package (v1.0.0)
**Document ID:** `DELIVERABLES-CLIENT-v1.0.0`  
**Classification:** Official Scope of Client Deliverables  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Product Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Inventario Estructurado de Entregables para el Cliente

Al contratar y concluir un piloto comercial de Castle Gate, el cliente recibe formalmente los siguientes componentes organizados en 6 categorías:

```text
+---------------------------------------------------------------------------------------------------+
| A. ENTREGABLES TÉCNICOS DE SOFTWARE                                                               |
+---------------------------------------------------------------------------------------------------+
| 1. Paquete NPM Distribuible: @grupo-castillo/castle-gate (v1.0.0) para uso en local y CI/CD.      |
| 2. CLI Ejecutable Autónomo: Comandos scan, evaluate, verify-cert, version.                        |
| 3. Plantillas de Integración CI/CD: action.yml para GitHub Actions y script para GitLab CI.        |
+---------------------------------------------------------------------------------------------------+
| B. EVIDENCIAS Y DATOS ESTRUCTURADOS                                                               |
+---------------------------------------------------------------------------------------------------+
| 1. Evidence Package Canónico (.castle/evidence-package.json): Archivo con 65 controles CQS v1.1. |
| 2. Registro de Hallazgos y Fuga de Secretos: Detalle de líneas y patrones detectados.             |
+---------------------------------------------------------------------------------------------------+
| C. REPORTES Y DIAGNÓSTICOS VISUALES                                                               |
+---------------------------------------------------------------------------------------------------+
| 1. Compliance Report HTML (.castle/compliance-report.html): Dashboard interactivo offline.        |
| 2. Pilot Closure Report Oficial: Informe ejecutivo en PDF/Markdown emitido por Grupo Castillo.    |
+---------------------------------------------------------------------------------------------------+
| D. CERTIFICADOS DE RELEASE Y AUTORIZACIÓN                                                         |
+---------------------------------------------------------------------------------------------------+
| 1. Release Certificate (.castle/release-certificate.json): Sello criptográfico de decisión PASS.|
| 2. Verificador de Autenticidad: Procedimiento y comando verify-cert con digest SHA-256.           |
+---------------------------------------------------------------------------------------------------+
| E. DOCUMENTACIÓN Y MANUALES OPERATIVOS                                                            |
+---------------------------------------------------------------------------------------------------+
| 1. Customer Runbook (CASTLE-GATE-CUSTOMER-RUNBOOK.md): Guía paso a paso de uso y remediación.     |
| 2. Glosario Canónico y Especificación de Políticas C1→C6.                                         |
+---------------------------------------------------------------------------------------------------+
| F. RECOMENDACIONES TÉCNICAS Y SIGUIENTES PASOS                                                    |
+---------------------------------------------------------------------------------------------------+
| 1. Plan de remediación higiénica priorizado.                                                      |
| 2. Hoja de ruta sugerida para escalamiento a niveles superiores (C2 $\to$ C3).                    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Elementos que NO Forman Parte del Entregable (Límites Explícitos)

1. **NO se entrega un certificado regulatorio formal** de validez legal externa (como un informe SOC 2 Tipo II, certificado ISO 27001 o atestación formal PCI-DSS QSA).
2. **NO se entrega código fuente propietario del motor de Grupo Castillo** fuera del paquete ejecutable empaquetado.
3. **NO se entrega garantía de invulnerabilidad absoluta** ante ataques informáticos o cero-days no identificados por los controles de higiene estática.
