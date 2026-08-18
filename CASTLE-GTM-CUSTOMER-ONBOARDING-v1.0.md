# Castle GTM — Customer Onboarding & Security Checklist (v1.0.0)
**Document ID:** `GTM-ONBOARDING-v1.0.0`  
**Classification:** Grupo Castillo Operations & Security Protocols  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Checklist de Onboarding Técnico

```text
================================================================================
                    CHECKLIST DE ONBOARDING DEL CLIENTE
================================================================================
[ ] 1. Firma formal del Acuerdo de Confidencialidad (NDA).
[ ] 2. Designación del Lead Técnico / DevOps del cliente y canal de comunicación.
[ ] 3. Validación de entorno: Node.js >= 18.0.0 instalado en máquina local / CI.
[ ] 4. Verificación de acceso de lectura temporal al repositorio acordado.
[ ] 5. Entrega del paquete `@grupo-castillo/castle-gate` (v1.0.0) y Customer Runbook.
[ ] 6. Ejecución de prueba de humo: $ npx castle-gate version (Exit Code 0).
[ ] 7. Programación de la sesión de Escaneo Baseline (45 minutos).
================================================================================
```

---

## 2. Protocolo de Seguridad de la Información y Cierre de Accesos

1. **Privacidad Local Total:** El análisis de código se ejecuta directamente en la máquina o runner del cliente. **Ningún archivo de código fuente sale del entorno del cliente.**
2. **Cero Retención de Secretos:** Grupo Castillo no almacena credenciales ni volcados de memoria.
3. **Revocación de Accesos:** Al finalizar el piloto o servicio, se verifica formalmente la revocación de cualquier permiso de acceso temporal concedido al equipo de consultoría.
