# ARQUITECTURA DE RUNTIME, PERSISTENCIA Y LÍMITES DE PRODUCCIÓN

**Versión:** 1.1.0  
**Clasificación:** Documentación Técnica de Arquitectura  
**Estado:** VIGENTE  

---

## 1. Contexto y Runtime Requerido

El Sistema Comercial y Expediente Digital de Grupo Castillo opera mediante una API REST desacoplada construida sobre el runtime de **Node.js** nativo (versión $\ge 22.12.0$, probado y verificado en Node.js 24).

### Características del Proceso:
* **Módulo de Base de Datos:** `node:sqlite` nativo (`DatabaseSync`).
* **Criptografía:** `node:crypto` nativo (HMAC SHA-256, hash de contraseñas/OTPs y generación de entropía).
* **Concurrencia de Base de Datos:** Modo WAL (`PRAGMA journal_mode = WAL;`) con claves foráneas obligatorias (`PRAGMA foreign_keys = ON;`).

---

## 2. Persistencia y Almacenamiento

### Ubicación del Almacenamiento Local
* **Ruta de Base de Datos:** `.castle/commercial.sqlite`
* **Ruta de Bóveda Documental:** `.castle/documents/<projectId>/...`

### Requisito Estricto de Persistencia
> [!IMPORTANT]
> **El motor SQLite requiere un sistema de archivos con persistencia de disco.**  
> Los datos transaccionales, hashes de auditoría, sesiones y archivos de la bóveda documental se graban en disco.

---

## 3. Limitaciones en Entornos Serverless Puros (ej. Vercel)

1. **Incompatibilidad con Lambdas Efímeras Sin Estado:**  
   Plataformas como Vercel Serverless Functions o AWS Lambda operan con sistemas de archivos de solo lectura (read-only) y directorios `/tmp` efímeros que se destruyen al finalizar o reciclar la instancia de la función lambda.
2. **Impacto en SQLite:**  
   Ejecutar SQLite en un contenedor serverless sin disco persistente ocasionaría la pérdida del estado transaccional al reiniciarse la función.
3. **Estrategia para Producción:**  
   - **Opción A (Recomendada):** Desplegar el servicio de API comercial (`bin/commercial-api.js`) en una instancia Node.js persistente (VPS, Render, Railway, Fly.io, o contenedor Docker con volumen de disco montado).
   - **Opción B (Adaptador Distribuido):** En caso de requerir arquitectura serverless global en el frontend (Vercel), desacoplar la capa de persistencia conectando un driver compatible con SQLite distribuido (ej. LibSQL / Turso) o una base de datos relacional externa administrada.

---

## 4. Política de Fallo Seguro (*Fail-Safe*)

Si el sistema de archivos no permite la escritura o el directorio `.castle` no tiene permisos de creación, el motor `createDatabase()` falla de manera síncrona en el arranque impidiendo transacciones corruptas o escrituras silenciosamente descartadas.
