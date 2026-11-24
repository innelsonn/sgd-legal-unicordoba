/* ---------- versiones y texto ---------- */
function verAt(u, fecha) {
  return (u.versiones || []).find((v) => v.desde <= fecha && (!v.hasta || fecha < v.hasta));
}
function unidadesDe(n) {
  if (n.unidades) return n.unidades;
  const base = n.fecha;
  return [
    {
      id: 'g1',
      tipo: 'titulo',
      rotulo: 'CAPÍTULO ÚNICO',
      titulo: n.epigrafe.replace(/^Por (el|la) cual se /, '').replace(/^./, (c) => c.toUpperCase()),
      hijos: [
        {
          id: 'g-a1',
          tipo: 'articulo',
          rotulo: 'Artículo 1.',
          titulo: 'Objeto',
          versiones: [
            {
              desde: base,
              texto: `El presente acto tiene por objeto ${n.epigrafe.replace(/^Por (el|la) cual se /, '').toLowerCase()}, en el marco de la autonomía universitaria.`,
            },
          ],
        },
        {
          id: 'g-a2',
          tipo: 'articulo',
          rotulo: 'Artículo 2.',
          titulo: 'Ámbito de aplicación',
          versiones: [
            {
              desde: base,
              texto:
                'Las disposiciones del presente acto se aplican a los estamentos y dependencias de la Universidad de Córdoba a los que se refiere su objeto.',
            },
          ],
        },
        {
          id: 'g-a3',
          tipo: 'articulo',
          rotulo: 'Artículo 3.',
          titulo: 'Vigencia',
          versiones: [
            {
              desde: base,
              texto:
                'El presente acto rige a partir de la fecha de su expedición y deroga las disposiciones que le sean contrarias.',
            },
          ],
        },
      ],
    },
  ];
}
function flatUnits(list, out = [], lvl = 0) {
  list.forEach((u) => {
    out.push({ ...u, lvl });
    if (u.hijos) flatUnits(u.hijos, out, lvl + 1);
  });
  return out;
}
function diffWords(a, b) {
  const A = a.split(/(\s+)/),
    B = b.split(/(\s+)/),
    m = A.length,
    n = B.length;
  const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0,
    j = 0,
    out = '';
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      out += esc(A[i]);
      i++;
      j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) {
      // Los espacios suprimidos no se marcan: solo ensuciarían la lectura del cambio.
      out += /^\s+$/.test(A[i]) ? '' : `<del>${esc(A[i])}</del>`;
      i++;
    } else {
      out += /^\s+$/.test(B[j]) ? esc(B[j]) : `<ins>${esc(B[j])}</ins>`;
      j++;
    }
  }
  while (i < m) out += `<del>${esc(A[i++])}</del>`;
  while (j < n) out += `<ins>${esc(B[j++])}</ins>`;
  // Une marcas contiguas (separadas solo por espacios) para resaltar frases completas.
  return out.replace(/<\/del>(\s*)<del>/g, '$1').replace(/<\/ins>(\s*)<ins>/g, '$1');
}
const ETIQUETA_AFECTACION = {
  deroga: 'Derogado',
  modifica: 'Modificado',
  adiciona: 'Adicionado',
  sustituye: 'Sustituido',
  suspende: 'Suspendido',
  anula: 'Anulado',
  corrige: 'Corregido',
  aclara: 'Aclarado',
  reglamenta: 'Reglamentado',
  prorroga: 'Prorrogado',
  'establece régimen de transición': 'Régimen de transición establecido',
};
/** Participio usado en las notas de vigencia ("Modificado por…"). */
const etiquetaAfectacion = (tipoAfect) => ETIQUETA_AFECTACION[tipoAfect] || tipoAfect;

/** Nota de vigencia de una unidad (RF-15, RB-06): cita siempre el acto y el artículo de origen. */
function notaHTML(nt) {
  if (!nt) return '';
  const cls = nt.tipo === 'deroga' ? 'deroga' : nt.transicion ? 'trans' : '';
  const icono = nt.tipo === 'deroga' ? 'x' : nt.transicion ? 'clock' : 'info';
  const articulo = /^Artículos/.test(nt.art) ? 'los' : 'el';
  return `<p class="nota ${cls}">${I(icono)}<span><b>Nota de vigencia:</b> ${etiquetaAfectacion(nt.tipo)} por ${articulo} ${esc(nt.art)} del ${linkNorma(nt.acto)}.${nt.transicion ? ' ' + esc(nt.transicion) : ''}</span></p>`;
}
function renderTexto(n, fecha, cohorte) {
  let html = '';
  const walk = (list) =>
    list.forEach((u) => {
      if (u.tipo === 'titulo') {
        html += `<div class="unit-titulo" id="u-${u.id}">${esc(u.rotulo)}<span>${esc(u.titulo)}</span></div>`;
        walk(u.hijos || []);
        return;
      }
      let v = verAt(u, fecha);
      if (cohorte && v?.nota?.transicion && cohorte < v.desde) {
        const prev = u.versiones[u.versiones.indexOf(v) - 1];
        if (prev)
          v = {
            ...prev,
            notaCohorte: `Según el régimen de transición del ${titulo(norma(v.nota.acto))}, a un estudiante que ingresó el ${fmt(cohorte)} le aplica esta versión.`,
          };
      }
      if (!v) return;
      html += `<div class="unit ${u.tipo === 'paragrafo' ? 'par' : ''} ${v.derogada ? 'derog' : ''}" id="u-${u.id}">
      <span class="rot">${esc(u.rotulo)}</span> ${u.titulo ? `<i>${esc(u.titulo)}.</i>` : ''} <span class="txt texto-norma">${esc(v.texto)}</span>
      ${notaHTML(v.nota)}${v.notaCohorte ? `<div class="nota trans">${I('user')}<span>${esc(v.notaCohorte)}</span></div>` : ''}</div>`;
      if (u.hijos) walk(u.hijos);
    });
  walk(unidadesDe(n));
  return html;
}

/** Busca una unidad por id en un árbol de unidades. */
function buscarUnidad(lista, id) {
  for (const u of lista) {
    if (u.id === id) return u;
    const h = u.hijos && buscarUnidad(u.hijos, id);
    if (h) return h;
  }
  return null;
}

/** Fecha de efectos con la que un caso de la bandeja se publica (la de expedición o, si falta, hoy). */
const fechaEfectos = (item) => (item.fecha && item.fecha <= HOY ? item.fecha : HOY);

/**
 * Aplica a la norma destino la consolidación aprobada de un caso de la bandeja (RF-13 a RF-16, RF-19):
 * cierra la versión vigente de la unidad, agrega la nueva con su nota de vigencia, registra la
 * afectación en ambos sentidos y crea la ficha pública del acto modificatorio.
 * Es idempotente: aplicar dos veces el mismo caso no duplica versiones.
 */
function aplicarPublicacion(item) {
  const pr = item.propuesta;
  if (!pr || norma(item.id)) return;
  const destino = norma(pr.destino);
  const unidad = destino && buscarUnidad(destino.unidades || [], pr.unidad);
  if (!unidad) return;
  const desde = fechaEfectos(item);
  const vigente = verAt(unidad, desde) || unidad.versiones[unidad.versiones.length - 1];
  vigente.hasta = desde;
  unidad.versiones.push({ desde, texto: pr.texto, nota: { tipo: pr.tipo, acto: item.id, art: pr.art } });

  const [org, tip, anio, num] = item.id.split('-');
  NORMAS.push({
    id: item.id,
    tipo: tip,
    numero: num,
    anio: +anio,
    organo: org,
    fecha: desde,
    publicado: HOY,
    epigrafe: item.epigrafe,
    temas: item.temas || destino.temas,
    estado: 'vigente',
    actualizado: HOY,
    responsable: 'Secretaría General',
    radicado: item.radicado || '—',
    sha: hashStr(item.id).slice(0, 4) + '…' + hashStr(item.id).slice(-4),
    afecta: [
      {
        acto: destino.id,
        tipo: pr.tipo,
        unidad: unidad.rotulo.replace('Artículo', 'Art.').replace(/\.$/, ''),
        fecha: desde,
      },
    ],
    afectadaPor: [],
  });
  destino.afectadaPor.push({
    acto: item.id,
    tipo: pr.tipo,
    unidad: unidad.rotulo.replace('Artículo', 'Art.').replace(/\.$/, ''),
    fecha: desde,
  });
  destino.actualizado = HOY;
  if (destino.estado === 'vigente') destino.estado = 'vigente-mod';
}
