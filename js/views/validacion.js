/* ---------- validación en dos niveles (CU-05, RF-18, RF-19) ---------- */

const CHECKLIST_VALIDACION = [
  'El acto está numerado, fechado y firmado (RB-02)',
  'La afectación es expresa y cita la unidad correcta (RB-04)',
  'La nota de vigencia cita el acto y el artículo (RB-06)',
  'El texto consolidado coincide con el original firmado',
  'Sin datos personales en el texto ni en los anexos (RNF-12)',
];

/** Casos que el rol actual puede trabajar: el validador atiende el 1.er nivel; el jurídico, los escalados. */
function puedeDecidir(caso) {
  const jur = S.user.rol === 'Validador jurídico';
  return (caso.estado === 'validacion' && !jur) || (caso.estado === 'escalado' && jur);
}

/** Datos del comparador: texto vigente de la unidad destino frente a la propuesta del caso. */
function datosComparador(caso) {
  const pr = caso.propuesta;
  if (!pr) return null;
  const destino = norma(pr.destino);
  const unidad = destino && buscarUnidad(destino.unidades || [], pr.unidad);
  if (!unidad) return null;
  // Si el caso ya se publicó, se compara contra la versión que reemplazó.
  const vigente = caso.estado === 'publicado' ? unidad.versiones[unidad.versiones.length - 2] : verAt(unidad, HOY);
  return { destino, unidad, vigente, pr };
}

function vValidar(id) {
  const pendientes = S.bandeja.filter((b) => ['validacion', 'escalado'].includes(b.estado));
  const caso = S.bandeja.find((b) => b.id === id) || pendientes[0];
  if (!caso) {
    return shellConsole(
      `<div class="card vacio"><h1>${I('check')} No hay consolidaciones pendientes</h1><p class="muted">Todos los casos de su nivel están al día.</p><a class="btn" href="#/consola">Volver a la bandeja</a></div>`,
      'validar'
    );
  }
  const editable = puedeDecidir(caso);
  const opciones = pendientes.includes(caso) ? pendientes : [caso, ...pendientes];
  const cmp = datosComparador(caso);
  const t = cmp && titulo(cmp.destino);
  const [, , anio, num] = caso.id.split('-');

  let aviso = '';
  if (caso.estado === 'escalado')
    aviso = `<div class="alert warn mt">${I('alert')}<span><b>Escalado a la Oficina de Asuntos Jurídicos.</b> Motivo: ${esc(caso.motivo || 'sin motivo registrado')}</span></div>`;
  if (caso.estado === 'devuelto' && caso.obs)
    aviso = `<div class="alert warn mt">${I('undo')}<span><b>Devuelto al registrador.</b> Observaciones: ${esc(caso.obs)}</span></div>`;
  if (!editable) {
    const motivo =
      caso.estado === 'publicado'
        ? 'Este acto ya fue publicado; la decisión es de solo lectura.'
        : S.user.rol === 'Validador jurídico'
          ? 'Este caso está en el primer nivel (Secretaría General). El validador jurídico solo atiende casos escalados.'
          : caso.estado === 'escalado'
            ? 'Este caso está escalado a Jurídica; la decisión corresponde a esa oficina.'
            : 'Este caso no está en una etapa de validación.';
    aviso += `<div class="alert info mt">${I('info')}<span>${motivo}</span></div>`;
  }

  const comparador = cmp
    ? `<div class="compare">
        <div><span class="tag">Texto vigente · ${esc(t)}, ${esc(cmp.unidad.rotulo.replace(/\.$/, ''))}</span>
          <p class="texto-norma">${esc(cmp.vigente.texto)}</p>${notaHTML(cmp.vigente.nota)}</div>
        <div><span class="tag">Propuesta consolidada</span>
          <p class="texto-norma diff">${diffWords(cmp.vigente.texto, cmp.pr.texto)}</p>
          <div class="nota">${I('info')}<span><b>Nota de vigencia (generada):</b> ${etiquetaAfectacion(cmp.pr.tipo)} por el ${esc(cmp.pr.art)} del Acuerdo ${num} de ${anio}.</span></div></div>
      </div>
      <p class="muted leyenda-diff diff"><ins>texto añadido</ins> <del>texto suprimido</del></p>`
    : `<div class="card"><p class="muted">Este caso no tiene una propuesta de consolidación generada.</p></div>`;

  return shellConsole(
    `<div class="page-head"><div><h1>Validar consolidación</h1><p class="muted">CU-05 · Validación en dos niveles (RF-18)</p></div>
      <div class="field inline"><label for="vsel">Caso</label><select id="vsel">${opciones
        .map(
          (b) =>
            `<option value="${b.id}" ${b.id === caso.id ? 'selected' : ''}>${b.id} · ${FLUJO_LABEL[b.estado]}</option>`
        )
        .join('')}</select></div></div>
    <section class="card mb" aria-labelledby="caso-tit"><div class="row between"><div><span class="tag">${caso.id}</span>
      <h2 id="caso-tit" class="h3">${esc(caso.epigrafe)}</h2><span class="muted">Registrado por L. Díaz · Responsable actual: ${esc(caso.resp)}</span></div>
      ${flujoChip(caso.estado)}</div>${aviso}</section>
    <h2>Comparador de dos columnas</h2>${comparador}
    <div class="grid g2 mt"><fieldset class="card checklist"><legend>Lista de verificación</legend>
      ${CHECKLIST_VALIDACION.map((c, i) => `<label><input type="checkbox" class="chk" ${i < 3 || caso.estado === 'publicado' ? 'checked' : ''} ${editable ? '' : 'disabled'}> ${c}</label>`).join('')}</fieldset>
    <section class="card" aria-labelledby="dec-tit"><h3 id="dec-tit">Decisión</h3><p class="muted small">La fecha y hora de publicación se registran automáticamente y no son editables (RB-09). La ficha se sincroniza con el portal institucional (RF-19).</p>
      <div class="row"><button class="btn" id="v-ok" ${editable ? '' : 'disabled'}>${I('check')} Aprobar y publicar</button>
      ${S.user.rol === 'Validador jurídico' ? '' : `<button class="btn warn" id="v-esc" ${editable ? '' : 'disabled'}>${I('up')} Escalar a Jurídica</button>`}
      <button class="btn sec" id="v-dev" ${editable ? '' : 'disabled'}>${I('undo')} Devolver al registrador</button></div></section></div>`,
    'validar'
  );
}

/** Modal que exige un texto (motivo u observación) antes de confirmar. */
function pedirTexto(tit, etiqueta, boton, alConfirmar) {
  modal(
    `<h2>${tit}</h2><div class="field"><label for="mt">${etiqueta} <span class="req" aria-hidden="true">*</span></label><textarea id="mt" rows="4" required aria-describedby="mt-err"></textarea><span class="msg e" id="mt-err" role="alert"></span></div>
    <div class="row end"><button class="btn ghost" data-close>Cancelar</button><button class="btn" id="mok">${boton}</button></div>`,
    (bg, close) => {
      $('#mok', bg).onclick = () => {
        const v = $('#mt', bg).value.trim();
        if (!v) {
          $('#mt', bg).setAttribute('aria-invalid', 'true');
          $('#mt-err', bg).textContent = 'Este campo es obligatorio.';
          $('#mt', bg).focus();
          return;
        }
        close();
        alConfirmar(v);
      };
    }
  );
}

function bindValidar(id) {
  const caso =
    S.bandeja.find((b) => b.id === id) || S.bandeja.find((b) => ['validacion', 'escalado'].includes(b.estado));
  const sel = $('#vsel');
  if (sel) sel.onchange = (e) => (location.hash = '#/consola/validar/' + e.target.value);
  if (!caso || !puedeDecidir(caso)) return;

  $('#v-ok').onclick = () => {
    if ($$('.chk').some((c) => !c.checked)) {
      toast('Complete la lista de verificación antes de aprobar', 'alert');
      $('.chk:not(:checked)')?.focus();
      return;
    }
    const ts = `${HOY} ${new Date().toTimeString().slice(0, 5)}`;
    const prev = FLUJO_LABEL[caso.estado];
    Object.assign(caso, { estado: 'publicado', resp: S.user.nombre, dias: 0 });
    aplicarPublicacion(caso);
    S.publicados.push(caso.id);
    audit('Aprobó consolidación', caso.id, prev, 'publicado');
    audit('Registró fecha de publicación (RB-09)', caso.id, '—', ts);
    const destino = caso.propuesta && norma(caso.propuesta.destino);
    modal(
      `<h2>${I('check')} Publicado</h2><p><b>${caso.id}</b> se publicó el <b>${ts}</b>.</p>
      ${destino ? `<p>La ficha de <b>${esc(titulo(destino))}</b> ya muestra la nueva versión, con su nota de vigencia y el enlace al acto modificatorio. Se notificó a los suscriptores (RF-31).</p>` : ''}
      <div class="row end"><a class="btn sec" href="#/consola" data-close>Volver a la bandeja</a>${destino ? `<a class="btn" href="#/norma/${destino.id}" data-close>Ver ficha pública</a>` : ''}</div>`
    );
    render();
  };
  $('#v-esc') &&
    ($('#v-esc').onclick = () =>
      pedirTexto('Escalar a la Oficina de Asuntos Jurídicos', 'Motivo del escalamiento', 'Escalar', (v) => {
        Object.assign(caso, { estado: 'escalado', resp: 'Oficina de Asuntos Jurídicos', motivo: v });
        audit('Escaló a Jurídica', caso.id, 'en validación', 'escalado');
        toast('Caso escalado a Jurídica', 'up');
        render();
      }));
  $('#v-dev').onclick = () =>
    pedirTexto('Devolver al registrador', 'Observaciones para el registrador', 'Devolver', (v) => {
      const prev = FLUJO_LABEL[caso.estado];
      Object.assign(caso, { estado: 'devuelto', resp: 'L. Díaz (registrador)', obs: v });
      audit('Devolvió al registrador', caso.id, prev, 'devuelto');
      toast('Devuelto con observaciones', 'undo');
      location.hash = '#/consola';
    });
}
