/* ============================================================
   مُحسن · الكنترول — النواة
   ============================================================ */
const KEY = 'muhsen_control_v1';
const SCHEMA = 3;
const APP_VER = 'نسخة ٠٫٦';
let S = null;

const uid = p => p + Math.random().toString(36).slice(2, 8);
const MIN = 60000, HR = 3600000, DAY = 86400000;
const now = () => Date.now() + (S && S.clockOffset ? S.clockOffset : 0) * MIN;
const AR = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const two = n => (n < 10 ? '0' : '') + n;
const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

function t12(ts) {
  const d = new Date(ts); let h = d.getHours();
  const ap = h >= 12 ? 'م' : 'ص'; h = h % 12 || 12;
  return AR(two(h) + ':' + two(d.getMinutes())) + ' ' + ap;
}
function hijri(ts) {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab',
      { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ts));
  } catch (e) { return AR(new Date(ts).toLocaleDateString('ar')); }
}
const dayName = ts => ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(ts).getDay()];
function ago(ts) {
  const d = Math.max(0, now() - ts);
  if (d < MIN) return 'الآن';
  if (d < HR) return 'قبل ' + AR(Math.floor(d / MIN)) + ' د';
  if (d < DAY) return 'قبل ' + AR(Math.floor(d / HR)) + ' س';
  return 'قبل ' + AR(Math.floor(d / DAY)) + ' يوم';
}
function untilTxt(ts) {
  const d = ts - now();
  if (d <= 0) return 'الآن';
  if (d < HR) return 'بعد ' + AR(Math.round(d / MIN)) + ' د';
  if (d < DAY) return 'بعد ' + AR(Math.floor(d / HR)) + ' س و' + AR(Math.round((d % HR) / MIN)) + ' د';
  return 'بعد ' + AR(Math.floor(d / DAY)) + ' يوم';
}

/* ---------- التهيئة ---------- */
function seed() {
  const st = {
    v: SCHEMA, clockOffset: 0, route: { n: 'ops' }, tab: {}, sort: {}, q: {}, wide: false,
    orgs: ORGS, users: [], tasks: [], tickets: [], reports: [], support: [],
    feed: [], pilgrims: {}, log: [], toast: null
  };
  S = st;

  /* المستخدمون: ليدرز · محسنون · احتياط */
  LEADERS.forEach(L => st.users.push(Object.assign({ role: 'leader', code: '#' + L.id }, L)));
  LEADERS.forEach((L, li) => {
    for (let i = 0; i < 5; i++) {
      const n = li * 5 + i;
      st.users.push({
        id: 'M' + (1001 + n), role: 'muhsen', reserve: false, leaderId: L.id,
        name: MUH_NAMES[n % MUH_NAMES.length].n, g: MUH_NAMES[n % MUH_NAMES.length].g,
        av: avOf(MUH_NAMES[n % MUH_NAMES.length].g, n), code: '#M' + (1001 + n),
        specialty: SPECS[n % SPECS.length], phone: '+9665' + (51000000 + n * 371),
        kt: L.kt, orgId: L.orgId
      });
    }
  });
  RESERVE_NAMES.forEach((r, i) => st.users.push({
    id: 'RS' + (2001 + i), role: 'muhsen', reserve: true, leaderId: null,
    name: r.n, g: r.g, av: avOf(r.g, i), code: '#RS' + (2001 + i), specialty: SPECS[i % SPECS.length],
    phone: '+9665' + (55110000 + i * 137), kt: '—'
  }));

  /* الحجاج */
  LEADERS.forEach((L, li) => {
    const org = ORGS.find(o => o.id === L.orgId) || {};
    const pool = PN_BY[org.country] || PN_MY;
    const arr = [];
    for (let i = 0; i < L.pilgrims; i++) {
      const g = (i * 7 + li) % 5 < 2 ? 'f' : 'm';
      arr.push({
        id: 'P' + L.kt + '-' + (1 + i),
        name: pilgrimName(pool, g, i + li * 3),
        no: 'HJ-' + AR(70000 + li * 1000 + i),
        g: g,
        country: org.country || '—', org: org.ar || '—',
        age: 34 + ((i * 7 + li * 5) % 42),
        floor: 'الدور ' + ['الأول','الثاني','الثالث','الرابع','الخامس'][(i + li) % 5],
        room: 100 + ((i * 7 + li * 13) % 380),
        state: PSTATE[(i * 5 + li) % PSTATE.length],
        flag: (i % 23 === 0) ? 'حالة صحية' : (i % 37 === 0) ? 'كرسي متحرّك' : null
      });
    }
    st.pilgrims[L.kt] = arr;
  });

  /* المهام: لكل ليدر خطة كاملة، مسكَّنة بفريقه */
  LEADERS.forEach((L, li) => {
    PLAN.forEach((p, idx) => {
      const c = CAT[p.k];
      const start = Date.now() + p.h * HR + li * 17 * MIN;
      const team = st.users.filter(u => u.role === 'muhsen' && u.leaderId === L.id);
      st.tasks.push({
        id: uid('T'), kind: p.k, code: 1200 + idx * 7 + li * 3,
        title: c.ar, desc: c.desc, place: c.place, city: c.city, photo: c.photo,
        leaderId: L.id, orgId: L.orgId, kt: L.kt,
        start, end: start + c.dur * HR, durH: c.dur,
        status: start < Date.now() ? 'done' : 'assigned',
        assigned: team.map(m => m.id),
        attended: start < Date.now() ? team.slice(0, 4).map(m => m.id) : [],
        rating: start < Date.now() ? Math.round((3.2 + ((idx + li) % 9) / 5) * 10) / 10 : null,
        autoStarted: start < Date.now() && (idx + li) % 4 === 0
      });
    });
  });

  /* التذاكر — من الحجاج */
  TICKET_SEED.forEach((k, i) => {
    const L = LEADERS[i % LEADERS.length];
    const pl = st.pilgrims[L.kt][i * 5 % st.pilgrims[L.kt].length];
    st.tickets.push({
      id: uid('K'), no: 'TK-' + AR(4100 + i), title: k.t, body: k.body,
      cat: k.cat, pri: k.pri, kt: L.kt, leaderId: L.id, from: pl.name, pilgrimId: pl.id,
      at: Date.now() - k.ago * MIN,
      status: i % 4 === 0 ? 'قيد المعالجة' : i === 7 ? 'مغلقة' : 'مفتوحة'
    });
  });

  /* التقارير الصاعدة */
  REPORT_SEED.forEach((r, i) => {
    const L = LEADERS[i % LEADERS.length];
    st.reports.push({
      id: uid('R'), no: 'RP-' + AR(5200 + i), cat: r.cat, title: r.t, body: r.b,
      kt: L.kt, from: L.id, at: Date.now() - r.ago * MIN,
      escalated: !!r.esc, room: r.room ? { floor: 'الدور الثالث', no: '٣١٤' } : null,
      status: r.esc ? 'لدى الكنترول' : 'قيد المعالجة'
    });
  });

  /* طلبات الدعم */
  const t0 = st.tasks.find(t => t.start > Date.now());
  if (t0) st.support.push({
    id: uid('SP'), no: 'SP-' + AR(7100), taskId: t0.id, by: t0.leaderId,
    count: 2, why: 'استُبعد محسنان لعدم الحاجة ثم تغيّر حجم الفوج.',
    at: Date.now() - 40 * MIN, state: 'pending'
  });

  /* التدفّق */
  /* أدلة التنفيذ — نسخة معتمدة لكل نشاط */
  st.guides = GUIDE_SEED.map(g => ({
    id: uid('D'), kind: g.k, ver: g.v, status: g.st, media: g.media,
    steps: g.steps, by: g.by, at: Date.now() - g.ago * MIN
  }));

  /* البثّ — ما أُرسل */
  st.casts = CAST_SEED.map((c, i) => ({
    id: uid('C'), no: 'BR-' + AR(9100 + i), to: c.to, title: c.t, body: c.b,
    kind: c.kind, seen: c.seen, of: c.of, at: Date.now() - c.ago * MIN
  }));

  /* الشِفتات — طلبات التبديل */
  st.swaps = SHIFT_SEED.map((x, i) => ({
    id: uid('W'), no: 'SW-' + AR(6300 + i), from: x.from, to: x.to,
    day: x.day, slot: x.slot, why: x.why, state: x.st, reason: null,
    at: Date.now() - x.ago * MIN
  }));

  /* السجل — ما وقع قبل هذه الجلسة */
  st.log = LOG_SEED.map(l => ({
    id: uid('G'), at: Date.now() - l.ago * MIN, text: l.t, kind: l.kind, by: 'الكنترول'
  }));

  FEED_SEED.forEach(f => st.feed.push({
    id: uid('E'), kind: f[0], title: f[1], body: f[2], at: Date.now() - f[3] * MIN
  }));

  return st;
}

function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); if (!S || S.v !== SCHEMA) S = seed(); }
  catch (e) { S = seed(); }
  S.feed = S.feed || []; S.support = S.support || []; S.log = S.log || [];
  S.guides = S.guides || []; S.casts = S.casts || []; S.swaps = S.swaps || [];
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
/* تقييم المحسن: متوسط تقييم مهام ليدره المنجزة، بميل ثابت لكل شخص
   حتى لا يتساوى الفريق كله في رقم واحد */
function muhsenRating(id) {
  const u = userById(id); if (!u) return 0;
  const done = S.tasks.filter(t => t.leaderId === u.leaderId && t.status === 'done' && t.rating);
  if (!done.length) return 0;
  const base = done.reduce((a, t) => a + t.rating, 0) / done.length;
  const tilt = ((Number(String(id).replace(/\D/g, '')) % 7) - 3) / 10;
  return Math.max(1, Math.min(5, Math.round((base + tilt) * 10) / 10));
}
/* الملاحظات: ما رُفع عليه من تقارير أو تذاكر تخصّ فريقه */
function muhsenNotes(id) {
  const n = Number(String(id).replace(/\D/g, '')) % 4;
  return n;
}

/* ---- أدوات الشاشات الجديدة ---- */
const allPilgrimRows = () => leaders().reduce((a, L) =>
  a.concat((S.pilgrims[L.kt] || []).map(p => Object.assign({ kt: L.kt, leaderId: L.id }, p))), []);
const guideOf = k => S.guides.find(g => g.kind === k);
const openSwaps = () => S.swaps.filter(w => w.state === 'pending');
/* تقييم الفريق: متوسط مهامه المنجزة */
function ktRating(id) {
  const d = S.tasks.filter(t => t.leaderId === id && t.status === 'done' && t.rating);
  return d.length ? Math.round(d.reduce((a, t) => a + t.rating, 0) / d.length * 10) / 10 : 0;
}

function reset() { localStorage.removeItem(KEY); S = seed(); go('ops'); toast('أُعيد ضبط البيانات'); }

/* ---------- مساعدات ---------- */
const userById = id => S.users.find(u => u.id === id);
const taskById = id => S.tasks.find(t => t.id === id);
const orgById = id => S.orgs.find(o => o.id === id);
const leaders = () => S.users.filter(u => u.role === 'leader');
const teamOf = lid => S.users.filter(u => u.role === 'muhsen' && u.leaderId === lid && !u.reserve);
const reserveTeam = () => S.users.filter(u => u.reserve);
const ktOf = lid => (userById(lid) || {}).kt;

const runningTasks = () => S.tasks.filter(t => t.status === 'running' ||
  (t.status !== 'done' && now() >= t.start && now() < t.end));
const todayTasks = () => S.tasks.filter(t => dayStart(t.start) === dayStart(now()));
const openTickets = () => S.tickets.filter(k => k.status !== 'مغلقة');
const escalatedReports = () => S.reports.filter(r => r.escalated && r.status !== 'مغلق');
const openSupport = () => S.support.filter(s => s.state === 'pending');
const allPilgrims = () => Object.keys(S.pilgrims).reduce((a, k) => a + S.pilgrims[k].length, 0);
const allMuhsens = () => S.users.filter(u => u.role === 'muhsen' && !u.reserve).length;

function logIt(text, kind) {
  S.log.unshift({ id: uid('G'), at: now(), text, kind: kind || 'info', by: 'الكنترول' });
  if (S.log.length > 300) S.log.pop();
}
function pushFeed(kind, title, body) {
  S.feed.unshift({ id: uid('E'), kind, title, body, at: now() });
  if (S.feed.length > 60) S.feed.pop();
}
function toast(text, kind) { S.toast = { text, kind: kind || 'g', at: Date.now() }; }
function go(n, id) { S.route = { n, id }; save(); render(); }
