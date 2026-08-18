# Castle GTM — Discovery Call Framework & Question Bank (v1.0.0)
**Document ID:** `GTM-DISCOVERY-v1.0.0`  
**Classification:** Grupo Castillo Sales Enablement & Technical Discovery  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Guía Rápida de Llamadas de Descubrimiento

```text
+-----------------------+-----------------------+---------------------------------------------------------------+
| MODALIDAD             | OBJETIVO              | PREGUNTAS CLAVE                                               |
+-----------------------+-----------------------+---------------------------------------------------------------+
| **1. Discovery 15m**  | Screening rápido de   | • ¿En qué stack está construido su proyecto principal?        |
| *(Filtro Ágil)*       | encaje técnico y rol. | • ¿Con qué frecuencia despliegan código a producción?         |
|                       |                       | • ¿Tienen algún lanzamiento o auditoría próxima?              |
+-----------------------+-----------------------+---------------------------------------------------------------+
| **2. Discovery 30m**  | Entender dolores de   | • ¿Cómo aseguran hoy que no se filtren claves de API a prod?  |
| *(Comercial / Dolor)* | negocio y decisores.  | • ¿Qué pasa cuando un release falla o introduce un bug grave? |
|                       |                       | • ¿Quién aprueba técnicamente la salida a producción?         |
|                       |                       | • Si detectaran secretos expuestos, ¿quién los corregiría?    |
+-----------------------+-----------------------+---------------------------------------------------------------+
| **3. Tech Discovery** | Diagnóstico técnico   | • ¿Utilizan GitHub Actions, GitLab CI o despliegues manuales? |
| **60m (Arquitectura)**| y acuerdo de alcance  | • ¿Tienen `package-lock.json` fijado en todos los repos?      |
|                       | para Checkup/Piloto.  | • ¿Qué cobertura de tests automáticos tienen actualmente?     |
|                       |                       | • ¿Estarían dispuestos a correr un escaneo local de 15 seg?   |
+-----------------------+-----------------------+---------------------------------------------------------------+
```

---

## 2. Banco de Preguntas por Dominio CQS

* **Seguridad Higiénica:** *"¿Tienen una política automatizada que impida hacer push si alguien accidentalmente coloca una clave de AWS o Stripe en el código?"*
* **Semántica y DOM:** *"¿Cómo validan que las vistas cumplan con estándares de accesibilidad y etiquetas HTML5 antes de publicar?"*
* **Mantenibilidad:** *"¿Han experimentado problemas donde una actualización de dependencias rompió el build en producción?"*
* **Gobernanza:** *"¿Tienen un registro auditable e inmutable que demuestre que el código desplegado superó los controles de calidad?"*
