/* App Seguimiento Francho · fase 1 + nube (Supabase) */
(function () {
'use strict';
const PLAN = window.PLAN, DATOS = window.DATOS;
const INICIO = '2026-10-12';           // lunes, semana 1
const SEMANAS = 12;
const OBJ = { p: 170, pasos: 12000 };
const KCAL = { entreno: 2200, sin_entreno: 1900, viaje: 1950 };
const TIPOS = [['entreno', 'Entreno'], ['sin_entreno', 'Sin entreno'], ['viaje', 'Viaje']];
const MOMENTOS = [['desayuno', 'Desayuno', '08:30'], ['almuerzo', 'Almuerzo', '14:00'], ['cena', 'Cena', '21:00']];
const MAQUINAS = ['Remo', 'Elíptica', 'Cinta', 'Bici', 'Steps'];
const VIAJE = { desayuno: { kcal: 780, p: 45, c: 75, g: 32 }, almuerzo: { kcal: 780, p: 55, c: 75, g: 30 }, cena: { kcal: 390, p: 45, c: 15, g: 15 } };
const EXTRAS = [
  { id: 'yogur', txt: '+ yogur proteico', p: 10, c: 4, g: 0, kcal: 90 },
  { id: 'atun', txt: '+ lata de atún', p: 17, c: 0, g: 1, kcal: 75 },
  { id: 'huevos', txt: '+ 2 huevos', p: 13, c: 1, g: 10, kcal: 150 },
  { id: 'pollo', txt: '+ 1 palma de pollo', p: 24, c: 0, g: 3, kcal: 130 }
];
// Reglas para ajustar raciones de los menús de Jesús (+/−). Valores por paso, aproximados.
const REGLAS = [
  { re: /palma.*salm[oó]n|salm[oó]n/i, u: '½ palma', p: 11, c: 0, g: 6, kcal: 95 },
  { re: /palma/i, u: '½ palma', p: 12, c: 0, g: 1.5, kcal: 65 },
  { re: /taza/i, u: '½ taza', p: 2, c: 22, g: 0.5, kcal: 100 },
  { re: /AOVE/i, u: '1 cdta', p: 0, c: 0, g: 4.5, kcal: 40 },
  { re: /rebanada/i, u: '1 rebanada', p: 3.5, c: 15, g: 1, kcal: 80 },
  { re: /huevo/i, u: '1 huevo', p: 6.5, c: 0.5, g: 5, kcal: 75 },
  { re: /yogur/i, u: '1 bol', p: 10, c: 4, g: 0, kcal: 90 },
  { re: /aguacate/i, u: '⅓ aguacate', p: 1, c: 2, g: 7, kcal: 75 },
  { re: /at[uú]n/i, u: '1 lata', p: 17, c: 0, g: 1, kcal: 75 },
  { re: /jam[oó]n/i, u: '2 lonchas', p: 6, c: 0, g: 2, kcal: 45 },
  { re: /queso fresco/i, u: '½ tarrina', p: 8, c: 3, g: 1, kcal: 60 },
  { re: /patata|boniato/i, u: '½ unidad', p: 2, c: 18, g: 0, kcal: 80 },
  { re: /manzana|naranja|pl[aá]tano/i, u: '1 pieza', p: 1, c: 20, g: 0, kcal: 85 },
  { re: /nueces|cacahuete/i, u: '1 porción', p: 2, c: 2, g: 9, kcal: 100 },
  { re: /leche/i, u: '1 vaso', p: 8, c: 12, g: 4, kcal: 115 },
  { re: /avena|copos/i, u: '2 cdas', p: 2, c: 10, g: 1, kcal: 60 },
  { re: /pesto/i, u: '1 cda', p: 1, c: 0, g: 7, kcal: 70 }
];
const regla = (txt) => REGLAS.find(r => r.re.test(txt)) || null;

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const hoyISO = () => iso(new Date());
const lunes = (s) => { const d = parse(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d); };
const semanaN = (s) => Math.floor((parse(lunes(s)) - parse(INICIO)) / 6048e5) + 1;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaTxt = (s) => { const d = parse(s); return DIAS[d.getDay()][0].toUpperCase() + DIAS[d.getDay()].slice(1) + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
const fmt = (n) => Math.round(n).toLocaleString('es-ES');
const segs = (txt) => { // "2´" "20´´" "1´ y siguiente" → segundos
  if (!txt) return 0; const t = String(txt);
  let m = t.match(/(\d+)\s*´´/); if (m) return +m[1];
  m = t.match(/(\d+)\s*´/); if (m) return +m[1] * 60;
  return 0;
};

/* ---------- almacenamiento local (fase 1) ---------- */
const mem = {};
const load = (k, def) => { try { const v = localStorage.getItem('fs:' + k); if (v != null) return JSON.parse(v); } catch (e) {} return k in mem ? mem[k] : def; };
const save = (k, v) => { mem[k] = v; try { localStorage.setItem('fs:' + k, JSON.stringify(v)); } catch (e) { toast('No se pudo guardar en este navegador'); } if (sincroniza(k)) { marcarTs(k, Date.now()); pendiente(k); } };

/* ---------- estilo visual ---------- */
function estiloActual() { return document.documentElement.getAttribute('data-estilo') || 'sport'; }
function aplicarEstilo(e) { document.documentElement.setAttribute('data-estilo', e); const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', e === 'sport' ? '#000000' : '#F4F2EC'); }
aplicarEstilo(load('estilo', 'sport'));

/* ---------- nube (Supabase) ---------- */
const SB_URL = 'https://jkfrlydkoyppmqmfcdnm.supabase.co';
const SB_KEY = 'sb_publishable_swEwoCOm6mnZRPFS2Xnpyw_YpV58tMP';
let sb = null; try { if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); } catch (e) {}
const nube = { user: null, email: null, estado: 'local', ultima: null, ocupado: false };
function sincroniza(k) { return k !== 'tab' && !k.startsWith('_'); }
function lsGet(k) { try { return localStorage.getItem('fs:' + k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem('fs:' + k, v); } catch (e) {} }
function marcarTs(k, t) { lsSet('_ts:' + k, String(t)); }
function tsDe(k) { return +(lsGet('_ts:' + k) || 0); }
function pendientes() { try { return JSON.parse(lsGet('_pend') || '[]'); } catch (e) { return []; } }
let flushT = null;
function pendiente(k) { const P = pendientes(); if (!P.includes(k)) { P.push(k); lsSet('_pend', JSON.stringify(P)); } clearTimeout(flushT); flushT = setTimeout(subir, 1200); }
function clavesLocales() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('fs:') && sincroniza(k.slice(3))) out.push(k.slice(3)); } } catch (e) {} return out; }
async function subir() {
  if (!sb || !nube.user || !navigator.onLine) return;
  const P = pendientes(); if (!P.length) { nube.estado = 'ok'; pintarNube(); return; }
  const filas = P.map(k => ({ alumno: nube.user.id, clave: k, valor: JSON.parse(lsGet(k) || 'null'), actualizado: new Date(tsDe(k) || Date.now()).toISOString() }));
  nube.estado = 'subiendo'; pintarNube();
  const { error } = await sb.from('registro').upsert(filas, { onConflict: 'alumno,clave' });
  if (error) { nube.estado = 'error'; nube.err = error.message; pintarNube(); clearTimeout(flushT); flushT = setTimeout(subir, 30000); return; }
  const enviados = new Map(filas.map(f => [f.clave, f.actualizado]));
  lsSet('_pend', JSON.stringify(pendientes().filter(k => enviados.get(k) !== new Date(tsDe(k) || 0).toISOString())));
  nube.estado = pendientes().length ? 'subiendo' : 'ok'; nube.ultima = new Date(); pintarNube();
  if (pendientes().length) { clearTimeout(flushT); flushT = setTimeout(subir, 1200); }
}
async function bajar() {
  if (!sb || !nube.user || nube.ocupado) return;
  nube.ocupado = true; nube.estado = 'bajando'; pintarNube();
  try {
    let filas = [], desde = 0;
    for (;;) { const { data, error } = await sb.from('registro').select('clave,valor,actualizado').eq('alumno', nube.user.id).range(desde, desde + 999);
      if (error) throw error; filas = filas.concat(data); if (data.length < 1000) break; desde += 1000; }
    const remotas = new Map(filas.map(f => [f.clave, f]));
    let cambios = 0;
    remotas.forEach((f, k) => { const tr = Date.parse(f.actualizado); if (tr > tsDe(k)) { lsSet(k, JSON.stringify(f.valor)); marcarTs(k, tr); delete mem[k]; cambios++; } });
    const P = pendientes();
    clavesLocales().forEach(k => { const f = remotas.get(k); let t = tsDe(k);
      if (!t) { t = Date.now(); marcarTs(k, t); }
      if ((!f || t > Date.parse(f.actualizado)) && !P.includes(k)) P.push(k); });
    lsSet('_pend', JSON.stringify(P));
    nube.ultima = new Date();
    if (cambios) aplicarEstilo(load('estilo', 'sport'));
    if (cambios && !st.sheet) render();
    await subir();
    nube.estado = pendientes().length ? 'subiendo' : 'ok';
  } catch (e) { nube.estado = 'error'; nube.err = e.message || String(e); clearTimeout(flushT); flushT = setTimeout(bajar, 30000); }
  nube.ocupado = false; pintarNube();
}
function borrarLocales() { // otra cuenta en este móvil: no mezclar datos
  try { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('fs:') && k !== 'fs:tab' && k !== 'fs:estilo') ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); } catch (e) {}
  Object.keys(mem).forEach(k => delete mem[k]);
}
function pintarNube() { const el = document.getElementById('nube-estado'); if (el) el.innerHTML = textoNube(); }
function textoNube() {
  if (!sb) return 'Sin conexión con la base de datos (librería no cargada).';
  if (!nube.user) return 'Solo en este móvil. Entra con tu email para guardar en la nube.';
  const h = nube.ultima ? nube.ultima.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
  return { ok: '✓ Sincronizado · ' + h, subiendo: 'Guardando en la nube…', bajando: 'Sincronizando…', error: '⚠ Error al sincronizar: ' + esc(nube.err || '') + '. Se reintentará.', local: 'Conectando…' }[nube.estado] || '';
}
if (sb) {
  sb.auth.onAuthStateChange((ev, ses) => { const u = ses ? ses.user : null; const cambio = (u && u.id) !== (nube.user && nube.user.id);
    nube.user = u; if (u) nube.email = u.email;
    if (u) { const due = lsGet('_owner'); if (due && due !== u.id) borrarLocales(); lsSet('_owner', u.id); }
    if (cambio) { if (u) setTimeout(bajar, 0); if (typeof render === 'function' && !st.sheet) setTimeout(render, 0); } });
  window.addEventListener('online', () => { subir(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') bajar(); });
}
{ let hoyAbierto = hoyISO(); // si la app sigue abierta al cambiar de día, Hoy pasa al día nuevo
  const revisarDia = () => { const h = hoyISO(); if (h !== hoyAbierto) { if (st.fecha === hoyAbierto || st.fecha < h && hoyAbierto < INICIO) { st.fecha = h < INICIO ? INICIO : h; st.entDia = null; if (!st.sheet) render(); } hoyAbierto = h; } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revisarDia(); });
  setInterval(revisarDia, 60000);
}

const semanaDef = () => ([
  { tipo: 'entreno', menu: 1 }, { tipo: 'sin_entreno', menu: 2 }, { tipo: 'entreno', menu: 3 }, { tipo: 'sin_entreno', menu: 4 },
  { tipo: 'entreno', menu: 5 }, { tipo: 'entreno', menu: 6 }, { tipo: 'sin_entreno', menu: 1 }
]);
const getSemana = (fecha) => load('sem:' + lunes(fecha), null) || semanaDef();
const diaVacio = () => ({ habitos: {}, comidas: {}, sesion: null, energia: 0, pasos: 0, extras: [] });
const getDia = (fecha) => {
  const d = Object.assign(diaVacio(), load('dia:' + fecha, {}));
  const sem = getSemana(fecha);
  const idx = (parse(fecha).getDay() + 6) % 7;
  const base = sem[idx];
  if (!d.tipo) d.tipo = base.tipo;
  if (!d.menu) d.menu = base.menu;
  if (!d.diaEntreno) { // días de entreno de la semana numerados 1..4
    let n = 0; for (let i = 0; i <= idx; i++) if ((i === idx ? d.tipo : sem[i].tipo) === 'entreno') n++;
    d.diaEntreno = Math.min(Math.max(n, 1), 4);
  }
  return d;
};
const setDia = (fecha, fn) => { const d = getDia(fecha); fn(d); save('dia:' + fecha, d); };

/* ---------- cálculos ---------- */
const menuDe = (n) => DATOS.menus.find(m => m.n === n) || DATOS.menus[0];
const comidaPlan = (dia, mi) => { const c = menuDe(dia.menu).comidas[mi]; const ctx = dia.tipo === 'sin_entreno' ? c.sin : c.entreno; return { c, ctx }; };
const macrosComida = (dia, mi) => {
  const key = MOMENTOS[mi][0]; const reg = dia.comidas[key] || {};
  if (dia.tipo === 'viaje') { const b = VIAJE[key]; return Object.assign({}, b); }
  const { ctx } = comidaPlan(dia, mi);
  const m = { kcal: ctx.kcal, p: ctx.p, c: ctx.c, g: ctx.g };
  const adj = reg.adj || {};
  ctx.items.forEach((it, i) => { const r = regla(it); const st = adj[i] || 0; if (r && st) { m.kcal += r.kcal * st; m.p += r.p * st; m.c += r.c * st; m.g += r.g * st; } });
  if (reg.estado === 'fuera') { return { kcal: +reg.kcal || m.kcal, p: +reg.p || 0, c: m.c, g: m.g }; }
  return m;
};
const totalDia = (dia) => {
  const t = { kcal: 0, p: 0, c: 0, g: 0 };
  MOMENTOS.forEach(([k], mi) => { if (dia.comidas[k] && dia.comidas[k].estado) { const m = macrosComida(dia, mi); t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.g += m.g; } });
  (dia.extras || []).forEach(id => { const e = EXTRAS.find(x => x.id === id); if (e) { t.kcal += e.kcal; t.p += e.p; t.c += e.c; t.g += e.g; } });
  return t;
};
const objetivoDia = (dia) => {
  if (dia.tipo === 'viaje') return { kcal: KCAL.viaje, p: OBJ.p };
  const m = menuDe(dia.menu).comidas; const ctx = dia.tipo === 'sin_entreno' ? 'sin' : 'entreno';
  return { kcal: m.reduce((a, c) => a + c[ctx].kcal, 0), p: OBJ.p, c: m.reduce((a, c) => a + c[ctx].c, 0), g: m.reduce((a, c) => a + c[ctx].g, 0) };
};
const protColor = (p) => p >= 160 ? 'var(--good)' : p >= 140 ? 'var(--warn)' : 'var(--accent)';
const habitosLista = (dia) => {
  const L = [['sentadillas', 'Sentadillas al despertar'], ['desayuno', 'Desayuno'], ['s_desayuno', 'Suplementos desayuno'], ['almuerzo', 'Almuerzo'], ['s_almuerzo', 'Suplementos almuerzo']];
  if (dia.tipo === 'entreno') L.push(['entreno', 'Entreno']);
  L.push(['cena', 'Cena'], ['s_noche', 'Magnesio noche'], ['movilidad', 'Movilidad antes de dormir']);
  return L;
};
const habitoHecho = (dia, k) => {
  if (k === 'desayuno' || k === 'almuerzo' || k === 'cena') return !!(dia.comidas[k] && dia.comidas[k].estado);
  if (k === 'entreno') return !!(dia.sesion && dia.sesion.fin);
  return !!dia.habitos[k];
};
const diaPlan = (n) => PLAN.find(d => d.n === n) || PLAN[0];
const ejKey = (d, b, e) => 'D' + d + '-' + b + '-' + e;
const ultimo = (key, antesDe) => { // última vez que se registró este ejercicio
  for (let i = 1; i <= 60; i++) {
    const f = addDays(antesDe, -i); const d = load('dia:' + f, null);
    if (d && d.sesion && d.sesion.series && d.sesion.series[key]) {
      const s = d.sesion.series[key].filter(x => x && x.done);
      if (s.length) return { fecha: f, series: d.sesion.series[key] };
    }
  }
  return null;
};

/* ---------- estado de la interfaz ---------- */
const st = { tab: 'hoy', fecha: hoyISO(), entDia: null, sheet: null, timer: null, verMas: false };
try { const t = localStorage.getItem('fs:tab'); if (t) st.tab = t; } catch (e) {}
if (st.fecha < INICIO) st.fecha = INICIO;   // antes del inicio se muestra el lunes 12

let toastT;
function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2200); }

/* ---------- piezas ---------- */
const ring = (val, max, color, label, sub, act) => {
  const L = 239, f = Math.max(0, Math.min(val / max, 1)) * L;
  return `<button class="ring" ${act ? `data-act="${act}"` : 'tabindex="-1"'} aria-label="${esc(label)}">
    <svg viewBox="0 0 92 92" aria-hidden="true" style="color:${color}"><circle class="trk" cx="46" cy="46" r="38" fill="none" stroke="var(--soft)" stroke-width="11"/>
    ${f > 0 ? `<circle cx="46" cy="46" r="38" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${f.toFixed(0)} ${L}" transform="rotate(-90 46 46)"/>` : ''}
    <text x="46" y="53" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-size="21" font-weight="800" fill="var(--ink)">${esc(sub)}</text></svg>
    <span class="small"><b>${esc(label)}</b></span></button>`;
};
const segTipo = (dia, act) => `<div class="seg" role="group" aria-label="Tipo de día">${TIPOS.map(([k, n]) =>
  `<button data-act="${act}" data-v="${k}" aria-pressed="${dia.tipo === k}">${n}<small>${k === 'viaje' ? 'reglas platos' : fmt(KCAL[k]) + ' kcal'}</small></button>`).join('')}</div>`;
const cabeceraFecha = (titulo) => `<div class="row between">
  <button class="btn" data-act="dia-prev" aria-label="Día anterior">‹</button>
  <div class="col" style="gap:2px;align-items:center;text-align:center"><span class="small muted">${fechaTxt(st.fecha)}${st.fecha === hoyISO() ? ' · hoy' : ''}</span><h1>${titulo}</h1></div>
  <button class="btn" data-act="dia-next" aria-label="Día siguiente">›</button></div>`;

/* ---------- HOY ---------- */
function agendaDe(dia) {
  const it = [];
  it.push({ k: 'sentadillas', h: '07:30', t: 'Sentadillas al despertar', done: !!dia.habitos.sentadillas });
  MOMENTOS.forEach(([k, n, h], mi) => {
    if (k === 'cena' && dia.tipo === 'entreno') it.push({ k: 'entreno', h: '18:30', t: 'Entreno día ' + dia.diaEntreno + ' · ' + diaPlan(dia.diaEntreno).nombre, done: !!(dia.sesion && dia.sesion.fin) });
    const nombre = dia.tipo === 'viaje' ? 'monta tu plato con las reglas' : comidaPlan(dia, mi).c.nombre;
    it.push({ k, mi, h, t: n + ' · ' + nombre, done: !!(dia.comidas[k] && dia.comidas[k].estado) });
  });
  it.push({ k: 'noche', h: '23:00', t: 'Magnesio ×2, movilidad y energía', done: !!(dia.habitos.s_noche && dia.habitos.movilidad && dia.energia) });
  return it;
}
function suplDe(momento) { return DATOS.suplementos.filter(s => s.momento === momento).map(s => s.nombre + ' ' + s.dosis).join(' · '); }
function vistaHoy() {
  const dia = getDia(st.fecha); const tot = totalDia(dia); const hl = habitosLista(dia);
  const hechos = hl.filter(([k]) => habitoHecho(dia, k)).length;
  const ag = agendaDe(dia); const now = ag.find(x => !x.done);
  let ahora = '';
  if (!now) {
    ahora = `<div class="card dark"><span class="eyebrow">Día completo</span><h2>Todo hecho. Buen trabajo.</h2><span class="small muted">Proteína ${fmt(tot.p)} g · ${fmt(tot.kcal)} kcal · energía ${dia.energia}/5</span></div>`;
  } else if (now.k === 'sentadillas') {
    ahora = `<div class="card dark"><span class="eyebrow">Ahora · ${now.h}</span><h2>Sentadillas al despertar</h2><span class="small muted">20–30 sentadillas · un minuto</span><button class="btn primary" data-act="hab" data-k="sentadillas">✓ Hecho</button></div>`;
  } else if (now.k === 'entreno') {
    const dp = diaPlan(dia.diaEntreno);
    ahora = `<div class="card dark"><span class="eyebrow">Ahora · ${now.h}</span><h2>Entreno día ${dia.diaEntreno} · ${esc(dp.nombre)}</h2><span class="small muted">${esc(dp.hiit.maquina)} ${dp.hiit.duracion}' · cintura · fuerza · cinta 40' · graba cada cardio aparte en el Watch</span><button class="btn primary" data-act="ir-entreno">Empezar sesión</button></div>`;
  } else if (now.k === 'noche') {
    ahora = `<div class="card dark"><span class="eyebrow">Ahora · ${now.h}</span><h2>Cierra el día</h2>
      <div class="row wrap"><button class="btn ghost-dark" data-act="hab" data-k="s_noche" aria-pressed="${!!dia.habitos.s_noche}">${dia.habitos.s_noche ? '✓ ' : ''}Magnesio ×2</button><button class="btn ghost-dark" data-act="hab" data-k="movilidad" aria-pressed="${!!dia.habitos.movilidad}">${dia.habitos.movilidad ? '✓ ' : ''}Movilidad</button></div>
      <span class="small muted">¿Qué energía has tenido hoy?</span>
      <div class="seg" style="background:transparent;padding:0">${[1, 2, 3, 4, 5].map(n => `<button class="btn ghost-dark" data-act="energia" data-v="${n}" aria-pressed="${dia.energia === n}">${n}</button>`).join('')}</div></div>`;
  } else {
    const mi = now.mi; const k = MOMENTOS[mi][0];
    const sup = suplDe(k);
    if (dia.tipo === 'viaje') {
      ahora = `<div class="card dark"><span class="eyebrow">Ahora · ${now.h} · viaje</span><h2>${MOMENTOS[mi][1]}: monta tu plato</h2><span class="small muted">${esc(REGLAS_PLATO[k])}${sup ? ' · + ' + esc(sup) : ''}</span>
        <div class="seg" style="background:transparent;padding:0"><button class="btn primary" data-act="marcar-rapido" data-mi="${mi}">Según reglas</button><button class="btn ghost-dark" data-act="abrir-marcar" data-mi="${mi}">Fuera de plan</button><button class="btn ghost-dark" data-act="foto" data-mi="${mi}">Foto</button></div></div>`;
    } else {
      const { c, ctx } = comidaPlan(dia, mi);
      ahora = `<div class="card dark"><span class="eyebrow">Ahora · ${now.h}</span>
        <div class="row"><img class="thumb" src="${c.img}" alt=""><div class="grow"><h2>${esc(c.nombre)}</h2><span class="small muted">${esc(ctx.items.join(' · '))}${sup ? ' · + ' + esc(sup) : ''}</span></div></div>
        <div class="seg" style="background:transparent;padding:0"><button class="btn primary" data-act="marcar-rapido" data-mi="${mi}">Seguida</button><button class="btn ghost-dark" data-act="abrir-marcar" data-mi="${mi}">Cambiada</button><button class="btn ghost-dark" data-act="foto" data-mi="${mi}">Foto</button></div></div>`;
    }
  }
  const sem = semanaN(st.fecha);
  const avisoNube = (sb && !nube.user) ? `<button class="banner" data-act="ir-cuenta" style="border:0;text-align:left;font:inherit;width:100%">☁︎ <b>Guarda tus datos en la nube</b> · entra con tu email</button>` : '';
  return `${cabeceraFecha(sem >= 1 ? 'Semana ' + Math.min(sem, SEMANAS) + ' de ' + SEMANAS : 'Antes del inicio')}
  ${avisoNube}
  ${segTipo(dia, 'tipo-dia')}
  <div class="card rings" style="padding:10px 4px">
    ${ring(dia.pasos || 0, OBJ.pasos, 'var(--r-pasos, var(--accent))', 'Pasos', dia.pasos ? (dia.pasos / 1000).toFixed(1).replace('.', ',') + 'k' : '—', 'pasos')}
    ${ring(tot.p, OBJ.p, 'var(--r-prot, ' + protColor(tot.p) + ')', 'Proteína / 170', fmt(tot.p) + ' g')}
    ${ring(hechos, hl.length, 'var(--r-hab, var(--good))', 'Hábitos', hechos + '/' + hl.length)}
  </div>
  ${ahora}
  <div class="agenda">${ag.map(x => `<button class="${x.done ? 'done' : x === now ? 'now' : ''}" data-act="agenda" data-k="${x.k}" ${x.mi != null ? `data-mi="${x.mi}"` : ''}>
    <span class="t">${x.h}</span><span class="txt grow">${esc(x.t)}</span>${x.done ? '<span class="tick">✓</span>' : x === now ? '<span class="tiny" style="color:var(--accent-ink);font-weight:700">ahora</span>' : ''}</button>`).join('')}</div>
  <p class="tiny muted">Los pasos llegarán solos del Watch en la fase 2. Mientras, toca el anillo para apuntarlos.</p>`;
}
const REGLAS_PLATO = {
  desayuno: 'Carbohidrato + proteína + grasa con comida real. Sin bollería ni cereales azucarados.',
  almuerzo: 'Base proteica + un carbohidrato principal + verdura + la grasa necesaria.',
  cena: 'Proteína cocinada + verdura cocinada + poca grasa. Sin cereales, gluten ni verdura cruda.'
};

/* ---------- COMIDA ---------- */
function vistaComida() {
  const dia = getDia(st.fecha); const tot = totalDia(dia); const obj = objetivoDia(dia);
  const viaje = dia.tipo === 'viaje';
  const comidas = MOMENTOS.map(([k, n, h], mi) => {
    const reg = dia.comidas[k] || {};
    const est = reg.estado ? `<span class="pill ${reg.estado === 'fuera' ? 'warn' : 'good'}">${{ seguida: 'Seguida', cambiada: 'Cambiada', fuera: 'Fuera de plan' }[reg.estado]}</span>` : '';
    const foto = reg.foto ? `<img class="thumb" src="${reg.foto}" alt="Tu foto">` : '';
    if (viaje) {
      return `<div class="card"><div class="row between"><span class="eyebrow">${n} · ${h}</span>${est}</div>
        <div class="row">${foto}<span class="small grow">${esc(REGLAS_PLATO[k])}</span></div>
        <button class="btn" data-act="abrir-marcar" data-mi="${mi}">${reg.estado ? 'Editar' : 'Marcar'}</button></div>`;
    }
    const { c, ctx } = comidaPlan(dia, mi); const m = macrosComida(dia, mi); const adj = reg.adj || {};
    return `<div class="card ${!reg.estado ? '' : ''}">
      <div class="row"><img class="thumb" src="${c.img}" alt="${esc(c.nombre)}">${foto}<div class="grow"><span class="eyebrow">${n} · ${h}</span><h3>${esc(c.nombre)}</h3></div>${est}</div>
      <div class="list">${ctx.items.map((it, i) => { const r = regla(it); const s = adj[i] || 0;
        return `<div class="row"><span class="grow small">${esc(it)}</span>${r ? `<span class="delta ${s > 0 ? 'plus' : s < 0 ? 'minus' : ''}">${s ? (s > 0 ? '+' : '−') + Math.abs(s) + ' × ' + esc(r.u) : ''}</span>
        <span class="stepper"><button data-act="adj" data-mi="${mi}" data-i="${i}" data-v="-1" aria-label="Quitar ${esc(r.u)}">−</button><button data-act="adj" data-mi="${mi}" data-i="${i}" data-v="1" aria-label="Añadir ${esc(r.u)}">+</button></span>` : ''}</div>`; }).join('')}</div>
      <div class="row between small"><span class="muted">P ${fmt(m.p)} · HC ${fmt(m.c)} · G ${fmt(m.g)} · ${fmt(m.kcal)} kcal</span><button class="btn" data-act="abrir-marcar" data-mi="${mi}">${reg.estado ? 'Editar' : 'Marcar'}</button></div>
    </div>`;
  }).join('');
  return `${cabeceraFecha('Comida')}
  ${segTipo(dia, 'tipo-dia')}
  ${viaje ? '' : `<div class="row between"><span class="small muted">Menú de Jesús</span><div class="row" role="group" aria-label="Menú">${[1, 2, 3, 4, 5, 6].map(n => `<button class="chip" data-act="menu" data-v="${n}" style="${dia.menu === n ? 'background:var(--dark);color:var(--on-dark);font-weight:700' : ''}" aria-pressed="${dia.menu === n}">${n}</button>`).join('')}</div></div>`}
  <div class="card"><div class="macros">
    <span><span class="num" style="font-size:20px">${fmt(tot.kcal)}</span><br><span class="tiny muted">/ ${fmt(obj.kcal)} kcal</span></span>
    <span><span class="num" style="font-size:20px;color:${protColor(tot.p)}">${fmt(tot.p)} g</span><br><span class="tiny muted">/ 170 prot.</span></span>
    <span><span class="num" style="font-size:20px">${fmt(tot.c)} g</span><br><span class="tiny muted">${obj.c ? '/ ' + fmt(obj.c) : ''} HC</span></span>
    <span><span class="num" style="font-size:20px">${fmt(tot.g)} g</span><br><span class="tiny muted">${obj.g ? '/ ' + fmt(obj.g) : ''} grasa</span></span>
  </div><span class="tiny muted">Cuenta lo que has marcado. Ajusta raciones con − / + antes o después de comer.</span></div>
  ${comidas}
  <div class="card"><span class="eyebrow">Añadir rápido</span><div class="row wrap">${EXTRAS.map(e => `<button class="chip" data-act="extra" data-v="${e.id}">${esc(e.txt)}</button>`).join('')}</div>
    ${(dia.extras || []).length ? `<span class="small muted">Añadido hoy: ${dia.extras.map(id => esc((EXTRAS.find(e => e.id === id) || {}).txt || '')).join(', ')} · <button class="chip" data-act="extra-quitar">Quitar último</button></span>` : ''}</div>
  <div class="tools"><button class="btn" data-act="semana">Plan de la semana</button><button class="btn" data-act="platos">Montar platos</button><button class="btn" data-act="equiv">Equivalencias</button></div>`;
}

/* ---------- ENTRENO ---------- */
function sesionDe(dia) { return dia.sesion || null; }
function vistaEntreno() {
  const dia = getDia(st.fecha); const n = st.entDia || dia.diaEntreno; const dp = diaPlan(n); const ses = sesionDe(dia);
  const activa = ses && ses.dia === n;
  const exCard = (b, e) => {
    const key = ejKey(n, b.id, e.n); const reg = activa && ses.series[key] ? ses.series[key].filter(x => x && x.done).length : 0;
    return `<button class="ex" data-act="ej" data-b="${b.id}" data-e="${e.n}">
      <img src="${e.img}" alt=""><div class="grow"><b>${e.n} · ${esc(e.nombre)}</b><br><span class="small muted">${e.series.length} × ${esc(e.series[0].reps)} · ${esc(e.series[0].peso)}${e.metodo ? ' · ' + esc(e.metodo) : ''}</span></div>
      <span class="small ${reg >= e.series.length ? 'tick' : 'muted'}">${reg >= e.series.length ? '✓' : reg ? reg + '/' + e.series.length : '›'}</span></button>`;
  };
  const bloques = dp.bloques.map(b => {
    const groups = []; b.ej.forEach(e => { const g = groups[groups.length - 1]; if (e.superserie && g && g.sup === e.superserie) g.ej.push(e); else groups.push({ sup: e.superserie, ej: [e] }); });
    return `<div class="card"><span class="eyebrow">Bloque ${b.id} · ${esc(b.titulo)}</span>
      ${groups.map(g => g.sup ? `<div class="col" style="border-left:3px solid var(--accent);padding-left:10px"><span class="tiny" style="color:var(--accent-ink);font-weight:700">SUPERSERIE · ${esc(g.sup)} <button class="chip" data-act="metodo" data-v="SUPERSERIE" aria-label="Qué es una superserie">ⓘ</button></span>${g.ej.map(e => exCard(b, e)).join('')}</div>` : g.ej.map(e => exCard(b, e)).join('')).join('')}
    </div>`;
  }).join('');
  const cardio = (id, c, titulo) => { const r = activa && ses.cardio && ses.cardio[id];
    return `<button class="card ex" style="padding:12px 14px" data-act="cardio" data-v="${id}"><img src="${c.img}" alt=""><div class="grow"><span class="eyebrow">${titulo}</span><br><b>${esc(r && r.maquina || c.maquina)} · ${c.duracion}'</b> <span class="small muted">· ${esc(c.fc)} ppm</span></div><span class="small ${r && r.done ? 'tick' : 'muted'}">${r && r.done ? '✓' : '›'}</span></button>`; };
  return `<div class="row between"><div class="col" style="gap:2px"><span class="small muted">${fechaTxt(st.fecha)} · ciclo 1</span><h1>Entreno</h1></div>
    ${activa && !ses.fin ? `<span class="pill warn">En curso</span>` : activa && ses.fin ? `<span class="pill good">Hecho</span>` : ''}</div>
  <div class="seg" role="group" aria-label="Día de entreno">${PLAN.map(d => `<button data-act="ent-dia" data-v="${d.n}" aria-pressed="${n === d.n}">Día ${d.n}<small>${esc(d.foco.toLowerCase())}</small></button>`).join('')}</div>
  <p class="small" style="margin:0"><span class="eyebrow">Objetivo</span><br>${esc(dp.objetivo)}</p>
  ${!activa ? `<button class="btn primary block" data-act="ses-ini" data-v="${n}">Empezar sesión del día ${n}</button>` : ''}
  ${cardio('hiit', dp.hiit, 'Cardio alta intensidad')}
  ${bloques}
  ${cardio('cinta', dp.cinta, 'Cardio baja intensidad')}
  <a class="card ex" style="padding:12px 14px;text-decoration:none;color:inherit" href="${dp.movilidad}" target="_blank" rel="noopener"><div class="grow"><span class="eyebrow">Movilidad</span><br><b>Rutina en vídeo</b></div><span class="small muted">▶</span></a>
  ${activa && !ses.fin ? `<button class="btn primary block" data-act="ses-fin">Terminar sesión</button>` : ''}`;
}
function hojaEjercicio(bid, en) {
  const dia = getDia(st.fecha); const n = st.entDia || dia.diaEntreno; const dp = diaPlan(n);
  const b = dp.bloques.find(x => x.id === bid); const e = b.ej.find(x => x.n === en); const key = ejKey(n, bid, en);
  const ses = dia.sesion && dia.sesion.dia === n ? dia.sesion : null;
  const reg = (ses && ses.series[key]) || [];
  const ult = ultimo(key, st.fecha);
  const lastTxt = ult ? 'Última vez (' + fechaTxt(ult.fecha) + '): ' + ult.series.filter(s => s && s.done).map(s => (s.peso || '') + ' × ' + (s.reps || '')).join(' · ') : 'Primera vez con este ejercicio';
  const all = dp.bloques.flatMap(x => x.ej.map(y => [x.id, y.n])); const pos = all.findIndex(([x, y]) => x === bid && y === en); const sig = all[pos + 1];
  return `<div class="grab"></div>
  <div class="row" style="align-items:flex-start"><div class="bigimg"><img src="${e.img}" alt="${esc(e.nombre)}">${e.musculo ? `<img class="mus" src="${e.musculo}" alt="Músculos trabajados">` : ''}</div>
    <div class="col grow" style="gap:6px"><h2>${esc(e.nombre)}</h2>
      <div class="row wrap" style="gap:6px">${e.metodo ? `<button class="chip method" data-act="metodo" data-v="${esc(e.metodo)}">${esc(e.metodo)} ⓘ</button>` : ''}${e.ajustes ? e.ajustes.split(' · ').map(a => `<span class="chip">${esc(a)}</span>`).join('') : ''}${e.video ? `<a class="chip link" href="${e.video}" target="_blank" rel="noopener">▶ Vídeo</a>` : `<a class="chip link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.nombre + ' técnica')}" target="_blank" rel="noopener">▶ Buscar vídeo</a>`}</div>
    </div></div>
  ${e.tecnica ? `<div class="banner">${esc(e.tecnica)}</div>` : ''}
  ${e.superserie ? `<span class="small" style="color:var(--accent-ink);font-weight:700">Superserie ${esc(e.superserie)}</span>` : ''}
  <span class="small muted">${e.aproximacion ? 'Antes: aproximación 6-3-1 <button class="chip" data-act="metodo" data-v="APROXIMACION">ⓘ</button> · ' : ''}${esc(lastTxt)}</span>
  <div class="card sets"><div class="set tiny muted" style="border-top:0;padding-top:0"><span>#</span><span>Prescrito</span><span>Hecho · kg y reps</span><span></span></div>
  ${e.series.map((s, i) => { const r = reg[i] || {}; const prev = ult && ult.series[i] ? ult.series[i] : {};
    const peso = r.peso != null ? r.peso : (prev.peso || s.peso.replace(/\s*kg.*$/i, '').replace(/ →.*$/, ''));
    const reps = r.reps != null ? r.reps : (prev.reps || '');
    return `<div class="set ${r.done ? 'isdone' : ''}"><span class="num">${i + 1}</span>
      <span class="small">${esc(s.reps)}<br><span class="muted">${esc(s.peso)}${s.rir !== '' ? ' · RIR ' + esc(s.rir) : ''}${s.nota ? ' · ' + esc(s.nota) : ''}</span></span>
      <span class="row" style="gap:4px"><input id="p-${key}-${i}" inputmode="decimal" value="${esc(peso)}" aria-label="Peso serie ${i + 1}"><input id="r-${key}-${i}" inputmode="numeric" value="${esc(reps)}" placeholder="${esc(s.reps.length < 6 ? s.reps : '')}" aria-label="Repeticiones serie ${i + 1}"></span>
      <button class="ok" data-act="serie" data-key="${key}" data-i="${i}" data-desc="${esc(s.descanso)}" aria-label="Serie ${i + 1} hecha">✓</button></div>`; }).join('')}
  <span class="tiny muted">Descanso: ${esc(e.series[0].descanso)}</span></div>
  <div class="field"><label for="nota-${key}">Nota para Jesús (opcional)</label><input id="nota-${key}" value="${esc((ses && ses.notas && ses.notas[key]) || '')}" data-nota="${key}" placeholder="Ej.: molestia en el hombro"></div>
  <div class="row">${sig ? `<button class="btn grow" data-act="ej" data-b="${sig[0]}" data-e="${sig[1]}">Siguiente ejercicio ›</button>` : ''}<button class="btn grow" data-act="cerrar">Volver a la lista</button></div>`;
}
function hojaCardio(id) {
  const dia = getDia(st.fecha); const n = st.entDia || dia.diaEntreno; const c = diaPlan(n)[id];
  const ses = dia.sesion && dia.sesion.dia === n ? dia.sesion : null; const r = (ses && ses.cardio && ses.cardio[id]) || {};
  const maq = r.maquina || c.maquina;
  return `<div class="grab"></div><span class="eyebrow">${id === 'hiit' ? 'Cardio alta intensidad' : 'Cardio baja intensidad'}</span>
  <div class="row"><div class="field grow"><label for="maq">Máquina</label><select id="maq" data-cardio="maquina">${MAQUINAS.map(m => `<option ${m === maq ? 'selected' : ''}>${m}</option>`).join('')}</select></div><h2 style="align-self:flex-end">${c.duracion} min</h2></div>
  <span class="small muted">Jesús propone ${esc(c.maquina.toLowerCase())}. Si está ocupada, elige otra: el pulso objetivo es el mismo.</span>
  <div class="card"><span class="eyebrow">Objetivo de pulso</span><div class="row"><span class="num" style="font-size:44px;color:var(--accent-ink)">${esc(c.fc)}</span><span class="small muted">ppm · ${esc(c.objetivo)}</span></div>
    <div style="display:grid;grid-template-columns:2fr 1.2fr 1fr .8fr;height:12px;border-radius:6px;overflow:hidden"><span style="background:var(--good-soft)"></span><span style="background:var(--warn-soft)"></span><span style="background:var(--accent-soft)"></span><span style="background:var(--accent)"></span></div>
    <div class="row between tiny muted"><span>Z1 120–145</span><span>Z2 145–165</span><span>Z3 165–175</span><span>máx 182</span></div></div>
  <div class="banner">${esc(c.detalle)}</div>
  <div class="card dark small">Inicia en el Watch el entreno de la máquina elegida y páralo al terminar. El pulso medio y máximo llegará solo (fase 2).</div>
  <div class="row"><div class="field grow"><label for="vat">Vatios medios</label><input id="vat" inputmode="numeric" data-cardio="vatios" value="${esc(r.vatios || '')}"></div><div class="field grow"><label for="dist">Distancia (m)</label><input id="dist" inputmode="numeric" data-cardio="distancia" value="${esc(r.distancia || '')}"></div></div>
  <span class="small muted">Sensación</span><div class="seg">${[1, 2, 3, 4, 5].map(v => `<button data-act="cardio-sens" data-v="${v}" aria-pressed="${r.sensacion === v}">${v}</button>`).join('')}</div>
  <button class="btn primary block" data-act="cardio-ok" data-v="${id}">Hecho</button>`;
}
function hojaMetodo(k) {
  const m = DATOS.metodos[k.toUpperCase()] || DATOS.metodos[k] || { corta: 'Sin descripción todavía.', larga: '' };
  return `<div class="grab"></div><div class="row between"><h1>${esc(k)}</h1><button class="btn" data-act="cerrar" aria-label="Cerrar">✕</button></div>
  <p style="font-size:17px;font-weight:500;margin:0">${esc(m.corta)}</p>
  ${m.larga ? (st.verMas ? `<p style="margin:0;line-height:1.5">${esc(m.larga)}</p><span class="tiny muted">Fuente: hoja «Terminología» de Jesús${k.toUpperCase() === 'CLUSTER' ? ' (pendiente de su explicación)' : ''}.</span>` : `<button class="btn" data-act="ver-mas">Ver explicación completa</button>`) : ''}
  <button class="btn primary block" data-act="cerrar">Entendido</button>`;
}

/* ---------- MARCAR COMIDA ---------- */
function hojaMarcar(mi) {
  const dia = getDia(st.fecha); const [k, n, h] = MOMENTOS[mi]; const reg = dia.comidas[k] || {};
  const estado = st.sheet.estado || reg.estado || 'seguida';
  const viaje = dia.tipo === 'viaje';
  const titulo = viaje ? n + ' · viaje' : comidaPlan(dia, mi).c.nombre;
  const img = viaje ? '' : comidaPlan(dia, mi).c.img;
  const foto = st.sheet.foto !== undefined ? st.sheet.foto : reg.foto;
  const m = macrosComida(dia, mi);
  let cuerpo = '';
  if (estado === 'cambiada' && !viaje) {
    const { ctx } = comidaPlan(dia, mi); const adj = reg.adj || {};
    cuerpo = `<div class="card"><span class="eyebrow">Ajusta lo que comiste · raciones de Jesús</span><div class="list">${ctx.items.map((it, i) => { const r = regla(it); const s = adj[i] || 0;
      return `<div class="row"><span class="grow small">${esc(it)}${r ? ` <span class="muted">(paso: ${esc(r.u)})</span>` : ''}</span>${r ? `<span class="delta ${s > 0 ? 'plus' : s < 0 ? 'minus' : ''}">${s ? (s > 0 ? '+' : '−') + Math.abs(s) + ' × ' + esc(r.u) : ''}</span><span class="stepper"><button data-act="adj" data-mi="${mi}" data-i="${i}" data-v="-1" aria-label="Quitar">−</button><button data-act="adj" data-mi="${mi}" data-i="${i}" data-v="1" aria-label="Añadir">+</button></span>` : ''}</div>`; }).join('')}</div></div>`;
  }
  if (estado === 'fuera') {
    cuerpo = `<div class="row"><div class="field grow"><label for="fk">Calorías aprox.</label><input id="fk" inputmode="numeric" value="${esc(reg.kcal || '')}" placeholder="${fmt(m.kcal)}"></div><div class="field grow"><label for="fp">Proteína aprox. (g)</label><input id="fp" inputmode="numeric" value="${esc(reg.p || '')}" placeholder="30"></div></div>`;
  }
  return `<div class="grab"></div>
  <div class="row">${foto ? `<img class="thumb" style="width:84px;height:84px" src="${foto}" alt="Tu foto">` : img ? `<img class="thumb" style="width:84px;height:84px;opacity:.85" src="${img}" alt="">` : ''}
    <div class="col grow" style="gap:2px"><span class="small muted">${n} · ${h}</span><h2>${esc(titulo)}</h2><button class="chip link" data-act="foto" data-mi="${mi}">${foto ? 'Repetir foto' : '📷 Hacer foto'}</button></div></div>
  <div class="seg" role="group" aria-label="Cómo fue">${(viaje ? [['seguida', 'Según reglas'], ['fuera', 'Fuera de plan']] : [['seguida', 'Seguida'], ['cambiada', 'Cambiada'], ['fuera', 'Fuera de plan']]).map(([v, t]) => `<button data-act="estado" data-v="${v}" aria-pressed="${estado === v}">${t}</button>`).join('')}</div>
  ${cuerpo}
  <div class="field"><label for="cnota">Nota (opcional)</label><input id="cnota" value="${esc(reg.nota || '')}" placeholder="Ej.: comida de trabajo"></div>
  <div class="card"><div class="row between small"><span>Esta comida</span><b>~${fmt(m.kcal)} kcal · P ${fmt(m.p)} g</b></div></div>
  <button class="btn primary block" data-act="guardar-comida" data-mi="${mi}">Guardar</button>`;
}

/* ---------- PLAN SEMANA / PLATOS / EQUIVALENCIAS ---------- */
function hojaSemana() {
  const lun = lunes(st.fecha); const sem = getSemana(st.fecha);
  return `<div class="grab"></div><span class="small muted">Se suele fijar el domingo. Cualquier día se puede cambiar después.</span><h2>Semana del ${fechaTxt(lun).toLowerCase()}</h2>
  <div class="card list">${sem.map((d, i) => { const f = addDays(lun, i); return `<div class="row"><b style="width:86px">${fechaTxt(f).split(' ').slice(0, 2).join(' ')}</b>
    <select id="st-${i}" data-sem="tipo" data-i="${i}" aria-label="Tipo de día" style="height:40px;border-radius:8px;border:1px solid var(--line);background:var(--surface)">${TIPOS.map(([k, n]) => `<option value="${k}" ${d.tipo === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <select id="sm-${i}" data-sem="menu" data-i="${i}" aria-label="Menú" style="height:40px;border-radius:8px;border:1px solid var(--line);background:var(--surface)" ${d.tipo === 'viaje' ? 'disabled' : ''}>${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${d.menu === n ? 'selected' : ''}>Menú ${n}</option>`).join('')}</select></div>`; }).join('')}</div>
  <span class="tiny muted">Los días de entreno se numeran solos (día 1, 2, 3, 4) en el orden de la semana. La lista de la compra llega en la fase 2.</span>
  <button class="btn primary block" data-act="cerrar">Listo</button>`;
}
function hojaPlatos() {
  return `<div class="grab"></div><h1>Cómo montar tus platos</h1><span class="small muted">Para viajes, restaurantes o cuando no sigas el menú</span>
  <div style="display:grid;grid-template-columns:4fr 4fr 2fr;gap:3px"><span style="height:10px;border-radius:5px;background:#1E4F8C"></span><span style="height:10px;border-radius:5px;background:var(--good)"></span><span style="height:10px;border-radius:5px;background:var(--warn)"></span><b class="tiny">Desayuno 40 %</b><b class="tiny">Almuerzo 40 %</b><b class="tiny">Cena 20 %</b></div>
  ${MOMENTOS.map(([k, n], i) => `<div class="card"><b>${n}</b><span class="small">${esc(REGLAS_PLATO[k])}</span></div>`).join('')}
  <div class="card dark"><span class="eyebrow">Tu regla final</span><span>¿Entrenas? Sube el carbohidrato del desayuno y el almuerzo. ¿No entrenas? Bájalo y mantén la proteína.</span></div>
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
}
const EQUIV = {
  'Proteína · ≈57 g por comida': [['Pollo cocinado', '185 g', '2 filetes tamaño palma'], ['Ternera magra', '210 g', '2 filetes tamaño palma'], ['Cerdo magro', '210 g', '2 filetes tamaño palma'], ['Pescado blanco', '250 g', '2 filetes medianos'], ['Pescado azul', '230–260 g', '2 filetes medianos'], ['Atún al natural', '225 g', '3 latas de 75 g escurridas'], ['Marisco cocido pelado', '240–285 g', '1½–2 tazas'], ['Yogur griego alto en proteína*', '200 g', '1 envase']],
  'Hidratos · ≈41 g por comida': [['Patata cocida', '240 g', '2 patatas pequeñas'], ['Boniato cocido', '200 g', '1 mediano'], ['Arroz cocido', '145 g', '¾ de taza'], ['Pasta cocida', '140–165 g', '1 taza'], ['Pan integral', '90–100 g', '3 rebanadas de 30 g'], ['Avena seca', '65 g', '¾ de taza + 1 cda'], ['Manzana', '300 g', '2 pequeñas']],
  'Grasas · ≈29 g por comida': [['AOVE', '29 g', '2 cdas + ½ cdta'], ['Aguacate', '190 g', '1 grande'], ['Frutos secos', '50–60 g', '2 puñados pequeños'], ['Crema de cacahuete', '55–60 g', '4 cdas rasas'], ['Huevos enteros*', '2', 'aportan 10–11 g de grasa']]
};
function hojaEquiv() {
  return `<div class="grab"></div><h1>Equivalencias</h1><span class="small muted">Tablas de Jesús (referencia 1.950 kcal). * Complemento: no cubre la comida solo.</span>
  ${Object.entries(EQUIV).map(([t, rows]) => `<div class="card"><span class="eyebrow">${esc(t)}</span><div class="list">${rows.map(([a, b, c]) => `<div class="row"><span class="grow"><b class="small">${esc(a)}</b><br><span class="tiny muted">${esc(c)}</span></span><b class="small">${esc(b)}</b></div>`).join('')}</div></div>`).join('')}
  <div class="banner"><b>Jesús:</b> combina. 150 g de pollo + 100 g de lentejas ≈ 55 g de proteína.</div>
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
}

/* ---------- PROGRESO ---------- */
function medidas() {
  const base = [{ fecha: '2026-09-01', peso: 90.9, grasa: 22.1, cintura: 94, origen: 'Jesús' }, { fecha: '2026-10-01', peso: 92.1, cintura: 95, origen: 'Jesús' }];
  return base.concat(load('medidas', [])).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
}
function vistaProgreso() {
  const M = medidas(); const ult = M[M.length - 1]; const first = M[0];
  const x0 = parse('2026-09-01'), x1 = parse('2027-01-03'); const W = 330, H = 150;
  const X = (f) => 30 + (parse(f) - x0) / (x1 - x0) * (W - 44); const Y = (v) => 10 + (94 - v) * 130 / 12;
  const pts = M.filter(m => m.peso).map(m => [X(m.fecha), Y(m.peso)]);
  return `<div class="row between"><div class="col" style="gap:2px"><span class="small muted">Semana ${Math.max(1, Math.min(semanaN(st.fecha), SEMANAS))} de 12 · fin 3 ene</span><h1>Progreso</h1></div><button class="btn primary" data-act="pesarme">+ Pesarme</button></div>
  <div class="card"><div class="row between"><b>Peso</b><span><span class="num" style="font-size:26px">${String(ult.peso).replace('.', ',')} kg</span> <span class="small ${ult.peso > first.peso ? '' : ''}" style="color:${ult.peso > first.peso ? 'var(--bad)' : 'var(--good)'}">${ult.peso > first.peso ? '+' : ''}${(ult.peso - first.peso).toFixed(1).replace('.', ',')} vs sep</span></span></div>
  <svg viewBox="0 0 ${W} 160" role="img" aria-label="Evolución del peso y objetivo de 84 a 86 kg el 3 de enero" style="width:100%;height:auto">
    ${[94, 90, 86, 82].map(v => `<line x1="30" x2="${W - 14}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--soft)"/><text x="24" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`).join('')}
    <rect x="${X(INICIO)}" y="${Y(86)}" width="${W - 14 - X(INICIO)}" height="${Y(84) - Y(86)}" fill="var(--good-soft)"/>
    <line x1="${X(INICIO)}" x2="${X(INICIO)}" y1="10" y2="140" stroke="var(--accent)" stroke-dasharray="3 3"/>
    <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--ink)"/>`).join('')}
    <text x="${W - 16}" y="${Y(86) - 4}" text-anchor="end" font-size="10" font-weight="700" fill="var(--good)">objetivo 84–86</text>
    <text x="30" y="156" font-size="10" fill="var(--muted)">1 sep</text><text x="${X(INICIO) + 3}" y="156" font-size="10" fill="var(--accent-ink)">inicio</text><text x="${W - 14}" y="156" text-anchor="end" font-size="10" fill="var(--muted)">3 ene</text>
  </svg></div>
  <div class="card list">${M.slice().reverse().map(m => `<div class="row"><span class="grow small">${fechaTxt(m.fecha)} <span class="muted tiny">· ${esc(m.origen || 'tú')}</span></span><b class="small">${m.peso ? String(m.peso).replace('.', ',') + ' kg' : ''}${m.cintura ? ' · ' + m.cintura + ' cm' : ''}${m.grasa ? ' · ' + String(m.grasa).replace('.', ',') + ' %' : ''}</b></div>`).join('')}</div>
  <p class="tiny muted">Actividad, fuerza y analítica llegan en las próximas fases.</p>`;
}
function hojaPesarme() {
  return `<div class="grab"></div><h2>Pesaje semanal</h2><span class="small muted">Lunes en ayunas, después del baño.</span>
  <div class="row"><div class="field grow"><label for="mp">Peso (kg)</label><input id="mp" inputmode="decimal" placeholder="91,6"></div><div class="field grow"><label for="mc">Cintura (cm, opcional)</label><input id="mc" inputmode="decimal" placeholder="94,5"></div></div>
  <button class="btn primary block" data-act="guardar-peso">Guardar</button>`;
}
function hojaPasos() {
  const dia = getDia(st.fecha);
  return `<div class="grab"></div><h2>Pasos de hoy</h2><span class="small muted">Míralos en la app Salud o en el Watch. Desde la fase 2 llegarán solos.</span>
  <div class="field"><label for="ps">Pasos</label><input id="ps" inputmode="numeric" value="${dia.pasos || ''}" placeholder="12000"></div>
  <button class="btn primary block" data-act="guardar-pasos">Guardar</button>`;
}

/* ---------- PLAN ---------- */
function vistaPlan() {
  const dia = getDia(st.fecha);
  return `<div class="col" style="gap:2px"><span class="small muted">Jesús de la Obra · La Obra Fitness</span><h1>Plan</h1></div>
  <div class="card dark"><span class="eyebrow">Objetivo · 12 semanas · 12 oct → 3 ene</span>
    <div class="row between" style="text-align:center"><span><span class="num" style="font-size:24px">86 → 84</span><br><span class="tiny muted">kg</span></span><span><span class="num" style="font-size:24px">17 → 15 %</span><br><span class="tiny muted">grasa</span></span><span><span class="num" style="font-size:24px">170 g</span><br><span class="tiny muted">proteína/día</span></span></div></div>
  <div class="card"><span class="eyebrow">Suplementos de hoy</span><div class="list">${DATOS.suplementos.map(s => { const k = 's_' + (s.momento === 'noche' ? 'noche' : s.momento);
    return `<div class="row"><span class="grow"><b class="small">${esc(s.nombre)} · ${esc(s.dosis)}</b><br><span class="tiny muted">${esc(s.momento)} · ${esc(s.porque)} · revisar ${esc(s.revision)}</span></span><a class="chip link" href="${s.link}" target="_blank" rel="noopener">HSN</a></div>`; }).join('')}</div>
    <div class="row wrap">${[['s_desayuno', 'Desayuno'], ['s_almuerzo', 'Almuerzo'], ['s_noche', 'Noche']].map(([k, t]) => `<button class="chip ${dia.habitos[k] ? 'ok' : ''}" data-act="hab" data-k="${k}">${dia.habitos[k] ? '✓ ' : ''}${t}</button>`).join('')}</div>
    <div class="banner" style="background:var(--bad-soft);color:var(--bad)"><b>Nada con hierro</b> hasta repetir la analítica y comentarlo con el médico.</div></div>
  <div class="card"><span class="eyebrow">Tipos de día</span><div class="list">
    <div class="row"><b class="grow small">Entreno</b><span class="small">≈2.200 kcal · 170 g prot.</span></div>
    <div class="row"><b class="grow small">Sin entreno</b><span class="small">≈1.900 kcal · 170 g prot.</span></div>
    <div class="row"><b class="grow small">Viaje</b><span class="small">≈1.950 kcal · reglas de platos</span></div></div><span class="tiny muted">Pendiente de confirmar con Jesús.</span></div>
  <div class="card"><span class="eyebrow">Las reglas de Jesús</span><div class="list small">
    <div><b>90/10 ·</b> 90 % comida real; 10 % de margen sin culpa.</div><div><b>3+1 comidas ·</b> de 8:30 a 21:00.</div>
    <div><b>Moverse ·</b> 10–15.000 pasos, de pie cada 30 min, sentadillas al despertar, movilidad antes de dormir.</div>
    <div><b>Cenas ·</b> ligeras, proteína y verdura cocinada, sin salsas, lácteos ni postre.</div></div></div>
  <div class="card"><span class="eyebrow">Métodos de entreno</span><div class="row wrap">${Object.keys(DATOS.metodos).map(k => `<button class="chip" data-act="metodo" data-v="${esc(k)}">${esc(k)} ⓘ</button>`).join('')}</div></div>
  <div class="card"><span class="eyebrow">Estilo de la app</span><div class="seg" role="group" aria-label="Estilo">${[['sport', 'Sport'], ['clasico', 'Clásico']].map(([k, n]) => `<button data-act="estilo" data-v="${k}" aria-pressed="${estiloActual() === k}">${n}</button>`).join('')}</div></div>
  <div class="card" id="cuenta"><span class="eyebrow">Tu cuenta y tus datos</span><span class="small" id="nube-estado">${textoNube()}</span>
    ${cuentaHtml()}
    <span class="tiny muted">Copia manual (por si acaso):</span>
    <div class="row wrap"><button class="btn grow" data-act="exportar">Copiar copia de seguridad</button><button class="btn grow" data-act="importar">Restaurar copia</button></div></div>`;
}
function cuentaHtml() {
  if (!sb) return '';
  if (nube.user) return `<span class="small muted">Conectado como <b>${esc(nube.user.email || '')}</b></span>
    <div class="row wrap"><button class="btn grow" data-act="sync">Sincronizar ahora</button><button class="btn grow" data-act="logout">Cerrar sesión</button></div>`;
  return `<div class="field"><label for="em">Email</label><input id="em" type="email" inputmode="email" autocomplete="username" placeholder="tu@email.com" value="${esc(nube.email || '')}"></div>
    <div class="field"><label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password" placeholder="mínimo 6 caracteres"></div>
    <div class="row wrap"><button class="btn primary grow" data-act="login-entrar">Entrar</button><button class="btn grow" data-act="login-crear">Crear cuenta</button></div>
    <span class="tiny muted">La primera vez pulsa «Crear cuenta». Después, siempre «Entrar».</span>`;
}
function hojaImportar() {
  return `<div class="grab"></div><h2>Restaurar copia</h2><div class="field"><label for="imp">Pega aquí la copia</label><textarea id="imp"></textarea></div>
  <button class="btn primary block" data-act="importar-ok">Restaurar</button>`;
}

/* ---------- render ---------- */
function render() {
  const v = { hoy: vistaHoy, entreno: vistaEntreno, comida: vistaComida, progreso: vistaProgreso, plan: vistaPlan }[st.tab] || vistaHoy;
  $('#main').innerHTML = v();
  document.querySelectorAll('nav.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === st.tab ? 'page' : 'false'));
  renderSheet(); renderTimer();
}
function renderSheet() {
  const el = $('#sheet');
  if (!st.sheet) { el.innerHTML = ''; return; }
  const s = st.sheet; let html = '';
  if (s.t === 'ej') html = hojaEjercicio(s.b, s.e);
  else if (s.t === 'cardio') html = hojaCardio(s.id);
  else if (s.t === 'metodo') html = hojaMetodo(s.k);
  else if (s.t === 'marcar') html = hojaMarcar(s.mi);
  else if (s.t === 'semana') html = hojaSemana();
  else if (s.t === 'platos') html = hojaPlatos();
  else if (s.t === 'equiv') html = hojaEquiv();
  else if (s.t === 'pesarme') html = hojaPesarme();
  else if (s.t === 'pasos') html = hojaPasos();
  else if (s.t === 'importar') html = hojaImportar();
  const prev = el.querySelector('.sheet'); const top = prev ? prev.scrollTop : 0;
  el.innerHTML = `<div class="sheet-wrap" data-act="fondo"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  if (prev && s.keep) el.querySelector('.sheet').scrollTop = top;
  s.keep = true;
}
function abrir(sheet) { st.sheet = Object.assign({}, sheet); st.verMas = false; renderSheet(); }
function cerrar() { st.sheet = null; renderSheet(); render(); }

/* ---------- temporizador de descanso ---------- */
let tick = null;
function iniciarTimer(seg, label) {
  if (!seg) return;
  st.timer = { end: Date.now() + seg * 1000, label };
  clearInterval(tick); tick = setInterval(renderTimer, 500); renderTimer();
}
function renderTimer() {
  const el = $('#timer');
  if (!st.timer) { el.hidden = true; return; }
  const left = Math.ceil((st.timer.end - Date.now()) / 1000);
  if (left <= -6) { st.timer = null; clearInterval(tick); el.hidden = true; return; }
  el.hidden = false; el.classList.toggle('go', left <= 0);
  el.innerHTML = left > 0
    ? `<span class="col" style="gap:2px"><span class="small" style="opacity:.8">Descanso · ${esc(st.timer.label)}</span><span class="num">${Math.floor(left / 60)}:${pad(left % 60)}</span></span><span class="row"><button class="btn ghost-dark" data-act="t+30">+30´´</button><button class="btn primary" data-act="t-skip">Saltar</button></span>`
    : `<span class="num" style="font-size:24px">¡A por la siguiente serie!</span><button class="btn ghost-dark" data-act="t-skip">Cerrar</button>`;
}

/* ---------- fotos ---------- */
let fotoMi = null;
function pedirFoto(mi) { fotoMi = mi; const f = $('#foto'); f.value = ''; f.click(); }
$('#foto').addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0]; if (!file) return;
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 480, r = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const data = c.toDataURL('image/jpeg', 0.72);
    if (st.sheet && st.sheet.t === 'marcar') { st.sheet.foto = data; renderSheet(); }
    else { abrir({ t: 'marcar', mi: fotoMi, foto: data }); }
  };
  img.src = url;
});

/* ---------- acciones ---------- */
function guardarSesionInputs() { // guarda lo escrito en los campos de series y notas antes de re-renderizar
  if (!st.sheet || st.sheet.t !== 'ej') return;
  setDia(st.fecha, d => {
    if (!d.sesion) return;
    document.querySelectorAll('.set input').forEach(inp => {
      const m = inp.id.match(/^([pr])-(.+)-(\d+)$/); if (!m) return;
      const key = m[2], i = +m[3]; d.sesion.series[key] = d.sesion.series[key] || [];
      const s = d.sesion.series[key][i] = d.sesion.series[key][i] || {};
      s[m[1] === 'p' ? 'peso' : 'reps'] = inp.value;
    });
    const nota = $('[data-nota]'); if (nota) { d.sesion.notas = d.sesion.notas || {}; d.sesion.notas[nota.dataset.nota] = nota.value; }
  });
}
function asegurarSesion(n) { setDia(st.fecha, d => { if (!d.sesion || d.sesion.dia !== n) d.sesion = { dia: n, inicio: new Date().toISOString(), series: {}, cardio: {}, notas: {} }; }); }

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act],[data-tab]'); if (!t) return;
  if (t.dataset.tab) { guardarSesionInputs(); st.tab = t.dataset.tab; st.sheet = null; try { localStorage.setItem('fs:tab', st.tab); } catch (e) {} render(); window.scrollTo(0, 0); return; }
  const a = t.dataset.act; const v = t.dataset.v;
  if (a === 'fondo') { if (ev.target === t) { guardarSesionInputs(); cerrar(); } return; }
  switch (a) {
    case 'dia-prev': st.fecha = addDays(st.fecha, -1); st.entDia = null; break;
    case 'dia-next': st.fecha = addDays(st.fecha, 1); st.entDia = null; break;
    case 'tipo-dia': setDia(st.fecha, d => { d.tipo = v; if (v === 'entreno' && !d.diaEntreno) d.diaEntreno = 1; }); break;
    case 'menu': setDia(st.fecha, d => { d.menu = +v; }); break;
    case 'hab': setDia(st.fecha, d => { d.habitos[t.dataset.k] = !d.habitos[t.dataset.k]; }); break;
    case 'energia': setDia(st.fecha, d => { d.energia = +v; d.habitos.s_noche = true; d.habitos.movilidad = true; }); toast('Día cerrado'); break;
    case 'pasos': abrir({ t: 'pasos' }); return;
    case 'guardar-pasos': setDia(st.fecha, d => { d.pasos = parseInt($('#ps').value, 10) || 0; }); cerrar(); return;
    case 'ir-entreno': st.tab = 'entreno'; break;
    case 'agenda': {
      const k = t.dataset.k;
      if (k === 'entreno') st.tab = 'entreno';
      else if (k === 'sentadillas') setDia(st.fecha, d => { d.habitos.sentadillas = !d.habitos.sentadillas; });
      else if (k === 'noche') { /* se cierra desde la tarjeta Ahora */ }
      else { abrir({ t: 'marcar', mi: +t.dataset.mi }); return; }
      break;
    }
    case 'marcar-rapido': { const mi = +t.dataset.mi; const k = MOMENTOS[mi][0]; setDia(st.fecha, d => { d.comidas[k] = Object.assign(d.comidas[k] || {}, { estado: 'seguida' }); d.habitos['s_' + k] = d.habitos['s_' + k] || DATOS.suplementos.some(s => s.momento === k); }); toast(MOMENTOS[mi][1] + ' marcado'); break; }
    case 'abrir-marcar': { const mi = +t.dataset.mi; const reg = getDia(st.fecha).comidas[MOMENTOS[mi][0]] || {}; abrir({ t: 'marcar', mi, estado: reg.estado || (t.textContent.includes('Fuera') ? 'fuera' : 'cambiada') }); return; }
    case 'foto': pedirFoto(+t.dataset.mi); return;
    case 'estado': st.sheet.estado = v; renderSheet(); return;
    case 'adj': { const mi = +t.dataset.mi, i = +t.dataset.i, k = MOMENTOS[mi][0];
      setDia(st.fecha, d => { const c = d.comidas[k] = d.comidas[k] || {}; c.adj = c.adj || {}; c.adj[i] = Math.max(-6, Math.min(6, (c.adj[i] || 0) + (+v))); });
      if (st.sheet) { renderSheet(); render(); } else render(); return; }
    case 'guardar-comida': { const mi = +t.dataset.mi; const k = MOMENTOS[mi][0]; const s = st.sheet;
      setDia(st.fecha, d => { const c = d.comidas[k] = d.comidas[k] || {}; c.estado = s.estado || c.estado || 'seguida'; if (s.foto !== undefined) c.foto = s.foto;
        c.nota = ($('#cnota') || {}).value || ''; if (c.estado === 'fuera') { c.kcal = ($('#fk') || {}).value || ''; c.p = ($('#fp') || {}).value || ''; }
        d.habitos['s_' + k] = d.habitos['s_' + k] || DATOS.suplementos.some(x => x.momento === k); });
      toast('Guardado'); cerrar(); return; }
    case 'extra': setDia(st.fecha, d => { d.extras = (d.extras || []).concat(v); }); toast('Añadido'); break;
    case 'extra-quitar': setDia(st.fecha, d => { d.extras = (d.extras || []).slice(0, -1); }); break;
    case 'semana': abrir({ t: 'semana' }); return;
    case 'platos': abrir({ t: 'platos' }); return;
    case 'equiv': abrir({ t: 'equiv' }); return;
    case 'ent-dia': st.entDia = +v; break;
    case 'ses-ini': asegurarSesion(+v); setDia(st.fecha, d => { if (d.tipo !== 'entreno') d.tipo = 'entreno'; d.diaEntreno = +v; }); toast('Sesión iniciada'); break;
    case 'ses-fin': setDia(st.fecha, d => { if (d.sesion) d.sesion.fin = new Date().toISOString(); }); st.timer = null; toast('Sesión terminada'); break;
    case 'ej': { guardarSesionInputs(); abrir({ t: 'ej', b: t.dataset.b, e: +t.dataset.e }); const sh = $('.sheet'); if (sh) sh.scrollTop = 0; return; }
    case 'serie': {
      const n = st.entDia || getDia(st.fecha).diaEntreno; asegurarSesion(n); guardarSesionInputs();
      const key = t.dataset.key, i = +t.dataset.i;
      let ahora = false;
      setDia(st.fecha, d => { const arr = d.sesion.series[key] = d.sesion.series[key] || []; const s = arr[i] = arr[i] || {};
        s.peso = ($('#p-' + CSS.escape(key) + '-' + i) || {}).value || s.peso || ''; s.reps = ($('#r-' + CSS.escape(key) + '-' + i) || {}).value || s.reps || '';
        s.done = !s.done; ahora = s.done; });
      if (ahora) iniciarTimer(segs(t.dataset.desc) || 90, 'serie ' + (i + 1) + ' hecha');
      renderSheet(); return; }
    case 't+30': if (st.timer) st.timer.end += 30000; renderTimer(); return;
    case 't-skip': st.timer = null; clearInterval(tick); renderTimer(); return;
    case 'cardio': { const n = st.entDia || getDia(st.fecha).diaEntreno; asegurarSesion(n); abrir({ t: 'cardio', id: v }); return; }
    case 'cardio-sens': { const id = st.sheet.id; setDia(st.fecha, d => { d.sesion.cardio[id] = Object.assign(d.sesion.cardio[id] || {}, { sensacion: +v }); }); renderSheet(); return; }
    case 'cardio-ok': { const id = v; setDia(st.fecha, d => { const r = d.sesion.cardio[id] = d.sesion.cardio[id] || {};
        r.maquina = $('#maq').value; r.vatios = $('#vat').value; r.distancia = $('#dist').value; r.done = true; }); toast('Cardio guardado'); cerrar(); return; }
    case 'metodo': abrir({ t: 'metodo', k: v }); return;
    case 'ver-mas': st.verMas = true; renderSheet(); return;
    case 'pesarme': abrir({ t: 'pesarme' }); return;
    case 'guardar-peso': { const p = parseFloat(($('#mp').value || '').replace(',', '.')); const c = parseFloat(($('#mc').value || '').replace(',', '.'));
      if (!p) { toast('Escribe el peso'); return; }
      const L = load('medidas', []).filter(m => m.fecha !== st.fecha); L.push({ fecha: st.fecha, peso: p, cintura: c || undefined, origen: 'tú' }); save('medidas', L); toast('Peso guardado'); cerrar(); return; }
    case 'exportar': { const dump = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('fs:')) dump[k] = localStorage.getItem(k); } } catch (e) {}
      const txt = JSON.stringify(dump);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Copia copiada al portapapeles'), () => { abrir({ t: 'importar' }); setTimeout(() => { const ta = $('#imp'); if (ta) { ta.value = txt; ta.select(); } toast('Copia el texto seleccionado'); }, 50); });
      return; }
    case 'importar': abrir({ t: 'importar' }); return;
    case 'importar-ok': try { const o = JSON.parse($('#imp').value); Object.entries(o).forEach(([k, val]) => { localStorage.setItem(k, val); const kk = k.slice(3); if (k.startsWith('fs:') && sincroniza(kk)) { marcarTs(kk, Date.now()); pendiente(kk); } }); toast('Copia restaurada'); cerrar(); } catch (e) { toast('El texto no es una copia válida'); } return;
    case 'cerrar': guardarSesionInputs(); cerrar(); return;
    case 'ir-cuenta': st.tab = 'plan'; st.sheet = null; render(); setTimeout(() => { const c = document.getElementById('cuenta'); if (c) c.scrollIntoView({ behavior: 'smooth' }); }, 30); return;
    case 'login-entrar': case 'login-crear': {
      const em = ($('#em').value || '').trim(), pw = $('#pw').value || '';
      if (!/^\S+@\S+\.\S+$/.test(em)) { toast('Escribe un email válido'); return; }
      if (pw.length < 6) { toast('La contraseña necesita 6 caracteres o más'); return; }
      nube.email = em; t.disabled = true;
      const p = a === 'login-crear' ? sb.auth.signUp({ email: em, password: pw }) : sb.auth.signInWithPassword({ email: em, password: pw });
      p.then(({ data, error }) => { t.disabled = false;
        if (error) { toast(/invalid login/i.test(error.message) ? 'Email o contraseña incorrectos' : /already/i.test(error.message) ? 'Esa cuenta ya existe: pulsa Entrar' : 'Error: ' + error.message); return; }
        if (a === 'login-crear' && !(data && data.session)) { toast('Cuenta creada. Confirma desde tu email y luego pulsa Entrar'); return; }
        toast('Conectado'); });
      return; }
    case 'sync': bajar(); return;
    case 'estilo': aplicarEstilo(v); save('estilo', v); break;
    case 'logout': subir().finally(() => sb.auth.signOut().then(() => { nube.user = null; borrarLocales(); toast('Sesión cerrada. Tus datos siguen en la nube'); render(); })); return;
  }
  render();
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.dataset.sem) { const lun = lunes(st.fecha); const sem = getSemana(st.fecha).slice(); const i = +t.dataset.i;
    sem[i] = Object.assign({}, sem[i], { [t.dataset.sem]: t.dataset.sem === 'menu' ? +t.value : t.value }); save('sem:' + lun, sem);
    const f = addDays(lun, i); const d = load('dia:' + f, null); if (d) { delete d[t.dataset.sem]; delete d.diaEntreno; save('dia:' + f, d); }
    renderSheet(); render(); }
  if (t.dataset.nota || (t.id && /^[pr]-/.test(t.id))) guardarSesionInputs();
});

render();
})();
