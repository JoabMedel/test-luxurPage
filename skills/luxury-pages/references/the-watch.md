# The Watch — referencia de página


Referencia explorada: [The Watch — 60fps](https://thewatch.60fps.fr/), el 3 de octubre de 2026 en Chrome mediante controles nativos. La extensión no estaba disponible para control en esta sesión. Esta referencia establece ambición de ejecución e interacción, no una estética obligatoria ni una plantilla que copiar.

## Observaciones de la navegación

- Hero con reloj protagonista, tipografía sans de escala monumental detrás del objeto, fondo claro con iluminación suave y geometría circular fina. Las etiquetas de modelo y acabado acompañan la composición sin competir con el producto.
- Selector circular de acabados: al pulsar el segmento dorado, el producto cambió de Deep Black a Pure Gold. El nombre del acabado se actualizó; la variante elegida permaneció visible en escenas posteriores.
- Cursor dibujado con contorno y halo cálido; etiqueta circular contextual «SWAP» junto al selector. En la presentación conjunta de cuatro relojes apareció «SELECT MODEL». La ayuda cambia según la zona y la acción posible.
- El scroll conserva el protagonista mientras modifica orientación, posición, escala, encuadre y relación con los textos. Se observaron frente, perfil, reverso, mecanismo interno, contornos y brazalete en primer plano.
- La narrativa alterna fondo claro y escena oscura con campo de partículas alrededor del mecanismo; letras de gran escala, texto técnico breve y líneas de construcción refuerzan profundidad y precisión.
- La parte final presenta variantes y una lista editorial de diez componentes, con nombre, numeración, categoría, peso y signo «+», antes del cierre tipográfico.

La interfaz también expone «HOLD TO EXPLORE». Se intentaron arrastre y clics de exploración, pero no se verificó de forma concluyente el comportamiento de mantener pulsado ni la apertura de cada componente. No atribuirles un resultado específico. No se verificaron móvil, teclado, movimiento reducido, métricas de rendimiento ni tecnología interna. Las partículas, el aspecto tridimensional y el seguimiento del cursor son observaciones visuales; no demuestran una librería, un shader o una técnica concreta.

## Criterios derivados para adaptar a otros proyectos

### El cursor forma parte del lenguaje de interacción

Diseñar una respuesta deliberada para las zonas interactivas de escritorio. Elegir entre foco visual, iluminación, inclinación del protagonista, desplazamiento suave, atracción de controles o cursor contextual según la marca. No aplicar todos los efectos a todas las zonas.

Separar la posición real de entrada del seguidor decorativo: el clic debe acertar inmediatamente aunque el halo tenga inercia. La capa visual no captura eventos ni tapa texto; la etiqueta contextual identifica una acción real. Definir estados de reposo, entrada, hover, presión, selección, salida y cancelación. Restablecerlos al abandonar la zona, cambiar de escena, perder foco o cancelar el gesto.

Limitar desplazamiento, inclinación y amplitud para conservar composición y lectura. Evitar que el movimiento de cámara por scroll compita con el seguimiento del puntero: aplicar el desplazamiento del puntero como ajuste acotado sobre la pose narrativa. Con puntero grueso o sin hover, retirar cursor custom y ofrecer controles táctiles visibles. El foco de teclado comunica la misma acción.

### Interacción con consecuencias visibles

Una variante cambia el producto, su etiqueta y el estado seleccionado como una sola operación. Mantener esa elección entre escenas que muestran el mismo producto. Resolver clics rápidos consecutivos sin etiquetas desincronizadas ni transiciones bloqueadas.

Si se ofrece mantener pulsado para explorar, indicar progreso y resultado, permitir cancelar al soltar y ofrecer clic/teclado/tacto equivalentes. Si se ofrece arrastre, comunicar dirección y límites; al terminar o cancelar, recuperar un estado válido sin bloquear el scroll. Estos son criterios para nuestros proyectos, no comportamientos confirmados de la referencia.

Los detalles de producto deben revelar información útil: acercamiento, pieza aislada, vista técnica o contenido contextual. Conectar lista, visual y selección cuando el concepto lo justifique. No dar apariencia interactiva a filas o zonas sin una acción implementada.

### Continuidad cinematográfica

Diseñar el recorrido como una transformación del protagonista. Usar cambios de pose, escala, luz, fondo y composición para pasar de deseo a explicación y detalle; preservar relaciones espaciales durante la transición. Alternar planos amplios y macro, lectura tranquila y momentos de impacto. Tipografía y gráficos pueden cruzar planos sin cubrir el mensaje esencial.

Para cada escena registrar: intención, pose inicial/final, disparador, rango de scroll, texto visible, respuesta al cursor, selección persistente, salida y adaptación móvil. Un momento memorable necesita una justificación de marca y los activos adecuados; no exige copiar reloj, aro, partículas, colores o textos.

### Implementación y calidad perceptible

Definir familias coherentes de duración, easing, amplitud y retardo; ajustarlas visualmente, sin inventar valores supuestamente medidos en la referencia. Actualizar animaciones continuas de forma coordinada y evitar renders de componentes por cada evento del puntero. Limpiar listeners, timelines y bucles cuando desaparece una escena; detener trabajo fuera de pantalla. Mantener un fallback legible ante falta de WebGL o medios.

Elegir fotografía, vídeo, secuencia o 3D por impacto, activos disponibles y coste. El objeto no debe flotar como un recorte incoherente: cuidar luz, reflejos, escala y fondo. El movimiento debe seguir siendo fluido durante interacción y desplazamiento simultáneos; medir en dispositivos objetivo y adaptar resolución o efectos cuando sea necesario.

## Revisión práctica antes de entregar

Recorrer en navegador el inicio, estados intermedios y cierre, hacia abajo y arriba. Probar entrada/salida del cursor, selección repetida, cambios rápidos de variante, presión/cancelación y arrastre cuando existan. Comprobar que ayudas contextuales corresponden a controles reales, que selección y visual coinciden y que no quedan halos o etiquetas atrapados al cambiar de escena.

Probar teclado, tacto y movimiento reducido con alternativas que mantengan contenido y jerarquía. Revisar lectura, contrastes y estados de foco; no replicar problemas de legibilidad por fidelidad a la referencia. Evaluar ritmo y continuidad además de capturas estáticas. La entrega identifica qué interacciones se implementaron y cuáles se verificaron realmente.
