# Grupo Castillo — Sistema de Identidad Visual

Versión 2.0 — 2026
*(Reemplaza y descarta por completo la versión 1.0 "Castle Gate Mark".)*

---

## 1. Por qué se descartó la versión anterior

La v1.0 ("Castle Gate Mark") era un contorno simétrico con una abertura central —
técnicamente correcto, pero se leía como **puerta / ícono de UI / símbolo de
software**, no como una identidad corporativa propia. Un contorno vacío y
simétrico es exactamente el lenguaje visual que usan los íconos de aplicaciones
(flat icons): fácil de producir, fácil de olvidar.

## 2. Concepto nuevo: Corte Castillo

El isotipo ya **no es un contorno ni un pictograma** — es una **masa sólida**,
dividida por un único corte diagonal de precisión, separada en dos piezas de
distinto tono con una separación uniforme y calculada (no a mano, no aproximada:
las dos piezas provienen matemáticamente de un solo bloque cortado por una línea
recta, así que el corte es perfectamente paralelo en toda su longitud — la
diferencia entre un corte "preciso" y uno "improvisado" está exactamente ahí).

**La idea detrás:**

- Una sola masa geométrica cortada = **estructura examinada, seccionada,
  auditada** — referencia directa al negocio real del grupo (Castle Checkup,
  Castle Audit, los niveles CQS de Servicios Castillo): un ingeniero que corta
  para inspeccionar, no un letrero que invita a entrar.
- Dos piezas separadas por una distancia exacta y uniforme = **precisión**,
  tolerancia controlada, ajuste de ingeniería — no un gesto decorativo.
- No tiene simetría bilateral (a diferencia de la v1.0): las dos piezas son de
  proporción distinta, lo que le da carácter y dinamismo sin caer en el caos.
- Es sólido, no un marco/contorno — por lo tanto no puede leerse como puerta,
  portal, letra "C", hexágono ni ícono de seguridad genérico.

### Otras direcciones exploradas y descartadas en este ciclo

1. **Monolito con muesca en el borde** — una sola forma asimétrica con un corte
   en la silueta exterior. *Descartada:* con coordenadas orgánicas se leía como
   papel rasgado / trozo de tela, no como precisión de ingeniería.
2. **Anillo facetado + barra diagonal** — un marco octogonal atravesado por una
   barra en ángulo (idea: "grupo" = anillo que contiene, "corte" = barra que
   ancla). *Descartada:* un círculo/octágono cruzado por una diagonal se parece
   demasiado a la señal universal de "prohibido" — riesgo inaceptable para una
   marca corporativa.
3. **Bloque partido con separación amplia** — la primera versión del corte
   diagonal, pero con las dos piezas muy separadas. *Descartada:* sin la
   proximidad correcta, se leían como dos objetos independientes en vez de un
   solo símbolo — perdía la lectura de "una sola marca".
4. **Monograma en espacio negativo (G/C implícitas)** — explorado conceptualmente
   como dirección; se descartó por el riesgo de necesitar demasiada explicación
   para leerse ("¿es una letra?") y por la dificultad de garantizar una
   ejecución limpia y reproducible a mano alzada.

La dirección final (**Corte Castillo**) fue la única que pasó la prueba de
memorabilidad sin explicación: una masa asimétrica reconocible por su silueta y
por el gesto del corte, no por lo que "representa" literalmente.

---

## 3. Arquitectura de marca

```
GRUPO CASTILLO (marca madre)
└── SERVICIOS CASTILLO (unidad de servicios)
    ├── CASTLE WEB
    ├── CASTLE INDUSTRIAL
    ├── CASTLE CYBERSECURITY
    └── CASTLE GATE (producto — puede independizarse)
```

Un solo isotipo para todo el sistema. Las submarcas se diferencian por:
1. El nombre de la unidad en tipografía principal (grande, Bold).
2. Una línea de aval "GRUPO CASTILLO" en tipografía secundaria, color Titanio,
   sobre el nombre de la unidad.

---

## 4. Color

| Nombre | HEX | Uso |
|---|---|---|
| Obsidian | `#0A0C0F` | Fondo digital principal (OLED) |
| Azul Castillo | `#12304A` | Color de tinta principal — pieza mayor del isotipo, wordmark sobre fondo claro |
| Azul Noche | `#0B1F33` | Tono secundario — pieza menor del isotipo (profundidad, no gradiente) |
| Acero | `#3E7C93` | **Único acento**, uso contenido: estados de interacción, UI, motion. El logo nunca depende de él |
| Platino | `#E8EAEC` | Texto y símbolo sobre fondo oscuro |
| Titanio | `#9AA3AC` | Texto secundario, líneas de aval |
| Slate | `#262B30` | Texto sobre fondo claro, bordes |

**Cambio clave respecto a v1.0:** se eliminó el cyan brillante como color
principal — resultaba demasiado "tech startup". La familia ahora es de azules
profundos y sofisticados (petróleo/acero), con un acento mucho más discreto
reservado solo para interacción digital, nunca para el logo mismo.

**El sistema funciona sin color.** Ver `symbol-black.svg` / `symbol-white.svg`
— el corte y la separación entre piezas siguen siendo perfectamente legibles en
un solo tono, porque la distinción no depende del color sino de la geometría
(el hueco entre las dos piezas).

**Sin efectos:** no hay sombras, bisel, 3D, glow ni glass en ninguna versión del
logo. Son recursos que pueden existir en aplicaciones digitales puntuales, nunca
como parte del archivo maestro.

---

## 5. Tipografía

**Wordmark:** `GRUPO CASTILLO`, construido con los **contornos vectoriales
reales** de Poppins Bold (extraídos letra por letra, no texto editable) —
significa que el logo se ve idéntico en cualquier dispositivo, sin depender de
que la tipografía esté instalada. Esto es un estándar de producción real: los
wordmarks corporativos siempre se entregan "outlineados".

**Personalización geométrica:** la esquina superior izquierda de la primera
letra — la **G** — tiene un corte a 45° idéntico en ángulo al corte del
isotipo. Es la única letra modificada intencionalmente: un solo gesto,
repetido entre símbolo y wordmark, en lugar de modificar las quince letras
(lo cual habría arriesgado la legibilidad que pedías cuidar). El resultado
es un wordmark con una firma geométrica propia sin volverse experimental.

Igual que en la v1.0, Poppins se usa como sustituto disponible en este entorno
(open source, apta para producción real). El corte en la "G" es independiente
de la tipografía base — puede reconstruirse sobre Futura, Sora, Space Grotesk o
cualquier geométrica de palo seco sin perder el gesto distintivo.

---

## 6. Versiones incluidas

- **Master:** `master/grupo-castillo-logo.svg` · `.pdf` · `.png`
- **Horizontal / Stacked:** color, negro, blanco — fondo claro y oscuro
- **Symbol:** isotipo solo — color, negro, blanco, versión on-dark y on-light
- **Favicon:** SVG + PNG en 16, 32, 48, 64, 512 px
- **Subbrands:** un lockup por unidad de negocio, fondo oscuro y claro

### Formatos técnicos

- **SVG** — vectorial real (`<path>` puro, glifos del wordmark también
  vectorizados). Es el master de todo el sistema.
- **PDF** — exportado directamente del SVG (`master/grupo-castillo-logo.pdf`).
- **PNG** — renderizado desde el vector a cada resolución, con transparencia.
- **EPS/AI** — este entorno no genera EPS de forma nativa. El SVG es vector
  puro y sirve como master; un EPS puntual se exporta en segundos desde
  Illustrator o Inkscape sin pérdida de calidad.

---

## 7. Área de seguridad y tamaño mínimo

- **Clear space:** el espacio libre mínimo alrededor del isotipo equivale al
  ancho de la pieza menor (Azul Noche). Ningún texto, borde u otro logotipo
  puede invadir esa zona.
- **Tamaño mínimo digital:** 16 px de alto para el isotipo solo; 130 px de
  ancho para el lockup horizontal completo.
- **Tamaño mínimo impreso:** 8 mm de alto para el isotipo solo.
- Probado y confirmado legible a 16×16, 32×32, 48×48 y 64×64 px — el corte
  entre las dos piezas se mantiene visible incluso en el favicon más pequeño.

---

## 8. Usos incorrectos

Ver `usos-incorrectos.png`. No se permite:

1. Deformar el isotipo (estirar o comprimir de forma no proporcional).
2. Rotar el isotipo.
3. Aplicar colores fuera de la paleta oficial.
4. Usarlo sobre fondos que no ofrezcan contraste suficiente.
5. Añadir contornos, sombras o efectos no contemplados en este sistema.
6. Separar las dos piezas del isotipo más allá de la proporción definida —
   la distancia entre ellas es parte fija del diseño, no un espaciado libre.
7. Reconstruir el wordmark con otra tipografía sin aprobación.
8. Usar el wordmark completo como favicon — el favicon usa siempre el isotipo solo.

---

## 9. Estructura de archivos

```
grupo-castillo-brand/
├── master/            logo principal: svg, pdf, png
├── horizontal/         color · black · white
├── stacked/             color · black · white
├── symbol/               isotipo solo, todas las variantes y tamaños PNG
├── favicon/               svg + png (16/32/48/64/512)
├── subbrands/             un archivo por unidad de negocio
└── brand-guidelines/       este README + brand-sheet.png + usos-incorrectos.png
```
