/* ============================================================
   المهمّة كاملةً — ما يراه المحسن في التطبيق يراه الكنترول هنا، وأكثر

   القاعدة: الكنترول هو الأصل. فكلّ ما يستطيعه الليدر والمحسن في
   الميدان يستطيعه الكنترول من هنا — يبدأ ويُغلق ويؤشّر ويسكّن ويرفع
   الملفات — ويُسجَّل كلّ ذلك باسم «النظام» في سجلّ المهمّة، فلا يختلط
   فعلُ الغرفة بفعل الميدان.
   ============================================================ */

/* ---------- ضمان البنية: المهمّة القديمة تُهاجَر ولا تُفقَد ---------- */
function ensureTask(t) {
  if (!t) return t;
  const c = CAT[t.kind] || {};
  if (!t.subs) t.subs = (c.subs || []).map((n, i) =>
    ({ id: t.id + '-S' + (i + 1), no: i + 1, name: n, done: false, at: null, by: null, shot: null }));
  if (!t.reqs)  t.reqs  = [];
  if (!t.files) t.files = [];
  if (!t.notes) t.notes = [];
  if (!t.hist)  t.hist  = [];
  if (!t.attended) t.attended = [];
  if (!t.assigned) t.assigned = [];
  return t;
}

/* ---------- بذر التفصيل: فرعيات وصور وعقود ومتطلّبات وسجلّ ---------- */
function seedTaskDetail(st) {
  st.reqtpl = REQ_PHS.length ? Object.keys(REQ_TPL).map((k, i) => ({
    id: 'RT' + (900 + i), kind: k, name: 'متطلّبات ' + (CAT[k] ? CAT[k].ar : k),
    items: REQ_PHS.reduce((a, ph) =>
      a.concat((REQ_TPL[k][ph] || []).map(x => ({ ph, text: x }))), []),
    at: Date.now() - (30 - i) * DAY
  })) : [];

  st.tasks.forEach((t, ti) => {
    ensureTask(t);
    const done = t.status === 'done';
    const c = CAT[t.kind] || {};

    /* المتطلّبات من قالب تصنيفها */
    const tpl = REQ_TPL[t.kind] || {};
    let ri = 0;
    t.reqs = REQ_PHS.reduce((a, ph) => a.concat((tpl[ph] || []).map(x => {
      ri++;
      /* المنجزة مشيَّكة كاملةً · الجارية شُيِّك ما قبلها وبعضُ خلالها · القادمة بعضُ ما قبلها */
      const live = now() >= t.start && !done;
      const ok = done ? true
        : live ? (ph === 'pre' || (ph === 'run' && ri % 2 === 0))
        : (ph === 'pre' && (ri + ti) % 3 !== 0);
      return { id: t.id + '-Q' + ri, ph, text: x, done: ok,
        by: ok ? 'الكنترول' : null, at: ok ? t.start - (24 - ri) * HR : null, note: '' };
    })), []);

    /* الفرعيات: المنجزة كلّها · الجارية إلى منتصفها */
    const live = now() >= t.start && now() < t.end && !done;
    const cut = done ? t.subs.length : live ? Math.ceil(t.subs.length * 0.55) : 0;
    t.subs.forEach((s, i) => {
      if (i < cut) {
        s.done = true;
        s.at = t.start + Math.round((i + 1) * (t.durH * HR) / (t.subs.length + 1));
        s.by = t.leaderId;
        /* صورة توثيق على بعض الخطوات — كما يرفعها الميدان */
        if ((i + ti) % 3 === 0) {
          const sd = SHOT_SEED[(ti * 3 + i) % SHOT_SEED.length];
          s.shot = { img: sd.img, at: s.at, by: t.leaderId, note: s.name };
        }
      }
    });

    /* العقود على مهام الاستقبال — والكنترول يزيد ما شاء */
    if (DOC_KINDS.indexOf(t.kind) >= 0) {
      t.files = Object.keys(DOCS).map((k, i) => ({
        id: t.id + '-F' + (i + 1), kind: 'contract', doc: k,
        name: DOCS[k].ar, ref: DOCS[k].ref + '-' + t.code + '-1447',
        note: DOCS[k].sub, size: 180000 + i * 40000, type: 'application/pdf',
        at: t.start - 6 * DAY, by: 'النظام'
      }));
    }

    /* السجلّ: يُبنى من الوقائع نفسها لا يُخترع */
    const h = [{ at: t.start - 12 * DAY, text: 'أُنشئت المهمة من كتالوج الأنشطة', kind: 'info' }];
    if (t.assigned.length) h.push({ at: t.start - 10 * DAY,
      text: 'سُكِّن ' + AR(t.assigned.length) + ' محسنًا تلقائيًّا من مجموعة ' + t.kt, kind: 'assign' });
    if (t.reqs.length) h.push({ at: t.start - 3 * DAY,
      text: 'رُبط قالب «متطلّبات ' + (c.ar || '') + '» — ' + AR(t.reqs.length) + ' شرطًا', kind: 'info' });
    if (t.files.length) h.push({ at: t.start - 6 * DAY,
      text: 'رُفع ' + AR(t.files.length) + ' عقدًا على المهمة', kind: 'file' });
    if (done || live) h.push({ at: t.startedAt || t.start,
      text: t.autoStarted ? 'بدأها النظام تلقائيًّا — لم يبدأها ليدرها' : 'بدأها الليدر في وقتها',
      kind: t.autoStarted ? 'warn' : 'ok' });
    if (done) h.push({ at: t.end, text: 'أُنهيت المهمة — ' + AR(t.subs.length) + ' خطوة منجزة', kind: 'ok' });
    t.hist = h.sort((a, b) => b.at - a.at);

    /* ملاحظات: على المهام التي بدأها النظام وعلى بعض المنجزة */
    t.notes = [];
    if (t.autoStarted) t.notes.push({ at: t.start + 5 * MIN, by: 'النظام',
      text: 'حان وقت المهمة ولم يبدأها ليدرها — بدأها النظام وتُحتسب في تقييمه.', kind: 'auto' });
    if (done && ti % 4 === 1) t.notes.push({ at: t.end - 40 * MIN, by: 'الكنترول',
      text: 'تأخّر وصول حافلة واحدة عشرين دقيقة — عولج ميدانيًّا ولم يتأثّر الجدول.', kind: 'note' });
  });

  /* التذاكر تُربط بمهام أصحابها — فيظهر عددها على سطر المهمة */
  st.tickets.forEach((k, i) => {
    const pool = st.tasks.filter(t => t.leaderId === k.leaderId);
    if (pool.length) k.taskId = pool[i % pool.length].id;
  });
}

/* ============================================================
   حسابات المهمّة
   ============================================================ */
const tPct = (a, b) => b ? Math.round(a / b * 100) : 0;
const subPct  = t => tPct((t.subs || []).filter(s => s.done).length, (t.subs || []).length);
const reqIn   = (t, ph) => (t.reqs || []).filter(r => r.ph === ph);
const reqPct  = (t, ph) => { const a = reqIn(t, ph); return tPct(a.filter(r => r.done).length, a.length); };
const prepPct = t => reqPct(t, 'pre');
const taskTickets = t => (V.tickets || []).filter(k => k.taskId === t.id);
function taskPilgrims(t) {
  const L = userById(t.leaderId);
  if (L && L.pilgrims) return L.pilgrims;
  return ((S.pilgrims || {})[t.kt] || []).length;
}

function tState(t) {
  if (t.status === 'cancelled') return 'cancelled';
  if (t.status === 'done') return 'done';
  if (t.startedAt || t.status === 'running') return now() < t.end ? 'live' : 'live';
  if (now() >= t.end) return 'over';
  if (now() >= t.start) return 'late';
  if (t.start - now() <= 2 * HR) return 'soon';
  return 'next';
}
const tsOf = t => TSTATE[tState(t)] || TSTATE.next;

/* ============================================================
   قطع صغيرة تُعاد في كل مكان
   ============================================================ */

/* حلقة نسبة — تُقرأ بلمحة ولا تحتاج رقمًا بجانبها.
   بُنيت بـ conic-gradient لا بـ SVG: الجدول فيه مئات الحلقات، وكل رسمٍ
   متّجه فيه أربع عقد وتخطيطٌ مستقلّ. هذه ثلاث عقد وطلاءٌ واحد. */
function ring(pct, col, size) {
  const sz = size || 34;
  return '<span class="tring" style="width:' + sz + 'px;height:' + sz + 'px;' +
    '--p:' + pct + ';--rc:' + col + '"><i></i><b class="num">' + AR(pct) + '</b></span>';
}

/* رقاقة عدّ: أيقونة ورقم — تُصفّ في سطر المهمة */
const cnt = (ic, n, ttl, cls) =>
  '<span class="tcnt ' + (cls || '') + '" title="' + E(ttl) + '">' + icon(ic, 's14') +
  '<b class="num">' + AR(n) + '</b></span>';

/* صورة توثيق */
function shotTile(s, tid) {
  if (!s || !s.shot) return '';
  return '<button class="shot bg-' + s.shot.img + '" data-a="txphoto" data-id="' + tid +
    '" data-s="' + s.id + '" aria-label="إثبات ' + E(s.name) + '">' +
    '<span class="sh">' + icon('i-camera','s12') + '<b>' + t12(s.shot.at) + '</b></span></button>';
}

/* ============================================================
   سطر المهمّة في الجدول
   ============================================================ */
function taskRow(t) {
  ensureTask(t);
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {};
  const k = tState(t), st = TSTATE[k] || TSTATE.next;
  const pre = prepPct(t), don = subPct(t), tk = taskTickets(t).length;
  const h = taskHotel(t);
  const un = taskAlerts(t).filter(a => !a.seen).length;
  /* لون الحالة متغيّرٌ واحد يصبغ الطرف والحافّة والأرضيّة والحبّة معًا */
  return '<div class="prow trow ' + k + '" style="--tsc:' + st.c + '" ' +
      'data-a="tlopen" data-id="' + t.id + '">' +
    '<span class="krail"></span>' +
    '<span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' +
      icon(c.i || 'i-tasks', 's18') + '</span>' +

    '<span class="nm" style="flex:1;min-width:160px"><b>' + E(t.title) + '</b>' +
      '<span>' + LTR(t.kt) + ' · ' + E(L.name || '') + ' · ' +
      E(h ? h.ar : t.city) + '</span></span>' +

    '<span class="when"><b>' + hijri(t.start) + '</b>' +
      '<span class="num">' + t12(t.start) + ' — ' + t12(t.end) + '</span></span>' +

    '<span class="tcnts">' +
      cnt('i-users', taskPilgrims(t), 'حجاج المجموعة') +
      cnt('i-assign', t.assigned.length, 'محسنون مسكَّنون') +
      cnt('i-checkc', t.attended.length, 'أثبتوا حضورهم', t.attended.length ? 'ok' : '') +
      (tk ? cnt('i-ticket', tk, 'تذاكر مرفوعة على المهمة', 'warn') : '') +
      (un ? cnt('i-bell', un, 'تنبيهات لم تُقرأ', 'warn') : '') +
    '</span>' +

    '<span class="tprogs">' +
      '<span class="tp"><span class="tiny faint">الاستعداد</span>' +
        ring(pre, pre === 100 ? 'var(--live)' : 'var(--gold2)', 30) + '</span>' +
      '<span class="tp"><span class="tiny faint">الإنجاز</span>' +
        ring(don, don === 100 ? 'var(--live)' : st.c, 30) + '</span>' +
    '</span>' +

    '<span class="end">' +
      '<span class="tst"><i></i>' + E(st.ar) + '</span>' +
      (t.status === 'done' && t.rating
        ? '<div style="margin-top:6px">' + stars(t.rating) + '</div>' : '') +
      (t.autoStarted ? '<div style="margin-top:5px">' + pill('بدأها النظام','no') + '</div>' : '') +
      (t.closedBy === 'system' ? '<div style="margin-top:5px">' + pill('أُغلقها النظام','no') + '</div>' : '') +
    '</span></div>';
}

/* فندق المهمّة: من مجموعة ليدرها — وهو بيانٌ كان ناقصًا */
function taskHotel(t) {
  const g = (S.groups || []).find(x => x.leaderId === t.leaderId);
  return g ? (HOTELS.find(h => h.id === g.hotelId) || null) : null;
}

/* ============================================================
   جدول مهام الحجّ — بفلاتره الكاملة
   ============================================================ */
const optKinds  = () => Object.keys(CAT).map(k => [k, CAT[k].ar]);
const optStates = () => Object.keys(TSTATE).map(k => [k, TSTATE[k].ar]);
const optTaskCities = () => [...new Set(Object.keys(CAT).map(k => CAT[k].city))].map(c => [c, c]);
const optCountries  = () => [...new Set(V.orgs.map(o => o.country).filter(Boolean))].map(c => [c, c]);

/* المدى الزمني: حقلا تاريخ يمرّان على نفس مستمع الفلاتر */
/* قناع التاريخ يرسمه المتصفّح في ظلّ DOM لا نملكه، وبالعربية ينعكس ترتيب
   حروفه فيُقرأ رطانةً («موي/رهش/قنس»). فنُخفي قناعه ونكتب القيمة بأنفسنا،
   ونُبقي الحقل شفّافًا فوقها ليفتح منتقي المتصفّح عند النقر. */
function dayField(key, k, label) {
  const v = fOf(key, k), p = String(v || '').split('-');
  const shown = p.length === 3 ? AR(+p[2]) + ' / ' + AR(+p[1]) + ' / ' + AR(+p[0]) : 'اختر يومًا';
  return '<label class="fsel fdate' + (v ? ' on' : '') + '"><span>' + E(label) + '</span>' +
    '<b class="dv">' + shown + '</b>' +
    '<input type="date" data-f="' + key + '" data-fk="' + k + '" value="' + E(v) + '">' +
    '</label>';
}
const dnum = s => { const p = String(s || '').split('-'); return p.length === 3 ? Date.UTC(+p[0], +p[1] - 1, +p[2]) : 0; };
const dkey = ts => { const d = new Date(ts); return d.getFullYear() + '-' +
  String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

function tabHajj() {
  const K = 'tsk';
  const all = V.tasks.slice().sort((a, b) => a.start - b.start);
  all.forEach(ensureTask);
  const q = qOf(K);
  let list = all;

  const g = k => fOf(K, k);
  if (g('kind'))  list = list.filter(t => t.kind === g('kind'));
  if (g('state')) list = list.filter(t => tState(t) === g('state'));
  if (g('city'))  list = list.filter(t => t.city === g('city'));
  if (g('kt'))    list = list.filter(t => t.kt === g('kt'));
  if (g('org'))   list = list.filter(t => t.orgId === g('org'));
  if (g('lead'))  list = list.filter(t => t.leaderId === g('lead'));
  if (g('country')) list = list.filter(t => (orgById(t.orgId) || {}).country === g('country'));
  if (g('day'))   list = list.filter(t => dkey(t.start) === g('day'));
  if (g('from'))  list = list.filter(t => t.start >= dnum(g('from')));
  if (g('to'))    list = list.filter(t => t.start <= dnum(g('to')) + DAY);
  if (q) list = list.filter(t => (t.title + ' ' + t.kt + ' ' + t.place + ' ' + t.city + ' ' +
    ((userById(t.leaderId) || {}).name || '')).indexOf(q) >= 0);

  const seg = S.tab.tf || 'all';
  if (seg === 'today') list = list.filter(t => dayStart(t.start) === dayStart(now()));
  else if (seg === 'live') list = list.filter(t => tState(t) === 'live');
  else if (seg === 'next') list = list.filter(t => ['next','soon'].indexOf(tState(t)) >= 0);
  else if (seg === 'risk') list = list.filter(t => ['late','over'].indexOf(tState(t)) >= 0);
  else if (seg === 'done') list = list.filter(t => t.status === 'done');

  const rated = all.filter(t => t.rating);
  const avg = rated.length ? (rated.reduce((a, t) => a + t.rating, 0) / rated.length).toFixed(1) : '0.0';
  const nPrep = all.filter(t => prepPct(t) < 100 && t.status !== 'done').length;
  const unAll = all.reduce((n, t) => n + unseenAlerts(t), 0);

  return '<div class="grid g4">' +
      stat({ label:'مهام الموسم', n:all.length, ic:'i-tasks',
        sub:'المصدر الذي يقرأ منه التطبيق', series:[12,24,36,44,50,55,58,all.length] }) +
      stat({ label:'جارية الآن', n:all.filter(t => tState(t) === 'live').length, ic:'i-play',
        cls:'up', sub:'أخضر على الطرف', series:[0,1,2,1,3,2,1,Math.max(1, all.filter(t => tState(t) === 'live').length)] }) +
      stat({ label:'استعدادٌ ناقص', n:nPrep, ic:'i-shield', cls:nPrep ? 'down' : 'up',
        sub:'شروطٌ لم يُشيَّك عليها', series:[9,8,10,7,6,8,5,Math.max(1, nPrep)] }) +
      stat({ label:'منجزة', n:all.filter(t => t.status === 'done').length, ic:'i-checkc',
        cls:'up', sub:'بمتوسط تقييم ' + AR(avg), series:[4,9,14,19,23,26,28,30] }) +
    '</div>' +

    '<div class="card">' +
      head('جدول مهام الحجّ', 'كلّ ما في التطبيق — وزيادةُ ما يملكه الكنترول',
        '<button class="bellbtn' + (unAll ? ' has' : '') + '" data-a="alerts" ' +
          'aria-label="تنبيهات المهام">' + icon('i-bell','s16') +
          (unAll ? '<i>' + AR(unAll) + '</i>' : '') + '</button>' +
        pill(AR(list.length) + ' معروضة', 'gold'), 'i-kaaba') +

      '<div class="tools">' + segmented('tf',
        [['all','الكل'],['today','اليوم'],['live','جارية'],['next','قادمة'],['risk','متعثّرة'],['done','منجزة']], seg) +
      '</div>' +

      filterBar(K, [
        { k:'kind',    label:'نوع المهمة', opts:optKinds() },
        { k:'state',   label:'الحالة',     opts:optStates() },
        { k:'city',    label:'المدينة',    opts:optTaskCities() },
        { k:'kt',      label:'الـKT',      opts:optKT() },
        { k:'org',     label:'الجهة',      opts:optOrgs() },
        { k:'country', label:'الدولة',     opts:optCountries() },
        { k:'lead',    label:'الليدر',     opts:optLeaders() }
      ], list.length, all.length, 'ابحث باسم المهمة أو الليدر أو المكان…') +

      '<div class="fbar">' + dayField(K, 'day', 'يومٌ بعينه') +
        dayField(K, 'from', 'من تاريخ') + dayField(K, 'to', 'إلى تاريخ') +
        '<span class="fsp"></span>' +
        '<span class="tiny faint">الألوان على طرف كل صفّ: ' +
          Object.keys(TSTATE).filter(k => k !== 'cancelled').map(k =>
            '<i class="lgd" style="background:' + TSTATE[k].c + '"></i>' + TSTATE[k].ar).join(' · ') +
        '</span>' +
      '</div>' +

      (list.length ? pagedList(list, 'tsk', taskRow)
        : empty('لا مهام بهذه الفلاتر', 'امسح الفلاتر أو غيّر التصنيف', 'i-cal')) +
    '</div>';
}

/* ---------- قائمة مرقّمة: ثمانية وثمانون ومئتان في صفحة واحدة تُثقل كل ضغطة ----------
   الصفحة تُعيد رسم ما تراه فقط. والعدّاد يقول أين أنت من الكلّ. */
const PAGE = 40;
const pageOf = key => Math.max(0, (S.page && S.page[key]) || 0);
function pagedList(list, key, rowFn) {
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const p = Math.min(pageOf(key), pages - 1);
  const slice = list.slice(p * PAGE, p * PAGE + PAGE);
  return '<div class="plist">' + slice.map(rowFn).join('') + '</div>' +
    (pages > 1 ? '<div class="pager">' +
      '<button class="pgb" data-a="pg" data-k="' + key + '" data-v="' + (p - 1) +
        '"' + (p === 0 ? ' disabled' : '') + '>' + icon('i-fwd','s14') + 'السابق</button>' +
      '<span class="pgn">' + Array.from({ length: pages }, (_, i) => i)
        .filter(i => i === 0 || i === pages - 1 || Math.abs(i - p) <= 2)
        .map((i, k, a) => (k && i - a[k - 1] > 1 ? '<span class="pgd">…</span>' : '') +
          '<button class="pgi' + (i === p ? ' on' : '') + '" data-a="pg" data-k="' + key +
          '" data-v="' + i + '">' + AR(i + 1) + '</button>').join('') + '</span>' +
      '<button class="pgb" data-a="pg" data-k="' + key + '" data-v="' + (p + 1) +
        '"' + (p >= pages - 1 ? ' disabled' : '') + '>التالي' + icon('i-back','s14') + '</button>' +
      '<span class="pgc">' + AR(p * PAGE + 1) + '–' + AR(Math.min(list.length, (p + 1) * PAGE)) +
        ' من ' + AR(list.length) + '</span>' +
    '</div>' : '');
}

/* ============================================================
   درج المهمّة — كلّ عناصرها
   ============================================================ */
const txOpen = (t, k) => !!(S.open && S.open['tx:' + t.id + ':' + k]);
function txFold(t, key, title, sub, body, ic, right) {
  const on = txOpen(t, key);
  return '<div class="xfold' + (on ? ' on' : '') + '">' +
    '<button class="xh" data-a="txfold" data-id="' + t.id + '" data-v="' + key + '">' +
      icon(ic || 'i-list','s16') +
      '<span class="sp"><b>' + title + '</b>' + (sub ? '<span class="tiny faint">' + sub + '</span>' : '') + '</span>' +
      (right || '') + icon('i-down','s16') + '</button>' +
    (on ? '<div class="xb">' + body + '</div>' : '') + '</div>';
}

function taskDrawer(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {}, org = orgById(t.orgId) || {};
  const st = tsOf(t), gd = guideForTask(t);
  const team = t.assigned.map(userById).filter(Boolean);
  const sp = (V.support || []).filter(s => s.taskId === t.id);
  const tks = taskTickets(t);
  const don = subPct(t), pre = prepPct(t);
  const closed = ['done','cancelled'].indexOf(t.status) >= 0;
  const live = tState(t) === 'live';

  S.drawer = {
    /* عنوان الدرج نصٌّ لا ترميز — renderDrawer يهرّبه، فالوسم يظهر حرفيًّا */
    title: t.title, sub: t.kt + ' · ' + (L.name || '') + ' · #' + t.code,
    icon: c.i || 'i-tasks', wide: !!S.dwide, expand: t.id, report: t.id,
    body:

    /* ── الرأس: الحالة والنسب والبيانات ── */
    '<div class="card xtop" style="--kc:' + st.c + '">' +
      '<div class="h"><span class="ico" style="color:' + st.c + '">' + icon(st.i,'s18') + '</span>' +
        '<span class="sp"><b>' + E(st.ar) + '</b>' +
        '<div class="tiny faint">' + E(t.desc || '') + '</div></span>' +
        pill(untilTxt(t.start), 'grey') + '</div>' +

      '<div class="xrings">' +
        '<span class="xr">' + ring(pre, pre === 100 ? 'var(--ok)' : 'var(--gold2)', 54) +
          '<span><b>الاستعداد المسبق</b><span class="tiny faint">' +
          AR(reqIn(t,'pre').filter(r => r.done).length) + ' من ' + AR(reqIn(t,'pre').length) + ' شرطًا</span></span></span>' +
        '<span class="xr">' + ring(don, don === 100 ? 'var(--ok)' : st.c, 54) +
          '<span><b>إنجاز المهمة</b><span class="tiny faint">' +
          AR(t.subs.filter(s => s.done).length) + ' من ' + AR(t.subs.length) + ' خطوة</span></span></span>' +
      '</div>' +

      '<div class="grid g2" style="gap:10px;margin-top:14px">' +
        '<span><div class="tiny faint">التاريخ</div><b>' + dayName(t.start) + ' · ' + hijri(t.start) + '</b></span>' +
        '<span><div class="tiny faint">الوقت</div><b class="num">' + t12(t.start) + ' — ' + t12(t.end) + '</b></span>' +
        '<span><div class="tiny faint">الجهة</div><b>' + E(org.ar || '') + ' · ' + E(org.type || '') + '</b></span>' +
        '<span><div class="tiny faint">الدولة</div><b>' + E(org.country || '—') + '</b></span>' +
        '<span><div class="tiny faint">المكان</div><b>' + E(t.place) + '</b></span>' +
        '<span><div class="tiny faint">المدينة</div><b>' + E(t.city) + '</b></span>' +
        '<span><div class="tiny faint">الفندق</div><b>' +
          E(taskHotel(t) ? taskHotel(t).ar : 'لم تُسكَّن مجموعته') + '</b></span>' +
        '<span><div class="tiny faint">مشرف الفندق</div><b>' +
          E(taskSup(t) ? taskSup(t).name : '—') + '</b></span>' +
        '<span><div class="tiny faint">حجاج المجموعة</div><b class="num">' + AR(taskPilgrims(t)) + '</b></span>' +
        '<span><div class="tiny faint">المدة</div><b class="num">' + AR(t.durH) + ' ساعات</b></span>' +
      '</div>' +

      (t.rating ? '<div style="margin-top:14px"><div class="tiny faint">تقييم المهمة</div>' +
        '<div class="meter gold" style="margin-top:6px"><i data-w="' + (t.rating / 5 * 100) + '"></i></div>' +
        '<div class="tiny num" style="margin-top:5px">' + AR(t.rating) + ' من ٥</div></div>' : '') +
      (t.autoStarted ? '<div class="evt bad" style="margin-top:14px"><span class="dot"></span>' +
        '<span class="sp"><b>بدأها النظام</b><p>لم يبدأها ليدرها في وقتها — تُحتسب في تقييمه.</p></span></div>' : '') +
      (t.closedBy === 'system' ? '<div class="evt bad" style="margin-top:10px"><span class="dot"></span>' +
        '<span class="sp"><b>أُغلقت من قبل النظام</b><p>' + E(t.closeWhy || 'أغلقها الكنترول') + '</p></span></div>' : '') +
    '</div>' +

    /* ── تحكّم الكنترول ── */
    '<div class="card gold">' +
      head('تحكّم الكنترول', 'ما يفعله الميدان تفعله الغرفة — ويُسجَّل باسم النظام', '', 'i-shield') +
      '<div class="grid g2" style="gap:8px">' +
        (!closed && !live ? '<button class="btn p sm" data-a="txstart" data-id="' + t.id + '">' +
          icon('i-play','s14') + 'بدء المهمة الآن</button>'
          : '<button class="btn l sm off" disabled>' + icon('i-play','s14') +
            (closed ? 'المهمة مغلقة' : 'المهمة جارية') + '</button>') +
        (!closed ? '<button class="btn l sm" data-a="txclose" data-id="' + t.id + '">' +
          icon('i-stop','s14') + 'إغلاق المهمة</button>'
          : '<button class="btn l sm" data-a="txreopen" data-id="' + t.id + '">' +
            icon('i-back','s14') + 'إعادة فتحها</button>') +
        '<button class="btn l sm" data-a="txassign" data-id="' + t.id + '">' +
          icon('i-assign','s14') + 'تسكين محسن</button>' +
        '<button class="btn l sm" data-a="txfilenew" data-id="' + t.id + '">' +
          icon('i-clip','s14') + 'رفع ملفّ أو عقد</button>' +
        '<button class="btn l sm" data-a="txreqnew" data-id="' + t.id + '">' +
          icon('i-shield','s14') + 'إضافة متطلّب</button>' +
        '<button class="btn l sm" data-a="txnote" data-id="' + t.id + '">' +
          icon('i-edit','s14') + 'ملاحظة</button>' +
      '</div>' +
      /* ثلاثة أبوابٍ إلى ما يراه الميدان: شاشته، وقيادته، وتقييمه */
      '<div class="grid g3" style="gap:8px;margin-top:8px">' +
        '<button class="btn p sm" data-a="trep" data-id="' + t.id + '">' +
          icon('i-report','s14') + 'تقرير المهمة</button>' +
        '<button class="btn l sm" data-a="avopen" data-id="' + t.id + '">' +
          icon('i-phone','s14') + 'كما تظهر في التطبيق</button>' +
        '<button class="btn l sm" data-a="avdelegopen" data-id="' + t.id + '">' +
          icon('i-shield','s14') + 'تفويض القيادة</button>' +
        '<button class="btn l sm" data-a="avrate" data-id="' + t.id + '">' +
          icon('i-star','s14') + 'تفصيل التقييم</button>' +
      '</div>' +
    '</div>' +

    /* ── ما قبل المهمّة: شروطٌ وملفّات في مكانٍ واحد ── */
    txFold(t, 'reqpre', REQ_PH.pre.ar, REQ_PH.pre.d,
      preBlock(t), REQ_PH.pre.i,
      ring(prepPct(t), prepPct(t) === 100 ? 'var(--live)' : REQ_PH.pre.c, 28)) +

    /* ── المهام الفرعية ── */
    txFold(t, 'subs', 'المهام الفرعية',
      AR(t.subs.filter(s => s.done).length) + ' من ' + AR(t.subs.length) + ' · وصورُ إثباتها',
      (t.subs.length ? '<div class="xsubs">' + t.subs.map(s =>
        '<div class="xsub' + (s.done ? ' on' : '') + '">' +
          '<button class="xt" data-a="txsub" data-id="' + t.id + '" data-s="' + s.id + '">' +
            '<span class="tick">' + (s.done ? icon('i-check','s13') : AR(s.no)) + '</span>' +
            '<span class="sp"><b>' + E(s.name) + '</b>' +
            (s.done ? '<span class="tiny faint">' + t12(s.at) + ' · ' +
                E((userById(s.by) || {}).name || 'النظام') + '</span>' : '') + '</span>' +
          '</button>' + shotTile(s, t.id) +
        '</div>').join('') + '</div>'
        : '<div class="tiny faint">لا خطوات لهذا التصنيف.</div>'),
      'i-list', ring(don, don === 100 ? 'var(--ok)' : st.c, 28)) +

    /* ── المسكَّنون ── */
    txFold(t, 'team', 'المحسنون على المهمة',
      AR(team.length) + ' مسكَّنًا · ' + AR(t.attended.length) + ' أثبتوا حضورهم',
      (team.length ? '<div class="rows">' + team.map(m =>
        '<div class="row" style="padding:9px 4px">' + avatar(m) +
        '<span class="nm" style="flex:1"><b>' + E(m.name) + '</b><span>' + E(m.specialty || '') +
          (m.reserve ? ' · احتياط' : '') + '</span></span>' +
        '<button class="chipbtn' + (t.attended.indexOf(m.id) >= 0 ? ' on' : '') + '" ' +
          'data-a="txattend" data-id="' + t.id + '" data-s="' + m.id + '">' +
          icon(t.attended.indexOf(m.id) >= 0 ? 'i-checkc' : 'i-target','s13') +
          (t.attended.indexOf(m.id) >= 0 ? 'حاضر' : 'إثبات حضوره') + '</button>' +
        '<button class="chipbtn" data-a="txswap" data-id="' + t.id + '" data-s="' + m.id + '">' +
          icon('i-swap','s13') + 'استبدال</button>' +
        '<button class="chipbtn bad" data-a="txunassign" data-id="' + t.id + '" data-s="' + m.id + '">' +
          icon('i-x','s13') + 'سحب</button>' +
        '</div>').join('') + '</div>'
        : '<div class="tiny faint">لا أحد على هذه المهمة بعد.</div>') +
      '<button class="btn l sm" style="width:100%;margin-top:11px" data-a="txassign" data-id="' + t.id + '">' +
        icon('i-assign','s14') + 'تسكين محسن — ومعهم الاحتياط</button>',
      'i-users', pill(AR(team.length), 'grey')) +


    /* ── دليل التنفيذ ── */
    txFold(t, 'guide', 'دليل التنفيذ',
      gd ? (gd.taskId ? 'دليل خاصّ بهذه المهمّة' : 'دليل تصنيفها') : 'لا دليل — تُنفَّذ بلا مرجع',
      (gd ? '<div class="prow" data-a="gdview" data-id="' + gd.id + '">' +
        '<span class="ico" style="color:var(--gold2)">' + icon('i-guide','s16') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(gd.title) + '</b>' +
        '<span>' + AR((gd.steps||[]).length) + ' خطوة · ' + AR((gd.media||[]).length) +
        ' وسيطًا · ن' + AR(gd.ver) + '</span></span>' +
        (gd.taskId ? pill('خاصّ','gold') : pill('بالتصنيف','grey')) + '</div>'
        : '<div class="tiny faint">لا دليل لتصنيف هذه المهمّة بعد.</div>') +
      '<button class="btn l sm" style="width:100%;margin-top:11px" data-a="tguide" data-id="' + t.id + '">' +
        icon('i-guide','s14') + (gd && gd.taskId ? 'تغيير الدليل الخاصّ' : 'ربط دليل بهذه المهمّة') + '</button>',
      'i-guide') +


    /* ── طلبات الدعم ── */
    (sp.length ? txFold(t, 'sup', 'طلبات الدعم', AR(sp.length) + ' طلبًا من ليدر المجموعة',
      sp.map(s => '<div class="evt ' + (s.state === 'done' ? 'ok' : s.state === 'pending' ? 'warn' : 'bad') + '">' +
        '<span class="dot"></span><span class="sp"><b>' + LTR(s.no) + ' — ' + AR(s.count) + ' محسن</b>' +
        '<p>' + E(s.why) + (s.reason ? '<br>ردّك: ' + E(s.reason) : '') + '</p></span></div>').join(''),
      'i-send') : '') +

    /* ── الوارد: التذاكر والتنبيهات سواء ──
       كلاهما رسالةٌ وصلت من الميدان على هذه المهمّة، ففصلُهما في
       صندوقين كان يجعلك تفتح اثنين لتعرف ما جدّ. */
    (inbox(t).length ? txFold(t, 'inbox', 'الوارد على المهمة',
      AR(tks.length) + ' تذكرة · ' + AR(taskAlerts(t).length) + ' تنبيهًا',
      '<div class="alist">' + inbox(t).map(inRow).join('') + '</div>' +
      (unseenAlerts(t) ? '<button class="btn l sm" style="width:100%;margin-top:11px" ' +
        'data-a="alseen" data-id="' + t.id + '">' + icon('i-checkc','s14') +
        'وسمُ الكلّ مقروءًا</button>' : ''),
      'i-bell', inboxNew(t) ? pill(AR(inboxNew(t)), 'no')
        : pill(AR(inbox(t).length), 'grey')) : '') +

    /* ── الملاحظات ── */
    txFold(t, 'notes', 'ملاحظات المهمة', AR(t.notes.length) + ' ملاحظة',
      (t.notes.length ? t.notes.map(n =>
        '<div class="evt ' + (n.kind === 'auto' ? 'warn' : 'info') + '"><span class="dot"></span>' +
        '<span class="sp"><b>' + E(n.by || 'الكنترول') + '</b><p>' + E(n.text) + '</p>' +
        '<span class="tiny faint">' + t12(n.at) + ' · ' + hijri(n.at) + '</span></span></div>').join('')
        : '<div class="tiny faint">لا ملاحظات.</div>') +
      '<button class="btn l sm" style="width:100%;margin-top:11px" data-a="txnote" data-id="' + t.id + '">' +
        icon('i-edit','s14') + 'إضافة ملاحظة</button>',
      'i-edit', pill(AR(t.notes.length), 'grey')) +

    /* ── السجلّ ── */
    txFold(t, 'hist', 'سجلّ المهمة', AR(t.hist.length) + ' واقعة — من إنشائها إلى إغلاقها',
      histLog(t.hist), 'i-hist') +

    '<button class="btn l" data-a="go" data-n="tasks">' + icon('i-tasks','s16') + 'عرض في جدول المهام</button>'
  };
  renderDrawer();
}

/* ============================================================
   نماذج صغيرة داخل الدرج
   ============================================================ */

/* إضافة متطلّب */
function txReqNew(id, ph) {
  const t = ensureTask(taskById(id)); if (!t) return;
  S.txq = S.txq || {};
  const cur = S.txq.ph || ph || 'pre';
  S.drawer = { title:'إضافة متطلّب', sub:t.title, icon:'i-shield', wide:false, body:
    '<div class="card">' + head('المرحلة', 'متى يُتحقَّق من هذا الشرط؟') +
      '<div class="grid g3" style="gap:8px">' + REQ_PHS.map(p =>
        '<button class="chipbtn' + (p === cur ? ' on' : '') + '" data-a="txreqph" data-id="' + id +
          '" data-v="' + p + '">' + icon(REQ_PH[p].i,'s13') + REQ_PH[p].ar + '</button>').join('') + '</div>' +
      '<label class="fl2">نصّ الشرط</label>' +
      '<input class="fld" id="q-txrq" data-q="txrq" value="' + E(qOf('txrq')) +
        '" placeholder="مثال: عقد النقل ساري والحافلات مؤكّدة">' +
    '</div>' +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="txreqsave" data-id="' + id + '">' + icon('i-check','s16') + 'إضافة</button>' +
      '<button class="btn l" data-a="tlopen" data-id="' + id + '">إلغاء</button></div>' };
  renderDrawer();
}

/* ربط قالب متطلّبات */
function txTplPick(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const tpl = S.reqtpl || [];
  S.drawer = { title:'ربط قالب متطلّبات', sub:t.title, icon:'i-list', wide:false, body:
    '<div class="note b">' + icon('i-info','s16') +
      '<span>القالب يُضيف شروطه الثلاث مراحل دفعةً واحدة. وما كان موجودًا لا يُكرَّر.</span></div>' +
    (tpl.length ? '<div class="plist">' + tpl.map(x =>
      '<div class="prow" data-a="txtplpick" data-id="' + id + '" data-s="' + x.id + '">' +
        '<span class="ico" style="color:var(--gold2)">' + icon('i-list','s16') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(x.name) + '</b><span>' +
          REQ_PHS.map(p => AR(x.items.filter(i => i.ph === p).length) + ' ' + REQ_PH[p].ar).join(' · ') +
        '</span></span>' + (x.kind === t.kind ? pill('يطابق تصنيفها','gold') : '') + '</div>').join('') + '</div>'
      : empty('لا قوالب بعد', 'أضِف الشروط يدويًّا', 'i-list')) +
    '<button class="btn l" data-a="tlopen" data-id="' + id + '">رجوع</button>' };
  renderDrawer();
}

/* رفع ملفّ أو عقد */
function txFileNew(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const kind = S.txq && S.txq.fk ? S.txq.fk : 'extra';
  S.drawer = { title:'رفع ملفّ على المهمة', sub:t.title, icon:'i-clip', wide:false, body:
    '<div class="note b">' + icon('i-info','s16') +
      '<span>الكنترول يرفع ما شاء من الملفات والعقود على أي مهمة — بلا حدّ عدد.</span></div>' +
    '<div class="card">' + head('النوع', 'عقدٌ إضافي أم ملفّ مساند؟') +
      '<div class="grid g2" style="gap:8px">' +
        '<button class="chipbtn' + (kind === 'contract' ? ' on' : '') + '" data-a="txfk" data-id="' + id +
          '" data-v="contract">' + icon('i-file','s13') + 'عقد</button>' +
        '<button class="chipbtn' + (kind === 'extra' ? ' on' : '') + '" data-a="txfk" data-id="' + id +
          '" data-v="extra">' + icon('i-clip','s13') + 'ملفّ مساند</button>' +
      '</div>' +
      '<label class="fl2">اسم الملف</label>' +
      '<input class="fld" id="q-txfn" data-q="txfn" value="' + E(qOf('txfn')) +
        '" placeholder="مثال: ملحق عقد النقل — حافلة إضافية">' +
      '<label class="fl2">وصف مختصر</label>' +
      '<input class="fld" id="q-txfd" data-q="txfd" value="' + E(qOf('txfd')) +
        '" placeholder="ما الذي يثبته هذا الملف؟">' +
      '<div style="margin-top:12px">' + filePick('txf') + '</div>' +
    '</div>' +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="txfilesave" data-id="' + id + '">' + icon('i-check','s16') + 'رفع</button>' +
      '<button class="btn l" data-a="tlopen" data-id="' + id + '">إلغاء</button></div>' };
  renderDrawer();
}

/* ملاحظة */
function txNoteNew(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  S.drawer = { title:'ملاحظة على المهمة', sub:t.title, icon:'i-edit', wide:false, body:
    '<div class="card">' + head('نصّ الملاحظة', 'تُقرأ في التطبيق كما تُقرأ هنا') +
      '<textarea class="fld" id="q-txnt" data-q="txnt" rows="5" ' +
        'placeholder="اكتب ما يجب أن يعرفه الليدر وفريقه…">' + E(qOf('txnt')) + '</textarea>' +
    '</div>' +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="txnotesave" data-id="' + id + '">' + icon('i-check','s16') + 'حفظ</button>' +
      '<button class="btn l" data-a="tlopen" data-id="' + id + '">إلغاء</button></div>' };
  renderDrawer();
}

/* إغلاق المهمة بسبب مكتوب */
function txCloseAsk(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  S.drawer = { title:'إغلاق المهمة', sub:t.title, icon:'i-stop', wide:false, body:
    '<div class="note a">' + icon('i-warn','s16') +
      '<span>ستُسجَّل <b>«مغلقة من قبل النظام»</b> لا باسم ليدرها — والسبب يظهر في سجلّها.</span></div>' +
    '<div class="card">' + head('سبب الإغلاق', 'يُقرأ في التطبيق وفي السجلّ') +
      '<textarea class="fld" id="q-txcw" data-q="txcw" rows="4" ' +
        'placeholder="مثال: أُنجزت ميدانيًّا ولم يُغلقها ليدرها.">' + E(qOf('txcw')) + '</textarea>' +
      '<div class="tiny faint" style="margin-top:9px">إنجاز الخطوات الآن: ' +
        AR(subPct(t)) + '٪ — وما لم يُنجز يبقى مفتوحًا في التقرير.</div>' +
    '</div>' +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="txclosedo" data-id="' + id + '">' + icon('i-stop','s16') + 'إغلاقها</button>' +
      '<button class="btn l" data-a="tlopen" data-id="' + id + '">إلغاء</button></div>' };
  renderDrawer();
}

/* معاينة صورة الإثبات */
function txPhoto(tid, sid) {
  const t = ensureTask(taskById(tid)); if (!t) return;
  const s = t.subs.find(x => x.id === sid); if (!s || !s.shot) return;
  S.drawer = { title:'إثبات التنفيذ', sub:s.name, icon:'i-camera', wide:!!S.dwide, expand:tid, body:
    '<div class="shotbig bgw-' + s.shot.img + '"></div>' +
    '<div class="card">' +
      '<div class="grid g2" style="gap:10px">' +
        '<span><div class="tiny faint">الخطوة</div><b>' + E(s.name) + '</b></span>' +
        '<span><div class="tiny faint">وقت التوثيق</div><b class="num">' + t12(s.shot.at) + '</b></span>' +
        '<span><div class="tiny faint">من رفعها</div><b>' +
          E((userById(s.shot.by) || {}).name || 'الميدان') + '</b></span>' +
        '<span><div class="tiny faint">المهمة</div><b>' + E(t.title) + '</b></span>' +
      '</div></div>' +
    '<button class="btn l" data-a="tlopen" data-id="' + tid + '">رجوع إلى المهمة</button>' };
  renderDrawer();
}

/* ---------- السجلّ: الأحدث أوّلًا، مجموعًا بأيّامه ----------
   كان صفًّا واحدًا طويلًا بلا ترتيبٍ ظاهر، فلم يُقرأ. الآن: يومٌ عنوانًا،
   وتحته وقائعه بأوقاتها في عمودٍ ثابت العرض فتصطفّ الأرقام. */
function histLog(list) {
  const rows = (list || []).slice().sort((a, b) => b.at - a.at);
  if (!rows.length) return '<div class="tiny faint">لا وقائع بعد.</div>';
  let out = '<div class="hislog">', day = null;
  rows.forEach(h => {
    const d = hijri(h.at);
    if (d !== day) { day = d; out += '<div class="hisday">' + dayName(h.at) + ' · ' + d + '</div>'; }
    out += '<div class="hisrow ' + (h.kind === 'warn' ? 'bad' : h.kind === 'ok' ? 'ok' : '') + '">' +
      '<span class="histm num">' + t12(h.at) + '</span>' +
      '<span class="histx">' + E(h.text) + '</span></div>';
  });
  return out + '</div>';
}

/* ---------- تسجيل واقعة في سجلّ المهمة ---------- */
function txLog(t, text, kind) {
  t.hist = t.hist || [];
  t.hist.unshift({ at: now(), text, kind: kind || 'info', by: 'النظام' });
}

/* ============================================================
   معاينة العقد — نصّه كما يقرأه الميدان في التطبيق
   ============================================================ */
function docView(t, k) {
  const d = DOCS[k]; if (!d) return;
  const o = orgById(t.orgId) || {}, L = userById(t.leaderId) || {};
  const n = taskPilgrims(t), buses = Math.max(1, Math.ceil(n / 45));
  const ref = d.ref + '-' + t.code + '-1447';
  const kv = (a, b2) => '<div class="dkv"><span>' + a + '</span><b>' + b2 + '</b></div>';

  const body = k === 'naql'
    ? '<h4>عقد نقل بري لحجاج بيت الله الحرام</h4>' +
      '<div class="dsub">موسم حج ' + AR(1447) + 'هـ · رقم العقد ' + LTR(ref) + '</div>' +
      '<p>إنه في يوم ' + dayName(t.start) + ' الموافق ' + hijri(t.start) +
      'هـ، تمّ الاتفاق بين كلٍّ من:</p>' +
      kv('الطرف الأول (الناقل)', 'شركة رواحل الحرمين للنقل البري') +
      kv('رقم الترخيص', LTR('NT-48210')) +
      kv('الطرف الثاني (المتعاقد)', E(o.ar || '')) +
      kv('الدولة', E(o.country || '—')) +
      kv('مجموعة الحجاج', LTR(t.kt) + ' · ' + AR(n) + ' حاجًّا') +
      kv('ليدر المجموعة', E(L.name || '')) +
      '<h5>أولًا: موضوع العقد</h5>' +
      '<p>يلتزم الطرف الأول بنقل حجاج الطرف الثاني برًّا وفق خط السير المعتمد أدناه، ' +
      'بحافلات مطابقة للاشتراطات الصادرة عن الهيئة العامة للنقل، وبسائقين مرخّصين لموسم الحج.</p>' +
      '<h5>ثانيًا: خط السير</h5>' +
      kv('نقطة الانطلاق', E(t.place)) +
      kv('الوجهة', 'فندق منازل المقام — مكة المكرمة') +
      kv('موعد التنفيذ', hijri(t.start) + 'هـ · ' + t12(t.start)) +
      kv('مدة الرحلة التقديرية', AR(t.durH) + ' ساعات') +
      kv('عدد الحافلات', AR(buses) + ' حافلة سعة ٤٥ راكبًا') +
      '<h5>ثالثًا: التزامات الناقل</h5><ol>' +
      '<li>حضور الحافلات إلى نقطة الانطلاق قبل الموعد بساعتين على الأقل.</li>' +
      '<li>أن تكون الحافلات مكيّفة ونظيفة ومزوّدة بمياه شرب باردة وحقيبة إسعافات.</li>' +
      '<li>ألّا يتجاوز عمر الحافلة خمس سنوات، وأن تحمل لوحة تعريفية بالمجموعة ورقمها.</li>' +
      '<li>الالتزام بالمسار المعتمد من مركز التحكم، وعدم التوقّف في غير النقاط المصرّح بها.</li>' +
      '<li>تسليم الحقائب في الوجهة وفق كشف مطابقة موقّع من مندوب الطرف الثاني.</li></ol>' +
      '<h5>رابعًا: الجزاءات</h5>' +
      '<p>يُخصم من قيمة العقد ما نسبته اثنان في المئة عن كل ساعة تأخير عن الموعد المحدّد، ' +
      'ويحقّ للطرف الثاني فسخ العقد عند تكرار المخالفة ثلاث مرّات في الموسم الواحد.</p>'
    : '<h4>عقد إيواء حجاج بيت الله الحرام</h4>' +
      '<div class="dsub">موسم حج ' + AR(1447) + 'هـ · رقم العقد ' + LTR(ref) + '</div>' +
      '<p>إنه في يوم ' + dayName(t.start) + ' الموافق ' + hijri(t.start) +
      'هـ، تمّ الاتفاق بين كلٍّ من:</p>' +
      kv('الطرف الأول (المؤجّر)', 'فندق منازل المقام — العزيزية') +
      kv('رقم رخصة الإيواء', LTR('LIC-31744')) +
      kv('الطرف الثاني (المستأجر)', E(o.ar || '')) +
      kv('الدولة', E(o.country || '—')) +
      kv('مجموعة الحجاج', LTR(t.kt) + ' · ' + AR(n) + ' حاجًّا') +
      kv('عدد الغرف', AR(Math.ceil(n / 4)) + ' غرفة رباعية') +
      '<h5>أولًا: مدة الإيواء</h5>' +
      kv('من', hijri(t.start) + 'هـ') +
      kv('إلى', hijri(t.start + 12 * DAY) + 'هـ') +
      '<h5>ثانيًا: التزامات المؤجّر</h5><ol>' +
      '<li>تسليم الغرف نظيفة ومجهّزة قبل وصول الحجاج بأربع ساعات.</li>' +
      '<li>توفير التكييف والماء الساخن والمصعد على مدار الساعة.</li>' +
      '<li>تخصيص غرفة مؤهّلة لذوي الاحتياج في الدور الأول.</li>' +
      '<li>توفير خزنة لحفظ الجوازات بمحضر تسليم واستلام.</li>' +
      '<li>الاستجابة لبلاغات الصيانة خلال ساعتين من رفعها.</li></ol>' +
      '<h5>ثالثًا: الجزاءات</h5>' +
      '<p>يُخصم من قيمة العقد ما يقابل ليلةً كاملة عن كل غرفة تُسلَّم غير مطابقة للمواصفات، ' +
      'ويحقّ للطرف الثاني نقل حجاجه على نفقة الطرف الأول عند تكرار الإخلال.</p>';

  S.drawer = { title: d.ar, sub: ref + ' · ' + t.title, icon: 'i-file', wide: !!S.dwide, expand: t.id, body:
    '<div class="doc">' + body +
      '<div class="dsign"><span><b>الطرف الأول</b><i></i></span>' +
      '<span><b>الطرف الثاني</b><i></i></span></div>' +
    '</div>' +
    '<button class="btn l" data-a="tlopen" data-id="' + t.id + '">' +
      icon('i-back','s16') + 'رجوع إلى المهمة</button>' };
  renderDrawer();
}

/* ============================================================
   تنبيهات المهمّة — ما يصل من التطبيق فيتبع مهمّته لا يتيه في بثٍّ عام

   الإشعار الذي يرسله المحسن أو يولّده النظام (تأخّر · إغلاق · تغيير ·
   انسحاب · دعم) كان يذهب إلى شاشة الإشعارات العامّة فينفصل عن سياقه.
   صار يتبع مهمّته: عدَدُه غير المقروء على صفّها، وتفصيله في درجها.
   ============================================================ */
const ALERT_KIND = {
  late:    { ar:'تأخّر',        i:'i-clock',  c:'#E67E22' },
  close:   { ar:'إغلاق',        i:'i-stop',   c:'#2E86C1' },
  change:  { ar:'تغيير',        i:'i-swap',   c:'#B8791A' },
  withdraw:{ ar:'انسحاب',       i:'i-out',    c:'#C0392B' },
  support: { ar:'طلب دعم',      i:'i-send',   c:'#6B4E9E' },
  attend:  { ar:'إثبات حضور',   i:'i-target', c:'#0B7A4B' },
  photo:   { ar:'توثيق',        i:'i-camera', c:'#1B6E9C' }
};
const taskAlerts = t => (t && t.alerts) || [];
const unseenAlerts = t => taskAlerts(t).filter(a => !a.seen).length;
const allAlerts = () => (V.tasks || []).reduce((a, t) =>
  a.concat(taskAlerts(t).map(x => Object.assign({ task: t }, x))), [])
  .sort((a, b) => b.at - a.at);

/* مشرف الفندق الذي تسكنه مجموعة المهمّة */
function taskSup(t) {
  const h = taskHotel(t); if (!h) return null;
  return (S.users || []).find(u => u.role === 'supervisor' && u.hotelId === h.id) || null;
}

/* بذر التنبيهات: تُبنى من وقائع المهمّة نفسها لا تُخترع */
function seedAlerts(st) {
  st.tasks.forEach((t, i) => {
    const a = [];
    const add = (kind, text, atOff, seen) => a.push({ id: uid('AL'), kind, text,
      at: t.start + atOff, by: t.leaderId, seen: !!seen });
    if (t.autoStarted) add('late', 'لم يبدأ الليدر المهمة في وقتها — بدأها النظام', 5 * MIN, false);
    if (t.attended.length) add('attend', AR(t.attended.length) + ' محسنين أثبتوا حضورهم',
      -40 * MIN, true);
    if (t.status === 'done') add('close', 'أُنهيت المهمة وأُغلق ملفّها', t.durH * HR, true);
    if (i % 5 === 2) add('change', 'غُيّر موعد التفويج ثلاثين دقيقة — أُبلغ الفريق', -2 * HR, false);
    if (i % 7 === 3) add('withdraw', 'طلب محسن الانسحاب لارتباطٍ بمهمة أخرى', -20 * HR, false);
    if (i % 11 === 4) add('support', 'طلب الليدر محسنين اثنين من الاحتياط', -26 * HR, false);
    if (i % 4 === 1 && t.subs.some(s => s.shot))
      add('photo', 'رُفعت صورة إثبات على خطوةٍ من خطوات المهمة', 90 * MIN, true);
    t.alerts = a.sort((x, y) => y.at - x.at);
  });
}

/* صفٌّ واحد من التنبيه */
function alertRow(al, t, withTask) {
  const k = ALERT_KIND[al.kind] || ALERT_KIND.change;
  return '<div class="alrow' + (al.seen ? ' seen' : '') + '" data-a="alopen" data-id="' +
      (t ? t.id : '') + '" data-s="' + al.id + '">' +
    '<span class="ali" style="color:' + k.c + ';background:color-mix(in srgb,' + k.c +
      ' 15%,transparent)">' + icon(k.i, 's15') + '</span>' +
    '<span class="alx"><b>' + E(al.text) + '</b>' +
      '<span class="tiny faint">' + E(k.ar) + ' · ' + t12(al.at) + ' · ' + untilTxt(al.at) +
      (withTask && t ? ' · ' + E(t.title) + ' — ' + LTR(t.kt) : '') + '</span></span>' +
    (al.seen ? '' : '<span class="aldot"></span>') + '</div>';
}

/* درج التنبيهات الواصلة — من أيقونة الجرس فوق جدول المهام */
function alertsDrawer() {
  const list = allAlerts();
  const un = list.filter(a => !a.seen);
  S.drawer = { title:'تنبيهات المهام', sub:'ما وصل من الميدان — كلٌّ تحت مهمّته',
    icon:'i-bell', wide:false, body:
    '<div class="card gold">' +
      head('الواصل الآن', un.length ? AR(un.length) + ' تنبيهًا لم يُقرأ بعد' : 'كلّها مقروءة',
        pill(AR(list.length) + ' إجمالًا', 'grey'), 'i-bell') +
      (un.length ? '<button class="btn l sm" style="width:100%;margin-top:6px" data-a="alall">' +
        icon('i-checkc','s14') + 'وسمُ الكلّ مقروءًا</button>' : '') +
    '</div>' +
    (un.length ? '<div class="card">' + head('لم يُقرأ', 'يحتاج نظرك', '', 'i-warn') +
      '<div class="alist">' + un.slice(0, 30).map(a => alertRow(a, a.task, true)).join('') +
      '</div></div>' : '') +
    '<div class="card">' + head('كلّ التنبيهات', 'الأحدث أوّلًا', '', 'i-hist') +
      (list.length ? '<div class="alist">' +
        list.slice(0, 60).map(a => alertRow(a, a.task, true)).join('') + '</div>'
        : empty('لا تنبيهات', 'الميدان هادئ', 'i-bell')) +
    '</div>' };
  renderDrawer();
}

/* ============================================================
   ما قبل المهمّة: الشرط والملفّ في مكانٍ واحد

   كان الشرط في مكان والعقد في مكان، فيُشيَّك على «عقد النقل ساري»
   ولا يُعرف أين العقد. صار كلّ شرطٍ يقبل الاثنين: علامةً تُرفع،
   وملفًّا يُرفَق، أو كليهما — ولا يُعدّ مستوفًى إلا بما اشتُرط فيه.
   ============================================================ */
function preBlock(t) {
  const reqs = reqIn(t, 'pre');
  const files = t.files || [];
  const loose = files.filter(f => !f.reqId);   /* ملفّاتٌ عامّة بلا شرط */
  return (reqs.length ? '<div class="reqs">' + reqs.map(r => {
    const rf = files.filter(f => f.reqId === r.id);
    const needF = r.needFile;
    const ok = r.done && (!needF || rf.length);
    return '<div class="req2' + (ok ? ' on' : '') + '">' +
      '<div class="rtop">' +
        '<button class="rtick' + (r.done ? ' on' : '') + '" data-a="txreq" data-id="' + t.id +
          '" data-s="' + r.id + '" aria-label="تحقّق">' +
          (r.done ? icon('i-check','s13') : '') + '</button>' +
        '<span class="sp"><b>' + E(r.text) + '</b>' +
          '<span class="tiny faint">' +
            (r.done ? 'شيَّك عليه ' + E(r.by || 'الكنترول') + ' · ' + t12(r.at)
                    : 'لم يُتحقَّق منه بعد') +
            (needF ? ' · <b style="color:var(--amber)">يلزمه ملفّ</b>' : '') +
          '</span></span>' +
        '<button class="rclip" data-a="txfilenew" data-id="' + t.id + '" data-s="' + r.id + '" ' +
          'aria-label="إرفاق ملفّ لهذا الشرط" title="إرفاق ملفّ">' + icon('i-clip','s14') +
          (rf.length ? '<i>' + AR(rf.length) + '</i>' : '') + '</button>' +
        '<button class="rneed' + (needF ? ' on' : '') + '" data-a="txreqneed" data-id="' + t.id +
          '" data-s="' + r.id + '" aria-label="اشتراط ملفّ" ' +
          'title="' + (needF ? 'لا يلزمه ملفّ' : 'اشترط ملفًّا') + '">' +
          icon('i-file','s13') + '</button>' +
        '<button class="rx2" data-a="txreqdel" data-id="' + t.id + '" data-s="' + r.id + '" ' +
          'aria-label="حذف">' + icon('i-x','s13') + '</button>' +
      '</div>' +
      (rf.length ? '<div class="rfiles">' + rf.map(f => fileRow(t, f)).join('') + '</div>' : '') +
      (needF && !rf.length ? '<div class="rwarn">' + icon('i-warn','s12') +
        'هذا الشرط لا يكتمل بالعلامة وحدها — أرفِق ملفّه.</div>' : '') +
    '</div>';
  }).join('') + '</div>'
    : '<div class="tiny faint" style="margin-top:12px">لا شروط بعد — أضِفها أو اربط قالبًا.</div>') +

  (loose.length ? '<div class="lbl2">ملفّاتٌ وعقودٌ عامّة على المهمّة</div>' +
    '<div class="rfiles">' + loose.map(f => fileRow(t, f)).join('') + '</div>' : '') +

  '<div class="grid g3" style="gap:8px;margin-top:13px">' +
    '<button class="btn l sm" data-a="txreqnew" data-id="' + t.id + '" data-v="pre">' +
      icon('i-plus','s14') + 'شرط جديد</button>' +
    '<button class="btn l sm" data-a="txtpl" data-id="' + t.id + '">' +
      icon('i-list','s14') + 'ربط قالب</button>' +
    '<button class="btn l sm" data-a="txfilenew" data-id="' + t.id + '">' +
      icon('i-clip','s14') + 'ملفّ أو عقد</button>' +
  '</div>';
}

function fileRow(t, f) {
  return '<div class="xfile">' +
    '<button class="fi" data-a="txfileopen" data-id="' + t.id + '" data-s="' + f.id + '">' +
      '<span class="ft">' + (/image/.test(f.type || '') ? icon('i-photo','s16') : '<b>PDF</b>') + '</span>' +
      '<span class="sp"><b>' + E(f.name) + '</b>' +
      '<span class="tiny faint">' + (f.ref ? LTR(f.ref) + ' · ' : '') + E(f.note || '') +
      ' · ' + E(f.by || 'الكنترول') + ' · ' + hijri(f.at) + '</span></span>' +
      (f.kind === 'contract' ? pill('عقد','gold') : pill('ملف','grey')) + '</button>' +
    '<button class="fx" data-a="txfiledel" data-id="' + t.id + '" data-s="' + f.id + '" ' +
      'aria-label="حذف">' + icon('i-x','s13') + '</button></div>';
}

/* الشرط لا يُعدّ مستوفًى إن اشتُرط فيه ملفٌّ ولم يُرفَق */
function prepDone(t) {
  const reqs = reqIn(t, 'pre');
  const files = t.files || [];
  return reqs.filter(r => r.done &&
    (!r.needFile || files.some(f => f.reqId === r.id))).length;
}

/* ---------- الوارد: تذكرةٌ وتنبيهٌ في صفٍّ واحد ---------- */
function inbox(t) {
  const tk = taskTickets(t).map(k => ({
    kind:'ticket', id:k.id, at:k.at, seen:k.status !== 'مفتوحة',
    text:k.title, from:k.from, no:k.no, pri:k.pri, st:k.status, ref:k
  }));
  const al = taskAlerts(t).map(a => ({
    kind:a.kind, id:a.id, at:a.at, seen:a.seen, text:a.text, alert:true
  }));
  return tk.concat(al).sort((a, b) => b.at - a.at);
}
const inboxNew = t => inbox(t).filter(x => !x.seen).length;

function inRow(x) {
  if (x.kind === 'ticket') {
    return '<div class="alrow' + (x.seen ? ' seen' : '') + '" data-a="tkopen2" data-id="' + x.id + '">' +
      '<span class="ali" style="color:#C0392B;background:color-mix(in srgb,#C0392B 15%,transparent)">' +
        icon('i-ticket','s15') + '</span>' +
      '<span class="alx"><b>' + E(x.text) + '</b>' +
        '<span class="tiny faint">تذكرة · ' + LTR(x.no) + ' · ' + E(x.from) + ' · ' +
        untilTxt(x.at) + '</span></span>' +
      pill(x.pri, x.pri === 'حرجة' ? 'no' : 'wait') +
      (x.seen ? '' : '<span class="aldot"></span>') + '</div>';
  }
  const k = ALERT_KIND[x.kind] || ALERT_KIND.change;
  return '<div class="alrow' + (x.seen ? ' seen' : '') + '" data-a="alseen1" data-s="' + x.id + '">' +
    '<span class="ali" style="color:' + k.c + ';background:color-mix(in srgb,' + k.c +
      ' 15%,transparent)">' + icon(k.i,'s15') + '</span>' +
    '<span class="alx"><b>' + E(x.text) + '</b>' +
      '<span class="tiny faint">' + E(k.ar) + ' · ' + t12(x.at) + ' · ' + untilTxt(x.at) +
      '</span></span>' +
    (x.seen ? '' : '<span class="aldot"></span>') + '</div>';
}

/* ============================================================
   تقرير تنفيذ المهمّة الآليّ — قبليّ وبعديّ

   يُبنى من وقائع المهمّة نفسها لا يُكتب يدويًّا: التوقيت والأداء،
   وتفصيل الفرعيّات، والحضور الميداني، والتذاكر المرتبطة، وطلبات
   الحجّاج، والتقييمات، وسجلّ تحديثات الكنترول.
   ويُصدَّر PDF (بالطباعة) أو إكسل أو صورة.
   ============================================================ */
const dmin = ms => (ms == null ? '—'
  : (ms < 0 ? '−' : '+') + AR(Math.abs(Math.round(ms / MIN))) + ' د');
const hm = ts => ts ? t12(ts) : '—';
const durTxt = ms => ms == null ? '—'
  : AR(Math.floor(ms / HR)) + ' س ' + AR(Math.round((ms % HR) / MIN)) + ' د';

function taskReport(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {};
  const sup = taskSup(t), h = taskHotel(t);
  const st = tsOf(t), r = rateOf(t);
  const team = t.assigned.map(userById).filter(Boolean);
  const tks = taskTickets(t);
  const subsDone = t.subs.filter(s => s.done).length;
  const shots = t.subs.filter(s => s.shot);
  const startAct = t.startedAt, endAct = t.endedAt;

  const row = cells => '<div class="rprow">' + cells.map(x =>
    '<span>' + x + '</span>').join('') + '</div>';
  const hrow = cells => '<div class="rphead">' + cells.map(x =>
    '<span>' + x + '</span>').join('') + '</div>';
  const sect = (title, sub2, body, cls) =>
    '<section class="rpsec' + (cls ? ' ' + cls : '') + '">' +
      '<h3>' + E(title) + (sub2 ? '<small>' + E(sub2) + '</small>' : '') + '</h3>' +
      body + '</section>';

  S.drawer = { title:'تقرير تنفيذ المهمة', sub:t.title + ' · ' + t.kt,
    icon:'i-report', paper:true, expand:t.id, body:

    '<div class="rpbar">' +
      '<button class="btn p sm" data-a="rpprint" data-id="' + t.id + '">' +
        icon('i-print','s14') + 'PDF / طباعة</button>' +
      '<button class="btn l sm" data-a="rpxl" data-id="' + t.id + '">' +
        icon('i-doc','s14') + 'إكسل</button>' +
      '<button class="btn l sm" data-a="rppng" data-id="' + t.id + '">' +
        icon('i-photo','s14') + 'صورة</button>' +
      '<span class="sp"></span>' +
      '<button class="btn l sm" data-a="tlopen" data-id="' + t.id + '">' +
        icon('i-back','s14') + 'رجوع</button>' +
    '</div>' +

    '<div class="report" id="rpdoc">' +
      '<header class="rphd">' +
        '<div><h2>تقرير تنفيذ المهمة الآلي</h2>' +
        '<div class="rpsub">' + E(t.title) + ' — ' + LTR(t.kt) + '</div></div>' +
        '<div class="rpst"><span class="tst" style="--tsc:' + st.c + '"><i></i>' +
          E(st.ar) + '</span>' +
          '<b class="num">' + AR(subPct(t)) + '٪</b>' +
          '<span class="tiny">نسبة الإنجاز</span></div>' +
      '</header>' +

      '<div class="rpmeta">' +
        '<span><i>وقت إصدار التقرير</i><b>' + hijri(now()) + ' · ' + t12(now()) + '</b></span>' +
        '<span><i>وقت آخر تحديث</i><b>' +
          ((t.hist || [])[0] ? hijri(t.hist[0].at) + ' · ' + t12(t.hist[0].at) : '—') + '</b></span>' +
        '<span><i>رقم المهمة</i><b>' + LTR('#' + t.code) + '</b></span>' +
        '<span><i>نافذة التقييم</i><b>' + hijri(t.end) + ' — ' + hijri(t.end + 3 * DAY) + '</b></span>' +
        '<span><i>الجهة</i><b>' + E((orgById(t.orgId) || {}).ar || '') + '</b></span>' +
        '<span><i>المكان</i><b>' + E(t.place) + '</b></span>' +
        '<span><i>الفندق</i><b>' + E(h ? h.ar : '—') + '</b></span>' +
        '<span><i>حجاج المجموعة</i><b class="num">' + AR(taskPilgrims(t)) + '</b></span>' +
      '</div>' +

      sect('فريق المهمة', '',
        '<div class="rptbl t3">' + hrow(['الدور','الاسم','الملاحظة']) +
        row(['المشرف', E(sup ? sup.name : '—'), E(h ? h.ar : '—')]) +
        row(['القائد', E(L.name || '—'), LTR(L.code || '')]) +
        row(['المحسنون', team.map(m => E(m.name)).join('، ') || '—',
             AR(team.length) + ' محسنًا']) + '</div>') +

      sect('التوقيت والأداء', 'الفرق بين المخطّط والواقع',
        '<div class="rptbl t6">' +
        hrow(['البيان','الوقت الأصلي','بعد التعديل','الوقت الفعلي','الفرق','المدة']) +
        row(['بدء المهمة', hm(t.start), hm(t.start), hm(startAct),
             dmin(startAct ? startAct - t.start : null),
             startAct && endAct ? durTxt(endAct - startAct) : '—']) +
        row(['انتهاء المهمة', hm(t.end), hm(t.end), hm(endAct),
             dmin(endAct ? endAct - t.end : null), durTxt(t.durH * HR)]) +
        '</div>') +

      sect('تفاصيل تنفيذ المهام الفرعية', AR(subsDone) + ' من ' + AR(t.subs.length) + ' منجزة',
        '<div class="rptbl t7">' +
        hrow(['المهمة الفرعية','الحالة','البدء الفعلي','وقت الإتمام','مدة التنفيذ',
              'الصورة المطلوبة','دليل التنفيذ']) +
        t.subs.map((s, i) => {
          const prev = i ? t.subs[i - 1] : null;
          const from = s.done ? (prev && prev.at ? prev.at : startAct || t.start) : null;
          return row([
            E(s.name),
            s.done ? '<b style="color:var(--live)">مكتملة</b>'
              : (i === t.subs.findIndex(x => !x.done) && tState(t) === 'live'
                 ? '<b style="color:var(--gold2)">جاري التنفيذ</b>'
                 : '<span style="color:var(--dim2)">لم تبدأ</span>'),
            s.done ? hm(from) : '—',
            s.done ? hm(s.at) : '—',
            s.done && from ? durTxt(s.at - from) : '—',
            s.shot ? '<b style="color:var(--live)">نعم — مرفوعة</b>'
              : (i % 3 === 0 ? '<span style="color:var(--red)">نعم — لم تُرفع</span>' : 'لا'),
            s.shot ? '<span style="color:var(--live)">' + t12(s.shot.at) + '</span>'
              : (i % 3 === 0 ? 'مطلوبة للإكمال' : '—')
          ]);
        }).join('') + '</div>' +
        '<div class="rpnote">ملاحظة: إذا كانت الصورة مطلوبة، لا يسمح النظام بإكمال المهمة ' +
        'الفرعية قبل رفع صورة واحدة.</div>') +

      '<div class="rp3">' +
      sect('الحضور الميداني', '',
        '<div class="rptbl t5">' +
        hrow(['الاسم','الدور','الوقت المطلوب','الحضور الفعلي','الفرق']) +
        row([E(L.name || '—'), 'قائد', hm(t.start - 2 * HR),
             t.leaderAttendedAt ? hm(t.leaderAttendedAt) : hm(t.start - 105 * MIN),
             dmin(-15 * MIN)]) +
        team.slice(0, 8).map((m, i) => {
          const was = t.attended.indexOf(m.id) >= 0;
          const act = was ? t.start - (90 - i * 9) * MIN : null;
          return row([E(m.name), 'محسن', hm(t.start - 2 * HR),
            was ? hm(act) : '<span style="color:var(--red)">لم يحضر</span>',
            was ? dmin(act - (t.start - 2 * HR)) : '—']);
        }).join('') + '</div>') +

      sect('التذاكر التشغيلية', 'مرتبطة بالمهمة الأساسية · العدد ' + AR(tks.length),
        '<div class="rptbl t5">' +
        hrow(['رقم التذكرة','المشكلة','وقت الفتح','وقت الإغلاق','الحالة']) +
        (tks.length ? tks.map(k => row([LTR(k.no), E(k.title), hm(k.at),
          k.status === 'مغلقة' ? hm(k.at + 3 * HR) : '—',
          E(k.status)])).join('')
          : row(['—','لم تُرفع تذاكر','—','—','—'])) + '</div>') +

      sect('طلبات الحجاج أثناء المهمة', 'العدد ' + AR(Math.max(0, tks.length - 1)),
        '<div class="rptbl t5">' +
        hrow(['رقم الطلب','اسم الحاج','الطلب','الإغلاق','الحالة']) +
        (tks.length > 1 ? tks.slice(1).map(k => row([LTR(k.no), E(k.from), E(k.cat),
          k.status === 'مغلقة' ? hm(k.at + 2 * HR) : '—', E(k.status)])).join('')
          : row(['—','لم ترد طلبات','—','—','—'])) + '</div>') +
      '</div>' +

      '<div class="rp2">' +
      sect('التقييمات', 'تُعرض منفصلة',
        '<div class="rptbl t2">' +
        row(['تقييم النظام', '<b class="num">' + AR(r.stars) + '</b> من ٥']) +
        row(['تقييم المشرف', '<b class="num">' + AR(Math.max(1, Math.min(5,
          Math.round((r.stars + 0.5) * 2) / 2))) + '</b> من ٥']) +
        row(['متوسط تقييم الحجاج', '<b class="num">' +
          AR(Math.max(1, Math.min(5, Math.round((r.stars - 0.5) * 2) / 2))) + '</b> من ٥']) +
        row(['عدد الحجاج المقيمين', '<b class="num">' +
          AR(Math.round(taskPilgrims(t) * 0.42)) + '</b>']) +
        row(['نسبة المشاركة', '<b class="num">٤٢٪</b>']) +
        '</div>') +

      sect('سجل تحديثات الكنترول', AR((t.hist || []).length) + ' قيدًا',
        '<div class="rptbl t5">' +
        hrow(['وقت التعديل','الحالة','القيمة السابقة','القيمة الجديدة','سبب التعديل']) +
        (t.hist || []).slice(0, 8).map(x => row([hm(x.at),
          x.kind === 'ok' ? 'إنجاز' : x.kind === 'warn' ? 'تنبيه' : 'تحديث',
          '—', E(x.text.slice(0, 40)), E(x.by || 'النظام')])).join('') + '</div>') +
      '</div>' +

      (shots.length ? sect('الصور المرفقة مع المهمة', AR(shots.length) + ' صورة',
        '<div class="rpshots">' + shots.map(s =>
          '<figure class="rpshot"><span class="bg-' + s.shot.img + '"></span>' +
          '<figcaption>' + E(s.name) + ' · ' + t12(s.shot.at) + '</figcaption></figure>').join('') +
        '</div>') : '') +

      sect('ملاحظات الكنترول والأرشفة', '',
        '<div class="rpfree">' +
          (t.notes.length ? t.notes.map(n => '<p><b>' + E(n.by || 'الكنترول') + ':</b> ' +
            E(n.text) + '</p>').join('') : '<p class="faint">لا ملاحظات مسجّلة على المهمة.</p>') +
          '<p class="rparch"><b>الأرشفة النهائية:</b> بعد مغادرة الحجاج وانتهاء نافذة التقييم — ' +
          hijri(t.end + 3 * DAY) + 'هـ.</p>' +
        '</div>') +

      '<footer class="rpft">' +
        '<span>نظام مُحسن · الكنترول — تقرير آليّ لا يحتاج توقيعًا</span>' +
        '<span>' + LTR('#' + t.code) + ' · ' + hijri(now()) + '</span>' +
      '</footer>' +
    '</div>' };
  renderDrawer();
}

/* ---------- تصدير التقرير ---------- */
function reportXl(t) {
  const L = userById(t.leaderId) || {}, sup = taskSup(t), h = taskHotel(t);
  const r = rateOf(t);
  const lines = [];
  const push = (a, b, c2, d2, e2, f2, g2) =>
    lines.push([a, b, c2, d2, e2, f2, g2].map(x => x == null ? '' : x));
  push('تقرير تنفيذ المهمة الآلي');
  push('المهمة', t.title); push('رقم المهمة', '#' + t.code); push('الـKT', t.kt);
  push('الحالة', tsOf(t).ar); push('نسبة الإنجاز', subPct(t) + '%');
  push('الفندق', h ? h.ar : '—'); push('المشرف', sup ? sup.name : '—');
  push('القائد', L.name || '—'); push('حجاج المجموعة', taskPilgrims(t));
  push('');
  push('التوقيت','البيان','الأصلي','بعد التعديل','الفعلي','الفرق (د)');
  push('', 'بدء المهمة', t12(t.start), t12(t.start), t.startedAt ? t12(t.startedAt) : '—',
    t.startedAt ? Math.round((t.startedAt - t.start) / MIN) : '');
  push('', 'انتهاء المهمة', t12(t.end), t12(t.end), t.endedAt ? t12(t.endedAt) : '—',
    t.endedAt ? Math.round((t.endedAt - t.end) / MIN) : '');
  push('');
  push('المهام الفرعية','الاسم','الحالة','وقت الإتمام','صورة');
  t.subs.forEach(s => push('', s.name, s.done ? 'مكتملة' : 'لم تبدأ',
    s.done ? t12(s.at) : '—', s.shot ? 'مرفوعة' : '—'));
  push('');
  push('الحضور','الاسم','الدور','المطلوب','الفعلي');
  t.assigned.map(userById).filter(Boolean).forEach(m =>
    push('', m.name, 'محسن', t12(t.start - 2 * HR),
      t.attended.indexOf(m.id) >= 0 ? 'حضر' : 'لم يحضر'));
  push('');
  push('التقييم','النظام', r.stars, 'التحضير', r.prep + '%', 'الخطوات', r.subs + '%');
  const csv = '﻿' + lines.map(l => l.map(csvCell).join(';')).join('\n');
  download('report-' + t.code + '.csv', csv);
}

/* صورة: نرسم الورقة داخل SVG بخاصيّة foreignObject ثم نحوّلها canvas */
function reportPng(t) {
  const el = document.getElementById('rpdoc');
  if (!el) { toast('افتح التقرير أوّلًا', 'r'); return; }
  const w = el.scrollWidth, h = el.scrollHeight;
  const styles = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const html = '<div xmlns="http://www.w3.org/1999/xhtml" dir="rtl">' +
    '<style>' + styles + '</style>' +
    '<div style="width:' + w + 'px;background:#fff">' + el.outerHTML + '</div></div>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
    '<foreignObject width="100%" height="100%">' + html + '</foreignObject></svg>';
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
    cx.drawImage(img, 0, 0);
    cv.toBlob(b => {
      if (!b) { toast('تعذّر توليد الصورة — استخدم الطباعة', 'r'); return; }
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = 'report-' + t.code + '.png';
      document.body.appendChild(a); a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 400);
      toast('نُزِّلت صورة التقرير');
    }, 'image/png');
  };
  img.onerror = () => toast('تعذّر توليد الصورة — استخدم الطباعة', 'r');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* PDF: نافذة طباعة تحمل الورقة وحدها بأنماطها */
function reportPrint(t) {
  const el = document.getElementById('rpdoc');
  if (!el) { toast('افتح التقرير أوّلًا', 'r'); return; }
  const styles = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const w = window.open('', '_blank');
  if (!w) { toast('اسمح بالنوافذ المنبثقة للطباعة', 'r'); return; }
  w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<title>تقرير ' + E(t.title) + '</title>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap">' +
    '<style>' + styles + '</style>' +
    '<style>html[data-theme]{--x:0}body{background:#fff;padding:22px;font-family:' +
    '"IBM Plex Sans Arabic",system-ui,sans-serif}' +
    '@page{size:A4;margin:12mm}.report{border:0!important;box-shadow:none!important}' +
    '.rpsec{break-inside:avoid}</style></head><body data-print="1">' +
    el.outerHTML + '</body></html>');
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 700);
}
