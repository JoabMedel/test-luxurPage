# RWB — Inventario de recursos visuales

Decidido antes de producir. Orden de preferencia: **1 código → 2 material existente → 3 Higgsfield → 4 Three.js/3D**. Cada recurso se queda en el primer nivel que funciona.

Material del cliente recibido: fotos de los 6 builds (2026-10-05). Todo lo que debe ser **real** (autos terminados, Akira Nakai, taller real, proceso real) queda como **marco reservado** con su ficha técnica, nunca generado con IA. Tampoco se toman fotos de la web: los builds de esta página (KAZE, NOIR…) no se corresponden con fotos con licencia comercial verificable y presentar otro auto como ese build sería falso. Excepción autorizada por el cliente (2026-10-09): el film nocturno (#7) se genera con Higgsfield como film de ambiente, sin presentarlo como un build concreto.

| # | Recurso | Sección | Nivel | Origen / solución | Por qué |
|---|---|---|---|---|---|
| 1 | Logo "RAUH-Welt" (portada y cierre) | Portada, cierre | 1 · Código | Trazado SVG generado por `tools/build-logo.mjs` → `src/lib/logo.ts` a partir de **Ultra** (Astigmatic, SIL OFL 1.1), la alternativa libre más fiel al slab serif pesado del logo original (cuya tipografía no tiene licencia libre). Debajo, línea en japonés en Zen Old Mincho 900 (OFL): «ラウ・ヴェルト・ベグリフ» / «荒々しい世界という概念» | El trazado se comparte con la máscara WebGL, así que la tinta sigue alineada al píxel. |
| 1b | Abreviatura "RWB" (loader, racimo de servicios y menú) | Loader, racimo, menú | 1 · Código | `src/lib/wordmark.ts`: "RWB" dibujado a medida según la referencia del cliente (extendido, ultranegro, itálica 14°, contraformas en píldora) | El loader dibuja el trazo de la misma geometría; en el racimo, las tres iniciales flotan entre las piezas. |
| 2 | "RWB" del loader (trazo + separación) | Loader | 1 · Código | Misma geometría SVG, `stroke-dashoffset` + GSAP | Dibujo y separación son movimiento puro. |
| 3 | Llanta girando en el loader | Loader | 1 + 3 | Render de la llanta (#9) girado por CSS/GSAP | El giro es código; solo el objeto es imagen. |
| 4 | Capa oculta: "RAUH-WELT" en aluminio remachado con destello | Portada | 1 + 3 | **Textura** de chapa de aluminio con líneas de remaches (Higgsfield, imagen) recortada con el SVG dentro del shader; el destello lento es un barrido especular en el shader | El texto generado por IA no se alinearía con el SVG; el barrido de luz lo imita el código, así que no hace falta video. |
| 5 | Tinta líquida | Portada | 1 · WebGL | Simulación de fluidos en WebGL2 propio (sin Three.js, ver nota) | Único uso de WebGL. |
| 6 | Reel: encuentro nocturno de builds RWB (911 amarillo, verde, menta y negro en la calle, con público) | Reel | 2 · **Cliente** | Metraje del cliente (2026-10-08, 75 s, sin audio). Llegó como grabación de pantalla de macOS: se recorta el cuadro 16:9, se restituye su cadencia de 23,976 fps y se codifica en AV1/HEVC 10 bit + H.264 (`tools/convert-video.mjs reel` → `public/media/reel/`). Loop silencioso; el póster es el primer cuadro. El montaje con código (#13, #14, #7) queda como respaldo si `MEDIA.reel` es `null` | El material es real: no se genera. |
| 6b | Grano de película sobre el reel | Reel | 1 · Código | Mosaico de ruido gaussiano de 256 px generado en `scenes.ts` (gris medio, sin archivo), en `overlay` al 40 % y desplazado 24 veces por segundo solo con `transform`. Se congela con el vídeo en pausa y queda estático con movimiento reducido | Textura de película sin tocar el máster codificado (el ruido en el vídeo dispararía el bitrate) y sin coste en el hilo principal. |
| 7 | Film nocturno: RWB 964 ancho, blanco Grand Prix, visto desde atrás en una autopista elevada bajo farolas de sodio | Film → taller | 3 · Higgsfield (**autorizado por el cliente**, 2026-10-09) | Fotograma clave con GPT Image 2.5, animado con Kling 2.6 (imagen a vídeo, 10 s, sin audio; prompt de coche "sobre raíles", sin suspensión ni vibración, con la velocidad solo en el entorno; la mejor de dos variantes por rebote medido). **Sin retoques de movimiento**: estabilizar o recolocar el coche por software añadía temblor y un recuadro fantasma, así que el vídeo es el de Higgsfield tal cual, recortado a un loop de 6,9 s (fotogramas 71→237, corte seco donde el plano casi se repite, sin fundido) y reescalado a 1920×1080. Máster en `assets-src/film-master.mp4` (original: `film-kling.mp4`), codificado con `tools/convert-video.mjs film` → `public/media/film/`. Velocidad constante y reflejo del suelo desde el vídeo. La autopista en canvas (código) queda como respaldo si el vídeo falla o `MEDIA.film` es `null` | Film de ambiente, no un build documentado: color distinto de los seis builds, sin matrícula legible, sin logos ni escudo. |
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
| 17 | 6 builds (KAZE, NOIR, SAKURA, TETSU, MIDORI, HOSHI) | BUILDS | 2 · **Cliente** | Los 6 builds tienen foto entregada por el cliente (`public/media/builds/`), con gradación nocturna por CSS. `CarPlate.astro` queda como respaldo si falta alguna foto | Son autos reales. |
| 18 | Nakai-san trabajando sobre una aleta (panorámica) | The Man | 2 · **Cliente** | Marco reservado con ficha | Persona real: nunca se genera. |
| 19 | Línea de remaches (cuadrado pequeño) | The Man | 3 · Imagen | Recorte de #14 | Detalle sin persona. |
| 20 | Iniciales sueltas "R", "W", "B" en el racimo | Racimo | 1 · Código | Glifos de #1b | Código antes que archivo. |
| 21 | Detalles japoneses: kanji verticales (宣言, 路上, 職人, 幅は個性に従う), kanji de cada build (風 黒 桜 鉄 緑 星), 千葉, bloque 空冷・手切り y katakana en el scramble | Varias | 1 · Código | Texto en Zen Old Mincho 900 (OFL), gris, `aria-hidden` | Rasgos culturales sutiles sin imágenes. |
| 22 | Sello hanko 荒 | The Man, créditos | 1 · Código | `src/components/Hanko.astro` (SVG con borde de tinta irregular) | Firma del artesano. |
| 23 | Sol naciente (hinomaru) | Cierre | 1 · Código | Disco CSS que sube tras el logo con el scroll | Se evita deliberadamente el sol con rayos (kyokujitsu-ki) por su carga histórica fuera de Japón. |
| — | Modelo 3D (GLB) | — | 4 · **No se usa** | — | Ninguna interacción lo exige (no hay configurador ni pieza girable). |

**Color:** además de las carrocerías y el naranja sodio, se reserva un único bermellón 朱 (`--shu`, #D23B2A) para el sol y el sello.

**Nota sobre Three.js:** la simulación de tinta está escrita en WebGL2 directo (~10 KB) en lugar de Three.js (~170 KB). El resultado visual es el mismo; el peso, mucho menor.

## Créditos

- Recursos 4, 9–16 y 19: generados con Higgsfield (GPT Image 2.5) para este proyecto. Renders conceptuales y de puesta en escena, no documentales.
- Recurso 17 · KAZE: foto de Shanket Bhikha para StanceAutoMag, entregada por el cliente el 2026-10-05. **Pendiente: confirmar licencia de uso comercial** (la foto lleva marca de agua del medio).
- Recurso 17 · NOIR: foto entregada por el cliente el 2026-10-05, sin marca de agua. **Pendiente: autor/crédito y licencia de uso comercial** (el crédito no se muestra en la tarjeta hasta confirmarlo).
- Recurso 17 · SAKURA: foto entregada por el cliente el 2026-10-05, sin marca de agua. **Pendiente: autor/crédito y licencia de uso comercial.**
- Recurso 17 · TETSU: foto entregada por el cliente el 2026-10-05, sin marca de agua. **Pendiente: autor/crédito y licencia de uso comercial.**
- Recurso 17 · MIDORI: foto entregada por el cliente el 2026-10-05, sin marca de agua. **Pendiente: autor/crédito y licencia de uso comercial.**
- Recurso 17 · HOSHI: foto entregada por el cliente el 2026-10-05, sin marca de agua. **Pendiente: autor/crédito y licencia de uso comercial.**
- Recurso 6 · Reel: metraje entregado por el cliente el 2026-10-08 como grabación de pantalla (ReplayKit). **Pendiente: autor/crédito, licencia de uso comercial y, si existe, el archivo original**: la grabación llega a resolución de pantalla, con franjas y cadencia irregular que hubo que reconstruir.
- Recurso 7 · Film: generado con Higgsfield (GPT Image 2.5 + Kling 2.6) para este proyecto, con autorización del cliente (2026-10-09). Film de ambiente, no documental.
- Recurso 18: **pendiente del cliente**. Cuando llegue, colocarlo en `public/media/` y declararlo en `src/data/media.ts` con su crédito.
