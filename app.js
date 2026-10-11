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
const regla = (txt) => { let best = null, bi = Infinity; // la coincidencia que aparece antes en el texto (empate: orden de la lista)
  REGLAS.forEach(r => { const m = r.re.exec(txt); if (m && m.index < bi) { bi = m.index; best = r; } }); return best; };

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
const load = (k, def) => { if (k in mem) return mem[k]; try { const v = localStorage.getItem('fs:' + k); if (v != null) return JSON.parse(v); } catch (e) {} return def; };
const save = (k, v) => { mem[k] = v; try { localStorage.setItem('fs:' + k, JSON.stringify(v)); } catch (e) { toast('⚠ Memoria del móvil llena: avisa a Claude'); } if (sincroniza(k)) { marcarTs(k, Date.now()); pendiente(k); } };

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
  P.forEach(k => { if (!tsDe(k)) marcarTs(k, Date.now()); });
  const filas = P.map(k => ({ alumno: nube.user.id, clave: k, valor: JSON.parse(lsGet(k) || 'null'), actualizado: new Date(tsDe(k)).toISOString() }));
  nube.estado = 'subiendo'; pintarNube();
  const { error } = await sb.from('registro').upsert(filas, { onConflict: 'alumno,clave' });
  if (error) { nube.estado = 'error'; nube.err = error.message; pintarNube(); clearTimeout(flushT); flushT = setTimeout(subir, 30000); return; }
  const enviados = new Map(filas.map(f => [f.clave, f.actualizado]));
  lsSet('_pend', JSON.stringify(pendientes().filter(k => enviados.get(k) !== new Date(tsDe(k)).toISOString())));
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
    await bajarSalud();
    await subir();
    nube.estado = pendientes().length ? 'subiendo' : 'ok';
  } catch (e) { nube.estado = 'error'; nube.err = e.message || String(e); clearTimeout(flushT); flushT = setTimeout(bajar, 30000); }
  nube.ocupado = false; pintarNube();
}
function borrarLocales() { // otra cuenta en este móvil: no mezclar datos
  try { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('fs:') && k !== 'fs:tab' && k !== 'fs:estilo') ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); } catch (e) {}
  Object.keys(mem).forEach(k => delete mem[k]);
}
async function bajarSalud() { // datos del Apple Watch que manda el Atajo (tabla salud_diaria)
  try { const { data, error } = await sb.from('salud_diaria').select('fecha,pasos,kcal_activas,min_pie,sueno_min,vfc,fc_reposo,recibido').eq('alumno', nube.user.id).gte('fecha', addDays(hoyISO(), -60));
    try { const r = await sb.from('token_salud').select('token').eq('alumno', nube.user.id).maybeSingle(); if (r.data && r.data.token) lsSet('_tokenSalud', r.data.token); } catch (e) {}
    if (error || !data) return; const S = {}; data.forEach(r => { S[r.fecha] = r; }); lsSet('_salud', JSON.stringify(S)); delete mem._salud;
    if (!st.sheet) render(); } catch (e) {}
}
const saludDe = (f) => { try { return (JSON.parse(lsGet('_salud') || '{}'))[f] || null; } catch (e) { return null; } };
const pasosDe = (dia, f) => dia.pasos || ((saludDe(f) || {}).pasos) || 0;
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
  const der = {};
  if (!d.tipo) d.tipo = der.tipo = base.tipo;
  if (!d.menu) d.menu = der.menu = base.menu;
  if (!d.diaEntreno) { // días de entreno de la semana numerados 1..4, con el tipo real de cada día
    const lun = lunes(fecha); let n = 0;
    for (let i = 0; i <= idx; i++) { const ti = i === idx ? d.tipo : ((load('dia:' + addDays(lun, i), null) || {}).tipo || sem[i].tipo); if (ti === 'entreno') n++; }
    d.diaEntreno = der.diaEntreno = Math.min(Math.max(n, 1), 4);
  }
  Object.defineProperty(d, '_der', { value: der, enumerable: false });
  return d;
};
const setDia = (fecha, fn) => { const d = getDia(fecha); fn(d); Object.keys(d._der).forEach(k => { if (d[k] === d._der[k]) delete d[k]; }); save('dia:' + fecha, d); };

/* ---------- cálculos ---------- */
const menuDe = (n) => DATOS.menus.find(m => m.n === n) || DATOS.menus[0];
const comidaPlan = (dia, mi) => { const c = menuDe(dia.menu).comidas[mi]; const ctx = dia.tipo === 'sin_entreno' ? c.sin : c.entreno; return { c, ctx }; };
/* ---------- alimentos y líneas de menú (fase 2) ---------- */
const ALI = Object.fromEntries((window.ALIMENTOS || []).map(a => [a.id, a]));
const GRUPOS = { prot: 'Proteína', lacteo: 'Lácteos', hc: 'Hidratos', fruta: 'Fruta', grasa: 'Grasas', verdura: 'Verdura' };
const CLAVE_GRUPO = { prot: 'p', lacteo: 'p', hc: 'c', fruta: 'c', grasa: 'gr', verdura: 'kcal' }; // qué se mantiene al cambiar
const macA = (id, g) => { const a = ALI[id]; if (!a) return { kcal: 0, p: 0, c: 0, g: 0 }; const f = g / 100; return { kcal: a.kcal * f, p: a.p * f, c: a.c * f, g: a.gr * f }; };
const sumar = (L) => L.reduce((t, m) => ({ kcal: t.kcal + m.kcal, p: t.p + m.p, c: t.c + m.c, g: t.g + m.g }), { kcal: 0, p: 0, c: 0, g: 0 });
const nombreCorto = (id) => { const a = ALI[id]; return a ? a.n.split(/[:(]/)[0].trim() : id; };
const casera = (id, g) => { const a = ALI[id]; if (!a || !a.rac || !a.rac.length) return ''; const [nom, rg] = a.rac[0]; const x = Math.round(g / rg * 4) / 4;
  const fr = { 0.25: '¼', 0.5: '½', 0.75: '¾' }; const ent = Math.floor(x), dec = x - ent; const txt = (ent || '') + (fr[dec] || '') || '¼';
  return '≈ ' + txt + ' ' + nom; };
const EXTRA_PLATO = { 'Lentejas, patata y pavo': [['lentejas', 200]], 'Guiso de pollo y garbanzos': [['garbanzos', 220]] };
function lineasJesus(menuN, mi, ctxK) { // líneas originales + parte del plato que Jesús no detalla
  const c = menuDe(menuN).comidas[mi]; const ctx = c[ctxK];
  const L = []; ctx.items.forEach(t => { const mp = (window.MAPA_MENU || {})[t]; if (mp) mp.forEach(([a, g]) => L.push({ a, g, t })); else L.push({ t, fijo: true }); });
  (EXTRA_PLATO[c.nombre] || []).forEach(([a, g]) => L.push({ a, g, t: nombreCorto(a) + ' (del plato)' }));
  const s = sumar(L.filter(l => l.a).map(l => macA(l.a, l.g)));
  const resto = { kcal: ctx.kcal - s.kcal, p: ctx.p - s.p, c: ctx.c - s.c, g: ctx.g - s.g };
  return { L, resto };
}
const claveMio = (dia, mi) => 'menuMio:' + dia.menu + ':' + MOMENTOS[mi][0] + ':' + (dia.tipo === 'sin_entreno' ? 'sin' : 'entreno');
function lineasComida(dia, mi) { // lo que toca comer: edición del día > tu versión guardada > Jesús
  const ctxK = dia.tipo === 'sin_entreno' ? 'sin' : 'entreno'; const base = lineasJesus(dia.menu, mi, ctxK);
  const reg = dia.comidas[MOMENTOS[mi][0]] || {}; const mio = load(claveMio(dia, mi), null);
  const L = reg.lineas || mio || base.L;
  return { L: L.map(l => Object.assign({}, l)), resto: base.resto, base: base.L, editado: !!reg.lineas, mio: !!mio };
}
const macrosLineas = (L, resto) => { const s = sumar(L.filter(l => l.a).map(l => macA(l.a, l.g))); return { kcal: s.kcal + resto.kcal, p: s.p + resto.p, c: s.c + resto.c, g: s.g + resto.g }; };
function equivalentes(id, g) { // misma proteína (o hidratos / grasa según el grupo)
  const a = ALI[id]; if (!a) return []; const k = CLAVE_GRUPO[a.g]; const obj = a[k] * g / 100;
  return (window.ALIMENTOS || []).filter(b => b.g === a.g && b.id !== id && b[k] > 0).map(b => { const gn = Math.max(5, Math.round(obj / b[k] * 100 / 5) * 5); return { a: b.id, g: gn, m: macA(b.id, gn) }; });
}
const macrosComida = (dia, mi) => {
  const key = MOMENTOS[mi][0]; const reg = dia.comidas[key] || {};
  if (dia.tipo === 'viaje') { const b = Object.assign({}, VIAJE[key]); if (reg.estado === 'fuera') { b.kcal = +reg.kcal || b.kcal; b.p = reg.p !== '' && reg.p != null ? +reg.p : b.p; } return b; }
  const { L, resto } = lineasComida(dia, mi);
  const m = macrosLineas(L, resto);
  if (reg.estado === 'fuera') { return { kcal: +reg.kcal || m.kcal, p: reg.p !== '' && reg.p != null ? +reg.p : m.p, c: m.c, g: m.g }; }
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
/* ---------- fuerza: historial, mejor marca y 1RM estimado ---------- */
const kgTxt = (x) => esc(String(x == null ? '' : x).replace('.', ','));
const numKg = (x) => parseFloat(String(x == null ? '' : x).replace(',', '.'));
const REPS_SIMPLE = /^\d+(\s*(-|a)\s*\d+)?(\s*(x|por)\s+\w+)?$/i;
function e1rm(e, i, peso, reps) { // Epley con reps + RIR prescrito; solo series simples (ni drops, ni clusters, ni rest-pause)
  const s = e.series[i] || e.series[e.series.length - 1]; if (!s || !REPS_SIMPLE.test(s.reps.trim()) || /→|\//.test(s.peso)) return 0;
  const w = numKg(peso), r = parseFloat(reps); if (!(w > 0 && r > 0)) return 0;
  const t = r + (parseFloat(s.rir) || 0); return t <= 12 ? w * (1 + t / 30) : 0;
}
function historial(key, e, hasta) { // sesiones anteriores a 'hasta' con series hechas de este ejercicio
  const H = []; for (let f = '2026-09-01'; f < hasta; f = addDays(f, 1)) { const d = load('dia:' + f, null); if (!d) continue;
    [d.sesion].concat(Object.values(d.sesiones || {})).forEach(se => { if (!se || !se.series || !se.series[key]) return;
      const sets = se.series[key].map((x, i) => x && x.done ? { peso: x.peso, reps: x.reps, i, rm: e1rm(e, i, x.peso, x.reps) } : null).filter(Boolean);
      if (sets.length) H.push({ fecha: f, sets, rm: Math.max(0, ...sets.map(x => x.rm)) }); }); }
  return H;
}
function refFuerza(key, e, hasta) {
  const H = historial(key, e, hasta); if (!H.length) return null;
  const todas = H.flatMap(h => h.sets.map(x => Object.assign({ fecha: h.fecha }, x)));
  const mejor = todas.slice().sort((x, y) => (y.rm - x.rm) || (numKg(y.peso) - numKg(x.peso)) || (parseFloat(y.reps) - parseFloat(x.reps)))[0];
  const rm = Math.max(0, ...H.map(h => h.rm));
  return { ult: H[H.length - 1], mejor, rm, H };
}
const ultimo = (key, antesDe) => { // última vez que se registró este ejercicio
  for (let i = 1; i <= 60; i++) {
    const f = addDays(antesDe, -i); const d = load('dia:' + f, null);
    const todas = d ? [d.sesion].concat(Object.values(d.sesiones || {})) : [];
    for (const se of todas) if (se && se.series && se.series[key]) {
      const s = se.series[key].filter(x => x && x.done);
      if (s.length) return { fecha: f, series: se.series[key] };
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
    ${ring(pasosDe(dia, st.fecha), OBJ.pasos, 'var(--r-pasos, var(--accent))', 'Pasos', pasosDe(dia, st.fecha) ? (pasosDe(dia, st.fecha) / 1000).toFixed(1).replace('.', ',') + 'k' : '—', 'pasos')}
    ${ring(tot.p, OBJ.p, 'var(--r-prot, ' + protColor(tot.p) + ')', 'Proteína / 170', fmt(tot.p) + ' g')}
    ${ring(hechos, hl.length, 'var(--r-hab, var(--good))', 'Hábitos', hechos + '/' + hl.length)}
  </div>
  ${ahora}
  <div class="agenda">${ag.map(x => `<button class="${x.done ? 'done' : x === now ? 'now' : ''}" data-act="agenda" data-k="${x.k}" ${x.mi != null ? `data-mi="${x.mi}"` : ''}>
    <span class="t">${x.h}</span><span class="txt grow">${esc(x.t)}</span>${x.done ? '<span class="tick">✓</span>' : x === now ? '<span class="tiny" style="color:var(--accent-ink);font-weight:700">ahora</span>' : ''}</button>`).join('')}</div>
  ${(() => { const w = saludDe(st.fecha); if (!w) return '<p class="tiny muted">Los datos del Watch llegan con el Atajo (Plan → Apple Watch). Mientras, toca el anillo de pasos para apuntarlos.</p>';
    const h = w.sueno_min ? Math.floor(w.sueno_min / 60) + ' h ' + String(w.sueno_min % 60).padStart(2, '0') : null;
    return `<div class="card"><span class="eyebrow">Apple Watch · ${new Date(w.recibido).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span><div class="row wrap" style="gap:6px">${[h && ['Sueño', h], w.kcal_activas && ['Activas', fmt(w.kcal_activas) + ' kcal'], w.min_pie && ['Ejercicio', w.min_pie + ' min'], w.fc_reposo && ['FC reposo', w.fc_reposo + ' ppm'], w.vfc && ['VFC', Math.round(w.vfc) + ' ms']].filter(Boolean).map(([k, v]) => `<span class="chip">${k} <b>${v}</b></span>`).join('')}</div></div>`; })()}`;
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
    const { c } = comidaPlan(dia, mi); const m = macrosComida(dia, mi); const lc = lineasComida(dia, mi);
    const mJ = macrosLineas(lc.base, lc.resto); const dP = Math.round(m.p - mJ.p);
    return `<div class="card ${!reg.estado ? '' : ''}">
      <div class="row"><img class="thumb" src="${c.img}" alt="${esc(c.nombre)}">${foto}<div class="grow"><span class="eyebrow">${n} · ${h}</span><h3>${esc(c.nombre)}</h3></div>${est}</div>
      <div class="list">${lc.L.map((l, i) => { if (!l.a) return `<div class="row"><span class="grow small">${esc(l.t)}</span></div>`;
        const b = lc.base.find(x => x.t === l.t && x.a === l.a); const igual = b && Math.abs(b.g - l.g) < 0.5;
        const txt = igual ? l.t : nombreCorto(l.a) + ' · ' + fmt(l.g) + ' g';
        return `<div class="row"><button class="linea grow" data-act="linea" data-mi="${mi}" data-i="${i}"><span class="small">${esc(txt)}</span>${igual ? '' : `<span class="tiny muted"> ${esc(casera(l.a, l.g))}</span>`}<span class="tiny muted"> · P ${fmt(macA(l.a, l.g).p)}</span></button>
        <span class="stepper"><button data-act="lin-paso" data-mi="${mi}" data-i="${i}" data-v="-1" aria-label="Menos ${esc(nombreCorto(l.a))}">−</button><button data-act="lin-paso" data-mi="${mi}" data-i="${i}" data-v="1" aria-label="Más ${esc(nombreCorto(l.a))}">+</button></span></div>`; }).join('')}
        ${lc.resto.kcal > 20 ? `<div class="row"><span class="grow tiny muted">+ verduras y resto del plato · ${fmt(lc.resto.kcal)} kcal</span></div>` : ''}</div>
      <div class="row wrap" style="gap:6px"><button class="chip" data-act="lin-anadir" data-mi="${mi}">+ Añadir alimento</button>${lc.editado ? `<button class="chip" data-act="lin-guardar" data-mi="${mi}">Guardar como mi menú</button>` : ''}${lc.editado || lc.mio ? `<button class="chip" data-act="lin-reset" data-mi="${mi}">Volver al de Jesús</button>` : ''}</div>
      <div class="row between small"><span class="muted">P <b style="color:var(--ink)">${fmt(m.p)}</b>${dP ? ` <span class="delta ${dP > 0 ? 'plus' : 'minus'}">${dP > 0 ? '+' : ''}${dP}</span>` : ''} · HC ${fmt(m.c)} · G ${fmt(m.g)} · ${fmt(m.kcal)} kcal</span><button class="btn" data-act="abrir-marcar" data-mi="${mi}">${reg.estado ? 'Editar' : 'Marcar'}</button></div>
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
  </div><span class="tiny muted">Cuenta lo que has marcado. Toca un alimento para cambiarlo: la cantidad se ajusta para mantener la proteína.</span></div>
  ${comidas}
  <div class="card"><span class="eyebrow">Añadir rápido</span><div class="row wrap">${EXTRAS.map(e => `<button class="chip" data-act="extra" data-v="${e.id}">${esc(e.txt)}</button>`).join('')}</div>
    ${(dia.extras || []).length ? `<span class="small muted">Añadido hoy: ${dia.extras.map(id => esc((EXTRAS.find(e => e.id === id) || {}).txt || '')).join(', ')} · <button class="chip" data-act="extra-quitar">Quitar último</button></span>` : ''}</div>
  <div class="tools"><button class="btn" data-act="compra">🛒 Compra</button><button class="btn" data-act="semana">Plan semana</button><button class="btn" data-act="platos">Montar platos</button><button class="btn" data-act="equiv">Equivalencias</button></div>`;
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
  const ses = sesDia(dia, n);
  const reg = (ses && ses.series[key]) || [];
  const ult = ultimo(key, st.fecha); const rf = refFuerza(key, e, st.fecha);
  const lastTxt = ult ? 'Última vez (' + fechaTxt(ult.fecha) + '): ' + ult.series.filter(s => s && s.done).map(s => (s.peso || '') + ' × ' + (s.reps || '')).join(' · ') : 'Primera vez con este ejercicio';
  const refHtml = rf ? `<div class="row wrap" style="gap:6px"><span class="chip">Mejor: ${kgTxt(rf.mejor.peso)} × ${esc(rf.mejor.reps)}</span>${rf.rm ? `<span class="chip ok">1RM ≈ ${num1(rf.rm)} kg</span>` : ''}</div>` : '';
  const all = dp.bloques.flatMap(x => x.ej.map(y => [x.id, y.n])); const pos = all.findIndex(([x, y]) => x === bid && y === en); const sig = all[pos + 1];
  return `<div class="grab"></div>
  <div class="row" style="align-items:flex-start"><div class="bigimg"><img src="${e.img}" alt="${esc(e.nombre)}">${e.musculo ? `<img class="mus" src="${e.musculo}" alt="Músculos trabajados">` : ''}</div>
    <div class="col grow" style="gap:6px"><h2>${esc(e.nombre)}</h2>
      <div class="row wrap" style="gap:6px">${e.metodo ? `<button class="chip method" data-act="metodo" data-v="${esc(e.metodo)}">${esc(e.metodo)} ⓘ</button>` : ''}${e.ajustes ? e.ajustes.split(' · ').map(a => `<span class="chip">${esc(a)}</span>`).join('') : ''}${e.video ? `<a class="chip link" href="${e.video}" target="_blank" rel="noopener">▶ Vídeo</a>` : `<a class="chip link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.nombre + ' técnica')}" target="_blank" rel="noopener">▶ Buscar vídeo</a>`}</div>
    </div></div>
  ${e.tecnica ? `<div class="banner">${esc(e.tecnica)}</div>` : ''}
  ${e.superserie ? `<span class="small" style="color:var(--accent-ink);font-weight:700">Superserie ${esc(e.superserie)}</span>` : ''}
  <span class="small muted">${e.aproximacion ? 'Antes: aproximación 6-3-1 <button class="chip" data-act="metodo" data-v="APROXIMACION">ⓘ</button> · ' : ''}${esc(lastTxt)}</span>
  ${refHtml}
  <div class="card sets"><div class="set tiny muted" style="border-top:0;padding-top:0"><span>#</span><span>Prescrito</span><span>Hecho · kg y reps</span><span></span></div>
  ${e.series.map((s, i) => { const r = reg[i] || {}; const prev = ult && ult.series[i] ? ult.series[i] : {};
    const pres = s.peso.replace(/\s*kg.*$/i, '').replace(/ →.*$/, ''); const peso = r.peso != null ? r.peso : (prev.peso || (/^\d/.test(pres) ? pres : ''));
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
  const ses = sesDia(dia, n); const r = (ses && ses.cardio && ses.cardio[id]) || {};
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
function hojaLinea(mi, i) {
  const dia = getDia(st.fecha); const lc = lineasComida(dia, mi); const l = lc.L[i]; if (!l || !l.a) return '';
  const a = ALI[l.a]; const m = macA(l.a, l.g); const eq = equivalentes(l.a, l.g);
  const clave = { p: 'proteína', c: 'hidratos', gr: 'grasa', kcal: 'calorías' }[CLAVE_GRUPO[a.g]];
  return `<div class="grab"></div><span class="eyebrow">${esc(MOMENTOS[mi][1])} · ${esc(GRUPOS[a.g] || '')}</span><h2>${esc(nombreCorto(l.a))}</h2>
  <div class="row"><div class="field grow"><label for="lg">Cantidad (g)</label><input id="lg" inputmode="decimal" value="${fmt(l.g).replace('.', '')}"></div>
    <div class="col" style="gap:2px;align-self:flex-end"><span class="small">${esc(casera(l.a, l.g))}</span><span class="tiny muted">P ${fmt(m.p)} · HC ${fmt(m.c)} · G ${fmt(m.g)} · ${fmt(m.kcal)} kcal</span></div></div>
  <div class="row"><button class="btn primary grow" data-act="lin-g" data-mi="${mi}" data-i="${i}">Guardar cantidad</button><button class="btn" data-act="lin-quitar" data-mi="${mi}" data-i="${i}">Quitar</button></div>
  ${eq.length ? `<div class="card"><span class="eyebrow">Cambiar por · misma ${clave}</span><div class="list">${eq.map(e => { const dp = Math.round(e.m.p - m.p), dk = Math.round(e.m.kcal - m.kcal);
    return `<button class="linea row" data-act="lin-cambiar" data-mi="${mi}" data-i="${i}" data-a="${e.a}" data-g="${e.g}"><span class="grow"><b class="small">${esc(nombreCorto(e.a))}</b> <span class="small">· ${fmt(e.g)} g</span><br><span class="tiny muted">${esc(casera(e.a, e.g))} · P ${fmt(e.m.p)} · ${fmt(e.m.kcal)} kcal</span></span>
      <span class="delta ${dk > 0 ? 'minus' : 'plus'}">${dk > 0 ? '+' : ''}${dk} kcal${dp ? '<br>' + (dp > 0 ? '+' : '') + dp + ' P' : ''}</span></button>`; }).join('')}</div></div>` : ''}
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
}
function hojaAnadir(mi) {
  const q = (st.sheet.q || '').toLowerCase();
  const lista = (window.ALIMENTOS || []).filter(a => !q || a.n.toLowerCase().includes(q));
  return `<div class="grab"></div><span class="eyebrow">${esc(MOMENTOS[mi][1])}</span><h2>Añadir alimento</h2>
  <div class="field"><label for="buscar">Buscar</label><input id="buscar" data-buscar="1" value="${esc(st.sheet.q || '')}" placeholder="pollo, arroz, yogur…" autocomplete="off"></div>
  ${Object.entries(GRUPOS).map(([g, t]) => { const L = lista.filter(a => a.g === g); return L.length ? `<div class="card"><span class="eyebrow">${t}</span><div class="list">${L.map(a => { const gr = a.rac[0][1]; const m = macA(a.id, gr);
    return `<button class="linea row" data-act="lin-add" data-mi="${mi}" data-a="${a.id}" data-g="${gr}"><span class="grow"><b class="small">${esc(nombreCorto(a.id))}</b><br><span class="tiny muted">1 ${esc(a.rac[0][0])} (${fmt(gr)} g) · P ${fmt(m.p)} · ${fmt(m.kcal)} kcal</span></span><span class="small">+</span></button>`; }).join('')}</div></div>` : ''; }).join('')}
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
}
/* ---------- lista de la compra ---------- */
const SECCIONES = ['Carne y pescado', 'Fruta y verdura', 'Huevos y lácteos', 'Panadería', 'Despensa'];
function diasCompra(modo) { const ini = modo === 'semana' ? lunes(st.fecha) : st.fecha; const L = []; for (let i = 0; i < 7; i++) L.push(addDays(ini, i)); return L; }
function listaCompra(dias) {
  const tot = {}; let verdura = 0, comidas = 0, viajes = 0;
  dias.forEach(f => { const d = getDia(f); if (d.tipo === 'viaje') { viajes++; return; }
    MOMENTOS.forEach((m, mi) => { const lc = lineasComida(d, mi); comidas++;
      lc.L.forEach(l => { if (l.a) tot[l.a] = (tot[l.a] || 0) + l.g; });
      if (mi > 0 && lc.resto.kcal > 30) verdura += 250; }); });   // almuerzo y cena llevan verdura que Jesús no detalla
  if (verdura) tot.verdura = (tot.verdura || 0) + verdura;
  const items = Object.entries(tot).map(([id, g]) => { const a = ALI[id]; const c = a.compra || { sec: 'Despensa', f: 1, u: 'g' }; const bruto = g * c.f; let txt;
    if (c.u === 'ud' || c.u === 'lata') { const n = Math.ceil(bruto / c.pz - 0.15); txt = n + (c.u === 'lata' ? (n === 1 ? ' lata' : ' latas') : n === 1 ? ' ud' : ' uds'); }
    else if (c.u === 'ml') txt = bruto >= 1000 ? num1(Math.ceil(bruto / 250) * 250 / 1000) + ' L' : Math.ceil(bruto / 50) * 50 + ' ml';
    else txt = bruto >= 1000 ? num1(Math.ceil(bruto / 100) * 100 / 1000) + ' kg' : Math.ceil(bruto / (bruto > 200 ? 50 : 10)) * (bruto > 200 ? 50 : 10) + ' g';
    const nota = id === 'verdura' ? 'a elegir: tomate, calabaza, cebolla, pimiento, calabacín, judía verde' : c.f < 0.5 ? 'en seco (' + fmt(g) + ' g cocido)' : c.f > 1.05 ? 'en crudo' : '';
    const n = id === 'verdura' ? 'Verdura variada' : /lentejas|garbanzos/.test(id) ? nombreCorto(id) + ' (bote)' : nombreCorto(id).replace(/ (cocid[oa]s?|cocinad[oa])( \/ al horno)?$/, '');
    return { id, sec: c.sec, n, txt, nota }; });
  return { items, comidas, viajes };
}
function hojaCompra() {
  const modo = st.sheet.modo || 'semana'; const dias = diasCompra(modo); const clave = 'compra:' + dias[0];
  const hecho = load(clave, {}); const { items, viajes } = listaCompra(dias);
  const quedan = items.filter(i => !hecho[i.id]).length;
  return `<div class="grab"></div><h1>Lista de la compra</h1>
  <div class="seg" role="group" aria-label="Periodo"><button data-act="compra-modo" data-v="semana" aria-pressed="${modo === 'semana'}">Semana ${fechaTxt(lunes(st.fecha)).split(' ').slice(1).join(' ')}</button><button data-act="compra-modo" data-v="7" aria-pressed="${modo === '7'}">Próximos 7 días</button></div>
  <span class="small muted">Según tu plan de la semana y tus cambios de menú. ${viajes ? viajes + ' día(s) de viaje no cuentan. ' : ''}Quedan ${quedan} de ${items.length}. Aceite, sal y especias, revisa la despensa.</span>
  ${SECCIONES.map(sec => { const L = items.filter(i => i.sec === sec).sort((a, b) => a.n.localeCompare(b.n)); if (!L.length) return '';
    return `<div class="card"><span class="eyebrow">${sec}</span><div class="list">${L.map(i => `<button class="linea row" data-act="compra-check" data-v="${i.id}" data-k="${clave}" aria-pressed="${!!hecho[i.id]}"><span style="width:24px;height:24px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:900;${hecho[i.id] ? 'background:var(--good);color:' + (estiloActual() === 'sport' ? '#000' : '#fff') : 'border:2px solid var(--line)'}">${hecho[i.id] ? '✓' : ''}</span>
      <span class="grow" style="${hecho[i.id] ? 'text-decoration:line-through;opacity:.5' : ''}"><b class="small">${esc(i.n)}</b>${i.nota ? `<br><span class="tiny muted">${esc(i.nota)}</span>` : ''}</span><b class="small">${esc(i.txt)}</b></button>`).join('')}</div></div>`; }).join('')}
  <div class="row"><button class="btn primary grow" data-act="compra-copiar">Copiar lista</button><button class="btn grow" data-act="cerrar">Cerrar</button></div>`;
}
function hojaEquiv() {
  const modo = st.sheet.modo || 'jesus'; const q = (st.sheet.q || '').toLowerCase();
  const OBJ_COMIDA = { p: 57, c: 41, gr: 29 };
  const tabla = () => Object.entries(GRUPOS).map(([g, t]) => { const L = (window.ALIMENTOS || []).filter(a => a.g === g && (!q || a.n.toLowerCase().includes(q))); if (!L.length) return '';
    const k = CLAVE_GRUPO[g]; const ref = OBJ_COMIDA[k];
    return `<div class="card"><span class="eyebrow">${t}${ref ? ' · ración ≈ ' + ref + ' g de ' + { p: 'proteína', c: 'hidratos', gr: 'grasa' }[k] : ''}</span><div class="list">${L.map(a => {
      const gr = ref ? Math.round(ref / a[k] * 100 / 5) * 5 : a.rac[0][1];
      return `<div class="row"><span class="grow"><b class="small">${esc(nombreCorto(a.id))}</b><br><span class="tiny muted">${esc(a.rac.map(([n, g]) => n + ' ' + fmt(g) + ' g').join(' · '))}</span><br><span class="tiny muted">100 g: P ${a.p} · HC ${a.c} · G ${a.gr} · ${a.kcal} kcal</span></span>
        <span style="text-align:right"><b class="small">${fmt(gr)} g</b><br><span class="tiny muted">${esc(casera(a.id, gr))}</span></span></div>`; }).join('')}</div></div>`; }).join('');
  return `<div class="grab"></div><h1>Equivalencias</h1>
  <div class="seg" role="group" aria-label="Tabla"><button data-act="eq-modo" data-v="jesus" aria-pressed="${modo === 'jesus'}">De Jesús</button><button data-act="eq-modo" data-v="todo" aria-pressed="${modo === 'todo'}">Todos los alimentos</button></div>
  ${modo === 'jesus' ? `<span class="small muted">Tablas de Jesús (referencia 1.950 kcal). * Complemento: no cubre la comida solo.</span>
  ${Object.entries(EQUIV).map(([t, rows]) => `<div class="card"><span class="eyebrow">${esc(t)}</span><div class="list">${rows.map(([a, b, c]) => `<div class="row"><span class="grow"><b class="small">${esc(a)}</b><br><span class="tiny muted">${esc(c)}</span></span><b class="small">${esc(b)}</b></div>`).join('')}</div></div>`).join('')}
  <div class="banner"><b>Jesús:</b> combina. 150 g de pollo + 100 g de lentejas ≈ 55 g de proteína.</div>`
  : `<span class="small muted">Gramos para una ración de comida principal y medidas caseras. Pesos en cocinado salvo avena, frutos secos y aceite.</span>
  <div class="field"><label for="buscar">Buscar</label><input id="buscar" data-buscar="1" value="${esc(st.sheet.q || '')}" placeholder="merluza, quinoa…" autocomplete="off"></div>${tabla()}`}
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
}

/* ---------- PROGRESO ---------- */
function medidas() {
  const base = [{ fecha: '2026-09-01', peso: 90.9, grasa: 22.1, cintura: 94, origen: 'Jesús' }, { fecha: '2026-10-01', peso: 92.1, cintura: 95, origen: 'Jesús' }];
  return base.concat(load('medidas', [])).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
}
const METRICAS = [['peso', 'Peso', 'kg'], ['cintura', 'Cintura', 'cm'], ['grasa', '% grasa', '%'], ['musculo', 'Masa muscular', 'kg'], ['cadera', 'Cadera', 'cm'], ['pecho', 'Pecho', 'cm'], ['brazo', 'Brazo', 'cm'], ['muslo', 'Muslo', 'cm'], ['cuello', 'Cuello', 'cm']];
const num1 = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
function grafica(M, campo, unidad) { // línea simple de una medida entre 1 sep y 3 ene
  const P = M.filter(m => m[campo] != null && m[campo] !== ''); if (!P.length) return '<span class="small muted">Sin datos todavía.</span>';
  const vals = P.map(m => +m[campo]); let lo = Math.min(...vals), hi = Math.max(...vals);
  if (campo === 'peso') { lo = Math.min(lo, 84); hi = Math.max(hi, 86); }
  const pad = Math.max(1, (hi - lo) * 0.15); lo = Math.floor(lo - pad); hi = Math.ceil(hi + pad);
  const x0 = parse('2026-09-01'), x1 = parse('2027-01-03'); const W = 330;
  const X = (f) => 30 + (parse(f) - x0) / (x1 - x0) * (W - 44); const Y = (v) => 10 + (hi - v) * 130 / (hi - lo);
  const pts = P.map(m => [X(m.fecha), Y(+m[campo])]); const ticks = [hi, (hi + lo) / 2, lo];
  return `<svg viewBox="0 0 ${W} 160" role="img" aria-label="Evolución de ${esc(campo)}" style="width:100%;height:auto">
    ${ticks.map(v => `<line x1="30" x2="${W - 14}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--soft)"/><text x="24" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${num1(v)}</text>`).join('')}
    ${campo === 'peso' ? `<rect x="${X(INICIO)}" y="${Y(86)}" width="${W - 14 - X(INICIO)}" height="${Y(84) - Y(86)}" fill="var(--good-soft)"/><text x="${W - 16}" y="${Y(86) - 4}" text-anchor="end" font-size="10" font-weight="700" fill="var(--good)">objetivo 84–86</text>` : ''}
    <line x1="${X(INICIO)}" x2="${X(INICIO)}" y1="10" y2="140" stroke="var(--accent)" stroke-dasharray="3 3"/>
    ${pts.length > 1 ? `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>` : ''}
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--ink)"/>`).join('')}
    <text x="30" y="156" font-size="10" fill="var(--muted)">1 sep</text><text x="${X(INICIO) + 3}" y="156" font-size="10" fill="var(--accent-ink)">inicio</text><text x="${W - 14}" y="156" text-anchor="end" font-size="10" fill="var(--muted)">3 ene</text></svg>`;
}
function vistaProgreso() {
  const modo = st.progModo || 'cuerpo';
  const cab = `<div class="row between"><div class="col" style="gap:2px"><span class="small muted">Semana ${Math.max(1, Math.min(semanaN(st.fecha), SEMANAS))} de 12 · fin 3 ene</span><h1>Progreso</h1></div>${modo === 'cuerpo' ? '<button class="btn primary" data-act="pesarme">+ Medirme</button>' : ''}</div>
  <div class="seg" role="group" aria-label="Sección"><button data-act="prog-modo" data-v="cuerpo" aria-pressed="${modo === 'cuerpo'}">Cuerpo</button><button data-act="prog-modo" data-v="fuerza" aria-pressed="${modo === 'fuerza'}">Fuerza</button></div>`;
  if (modo === 'fuerza') return cab + vistaFuerza();
  const M = medidas(); const met = st.metrica || 'peso';
  const disp = METRICAS.filter(([k]) => M.some(m => m[k] != null && m[k] !== ''));
  const [mk, mn, mu] = METRICAS.find(x => x[0] === met) || METRICAS[0];
  const P = M.filter(m => m[mk] != null && m[mk] !== ''); const ult = P[P.length - 1], pri = P[0];
  const dif = ult && pri ? +ult[mk] - +pri[mk] : 0; const malo = mk === 'musculo' ? dif < 0 : dif > 0;
  const fotos = load('fotosProg', []);
  return `${cab}
  <div class="row wrap" style="gap:6px">${disp.map(([k, n]) => `<button class="chip" data-act="metrica" data-v="${k}" aria-pressed="${k === mk}" style="${k === mk ? 'background:var(--accent);color:' + (estiloActual() === 'sport' ? '#000' : '#fff') + ';font-weight:700' : ''}">${n}</button>`).join('')}</div>
  <div class="card"><div class="row between"><b>${mn}</b>${ult ? `<span><span class="num" style="font-size:26px">${num1(ult[mk])} ${mu}</span> <span class="small" style="color:${dif ? (malo ? 'var(--bad)' : 'var(--good)') : 'var(--muted)'}">${dif > 0 ? '+' : ''}${num1(dif)} desde ${fechaTxt(pri.fecha).split(' ').slice(1).join(' ')}</span></span>` : ''}</div>
  ${grafica(M, mk, mu)}</div>
  <div class="card list">${M.slice().reverse().map(m => `<div class="row"><span class="grow small">${fechaTxt(m.fecha)} <span class="muted tiny">· ${esc(m.origen || 'tú')}</span></span><b class="small" style="text-align:right">${METRICAS.filter(([k]) => m[k] != null && m[k] !== '').map(([k, n, u]) => num1(m[k]) + ' ' + u).join(' · ')}</b></div>`).join('')}</div>
  <div class="card"><div class="row between"><span class="eyebrow">Fotos de progreso · 1 vez al mes</span><button class="chip" data-act="fotos-prog">${fotos.length ? 'Ver y comparar' : 'Empezar'}</button></div>
    ${fotos.length ? `<div class="row" style="gap:6px">${['frente', 'perfil', 'espalda'].map(p => { const f = fotos[fotos.length - 1][p]; return f ? `<img src="${f.mini}" alt="${p}" style="width:31%;aspect-ratio:3/4;object-fit:cover;border-radius:10px">` : ''; }).join('')}</div><span class="tiny muted">Últimas: ${fechaTxt(fotos[fotos.length - 1].fecha)}</span>` : '<span class="small muted">Frente, perfil y espalda. Misma luz, misma hora y misma ropa cada mes.</span>'}</div>`;
}
function vistaFuerza() {
  const filas = []; PLAN.forEach(d => d.bloques.forEach(b => b.ej.forEach(e => { const r = refFuerza(ejKey(d.n, b.id, e.n), e, addDays(hoyISO(), 1)); if (r) filas.push({ d, e, r }); })));
  if (!filas.length) return '<div class="card"><span class="small">Cuando registres series, aquí verás tu mejor marca y el 1RM estimado de cada ejercicio, y cómo evolucionan semana a semana.</span></div>';
  const spark = (H) => { const P = H.filter(h => h.rm); if (P.length < 2) return ''; const lo = Math.min(...P.map(h => h.rm)), hi = Math.max(...P.map(h => h.rm)) || 1;
    return `<svg viewBox="0 0 100 28" style="width:90px;height:26px" aria-hidden="true"><polyline points="${P.map((h, i) => (i / (P.length - 1) * 96 + 2) + ',' + (hi === lo ? 14 : 24 - (h.rm - lo) / (hi - lo) * 20)).join(' ')}" fill="none" stroke="var(--r-hab, var(--accent))" stroke-width="2.5"/></svg>`; };
  const conRm = filas.filter(f => f.r.rm), sinRm = filas.filter(f => !f.r.rm);
  return `${conRm.length ? `<div class="card"><span class="eyebrow">1RM estimado</span><div class="list">${conRm.map(({ d, e, r }) => { const P = r.H.filter(h => h.rm); const dif = P.length > 1 ? P[P.length - 1].rm - P[0].rm : 0;
    return `<div class="row"><span class="grow"><b class="small">${esc(e.nombre)}</b><br><span class="tiny muted">Día ${d.n} · mejor ${kgTxt(r.mejor.peso)} × ${esc(r.mejor.reps)}</span></span>${spark(r.H)}<span style="text-align:right"><b class="num" style="font-size:20px">${num1(r.rm)} kg</b>${dif ? `<br><span class="delta ${dif > 0 ? 'plus' : 'minus'}">${dif > 0 ? '+' : ''}${num1(dif)}</span>` : ''}</span></div>`; }).join('')}</div>
    <span class="tiny muted">Estimado con la fórmula de Epley a partir de tus series (reps + RIR prescrito). Solo en series simples: en drops, clusters, rest-pause o forzadas no tiene sentido.</span></div>` : ''}
  ${sinRm.length ? `<div class="card"><span class="eyebrow">Mejores marcas</span><div class="list">${sinRm.map(({ d, e, r }) => `<div class="row"><span class="grow small"><b>${esc(e.nombre)}</b> <span class="tiny muted">· Día ${d.n}</span></span><b class="small">${kgTxt(r.mejor.peso)} × ${esc(r.mejor.reps)}</b></div>`).join('')}</div></div>` : ''}`;
}
function hojaPesarme() {
  const M = medidas(); const ultDe = (k) => { for (let i = M.length - 1; i >= 0; i--) if (M[i][k] != null && M[i][k] !== '') return M[i][k]; return ''; };
  const campo = (k, n, u) => `<div class="field"><label for="m-${k}">${n} (${u})</label><input id="m-${k}" data-med="${k}" inputmode="decimal" placeholder="${ultDe(k) !== '' ? num1(ultDe(k)) : ''}"></div>`;
  return `<div class="grab"></div><h2>Medirme</h2><span class="small muted">Lunes en ayunas, después del baño. Perímetros con cinta, relajado, siempre en el mismo punto. En gris, tu última medida.</span>
  <div class="row">${campo('peso', 'Peso', 'kg')}${campo('cintura', 'Cintura', 'cm')}</div>
  <div class="card"><span class="eyebrow">Opcional</span>
    <div class="row">${campo('grasa', '% grasa', '%')}${campo('musculo', 'Masa muscular', 'kg')}</div>
    <div class="row">${campo('cadera', 'Cadera', 'cm')}${campo('pecho', 'Pecho', 'cm')}</div>
    <div class="row">${campo('brazo', 'Brazo', 'cm')}${campo('muslo', 'Muslo', 'cm')}</div>
    <div class="row">${campo('cuello', 'Cuello', 'cm')}<span class="grow"></span></div></div>
  <button class="btn primary block" data-act="guardar-peso">Guardar</button>`;
}
function hojaFotosProg() {
  const F = load('fotosProg', []); const hoy = F.find(f => f.fecha === st.fecha) || { fecha: st.fecha };
  const a = st.sheet.a != null ? st.sheet.a : 0, b = st.sheet.b != null ? st.sheet.b : F.length - 1;
  const poses = ['frente', 'perfil', 'espalda'];
  return `<div class="grab"></div><h2>Fotos de progreso</h2>
  <div class="card"><span class="eyebrow">${fechaTxt(st.fecha)}</span><div class="row" style="gap:6px">${poses.map(p => `<button class="linea" data-act="foto-prog" data-v="${p}" style="width:31%;aspect-ratio:3/4;border-radius:10px;background:var(--soft);overflow:hidden;display:flex;align-items:center;justify-content:center">${hoy[p] ? `<img src="${hoy[p].mini}" alt="${p}" style="width:100%;height:100%;object-fit:cover">` : `<span class="small">+ ${p}</span>`}</button>`).join('')}</div>
    <span class="tiny muted">Toca cada hueco para hacer o elegir la foto. La foto original se guarda en tu nube privada.</span></div>
  ${F.length > 1 ? `<div class="card"><span class="eyebrow">Comparar</span>
    <div class="row"><div class="field grow"><label for="fa">Antes</label><select id="fa" data-comp="a">${F.map((f, i) => `<option value="${i}" ${i === a ? 'selected' : ''}>${fechaTxt(f.fecha)}</option>`).join('')}</select></div>
    <div class="field grow"><label for="fb">Después</label><select id="fb" data-comp="b">${F.map((f, i) => `<option value="${i}" ${i === b ? 'selected' : ''}>${fechaTxt(f.fecha)}</option>`).join('')}</select></div></div>
    ${poses.map(p => (F[a][p] || F[b][p]) ? `<div class="row" style="gap:6px">${[F[a], F[b]].map(f => f[p] ? `<img src="${f[p].mini}" alt="${p} ${f.fecha}" style="width:50%;aspect-ratio:3/4;object-fit:cover;border-radius:10px">` : '<span class="grow"></span>').join('')}</div>` : '').join('')}</div>` : ''}
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
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
  <div class="card"><span class="eyebrow">Apple Watch · datos automáticos</span>${relojHtml()}</div>
  <div class="card" id="cuenta"><span class="eyebrow">Tu cuenta y tus datos</span><span class="small" id="nube-estado">${textoNube()}</span>
    ${cuentaHtml()}
    <span class="tiny muted">Copia manual (por si acaso):</span>
    <div class="row wrap"><button class="btn grow" data-act="exportar">Copiar copia de seguridad</button><button class="btn grow" data-act="importar">Restaurar copia</button></div></div>`;
}
function relojHtml() {
  if (!sb || !nube.user) return '<span class="small muted">Primero entra en tu cuenta (más abajo).</span>';
  const tk = lsGet('_tokenSalud'); const w = saludDe(hoyISO()) || saludDe(addDays(hoyISO(), -1));
  return `<span class="small">${w ? '✓ Último envío: ' + new Date(w.recibido).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : 'Un Atajo del iPhone manda cada noche pasos, calorías, ejercicio, sueño, FC en reposo y VFC.'}</span>
    <div class="row wrap"><button class="btn grow" data-act="reloj-guia">Cómo crear el Atajo</button>${tk ? '' : '<button class="btn primary grow" data-act="reloj-token">Generar mi clave</button>'}</div>`;
}
const SB_RPC = SB_URL + '/rest/v1/rpc/registrar_salud';
function hojaReloj() {
  const tk = lsGet('_tokenSalud') || '— genera primero tu clave —';
  const bloque = (titulo, txt) => `<div class="card"><div class="row between"><span class="eyebrow">${titulo}</span><button class="chip" data-act="copiar" data-v="${esc(txt)}">Copiar</button></div><code class="small" style="word-break:break-all">${esc(txt)}</code></div>`;
  const paso = (n, t) => `<div class="row" style="align-items:flex-start"><b class="num" style="font-size:22px;width:26px">${n}</b><span class="small grow">${t}</span></div>`;
  return `<div class="grab"></div><h2>Atajo «FRANX Salud»</h2><span class="small muted">Se crea una vez en la app Atajos del iPhone (10 minutos). Después se ejecuta solo cada noche.</span>
  ${bloque('Tu clave (privada, no la compartas)', tk)}
  ${bloque('URL', SB_RPC)}
  ${bloque('Cabecera apikey', SB_KEY)}
  <div class="card col">
  ${paso(1, 'Abre <b>Atajos</b> → pestaña Atajos → <b>+</b>. Ponle de nombre <b>FRANX Salud</b>.')}
  ${paso(2, 'Añade <b>Buscar muestras de salud</b>: Tipo <b>Pasos</b>, filtro <b>Fecha de inicio · es hoy</b>. Luego <b>Calcular estadísticas</b> → <b>Suma</b>. Toca el resultado y renómbralo <b>Pasos</b>.')}
  ${paso(3, 'Repite el paso 2 con <b>Energía activa</b> (Suma → renombrar <b>Activas</b>) y con <b>Minutos de ejercicio</b> (Suma → <b>Ejercicio</b>).')}
  ${paso(4, 'Repite con <b>Frecuencia cardiaca en reposo</b> y con <b>Variabilidad de la frecuencia cardiaca</b>, pero eligiendo <b>Media</b> (→ <b>FCreposo</b> y <b>VFC</b>).')}
  ${paso(5, 'Sueño (opcional): <b>Buscar muestras de salud</b> · Tipo <b>Análisis del sueño</b> · Valor <b>no es En cama</b> · Fecha de inicio <b>en las últimas 18 horas</b> → <b>Calcular estadísticas</b> · <b>Suma</b> → <b>Convertir medida</b> a <b>horas</b> → renombrar <b>Sueño</b>. Si te da guerra, sáltalo.')}
  ${paso(6, 'Añade <b>Fecha actual</b> → <b>Formatear fecha</b> · Formato <b>Personalizado</b> · <code>yyyy-MM-dd</code> → renombrar <b>Hoy</b>.')}
  ${paso(7, 'Añade <b>Diccionario</b> con: <code>pasos</code>=Pasos, <code>kcal_activas</code>=Activas, <code>min_ejercicio</code>=Ejercicio, <code>fc_reposo</code>=FCreposo, <code>vfc</code>=VFC, <code>sueno_h</code>=Sueño (todos de tipo Número).')}
  ${paso(8, 'Añade <b>Obtener contenido de URL</b>: URL de arriba · Método <b>POST</b> · Cabeceras: <code>apikey</code> = la de arriba y <code>Content-Type</code> = <code>application/json</code> · Cuerpo <b>JSON</b> con <code>p_token</code> (Texto = tu clave), <code>p_fecha</code> (Texto = Hoy) y <code>p_datos</code> (Diccionario = el del paso 7).')}
  ${paso(9, 'Pruébalo con ▶. Debe responder <code>"ok …"</code>. Abre FRANX: en Hoy verás los datos del Watch.')}
  ${paso(10, 'Pestaña <b>Automatización</b> → <b>+</b> → <b>Hora del día</b> · <b>23:00</b> · Diariamente · <b>Ejecutar inmediatamente</b> → elige FRANX Salud. Puedes lanzarlo también a mano cuando quieras: no duplica, actualiza el día.')}
  </div>
  <button class="btn block" data-act="cerrar">Cerrar</button>`;
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
  else if (s.t === 'compra') html = hojaCompra();
  else if (s.t === 'reloj') html = hojaReloj();
  else if (s.t === 'linea') html = hojaLinea(s.mi, s.i);
  else if (s.t === 'anadir') html = hojaAnadir(s.mi);
  else if (s.t === 'pesarme') html = hojaPesarme();
  else if (s.t === 'fotosprog') html = hojaFotosProg();
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
let fotoMi = null; let fotoModo = null;
function subirFoto(fecha, k, blob) {
  if (!sb || !nube.user) { toast('Foto guardada solo en el móvil (entra en tu cuenta para subirla)'); return; }
  const ruta = nube.user.id + '/' + fecha + '-' + k + '-' + Date.now() + '.jpg';
  sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg' }).then(({ error }) => {
    if (error) { toast('No se pudo subir la foto: ' + error.message); return; }
    setDia(fecha, d => { const c = d.comidas[k] = d.comidas[k] || {}; c.fotoNube = ruta; }); });
}
function pedirFoto(mi) { if (mi != null) fotoModo = null; fotoMi = mi; const f = $('#foto'); f.value = ''; f.click(); }
$('#foto').addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0]; if (!file) return;
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => {
    const lienzo = (max) => { const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c; };
    if (fotoModo) { const pose = fotoModo; fotoModo = null; const mini = lienzo(360).toDataURL('image/jpeg', 0.7);
      lienzo(1600).toBlob(blob => { URL.revokeObjectURL(url); const F = load('fotosProg', []); let f = F.find(x => x.fecha === st.fecha); if (!f) { f = { fecha: st.fecha }; F.push(f); F.sort((x, y) => x.fecha < y.fecha ? -1 : 1); }
        f[pose] = { mini }; save('fotosProg', F); renderSheet();
        if (sb && nube.user) { const ruta = nube.user.id + '/progreso/' + st.fecha + '-' + pose + '-' + Date.now() + '.jpg';
          sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg' }).then(({ error }) => { if (error) { toast('No se pudo subir la foto: ' + error.message); return; }
            const F2 = load('fotosProg', []); const g = F2.find(x => x.fecha === f.fecha); if (g && g[pose]) { g[pose].nube = ruta; save('fotosProg', F2); } }); }
        else toast('Foto guardada solo en el móvil (entra en tu cuenta para subirla)'); }, 'image/jpeg', 0.85);
      return; }
    const mini = lienzo(200).toDataURL('image/jpeg', 0.6);   // miniatura ligera para el móvil (~8 KB)
    lienzo(1280).toBlob(blob => { URL.revokeObjectURL(url);   // la foto buena va a la nube para Jesús
      if (st.sheet && st.sheet.t === 'marcar') { st.sheet.foto = mini; st.sheet.fotoBlob = blob; renderSheet(); }
      else { abrir({ t: 'marcar', mi: fotoMi, foto: mini, fotoBlob: blob }); } }, 'image/jpeg', 0.8);
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
function asegurarSesion(n) { setDia(st.fecha, d => { // cada día de entreno conserva su sesión; cambiar de día no borra nada
  if (d.sesion && d.sesion.dia === n) return;
  d.sesiones = d.sesiones || {};
  if (d.sesion) d.sesiones[d.sesion.dia] = d.sesion;
  d.sesion = d.sesiones[n] || { dia: n, inicio: new Date().toISOString(), series: {}, cardio: {}, notas: {} };
  delete d.sesiones[n]; }); }
function sesDia(dia, n) { return dia.sesion && dia.sesion.dia === n ? dia.sesion : (dia.sesiones && dia.sesiones[n]) || null; }

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act],[data-tab]'); if (!t) return;
  if (t.dataset.tab) { guardarSesionInputs(); st.tab = t.dataset.tab; st.sheet = null; try { localStorage.setItem('fs:tab', st.tab); } catch (e) {} render(); window.scrollTo(0, 0); return; }
  const a = t.dataset.act; const v = t.dataset.v;
  if (a === 'fondo') { if (ev.target === t) { guardarSesionInputs(); cerrar(); } return; }
  switch (a) {
    case 'dia-prev': st.fecha = addDays(st.fecha, -1); st.entDia = null; break;
    case 'dia-next': st.fecha = addDays(st.fecha, 1); st.entDia = null; break;
    case 'tipo-dia': setDia(st.fecha, d => { d.tipo = v; if (!(d.sesion && d.sesion.inicio)) delete d.diaEntreno; }); break;
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
    case 'abrir-marcar': { const mi = +t.dataset.mi; const reg = getDia(st.fecha).comidas[MOMENTOS[mi][0]] || {}; abrir({ t: 'marcar', mi, estado: reg.estado || (t.textContent.includes('Fuera') ? 'fuera' : getDia(st.fecha).tipo === 'viaje' ? 'seguida' : 'cambiada') }); return; }
    case 'foto': pedirFoto(+t.dataset.mi); return;
    case 'eq-modo': st.sheet.modo = v; renderSheet(); return;
    case 'compra': abrir({ t: 'compra' }); return;
    case 'reloj-guia': abrir({ t: 'reloj' }); return;
    case 'reloj-token': { const b = new Uint8Array(24); crypto.getRandomValues(b); const tk = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
      t.disabled = true; sb.from('token_salud').upsert({ alumno: nube.user.id, token: tk }, { onConflict: 'alumno' }).then(({ error }) => { t.disabled = false;
        if (error) { toast('No se pudo crear la clave: ' + error.message); return; } lsSet('_tokenSalud', tk); toast('Clave creada'); render(); abrir({ t: 'reloj' }); }); return; }
    case 'copiar': (navigator.clipboard ? navigator.clipboard.writeText(t.dataset.v) : Promise.reject()).then(() => toast('Copiado'), () => toast('No se pudo copiar')); return;
    case 'compra-modo': st.sheet.modo = v; renderSheet(); return;
    case 'compra-check': { const k = t.dataset.k; const h = Object.assign({}, load(k, {})); h[v] = !h[v]; save(k, h); renderSheet(); return; }
    case 'compra-copiar': { const dias = diasCompra(st.sheet.modo || 'semana'); const h = load('compra:' + dias[0], {}); const { items } = listaCompra(dias);
      const txt = 'Compra ' + fechaTxt(dias[0]) + '\n' + SECCIONES.map(sec => { const L = items.filter(i => i.sec === sec && !h[i.id]); return L.length ? '\n' + sec.toUpperCase() + '\n' + L.map(i => '• ' + i.n + ' — ' + i.txt).join('\n') : ''; }).join('');
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Lista copiada: pégala en Notas o WhatsApp'), () => toast('No se pudo copiar'));
      return; }
    case 'linea': abrir({ t: 'linea', mi: +t.dataset.mi, i: +t.dataset.i }); return;
    case 'lin-anadir': abrir({ t: 'anadir', mi: +t.dataset.mi, q: '' }); return;
    case 'lin-paso': case 'lin-g': case 'lin-quitar': case 'lin-cambiar': case 'lin-add': {
      const mi = +t.dataset.mi, i = +t.dataset.i, k = MOMENTOS[mi][0];
      setDia(st.fecha, d => { const L = lineasComida(d, mi).L; const l = L[i]; const c = d.comidas[k] = d.comidas[k] || {};
        if (a === 'lin-paso' && l && l.a) { const p = ALI[l.a].paso[1]; l.g = Math.max(0, Math.round((l.g + p * (+v)) * 10) / 10); if (!l.g) L.splice(i, 1); }
        if (a === 'lin-g' && l) { const g = parseFloat(($('#lg').value || '').replace(',', '.')); if (g >= 0) l.g = g; if (!l.g) L.splice(i, 1); }
        if (a === 'lin-quitar') L.splice(i, 1);
        if (a === 'lin-cambiar' && l) { l.a = t.dataset.a; l.g = +t.dataset.g; l.t = nombreCorto(l.a); }
        if (a === 'lin-add') L.push({ a: t.dataset.a, g: +t.dataset.g, t: nombreCorto(t.dataset.a) });
        c.lineas = L; });
      if (a === 'lin-paso') break;
      if (a === 'lin-add') toast(nombreCorto(t.dataset.a) + ' añadido');
      cerrar(); return; }
    case 'lin-guardar': { const mi = +t.dataset.mi; const d = getDia(st.fecha); save(claveMio(d, mi), lineasComida(d, mi).L); toast('Guardado como tu menú ' + d.menu + ' (' + MOMENTOS[mi][1].toLowerCase() + ')'); break; }
    case 'lin-reset': { const mi = +t.dataset.mi; const k = MOMENTOS[mi][0]; const d0 = getDia(st.fecha);
      if ((d0.comidas[k] || {}).lineas) { setDia(st.fecha, d => { delete d.comidas[k].lineas; }); toast(load(claveMio(d0, mi), null) ? 'Vuelves a tu menú guardado' : 'Menú de Jesús restaurado'); }
      else { save(claveMio(d0, mi), null); toast('Menú de Jesús restaurado'); } break; }
    case 'estado': st.sheet.estado = v; renderSheet(); return;
    case 'adj': { const mi = +t.dataset.mi, i = +t.dataset.i, k = MOMENTOS[mi][0];
      setDia(st.fecha, d => { const c = d.comidas[k] = d.comidas[k] || {}; c.adj = c.adj || {}; c.adj[i] = Math.max(-6, Math.min(6, (c.adj[i] || 0) + (+v))); });
      if (st.sheet) { renderSheet(); render(); } else render(); return; }
    case 'guardar-comida': { const mi = +t.dataset.mi; const k = MOMENTOS[mi][0]; const s = st.sheet;
      if (s.fotoBlob) subirFoto(st.fecha, k, s.fotoBlob);
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
    case 'ses-fin': setDia(st.fecha, d => { if (d.sesion) d.sesion.fin = new Date().toISOString(); }); st.timer = null; clearInterval(tick); toast('Sesión terminada'); break;
    case 'ej': { guardarSesionInputs(); abrir({ t: 'ej', b: t.dataset.b, e: +t.dataset.e }); const sh = $('.sheet'); if (sh) sh.scrollTop = 0; return; }
    case 'serie': {
      const n = st.entDia || getDia(st.fecha).diaEntreno; asegurarSesion(n); guardarSesionInputs();
      const key = t.dataset.key, i = +t.dataset.i;
      let ahora = false;
      setDia(st.fecha, d => { const arr = d.sesion.series[key] = d.sesion.series[key] || []; const s = arr[i] = arr[i] || {};
        s.peso = ($('#p-' + CSS.escape(key) + '-' + i) || {}).value || s.peso || ''; s.reps = ($('#r-' + CSS.escape(key) + '-' + i) || {}).value || s.reps || '';
        s.done = !s.done; ahora = s.done; });
      const sd = t.dataset.desc ? segs(t.dataset.desc) : 90; if (ahora && sd) iniciarTimer(sd, 'serie ' + (i + 1) + ' hecha');
      renderSheet(); return; }
    case 't+30': if (st.timer) st.timer.end += 30000; renderTimer(); return;
    case 't-skip': st.timer = null; clearInterval(tick); renderTimer(); return;
    case 'cardio': abrir({ t: 'cardio', id: v }); return;
    case 'cardio-sens': { const id = st.sheet.id; asegurarSesion(st.entDia || getDia(st.fecha).diaEntreno); setDia(st.fecha, d => { d.sesion.cardio[id] = Object.assign(d.sesion.cardio[id] || {}, { sensacion: +v }); }); renderSheet(); return; }
    case 'cardio-ok': { const id = v; asegurarSesion(st.entDia || getDia(st.fecha).diaEntreno); setDia(st.fecha, d => { const r = d.sesion.cardio[id] = d.sesion.cardio[id] || {};
        r.maquina = $('#maq').value; r.vatios = $('#vat').value; r.distancia = $('#dist').value; r.done = true; }); toast('Cardio guardado'); cerrar(); return; }
    case 'metodo': abrir({ t: 'metodo', k: v }); return;
    case 'ver-mas': st.verMas = true; renderSheet(); return;
    case 'pesarme': abrir({ t: 'pesarme' }); return;
    case 'guardar-peso': { const m = { fecha: st.fecha, origen: 'tú' }; let n = 0;
      document.querySelectorAll('[data-med]').forEach(inp => { const x = parseFloat((inp.value || '').replace(',', '.')); if (x > 0) { m[inp.dataset.med] = x; n++; } });
      if (!n) { toast('Escribe al menos una medida'); return; }
      const L = load('medidas', []); const prev = L.find(x => x.fecha === st.fecha);
      const L2 = L.filter(x => x.fecha !== st.fecha); L2.push(Object.assign({}, prev || {}, m)); save('medidas', L2); toast('Medidas guardadas'); cerrar(); return; }
    case 'prog-modo': st.progModo = v; break;
    case 'metrica': st.metrica = v; break;
    case 'fotos-prog': abrir({ t: 'fotosprog' }); return;
    case 'foto-prog': fotoModo = v; pedirFoto(null); return;
    case 'exportar': { const dump = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('fs:')) dump[k] = localStorage.getItem(k); } } catch (e) {}
      const txt = JSON.stringify(dump);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Copia copiada al portapapeles'), () => { abrir({ t: 'importar' }); setTimeout(() => { const ta = $('#imp'); if (ta) { ta.value = txt; ta.select(); } toast('Copia el texto seleccionado'); }, 50); });
      return; }
    case 'importar': abrir({ t: 'importar' }); return;
    case 'importar-ok': try { const o = JSON.parse($('#imp').value); if (!o || typeof o !== 'object') throw 0; Object.keys(mem).forEach(k => delete mem[k]); Object.entries(o).forEach(([k, val]) => { localStorage.setItem(k, val); const kk = k.slice(3); if (k.startsWith('fs:') && sincroniza(kk)) { marcarTs(kk, Date.now()); pendiente(kk); } }); toast('Copia restaurada'); cerrar(); } catch (e) { toast('El texto no es una copia válida'); } return;
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
document.addEventListener('input', (ev) => {
  const t = ev.target; if (t.dataset.buscar && st.sheet) { st.sheet.q = t.value; const pos = t.selectionStart; renderSheet(); const n = $('#buscar'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.dataset.comp && st.sheet) { st.sheet[t.dataset.comp] = +t.value; renderSheet(); return; }
  if (t.dataset.sem) { const lun = lunes(st.fecha); const sem = getSemana(st.fecha).slice(); const i = +t.dataset.i;
    sem[i] = Object.assign({}, sem[i], { [t.dataset.sem]: t.dataset.sem === 'menu' ? +t.value : t.value }); save('sem:' + lun, sem);
    const f = addDays(lun, i); const d = load('dia:' + f, null); if (d) { delete d[t.dataset.sem]; delete d.diaEntreno; save('dia:' + f, d); }
    renderSheet(); render(); }
  if (t.dataset.nota || (t.id && /^[pr]-/.test(t.id))) guardarSesionInputs();
});

render();
})();
