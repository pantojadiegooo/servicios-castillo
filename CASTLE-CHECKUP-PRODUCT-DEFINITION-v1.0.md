# Castle Checkup — Official Product Definition (v1.0.0)
**Document ID:** `CHECKUP-DEF-v1.0.0`  
**Classification:** Grupo Castillo Service Definition & Diagnostic Productization  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. ¿Qué es Castle Checkup?

**Castle Checkup** es el **servicio profesional de diagnóstico técnico inicial** de Grupo Castillo. Proporciona una evaluación técnica integral, objetiva y basada en evidencia sobre la higiene de seguridad, calidad estructural, semántica y mantenibilidad de un producto digital, utilizando el motor **Castle Gate v1.0.0** y la metodología **CQS v1.1**, complementado con la interpretación y análisis estratégico de ingenieros consultores de Grupo Castillo.

Su función central es:

$$\mathbf{DIAGNOSTICAR} \longrightarrow \mathbf{MEDIR} \longrightarrow \mathbf{EXPLICAR} \longrightarrow \mathbf{RECOMENDAR} \longrightarrow \mathbf{CONVERTIR}$$

---

## 2. ¿Qué problema resuelve?

1. **Incertidumbre Técnica:** Muchas empresas no saben con exactitud cuál es el estado de calidad y seguridad higiénica de sus repositorios de software antes de salir a producción.
2. **Barrera de Entrada para Gobernanza Continua:** Adoptar una herramienta de corte de release (Gate) de forma inmediata puede ser intimidante si el equipo desconoce si su código será bloqueado masivamente.
3. **Falta de Hoja de Ruta Priorizada:** Castle Checkup entrega un inventario claro de riesgos y "Quick Wins" para que el cliente pueda sanear su código paso a paso antes de activar una política estricta de Gate.

---

## 3. ¿Para quién es y cuándo debe contratarse?

* **Para Quién Es:**  
  * Startups y PYMEs tecnológicas que quieren evaluar su estado técnico antes de lanzar un producto.
  * Agencias digitales que desean auditar un software antes de entregarlo formalmente a un cliente final.
  * Empresas con equipos de desarrollo que planean adoptar CI/CD con gobernanza de calidad.
* **Cuándo Debe Contratarse:**  
  * Como paso previo a la adopción de Castle Gate en producción.
  * Antes de una ronda de inversión o entrega importante a clientes B2B.
  * Durante la evaluación de un software heredado (*legacy*) o desarrollado por terceros.
* **Cuándo NO Debe Contratarse:**  
  * Cuando el cliente requiere una auditoría legal o certificación regulatoria externa (SOC 2, ISO 27001).
  * Cuando el cliente busca un análisis de penetración dinámico (pentesting) en servidores en vivo.
  * Cuando el cliente ya tiene un pipeline maduro y solo requiere la licencia de software de Castle Gate.

---

## 4. ¿Qué recibe el cliente y qué necesita Grupo Castillo?

* **Qué recibe el cliente:**  
  1. *Castle Checkup Report*: Informe ejecutivo y técnico con CQS Score y estado de Gate Readiness.
  2. *Compliance Report HTML*: Dashboard interactivo autónomo con el detalle de controles evaluados.
  3. *Sesión Ejecutiva de Devolución*: 1 hora con un consultor de Grupo Castillo para explicar los hallazgos y priorizar el plan de acción.
  4. *Hoja de Ruta de Remediación y Recomendación de Nivel C1→C6*: Guía sobre qué nivel de Gate es el adecuado para su proyecto.
* **Qué necesita Grupo Castillo:**  
  * Acceso de lectura al repositorio de código fuente (Node.js, TypeScript, JavaScript, HTML5).
  * 1 punto de contacto técnico (CTO, Tech Lead o Desarrollador Principal).

---

## 5. Alcance, Modalidad y Duración

* **Alcance:** 1 repositorio de código fuente por Checkup.
* **Modalidad:** 100% Remoto, seguro y respetuoso de la privacidad (el código se analiza localmente o en un entorno seguro acordado; no se almacenan secretos ni código del cliente).
* **Duración:** **2 a 3 días hábiles** desde la recepción del código hasta la sesión de devolución.

---

## 6. Relación Fundamental con Castle Gate

* **Castle Checkup = Diagnóstico Inicial:** Es una foto estática y un plan de acción para saber dónde está el proyecto hoy.
* **Castle Gate = Gobernanza Continua:** Es la película y el control permanente en el pipeline CI/CD para evitar que el software vuelva a degradarse en el futuro.
