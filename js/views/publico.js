/* ---------- vistas públicas (consulta sin autenticación, RF-21 a RF-31) ---------- */

const ESTADOS_VIGENTES = ['vigente', 'vigente-mod', 'parcial'];
const LEYENDA_INFORMATIVA =
  'Texto de carácter informativo. No sustituye el acto original; la fe pública reside exclusivamente en el original firmado.';

/** Normaliza texto para comparar sin tildes ni mayúsculas. */
const normalizar = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Encabezado estándar de página: título, descripción y acciones opcionales. */
const pageHead = (tit, desc = '', acciones = '') =>
  `<div class="page-head"><div><h1>${tit}</h1>${desc ? `<p class="muted lead">${desc}</p>` : ''}</div>${acciones}</div>`;

/** Tarjeta de resultado reutilizada en inicio, búsqueda y compilaciones. */
function tarjetaNorma(n, { meta, resaltar = esc, fragmento = null } = {}) {
  return `<a class="result" href="#/norma/${n.id}">
    <div class="row between"><span class="tag">${meta || `${organo(n.organo)} · ${fmt(n.fecha)}`}</span>${estado(n.estado)}</div>
    <h3>${resaltar(titulo(n))}</h3><p class="result-epi">${resaltar(n.epigrafe)}</p>
    ${fragmento ? `<p class="fragmento"><b>${esc(fragmento.rotulo)}</b> ${resaltar(fragmento.texto)}</p>` : ''}</a>`;
}

/**
 * Si la coincidencia está en el cuerpo y no en los metadatos, devuelve un fragmento del
 * artículo vigente que la contiene, para que el usuario vea por qué apareció el resultado.
 */
function fragmentoCoincidencia(n, terminos) {
  const ts = terminos.filter((t) => t.length > 2);
  if (!ts.length) return null;
  const meta = normalizar(`${titulo(n)} ${n.epigrafe}`);
  if (ts.every((t) => meta.includes(t))) return null;
  const recorte = (txt) => {
    const base = normalizar(txt);
    const i = ts
      .map((t) => base.indexOf(t))
      .filter((x) => x >= 0)
      .sort((a, b) => a - b)[0];
    if (i === undefined) return null;
    const ini = i > 60 ? base.lastIndexOf(' ', i - 60) + 1 : 0;
    const fin = Math.min(txt.length, i + 110);
    return (ini > 0 ? '…' : '') + txt.slice(ini, fin).trim() + (fin < txt.length ? '…' : '');
  };
  const unidades = flatUnits(unidadesDe(n)).filter((u) => u.versiones);
  // Primero el texto vigente; si solo coincide una versión anterior, se avisa explícitamente.
  for (const u of unidades) {
    const t = recorte(verAt(u, HOY)?.texto || '');
    if (t) return { rotulo: u.rotulo, texto: t };
  }
  for (const u of unidades)
    for (const v of u.versiones) {
      const t = recorte(v.texto);
      if (t) return { rotulo: `${u.rotulo} (en una versión anterior, hasta ${fmt(v.hasta)})`, texto: t };
    }
  return null;
}

/* ===== Inicio ===== */
function vHome() {
  const recientes = [...NORMAS].sort((a, b) => b.publicado.localeCompare(a.publicado)).slice(0, 4);
  const troncales = NORMAS.filter((n) => n.troncal);
  const tareas = [
    ['check', '¿Esta norma sigue vigente?', 'Busque la norma y vea su estado y su texto actualizado.', '#/buscar'],
    [
      'user',
      '¿Qué reglamento me aplica?',
      'Consulte el Reglamento Estudiantil según su fecha de ingreso.',
      '#/norma/CSU-ACU-2004-004',
    ],
    [
      'compare',
      '¿Qué cambió y cuándo?',
      'Compare versiones y revise el historial de reformas.',
      '#/norma/CSU-ACU-2004-004?tab=comparar',
    ],
    ['layers', 'Normas de un tema', 'Genere una compilación de las normas vigentes de un tema.', '#/compilacion'],
  ];
  return shellPublic(
    `<section class="hero" aria-labelledby="hero-tit">
      <p class="hero-kicker">Secretaría General · Portal de normatividad interna</p>
      <h1 id="hero-tit">Consulte la normativa vigente de la Universidad</h1>
      <p>Acuerdos, resoluciones y circulares de carácter general de todos los órganos emisores, con su estado de vigencia, notas por artículo y enlace al original firmado.</p>
      <form class="search" role="search" id="fhome">
        <label class="sr" for="q">Buscar normas</label>
        <input id="q" name="q" type="search" placeholder="Ej.: reingreso, escala de calificaciones, Acuerdo 004 de 2004" autocomplete="off">
        <button class="btn">${I('search')} Buscar</button>
      </form>
      <div class="quick"><span>Búsquedas frecuentes:</span>${[
        'matrícula',
        'calendario académico',
        'bajo rendimiento',
        'datos personales',
        'derechos pecuniarios',
      ]
        .map((q) => `<a href="#/buscar?q=${encodeURIComponent(q)}">${q}</a>`)
        .join('')}</div>
    </section>

    <section aria-labelledby="tareas-tit" class="mt-lg">
      <h2 id="tareas-tit">¿Qué necesita hacer?</h2>
      <div class="grid g4">${tareas
        .map(
          ([ic, t, d, h]) =>
            `<a class="tarea" href="${h}"><span class="tarea-ic">${I(ic)}</span><b>${t}</b><span class="muted">${d}</span><span class="tarea-ir">Ir ${I('arrow')}</span></a>`
        )
        .join('')}</div>
    </section>

    <div class="grid g2 mt-lg">
      <section aria-labelledby="tron-tit"><h2 id="tron-tit">${I('book')} Normas troncales</h2>
        <p class="muted small">Las normas estructurales de uso más frecuente.</p>
        ${troncales.map((n) => tarjetaNorma(n, { meta: organo(n.organo) })).join('')}
      </section>
      <section aria-labelledby="rec-tit"><h2 id="rec-tit">${I('clock')} Publicadas recientemente</h2>
        <p class="muted small">Actos incorporados al portal en las últimas semanas.</p>
        ${recientes.map((n) => tarjetaNorma(n, { meta: `Publicada el ${fmt(n.publicado)}` })).join('')}
      </section>
    </div>

    <section class="card mt-lg" aria-labelledby="est-tit">
      <div class="row between"><h2 id="est-tit" class="h3">${I('info')} Cómo leer el estado de una norma</h2><a href="#/glosario">Ver glosario completo ${I('arrow')}</a></div>
      <dl class="estados-grid">${Object.keys(ESTADOS)
        .map((k) => `<div><dt>${estado(k)}</dt><dd class="muted">${ESTADOS[k].desc}</dd></div>`)
        .join('')}</dl>
    </section>

    <section class="indicadores mt-lg" aria-label="Indicadores del portal">
      ${[
        [NORMAS.length, 'normas de carácter general publicadas'],
        [NORMAS.filter((n) => ESTADOS_VIGENTES.includes(n.estado)).length, 'vigentes total o parcialmente'],
        ['2,1 días', 'mediana entre expedición y publicación (antes 16,5)'],
        [ORGANOS.length, 'órganos emisores, incluidos los Consejos de Facultad'],
      ]
        .map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`)
        .join('')}
    </section>`,
    '#/'
  );
}
function bindHome() {
  $('#fhome').onsubmit = (e) => {
    e.preventDefault();
    location.hash = '#/buscar?q=' + encodeURIComponent(e.target.q.value.trim());
  };
}

/* ===== Búsqueda (RF-21) ===== */
const FACETAS = {
  tipo: ['Tipo de norma', (n) => n.tipo, (x) => tipo(x)],
  organo: ['Órgano emisor', (n) => n.organo, (x) => organo(x)],
  tema: ['Tema', (n) => n.temas, (x) => x],
  anio: ['Año', (n) => String(n.anio), (x) => x],
  estado: ['Estado de vigencia', (n) => n.estado, (x) => ESTADOS[x].label],
};

/** Texto plano de todas las versiones de una norma, para la búsqueda de texto completo. */
const textoCompleto = (n) =>
  flatUnits(unidadesDe(n))
    .map((u) => (u.titulo || '') + ' ' + (u.versiones || []).map((v) => v.texto).join(' '))
    .join(' ');

/** Puntúa una norma frente a la consulta: coincidencias en metadatos pesan más que en el cuerpo. */
function puntuar(n, terminos) {
  if (!terminos.length) return 1;
  const meta = normalizar(`${titulo(n)} ${n.id} ${n.epigrafe} ${n.temas.join(' ')}`);
  const cuerpo = normalizar(textoCompleto(n));
  return terminos.reduce((s, t) => s + (meta.includes(t) ? 3 : 0) + (cuerpo.includes(t) ? 1 : 0), 0);
}

/** Resalta los términos sin importar tildes: se busca sobre el texto normalizado y se marca el original. */
function resaltador(terminos) {
  const ts = terminos.filter((t) => t.length > 2);
  return (texto) => {
    if (!ts.length) return esc(texto);
    const base = normalizar(texto); // NFD + quitar diacríticos conserva la longitud en español
    const marcas = new Array(texto.length).fill(false);
    ts.forEach((t) => {
      for (let i = base.indexOf(t); i !== -1; i = base.indexOf(t, i + 1)) marcas.fill(true, i, i + t.length);
    });
    let out = '';
    let abierto = false;
    for (let i = 0; i < texto.length; i++) {
      if (marcas[i] !== abierto) {
        out += marcas[i] ? '<mark>' : '</mark>';
        abierto = marcas[i];
      }
      out += esc(texto[i]);
    }
    return out + (abierto ? '</mark>' : '');
  };
}

function vBuscar(params) {
  const q = (params.get('q') || '').trim();
  const orden = params.get('orden') || 'pertinencia';
  const sel = (k) => params.getAll(k);
  const terminos = normalizar(q).split(/\s+/).filter(Boolean);

  const coincidencias = NORMAS.map((n) => ({ n, score: puntuar(n, terminos) })).filter((r) => r.score > 0);
  const pasa = (n, omitir) =>
    Object.entries(FACETAS).every(
      ([k, [, get]]) => k === omitir || !sel(k).length || [].concat(get(n)).some((v) => sel(k).includes(v))
    );
  const filtrados = coincidencias
    .filter((r) => pasa(r.n))
    .sort((a, b) =>
      orden === 'recientes' ? b.n.fecha.localeCompare(a.n.fecha) : b.score - a.score || b.n.anio - a.n.anio
    );
  const hl = resaltador(terminos);

  const facetHTML = Object.entries(FACETAS)
    .map(([k, [lab, get, mostrar]]) => {
      const cuenta = {};
      coincidencias
        .filter((r) => pasa(r.n, k))
        .forEach((r) => [].concat(get(r.n)).forEach((v) => (cuenta[v] = (cuenta[v] || 0) + 1)));
      const claves = Object.keys(cuenta).sort((a, b) => (k === 'anio' ? b - a : 0));
      if (!claves.length) return '';
      return `<fieldset><legend>${lab}</legend>${claves
        .map(
          (v) =>
            `<label><input type="checkbox" data-f="${k}" value="${esc(v)}" ${sel(k).includes(v) ? 'checked' : ''}> <span>${k === 'estado' ? estado(v) : esc(mostrar(v))}</span><span class="count" aria-label="${cuenta[v]} normas">${cuenta[v]}</span></label>`
        )
        .join('')}</fieldset>`;
    })
    .join('');

  const activos = Object.keys(FACETAS).flatMap((k) =>
    sel(k).map(
      (v) =>
        `<button class="chip chip-x" data-quitar="${k}" data-v="${esc(v)}" aria-label="Quitar filtro ${esc(FACETAS[k][2](v))}">${esc(FACETAS[k][2](v))} ${I('x')}</button>`
    )
  );

  return shellPublic(
    `${pageHead('Buscar normas', 'Consulta pública, sin autenticación. Se buscan coincidencias en el número, el epígrafe, los temas y el texto de cada artículo.')}
    <form class="search search-page" role="search" id="fsearch">
      <label class="sr" for="q2">Buscar normas</label><input id="q2" name="q" type="search" value="${esc(q)}" placeholder="Palabras, número o epígrafe">
      <button class="btn">${I('search')} Buscar</button></form>
    <div class="layout-search mt">
      <details class="card facets" open><summary><b>${I('log')} Filtrar resultados</b></summary>${facetHTML || '<p class="muted">Sin filtros disponibles</p>'}</details>
      <section aria-labelledby="res-tit">
        <div class="row between res-head">
          <h2 id="res-tit" class="h3" aria-live="polite">${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}${q ? ` para «${esc(q)}»` : ''}</h2>
          <div class="field inline"><label for="orden">Ordenar por</label><select id="orden"><option value="pertinencia" ${orden === 'pertinencia' ? 'selected' : ''}>Pertinencia</option><option value="recientes" ${orden === 'recientes' ? 'selected' : ''}>Más recientes</option></select></div>
        </div>
        ${activos.length ? `<div class="row filtros-activos">${activos.join('')}<a href="#/buscar?q=${encodeURIComponent(q)}" class="small">Limpiar todo</a></div>` : ''}
        ${
          filtrados
            .map(({ n }) => tarjetaNorma(n, { resaltar: hl, fragmento: fragmentoCoincidencia(n, terminos) }))
            .join('') ||
          `<div class="card vacio"><h3>No encontramos normas con esos criterios</h3><p class="muted">Revise la ortografía, use menos palabras o quite algún filtro. También puede consultar el <a href="#/glosario">glosario</a>.</p></div>`
        }
      </section></div>`,
    '#/buscar'
  );
}
function bindBuscar() {
  const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const ir = (p) => (location.hash = '#/buscar?' + p);
  $('#fsearch').onsubmit = (e) => {
    e.preventDefault();
    const p = params();
    p.set('q', e.target.q.value.trim());
    ir(p);
  };
  $('#orden').onchange = (e) => {
    const p = params();
    p.set('orden', e.target.value);
    ir(p);
  };
  const quitar = (p, k, v) => {
    const resto = p.getAll(k).filter((x) => x !== v);
    p.delete(k);
    resto.forEach((x) => p.append(k, x));
  };
  $$('[data-f]').forEach((cb) => {
    cb.onchange = () => {
      const p = params();
      quitar(p, cb.dataset.f, cb.value);
      if (cb.checked) p.append(cb.dataset.f, cb.value);
      ir(p);
    };
  });
  $$('[data-quitar]').forEach((b) => {
    b.onclick = () => {
      const p = params();
      quitar(p, b.dataset.quitar, b.dataset.v);
      ir(p);
    };
  });
  // En pantallas estrechas los filtros arrancan plegados para priorizar los resultados.
  if (window.matchMedia('(max-width: 900px)').matches) $('.facets')?.removeAttribute('open');
}

/* ===== Ficha de la norma (RF-22 a RF-29) ===== */
const FICHA = {};
function reiniciarFicha() {
  const tab = new URLSearchParams(location.hash.split('?')[1] || '').get('tab');
  Object.keys(FICHA).forEach((k) => delete FICHA[k]);
  Object.assign(FICHA, { tab: TABS_FICHA.some(([k]) => k === tab) ? tab : 'texto', fecha: HOY, cohorte: '' });
}
const TABS_FICHA = [
  ['texto', 'Texto vigente'],
  ['historial', 'Historial'],
  ['comparar', 'Comparar versiones'],
  ['relaciones', 'Relaciones'],
  ['documentos', 'Documentos'],
];

function panelTexto(n, units) {
  const esHoy = FICHA.fecha === HOY && !FICHA.cohorte;
  const tieneTransicion = units.some((u) => (u.versiones || []).some((v) => v.nota?.transicion));
  return `<form class="card toolbar" id="fdate">
      <div class="field"><label for="fd">${I('calendar')} Ver el texto tal como regía el</label><input type="date" id="fd" value="${FICHA.fecha}" min="${n.fecha}" max="${HOY}"></div>
      ${tieneTransicion ? `<div class="field"><label for="fc">${I('user')} Fecha de ingreso del estudiante</label><input type="date" id="fc" value="${FICHA.cohorte}" max="${HOY}" aria-describedby="fc-h"></div>` : ''}
      <div class="row"><button class="btn sec">Aplicar</button>${esHoy ? '' : `<button type="button" class="btn ghost" id="freset">${I('undo')} Volver al texto vigente</button>`}</div>
      ${tieneTransicion ? '<p class="hint toolbar-hint" id="fc-h">La fecha de ingreso muestra la versión que le aplica al estudiante según el régimen de transición (RB-11).</p>' : ''}
    </form>
    ${esHoy ? '' : `<div class="alert info mb" role="status">${I('info')}<span>Está viendo una <b>versión histórica</b>${FICHA.fecha !== HOY ? ` a la fecha <b>${fmt(FICHA.fecha)}</b>` : ''}${FICHA.cohorte ? `, para un estudiante que ingresó el <b>${fmt(FICHA.cohorte)}</b>` : ''}. Puede no coincidir con el texto vigente hoy.</span></div>`}
    <div class="ficha-body">
      <nav class="toc card" aria-label="Índice de la norma"><p class="tag">Contenido</p>${units
        .filter((u) => u.tipo !== 'paragrafo')
        .map(
          (u) =>
            `<button type="button" data-goto="u-${u.id}" class="${u.tipo === 'titulo' ? 't' : ''}">${esc(u.rotulo)} ${u.tipo === 'titulo' ? '' : esc(u.titulo || '')}</button>`
        )
        .join('')}</nav>
      <article class="card documento" aria-label="Texto de la norma">${renderTexto(n, FICHA.fecha, FICHA.cohorte)}</article>
    </div>`;
}

function panelHistorial(n, units) {
  const eventos = [
    { f: n.fecha, t: `Expedición del ${titulo(n)}`, d: `${organo(n.organo)} · publicado el ${fmt(n.publicado)}` },
    ...(n.afectadaPor || []).map((a) => ({
      f: a.fecha,
      t: `${a.tipo[0].toUpperCase() + a.tipo.slice(1)} — ${a.unidad}`,
      id: a.acto,
      d: a.acto,
    })),
  ].sort((a, b) => a.f.localeCompare(b.f));
  const conVersiones = units.filter((u) => (u.versiones || []).length > 1);
  return `<div class="grid g2">
    <section class="card"><h3>Línea de tiempo</h3><ol class="timeline">${eventos
      .map(
        (
          e
        ) => `<li><time datetime="${e.f}" class="chip">${fmt(e.f)}</time><p><b>${esc(e.t)}</b><br><span class="muted">${e.id ? `Por ${linkNorma(e.id)}` : esc(e.d)}</span></p>
        <button class="btn sm ghost" data-at="${e.f}">${I('clock')} Ver el texto a esta fecha</button></li>`
      )
      .join('')}</ol></section>
    <section class="card"><h3>Versiones por artículo</h3>${
      conVersiones
        .map(
          (
            u
          ) => `<details class="version-det"><summary><b>${esc(u.rotulo)}</b> ${esc(u.titulo || '')} <span class="chip">${u.versiones.length} versiones</span></summary>
          ${u.versiones
            .map(
              (v, i) =>
                `<div class="version"><span class="chip">${fmt(v.desde)} → ${v.hasta ? fmt(v.hasta) : 'hoy'}</span>${i === u.versiones.length - 1 ? ` <span class="chip chip-ok">${I('check')} vigente</span>` : ''}<p class="texto-norma">${esc(v.texto)}</p></div>`
            )
            .join('')}</details>`
        )
        .join('') || '<p class="muted">Ningún artículo de esta norma ha tenido más de una versión.</p>'
    }
    ${n.anexos ? `<h3>Anexos</h3><ul class="lista-plana">${n.anexos.map((a) => `<li>${I('file')} ${esc(a.nombre)} <span class="chip">${a.version}</span> ${a.vigente ? '' : estado('derogada')}</li>`).join('')}</ul>` : ''}
    </section></div>`;
}

function panelComparar(n, units) {
  const multi = units.filter((u) => (u.versiones || []).length > 1);
  if (!multi.length)
    return `<div class="card vacio"><p class="muted">Esta norma aún no tiene versiones distintas para comparar.</p></div>`;
  const fechas = [...new Set(multi.flatMap((u) => u.versiones.map((v) => v.desde)))].sort();
  const A = FICHA.cmpA || fechas[0];
  const B = FICHA.cmpB || fechas[fechas.length - 1];
  const opciones = (sel) =>
    fechas.map((f) => `<option ${f === sel ? 'selected' : ''} value="${f}">${fmt(f)}</option>`).join('');
  return `<div class="card toolbar">
      <div class="field"><label for="ca">Versión anterior (vigente desde)</label><select id="ca">${opciones(A)}</select></div>
      <div class="field"><label for="cb">Versión posterior (vigente desde)</label><select id="cb">${opciones(B)}</select></div>
      <p class="muted diff leyenda-diff"><ins>texto añadido</ins> <del>texto suprimido</del></p></div>
    <div class="card diff documento">${multi
      .map((u) => {
        const va = verAt(u, A)?.texto || '(no existía)';
        const vb = verAt(u, B)?.texto || '(no existía)';
        return `<div class="unit"><b>${esc(u.rotulo)}</b> ${esc(u.titulo || '')} ${va === vb ? '<span class="chip">sin cambios</span>' : ''}<p class="texto-norma">${diffWords(va, vb)}</p></div>`;
      })
      .join('')}</div>`;
}

function panelRelaciones(n) {
  const tabla = (filas, col) =>
    filas.length
      ? `<div class="tablewrap"><table><thead><tr><th scope="col">${col}</th><th scope="col">Afectación</th><th scope="col">Unidad</th><th scope="col">Fecha</th></tr></thead><tbody>${filas
          .map(
            (a) =>
              `<tr><td>${linkNorma(a.acto)}</td><td><span class="chip">${esc(a.tipo)}</span></td><td>${esc(a.unidad)}</td><td>${fmt(a.fecha)}</td></tr>`
          )
          .join('')}</tbody></table></div>`
      : '';
  return `<div class="grid g2">
    <section class="card"><h3>Actos que afectan esta norma</h3>${tabla(n.afectadaPor || [], 'Acto') || '<p class="muted">Ningún acto ha afectado esta norma.</p>'}</section>
    <section class="card"><h3>Normas que este acto afecta</h3>${tabla(n.afecta || [], 'Norma') || '<p class="muted">Este acto no afecta otras normas.</p>'}
    ${n.concordancias ? `<h3>Concordancias</h3><p>${n.concordancias.map(linkNorma).join(', ')}</p>` : ''}</section></div>`;
}

function panelDocumentos(n) {
  const tarjeta = (ic, tit, desc, cuerpo, destacado) =>
    `<section class="card doc-card${destacado ? ' destacado' : ''}"><h3>${I(ic)} ${tit}</h3><p class="muted">${desc}</p>${cuerpo}</section>`;
  return `<div class="grid g3">
    ${tarjeta('shield', 'Original firmado (PDF)', 'Único documento con fe pública. Su huella SHA-256 se verifica en cada descarga (RNF-04).', `<p class="hash">SHA-256: ${n.sha}</p><button class="btn" data-dl="orig">${I('down')} Descargar original</button>`, true)}
    ${tarjeta('file', 'Texto consolidado', 'Incluye la leyenda de carácter informativo. Disponible en formatos abiertos (RNF-09).', `<div class="row"><button class="btn sec sm" data-dl="html">HTML</button><button class="btn sec sm" data-dl="pdf">PDF</button><button class="btn sec sm" data-dl="json">JSON</button><button class="btn sec sm" data-dl="xml">Akoma Ntoso</button></div>`)}
    ${tarjeta('check', 'Constancia de consulta', 'PDF con fecha, hora, versión consultada y código de verificación. No es una certificación de vigencia (RF-27).', `<button class="btn sec" id="btn-const">Generar constancia</button>`)}
    ${tarjeta('edit', 'Plantilla de concordancia', 'Texto vigente en la plantilla institucional editable, para elaborar proyectos de reforma (RF-29).', `<button class="btn sec" data-dl="docx">${I('down')} Exportar plantilla</button>`)}
    ${tarjeta('link', 'Dirección permanente', 'Los enlaces antiguos a PDF del dominio institucional redirigen aquí (HTTP 301).', `<p class="hash">normatividad.unicordoba.edu.co/n/${n.id}</p><button class="btn sec" id="btn-copy">Copiar enlace</button>`)}
  </div>`;
}

function vNorma(id) {
  const n = norma(id);
  if (!n)
    return shellPublic(
      `<div class="card vacio"><h1>Norma no encontrada</h1><p>El identificador <code>${esc(id)}</code> no corresponde a ninguna norma publicada.</p><a class="btn" href="#/buscar">${I('search')} Ir a la búsqueda</a></div>`,
      '#/buscar'
    );
  const units = flatUnits(unidadesDe(n));
  const t = FICHA.tab;
  const paneles = {
    texto: panelTexto,
    historial: panelHistorial,
    comparar: panelComparar,
    relaciones: panelRelaciones,
    documentos: panelDocumentos,
  };
  const panel = paneles[t](n, units);
  const ultima = [...(n.afectadaPor || [])].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const sub = S.subs.has(n.id);

  return shellPublic(
    `<nav class="breadcrumb" aria-label="Ruta de navegación"><ol><li><a href="#/">Inicio</a></li><li><a href="#/buscar">Normas</a></li><li aria-current="page">${esc(titulo(n))}</li></ol></nav>
    <div class="legend" role="note">${I('alert')}<span><b>Carácter informativo.</b> El texto consolidado facilita la consulta y no sustituye el acto original. La fe pública reside exclusivamente en el <button class="linklike" data-tab="documentos">original firmado</button>.</span></div>
    <section class="card ficha" aria-labelledby="ficha-tit">
      <div class="ficha-head">
        <div><p class="tag">${organo(n.organo)} · ${tipo(n.tipo)}${n.troncal ? ' · Norma troncal' : ''}</p>
          <h1 id="ficha-tit">${titulo(n)}</h1><p class="ficha-epi">${esc(n.epigrafe)}</p></div>
        <aside class="vigencia-box" aria-label="Estado de vigencia">
          <span class="tag">Estado de vigencia</span>${estado(n.estado, true)}
          <p class="muted small">${ESTADOS[n.estado].desc}</p>
          ${ultima ? `<p class="small"><b>Última afectación:</b> ${fmt(ultima.fecha)}, ${esc(ultima.tipo)} por ${linkNorma(ultima.acto)}</p>` : ''}
          <button class="btn sm ${sub ? '' : 'sec'}" id="btn-sub" aria-pressed="${sub}">${I('bell')} ${sub ? 'Suscrito a alertas' : 'Recibir alertas de cambios'}</button>
        </aside>
      </div>
      <dl class="meta">
        <div><dt>Identificador</dt><dd>${n.id}</dd></div><div><dt>Expedición</dt><dd>${fmt(n.fecha)}</dd></div>
        <div><dt>Publicación</dt><dd>${fmt(n.publicado)}</dd></div><div><dt>Última actualización</dt><dd>${fmt(n.actualizado)}</dd></div>
        <div><dt>Responsable</dt><dd>${esc(n.responsable)}</dd></div><div><dt>Radicado Orfeo</dt><dd>${esc(n.radicado)}</dd></div>
        <div><dt>Temas</dt><dd>${n.temas.map(esc).join(', ')}</dd></div><div><dt>Afectaciones</dt><dd>${(n.afectadaPor || []).length} recibidas · ${(n.afecta || []).length} realizadas</dd></div>
      </dl>
    </section>
    <div class="tabs" role="tablist" aria-label="Secciones de la ficha">${TABS_FICHA.map(
      ([k, l]) =>
        `<button role="tab" id="tab-${k}" aria-controls="panel-ficha" aria-selected="${k === t}" tabindex="${k === t ? 0 : -1}" data-tab="${k}">${l}</button>`
    ).join('')}</div>
    <div class="tabpanel" role="tabpanel" id="panel-ficha" aria-labelledby="tab-${t}">${panel}</div>`,
    '#/buscar'
  );
}

function bindNorma(id) {
  const n = norma(id);
  if (!n) return;
  const irTab = (k, enfocar) => {
    FICHA.tab = k;
    render();
    if (enfocar) $(`#tab-${k}`)?.focus();
  };
  $$('[data-tab]').forEach((b) => (b.onclick = () => irTab(b.dataset.tab, b.getAttribute('role') !== 'tab')));
  // Patrón ARIA de pestañas: flechas izquierda/derecha, Inicio y Fin.
  $('[role=tablist]').addEventListener('keydown', (e) => {
    const i = TABS_FICHA.findIndex(([k]) => k === FICHA.tab);
    const mov = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS_FICHA.length - 1 }[e.key];
    if (mov === undefined) return;
    e.preventDefault();
    irTab(TABS_FICHA[(mov + TABS_FICHA.length) % TABS_FICHA.length][0], true);
  });
  $$('[data-goto]').forEach((b) => {
    b.onclick = () => {
      const destino = document.getElementById(b.dataset.goto);
      destino?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      destino?.classList.add('destacar');
      setTimeout(() => destino?.classList.remove('destacar'), 1600);
    };
  });
  const fd = $('#fdate');
  if (fd)
    fd.onsubmit = (e) => {
      e.preventDefault();
      FICHA.fecha = $('#fd').value || HOY;
      FICHA.cohorte = $('#fc')?.value || '';
      render();
    };
  $('#freset') &&
    ($('#freset').onclick = () => {
      Object.assign(FICHA, { fecha: HOY, cohorte: '' });
      render();
    });
  $$('[data-at]').forEach((b) => {
    b.onclick = () => {
      Object.assign(FICHA, { tab: 'texto', fecha: b.dataset.at, cohorte: '' });
      render();
    };
  });
  if ($('#ca')) {
    $('#ca').onchange = (e) => ((FICHA.cmpA = e.target.value), render());
    $('#cb').onchange = (e) => ((FICHA.cmpB = e.target.value), render());
  }
  $('#btn-sub').onclick = () => {
    if (S.subs.has(id)) {
      S.subs.delete(id);
      guardarSesion();
      toast('Suscripción cancelada');
      return render();
    }
    modal(
      `<h2>${I('bell')} Alertas de cambios</h2><p>Reciba un correo cuando se publique una afectación sobre <b>${esc(titulo(n))}</b> o sobre su tema (RF-31).</p>
      <form id="fsub" novalidate><div class="field"><label for="em">Correo electrónico <span class="req" aria-hidden="true">*</span></label><input id="em" type="email" required autocomplete="email" placeholder="nombre@correo.com" aria-describedby="em-err"><span class="msg e" id="em-err" role="alert"></span></div>
      <fieldset class="radios"><legend>Quiero recibir avisos de</legend><label><input type="radio" name="al" checked> Solo esta norma</label><label><input type="radio" name="al"> Todo el tema «${esc(n.temas[0])}»</label></fieldset>
      <div class="row end"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn">Suscribirme</button></div></form>`,
      (bg, close) => {
        $('#fsub', bg).onsubmit = (e) => {
          e.preventDefault();
          const em = $('#em', bg);
          if (!em.checkValidity()) {
            em.setAttribute('aria-invalid', 'true');
            $('#em-err', bg).textContent = 'Escriba un correo electrónico válido.';
            return em.focus();
          }
          S.subs.add(id);
          guardarSesion();
          close();
          toast('Suscripción registrada. Recibirá alertas en su correo.');
          render();
        };
      }
    );
  };
  $$('[data-dl]').forEach((b) => (b.onclick = () => descargarNorma(n, b.dataset.dl)));
  $('#btn-const') && ($('#btn-const').onclick = () => constanciaConsulta(n));
  $('#btn-copy') &&
    ($('#btn-copy').onclick = () => {
      navigator.clipboard?.writeText(`https://normatividad.unicordoba.edu.co/n/${n.id}`).catch(() => {});
      toast('Enlace permanente copiado');
    });
}

/** Genera las descargas de la ficha (RF-26, RNF-09). Todas incluyen la leyenda informativa (RB-01). */
function descargarNorma(n, formato) {
  const unidades = flatUnits(unidadesDe(n))
    .filter((u) => u.versiones)
    .map((u) => ({
      unidad: u.rotulo,
      titulo: u.titulo,
      texto: verAt(u, HOY)?.texto,
      nota: verAt(u, HOY)?.nota || null,
    }))
    .filter((u) => u.texto);
  switch (formato) {
    case 'orig':
      return toast(`Huella SHA-256 verificada (${n.sha}). Descarga del original simulada.`, 'shield');
    case 'docx':
      return toast('Plantilla de concordancia exportada (simulado): conserva numeración y notas de vigencia.', 'down');
    case 'json':
      return download(
        `${n.id}.json`,
        JSON.stringify(
          { id: n.id, titulo: titulo(n), estado: ESTADOS[n.estado].label, leyenda: LEYENDA_INFORMATIVA, unidades },
          null,
          2
        ),
        'application/json'
      );
    case 'xml':
      return download(
        `${n.id}.akn.xml`,
        `<?xml version="1.0" encoding="UTF-8"?>\n<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"><act name="${n.id}"><preface><p>${esc(n.epigrafe)}</p><p>${LEYENDA_INFORMATIVA}</p></preface><body>${unidades
          .map(
            (u) =>
              `<article><num>${esc(u.unidad)}</num><heading>${esc(u.titulo || '')}</heading><content><p>${esc(u.texto)}</p></content></article>`
          )
          .join('')}</body></act></akomaNtoso>`,
        'application/xml'
      );
    default:
      download(
        `${n.id}-consolidado.html`,
        `<!doctype html><html lang="es"><meta charset="utf-8"><title>${titulo(n)} (consolidado)</title><body style="font-family:Georgia,serif;max-width:720px;margin:2em auto;line-height:1.6"><p style="border:2px solid #c9a227;padding:8px"><b>${LEYENDA_INFORMATIVA}</b></p><h1>${titulo(n)}</h1><p><i>${esc(n.epigrafe)}</i></p>${renderTexto(n, HOY)}</body></html>`
      );
      if (formato === 'pdf')
        toast('En producción se genera el PDF con la misma leyenda; aquí se descargó la versión HTML.', 'info');
  }
}

/** Constancia de consulta imprimible (RF-27). Usa un código de verificación, no "autenticidad" (OBS-15). */
function constanciaConsulta(n) {
  const ts = `${HOY} ${new Date().toTimeString().slice(0, 8)}`;
  const codigo = hashStr(n.id + ts)
    .slice(0, 12)
    .toUpperCase()
    .match(/.{4}/g)
    .join('-');
  modal(
    `<h2>Constancia de consulta</h2><div class="doc-paper" id="constancia">
      <p class="doc-paper-head"><b>UNIVERSIDAD DE CÓRDOBA</b><br>Secretaría General · SGD-LEGAL</p>
      <p>Se deja constancia de que el <b>${ts}</b> se consultó en el portal de normatividad la siguiente norma:</p>
      <p><b>${titulo(n)}</b> (${n.id})<br>${esc(n.epigrafe)}<br>Estado de vigencia registrado: <b>${ESTADOS[n.estado].label}</b><br>Versión consultada: texto vigente al ${fmt(FICHA.fecha)}</p>
      <p class="small"><i>Esta constancia no constituye certificación de vigencia. El texto consolidado tiene carácter informativo y no sustituye el acto original (RB-01).</i></p>
      <p class="hash">Código de verificación: ${codigo}</p></div>
    <div class="row end no-print"><button class="btn ghost" data-close>Cerrar</button><button class="btn" id="imprimir">${I('down')} Descargar PDF</button></div>`,
    (bg) => ($('#imprimir', bg).onclick = () => window.print())
  );
}

/* ===== Glosario (RF-28) ===== */
function vGlosario() {
  return shellPublic(
    `${pageHead('Glosario', 'Conceptos básicos para entender la normativa interna, los tipos de norma y los estados de vigencia.')}
    <div class="grid g2"><section aria-labelledby="g-tipos"><h2 id="g-tipos">Tipos de norma</h2>${TIPOS.map((t) => `<div class="card mb-sm"><h3>${t.nombre}</h3><p class="muted">${t.desc}</p></div>`).join('')}
      <h2>Estados de vigencia</h2><dl class="estados-grid una-col">${Object.keys(ESTADOS)
        .map((k) => `<div><dt>${estado(k)}</dt><dd class="muted">${ESTADOS[k].desc}</dd></div>`)
        .join('')}</dl></section>
    <section aria-labelledby="g-term"><h2 id="g-term">Términos</h2>${GLOSARIO.filter((g) => !g[0].startsWith('Estado:'))
      .map(([t, d]) => `<details class="card acordeon"><summary>${t}</summary><p>${d}</p></details>`)
      .join('')}</section></div>`,
    '#/glosario'
  );
}

/* ===== Compilaciones temáticas (RF-30) ===== */
function vCompilacion() {
  return shellPublic(
    `${pageHead('Compilaciones temáticas', 'Genere una compilación exportable de las normas vigentes de uno o varios temas, con referencia a sus originales firmados. Útil para documentos maestros y procesos de autoevaluación.')}
    <div class="grid g-side"><form class="card" id="fcomp"><fieldset><legend class="h3">1. Temas</legend>${TEMAS.map(
      (t) =>
        `<label class="check"><input type="checkbox" name="t" value="${t}" ${t === 'Reglamento estudiantil' ? 'checked' : ''}> ${t} <span class="muted">(${NORMAS.filter((n) => n.temas.includes(t)).length})</span></label>`
    ).join('')}</fieldset>
      <fieldset><legend class="h3">2. Opciones</legend><label class="check"><input type="checkbox" id="solov" checked> Solo normas vigentes (total o parcialmente)</label></fieldset>
      <button class="btn mt">${I('layers')} Actualizar vista previa</button></form>
    <section class="card" id="compres" aria-live="polite"></section></div>`,
    '#/compilacion'
  );
}
function bindCompilacion() {
  const generar = (e) => {
    if (e) e.preventDefault();
    const temas = $$('[name=t]:checked').map((x) => x.value);
    const solo = $('#solov').checked;
    const lista = NORMAS.filter(
      (n) => n.temas.some((t) => temas.includes(t)) && (!solo || ESTADOS_VIGENTES.includes(n.estado))
    );
    $('#compres').innerHTML =
      `<div class="row between"><h2 class="h3">Vista previa · ${lista.length} norma${lista.length === 1 ? '' : 's'}</h2><button class="btn sm" id="dlc" ${lista.length ? '' : 'disabled'}>${I('down')} Exportar PDF</button></div>
      <div class="legend mb">${I('alert')}<span>Compilación informativa generada el ${fmt(HOY)}. Consulte los originales firmados.</span></div>
      ${lista.map((n) => `<div class="unit"><div class="row between"><b>${linkNorma(n.id)}</b>${estado(n.estado)}</div><p class="muted">${esc(n.epigrafe)}</p><span class="hash">Original: SHA-256 ${n.sha}</span></div>`).join('') || '<p class="muted">Seleccione al menos un tema con normas.</p>'}`;
    $('#dlc').onclick = () => toast('Compilación exportada (simulado)', 'down');
  };
  $('#fcomp').onsubmit = generar;
  $('#fcomp').onchange = generar; // la vista previa responde a cada cambio
  generar();
}

/* ===== Datos abiertos (RF-35, RI-08) ===== */
function vApi() {
  const n = norma('CSU-ACU-2004-004');
  const ejemplo = {
    id: n.id,
    tipo: tipo(n.tipo),
    numero: n.numero,
    anio: n.anio,
    organo: organo(n.organo),
    estado: ESTADOS[n.estado].label.toLowerCase(),
    url: `https://normatividad.unicordoba.edu.co/n/${n.id}`,
    afectaciones: n.afectadaPor.length,
  };
  const endpoints = [
    ['/api/v1/normas?q=&tipo=&organo=&estado=', 'Búsqueda por texto y facetas'],
    ['/api/v1/normas/{id}', 'Ficha de una norma'],
    ['/api/v1/normas/{id}/texto?fecha=', 'Texto vigente o a una fecha'],
    ['/api/v1/normas/{id}/versiones', 'Versiones de sus unidades'],
    ['/api/v1/normas/{id}/afectaciones', 'Afectaciones en ambos sentidos'],
    ['/api/v1/normas/{id}/akn', 'Estructura en Akoma Ntoso (XML)'],
  ];
  return shellPublic(
    `${pageHead('Datos abiertos y API', 'API REST de consulta en JSON, documentada con OpenAPI 3 y con límites de uso. Entrega la misma información de la ficha pública, conforme a la Ley 1712 de 2014.')}
    <div class="grid g2"><section class="card"><h2 class="h3">Servicios disponibles</h2><div class="tablewrap"><table><thead><tr><th scope="col">Método</th><th scope="col">Ruta</th><th scope="col">Descripción</th></tr></thead><tbody>
      ${endpoints.map(([r, d]) => `<tr><td><span class="chip">GET</span></td><td class="hash">${r}</td><td>${d}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card"><h2 class="h3">Respuesta de ejemplo</h2><pre class="codigo"><code>GET /api/v1/normas/${n.id}\n\n${esc(JSON.stringify(ejemplo, null, 2))}</code></pre></section></div>`,
    '#/api'
  );
}

/* ===== Ingreso de funcionarios (SSO simulado, RF-32, RI-04) ===== */
const DESC_ROL = {
  Registrador: 'Reserva números, registra actos, estructura el texto y registra afectaciones.',
  Validador: 'Revisa y aprueba consolidaciones en la Secretaría General; puede escalar o devolver.',
  'Validador jurídico': 'Atiende los casos escalados a la Oficina de Asuntos Jurídicos.',
  Administrador: 'Gestiona usuarios, roles y catálogos.',
  Auditor: 'Consulta la pista de auditoría encadenada.',
};
function vLogin() {
  return shellPublic(
    `<div class="login"><div class="card">
      <div class="row">${emblema(44)}<div><h1>Ingreso de funcionarios</h1><p class="muted">Consola de gestión normativa · Secretaría General</p></div></div>
      <div class="alert info mt">${I('info')}<span>Los roles internos se autentican con la cuenta institucional a través del proveedor de identidad (OpenID Connect). No se crean credenciales adicionales (RES-03). Para consultar normas no necesita ingresar.</span></div>
      <button class="btn btn-block mt" id="sso">${I('shield')} Continuar con la cuenta @correo.unicordoba.edu.co</button>
      <div id="roles" hidden><h2 class="h3 mt">Demostración: elija el rol con el que desea ingresar</h2>
      ${Object.entries(ROLES)
        .map(
          ([r, v]) =>
            `<a class="result" href="#/login/${encodeURIComponent(r)}"><div class="row between"><b>${r}</b><span class="muted">${v.nombre}</span></div><p class="result-epi">${DESC_ROL[r]}</p></a>`
        )
        .join('')}</div>
    </div></div>`,
    ''
  );
}
function bindLogin() {
  $('#sso').onclick = () => {
    $('#sso').disabled = true;
    $('#sso').textContent = 'Autenticando con el proveedor de identidad…';
    setTimeout(() => {
      $('#sso').hidden = true;
      $('#roles').hidden = false;
      $('#roles a')?.focus();
    }, 600);
  };
}
