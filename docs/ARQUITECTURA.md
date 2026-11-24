# Arquitectura del prototipo

## Objetivo y criterios

El prototipo sirve para **demostrar** el comportamiento de SGD-LEGAL ante usuarios y evaluadores, no para entrar en producción. Por eso la tecnología se eligió con estos criterios:

1. **Cero instalación para verlo.** Se abre con doble clic en `index.html`, sin compilar ni levantar servidores.
2. **Fácil de leer y modificar** por un equipo académico.
3. **Fiel a los requisitos**: las reglas de negocio se ejecutan de verdad (no son pantallas estáticas).
4. **Verificable**: pruebas automáticas de extremo a extremo y de accesibilidad.

En consecuencia, se usan HTML, CSS y JavaScript estándar (ES2022), **sin frameworks ni empaquetador**. La arquitectura propuesta en el documento para el sistema real (Python, PostgreSQL, integración con WordPress, Tabla 42) no se ve afectada: el prototipo solo representa la capa de presentación y simula los servicios.

## Organización del código

Los scripts se cargan en orden desde `index.html` y comparten el ámbito global de forma deliberada. Así se evitan los módulos ES, que no funcionan al abrir el archivo con `file://`. Cada archivo tiene una única responsabilidad:

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Datos | `js/data.js` | Catálogos (estados, órganos, tipos, temas), normas con sus versiones, bandeja y auditoría iniciales |
| Utilidades | `js/utils.js` | `esc()` (escape HTML contra inyección), iconos SVG, formato de fechas, `modal()` accesible, `toast()`, hash de demostración, descargas |
| Estado | `js/state.js` | Objeto `S` con el estado mutable de la demo, roles, `audit()` y persistencia en `sessionStorage` |
| Dominio | `js/normas.js` | Reglas del modelo normativo: versión vigente a una fecha (`verAt`), texto consolidado (`renderTexto`), notas de vigencia, comparación palabra a palabra (`diffWords`, LCS) y aplicación de una publicación (`aplicarPublicacion`) |
| Presentación | `js/layout.js` | Cabecera institucional, pie y estructura de la consola |
| Vistas | `js/views/*.js` | Una función `vX()` que devuelve HTML y una `bindX()` que conecta los eventos |
| Navegación | `js/router.js` | Tabla de rutas, control de acceso por rol, título del documento y gestión del foco |

### Patrón vista + enlace

Cada pantalla se compone de dos funciones puras en lo posible:

```js
function vReservar() { return shellConsole(`…html…`, 'reservar'); } // qué se ve
function bindReservar() { /* listeners y lógica de interacción */ }   // cómo responde
```

El enrutador llama primero a la vista, inserta el HTML y luego llama al enlace. Para re-pintar tras un cambio de estado basta con invocar `render()`. Es un modelo sencillo, parecido a un «renderizado completo» de React, adecuado para el tamaño del prototipo.

### Enrutado

Se usa el hash de la URL (`#/norma/CSU-ACU-2004-004?tab=comparar`), lo que permite enlazar cualquier vista, usar los botones atrás y adelante del navegador y funcionar sin servidor. `router.js` declara las rutas en dos tablas (`RUTAS_PUBLICAS` y `RUTAS_CONSOLA`) y aplica el principio de mínimo privilegio (RNF-03): una función de la consola solo se muestra si figura en el menú del rol.

### Flujo de una publicación

```
Registrador ── asistente (registro.js) ──► caso en S.bandeja con «propuesta»
                                              │  estado: validacion
Validador ──── validacion.js ── Aprobar ──────┤
                                              ▼
                         aplicarPublicacion(caso)   (normas.js)
                         · cierra la versión vigente de la unidad (hasta = fecha)
                         · agrega la nueva versión con su nota de vigencia
                         · registra la afectación en ambos sentidos
                         · crea la ficha pública del acto modificatorio
                                              │
                                              ▼
                         Ficha pública actualizada (publico.js)
```

La doble temporalidad (RF-14) se modela con versiones `{ desde, hasta, texto, nota }` por unidad; `verAt(unidad, fecha)` resuelve qué texto regía en una fecha. La consulta por cohorte (RF-24) usa la nota de transición para devolver la versión previa a los estudiantes que ingresaron antes.

### Persistencia

`state.js` guarda en `sessionStorage` el usuario, la bandeja, la auditoría, los números reservados y anulados, las suscripciones y la lista de actos publicados. Al recargar se reaplican las publicaciones sobre los datos iniciales. Toda lectura y escritura está protegida con `try/catch`: si el almacenamiento no está disponible, la demo sigue en memoria.

## Convenciones

- **Seguridad:** todo dato dinámico que se inserta en HTML pasa por `esc()`. No hay `innerHTML` con texto del usuario sin escapar ni manejadores `onclick` en línea.
- **Accesibilidad:**
  - Estructura y elementos:
    - HTML semántico (`main`, `nav`, `dl`, `fieldset`, `table` con `scope`).
    - Etiqueta en cada campo.
    - Estados comunicados con icono y texto, nunca solo con color (RI-03).
  - Patrones ARIA y teclado:
    - Pestañas con `role="tab"` y navegación con flechas.
    - Diálogos que atrapan el foco y lo devuelven al cerrarse.
    - Foco movido al contenido en cada cambio de vista.
    - Regiones `aria-live` para los mensajes.
- **Estilo de código:** Prettier (ancho 120, comillas simples) y ESLint (`eqeqeq`, `no-var`, `prefer-const`, `no-unused-vars`). Nombres de dominio en español, coherentes con el documento de requisitos.
- **CSS:** tokens en `:root` (colores, radios, sombras, tipografías), secciones numeradas, clases utilitarias mínimas y componentes reutilizables. No hay estilos en línea, salvo valores calculados (ancho de las barras de plazo).

## Pruebas

`tests/e2e.test.js` usa el corredor nativo de Node (`node:test`) y Playwright para manejar Chromium. Cada prueba arranca un contexto limpio, abre `index.html` y recorre la interfaz como lo haría un usuario. La prueba de accesibilidad inyecta axe-core y falla ante cualquier violación grave o crítica de WCAG 2.1 AA. En GitHub Actions se ejecutan con `npm run check`.
