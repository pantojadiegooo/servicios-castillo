# Castle Care: cobro mensual alojado en Stripe

## Estado y alcance

Integración SSG preparada. Desactivada por defecto hasta verificar la cuenta,
crear o reutilizar enlaces reales, cerrar términos y probar el ciclo de cobro.
No equivale a suscripciones activas ni a un despliegue en producción.

Se usa Stripe Payment Links para suscripciones y el portal alojado de Stripe
para autogestión. No se requieren Stripe.js, claves en el frontend, nuevas
dependencias, iframe, base de datos ni backend propio. La CSP no se relaja.

Los paquetes de desarrollo quedan fuera de esta integración: mantienen 50%
de anticipo y 50% al cierre. No activar para Care el antiguo backend comercial
de pagos, que modela órdenes de proyecto y no este ciclo de suscripciones.

## Fuente de precios

`src/commercial/core/pricing.js`, objeto `SPECIALIZED_SERVICES.CARE.plans`:

| Plan | MXN al mes | Importe Stripe en centavos |
| --- | ---: | ---: |
| Castle Care Basic | 590 | 59000 |
| Castle Care Pro | 990 | 99000 |
| Castle Care Enterprise | 1890 | 189000 |

No multiplicar por 100 dos veces. Moneda `mxn`, `recurring.interval=month`,
`interval_count=1`, cantidad fija 1, sin prueba gratuita, alta ni descuentos
automáticos. No crear suscripciones para clientes ni cobrar tarjetas durante
la configuración. Confirmar tratamiento de impuestos con el responsable antes
de activar: los documentos actuales no establecen de forma consistente si estos
importes incluyen IVA. No modificar totales ni activar Stripe Tax silenciosamente.

## Configuración en Stripe

1. Confirmar que la cuenta conectada corresponde a Grupo Castillo y separar
   sandbox de live. Para live, verificar habilitación de cobros y pendientes de
   la cuenta. No cambiar datos bancarios ni identidad legal.
2. Buscar productos, precios recurrentes y Payment Links existentes antes de
   crear. Reutilizar únicamente si coinciden cuenta, nombre, monto, moneda,
   periodicidad y vigencia. No modificar planes de clientes existentes.
3. Crear o reutilizar un Payment Link independiente por plan. Comprobar el
   producto/precio asociados desde Stripe; el nombre o la URL no prueban el
   importe. No aceptar cantidad ajustable, otros productos ni moneda alternativa.
4. Revisar nombre público, contacto y enlaces de términos y privacidad. Solicitar
   aceptación de términos en Checkout cuando los documentos estén cerrados.
   Mostrar claramente renovación mensual y el total antes de confirmar.
5. Activar el enlace de inicio de sesión del portal de clientes: permitir
   actualizar medio de pago, consultar comprobantes y cancelar la suscripción.
   No habilitar cambios de plan/prorrateos hasta definir sus reglas.
6. La opción técnica recomendada es cancelación al fin del periodo pagado, sin
   nuevos cobros posteriores; Claude debe resolver antes la contradicción con
   el texto actual que exige 15 días de anticipación. No anunciar una política
   que contradiga la configuración real o las obligaciones aplicables.
7. Mantener la confirmación alojada por Stripe. No interpretar una visita a una
   página de éxito, un parámetro URL ni un clic como prueba de pago.

## Configuración de Astro / Vercel

Copiar las variables públicas de `infra/env/care-checkout.env.example` al
entorno correspondiente. Cada enlace es público; ninguna clave `sk_`, `rk_`
o `whsec_` debe entrar en variables `PUBLIC_`, archivos versionados ni mensajes.

`PUBLIC_CARE_CHECKOUT_ENABLED=false` conserva solicitudes por formulario y
preselecciona el plan. Al activar, se requieren los tres Payment Links y el
portal, todos del mismo modo. El build rechaza URLs no canónicas, duplicados,
enlaces incompletos y mezcla test/live. Sandbox solo se admite con
`VERCEL_ENV=preview` o `development`; Vercel establece esa variable y no se debe
sobrescribir en producción. Sin entorno explícito, un build se trata como
producción. Cambiar variables requiere rebuild y redeploy.

La validación local verifica formato y coherencia, no propiedad de la cuenta,
existencia del enlace ni términos o impuestos. Esas verificaciones se realizan
en Stripe antes de activar.

## Operación inicial sin base de datos

Stripe automatiza cobros recurrentes; la prestación de Care no se automatiza por
ello. Operaciones verifica en el Dashboard factura pagada y suscripción vigente
antes de iniciar cobertura y vincula al cliente con sus repositorios y alcance.
Las renovaciones, fallos de pago y cancelaciones se revisan en Stripe. No usar
capturas del cliente ni eventos de Google Analytics para dar por pagado un plan.

Configurar recibos y avisos operativos conforme al consentimiento aplicable. Los
comprobantes de Stripe no se deben presentar como CFDI sin verificar el proceso
fiscal correspondiente. No prometer suspensión automática si no está programada.
Una fase futura con activación automática requerirá webhooks firmados,
idempotencia y persistencia; esta fase no la implementa.

## Pruebas y criterio de activación

- `npm run test:care`: importes, enlaces, modos, fallback y rechazos seguros.
- `npm test`: pruebas existentes de Gate/comercial y las nuevas de Care.
- `npm run build`: salida estática con configuración apagada y sandbox.
- `npm run check`: comparar contra la línea base; no confundir errores previos
  con regresiones ni declarar limpio el proyecto si el comando falla.
- En sandbox real: alta, pago fallido, autenticación adicional cuando aplique,
  renovación, acceso al portal y cancelación con fecha efectiva correcta.
- En live: inspeccionar los tres enlaces, monto total, MXN/mes, cuenta y términos
  sin efectuar cargos de prueba reales ni crear clientes ficticios de producción.
- Cerrar las discrepancias de alcance: FAQ de horas Rescue sin cantidad definida,
  Platinum con 4 horas, sondeos cada 60 segundos y canales/SLAs no confirmados.
- Desplegar y verificar en `https://grupocastillo.lat/servicios/care` cuando
  enlaces, configuración fiscal/comercial y pruebas estén cerrados.

Rollback: desactivar `PUBLIC_CARE_CHECKOUT_ENABLED` y redesplegar. Si hay un
enlace erróneo en circulación, desactivarlo también en Stripe; ocultarlo en el
sitio no lo invalida. No cancelar suscripciones legítimas durante el rollback.

## Documentación oficial consultada

- [Stripe Payment Links](https://docs.stripe.com/payment-links)
- [Suscripciones sin código](https://docs.stripe.com/no-code/subscriptions)
- [Portal de clientes alojado](https://docs.stripe.com/customer-management/activate-no-code-customer-portal)
- [Variables de entorno de Astro](https://docs.astro.build/en/guides/environment-variables/)
