// Pruebas de extremo a extremo del prototipo SGD-LEGAL.
// Ejecutar con:  npm test   (requiere Playwright con Chromium instalado)
// Cada prueba indica entre paréntesis el requisito o regla del documento que verifica.

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

const URL_APP = 'file://' + path.resolve(__dirname, '..', 'index.html');
let browser;
let page;
let erroresJS;

before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});
beforeEach(async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();
  erroresJS = [];
  page.on('pageerror', (e) => erroresJS.push(e.message));
  page.on('dialog', (d) => d.accept()); // confirm() de "Reiniciar demo"
  await page.goto(URL_APP);
});

/** Navega por hash y espera a que el enrutador pinte la vista. */
async function ir(hash) {
  await page.evaluate((h) => (location.hash = h), hash);
  await page.waitForTimeout(80);
}
async function entrarComo(rol) {
  await ir('#/login/' + encodeURIComponent(rol));
  await page.waitForSelector('.console');
}
const texto = (sel) => page.locator(sel).first().innerText();

/* ---------- Navegación general ---------- */

test('todas las rutas cargan sin errores de JavaScript', async () => {
  const publicas = [
    '#/',
    '#/buscar',
    '#/buscar?q=matricula',
    '#/glosario',
    '#/compilacion',
    '#/api',
    '#/login',
    '#/norma/CSU-ACU-2024-019',
    '#/norma/NO-EXISTE',
    '#/ruta-inexistente',
  ];
  for (const r of publicas) await ir(r);
  await entrarComo('Registrador');
  for (const r of ['#/consola', '#/consola/reservar', '#/consola/registrar', '#/consola/auditoria']) await ir(r);
  await entrarComo('Administrador');
  await ir('#/consola/admin');
  await entrarComo('Validador');
  await ir('#/consola/validar');
  assert.deepEqual(erroresJS, []);
});

test('cada vista actualiza el título del documento', async () => {
  await ir('#/glosario');
  assert.match(await page.title(), /^Glosario · SGD-LEGAL/);
  await ir('#/norma/CSU-ACU-2004-004');
  assert.match(await page.title(), /^Acuerdo 004 de 2004/);
});

test('una ruta desconocida muestra la página de no encontrada', async () => {
  await ir('#/esto-no-existe');
  assert.match(await texto('main h1'), /no encontrada/i);
});

/* ---------- Búsqueda (RF-21) ---------- */

test('la búsqueda ignora tildes y resalta las coincidencias (RF-21)', async () => {
  const resultados = async (q) => {
    await ir('#/buscar?q=' + encodeURIComponent(q));
    return page.locator('.result h3').allInnerTexts();
  };
  const conTilde = await resultados('régimen de transición');
  const sinTilde = await resultados('regimen de transicion');
  assert.ok(conTilde.length > 0);
  assert.deepEqual(sinTilde, conTilde, 'con y sin tilde dan los mismos resultados');
  const marcas = await page.locator('.result mark').allInnerTexts();
  assert.ok(
    marcas.some((m) => /régimen/i.test(m)),
    'resalta la palabra original, con su tilde'
  );
  // Coincidencia solo en el cuerpo: se muestra el fragmento del artículo que la contiene.
  await ir('#/buscar?q=reingreso');
  assert.match(await texto('.fragmento'), /Artículo 18/);
});

test('los filtros por estado reducen los resultados y se pueden quitar (RF-21)', async () => {
  await ir('#/buscar');
  const total = await page.locator('.result').count();
  await page.locator('[data-f="estado"][value="derogada"]').check();
  await page.waitForTimeout(80);
  const filtrados = await page.locator('.result').count();
  assert.ok(filtrados > 0 && filtrados < total);
  await page.locator('[data-quitar="estado"]').click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.result').count(), total);
});

test('una búsqueda sin resultados orienta al usuario', async () => {
  await ir('#/buscar?q=zzzxxyy');
  assert.match(await texto('.vacio'), /No encontramos/);
});

/* ---------- Ficha de la norma (RF-22 a RF-27) ---------- */

test('toda ficha muestra el estado de vigencia y la leyenda informativa (RF-22, RB-01)', async () => {
  for (const id of ['CSU-ACU-2004-004', 'RECT-RES-2019-1520', 'CA-ACU-2024-051', 'CFI-ACU-2022-003']) {
    await ir('#/norma/' + id);
    assert.ok(await page.locator('.vigencia-box .st').isVisible(), `estado visible en ${id}`);
    assert.match(await texto('.legend'), /Carácter informativo/);
  }
});

test('las notas de vigencia citan el acto y el artículo (RF-15, RB-06)', async () => {
  await ir('#/norma/CSU-ACU-2004-004');
  const nota = await page.locator('#u-a28 .nota').innerText();
  assert.match(nota, /Modificado por el Artículo 1 del Acuerdo 031 de 2023/);
});

test('consultar a una fecha muestra la versión que regía entonces (RF-23)', async () => {
  await ir('#/norma/CSU-ACU-2004-004');
  await page.fill('#fd', '2020-01-01');
  await page.click('#fdate button.sec');
  await page.waitForTimeout(80);
  const art2 = await page.locator('#u-a2').innerText();
  assert.match(art2, /matriculado en un programa académico de pregrado/);
  assert.ok((await page.locator('#u-a15p1').count()) === 0, 'el parágrafo de 2023 no existía en 2020');
  assert.match(await texto('.alert.info'), /versión histórica/);
});

test('la consulta por cohorte aplica el régimen de transición (RF-24, RB-11)', async () => {
  await ir('#/norma/CSU-ACU-2004-004');
  await page.fill('#fc', '2023-02-01');
  await page.click('#fdate button.sec');
  await page.waitForTimeout(80);
  const art40 = await page.locator('#u-a40').innerText();
  assert.match(art40, /dos punto ocho \(2\.8\)/);
  assert.match(art40, /régimen de transición/);
});

test('el comparador resalta adiciones y supresiones (RF-25)', async () => {
  await ir('#/norma/CSU-ACU-2004-004?tab=comparar');
  assert.ok((await page.locator('.diff ins').count()) > 0);
  assert.ok((await page.locator('.diff del').count()) > 0);
});

test('las pestañas se recorren con las flechas del teclado (RI-03)', async () => {
  await ir('#/norma/CSU-ACU-2004-004');
  await page.focus('#tab-texto');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(80);
  assert.equal(await page.getAttribute('#tab-historial', 'aria-selected'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-historial');
});

test('las relaciones se muestran en ambos sentidos (RF-16)', async () => {
  await ir('#/norma/CSU-ACU-2021-012?tab=relaciones');
  assert.match(await page.locator('.tabpanel').innerText(), /Acuerdo 004 de 2004/);
  await ir('#/norma/CSU-ACU-2004-004');
  await page.click('#tab-relaciones');
  assert.match(await page.locator('.tabpanel').innerText(), /Acuerdo 012 de 2021/);
});

test('la constancia de consulta no se presenta como certificación (RF-27, OBS-15)', async () => {
  await ir('#/norma/CSU-ACU-2004-004?tab=documentos');
  await page.click('#btn-const');
  const c = await texto('#constancia');
  assert.match(c, /no constituye certificación de vigencia/);
  assert.match(c, /Código de verificación: [0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.modal-bg').count(), 0, 'Escape cierra el diálogo');
});

test('la suscripción valida el correo antes de registrarse (RF-31)', async () => {
  await ir('#/norma/CSU-ACU-2004-004');
  await page.click('#btn-sub');
  await page.fill('#em', 'correo-invalido');
  await page.click('#fsub button.btn:not(.ghost)');
  assert.equal(await page.getAttribute('#em', 'aria-invalid'), 'true');
  await page.fill('#em', 'persona@correo.com');
  await page.click('#fsub button.btn:not(.ghost)');
  await page.waitForTimeout(80);
  assert.match(await texto('#btn-sub'), /Suscrito/);
});

/* ---------- Consola: acceso y permisos (RF-32, RNF-03) ---------- */

test('la consola exige iniciar sesión', async () => {
  await ir('#/consola');
  await page.waitForTimeout(80);
  assert.match(page.url(), /#\/login$/);
});

test('un rol sin permiso no accede a funciones ajenas (mínimo privilegio)', async () => {
  await entrarComo('Auditor');
  await ir('#/consola/registrar');
  assert.match(await texto('main h1'), /Acceso no autorizado/);
});

test('la matriz de permisos tiene una columna por rol', async () => {
  await entrarComo('Administrador');
  await ir('#/consola/admin');
  const columnas = await page.locator('.matriz thead th').count();
  const celdas = await page.locator('.matriz tbody tr:first-child td').count();
  assert.equal(columnas, 6);
  assert.equal(celdas, 5);
});

/* ---------- Reserva de números (RF-01, RB-03) ---------- */

test('un número anulado no se reasigna (RB-03)', async () => {
  await entrarComo('Registrador');
  await ir('#/consola/reservar');
  assert.equal(await texto('#rn'), '043');
  await page.click('[data-anular="CSU-ACU-2026-042"]');
  await page.fill('#mt', 'Sesión cancelada');
  await page.click('#mok');
  await page.waitForTimeout(80);
  assert.match(await page.locator('#num-tabla').innerText(), /anulado/);
  assert.equal(await texto('#rn'), '043', 'el siguiente número sigue siendo 043');
});

/* ---------- Registro, validación y publicación (CU-02 a CU-05) ---------- */

test('el registro bloquea un número que no fue reservado (RF-05)', async () => {
  await entrarComo('Registrador');
  await ir('#/consola/registrar');
  await page.fill('#w-num', '099');
  assert.match(await texto('#m-num'), /no es un consecutivo reservado/i);
  await page.click('#w-next');
  assert.match(await texto('#w-err'), /faltan datos obligatorios|consecutivo/);
});

test('flujo completo: registrar, validar, publicar y ver la ficha actualizada (CU-02 → CU-05)', async () => {
  await entrarComo('Registrador');
  await ir('#/consola/registrar');
  await page.click('#w-demo');
  await page.click('#w-next');
  await page.click('#d-pdf');
  await page.click('#d-nat');
  await page.check('#w-cot');
  await page.click('#w-next');
  await page.click('#w-next'); // estructura
  await page.click('#w-next'); // intenta avanzar sin confirmar sugerencias
  assert.match(await texto('#w-err'), /Confirme o descarte/);
  await page.click('[data-sug="s1"][data-v="ok"]');
  await page.click('[data-sug="s2"][data-v="ok"]');
  await page.click('#w-next');
  assert.match(await texto('.paso-tit'), /Revisión/);
  await page.click('#w-next'); // enviar
  await page.waitForSelector('.kanban');

  await entrarComo('Validador');
  await ir('#/consola/validar/CSU-ACU-2026-042');
  assert.match(await page.locator('.compare').innerText(), /asignaturas de práctica/);
  await page.click('#v-ok');
  assert.match(await texto('.toast'), /lista de verificación/);
  for (const c of await page.locator('.chk').all()) await c.check();
  await page.click('#v-ok');
  await page.waitForSelector('.modal');
  assert.match(await texto('.modal'), /Publicado/);

  await ir('#/norma/CSU-ACU-2004-004');
  await page.waitForTimeout(80);
  const art28 = await page.locator('#u-a28').innerText();
  assert.match(art28, /asignaturas de práctica es tres punto cinco/);
  assert.match(art28, /Acuerdo 042 de 2026/);
  await ir('#/norma/CSU-ACU-2026-042');
  assert.match(await texto('main h1'), /Acuerdo 042 de 2026/);
  assert.deepEqual(erroresJS, []);
});

test('escalar a Jurídica exige un motivo y lo muestra al validador jurídico (RF-18)', async () => {
  await entrarComo('Validador');
  await ir('#/consola/validar/CSU-ACU-2026-041');
  await page.click('#v-esc');
  await page.click('#mok');
  assert.equal(await page.getAttribute('#mt', 'aria-invalid'), 'true');
  await page.fill('#mt', 'Revisar posible afectación tácita');
  await page.click('#mok');
  await entrarComo('Validador jurídico');
  await ir('#/consola/validar/CSU-ACU-2026-041');
  assert.match(await texto('.alert.warn'), /Revisar posible afectación tácita/);
  assert.equal(await page.isEnabled('#v-ok'), true);
});

/* ---------- Auditoría (RF-33) ---------- */

test('la verificación de la cadena detecta una manipulación (RF-33)', async () => {
  await entrarComo('Auditor');
  await page.click('#a-ver');
  assert.match(await texto('#a-res'), /Cadena íntegra/);
  await page.click('#a-tamper');
  await page.click('#a-ver');
  assert.match(await texto('#a-res'), /Integridad comprometida/);
  assert.ok((await page.locator('.fila-rota').count()) > 0);
});

/* ---------- Persistencia de la demo ---------- */

test('la sesión de demostración se conserva al recargar', async () => {
  await entrarComo('Validador');
  await page.reload();
  await ir('#/consola');
  assert.match(await texto('.side .user'), /Mario Pérez/);
});

/* ---------- Diseño adaptable y accesibilidad (RNF-07, RNF-08) ---------- */

test('sin desplazamiento horizontal a 360 px (RNF-08)', async () => {
  await page.setViewportSize({ width: 360, height: 780 });
  const rutas = [
    '#/',
    '#/buscar?q=acuerdo',
    '#/norma/CSU-ACU-2004-004',
    '#/norma/CSU-ACU-2004-004?tab=documentos',
    '#/glosario',
    '#/compilacion',
    '#/api',
    '#/login',
  ];
  for (const r of rutas) {
    await ir(r);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(ancho <= 360, `${r} desborda: ${ancho}px`);
  }
  await entrarComo('Registrador');
  for (const r of ['#/consola/registrar', '#/consola/reservar']) {
    await ir(r);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(ancho <= 360, `${r} desborda: ${ancho}px`);
  }
});

test('el menú móvil se abre con el botón y expone su estado (RNF-08)', async () => {
  await page.setViewportSize({ width: 360, height: 780 });
  await ir('#/');
  assert.equal(await page.isVisible('#nav-principal'), false);
  await page.click('#menu-btn');
  assert.equal(await page.getAttribute('#menu-btn', 'aria-expanded'), 'true');
  assert.equal(await page.isVisible('#nav-principal'), true);
});

test('sin violaciones de accesibilidad graves o críticas (WCAG 2.1 AA, RNF-07)', async (t) => {
  let axePath;
  try {
    axePath = require.resolve('axe-core/axe.min.js');
  } catch {
    return t.skip('axe-core no está instalado (npm install)');
  }
  const revisar = async (ruta) => {
    await ir(ruta);
    await page.addScriptTag({ path: axePath });
    const v = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
      return r.violations
        .filter((x) => ['serious', 'critical'].includes(x.impact))
        .map((x) => `${x.id}: ${x.nodes[0].html.slice(0, 80)}`);
    });
    assert.deepEqual(v, [], `violaciones en ${ruta}`);
  };
  for (const r of [
    '#/',
    '#/buscar?q=acuerdo',
    '#/norma/CSU-ACU-2004-004',
    '#/norma/CSU-ACU-2004-004?tab=comparar',
    '#/glosario',
    '#/compilacion',
    '#/login',
  ])
    await revisar(r);
  await entrarComo('Registrador');
  for (const r of ['#/consola', '#/consola/reservar', '#/consola/registrar', '#/consola/auditoria']) await revisar(r);
  await entrarComo('Validador');
  await revisar('#/consola/validar/CSU-ACU-2026-041');
  await entrarComo('Administrador');
  await revisar('#/consola/admin');
});
