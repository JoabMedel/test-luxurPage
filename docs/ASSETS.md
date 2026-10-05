# RWB — Inventario de recursos visuales

Decidido antes de producir. Orden de preferencia: **1 código → 2 material existente → 3 Higgsfield → 4 Three.js/3D**. Cada recurso se queda en el primer nivel que funciona.

No se ha recibido material del cliente. Todo lo que debe ser **real** (autos terminados, Akira Nakai, taller real, proceso real) queda como **marco reservado** con su ficha técnica, nunca generado con IA. Tampoco se toman fotos de la web: los builds de esta página (KAZE, NOIR…) no se corresponden con fotos con licencia comercial verificable y presentar otro auto como ese build sería falso.

| # | Recurso | Sección | Nivel | Origen / solución | Por qué |
|---|---|---|---|---|---|
| 1 | Wordmark "RAUH-WELT" | Portada, cierre | 1 · Código | SVG generado por `src/lib/wordmark.ts` (geometría extendida, esquinas redondeadas) | Debe alinearse al píxel con la máscara WebGL y animarse por letras. |
| 2 | "RWB" del loader (trazo + separación) | Loader | 1 · Código | Misma geometría SVG, `stroke-dashoffset` + GSAP | Dibujo y separación son movimiento puro. |
| 3 | Llanta girando en el loader | Loader | 1 + 3 | Render de la llanta (#9) girado por CSS/GSAP | El giro es código; solo el objeto es imagen. |
| 4 | Capa oculta: "RAUH-WELT" en aluminio remachado con destello | Portada | 1 + 3 | **Textura** de chapa de aluminio con líneas de remaches (Higgsfield, imagen) recortada con el SVG dentro del shader; el destello lento es un barrido especular en el shader | El texto generado por IA no se alinearía con el SVG; el barrido de luz lo imita el código, así que no hace falta video. |
| 5 | Tinta líquida | Portada | 1 · WebGL | Simulación de fluidos en WebGL2 propio (sin Three.js, ver nota) | Único uso de WebGL. |
| 6 | Reel (sierra, chispas, remachadora, 911 de noche) | Reel | 2 · **Cliente** | Hasta recibir metraje: montaje de cortes rápidos hecho con código a partir de las fotos de detalle (#13, #14) y el film procedural (#7) | El proceso es real: no se genera. |
| 7 | Film nocturno: 911 ancho bajo luces de sodio | Film → taller | 2 · **Cliente** / 1 provisional | Provisional: canvas 2D procedural (autopista, farolas de sodio, silueta trasera ilustrada con barra de luz roja). `<video>` listo para el MP4/HEVC del cliente (`src/data/media.ts`) | Un auto presentado en la autopista no debe generarse con IA; una ilustración no se hace pasar por foto. |
| 8 | Sonido del motor bóxer | Film | 1 · Código | Síntesis Web Audio (seis cilindros, ~900 rpm, sube con la velocidad de scroll). Se sustituye por el audio del film del cliente | Sin archivo y sin licencias. |
| 9 | Render llanta de plato hondo | Racimo, loader | 3 · Imagen | Higgsfield, fondo transparente, estudio | Objeto conceptual de puesta en escena. |
| 10 | Render aleta ensanchada azul Riviera con remaches | Racimo | 3 · Imagen | Higgsfield, transparente | Ídem. |
| 11 | Render alerón de carbono | Racimo | 3 · Imagen | Higgsfield, transparente | Ídem. |
| 12 | Render ventilador refrigerado por aire | Racimo | 3 · Imagen | Higgsfield, transparente | Ídem. |
| 12b | Render remache cromado gigante | Racimo | 3 · Imagen | Higgsfield, transparente | Ídem. |
| 13 | Detalle: canto de aleta recién cortado | Glitch, reel | 3 · Imagen | Higgsfield (sustituible por foto del cliente) | El brief lo permite si el cliente no tiene uno. |
| 14 | Detalle: puñado de remaches en una palma | Glitch, reel | 3 · Imagen | Higgsfield (mano anónima) | Ídem. |
| 15 | Taller CGI que enmarca la pantalla | Film → taller | 3 · Imagen | Higgsfield, vista frontal con la pared central libre; la pantalla y su reflejo se montan en CSS | La pantalla debe alinearse con el film: se compone en código. |
| 16 | 911 bajo lona, un solo fluorescente | Glitch | 3 · Imagen | Higgsfield. Auto totalmente cubierto, sin identificar | Puesta en escena; no se presenta como un build real. |
| 17 | 6 builds (KAZE, NOIR, SAKURA, TETSU, MIDORI, HOSHI) | BUILDS | 2 · **Cliente** | Marco reservado: placa nocturna con silueta ilustrada en SVG con el color de carrocería de cada build y la ficha de foto pendiente | Son autos reales. |
| 18 | Nakai-san trabajando sobre una aleta (panorámica) | The Man | 2 · **Cliente** | Marco reservado con ficha | Persona real: nunca se genera. |
| 19 | Línea de remaches (cuadrado pequeño) | The Man | 3 · Imagen | Recorte de #14 | Detalle sin persona. |
| 20 | Letras sueltas de "RAUH-WELT" en el racimo | Racimo | 1 · Código | Glifos del SVG #1 | Código antes que archivo. |
| — | Modelo 3D (GLB) | — | 4 · **No se usa** | — | Ninguna interacción lo exige (no hay configurador ni pieza girable). |

**Nota sobre Three.js:** la simulación de tinta está escrita en WebGL2 directo (~10 KB) en lugar de Three.js (~170 KB). El resultado visual es el mismo; el peso, mucho menor.

## Créditos

- Recursos 4, 9–16 y 19: generados con Higgsfield (GPT Image 2.5) para este proyecto. Renders conceptuales y de puesta en escena, no documentales.
- Recursos 6, 7, 17 y 18: **pendientes del cliente**. Cuando lleguen, colocarlos en `public/media/` y declararlos en `src/data/media.ts` con su crédito.
