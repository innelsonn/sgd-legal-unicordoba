# Decisiones de diseño

Este documento explica cómo los hallazgos del *Análisis y especificación de requisitos v3.0* se convirtieron en decisiones visuales y de interacción, y recoge la revisión de diseño hecha sobre la primera versión del prototipo.

## 1. Del problema a la interfaz

| Hallazgo del documento | Decisión de diseño |
|---|---|
| P-01: el Acuerdo 004 de 2004 acumula reformas sin un texto unificado | La ficha abre en el **texto vigente consolidado**, con una nota bajo cada artículo afectado que cita el acto y el artículo de origen (RF-15, RB-06) |
| P-02: ninguna entrada del portal indica si la norma está vigente | El **estado de vigencia** aparece en todos los resultados, en la cabecera de la ficha y en un recuadro propio con la última afectación. Hay 7 estados con icono, texto y color (RI-03) |
| P-04: el portal no tiene buscador | El buscador ocupa el centro de la portada. La búsqueda de texto completo **ignora las tildes** y muestra el **fragmento** del artículo donde está la coincidencia, porque muchas veces no está en el título |
| P-08: las dudas de vigencia dependen del conocimiento tácito de los funcionarios | Historial con línea de tiempo, comparador de versiones y consulta «a una fecha», que convierten ese conocimiento en datos consultables |
| RB-01: la fe pública reside solo en el original firmado | **Leyenda de carácter informativo siempre visible** en la ficha, en las descargas y en las compilaciones. El original firmado se destaca como el documento principal en la pestaña *Documentos* |
| OBS-15: no llamar «certificado» a la constancia | La constancia usa «código de verificación» y dice expresamente que no certifica vigencia |
| RB-11 y E-10: la norma aplicable depende de la cohorte | Campo «Fecha de ingreso del estudiante» en la ficha y acceso directo «¿Qué reglamento me aplica?» en la portada |
| Prueba de tareas T1–T4 (RNF-06): usuarios no expertos | Portada organizada por **tareas** («¿Esta norma sigue vigente?», «¿Qué cambió y cuándo?»…) en lugar de por estructura orgánica; glosario enlazado desde la ficha |
| P-05: mediana de 16,5 días entre expedición y publicación | Bandeja con plazo por etapa, barras de progreso, indicador de casos vencidos y vista «Lista por urgencia» |
| P-06: números duplicados y fechas inconsistentes | Validación en línea en el registro: bloquea el identificador repetido o no reservado y advierte, pidiendo justificación, cuando la fecha difiere de la sesión (RF-05) |
| RB-12 y E-06: desconfianza en la automatización | Las afectaciones sugeridas se presentan como **propuestas** con borde punteado. Se confirman una por una y se puede deshacer |
| RES-05: no hay personal adicional | Autocompletado de identificador, sugerencias de afectación y generación automática de notas y consolidación, para reducir el trabajo manual |

## 2. Identidad institucional

- **Paleta:** verde institucional `#006837` como color principal y dorado `#c9a227` como acento (subrayado de la navegación activa, bordes de leyendas, foco del teclado). El rojo, ámbar, azul y gris se reservan para los estados.
- **Barra GOV.CO** en la parte superior, como corresponde a una entidad pública colombiana (Resolución MinTIC 1519 de 2020).
- **Tipografía:**
  - *Source Sans 3* para la interfaz.
  - *Source Serif 4* para el texto normativo, los títulos de las normas y la constancia. La serif diferencia visualmente «el documento» de «la herramienta» y da un tono jurídico formal.
- **Emblema:** un escudo genérico con un libro abierto. Es un marcador para el prototipo; la implementación real debe usar el escudo y el manual de identidad oficial de la Universidad.
- **Encabezado en dos niveles:** «Universidad de Córdoba · Secretaría General» y debajo «Normatividad interna». Ubica al usuario dentro de la institución sin competir con el portal principal.

## 3. Revisión de diseño de la versión 1 y cambios aplicados

| Problema detectado | Impacto | Cambio en la versión 2 |
|---|---|---|
| La portada tenía cifras de vanidad («13 normas») en la posición más visible | Ocupaban el lugar de las acciones útiles | Se pasaron a una franja discreta al final. En su lugar aparecen accesos por tarea |
| Los resultados de búsqueda no explicaban por qué aparecía una norma cuando la coincidencia estaba en el cuerpo | Confusión: «¿dónde dice “reingreso”?» | Fragmento resaltado del artículo, con aviso cuando la coincidencia está en una versión ya derogada |
| El resaltado fallaba al buscar sin tildes | Los usuarios escriben sin tildes | Resaltado sobre el texto normalizado que marca la palabra original |
| Los temas se elegían con un `select multiple` (Ctrl + clic) | Poco intuitivo, sobre todo en móvil | Selección con casillas tipo «chip» |
| El comparador del validador mostraba siempre el mismo artículo | No reflejaba el caso elegido | El comparador se genera a partir de la propuesta de cada caso |
| Aprobar decía «la ficha se actualizó», pero no cambiaba nada | Incoherencia en la demostración | La publicación aplica de verdad la nueva versión, la nota, las relaciones y crea la ficha del acto |
| La matriz de permisos solo pintaba una columna | Información incorrecta | Se genera desde una fuente única (`PERMISOS`) con una columna por rol |
| «Verificar integridad» siempre respondía OK | No demostraba RF-33 | Recalcula la cadena de huellas. El botón «Simular manipulación» demuestra la detección |
| El selector de rol de la demo se mezclaba con la navegación real | Confundía la demo con la aplicación | Recuadro separado «Ver como (demostración)», con botón para reiniciar la demo |
| Anular un número no tenía efecto | RB-03 sin demostrar | La anulación saca el número de los reservados y nunca lo reasigna. La tabla de números es dinámica |
| El ejemplo de registro usaba una fecha posterior a «hoy» | La publicación no se veía en el texto vigente | Datos corregidos y validación: la fecha de expedición no puede ser futura (RB-02) |
| En móvil los indicadores de la consola ocupaban media pantalla | Exceso de desplazamiento | Rejilla de 2 columnas en pantallas estrechas |
| La barra de fecha de la ficha quedaba desalineada | Apariencia descuidada | El texto de ayuda pasa a una línea propia |
| El texto «por el Artículos 1 y 4» | Error gramatical en las notas | Concordancia automática («por los Artículos…») |
| Los diálogos no atrapaban el foco y el listener de Escape quedaba registrado | Accesibilidad y fugas de memoria | Modal accesible: foco atrapado, devuelto al cerrar, sin fugas |
| La vista no cambiaba el título del documento ni movía el foco | Lectores de pantalla desorientados | Título por vista y foco en el contenido principal en cada navegación |
| Al recargar se perdía toda la demo | Mala experiencia al presentar | Persistencia en `sessionStorage` y botón «Reiniciar demo» |

## 4. Accesibilidad (RNF-07, RI-03)

- Contraste mínimo de 4,5:1 en textos, verificado con axe-core.
- Estados comunicados con **icono + texto + color**, nunca solo con color.
- Navegación completa con el teclado:
  - enlace «Saltar al contenido»;
  - foco visible dorado;
  - pestañas con flechas, Inicio y Fin;
  - diálogos que se cierran con Escape.
- Formularios con etiqueta en cada campo, errores asociados (`aria-describedby`, `aria-invalid`) y mensajes anunciados (`aria-live`).
- Respeto de `prefers-reduced-motion`.
- Diseño adaptable desde 360 px sin desplazamiento horizontal (RNF-08). Con el menú plegable y los filtros colapsables, en móvil se prioriza el contenido.

## 5. Posibles mejoras futuras

- Modo de alto contraste y control de tamaño de letra.
- Búsqueda dentro del texto de una norma, con salto entre coincidencias.
- Vista de impresión de la ficha completa con la leyenda en cada página.
- Validar el prototipo con la prueba de tareas T1–T4 del Anexo B, aplicada a usuarios reales.
