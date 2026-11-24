# Historial de cambios

## 2.0.0 — Revisión de calidad, diseño y documentación

### Corregido
- La matriz de permisos solo mostraba una columna; ahora tiene una por rol, desde una fuente única.
- «Verificar integridad» respondía siempre OK; ahora recalcula la cadena de huellas.
- Aprobar una consolidación no actualizaba la ficha pública; ahora aplica la versión, la nota, las relaciones y crea la ficha del acto.
- El comparador del validador mostraba siempre el mismo artículo; ahora usa la propuesta de cada caso.
- Anular un número no tenía efecto; ahora se retira de los reservados y nunca se reasigna (RB-03).
- El ejemplo de registro usaba una fecha posterior a «hoy»; se corrigió y se agregó la validación de fecha no futura.
- El resaltado de la búsqueda fallaba sin tildes.
- La nota decía «por el Artículos 1 y 4».
- Los diálogos no atrapaban el foco y dejaban registrado el listener de Escape.

### Añadido
- Accesos por tarea en la portada, fragmento de coincidencia en los resultados, orden por fecha y filtros activos visibles.
- Resumen de vigencia en la ficha, con la última afectación y el conteo de afectaciones.
- Bandeja en modo tablero y lista por urgencia, y filtro «Solo los asignados a mí».
- Simulación de manipulación en la auditoría, para demostrar la detección.
- Persistencia de la demo en `sessionStorage` y botón «Reiniciar demo».
- 27 pruebas de extremo a extremo, con auditoría de accesibilidad (axe-core).
- ESLint, Prettier, EditorConfig, y flujos de CI y de GitHub Pages.
- Documentación: arquitectura, diseño, trazabilidad, guion de demo y capturas.

### Cambiado
- Código dividido en módulos por responsabilidad (datos, utilidades, estado, dominio, layout, vistas, enrutador).
- Enrutador con tabla de rutas, título por vista, foco accesible y página 404.
- Hoja de estilos reorganizada como sistema de diseño con tokens; tipografía serif para el texto normativo.
- Cabecera institucional en dos niveles con emblema SVG y menú móvil accesible.

## 1.0.0 — Primera versión navegable
- Portal público, ficha de norma, consola con registro, validación, auditoría y administración.
