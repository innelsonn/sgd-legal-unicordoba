/* ---------- estado de la demo ---------- */
const S = {
  user: null,
  subs: new Set(),
  bandeja: BANDEJA.map((b) => ({ ...b })),
  audit: AUDITORIA.map((a) => [...a]),
  reservados: ['CSU-ACU-2026-042'],
  /** Ids de actos publicados durante la demo; su efecto se reaplica al recargar. */
  publicados: [],
  /** Números anulados con constancia: no se reasignan (RB-03). */
  anulados: [],
  wiz: null,
  catalogos: {
    'Órganos emisores': ORGANOS.map((o) => o.nombre),
    'Tipos de acto': TIPOS.map((t) => t.nombre),
    Temas: [...TEMAS],
    'Tipos de afectación': [...TIPOS_AFECT],
    'Plazos del flujo (días hábiles)': [
      'Estructuración: 4',
      'Validación: 5',
      'Escalamiento jurídico: 5',
      'Devolución: 2',
    ],
  },
};
const ROLES = {
  Registrador: { nombre: 'Laura Díaz', login: 'ldiaz', menu: ['bandeja', 'reservar', 'registrar', 'auditoria'] },
  Validador: { nombre: 'Mario Pérez', login: 'mperez', menu: ['bandeja', 'validar', 'auditoria'] },
  'Validador jurídico': { nombre: 'Andrea Ruiz', login: 'aruiz', menu: ['bandeja', 'validar'] },
  Administrador: { nombre: 'Carlos Gómez', login: 'admin', menu: ['bandeja', 'admin', 'auditoria'] },
  Auditor: { nombre: 'Sofía Martínez', login: 'smartinez', menu: ['auditoria'] },
};
function audit(accion, objeto, antes, despues) {
  const d = new Date();
  const ts = `${HOY} ${d.toTimeString().slice(0, 8)}`;
  S.audit.unshift([ts, S.user?.login || 'sistema', S.user?.rol || 'Sistema', accion, objeto, antes, despues]);
  guardarSesion();
}

/* ---------- persistencia de la demo ----------
 * La sesión de demostración se conserva en sessionStorage para que recargar la página
 * no la reinicie. Si el almacenamiento no está disponible (modo privado, vista previa),
 * la demo sigue funcionando solo en memoria.
 */
const CLAVE_SESION = 'sgd-legal-demo-v1';

function guardarSesion() {
  try {
    const { user, bandeja, audit, reservados, publicados, anulados } = S;
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ user, bandeja, audit, reservados, publicados, anulados, subs: [...S.subs] })
    );
  } catch {
    /* almacenamiento no disponible: se continúa en memoria */
  }
}

function cargarSesion() {
  try {
    const raw = sessionStorage.getItem(CLAVE_SESION);
    if (!raw) return;
    const d = JSON.parse(raw);
    Object.assign(S, {
      user: d.user,
      bandeja: d.bandeja,
      audit: d.audit,
      reservados: d.reservados,
      anulados: d.anulados || [],
      publicados: d.publicados || [],
    });
    S.subs = new Set(d.subs || []);
    (d.publicados || []).forEach((id) => {
      const item = S.bandeja.find((b) => b.id === id);
      if (item) aplicarPublicacion(item);
    });
  } catch {
    /* datos corruptos o almacenamiento bloqueado: se parte del estado inicial */
  }
}

/** Reinicia la demo al estado inicial (útil antes de una presentación). */
function reiniciarDemo() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin almacenamiento */
  }
  location.hash = '#/';
  location.reload();
}
