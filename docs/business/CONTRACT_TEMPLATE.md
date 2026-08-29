# Contrato Marco de Prestación de Servicios de Desarrollo y Gobernanza de Software
## Plantilla Operativa — Grupo Castillo

> **AVISO LEGAL OBLIGATORIO:**  
> *Este documento constituye una plantilla operativa de referencia técnica y comercial desarrollada por Grupo Castillo. No constituye asesoría legal definitiva y está estrictamente sujeta a revisión, adaptación y formalización por parte del asesor jurídico calificado de las partes antes de su firma comercial.*

---

### CONTRATO MARCO NÚMERO: GC-MSA-2026-[XXXX]

**Fecha de Celebración:** [Día] de [Mes] de 202[X]  
**Lugar:** Ciudad de México, México (o jurisdicción acordada)  

---

### 1. LAS PARTES

1. **EL PROVEEDOR:**  
   **Razón Social / Titular:** [Razón Social Grupo Castillo / Titular Legal]  
   **RFC / Identificación Fiscal:** [RFC / Tax ID]  
   **Domicilio Legal:** [Dirección Legal]  
   **Representante Legal:** [Nombre del Representante]  
   **Correo de Notificaciones Técnicas y Administrativas:** contacto@grupocastillo.lat  

2. **EL CLIENTE:**  
   **Razón Social / Titular:** [Nombre de la Empresa o Persona Física del Cliente]  
   **RFC / Identificación Fiscal:** [RFC / Tax ID del Cliente]  
   **Domicilio Legal:** [Dirección del Cliente]  
   **Representante Legal:** [Nombre del Representante del Cliente]  
   **Correo de Contacto y Handoff:** [correo@cliente.com]  

---

### 2. OBJETO Y DECLARACIONES DE ALCANCE

1. **Objeto:** El Proveedor se obliga a prestar a favor del Cliente los servicios de ingeniería de software, arquitectura web, auditoría técnica, rescate o mantenimiento preventivo especificados en cada **Declaración de Trabajo (Statement of Work - SOW)** anexa y numerada secuencialmente (Anexo A, B, etc.).
2. **Independencia Operativa:** Las partes declaran ser entidades legal y financieramente independientes, no existiendo relación laboral, sociedad mercantil ni subordinación entre sus colaboradores.

---

### 3. TITULARIDAD EXCLUSIVA DE LA PROPIEDAD INTELECTUAL

El principio fundamental que rige toda entrega de Grupo Castillo es la **Titularidad Exclusiva del Cliente**:

1. **Propiedad del Cliente (100% Transferible):**  
   Una vez liquidado el monto total pactado en el SOW correspondiente, el Cliente es el **único y exclusivo titular** de:
   - Todo el código fuente desarrollado específicamente para el proyecto (*custom code*).
   - Diseños visuales, diagramas, maquetación y estructuras creadas para el proyecto.
   - Dominios web, cuentas de hosting, servicios DNS, certificados SSL y bases de datos.
   - Contenido textual, imágenes, marcas registradas, copy comercial y bases de usuarios.
2. **Propiedad Intelectual Preexistente del Proveedor:**  
   El Proveedor conserva la titularidad de sus herramientas internas de compilación, scripts base de automatización, know-how propietario y el motor de evaluación estática *Castle Security & Quality Gate*.  
   El Proveedor otorga al Cliente una licencia perpetua, no exclusiva y libre de regalías para utilizar los artefactos compilados y componentes derivados integrados en el producto entregado.

---

### 4. ENTREGABLES, ACEPTACIÓN Y DEFINITION OF DONE

1. **Criterio de Terminación:** Todo entregable se considerará concluido cuando satisfaga los requisitos pactados en el SOW y supere la [Definition of Done](file:///docs/business/DEFINITION_OF_DONE.md) aplicable.
2. **Periodo de Revisión y Aceptación:** El Cliente dispondrá de un periodo de diez (10) días hábiles posteriores a la entrega formal del Release para validar el funcionamiento. Transcurrido dicho plazo sin observaciones técnicas fundadas por escrito, el entregable se considerará aceptado a satisfacción.
3. **Evidencia Técnica de Cierre:** Toda entrega formal incluirá la emisión del reporte de validación *Castle Gate (CQS v1.1)* y el certificado criptográfico de release asociado al commit de entrega.

---

### 5. PRECIO, FACTURACIÓN Y CONDICIONES DE PAGO

1. **Moneda y Monto:** Los precios se estipularán en pesos mexicanos (MXN) o dólares estadounidenses (USD) dentro de cada SOW, desglosando el Impuesto al Valor Agregado (IVA) correspondiente.
2. **Esquema de Pago Estándar:**
   - **Anticipo de Inicio:** 50% al momento de la firma del SOW para inicio de desarrollo.
   - **Liquidación Final:** 50% a la entrega formal del release validado en staging/pre-producción antes de la transferencia definitiva de credenciales de producción.
3. **Servicios Puntuales y Retainers:** Servicios como *Castle Checkup* o pólizas de soporte mensual (*Castle Care*) se facturan al 100% anticipado o mes corriente.

---

### 6. DEPENDENCIAS Y RESPONSABILIDADES DEL CLIENTE

El cumplimiento de los plazos de entrega está condicionado a la entrega oportuna por parte del Cliente de:
- Contenidos definitivos (textos, logos vectoriales oficiales, imágenes en alta resolución).
- Accesos a DNS, dominios, proveedores de hosting o repositorios cuando aplique integración sobre infraestructura del cliente.
- Retroalimentación y aprobaciones de hitos en un plazo no mayor a tres (3) días hábiles por iteración.

---

### 7. POLÍTICA DE CAMBIOS DE ALCANCE (*CHANGE MANAGEMENT*)

Cualquier funcionalidad, sección o integración no descrita explícitamente en el SOW será clasificada como **Cambio de Alcance** (*Scope Change*) y requerirá una Adenda o cotización complementaria por escrito previa a su ejecución, conforme a la [Client Change Policy](file:///docs/business/CLIENT_CHANGE_POLICY.md).

---

### 8. GARANTÍA TÉCNICA Y LÍMITES DE RESPONSABILIDAD

1. **Garantía Operativa (30 Días):** El Proveedor otorga una garantía de treinta (30) días naturales posteriores a la entrega para corregir sin costo cualquier defecto (*bug*) atribuible directamente al código desarrollado.
2. **Exclusiones de Garantía:** La garantía queda sin efecto si el código fuente es modificado por terceros ajenos al Proveedor, si ocurren fallas en la infraestructura del proveedor de nube (AWS, Vercel, Cloudflare, etc.), o si se modifican APIs externas no controladas.
3. **Límite de Responsabilidad:** La responsabilidad total del Proveedor bajo este contrato estará limitada al monto efectivamente pagado por el Cliente en el SOW específico que originó la reclamación.

---

### 9. CONFIDENCIALIDAD

Ambas partes se obligan a mantener estricta reserva sobre toda información técnica, financiera, comercial o estratégica compartida durante la relación contractual, aplicando medidas de seguridad razonables y no divulgando contraseñas, secretos comerciales ni datos de clientes a terceros.

---

### 10. JURISDICCIÓN Y LEY APLICABLE

Para la interpretación y cumplimiento del presente contrato, las partes se someten a la legislación mercantil aplicable en [Ciudad de México, México] y a la competencia de los tribunales de dicha jurisdicción, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.

---

### FIRMAS DE CONFORMIDAD

```
Por EL PROVEEDOR:                         Por EL CLIENTE:



____________________________________      ____________________________________
Nombre: [Representante Proveedor]         Nombre: [Representante Cliente]
Cargo: Dirección General                  Cargo: [Cargo del Representante]
Fecha: [Fecha de Firma]                   Fecha: [Fecha de Firma]
```
