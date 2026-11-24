/* ---------- layout: cabecera, pie y estructura de la consola ---------- */

/**
 * Emblema genérico del sistema (escudo con un libro abierto). Es un marcador de identidad
 * para el prototipo; no reproduce el escudo oficial de la Universidad, que debe aplicarse
 * según su manual de imagen institucional.
 */
function emblema(size = 40) {
  return `<svg class="emblema" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M24 3 6 9v13c0 11 7.6 19.6 18 23 10.4-3.4 18-12 18-23V9z" fill="#fff"/>
    <path d="M24 6.2 9 11.2V22c0 9.3 6.3 16.6 15 19.8 8.7-3.2 15-10.5 15-19.8V11.2z" fill="#006837"/>
    <path d="M14 17.5c3.6-.9 7-.4 10 1.6v13.4c-3-2-6.4-2.5-10-1.6zM34 17.5c-3.6-.9-7-.4-10 1.6v13.4c3-2 6.4-2.5 10-1.6z" fill="#fff"/>
    <path d="M24 19.1v13.4" stroke="#c9a227" stroke-width="1.6"/>
  </svg>`;
}

const NAV_PUBLICA = [
  ['#/', 'Inicio'],
  ['#/buscar', 'Buscar normas'],
  ['#/compilacion', 'Compilaciones'],
  ['#/glosario', 'Glosario'],
  ['#/api', 'Datos abiertos'],
];

function shellPublic(content, active) {
  return `<div class="govbar"><div class="in"><span class="govco">GOV.CO</span><span>Universidad de Córdoba · Institución de educación superior pública</span></div></div>
  <header class="header">
    <div class="in">
      <a class="brand" href="#/" aria-label="SGD-LEGAL, inicio">${emblema()}<span><small>Universidad de Córdoba · Secretaría General</small><b>Normatividad interna</b></span></a>
      <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="nav-principal">${I('menu')}<span>Menú</span></button>
      <nav class="nav" id="nav-principal" aria-label="Principal">${NAV_PUBLICA.map(
        ([h, t]) => `<a href="${h}" ${active === h ? 'class="on" aria-current="page"' : ''}>${t}</a>`
      ).join('')}
        <a class="cta" href="${S.user ? '#/consola' : '#/login'}">${I('shield')} ${S.user ? 'Ir a la consola' : 'Ingreso funcionarios'}</a></nav>
    </div>
  </header>
  <main id="app" tabindex="-1">${content}</main>
  <footer class="footer"><div class="in">
    <div><p class="footer-brand">${emblema(32)} <b>SGD-LEGAL Unicórdoba</b></p><p>Sistema de Gestión Documental Legal y Consolidación Normativa<br>Secretaría General · Proceso de Gestión Legal</p></div>
    <div><h2>Aviso legal</h2><p>Los textos consolidados tienen carácter informativo. La fe pública reside exclusivamente en el original firmado (RB-01).</p></div>
    <div><h2>Transparencia y accesibilidad</h2><p>Ley 1712 de 2014 · Resolución MinTIC 1519 de 2020<br><a href="#/api">Datos abiertos (API)</a> · Diseño conforme a WCAG 2.1 AA</p></div>
  </div><p class="footer-legal">Prototipo académico — Análisis y diseño de sistemas, 2026-2. Datos ficticios.</p></footer>`;
}

const MENU_CONSOLA = {
  bandeja: ['#/consola', 'Bandeja de trabajo', 'inbox'],
  reservar: ['#/consola/reservar', 'Reservar número', 'hash'],
  registrar: ['#/consola/registrar', 'Registrar acto', 'plus'],
  validar: ['#/consola/validar', 'Validar consolidación', 'compare'],
  admin: ['#/consola/admin', 'Usuarios y catálogos', 'users'],
  auditoria: ['#/consola/auditoria', 'Pista de auditoría', 'log'],
};

function shellConsole(content, active) {
  const u = S.user;
  const iniciales = u.nombre
    .split(' ')
    .map((x) => x[0])
    .join('');
  const pendientes = S.bandeja.filter((b) =>
    u.rol === 'Validador jurídico' ? b.estado === 'escalado' : b.estado === 'validacion'
  ).length;
  return `<header class="header header-consola"><div class="in">
      <a class="brand" href="#/consola" aria-label="Consola SGD-LEGAL, bandeja">${emblema(36)}<span><small>SGD-LEGAL · Secretaría General</small><b>Consola de gestión</b></span></a>
      <nav class="nav nav-fija" aria-label="Sesión"><a href="#/">${I('home')} <span>Portal público</span></a><a href="#/logout">${I('out')} <span>Salir</span></a></nav>
    </div></header>
  <div class="console">
    <aside class="side" aria-label="Menú de la consola">
      <div class="user"><span class="avatar" aria-hidden="true">${iniciales}</span><div><b>${esc(u.nombre)}</b><small>${esc(u.rol)}</small></div></div>
      <nav aria-label="Funciones">${ROLES[u.rol].menu
        .map((k) => {
          const [h, t, ic] = MENU_CONSOLA[k];
          const badge =
            k === 'validar' && pendientes
              ? `<span class="badge" aria-label="${pendientes} pendientes">${pendientes}</span>`
              : '';
          return `<a href="${h}" ${active === k ? 'class="on" aria-current="page"' : ''}>${I(ic)} ${t}${badge}</a>`;
        })
        .join('')}</nav>
      <div class="demo-box">
        <label for="rol-demo">Ver como (demostración)</label>
        <select id="rol-demo">${Object.keys(ROLES)
          .map((r) => `<option ${r === u.rol ? 'selected' : ''}>${r}</option>`)
          .join('')}</select>
        <button class="btn ghost sm" id="reset-demo">${I('undo')} Reiniciar demo</button>
      </div>
    </aside>
    <main id="app" tabindex="-1">${content}</main>
  </div>`;
}

/* Delegación de eventos del layout: se registra una sola vez, sobrevive a cada render. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#menu-btn');
  if (btn) {
    const abierto = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!abierto));
    $('#nav-principal').classList.toggle('open', !abierto);
  }
  if (
    e.target.closest('#reset-demo') &&
    confirm('¿Reiniciar la demostración? Se perderán los cambios hechos en esta sesión.')
  )
    reiniciarDemo();
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'rol-demo') location.hash = '#/login/' + encodeURIComponent(e.target.value);
});
