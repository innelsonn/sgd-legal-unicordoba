/* ---------- asistente de registro de un acto expedido (CU-02, CU-03, CU-04) ---------- */

const PASOS = ['Datos del acto', 'Documentos', 'Estructura del texto', 'Afectaciones', 'Revisión y envío'];
const RE_RADICADO = /^\d{4}-\d{3}-\d{6}-\d$/;
/** Fecha de sesión prevista para cada número reservado (para la advertencia de RF-05). */
const SESION_RESERVA = { 'CSU-ACU-2026-042': '2026-11-20' };

/** Texto de ejemplo del acto, tal como lo propone la estructuración automática (RF-07). */
const TEXTO_DEMO = [
  {
    lvl: 0,
    t: 'articulo',
    r: 'Artículo 1.',
    x: 'Modifíquese el artículo 28 del Acuerdo 004 de 2004, el cual quedará así: «Las calificaciones se expresarán en la escala de cero punto cero (0.0) a cinco punto cero (5.0), con una cifra decimal. La nota mínima aprobatoria de cada asignatura es tres punto cero (3.0), y la de las asignaturas de práctica es tres punto cinco (3.5).»',
  },
  { lvl: 1, t: 'paragrafo', r: 'Parágrafo.', x: 'La escala aplica desde el periodo académico 2027-1.' },
  {
    lvl: 0,
    t: 'articulo',
    r: 'Artículo 2.',
    x: 'Adiciónese un parágrafo al artículo 40 del Acuerdo 004 de 2004: «El Consejo de Facultad podrá autorizar una segunda matrícula condicional por razones de fuerza mayor.»',
  },
  {
    lvl: 0,
    t: 'articulo',
    r: 'Artículo 3.',
    x: 'El presente acuerdo rige a partir de su expedición y deroga las disposiciones que le sean contrarias.',
  },
];

/** Afectaciones que el reconocimiento de fórmulas propone (RF-11). La s1 trae el texto nuevo del artículo. */
const SUGERENCIAS_DEMO = [
  {
    id: 's1',
    o: 'Art. 1',
    art: 'Artículo 1',
    destino: 'CSU-ACU-2004-004',
    unidad: 'a28',
    dest: 'Acuerdo 004 de 2004 › Art. 28',
    tipo: 'modifica',
    formula: '«Modifíquese el artículo 28 del Acuerdo 004 de 2004»',
    texto:
      'Las calificaciones se expresarán en la escala de cero punto cero (0.0) a cinco punto cero (5.0), con una cifra decimal. La nota mínima aprobatoria de cada asignatura es tres punto cero (3.0), y la de las asignaturas de práctica es tres punto cinco (3.5).',
  },
  {
    id: 's2',
    o: 'Art. 2',
    art: 'Artículo 2',
    destino: 'CSU-ACU-2004-004',
    unidad: 'a40',
    dest: 'Acuerdo 004 de 2004 › Art. 40',
    tipo: 'adiciona',
    formula: '«Adiciónese un parágrafo al artículo 40…»',
  },
];

function wiz() {
  if (!S.wiz)
    S.wiz = {
      paso: 0,
      d: {
        organo: 'CSU',
        tipo: 'ACU',
        anio: '2026',
        numero: '',
        fecha: '',
        epigrafe: '',
        temas: [],
        radicado: '',
        justif: '',
      },
      pdf: false,
      nativa: false,
      cotejo: false,
      anexos: [],
      afect: [],
      sug: SUGERENCIAS_DEMO.map((s) => ({ ...s, st: 'pend' })),
    };
  return S.wiz;
}
const idActo = (d) => (d.numero ? `${d.organo}-${d.tipo}-${d.anio}-${d.numero.padStart(3, '0')}` : '');

/* --- Paso 1: datos del acto (RF-02, RF-03, RF-05) --- */
function pasoDatos(d) {
  const opt = (lista, sel) =>
    lista.map((o) => `<option value="${o.id}" ${sel === o.id ? 'selected' : ''}>${o.nombre}</option>`).join('');
  return `<div class="grid g2"><div>
      <div class="form-row"><div class="field"><label for="w-org">Órgano emisor <span class="req" aria-hidden="true">*</span></label><select id="w-org">${opt(ORGANOS, d.organo)}</select></div>
        <div class="field"><label for="w-tipo">Tipo <span class="req" aria-hidden="true">*</span></label><select id="w-tipo">${opt(TIPOS, d.tipo)}</select></div></div>
      <div class="form-row"><div class="field"><label for="w-num">Número <span class="req" aria-hidden="true">*</span></label><input id="w-num" value="${esc(d.numero)}" inputmode="numeric" placeholder="042" required aria-describedby="m-num"><span class="msg" id="m-num" aria-live="polite"></span></div>
        <div class="field"><label for="w-anio">Año</label><input id="w-anio" value="${d.anio}" readonly aria-readonly="true"></div></div>
      <div class="field"><label for="w-fecha">Fecha de expedición <span class="req" aria-hidden="true">*</span></label><input type="date" id="w-fecha" value="${d.fecha}" min="2026-01-01" max="${HOY}" required aria-describedby="m-fecha"><span class="msg" id="m-fecha" aria-live="polite"></span></div>
      <div class="field" id="f-justif" hidden><label for="w-justif">Justificación de la diferencia de fecha <span class="req" aria-hidden="true">*</span></label><textarea id="w-justif" rows="2" aria-describedby="h-justif">${esc(d.justif)}</textarea><span class="hint" id="h-justif">La fecha no coincide con la sesión prevista para el número reservado. Se permite continuar con una justificación (RF-05).</span></div>
    </div><div>
      <div class="field"><label for="w-epi">Epígrafe <span class="req" aria-hidden="true">*</span></label><textarea id="w-epi" rows="3" placeholder="Por el cual se…" required>${esc(d.epigrafe)}</textarea></div>
      <fieldset class="field"><legend>Temas <span class="req" aria-hidden="true">*</span></legend><div class="chips-check">${TEMAS.map(
        (t) =>
          `<label><input type="checkbox" name="w-tema" value="${t}" ${d.temas.includes(t) ? 'checked' : ''}><span>${t}</span></label>`
      ).join('')}</div></fieldset>
      <div class="field"><label for="w-rad">Radicado Orfeo (opcional)</label><input id="w-rad" value="${esc(d.radicado)}" placeholder="2026-100-000000-1" aria-describedby="m-rad"><span class="msg" id="m-rad" aria-live="polite"></span></div>
      <div class="id-preview"><span class="tag">Identificador persistente (RF-03)</span><output id="w-id" class="hash">—</output></div>
    </div></div>`;
}

/* --- Paso 2: documentos (RF-04, RF-06, RNF-04) --- */
function pasoDocumentos(w) {
  const num = w.d.numero.padStart(3, '0');
  const zona = (k, listo, vacio) =>
    `<button type="button" class="drop ${listo ? 'done' : ''}" id="d-${k}" aria-describedby="d-${k}-h">${listo || vacio}</button>`;
  return `<div class="grid g2">
    <div><h3>Original firmado (PDF) <span class="req" aria-hidden="true">*</span></h3>
      ${zona('pdf', w.pdf && `${I('check')} <b>${tipo(w.d.tipo)}_${num}_2026_firmado.pdf</b> · 412 KB<span class="hash">SHA-256: ${hashStr(num + 'pdf').slice(0, 6)}…${hashStr(num).slice(-4)} · inmutable</span>`, `${I('down')}<b>Seleccionar el PDF firmado</b><span class="muted">Se calcula su huella SHA-256</span>`)}
      <p class="hint" id="d-pdf-h">Único documento con fe pública. No podrá reemplazarse después de publicado.</p></div>
    <div><h3>Versión digital nativa <span class="req" aria-hidden="true">*</span></h3>
      ${zona('nat', w.nativa && `${I('check')} <b>${tipo(w.d.tipo)}_${num}_2026.docx</b> · plantilla institucional v3 detectada`, `${I('file')}<b>Seleccionar la versión .docx en plantilla</b><span class="muted">Se usa para estructurar el texto</span>`)}
      <p class="hint" id="d-nat-h">Obligatoria para los actos expedidos desde la puesta en marcha (RF-04).</p>
      <label class="check mt"><input type="checkbox" id="w-cot" ${w.cotejo ? 'checked' : ''} ${w.nativa && w.pdf ? '' : 'disabled'}> Declaro que cotejé la versión nativa contra el original firmado</label></div>
    <div><h3>Anexos</h3><p class="muted small">Los anexos forman parte del acto y se versionan cuando una reforma los modifica (RF-06).</p>
      <ul class="lista-plana">${w.anexos.map((a, i) => `<li>${I('file')} Anexo ${i + 1}. ${esc(a)} <span class="chip">v1</span></li>`).join('')}</ul>
      <button type="button" class="btn sec sm" id="w-anexo">${I('plus')} Agregar anexo</button></div></div>`;
}

/* --- Paso 3: estructura (RF-07) --- */
function pasoEstructura() {
  return `<div class="alert info mb">${I('sparkle')}<span>El sistema descompuso la versión nativa en unidades jerárquicas. Revise y corrija el tipo de cada unidad antes de continuar (RF-07).</span></div>
    <ol class="tree">${TEXTO_DEMO.map(
      (u, i) =>
        `<li class="n l${u.lvl}"><label class="sr" for="tu-${i}">Tipo de unidad de ${u.r}</label><select id="tu-${i}">${[
          'artículo',
          'parágrafo',
          'numeral',
          'literal',
          'inciso',
        ]
          .map(
            (o) =>
              `<option ${(u.t === 'articulo' && o === 'artículo') || (u.t === 'paragrafo' && o === 'parágrafo') ? 'selected' : ''}>${o}</option>`
          )
          .join(
            ''
          )}</select><b>${u.r}</b><span class="tree-txt" title="${esc(u.x)}">${esc(u.x)}</span><span class="chip chip-ok" title="Confianza de la estructuración">${I('check')} 98 %</span></li>`
    ).join('')}</ol>`;
}

/* --- Paso 4: afectaciones (RF-09 a RF-11, RB-04, RB-05, RB-12) --- */
function pasoAfectaciones(w) {
  const sug = w.sug
    .map(
      (
        s
      ) => `<div class="sug sug-${s.st}"><div class="row between"><b>${s.o} → ${s.dest}</b><span class="chip">${s.tipo}</span></div><p class="muted small">Fórmula detectada: ${s.formula}</p>
      <div class="row">${
        s.st === 'pend'
          ? `<button class="btn sm" data-sug="${s.id}" data-v="ok">${I('check')} Confirmar</button><button class="btn sm ghost" data-sug="${s.id}" data-v="no">${I('x')} Descartar</button>`
          : `<b>${s.st === 'ok' ? `${I('check')} Confirmada` : 'Descartada'}</b> <button class="btn sm ghost" data-sug="${s.id}" data-v="pend">Deshacer</button>`
      }</div></div>`
    )
    .join('');
  return `<div class="grid g2"><section><h3>${I('sparkle')} Afectaciones sugeridas</h3><p class="muted small">Propuestas a partir de fórmulas de redacción reconocidas. Ninguna se aplica sin confirmación humana (RB-12).</p>${sug}
      <div class="alert warn mt">${I('info')}<span><b>Art. 3:</b> la cláusula «deroga las disposiciones que le sean contrarias» no produce afectación sobre ninguna unidad concreta (RB-05). No se registra derogatoria automática.</span></div></section>
    <section><h3>${I('plus')} Registrar afectación manual</h3><form id="faf" class="card plano" novalidate>
      <div class="form-row"><div class="field"><label for="af-o">Unidad de origen</label><select id="af-o"><option>Art. 1</option><option>Parágrafo del Art. 1</option><option>Art. 2</option><option>Art. 3</option></select></div>
        <div class="field"><label for="af-t">Tipo de afectación</label><select id="af-t">${TIPOS_AFECT.map((t) => `<option>${t}</option>`).join('')}</select></div></div>
      <div class="field"><label for="af-d">Unidad destino</label><input id="af-d" value="Acuerdo 004 de 2004 › Art. 28" list="dests"><datalist id="dests"><option>Acuerdo 004 de 2004 › Art. 15</option><option>Acuerdo 004 de 2004 › Art. 40</option></datalist></div>
      <div class="form-row"><div class="field"><label for="af-m">Modo</label><select id="af-m"><option value="expresa">Expresa</option><option value="tácita">Tácita</option><option value="orgánica">Orgánica</option><option value="judicial">Judicial</option></select></div>
        <div class="field"><label for="af-f">Fecha de efectos</label><input type="date" id="af-f" value="${w.d.fecha || HOY}"></div></div>
      <div class="field" id="af-sop" hidden><label for="af-s">Soporte formal <span class="req" aria-hidden="true">*</span></label><select id="af-s" aria-describedby="af-s-h"><option value="">Seleccione…</option><option>Concepto de la Oficina de Asuntos Jurídicos</option><option>Decisión del órgano emisor</option><option>Providencia judicial</option></select><span class="hint" id="af-s-h">Las afectaciones no expresas requieren soporte formal (RF-10, RB-04).</span></div>
      <button class="btn sec">${I('plus')} Agregar afectación</button></form>
      ${w.afect.length ? `<h3>Afectaciones manuales (${w.afect.length})</h3><ul class="lista-plana">${w.afect.map((a, i) => `<li class="unit plano"><b>${a.o} → ${esc(a.d)}</b> <span class="chip">${a.t}</span> <span class="chip">${a.m}${a.s ? ' · ' + a.s : ''}</span> <button class="btn sm ghost" data-quitar-af="${i}" aria-label="Quitar afectación ${i + 1}">${I('x')}</button></li>`).join('')}</ul>` : ''}
    </section></div>`;
}

/* --- Paso 5: revisión (RF-13, RF-15) --- */
function pasoRevision(w) {
  const d = w.d;
  const confirmadas = w.sug.filter((s) => s.st === 'ok');
  const principal = confirmadas.find((s) => s.texto);
  let propuesta = '<p class="muted">No hay afectaciones confirmadas con texto que consolidar.</p>';
  if (principal) {
    const u = buscarUnidad(norma(principal.destino).unidades, principal.unidad);
    propuesta = `<div class="card plano diff"><b>${principal.dest}</b><p class="texto-norma">${diffWords(verAt(u, HOY).texto, principal.texto)}</p></div>`;
  }
  const todas = confirmadas
    .map((s) => `${s.o} ${s.tipo} ${s.dest}`)
    .concat(w.afect.map((a) => `${a.o} ${a.t} ${a.d} (${a.m})`));
  return `<div class="grid g2"><section class="card plano"><h3>Resumen del registro</h3>
      <dl class="meta dos-col"><div><dt>Identificador</dt><dd>${idActo(d)}</dd></div><div><dt>Expedición</dt><dd>${fmt(d.fecha)}</dd></div><div class="col-full"><dt>Epígrafe</dt><dd>${esc(d.epigrafe)}</dd></div><div><dt>Temas</dt><dd>${d.temas.join(', ')}</dd></div><div><dt>Radicado</dt><dd>${esc(d.radicado || '—')}</dd></div></dl>
      <h3>Documentos</h3><p>${I('check')} Original firmado con huella SHA-256 · ${I('check')} Versión nativa cotejada${w.anexos.length ? ` · ${w.anexos.length} anexo(s)` : ''}</p>
      <h3>Estructura</h3><p>${TEXTO_DEMO.length} unidades revisadas</p>
      <h3>Afectaciones</h3><ul>${todas.map((t) => `<li>${esc(t)}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul></section>
    <section><div class="alert info">${I('info')}<span>Al enviar, el acto pasa a <b>«En validación»</b> en la bandeja de la Secretaría General. Se generan la propuesta de consolidación y las notas de vigencia (RF-13, RF-15).</span></div>
      <h3>Propuesta de consolidación generada</h3>${propuesta}<p class="muted diff leyenda-diff"><ins>texto añadido</ins> <del>texto suprimido</del></p></section></div>`;
}

function vRegistrar() {
  const w = wiz();
  const p = w.paso;
  const cuerpo = [pasoDatos(w.d), pasoDocumentos(w), pasoEstructura(), pasoAfectaciones(w), pasoRevision(w)][p];
  return shellConsole(
    `<div class="page-head"><div><h1>Registrar acto expedido</h1><p class="muted">CU-02 Registrar acto · CU-03 Estructurar texto · CU-04 Registrar afectaciones</p></div>
      ${p === 0 ? `<button class="btn sm ghost" id="w-demo">${I('sparkle')} Autocompletar ejemplo</button>` : ''}</div>
    <nav aria-label="Progreso del registro"><ol class="steps">${PASOS.map(
      (s, i) =>
        `<li class="${i === p ? 'on' : i < p ? 'done' : ''}" ${i === p ? 'aria-current="step"' : ''}>${i < p ? `<button type="button" class="linklike" data-paso="${i}">${s}</button>` : s}<span class="sr">${i < p ? ' (completado)' : i === p ? ' (paso actual)' : ''}</span></li>`
    ).join('')}</ol></nav>
    <section class="card" aria-labelledby="paso-tit"><h2 id="paso-tit" class="h3 paso-tit" tabindex="-1">Paso ${p + 1} de ${PASOS.length}: ${PASOS[p]}</h2>${cuerpo}<div id="w-err"></div>
      <div class="wizard-nav"><button class="btn ghost" id="w-prev" ${p === 0 ? 'disabled' : ''}>← Anterior</button>
      <button class="btn" id="w-next">${p === PASOS.length - 1 ? `${I('send')} Enviar a validación` : 'Guardar y continuar →'}</button></div></section>`,
    'registrar'
  );
}

function setMsg(el, clase, html) {
  el.className = 'msg' + (clase ? ' ' + clase : '');
  el.innerHTML = html;
}

/** Valida el paso 1 en línea (RI-02) y devuelve el primer error bloqueante o ''. */
function validarDatos(w) {
  const d = w.d;
  const id = idActo(d);
  $('#w-id').textContent = id ? `${id} · /n/${id}` : '—';
  const ni = $('#w-num');
  ni.removeAttribute('aria-invalid');
  setMsg($('#m-num'), '', '');
  let bloqueo = '';
  if (id) {
    if (norma(id) || S.bandeja.some((b) => b.id === id && b.estado !== 'reservado'))
      bloqueo = 'El identificador ya existe (RF-05).';
    else if ((S.anulados || []).includes(id)) bloqueo = 'El número fue anulado y no puede reasignarse (RB-03).';
    else if (!S.reservados.includes(id))
      bloqueo = `No es un consecutivo reservado de ${organo(d.organo)} para ${d.anio}.`;
    if (bloqueo) {
      setMsg($('#m-num'), 'e', `${I('x')} Bloqueado: ${bloqueo}`);
      ni.setAttribute('aria-invalid', 'true');
    } else setMsg($('#m-num'), 'o', `${I('check')} Número reservado válido.`);
  }
  const sesion = SESION_RESERVA[id];
  w.needJ = Boolean(d.fecha && sesion && d.fecha !== sesion);
  $('#f-justif').hidden = !w.needJ;
  setMsg(
    $('#m-fecha'),
    w.needJ ? 'w' : '',
    w.needJ ? `${I('alert')} Advertencia: la sesión prevista para este número es el ${fmt(sesion)}.` : ''
  );
  const radOk = !d.radicado || RE_RADICADO.test(d.radicado);
  $('#w-rad').setAttribute('aria-invalid', String(!radOk));
  setMsg($('#m-rad'), radOk ? '' : 'e', radOk ? '' : `${I('x')} Formato esperado: AAAA-DDD-NNNNNN-D (RI-05).`);
  return bloqueo;
}

/** Errores que impiden avanzar desde el paso actual. */
function erroresPaso(w) {
  const d = w.d;
  switch (w.paso) {
    case 0: {
      const faltan = [
        !d.numero && 'número',
        !d.fecha && 'fecha de expedición',
        !d.epigrafe.trim() && 'epígrafe',
        !d.temas.length && 'temas',
      ].filter(Boolean);
      if (faltan.length) return `No se puede guardar: faltan datos obligatorios (${faltan.join(', ')}).`;
      const bloqueo = validarDatos(w);
      if (bloqueo) return bloqueo + ' Corrija el número antes de continuar.';
      if (w.needJ && !d.justif.trim()) return 'Registre una justificación para la diferencia de fecha.';
      if (d.fecha > HOY)
        return 'La fecha de expedición no puede ser posterior a hoy: ningún acto se registra antes de expedirse (RB-02).';
      if (d.radicado && !RE_RADICADO.test(d.radicado)) return 'El radicado de Orfeo no tiene un formato válido.';
      return '';
    }
    case 1:
      return w.pdf && w.nativa && w.cotejo
        ? ''
        : 'Cargue el original firmado y la versión nativa, y registre el cotejo entre ambos.';
    case 3:
      return w.sug.some((s) => s.st === 'pend')
        ? 'Confirme o descarte todas las afectaciones sugeridas antes de continuar.'
        : '';
    default:
      return '';
  }
}

/** Envía el acto a validación con su propuesta de consolidación. */
function enviarAValidacion(w) {
  const d = w.d;
  const id = idActo(d);
  const principal = w.sug.find((s) => s.st === 'ok' && s.texto);
  let caso = S.bandeja.find((x) => x.id === id);
  if (!caso) S.bandeja.push((caso = { id, plazo: 5 }));
  Object.assign(caso, {
    epigrafe: d.epigrafe,
    estado: 'validacion',
    resp: 'M. Pérez (validador)',
    dias: 0,
    plazo: 5,
    fecha: d.fecha,
    temas: d.temas,
    radicado: d.radicado,
    propuesta: principal && {
      destino: principal.destino,
      unidad: principal.unidad,
      art: principal.art,
      tipo: principal.tipo,
      texto: principal.texto,
    },
  });
  audit('Envió a validación', id, 'en estructuración', 'en validación');
  S.wiz = null;
  toast(`${id} enviado a validación`, 'send');
  location.hash = '#/consola';
}

function bindRegistrar() {
  const w = wiz();
  const d = w.d;
  const mostrarError = (m) => {
    $('#w-err').innerHTML = m ? `<div class="alert err mt" role="alert">${I('alert')}<span>${m}</span></div>` : '';
  };
  $$('[data-paso]').forEach((b) => (b.onclick = () => ((w.paso = +b.dataset.paso), render())));

  if (w.paso === 0) {
    const sync = () => {
      Object.assign(d, {
        organo: $('#w-org').value,
        tipo: $('#w-tipo').value,
        numero: $('#w-num').value.trim().replace(/\D/g, ''),
        fecha: $('#w-fecha').value,
        epigrafe: $('#w-epi').value,
        radicado: $('#w-rad').value.trim(),
        temas: $$('[name=w-tema]:checked').map((c) => c.value),
        justif: $('#w-justif').value,
      });
      validarDatos(w);
    };
    $$('#app input, #app select, #app textarea').forEach((el) => el.addEventListener('input', sync));
    $$('#app [type=checkbox], #app select').forEach((el) => el.addEventListener('change', sync));
    sync();
    $('#w-demo').onclick = () => {
      Object.assign(d, {
        organo: 'CSU',
        tipo: 'ACU',
        numero: '042',
        fecha: '2026-11-20',
        epigrafe:
          'Por el cual se modifica el artículo 28 y se adiciona un parágrafo al artículo 40 del Reglamento Académico Estudiantil',
        temas: ['Reglamento estudiantil'],
        radicado: '2026-100-007731-1',
      });
      render();
    };
  }
  if (w.paso === 1) {
    const cargar = (k, el, msg) => (el.onclick = () => ((w[k] = true), render(), toast(msg), $(`#${el.id}`)?.focus()));
    cargar('pdf', $('#d-pdf'), 'Original cargado; huella SHA-256 calculada');
    cargar('nativa', $('#d-nat'), 'Versión nativa cargada');
    $('#w-cot').onchange = (e) => (w.cotejo = e.target.checked);
    $('#w-anexo').onclick = () => {
      w.anexos.push(
        ['Tabla de equivalencias.pdf', 'Plan de transición.pdf', 'Formato de solicitud.pdf'][w.anexos.length % 3]
      );
      render();
    };
  }
  if (w.paso === 3) {
    $$('[data-sug]').forEach((b) => {
      b.onclick = () => {
        const s = w.sug.find((x) => x.id === b.dataset.sug);
        s.st = b.dataset.v;
        if (s.st === 'ok')
          audit('Confirmó afectación sugerida', `${idActo(d)} › ${s.o}`, 'sugerida', `${s.tipo} ${s.dest}`);
        render();
      };
    });
    $$('[data-quitar-af]').forEach((b) => (b.onclick = () => (w.afect.splice(+b.dataset.quitarAf, 1), render())));
    $('#af-m').onchange = (e) => ($('#af-sop').hidden = e.target.value === 'expresa');
    $('#faf').onsubmit = (e) => {
      e.preventDefault();
      const m = $('#af-m').value;
      const s = $('#af-s').value;
      if (m !== 'expresa' && !s) {
        $('#af-s').setAttribute('aria-invalid', 'true');
        $('#af-s').focus();
        return toast('Seleccione el soporte formal', 'alert');
      }
      w.afect.push({ o: $('#af-o').value, t: $('#af-t').value, d: $('#af-d').value, m, s });
      render();
    };
  }
  $('#w-prev').onclick = () => ((w.paso -= 1), render());
  $('#w-next').onclick = () => {
    const error = erroresPaso(w);
    if (error) return mostrarError(error);
    if (w.paso === PASOS.length - 1) return enviarAValidacion(w);
    w.paso += 1;
    render();
    $('#paso-tit')?.focus();
  };
}
