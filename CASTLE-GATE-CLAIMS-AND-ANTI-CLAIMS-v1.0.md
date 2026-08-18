# Castle Security & Quality Gate — Official Claims & Anti-Claims Register (v1.0.0)
**Document ID:** `CLAIMS-ANTI-CLAIMS-v1.0.0`  
**Classification:** Grupo Castillo Mandatory Marketing & Technical Boundaries  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Declaración de Política de Veracidad Técnica

Para preservar la credibilidad de Grupo Castillo y proteger a nuestros clientes, **todo el material comercial, documentación técnica y propuestas de servicio deben alinearse estrictamente con la siguiente matriz**. 

Queda expresamente prohibido el uso de afirmaciones de seguridad absoluta, promesas de certificación externa o exageraciones de capacidad técnica.

---

## 2. Matriz Oficial de Claims y Anti-Claims

```text
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| ÁREA / CATEGORÍA      | CLAIM PERMITIDO (DECLARACIÓN VÁLIDA)          | CLAIM PROHIBIDO (PROHIBIDO POR GRUPO CASTILLO)| JUSTIFICACIÓN TÉCNICA / LEGAL                         |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **Gobernanza de**     | "Castle Gate evalúa y gobierna releases de    | "Castle Gate garantiza que el software es     | Castle Gate aplica reglas deterministas de corte; no  |
| **Release**           | software mediante políticas C1→C6."           | 100% seguro o libre de fallas."               | existe software invulnerable en términos absolutos.   |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **Certificación**     | "Castle Gate emite un Release Certificate     | "Castle Gate otorga una certificación de      | El certificado es un registro técnico interno sellado;|
| **Externa**           | criptográfico de cumplimiento de política."   | seguridad oficial de la industria."           | no es emitido por un organismo certificador formal.   |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **SOC 2**             | "Castle Gate apoya la trazabilidad de releases| "Castle Gate te hace SOC 2 compliant o        | SOC 2 evalúa controles organizacionales y de procesos |
|                       | exigida en auditorías internas."              | sustituye una auditoría SOC 2."               | de toda la empresa, no únicamente código estático.    |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **ISO 27001**         | "Castle Gate fortalece el control de cambios  | "Castle Gate certifica cumplimiento con       | ISO 27001 es un Sistema de Gestión de Seguridad (SGSI)|
|                       | en el ciclo de vida del desarrollo (SDLC)."   | la norma ISO/IEC 27001."                      | que abarca infraestructura, personal y gobernanza.    |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **PCI-DSS**           | "Castle Gate detecta enlaces no cifrados y    | "Castle Gate garantiza cumplimiento de        | PCI-DSS requiere validaciones de red, tokenización y  |
|                       | credenciales antes del despliegue."           | PCI-DSS para procesamiento de pagos."         | auditorías QSA formales.                              |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **SAST Profundo**     | "Castle Gate realiza inspección estática base | "Castle Gate sustituye herramientas de SAST   | Castle Gate valida higiene y patrones definidos; no   |
| **(SonarQube)**       | mediante Castle Native Probes."               | profundo como SonarQube o Semgrep."           | realiza compilación interprocedural de flujo de datos.|
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **CVEs / SCA**        | "Castle Gate verifica la presencia y fijación | "Castle Gate mantiene una base global de      | Castle Gate no mantiene feeds de vulnerabilidades en  |
| **(Snyk)**            | de dependencias en lockfiles."                | vulnerabilidades y sustituye a Snyk."         | tiempo real en su núcleo offline v1.0.0.              |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **Antivirus / WAF**   | "Castle Gate es una herramienta de tiempo de  | "Castle Gate actúa como un firewall de        | Castle Gate opera en build-time (CI/CD / local), no   |
|                       | integración (build-time / CI/CD)."            | aplicaciones web o antivirus en runtime."     | inspecciona paquetes de red en tiempo de ejecución.   |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **Pentesting**        | "Castle Gate previene descuidos higiénicos    | "Castle Gate sustituye una prueba de          | El pentesting requiere análisis adversario humano y   |
|                       | antes de someter el código a pruebas."        | penetración (pentest) profesional."           | evaluación dinámica de lógica de negocio en vivo.     |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
| **Evaluación CQS**    | "CQS v1.1 es una metodología propia de Grupo  | "CQS es un estándar oficial internacional     | CQS es propiedad intelectual de Grupo Castillo y una  |
|                       | Castillo de medición técnica (65 controles)." | obligatorio para la industria del software."  | metodología estructurada de aseguramiento de calidad. |
+-----------------------+-----------------------------------------------+-----------------------------------------------+-------------------------------------------------------+
```

---

## 3. Protocolo de Comunicación Comercial

Todo representante comercial o técnico de Grupo Castillo debe utilizar la siguiente definición estándar:

> *"Castle Security & Quality Gate es una capa de evaluación técnica y gobernanza de releases que permite a una organización medir la calidad y seguridad de sus productos digitales mediante CQS v1.1 y convertir ese resultado en una decisión reproducible de release."*
