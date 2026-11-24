/* ---------- pista de auditoría (RF-33, RNF-05) y administración (RF-32, RF-34) ---------- */

/**
 * Encadena los eventos: la huella de cada uno se calcula sobre su contenido más la huella del
 * anterior. Alterar cualquier evento rompe todas las huellas posteriores (registro a prueba de
 * manipulación). En producción se usaría SHA-256 en el servidor; aquí basta un hash de demostración.
 */
function cadenaAuditoria(eventos) {
  let previa = '0'.repeat(16);
  return [...eventos]
    .reverse()
    .map((r) => {
      const huella = hashStr(previa + r.join('|'));
      const fila = { r, previa, huella };
      previa = huella;
      return fila;
    })
    .reverse();
}

/** Huellas selladas en el momento del registro (las que guardaría el servidor). */
let SELLOS = null;

function vAuditoria() {
  const filas = cadenaAuditoria(S.audit);
  if (!SELLOS || SELLOS.length !== filas.length) SELLOS = filas.map((f) => f.huella);
  return shellConsole(
    `<div class="page-head"><div><h1>Pista de auditoría</h1><p class="muted">Registro encadenado: cada evento incluye la huella del anterior, por lo que cualquier alteración es detectable (RF-33, RNF-05).</p></div>
      <div class="row"><button class="btn sec" id="a-ver">${I('shield')} Verificar integridad</button><button class="btn ghost" id="a-exp">${I('down')} Exportar CSV</button></div></div>
    <div id="a-res" aria-live="polite"></div>
    <div class="toolbar-simple"><label class="sr" for="af">Filtrar eventos</label><input id="af" type="search" class="input" placeholder="Filtrar por usuario, acción u objeto…">
      <span class="muted small" id="a-count">${filas.length} eventos</span></div>
    <div class="tablewrap"><table id="at"><caption class="sr">Eventos de auditoría, del más reciente al más antiguo</caption><thead><tr><th scope="col">Fecha y hora</th><th scope="col">Usuario</th><th scope="col">Acción</th><th scope="col">Objeto</th><th scope="col">Valor anterior</th><th scope="col">Valor nuevo</th><th scope="col">Huella</th></tr></thead><tbody>
    ${filas
      .map(
        ({ r, huella }) =>
          `<tr><td class="nowrap">${r[0]}</td><td>${esc(r[1])}<br><small class="muted">${esc(r[2])}</small></td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td><td class="hash" title="${huella}">${huella.slice(0, 10)}…</td></tr>`
      )
      .join('')}</tbody></table></div>
    <div class="row between mt"><p class="muted small">Los eventos no son editables por ningún rol y se conservan según la Tabla de Retención Documental.</p>
      <button class="btn sm ghost" id="a-tamper">${I('alert')} Simular manipulación (demo)</button></div>`,
    'auditoria'
  );
}

function bindAuditoria() {
  $('#a-ver').onclick = () => {
    const actuales = cadenaAuditoria(S.audit).map((f) => f.huella);
    const rotas = actuales.map((h, i) => (h !== SELLOS[i] ? i : -1)).filter((i) => i >= 0);
    $('#a-res').innerHTML = rotas.length
      ? `<div class="alert err mb" role="alert">${I('alert')}<span><b>Integridad comprometida.</b> ${rotas.length} huella(s) no coinciden con las selladas. El evento alterado más antiguo es el del ${esc(S.audit[rotas[rotas.length - 1]][0])}.</span></div>`
      : `<div class="alert ok mb">${I('check')}<span><b>Cadena íntegra.</b> ${actuales.length} eventos verificados; todas las huellas coinciden con las selladas.</span></div>`;
    rotas.forEach((i) => $$('#at tbody tr')[i]?.classList.add('fila-rota'));
  };
  $('#a-tamper').onclick = () => {
    const i = Math.min(3, S.audit.length - 1);
    S.audit[i] = [...S.audit[i]];
    S.audit[i][6] = S.audit[i][6] + ' (editado)';
    toast('Se alteró un evento antiguo. Pulse «Verificar integridad».', 'alert');
    const res = $('#a-res').innerHTML;
    render();
    $('#a-res').innerHTML = res;
  };
  $('#a-exp').onclick = () =>
    download(
      'auditoria.csv',
      [
        'fecha,usuario,rol,accion,objeto,anterior,nuevo',
        ...S.audit.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
      ].join('\n'),
      'text/csv'
    );
  $('#af').oninput = (e) => {
    const q = normalizar(e.target.value);
    let n = 0;
    $$('#at tbody tr').forEach((tr) => {
      tr.hidden = !normalizar(tr.textContent).includes(q);
      if (!tr.hidden) n++;
    });
    $('#a-count').textContent = `${n} eventos`;
  };
}

/* ===== Administración ===== */

/** Matriz de permisos por rol (mínimo privilegio, RNF-03). Fuente única para la tabla. */
const PERMISOS = [
  ['Reservar número y registrar actos', ['Registrador']],
  ['Registrar afectaciones', ['Registrador', 'Validador jurídico']],
  ['Validar consolidaciones (1.er nivel)', ['Validador']],
  ['Resolver casos escalados', ['Validador jurídico']],
  ['Administrar usuarios, roles y catálogos', ['Administrador']],
  ['Consultar la pista de auditoría', ['Registrador', 'Validador', 'Administrador', 'Auditor']],
];
const ADMIN = { tab: 'usuarios' };

function vAdmin() {
  const cats = Object.keys(S.catalogos);
  const tabs = [['usuarios', 'Usuarios y roles'], ...cats.map((c) => [c, c])];
  const roles = Object.keys(ROLES);
  const usuarios = `<div class="row between mb"><p class="muted">Las cuentas provienen del directorio institucional (SSO); aquí solo se asignan roles.</p><button class="btn sm" id="adm-add">${I('plus')} Asignar rol a un funcionario</button></div>
    <div class="tablewrap"><table><caption class="sr">Usuarios internos</caption><thead><tr><th scope="col">Nombre</th><th scope="col">Cuenta institucional</th><th scope="col">Rol</th><th scope="col">Estado</th></tr></thead><tbody>${USUARIOS.map(
      (u, i) =>
        `<tr><td>${u[0]}</td><td>${u[1]}</td><td><label class="sr" for="rol-${i}">Rol de ${u[0]}</label><select id="rol-${i}" data-usr="${i}">${roles.map((r) => `<option ${r === u[2] ? 'selected' : ''}>${r}</option>`).join('')}</select></td><td><span class="chip ${u[3] === 'Activo' ? 'chip-ok' : ''}">${u[3]}</span></td></tr>`
    ).join('')}</tbody></table></div>
    <h2 class="h3 mt-lg">Matriz de permisos</h2>
    <div class="tablewrap"><table class="matriz"><caption class="sr">Permisos por rol</caption><thead><tr><th scope="col">Permiso</th>${roles.map((r) => `<th scope="col">${r}</th>`).join('')}</tr></thead><tbody>${PERMISOS.map(
      ([p, con]) =>
        `<tr><th scope="row">${p}</th>${roles.map((r) => `<td>${con.includes(r) ? `${I('check')}<span class="sr">Permitido</span>` : '<span class="muted" aria-label="No permitido">—</span>'}</td>`).join('')}</tr>`
    ).join('')}</tbody></table></div>`;
  const catalogo =
    () => `<form class="toolbar-simple" id="cat-add"><label class="sr" for="cat-in">Nuevo elemento de ${esc(ADMIN.tab)}</label><input id="cat-in" class="input" placeholder="Nuevo elemento" required><button class="btn">${I('plus')} Agregar</button></form>
    <ul class="grid g3 lista-plana">${S.catalogos[ADMIN.tab].map((v) => `<li class="card item-catalogo">${esc(v)}</li>`).join('')}</ul>`;
  return shellConsole(
    `<div class="page-head"><div><h1>Usuarios, roles y catálogos</h1><p class="muted">CU-14 · Autenticación institucional con permisos por rol (RF-32) y catálogos parametrizables (RF-34)</p></div></div>
    <div class="tabs" role="tablist" aria-label="Secciones de administración">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${ADMIN.tab === k}" aria-controls="panel-adm" data-adm="${esc(k)}">${l}</button>`).join('')}</div>
    <div class="tabpanel" role="tabpanel" id="panel-adm">${ADMIN.tab === 'usuarios' ? usuarios : catalogo()}</div>`,
    'admin'
  );
}

function bindAdmin() {
  $$('[data-adm]').forEach((b) => (b.onclick = () => ((ADMIN.tab = b.dataset.adm), render())));
  $$('[data-usr]').forEach((s) => {
    s.onchange = () => {
      const u = USUARIOS[+s.dataset.usr];
      audit('Cambió rol de usuario', u[1], u[2], s.value);
      u[2] = s.value;
      toast(`Rol de ${u[0]} actualizado a ${s.value}`);
    };
  });
  const f = $('#cat-add');
  if (f)
    f.onsubmit = (e) => {
      e.preventDefault();
      const v = $('#cat-in').value.trim();
      if (!v) return;
      if (S.catalogos[ADMIN.tab].some((x) => normalizar(x) === normalizar(v)))
        return toast(`«${v}» ya existe en el catálogo`, 'alert');
      S.catalogos[ADMIN.tab].push(v);
      if (ADMIN.tab === 'Tipos de afectación') TIPOS_AFECT.push(v);
      audit('Agregó elemento a catálogo', ADMIN.tab, '—', v);
      toast(`«${v}» quedó disponible de inmediato en los formularios`);
      render();
    };
  const a = $('#adm-add');
  if (a)
    a.onclick = () =>
      modal(
        `<h2>Asignar rol</h2><form id="fasig"><div class="field"><label for="as-q">Funcionario (directorio institucional)</label><input id="as-q" required placeholder="nombre o correo @correo.unicordoba.edu.co"></div>
        <div class="field"><label for="as-r">Rol</label><select id="as-r">${Object.keys(ROLES)
          .map((r) => `<option>${r}</option>`)
          .join('')}</select></div>
        <div class="row end"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn">Asignar</button></div></form>`,
        (bg, close) => {
          $('#fasig', bg).onsubmit = (e) => {
            e.preventDefault();
            audit('Asignó rol', $('#as-q', bg).value, '—', $('#as-r', bg).value);
            close();
            toast('Rol asignado');
          };
        }
      );
}
