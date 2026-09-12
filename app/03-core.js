/* ============================================================
   مُحسن · الكنترول — النواة
   ============================================================ */
const KEY = 'muhsen_control_v1';
const SCHEMA = 17;
const APP_VER = 'نسخة ١٫٣';
let S = null;

const uid = p => p + Math.random().toString(36).slice(2, 8);
const MIN = 60000, HR = 3600000, DAY = 86400000;
const now = () => Date.now() + (S && S.clockOffset ? S.clockOffset : 0) * MIN;
const VV = () => (typeof V !== 'undefined' && V) || S;
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
    feed: [], pilgrims: {}, log: [], toast: null,
    assigns: [], flt: {}, auth: false,
    /* لا شيء يُمنَح ابتداءً — إلا الإدارة العليا فلا تُقيَّد أصلًا */
    grants: {}, actor: { perm: 'admin' }, open: {}, cfg: {}, dash: []
  };
  S = st;

  /* المستخدمون: ليدرز · محسنون · احتياط */
  LEADERS.forEach(L => st.users.push(Object.assign({ role: 'leader', code: '#' + L.id }, L)));
  /* ١٦٠ محسنًا: خمسة لكل ليدر، والباقي أحرار للتشكيل */
  MUH_NAMES.forEach((m, n) => {
    const li = Math.floor(n / 5);
    const L = LEADERS[li] || null;
    st.users.push({
      id: 'M' + (1001 + n), role: 'muhsen', reserve: false,
      leaderId: L ? L.id : null,
      name: m.n, g: m.g, av: avOf(m.g, n), code: '#M' + (1001 + n),
      specialty: SPECS[n % SPECS.length], phone: '+9665' + (51000000 + n * 371),
      age: 22 + (n * 7) % 34,
      kt: L ? L.kt : '—', orgId: L ? L.orgId : null
    });
  });
  RESERVE_NAMES.forEach((r, i) => st.users.push({
    id: 'RS' + (2001 + i), role: 'muhsen', reserve: true, leaderId: null,
    name: r.n, g: r.g, av: avOf(r.g, i), code: '#RS' + (2001 + i), specialty: SPECS[i % SPECS.length],
    phone: '+9665' + (55110000 + i * 137), kt: '—', age: 24 + (i * 5) % 30
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
        no: 'HJ-' + (70000 + li * 1000 + i),
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
      id: uid('K'), no: 'TK-' + (4100 + i), title: k.t, body: k.body,
      cat: k.cat, pri: k.pri, kt: L.kt, leaderId: L.id, from: pl.name, pilgrimId: pl.id,
      at: Date.now() - k.ago * MIN,
      status: i % 4 === 0 ? 'قيد المعالجة' : i === 7 ? 'مغلقة' : 'مفتوحة'
    });
  });

  /* التقارير الصاعدة */
  REPORT_SEED.forEach((r, i) => {
    const L = LEADERS[i % LEADERS.length];
    st.reports.push({
      id: uid('R'), no: 'RP-' + (5200 + i), cat: r.cat, title: r.t, body: r.b,
      kt: L.kt, from: L.id, at: Date.now() - r.ago * MIN,
      escalated: !!r.esc, room: r.room ? { floor: 'الدور الثالث', no: '٣١٤' } : null,
      status: r.esc ? 'لدى الكنترول' : 'قيد المعالجة'
    });
  });

  /* طلبات الدعم */
  const t0 = st.tasks.find(t => t.start > Date.now());
  if (t0) st.support.push({
    id: uid('SP'), no: 'SP-' + (7100), taskId: t0.id, by: t0.leaderId,
    count: 2, why: 'استُبعد محسنان لعدم الحاجة ثم تغيّر حجم الفوج.',
    at: Date.now() - 40 * MIN, state: 'pending'
  });

  /* التدفّق */

  /* ---------- المشرفون: يُسكَّنون على الفنادق ---------- */
  SUP_NAMES.forEach((s, i) => st.users.push({
    id: 'SV' + (3001 + i), role: 'supervisor', name: s.n, g: s.g, av: avOf(s.g, i),
    code: '#SV' + (3001 + i), specialty: 'إشراف سكن', phone: '+9665' + (57220000 + i * 211),
    /* فندق واحد لمشرف واحد — والزائد يبقى حرًّا للتسكين */
    hotelId: i < HOTELS.length ? HOTELS[i].id : null, kt: '—', age: 30 + (i * 3) % 26
  }));

  /* ---------- التشكيل: لكل ليدر مجموعة بفريقه ---------- */
  /* آخر جهة تُترك بلا تشكيل — فيرى المشغّل الآلية حيّة عند أول فتح */
  st.groups = LEADERS.slice(0, LEADERS.length - 1).map((L, i) => {
    const team = st.users.filter(u => u.role === 'muhsen' && !u.reserve && u.leaderId === L.id);
    const h = HOTELS[i % HOTELS.length];
    const sv = st.users.find(u => u.role === 'supervisor' && u.hotelId === h.id);
    team.forEach((m, k) => { m.groupId = 'G' + (101 + i); m.spec = SPECS[(i + k) % SPECS.length]; });
    /* عمر يُعرض في التشكيل */
    team.forEach((m, k) => { m.age = 24 + ((i * 5 + k * 7) % 26); });
    return {
      id: 'G' + (101 + i), no: 'GR-' + (101 + i), leaderId: L.id, orgId: L.orgId,
      hotelId: h.id, supervisorId: sv ? sv.id : null,
      members: team.map((m, k) => ({ id: m.id, spec: SPECS[(i + k) % SPECS.length] })),
      at: Date.now() - (40 - i * 6) * DAY
    };
  });

  /* من لم يدخل مجموعة يعود حرًّا: لا ليدر ولا مجموعة */
  st.users.forEach(u => {
    if (u.role === 'muhsen' && !u.reserve && !u.groupId) { u.leaderId = null; u.kt = '—'; }
  });

  /* ---------- طلبات الدعم: ما يرفعه الليدرز ---------- */
  const SUP_WHY = [
    'استُبعد محسنان لعدم الحاجة ثم تغيّر حجم الفوج',
    'اعتذر محسنان لظرف صحّي قبل التفويج بساعتين',
    'الفوج زاد أربعين حاجًّا عن الكشف الأوّل',
    'مهمّة الجمرات تحتاج مرافقًا إضافيًّا لكبار السنّ',
    'محسن الإعاشة في إجازة اضطرارية اليوم',
    'تداخل موعد التفويج مع مهمّة الطواف',
    'يحتاج ناطقًا بالملايوية لمجموعة جديدة',
    'مشرف السكن طلب مرافقًا ليليًّا إضافيًّا'
  ];
  st.support = [];
  SUP_WHY.forEach((why, i) => {
    const t = st.tasks[(i * 13 + 5) % st.tasks.length];
    const state = i < 4 ? 'pending' : i < 6 ? 'done' : 'no';
    st.support.push({
      id: uid('SP'), no: 'SP-' + (3001 + i), taskId: t.id, by: t.leaderId,
      count: 1 + (i % 3), why, state,
      reason: state === 'done' ? 'أُسند ' + AR(1 + (i % 3)) + ' من الاحتياط'
        : state === 'no' ? 'الاحتياط مرتبط بعرفة — أعِد التوزيع داخل فريقك' : null,
      at: Date.now() - (20 + i * 47) * MIN
    });
  });

  /* ---------- إثراء التجربة: تصل جاهزة من نظام المزارات ---------- */
  st.enrich = [];
  SITES.forEach((si, i) => {
    for (let r = 0; r < (i % 3 === 0 ? 2 : 1); r++) {
      const L = LEADERS[(i + r) % LEADERS.length];
      const start = Date.now() + ((i * 9 + r * 31) - 30) * HR;
      const assigned = (i + r) % 4 !== 0;
      st.enrich.push({
        id: uid('X'), ref: 'EX-' + (88100 + i * 7 + r), siteId: si.id,
        start, end: start + si.dur * HR, seats: si.cap,
        booked: Math.round(si.cap * (0.55 + ((i + r) % 5) / 12)),
        kt: assigned ? L.kt : null, leaderId: assigned ? L.id : null, muhsenId: null,
        status: start < Date.now() ? 'done' : assigned ? 'assigned' : 'unassigned',
        at: Date.now() - (i * 40 + 60) * MIN
      });
    }
  });
  st.enrichSync = Date.now() - 7 * MIN;

  /* ---------- نُسك: حالات البطاقات ---------- */
  st.nusuk = NUSUK_SEED.map((c, i) => {
    const L = LEADERS[i % LEADERS.length];
    const arr = st.pilgrims[L.kt];
    const p = arr[c.pi % arr.length];
    const team = st.users.filter(u => u.role === 'muhsen' && u.leaderId === L.id);
    const done = c.st === 'delivered' || c.st === 'issued';
    return {
      id: uid('N'), no: 'NS-' + (4400 + i), svc: c.svc, pilgrimId: p.id,
      pilgrim: p.name, passport: p.no, kt: L.kt, leaderId: L.id,
      openedBy: c.by, state: c.st, step: NUSUK_SVC[c.svc].steps.length - (c.st === 'new' ? 4
        : c.st === 'processing' ? 2 : c.st === 'issued' ? 1 : 0),
      assignedTo: done ? (team[i % team.length] || {}).id || null : null,
      at: Date.now() - c.ago * MIN,
      note: c.svc === 'lost' ? 'فقد البطاقة في الحرم — أبلغ ليدره'
        : c.svc === 'enable' ? 'البطاقة صدرت ولم تُفعَّل عند البوّابة'
        : 'حاجّ مستجدّ في الكشف — بلا بطاقة'
    };
  });

  /* ---------- الامتثال: قوالب وإدخالات ---------- */
  st.forms = FORM_SEED.map((f, i) => ({
    id: 'F' + (201 + i), no: 'FM-' + (201 + i), title: f.title, scope: f.scope,
    icon: f.i, color: f.c, by: f.by, at: Date.now() - f.ago * MIN,
    intro: f.intro || '', pledge: f.pledge || '',
    qs: f.qs.map((q, k) => Object.assign({ id: 'q' + (k + 1) }, q))
  }));

  st.subs = [];
  st.forms.forEach((f, fi) => {
    const targets = f.scope === 'فندق' ? HOTELS.map(h => h.ar)
      : f.scope === 'نقل' ? ['شركة النقل الموحّدة','مسار للنقل البرّي']
      : ['مطبخ الشرائع','مطبخ العزيزية'];
    targets.forEach((tg, ti) => {
      const visits = 1 + ((fi + ti) % 3);
      for (let v = 1; v <= visits; v++) {
        const L = LEADERS[(fi + ti + v) % LEADERS.length];
        const by = st.users.filter(u => u.role === 'muhsen' && u.leaderId === L.id)[v % 5] || L;
        /* الزيارة الأولى أضعف، ثم تتحسّن — هذا ما يجعل النموذج مفيدًا */
        const lift = (v - 1) * 0.22;
        const ans = f.qs.map((q, qi) => {
          const seed = (fi * 7 + ti * 5 + v * 3 + qi) % 10;
          if (q.t === 'yn') return { id:q.id, v: (seed / 10 + lift) > 0.42 };
          if (q.t === 'rate') return { id:q.id, v: Math.max(1, Math.min(5, Math.round(2 + seed / 3 + lift * 3))) };
          if (q.t === 'num') return { id:q.id, v: 6 + seed * 2 + Math.round(lift * 10) };
          if (q.t === 'photo') return { id:q.id, v: (seed + v) % 4 ? { name:'sala' + v + '.jpg',
            size: 380000 + seed * 40000, type:'image/jpeg' } : null };
          if (q.t === 'sign') return { id:q.id, v: (seed / 10 + lift) > 0.3 };
          return { id:q.id, v: v === visits ? 'استُوفيت الملاحظات السابقة.' : 'يحتاج متابعة في الزيارة القادمة.' };
        });
        st.subs.push({
          id: uid('B'), formId: f.id, target: tg, visit: v, of: visits,
          kt: L.kt, leaderId: L.id, by: by.id,
          at: Date.now() - ((visits - v) * 5 + fi * 2 + ti) * DAY - (fi + ti) * HR,
          answers: ans, score: formScore(f, ans)
        });
      }
    });
  });


  /* ---------- العفاشة ---------- */
  st.contractors = CONTRACTOR_SEED.map((c, i) => ({
    id: 'CT' + (401 + i), name: c[0], company: c[1], workers: c[2],
    phone: '+96650' + (3110000 + i * 4177),
    user: 'afasha' + (401 + i), pass: 'MC' + (7100 + i * 13),
    sms: c[3], smsAt: Date.now() - (40 + i * 90) * MIN,
    at: Date.now() - (3 + i) * DAY
  }));
  st.deals = [];
  CONTRACTOR_SEED.forEach((c, i) => {
    if (c[4] === 'draft') return;
    const ct = st.contractors[i];
    st.deals.push({
      id: 'DL' + (601 + i), no: 'CN-' + (601 + i), contractorId: ct.id,
      title: 'تعاقد نقل عفش الحجاج — موسم ١٤٤٨ هـ',
      body: 'نقل عفش الحجاج بين الفنادق والمشاعر طوال الموسم، بعدد عمّال لا يقلّ عن ' +
        AR(ct.workers) + ' عاملًا، وبإشراف مشرف السكن في كل فندق.',
      value: 32000 + i * 4500, hours: 48, state: c[4],
      file: i % 3 === 0 ? { name:'عرض-' + (601 + i) + '.pdf', size:284000 + i * 9000,
        type:'application/pdf' } : null,
      reason: c[4] === 'refused' ? 'اعتذر — ارتباط بموسم آخر' :
        c[4] === 'offline' ? 'وُقّع ورقيًّا في المكتب، واعتمده الكنترول' : null,
      at: Date.now() - (2 + i) * DAY + 3 * HR
    });
  });

  /* ---------- النقل: عشرة باصات ورحلاتها ---------- */
  st.buses = BUS_SEED.map((b, i) => ({
    id: 'BS' + (501 + i), no: b[0], plate: b[1], cap: b[2], driver: b[3],
    color: b[4], phone: '+96653' + (2200000 + i * 3313)
  }));

  st.trips = [];
  let tn = 0;
  /* رحلة لكل مهمة قريبة: ذهاب وعودة، مع توزيع على الباصات */
  const soon = st.tasks
    .filter(t => t.start > Date.now() - 3 * DAY && t.start < Date.now() + 5 * DAY)
    .sort((a, b) => a.start - b.start);
  soon.forEach((t, i) => {
    const bus = st.buses[i % st.buses.length];
    const kind = t.kind === 'airport' ? 'airport'
      : t.kind === 'checkin' || t.kind === 'checkout' ? 'toHotel' : 'toTask';
    const g = st.groups.find(x => x.leaderId === t.leaderId);
    const hotel = g ? HOTEL_SEED[(st.groups.indexOf(g)) % HOTEL_SEED.length][0] : 'نقطة التجمّع';
    const riders = g ? g.members.slice(0, 3 + (i % 3)).map(m => m.id) : [];
    const dep = t.start - (45 + (i % 4) * 15) * MIN;
    st.trips.push({
      id: 'TR' + (701 + tn), no: 'TP-' + (701 + tn), busId: bus.id, taskId: t.id,
      kind, from: hotel, to: t.place, at: dep, dur: 35 + (i % 5) * 10,
      cap: bus.cap, riders, driver: bus.driver,
      done: t.start < Date.now()
    });
    tn++;
    /* عودة بعد انتهاء المهمّة */
    if (i % 2 === 0) {
      st.trips.push({
        id: 'TR' + (701 + tn), no: 'TP-' + (701 + tn), busId: bus.id, taskId: t.id,
        kind: 'back', from: t.place, to: hotel, at: t.end + 20 * MIN,
        dur: 35 + (i % 4) * 10, cap: bus.cap, riders, driver: bus.driver,
        done: t.end < Date.now()
      });
      tn++;
    }
  });

  /* أدلة التنفيذ — نسخة معتمدة لكل نشاط */
  /* الأدلة: لكل نشاط حجّ دليله، ولبعض الخدمات والمزارات كذلك */
  const MK = { 'نص':'text', 'صور':'photo', 'فيديو':'video', 'PDF':'pdf' };
  st.guides = GUIDE_SEED.map((g, i) => {
    const steps = [];
    for (let s2 = 1; s2 <= g.steps; s2++) steps.push(GUIDE_STEP(g.k, s2));
    return {
      id: 'GD' + (801 + i), scope: 'hajj', target: g.k, taskId: null,
      title: 'دليل ' + (CAT[g.k] || {}).ar, ver: g.v,
      status: g.st === 'معتمد' ? 'live' : g.st === 'مسودة' ? 'draft' : 'review',
      media: g.media.map(m => ({ k: MK[m] || 'text',
        name: m === 'فيديو' ? 'شرح-' + g.k + '.mp4' : m === 'PDF' ? 'دليل-' + g.k + '.pdf'
          : m === 'صور' ? 'صور-' + g.k + '.zip' : 'نصّ الخطوات',
        size: 240000 + i * 31000 })),
      steps, by: g.by, at: Date.now() - g.ago * MIN
    };
  });
  /* دليلان خارج نشاط الحجّ ليُرى الربط بالأنواع الأخرى */
  st.guides.push({ id:'GD820', scope:'nusuk', target:'lost', taskId:null,
    title:'دليل إصدار بدل فاقد', ver:2, status:'live',
    media:[{ k:'video', name:'خطوات-بدل-فاقد.mp4', size:412000 },
           { k:'pdf', name:'نموذج-الإقرار.pdf', size:186000 }],
    steps:NUSUK_SVC.lost.steps.slice(), by:'L1', at:Date.now() - 900 * MIN });
  st.guides.push({ id:'GD821', scope:'enrich', target:'s1', taskId:null,
    title:'دليل زيارة جبل النور', ver:1, status:'live',
    media:[{ k:'photo', name:'مسار-الصعود.jpg', size:520000 }],
    steps:['التجمّع عند المدخل وعدّ المجموعة','التنبيه على كبار السنّ بعدم الصعود',
      'شرح تاريخ الغار من الأسفل','وقت حرّ ثلاثون دقيقة','العدّ قبل الركوب'],
    by:'L2', at:Date.now() - 600 * MIN });

  /* البثّ — ما أُرسل */
  const CDEST = ['muhsen','muhsen','hajj','muhsen','ctl','hajj'];
  st.casts = CAST_SEED.map((c, i) => ({
    id: uid('C'), no: 'BR-' + (9100 + i), dest: CDEST[i % CDEST.length], aud: 'all',
    to: c.to, title: c.t, body: c.b,
    kind: c.kind, seen: c.seen, of: c.of, at: Date.now() - c.ago * MIN
  }));

  /* الشِفتات — طلبات التبديل */
  st.swaps = SHIFT_SEED.map((x, i) => ({
    id: uid('W'), no: 'SW-' + (6300 + i), from: x.from, to: x.to,
    day: x.day, slot: x.slot, why: x.why, state: x.st, reason: null,
    at: Date.now() - x.ago * MIN
  }));

  /* السجل — ما وقع قبل هذه الجلسة */
  st.log = LOG_SEED.map(l => ({
    id: uid('G'), at: Date.now() - l.ago * MIN, text: l.t, kind: l.kind, by: 'الكنترول'
  }));

  /* الحوادث تُصنَّف: نوع وحالة وجهة وزمن استجابة */
  const INC_ST = ['مفتوح', 'قيد المعالجة', 'مغلق'];
  FEED_SEED.forEach((f, fi) => st.feed.push({
    no: 'IN-' + (7300 + fi),
    cat: INC_CATS[fi % INC_CATS.length].k,
    kt: ORGS[fi % ORGS.length].kt,
    hotel: HOTELS[fi % HOTELS.length].ar,
    state: INC_ST[(fi * 2) % 3],
    resp: 4 + (fi * 7) % 38,
    id: uid('E'), kind: f[0], title: f[1], body: f[2], at: Date.now() - f[3] * MIN
  }));

  seedTaskDetail(st);
  seedAlerts(st);
  seedShifts(st);
  seedComply(st);

  return st;
}

function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); if (!S || S.v !== SCHEMA) S = seed(); }
  catch (e) { S = seed(); }
  S.feed = S.feed || []; S.support = S.support || []; S.log = S.log || [];
  S.guides = S.guides || []; S.casts = S.casts || []; S.swaps = S.swaps || [];
  S.groups = S.groups || []; S.enrich = S.enrich || []; S.nusuk = S.nusuk || [];
  S.assigns = S.assigns || []; S.flt = S.flt || {}; S.q = S.q || {};
  S.grants = S.grants || {}; S.actor = S.actor || { perm: 'admin' };
  S.contractors = S.contractors || []; S.deals = S.deals || [];
  S.buses = S.buses || []; S.trips = S.trips || [];
  S.open = S.open || {}; S.cfg = S.cfg || {}; S.dash = S.dash || [];
  S.forms = S.forms || []; S.subs = S.subs || [];
  S.reqtpl = S.reqtpl || []; S.attend = S.attend || {}; S.sched = S.sched || null;
  (S.tasks || []).forEach(t => { ensureTask(t); t.alerts = t.alerts || []; });
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

/* الفريق يُقرأ من التشكيل — هو المصدر، لا حقل في المستخدم */
function teamOf(lid) {
  const ids = [];
  groupsOf(lid).forEach(g => g.members.forEach(m => { if (ids.indexOf(m.id) < 0) ids.push(m.id); }));
  return ids.map(userById).filter(Boolean);
}

/* ---- أدوات الأنواع الأربعة والتشكيل ---- */
const siteById = id => SITES.find(s => s.id === id) || {};
const hotelById = id => HOTELS.find(h => h.id === id) || {};
const groupById = id => S.groups.find(g => g.id === id);   /* الأصل: يُستعمل للتعديل */
const formById = id => S.forms.find(f => f.id === id);
const supervisors = () => VV().users.filter(u => u.role === 'supervisor');
const groupsOf = lid => VV().groups.filter(g => g.leaderId === lid);
/* المحسن الحرّ: غير مسكَّن في أي مجموعة — هؤلاء وحدهم يظهرون عند التشكيل */
const freeMuhsens = () => VV().users.filter(u => u.role === 'muhsen' && !u.reserve && !u.groupId);
const inGroup = id => S.groups.some(g => g.members.some(m => m.id === id));
/* درجة النموذج: نعم=كامل · التقييم نسبة من خمس · العدد لا يُحتسب */
function formScore(f, answers) {
  let got = 0, max = 0;
  f.qs.forEach(q => {
    if (!q.w) return;
    const a = answers.find(x => x.id === q.id); if (!a) return;
    max += q.w;
    if (q.t === 'yn' || q.t === 'sign') got += a.v ? q.w : 0;
    else if (q.t === 'rate') got += q.w * (a.v / 5);
    else max -= q.w;   /* نصّ وصورة وعدد: توثيق لا تقييم */
  });
  return max ? Math.round(got / max * 100) : 0;
}
const subsOf = fid => VV().subs.filter(b => b.formId === fid);
const openNusuk = () => VV().nusuk.filter(c => c.state !== 'delivered');
const freeEnrich = () => VV().enrich.filter(x => x.status === 'unassigned');

/* ---- أدوات الشاشات الجديدة ---- */
const allPilgrimRows = () => leaders().reduce((a, L) =>
  a.concat((VV().pilgrims[L.kt] || []).map(p => Object.assign({ kt: L.kt, leaderId: L.id }, p))), []);
const guideOf = k => S.guides.find(g => g.kind === k);
const openSwaps = () => S.swaps.filter(w => w.state === 'pending');
/* تقييم الفريق: متوسط مهامه المنجزة */
function ktRating(id) {
  const d = S.tasks.filter(t => t.leaderId === id && t.status === 'done' && t.rating);
  return d.length ? Math.round(d.reduce((a, t) => a + t.rating, 0) / d.length * 10) / 10 : 0;
}

/* مزوّد الرسائل: يُرسَل فورًا، وتصل الحالة بعد لحظات.
   الرقم غير السعودي أو الناقص يفشل — وهذا ما يُختبر. */
function sendSms(c) {
  const okNum = /^\+?9665\d{8}$/.test(String(c.phone).replace(/\s/g, ''));
  c.sms = 'sent'; c.smsAt = now(); save();
  setTimeout(() => {
    const cc = S.contractors.find(x => x.id === c.id);
    if (!cc) return;
    cc.sms = okNum ? 'delivered' : 'failed';
    cc.smsAt = now();
    logIt('رسالة ' + cc.name + ': ' + (okNum ? 'وصلت' : 'لم تصل — الرقم غير صالح'), 'info');
    save();
    if (S.route.n === 'afasha') render();
  }, 1800);
}

function reset() { localStorage.removeItem(KEY); S = seed(); go('ops'); toast('أُعيد ضبط البيانات'); }

/* ---------- مساعدات ---------- */
const userById = id => S.users.find(u => u.id === id);
const taskById = id => S.tasks.find(t => t.id === id);
const orgById = id => S.orgs.find(o => o.id === id);
const leaders = () => VV().users.filter(u => u.role === 'leader');
const teamOfLegacy = lid => S.users.filter(u => u.role === 'muhsen' && u.leaderId === lid && !u.reserve);
const reserveTeam = () => VV().users.filter(u => u.reserve);
const ktOf = lid => (userById(lid) || {}).kt;

const runningTasks = () => VV().tasks.filter(t => t.status === 'running' ||
  (t.status !== 'done' && now() >= t.start && now() < t.end));
const todayTasks = () => VV().tasks.filter(t => dayStart(t.start) === dayStart(now()));
const openTickets = () => VV().tickets.filter(k => k.status !== 'مغلقة');
const escalatedReports = () => VV().reports.filter(r => r.escalated && r.status !== 'مغلق');
const openSupport = () => VV().support.filter(s => s.state === 'pending');
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
