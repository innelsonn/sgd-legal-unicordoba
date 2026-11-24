/* ---------- consola: bandeja de trabajo (RF-17, RI-02) y reserva de números (RF-01) ---------- */

const VISTA_BANDEJA = { modo: 'tablero', mios: false };

/** ¿El caso está asignado al usuario actual? (Se compara por apellido o por oficina). */
function esMio(caso) {
  const u = S.user;
  if (u.rol === 'Validador jurídico') return caso.estado === 'escalado';
  return caso.resp.includes(u.nombre.split(' ')[1]) || caso.resp.includes(u.nombre);
}

const progreso = (x) =>
  `<div class="bar" role="img" aria-label="${x.dias} de ${x.plazo} días del plazo"><span class="${x.dias > x.plazo ? 'late' : ''}" style="width:${Math.min(100, (x.dias / x.plazo) * 100)}%"></span></div>
   <span class="small ${x.dias > x.plazo ? 'txt-off' : 'muted'}">${x.dias}/${x.plazo} días${x.dias > x.plazo ? ' · vencido' : ''}</span>`;

function vBandeja() {
  const todos = S.bandeja;
  const visibles = VISTA_BANDEJA.mios ? todos.filter(esMio) : todos;
  const enCurso = todos.filter((x) => x.estado !== 'publicado');
  const vencidos = enCurso.filter((x) => x.dias > x.plazo);
  const kpis = [
    [enCurso.length, 'actos en curso', ''],
    [vencidos.length, 'con plazo vencido', vencidos.length ? 'kpi-off' : ''],
    [todos.filter((x) => ['validacion', 'escalado'].includes(x.estado)).length, 'pendientes de validación', ''],
    ['2,1', 'días de mediana entre expedición y publicación', 'kpi-ok'],
  ];
  const tablero = `<div class="kanban" role="list">${FLUJO.map((c) => {
    const items = visibles.filter((x) => x.estado === c);
    return `<section class="col" role="listitem" aria-label="${FLUJO_LABEL[c]}, ${items.length} actos"><h2 class="col-tit">${FLUJO_LABEL[c]} <span class="chip">${items.length}</span></h2>
      ${
        items
          .map(
            (
              x
            ) => `<button class="tk ${x.dias > x.plazo ? 'tk-late' : ''}" data-tk="${x.id}"><span class="id">${x.id}</span><span class="tk-epi">${esc(x.epigrafe)}</span>
          <span class="muted small">${I('user')} ${esc(x.resp)}</span>${progreso(x)}</button>`
          )
          .join('') || '<p class="muted small col-vacia">Sin actos</p>'
      }</section>`;
  }).join('')}</div>`;
  const lista = `<div class="tablewrap"><table><caption class="sr">Actos en trámite</caption><thead><tr><th scope="col">Acto</th><th scope="col">Epígrafe</th><th scope="col">Estado</th><th scope="col">Responsable</th><th scope="col">Plazo</th><th scope="col"><span class="sr">Acción</span></th></tr></thead><tbody>
    ${[...visibles]
      .sort((a, b) => b.dias / b.plazo - a.dias / a.plazo)
      .map(
        (x) =>
          `<tr><td class="nowrap"><b>${x.id}</b></td><td>${esc(x.epigrafe)}</td><td>${flujoChip(x.estado)}</td><td>${esc(x.resp)}</td><td class="plazo">${progreso(x)}</td><td><button class="btn sm sec" data-tk="${x.id}">Abrir</button></td></tr>`
      )
      .join('')}</tbody></table></div>`;

  return shellConsole(
    `<div class="page-head"><div><h1>Bandeja de trabajo</h1><p class="muted">Actos por estado y responsable, con alertas de plazo (RF-17, RI-02)</p></div>
      ${S.user.rol === 'Registrador' ? `<div class="row"><a class="btn sec" href="#/consola/reservar">${I('hash')} Reservar número</a><a class="btn" href="#/consola/registrar">${I('plus')} Registrar acto</a></div>` : ''}</div>
    <div class="kpis">${kpis.map(([v, t, c]) => `<div class="card kpi ${c}"><b>${v}</b><span>${t}</span></div>`).join('')}</div>
    ${vencidos.length ? `<div class="alert warn mb" role="status">${I('alert')}<span>${vencidos.map((v) => `<b>${v.id}</b> lleva ${v.dias} días en «${FLUJO_LABEL[v.estado]}» (plazo: ${v.plazo})`).join('; ')}. Se envió una alerta de plazo al responsable.</span></div>` : ''}
    <div class="row between mb">
      <div class="segmented" role="group" aria-label="Modo de visualización">
        <button data-modo="tablero" aria-pressed="${VISTA_BANDEJA.modo === 'tablero'}">${I('layers')} Tablero</button>
        <button data-modo="lista" aria-pressed="${VISTA_BANDEJA.modo === 'lista'}">${I('log')} Lista por urgencia</button>
      </div>
      <label class="check"><input type="checkbox" id="mios" ${VISTA_BANDEJA.mios ? 'checked' : ''}> Solo los asignados a mí</label>
    </div>
    ${visibles.length ? (VISTA_BANDEJA.modo === 'tablero' ? tablero : lista) : '<div class="card vacio"><p class="muted">No tiene actos asignados en este momento.</p></div>'}`,
    'bandeja'
  );
}

function bindBandeja() {
  $$('[data-modo]').forEach((b) => (b.onclick = () => ((VISTA_BANDEJA.modo = b.dataset.modo), render())));
  $('#mios').onchange = (e) => ((VISTA_BANDEJA.mios = e.target.checked), render());
  $$('[data-tk]').forEach((el) => (el.onclick = () => abrirCaso(S.bandeja.find((b) => b.id === el.dataset.tk))));
}

/** Lleva al usuario a la pantalla donde puede actuar sobre el caso, según su estado. */
function abrirCaso(x) {
  const menu = ROLES[S.user.rol].menu;
  if (['validacion', 'escalado'].includes(x.estado) && menu.includes('validar'))
    return void (location.hash = '#/consola/validar/' + x.id);
  if (['estructuracion', 'expedido', 'devuelto'].includes(x.estado) && menu.includes('registrar'))
    return void (location.hash = '#/consola/registrar');
  if (x.estado === 'publicado')
    return void (location.hash = '#/norma/' + (norma(x.id) ? x.id : x.propuesta?.destino || 'CSU-ACU-2004-004'));
  modal(
    `<h2>${x.id}</h2><p>${esc(x.epigrafe)}</p><dl class="meta"><div><dt>Estado</dt><dd>${FLUJO_LABEL[x.estado]}</dd></div><div><dt>Responsable</dt><dd>${esc(x.resp)}</dd></div><div><dt>Plazo</dt><dd>${x.dias} de ${x.plazo} días</dd></div></dl>
    ${x.obs ? `<div class="alert warn mt">${I('undo')}<span><b>Observaciones:</b> ${esc(x.obs)}</span></div>` : ''}
    <p class="muted small mt">Ningún acto se publica antes de estar numerado, fechado y firmado (RB-02). Su rol no tiene acciones disponibles en esta etapa.</p><div class="row end"><button class="btn" data-close>Cerrar</button></div>`
  );
}

/* ===== Reserva de números (RF-01, RB-03) ===== */

/** Siguiente consecutivo del órgano y tipo para 2026. Cuenta también los anulados: nunca se reasignan. */
function siguienteNumero(org, tip) {
  const usados = [...S.reservados, ...(S.anulados || []), ...S.bandeja.map((b) => b.id), ...NORMAS.map((n) => n.id)]
    .filter((id) => id.startsWith(`${org}-${tip}-2026-`))
    .map((id) => +id.split('-').pop());
  return String(Math.max(0, ...usados) + 1).padStart(3, '0');
}

/** Estado de cada número del órgano/tipo para la tabla lateral. */
function numerosDe(org, tip) {
  const pref = `${org}-${tip}-2026-`;
  const filas = new Map();
  S.bandeja
    .filter((b) => b.id.startsWith(pref))
    .forEach((b) =>
      filas.set(
        b.id,
        b.estado === 'reservado'
          ? ['reservado', esc(b.epigrafe.replace(/^\(Número reservado — |\)$/g, ''))]
          : ['usado', FLUJO_LABEL[b.estado]]
      )
    );
  S.reservados.filter((id) => id.startsWith(pref) && !filas.has(id)).forEach((id) => filas.set(id, ['reservado', '']));
  (S.anulados || [])
    .filter((id) => id.startsWith(pref))
    .forEach((id) => filas.set(id, ['anulado', 'Con constancia de anulación; no se reasigna']));
  return [...filas.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function vReservar() {
  return shellConsole(
    `<div class="page-head"><div><h1>Reservar número</h1><p class="muted">El consecutivo es anual y propio de cada órgano emisor; un número anulado no se reasigna (RF-01, RB-03).</p></div></div>
    <div class="grid g2"><form class="card" id="fres">
      <div class="field"><label for="ro">Órgano emisor</label><select id="ro">${ORGANOS.map((o) => `<option value="${o.id}">${o.nombre}</option>`).join('')}</select></div>
      <div class="field"><label for="rt">Tipo de acto</label><select id="rt">${TIPOS.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>
      <div class="field"><label for="rv">Vigencia</label><input id="rv" value="2026" readonly aria-readonly="true"></div>
      <div class="alert ok" aria-live="polite">${I('hash')}<span>Siguiente número disponible: <b id="rn"></b></span></div>
      <div class="field mt"><label for="rmot">Sesión o motivo</label><input id="rmot" placeholder="Ej.: Sesión ordinaria del 4 de diciembre"></div>
      <button class="btn">${I('hash')} Reservar número</button></form>
    <section class="card" aria-labelledby="num-tit"><h2 class="h3" id="num-tit">Números de 2026 · <span id="num-org"></span></h2><div id="num-tabla"></div></section></div>`,
    'reservar'
  );
}

function bindReservar() {
  const org = () => $('#ro').value;
  const tip = () => $('#rt').value;
  const etiqueta = { reservado: 'chip', usado: 'chip chip-ok', anulado: 'chip chip-off' };
  const actualizar = () => {
    $('#rn').textContent = siguienteNumero(org(), tip());
    $('#num-org').textContent = `${organo(org())} · ${tipo(tip())}`;
    const filas = numerosDe(org(), tip());
    $('#num-tabla').innerHTML = filas.length
      ? `<div class="tablewrap"><table><thead><tr><th scope="col">Número</th><th scope="col">Estado</th><th scope="col">Detalle</th><th scope="col"><span class="sr">Acción</span></th></tr></thead><tbody>${filas
          .map(
            ([id, [st, det]]) =>
              `<tr><td><b>${id.split('-').pop()}</b></td><td><span class="${etiqueta[st]}">${st}</span></td><td>${det}</td><td>${st === 'reservado' ? `<button class="btn sm warn" data-anular="${id}">${I('ban')} Anular</button>` : ''}</td></tr>`
          )
          .join('')}</tbody></table></div>`
      : '<p class="muted">Aún no hay números de este órgano y tipo en 2026.</p>';
    $$('[data-anular]').forEach((b) => (b.onclick = () => anularNumero(b.dataset.anular, actualizar)));
  };
  $('#ro').onchange = actualizar;
  $('#rt').onchange = actualizar;
  actualizar();
  $('#fres').onsubmit = (e) => {
    e.preventDefault();
    const id = `${org()}-${tip()}-2026-${siguienteNumero(org(), tip())}`;
    S.reservados.push(id);
    S.bandeja.push({
      id,
      epigrafe: `(Número reservado — ${$('#rmot').value.trim() || 'sin motivo'})`,
      estado: 'reservado',
      resp: `${S.user.nombre} (registrador)`,
      dias: 0,
      plazo: 10,
    });
    audit('Reservó número', id, '—', 'reservado');
    toast(`Número ${id} reservado`);
    $('#rmot').value = '';
    actualizar();
  };
}

function anularNumero(id, alTerminar) {
  pedirTexto(`Anular el número ${id}`, 'Constancia o justificación de la anulación', 'Anular número', () => {
    S.reservados = S.reservados.filter((r) => r !== id);
    S.bandeja = S.bandeja.filter((b) => b.id !== id);
    S.anulados = [...(S.anulados || []), id];
    audit('Anuló número', id, 'reservado', 'anulado');
    toast('Número anulado con constancia registrada. No se reasignará.');
    alTerminar();
  });
}
