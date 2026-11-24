/* SGD-LEGAL Unicórdoba — prototipo navegable (SPA sin dependencias, enrutado por hash) */
'use strict';

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const HOY = '2026-11-23';
const fmt = (d) => {
  if (!d) return '—';
  const [y, m, dd] = d.slice(0, 10).split('-');
  return `${+dd} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]} ${y}`;
};
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  half: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  pause: '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  alert:
    '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z"/><path d="M4 19.5V21h16"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  inbox:
    '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  log: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  compare: '<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 2v20"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
};
const I = (n, extra = '') => `<svg class="i" ${extra} viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
const estado = (k, big) => {
  const e = ESTADOS[k];
  return `<span class="st ${e.cls}${big ? ' big' : ''}" title="${esc(e.desc)}">${I(e.icon)}${e.label}</span>`;
};
const organo = (id) => ORGANOS.find((o) => o.id === id)?.nombre || id;
const tipo = (id) => TIPOS.find((t) => t.id === id)?.nombre || id;
const norma = (id) => NORMAS.find((n) => n.id === id);
const titulo = (n) => `${tipo(n.tipo)} ${n.numero} de ${n.anio}`;
/** Etiqueta de un estado del flujo de publicación (RF-17). Texto + icono, nunca solo color. */
const ICONO_FLUJO = { publicado: 'check', escalado: 'up', devuelto: 'undo', validacion: 'compare', reservado: 'hash' };
const flujoChip = (k) => `<span class="chip flujo flujo-${k}">${I(ICONO_FLUJO[k] || 'clock')} ${FLUJO_LABEL[k]}</span>`;
const linkNorma = (id) => (norma(id) ? `<a href="#/norma/${id}">${esc(titulo(norma(id)))}</a>` : esc(id));
function toast(msg, ic = 'check') {
  $$('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = I(ic) + esc(msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
/**
 * Diálogo modal accesible: atrapa el foco, se cierra con Escape o clic fuera,
 * y devuelve el foco al elemento que lo abrió.
 */
function modal(html, onMount) {
  const previo = document.activeElement;
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-tit" tabindex="-1">${html}</div>`;
  const h = $('h2', bg);
  if (h) h.id = 'modal-tit';
  const enfocables = () => $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea', bg);
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key !== 'Tab') return;
    const f = enfocables();
    if (!f.length) return;
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };
  function close() {
    bg.remove();
    document.removeEventListener('keydown', onKey);
    if (previo && document.contains(previo)) previo.focus();
  }
  bg.addEventListener('click', (e) => {
    if (e.target === bg || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(bg);
  ($('input,textarea,select', bg) || $('.modal', bg)).focus();
  if (onMount) onMount(bg, close);
  return close;
}
function hashStr(s) {
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}
function download(name, content, type = 'text/html') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
