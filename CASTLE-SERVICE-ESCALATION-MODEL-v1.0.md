# Castle Ecosystem — Multi-Path Escalation & Customer Journey Model (v1.0.0)
**Document ID:** `MODEL-ESCALATION-v1.0.0`  
**Classification:** Grupo Castillo Commercial Operations & Customer Journey  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Principio de Entrada No Lineal

El ecosistema de Grupo Castillo está diseñado para que un cliente pueda ingresar por el servicio que mejor se adapte a su urgencia o madurez técnica actual, sin imponer un recorrido rígido:

```text
[CHECKUP] ───────────────┐
   │                     │
   ▼                     ▼
[AUDIT] ───────────> [RESCUE] <─────────── [EMERGENCY]
   │                     │                       │
   │                     ▼                       │
   └───────────────> [GATE C1..C6] <─────────────┘
                         │
                         ▼
                      [CARE]
```

---

## 2. Escenarios Reales de Recorrido del Cliente

```text
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| ESCENARIO DE CLIENTE  | RUTA DE ADOPCIÓN COMERCIAL                        | JUSTIFICACIÓN TÉCNICA                             |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **Cliente A**         | **Checkup $\to$ Gate C1 $\to$ Care**              | Startup que diagnostica su MVP, corrige Quick Wins|
| *(Startup Ágil)*      |                                                   | por su cuenta y adopta Nivel C1 con supervisión.  |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **Cliente B**         | **Audit $\to$ Rescue $\to$ Gate C3**              | Empresa SaaS con plataforma en producción que     |
| *(SaaS Comercial)*    |                                                   | audita deuda técnica y contrata rescate para C3.  |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **Cliente C**         | **Emergency $\to$ Rescue $\to$ Gate C1**          | Empresa con fuga aguda de clave AWS; se atiende la|
| *(Incidente Crítico)* |                                                   | emergencia y luego se adopta Gate para blindaje.  |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **Cliente D**         | **Gate C1 $\to$ Rescue $\to$ Care**               | Cliente que adopta Gate, experimenta un bloqueo en|
| *(Adopción Directa)*  |                                                   | un sprint complejo y solicita Rescue puntual.     |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **Cliente E**         | **Checkup $\to$ Audit $\to$ Rescue $\to$ Gate C4**| Corporación que evalúa un software de terceros y  |
| *(Due Diligence M&A)* |                                                   | requiere auditoría profunda y saneamiento total.  |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
```
