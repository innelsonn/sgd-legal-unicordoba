/* ---------- enrutador ----------
 * Enrutado por hash (#/ruta?param=valor) para que el prototipo funcione abriendo
 * index.html directamente, sin servidor. Cada ruta declara su vista, su función de
 * enlace de eventos (bind) y el título del documento.
 */

/** Rutas públicas: [vista, bind, título]. */
const RUTAS_PUBLICAS = {
  '': [() => vHome(), bindHome, 'Inicio'],
  buscar: [(p) => vBuscar(p.params), bindBuscar, 'Buscar normas'],
  norma: [
    (p) => vNorma(p.parts[1]),
    (p) => bindNorma(p.parts[1]),
    (p) => (norma(p.parts[1]) ? titulo(norma(p.parts[1])) : 'Norma'),
  ],
  glosario: [() => vGlosario(), null, 'Glosario'],
  compilacion: [() => vCompilacion(), bindCompilacion, 'Compilaciones temáticas'],
  api: [() => vApi(), null, 'Datos abiertos y API'],
  login: [() => vLogin(), bindLogin, 'Ingreso de funcionarios'],
};

/** Subrutas de la consola (requieren sesión y permiso del rol). */
const RUTAS_CONSOLA = {
  bandeja: [() => vBandeja(), bindBandeja, 'Bandeja de trabajo'],
  reservar: [() => vReservar(), bindReservar, 'Reservar número'],
  registrar: [() => vRegistrar(), bindRegistrar, 'Registrar acto'],
  validar: [(p) => vValidar(p.parts[2]), (p) => bindValidar(p.parts[2]), 'Validar consolidación'],
  auditoria: [() => vAuditoria(), bindAuditoria, 'Pista de auditoría'],
  admin: [() => vAdmin(), bindAdmin, 'Usuarios y catálogos'],
};

/** Ruta de inicio de cada rol tras autenticarse. */
const INICIO_ROL = {
  Auditor: '#/consola/auditoria',
  'Validador jurídico': '#/consola/validar/CSU-ACU-2026-039',
};

let lastRoute = '';

function parseHash() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  return { path, parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
}

function vNoEncontrada() {
  return `<div class="card vacio"><h1>Página no encontrada</h1><p class="muted">La dirección no corresponde a ninguna sección del portal.</p><a class="btn" href="#/">${I('home')} Volver al inicio</a></div>`;
}

function render() {
  const p = parseHash();
  const [seccion = ''] = p.parts;
  let ruta = null;
  let html;

  if (seccion === 'login' && p.parts[1]) {
    // Inicio de sesión simulado con el rol elegido (en producción: OpenID Connect con el IdP institucional).
    const rol = decodeURIComponent(p.parts[1]);
    if (!ROLES[rol]) return void (location.hash = '#/login');
    S.user = { rol, ...ROLES[rol] };
    guardarSesion();
    toast(`Sesión iniciada como ${rol}`, 'shield');
    return void (location.hash = INICIO_ROL[rol] || '#/consola');
  }
  if (seccion === 'logout') {
    S.user = null;
    guardarSesion();
    return void (location.hash = '#/');
  }

  if (seccion === 'consola') {
    if (!S.user) return void (location.hash = '#/login');
    const sub = p.parts[1] || 'bandeja';
    ruta = RUTAS_CONSOLA[sub];
    if (!ruta) html = shellConsole(vNoEncontrada(), '');
    else if (!ROLES[S.user.rol].menu.includes(sub)) {
      ruta = null;
      html = shellConsole(
        `<div class="card vacio"><h1>${I('ban')} Acceso no autorizado</h1><p>El rol <b>${esc(S.user.rol)}</b> no tiene permiso para esta función (principio de mínimo privilegio, RNF-03).</p><a class="btn" href="#/consola">Ir a mi bandeja</a></div>`,
        ''
      );
    }
  } else {
    ruta = RUTAS_PUBLICAS[seccion];
    if (!ruta) html = shellPublic(vNoEncontrada());
  }

  // Al entrar a una ficha distinta se reinicia su estado de visualización.
  if (seccion === 'norma' && lastRoute !== p.path) reiniciarFicha();

  const cambioDeRuta = p.path !== lastRoute;
  if (ruta) html = ruta[0](p);
  $('#root').innerHTML = html;
  if (ruta && ruta[1]) ruta[1](p);

  const tituloVista = ruta ? (typeof ruta[2] === 'function' ? ruta[2](p) : ruta[2]) : 'Página no encontrada';
  document.title = `${tituloVista} · SGD-LEGAL Unicórdoba`;

  if (cambioDeRuta) {
    window.scrollTo(0, 0);
    // Accesibilidad: en una SPA hay que mover el foco al contenido nuevo para lectores de pantalla.
    if (lastRoute) $('#app')?.focus({ preventScroll: true });
    lastRoute = p.path;
  }
}

window.addEventListener('hashchange', render);
cargarSesion();
render();
