# Trazabilidad: requisito → pantalla → prueba

Relaciona los requisitos del documento (Tablas 28 a 31) con el lugar del prototipo donde se demuestran y con la prueba automática que los verifica (`tests/e2e.test.js`).

Convención: **✔** se demuestra con comportamiento real · **◐** simulado (sin servidor) · **—** fuera del alcance del prototipo.

## Requisitos funcionales

| Req. | Descripción breve | Dónde se ve | Estado | Prueba |
|---|---|---|---|---|
| RF-01 | Reservar número consecutivo | Consola › Reservar número | ✔ | «un número anulado no se reasigna» |
| RF-02 | Registrar acto con datos obligatorios | Registrar acto › paso 1 | ✔ | «el registro bloquea un número…» |
| RF-03 | Identificador persistente | Registrar acto › vista previa del identificador; ficha › Documentos | ✔ | — |
| RF-04 | Original firmado y versión nativa con cotejo | Registrar acto › paso 2 | ◐ | «flujo completo…» |
| RF-05 | Bloqueo y advertencia de coherencia | Registrar acto › paso 1 | ✔ | «el registro bloquea un número…» |
| RF-06 | Anexos versionados | Registrar acto › paso 2; ficha › Historial | ◐ | — |
| RF-07 | Estructurar unidades | Registrar acto › paso 3 | ◐ | «flujo completo…» |
| RF-08 | Carga de normas troncales | Etiqueta «Norma troncal» en portada y ficha | — | — |
| RF-09 | Registrar afectaciones (11 tipos) | Registrar acto › paso 4 | ✔ | «flujo completo…» |
| RF-10 | Soporte formal para afectaciones no expresas | Registrar acto › paso 4 (modo ≠ expresa) | ✔ | — |
| RF-11 | Sugerir afectaciones por patrones | Registrar acto › paso 4 | ◐ | «flujo completo…» |
| RF-12 | Concordancias | Ficha › Relaciones | ✔ | — |
| RF-13 | Propuesta de consolidación | Registrar › paso 5; Validar | ✔ | «flujo completo…» |
| RF-14 | Doble temporalidad / versiones | Ficha › Historial | ✔ | «consultar a una fecha…» |
| RF-15 | Notas de vigencia automáticas | Ficha › Texto vigente | ✔ | «las notas de vigencia citan…» |
| RF-16 | Enlaces en ambos sentidos | Ficha › Relaciones | ✔ | «las relaciones se muestran en ambos sentidos» |
| RF-17 | Estados del flujo y responsables | Consola › Bandeja | ✔ | «flujo completo…» |
| RF-18 | Validación en dos niveles | Consola › Validar | ✔ | «escalar a Jurídica exige un motivo…» |
| RF-19 | Publicar con fecha automática y sincronizar | Validar › Aprobar | ✔ | «flujo completo…» |
| RF-20 | Redirecciones y aviso de vigencia | Ficha › Documentos (dirección permanente) | ◐ | «toda ficha muestra el estado…» |
| RF-21 | Búsqueda por texto y facetas | Buscar normas | ✔ | «la búsqueda ignora tildes…», «los filtros…» |
| RF-22 | Ficha con estado y texto vigente | Ficha | ✔ | «toda ficha muestra el estado…» |
| RF-23 | Consultar a una fecha | Ficha › Texto vigente | ✔ | «consultar a una fecha…» |
| RF-24 | Consultar por cohorte | Ficha › Fecha de ingreso | ✔ | «la consulta por cohorte…» |
| RF-25 | Comparar versiones | Ficha › Comparar versiones | ✔ | «el comparador resalta…» |
| RF-26 | Descargar original y consolidado | Ficha › Documentos | ◐ (HTML, JSON, XML reales) | — |
| RF-27 | Constancia de consulta | Ficha › Documentos | ✔ | «la constancia de consulta no se presenta como certificación» |
| RF-28 | Glosario | Glosario; enlace en la portada | ✔ | «todas las rutas cargan…» |
| RF-29 | Plantilla de concordancia | Ficha › Documentos | ◐ | — |
| RF-30 | Compilaciones temáticas | Compilaciones | ✔ | «todas las rutas cargan…» |
| RF-31 | Alertas por correo | Ficha › Recibir alertas | ◐ | «la suscripción valida el correo…» |
| RF-32 | Usuarios y roles con cuenta institucional | Ingreso funcionarios; Consola › Usuarios | ◐ | «un rol sin permiso no accede…», «la matriz de permisos…» |
| RF-33 | Pista de auditoría encadenada | Consola › Pista de auditoría | ✔ | «la verificación de la cadena detecta una manipulación» |
| RF-34 | Catálogos parametrizables | Consola › Usuarios y catálogos | ✔ | — |
| RF-35 | API REST | Datos abiertos | ◐ | — |

## Reglas de negocio

| Regla | Dónde se aplica | Prueba |
|---|---|---|
| RB-01 Fe pública solo en el original | Leyenda en ficha, descargas, compilaciones y constancia | «toda ficha muestra…» |
| RB-02 Nada se publica sin estar numerado, fechado y firmado | Validación de fecha no futura; lista de verificación | «flujo completo…» |
| RB-03 Número anulado no se reasigna | Reservar número | «un número anulado no se reasigna» |
| RB-04 Solo las afectaciones expresas salen del texto | Paso 4 del registro | — |
| RB-05 La cláusula derogatoria general no afecta unidades | Aviso en el paso 4 | — |
| RB-06 La nota cita acto y artículo | `notaHTML()` | «las notas de vigencia citan…» |
| RB-08 Norma transitoria pierde vigencia | Estado «Sin efectos por vencimiento» (Acuerdo 051 de 2024) | — |
| RB-09 Fecha de publicación automática | Validar › Aprobar; evento en la auditoría | «flujo completo…» |
| RB-11 Norma aplicable según la cohorte | Ficha › Fecha de ingreso | «la consulta por cohorte…» |
| RB-12 Sin aplicar sugerencias sin confirmación | Paso 4: no deja avanzar con sugerencias pendientes | «flujo completo…» |

## Requisitos no funcionales y de interfaz

| Req. | Cómo se atiende | Prueba |
|---|---|---|
| RNF-03 Mínimo privilegio | Menú y rutas por rol en `router.js` | «un rol sin permiso no accede…» |
| RNF-04 Integridad del original | Huella mostrada y «verificada» en cada descarga | — |
| RNF-06 Usabilidad | Accesos por tarea, glosario, fragmentos en la búsqueda | — |
| RNF-07 WCAG 2.1 AA | Ver `DISENO.md` §4 | «sin violaciones de accesibilidad graves o críticas» |
| RNF-08 Adaptable desde 360 px | CSS responsive | «sin desplazamiento horizontal a 360 px», «el menú móvil…» |
| RNF-09 Formatos abiertos | Descargas HTML, JSON y Akoma Ntoso | — |
| RI-01 Portal con buscador y ficha por secciones | Portada y ficha con pestañas | — |
| RI-02 Bandeja por estado y comparador de dos columnas | Bandeja (tablero y lista) y Validar | «flujo completo…» |
| RI-03 No depender solo del color; teclado; contraste | Estados con icono y texto; pestañas con flechas | «las pestañas se recorren con las flechas…» |
| RI-04 SSO institucional | Pantalla de ingreso (simulada) | — |
| RI-05 Radicado de Orfeo con validación de formato | Registrar acto › paso 1 | — |
