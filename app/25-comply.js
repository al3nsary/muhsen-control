/* ============================================================
   الشِفتات الحقيقية · وجدولة الامتثال · وملفّ الفندق

   المبدأ: لا تُسنَد مهمّة إلى من ليس في شِفته. فالإسناد إلى محسنٍ
   نائمٍ في بيته إسنادٌ على الورق لا في الميدان. ولذلك صار لكل محسن
   شِفتٌ معلوم، ولكل يومٍ سجلُّ حضور، والمنتقي لا يعرض إلا من يغطّي
   شِفتُه وقتَ المهمّة — ومن حضر فعلًا إن كان الوقت الآن.
   ============================================================ */

/* اسم اليوم مختصرًا — والقصّ بثلاثة أحرف يشوّه العربية («الأحد»→«الأح») */
const DAY_SHORT = ['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];

/* ---------- الشِفت: نافذة زمنية لا اسمٌ فقط ---------- */
const SHIFT_WIN = {
  'صباحية': { from: 6,  to: 14 },
  'مسائية': { from: 14, to: 22 },
  'ليلية':  { from: 22, to: 6  }   /* تعبر منتصف الليل */
};
const shiftName = i => SHIFTS[i % SHIFTS.length].k;

/* أي شِفت يغطّي هذه اللحظة؟ */
function shiftAt(ts) {
  const h = new Date(ts).getHours();
  const k = Object.keys(SHIFT_WIN).find(n => {
    const w = SHIFT_WIN[n];
    return w.from < w.to ? (h >= w.from && h < w.to) : (h >= w.from || h < w.to);
  });
  return k || 'صباحية';
}
const shiftOf = u => u && u.shift ? u.shift : 'صباحية';

/* مفتاح اليوم — سجلّ الحضور يُمسك به */
const dayKey = ts => {
  const d = new Date(ts);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};

/* هل أثبت حضوره في شِفت ذلك اليوم؟ */
function isPresent(uid_, ts) {
  const rec = (S.attend || {})[dayKey(ts) + '|' + shiftAt(ts)];
  return !!(rec && rec.indexOf(uid_) >= 0);
}
/* الغائب: في شِفته لكنه لم يحضر — ولا يصلح للإسناد الآن */
const isAbsent = (uid_, ts) => shiftOf(userById(uid_)) === shiftAt(ts) && !isPresent(uid_, ts);

/* من يغطّي شِفتُه هذا الوقت */
function onShift(ts, pool) {
  const sh = shiftAt(ts);
  return (pool || (V.users || []).filter(u => u.role === 'muhsen')).filter(u => shiftOf(u) === sh);
}

/* حِمل الشخص في نافذة ساعتين حول الوقت — لا نُثقل من هو مشغول */
function busyAt(uid_, ts) {
  const win = 2 * HR;
  const t = (S.tasks || []).some(x => (x.assigned || []).indexOf(uid_) >= 0 &&
    Math.abs(x.start - ts) < win);
  const c = (S.assigns || []).some(x => x.to === uid_ && x.at && Math.abs(x.at - ts) < win &&
    x.state !== 'منجزة');
  return t || c;
}

/* المرشّحون لوقتٍ بعينه: في الشِفت · حاضرون إن كان الوقت الآن · غير مشغولين */
function shiftCands(ts, pool) {
  const nowish = Math.abs(ts - now()) < 4 * HR;
  return onShift(ts, pool)
    .map(u => ({ u,
      present: isPresent(u.id, ts),
      busy: busyAt(u.id, ts),
      load: (S.assigns || []).filter(x => x.to === u.id && x.state !== 'منجزة').length }))
    .filter(x => !nowish || x.present)
    .sort((a, b) => (a.busy - b.busy) || (a.load - b.load))
    .map(x => x.u);
}

/* ---------- بذر الشِفتات والحضور ---------- */
function seedShifts(st) {
  const muh = st.users.filter(u => u.role === 'muhsen');
  /* توزيعٌ غير متساوٍ كالواقع: المسائية أثقل والليلية أخفّ */
  muh.forEach((u, i) => { u.shift = shiftName(i % 10 < 4 ? 0 : i % 10 < 8 ? 1 : 2); });
  st.users.filter(u => u.role === 'supervisor' || u.role === 'leader')
    .forEach((u, i) => { u.shift = shiftName(i % 3); });

  /* الحضور: اليوم وأمس — وبعضهم لم يحضر، وهذا ما يجعل النظام مفيدًا */
  st.attend = {};
  [0, -1].forEach(off => {
    const ts = Date.now() + off * DAY;
    SHIFTS.forEach(sh => {
      const key = dayKey(ts) + '|' + sh.k;
      const inShift = muh.filter(u => u.shift === sh.k);
      /* يغيب واحدٌ من كل تسعة */
      st.attend[key] = inShift.filter((u, i) => (i + off) % 9 !== 3).map(u => u.id);
    });
  });
}

/* ============================================================
   الامتثال: أرقام ومواعيد وأولويات
   ============================================================ */
const PRIO = {
  urgent: { ar:'عاجل',  c:'#C0392B', p:'no',   o:0 },
  high:   { ar:'هام',   c:'#E67E22', p:'wait', o:1 },
  mid:    { ar:'متوسط', c:'#B8791A', p:'gold', o:2 },
  low:    { ar:'عادي',  c:'#5A6C63', p:'grey', o:3 }
};
const prioOf = k => PRIO[k] || PRIO.mid;

const CMP_ST = {
  'بانتظار التعبئة': { p:'wait', c:'#D4A017' },
  'قيد التنفيذ':     { p:'live', c:'#16A34A' },
  'منجزة':           { p:'live', c:'#8A7A52' },
  'متأخّرة':         { p:'no',   c:'#C0392B' },
  'أُعيد إسنادها':   { p:'grey', c:'#2E86C1' }
};

/* رقم تصريح لكل جهة — يُسأل عنه في كل زيارة */
function permitOf(target) {
  const h = HOTELS.find(x => x.ar === target);
  if (h) return 'PR-' + (4400 + HOTELS.indexOf(h) * 7);
  const i = Math.abs(String(target).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 90;
  return 'PR-' + (4800 + i);
}

/* ---------- بذر الإسنادات: مجدولة، مرقّمة، ذات أولوية ---------- */
function seedComply(st) {
  st.assigns = st.assigns || [];
  const hotels = HOTELS.slice(0, 10);
  let n = 0;
  st.forms.forEach((f, fi) => {
    hotels.forEach((h, hi) => {
      if ((fi + hi) % 2) return;
      const when = Date.now() + ((hi - 4) * 8 + fi * 3) * HR;
      const gs = st.groups.filter(g => g.hotelId === h.id);
      const ids = [];
      gs.forEach(g => { ids.push(g.leaderId); g.members.forEach(m => ids.push(m.id)); });
      const pool = ids.map(x => st.users.find(u => u.id === x)).filter(Boolean);
      /* من هو في شِفت ذلك الموعد أوّلًا — وإلا فالإسناد على الورق */
      const sh = shiftAt(when);
      const inSh = pool.filter(u => (u.shift || 'صباحية') === sh);
      const from = inSh.length ? inSh : pool;
      const pick = from[(fi + hi) % Math.max(1, from.length)];
      if (!pick) return;
      n++;
      const past = when < Date.now();
      st.assigns.push({
        id: uid('A'), no: 'CA-' + (5100 + n), type: 'comply',
        formId: f.id, target: h.ar, hotelId: h.id,
        permit: permitOf(h.ar),
        to: pick.id, by: 'الكنترول',
        prio: ['urgent','high','mid','low'][(fi + hi) % 4],
        at: when, madeAt: when - 2 * DAY,
        shift: shiftAt(when),
        title: f.title + ' — ' + h.ar,
        sub: 'نموذج امتثال · ' + h.ar,
        state: past ? ((fi + hi) % 4 === 0 ? 'متأخّرة' : 'منجزة') : 'بانتظار التعبئة',
        subId: null, trail: [{ at: when - 2 * DAY, by:'الكنترول', text:'أُسند إلى ' + pick.name }]
      });
    });
  });
  /* الإسنادات المنجزة تُربط بإدخالاتها فيُقرأ أثرها */
  st.assigns.filter(a => a.state === 'منجزة').forEach((a, i) => {
    const cand = st.subs.filter(b => b.formId === a.formId && b.target === a.target);
    if (cand.length) { a.subId = cand[i % cand.length].id; a.by = a.to; }
  });
}

/* ============================================================
   ملفّ الفندق: الفورمز المعبّأة له، وتصنيفه، ونقاط ضعفه
   ============================================================ */
function hotelSubs(hid) {
  const h = HOTELS.find(x => x.id === hid); if (!h) return [];
  return (V.subs || []).filter(b => b.target === h.ar).sort((a, b) => b.at - a.at);
}
function hotelScore(hid) {
  const bs = hotelSubs(hid);
  return bs.length ? Math.round(bs.reduce((a, b) => a + b.score, 0) / bs.length) : null;
}
const GRADE = s => s == null ? { ar:'لم يُقيَّم', c:'var(--dim2)', p:'grey' }
  : s >= 90 ? { ar:'ممتاز', c:'#16A34A', p:'live' }
  : s >= 80 ? { ar:'جيد جدًّا', c:'#0B7A4B', p:'live' }
  : s >= 70 ? { ar:'جيد', c:'#B8791A', p:'gold' }
  : s >= 60 ? { ar:'مقبول', c:'#E67E22', p:'wait' }
  : { ar:'دون الحدّ', c:'#C0392B', p:'no' };

/* نقاط الضعف: السؤال الذي يتكرّر سقوطه على هذا الفندق */
function hotelWeak(hid) {
  const bs = hotelSubs(hid);
  const acc = {};
  bs.forEach(b => {
    const f = formById(b.formId); if (!f) return;
    (b.answers || []).forEach(an => {
      const q = f.qs.find(x => x.id === an.id);
      if (!q || !q.w) return;
      const key = f.id + '|' + q.id;
      acc[key] = acc[key] || { q: q.q, t: q.t, form: f.title, hit: 0, of: 0, sum: 0 };
      acc[key].of++;
      if (q.t === 'yn' || q.t === 'sign') { if (!an.v) acc[key].hit++; acc[key].sum += an.v ? 100 : 0; }
      else if (q.t === 'rate') { if (an.v <= 3) acc[key].hit++; acc[key].sum += an.v / 5 * 100; }
    });
  });
  return Object.keys(acc).map(k => Object.assign({ key: k }, acc[k],
    { pct: Math.round(acc[k].sum / Math.max(1, acc[k].of)) }))
    .sort((a, b) => (b.hit - a.hit) || (a.pct - b.pct));
}

/* ============================================================
   شاشة الامتثال — خمسة أبواب لا قائمةٌ واحدة
   ============================================================ */
function tabComply() {
  const seg = S.tab.cmp || 'hotels';
  const asg = (V.assigns || []).filter(a => a.type === 'comply');
  const late = asg.filter(a => a.state === 'متأخّرة').length;
  const open = asg.filter(a => a.state === 'بانتظار التعبئة').length;
  const done = asg.filter(a => a.state === 'منجزة').length;

  return '<div class="grid g4">' +
      stat({ label:'قوالب منشورة', n:V.forms.length, ic:'i-clip',
        sub:'تُبنى مرّة وتُسنَد مرارًا', series:[1,1,2,2,3,3,3,V.forms.length] }) +
      stat({ label:'مهام مُسنَدة', n:open, ic:'i-send', cls:open ? 'up' : '',
        sub:'بانتظار التعبئة', series:[3,5,4,7,6,8,7,Math.max(1, open)] }) +
      stat({ label:'متأخّرة', n:late, ic:'i-warn', cls:late ? 'down' : 'up',
        sub:'فات موعدها ولم تُعبَّأ', series:[1,2,1,3,2,4,3,Math.max(1, late)] }) +
      stat({ label:'منجزة', n:done, ic:'i-checkc', cls:'up',
        sub:'بإدخالاتها ودرجاتها', series:[2,4,6,9,11,13,15,Math.max(1, done)] }) +
    '</div>' +

    '<div class="card">' +
      head('الامتثال',
        'القالب يُبنى مرّة، ويُجدوَل، ويُسنَد لمن هو في شِفته، ويُقرأ أثره على الجهة',
        '<button class="btn p sm" data-a="fnew">' + icon('i-plus','s16') + 'قالب جديد</button>',
        'i-clip') +
      '<div class="tools">' + segmented('cmp', [
        ['hotels','الجهات وملفّاتها'], ['assigned','المُسنَدة'],
        ['done','المنجزة'], ['forms','القوالب'], ['entries','الإدخالات']
      ], seg) + '</div>' +
    '</div>' +
    (seg === 'hotels' ? cmpHotels() : seg === 'assigned' ? cmpAssigned(false)
      : seg === 'done' ? cmpAssigned(true) : seg === 'forms' ? cmpForms() : cmpEntries());
}

/* ══════ ١) الجهات وملفّاتها — التصنيف حسب الفندق ══════ */
function cmpHotels() {
  const K = 'cmh';
  const q = qOf(K);
  let rows = HOTELS.map(h => {
    const bs = hotelSubs(h.id), sc = hotelScore(h.id), g = GRADE(sc);
    const weak = hotelWeak(h.id).filter(w => w.hit);
    const asg = (V.assigns || []).filter(a => a.type === 'comply' && a.hotelId === h.id);
    return { h, bs, sc, g, weak, asg };
  });
  if (fOf(K, 'city')) rows = rows.filter(r => r.h.city === fOf(K, 'city'));
  if (fOf(K, 'grade')) rows = rows.filter(r => r.g.ar === fOf(K, 'grade'));
  if (q) rows = rows.filter(r => (r.h.ar + ' ' + r.h.city + ' ' + permitOf(r.h.ar)).indexOf(q) >= 0);
  rows.sort((a, b) => (a.sc == null ? 999 : a.sc) - (b.sc == null ? 999 : b.sc));

  return '<div class="card">' +
    head('الجهات وملفّاتها', 'ادخل على الجهة لترى ما عُبّئ لها، وتصنيفها، ونقاط ضعفها',
      pill(AR(rows.length) + ' جهة', 'gold'), 'i-key') +
    filterBar(K, [
      { k:'city',  label:'المدينة', opts:[...new Set(HOTELS.map(h => h.city))].map(c => [c, c]) },
      { k:'grade', label:'التصنيف',
        opts:['ممتاز','جيد جدًّا','جيد','مقبول','دون الحدّ','لم يُقيَّم'].map(x => [x, x]) }
    ], rows.length, HOTELS.length, 'ابحث باسم الجهة أو رقم تصريحها…') +
    (rows.length ? '<div class="plist">' + rows.map(r =>
      '<div class="prow" data-a="hprof" data-id="' + r.h.id + '">' +
        '<span class="krail" style="background:' + r.g.c + '"></span>' +
        '<span class="ico" style="color:' + r.g.c + '">' + icon('i-key','s18') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(r.h.ar) + '</b>' +
          '<span>' + E(r.h.city) + ' · تصريح ' + LTR(permitOf(r.h.ar)) + ' · ' +
          AR(r.h.rooms) + ' غرفة</span></span>' +
        '<span class="tcnts">' +
          cnt('i-clip', r.bs.length, 'نماذج عُبّئت') +
          cnt('i-send', r.asg.length, 'مهام مُسنَدة') +
          (r.weak.length ? cnt('i-warn', r.weak.length, 'بنود متكرّرة السقوط', 'warn') : '') +
        '</span>' +
        (r.sc == null ? pill('لم يُقيَّم', 'grey')
          : '<span class="fl" style="gap:9px;min-width:150px">' +
            '<span class="meter' + (r.sc < 70 ? ' red' : r.sc < 85 ? ' gold' : '') +
            '" style="flex:1"><i data-w="' + r.sc + '"></i></span>' +
            '<b class="num" style="min-width:34px">' + AR(r.sc) + '٪</b></span>') +
        '<span class="end">' + pill(r.g.ar, r.g.p) + '</span>' +
      '</div>').join('') + '</div>'
      : empty('لا جهة مطابقة', 'امسح الفلاتر', 'i-key')) +
  '</div>';
}

/* ملفّ الجهة: كل ما عُبّئ لها، وتصنيفها، ونقاط ضعفها */
function hotelProfile(hid) {
  const h = HOTELS.find(x => x.id === hid); if (!h) return;
  const bs = hotelSubs(hid), sc = hotelScore(hid), g = GRADE(sc);
  const weak = hotelWeak(hid);
  const asg = (V.assigns || []).filter(a => a.type === 'comply' && a.hotelId === hid);
  const sup = (V.users || []).find(u => u.role === 'supervisor' && u.hotelId === hid);
  const gs = (V.groups || []).filter(x => x.hotelId === hid);

  S.drawer = { title:h.ar, sub:h.city + ' · تصريح ' + permitOf(h.ar), icon:'i-key',
    wide:!!S.dwide, expand:hid, body:

    '<div class="card" style="--kc:' + g.c + '">' +
      head('التصنيف', sc == null ? 'لم تُعبَّأ لها نماذج بعد'
        : 'متوسّط ' + AR(bs.length) + ' زيارة', pill(g.ar, g.p), 'i-star') +
      (sc != null ? '<div class="fl" style="gap:12px;margin-top:6px">' +
        ring(sc, g.c, 56) +
        '<span class="sp"><b style="font-size:19px" class="num">' + AR(sc) + '٪</b>' +
        '<div class="tiny faint">آخر زيارة ' + (bs.length ? ago(bs[0].at) : '—') + '</div></span>' +
        '</div>' : '') +
      '<div class="grid g2" style="gap:10px;margin-top:14px">' +
        '<span><div class="tiny faint">رقم التصريح</div><b>' + LTR(permitOf(h.ar)) + '</b></span>' +
        '<span><div class="tiny faint">الغرف</div><b class="num">' + AR(h.rooms) + '</b></span>' +
        '<span><div class="tiny faint">المشرف</div><b>' + E(sup ? sup.name : 'لا مشرف') + '</b></span>' +
        '<span><div class="tiny faint">المجموعات الساكنة</div><b class="num">' + AR(gs.length) + '</b></span>' +
      '</div>' +
      '<button class="btn p sm" style="width:100%;margin-top:13px" data-a="hsched" data-id="' + hid + '">' +
        icon('i-cal','s14') + 'جدولة نموذج على هذه الجهة</button>' +
    '</div>' +

    (weak.length ? '<div class="card">' +
      head('نقاط الضعف', 'البند الذي يتكرّر سقوطه — يُعالَج من جذره', '', 'i-warn') +
      '<div class="rows">' + weak.slice(0, 8).map(w =>
        '<div class="row" style="padding:10px 4px;align-items:flex-start">' +
        '<span class="nm" style="flex:1"><b>' + E(w.q) + '</b>' +
          '<span>' + E(w.form) + ' · سقط في ' + AR(w.hit) + ' من ' + AR(w.of) + ' زيارة</span></span>' +
        '<span class="fl" style="gap:8px;min-width:120px">' +
          '<span class="meter' + (w.pct < 70 ? ' red' : w.pct < 85 ? ' gold' : '') +
          '" style="flex:1"><i data-w="' + w.pct + '"></i></span>' +
          '<b class="num" style="min-width:32px">' + AR(w.pct) + '٪</b></span>' +
        '</div>').join('') + '</div></div>' : '') +

    '<div class="card">' +
      head('النماذج المعبّأة', AR(bs.length) + ' زيارة — الأحدث أوّلًا', '', 'i-clip') +
      (bs.length ? '<div class="plist">' + bs.slice(0, 12).map(b => {
        const f = formById(b.formId) || {}, by = userById(b.by) || {};
        return '<div class="prow" data-a="fsub" data-id="' + b.id + '">' +
          '<span class="krail" style="background:' + (f.color || 'var(--dim)') + '"></span>' +
          '<span class="nm" style="flex:1"><b>' + E(f.title || '') + '</b>' +
            '<span>' + LTR(f.no || '') + ' · ' + E(by.name || '') + ' · ' + ago(b.at) + '</span></span>' +
          pill('الزيارة ' + AR(b.visit), 'grey') +
          pill(AR(b.score) + '٪', b.score >= 85 ? 'live' : b.score >= 70 ? 'gold' : 'no') + '</div>';
      }).join('') + '</div>' : '<div class="tiny faint">لم يُعبَّأ لها نموذج بعد.</div>') +
    '</div>' +

    (asg.length ? '<div class="card">' +
      head('المهام المُسنَدة عليها', AR(asg.length) + ' مهمة', '', 'i-send') +
      '<div class="plist">' + asg.slice(0, 10).map(cmpAsgRow).join('') + '</div></div>' : '') };
  renderDrawer();
}

/* ══════ ٢) المُسنَدة والمنجزة ══════ */
function cmpAsgRow(a) {
  const f = formById(a.formId) || {}, u = userById(a.to) || {};
  const st = CMP_ST[a.state] || CMP_ST['بانتظار التعبئة'];
  const pr = prioOf(a.prio);
  return '<div class="prow" data-a="caopen" data-id="' + a.id + '">' +
    '<span class="krail" style="background:' + pr.c + '"></span>' +
    avatar(u, 'sm') +
    '<span class="nm" style="flex:1"><b>' + E(f.title || '') + ' — ' + E(a.target) + '</b>' +
      '<span>' + LTR(a.no || '') + ' · ' + LTR(f.no || '') + ' · تصريح ' + LTR(a.permit || '') +
      ' · ' + E(u.name || '') + '</span></span>' +
    '<span class="when"><b>' + hijri(a.at) + '</b>' +
      '<span class="num">' + t12(a.at) + ' · ' + E(a.shift || '') + '</span></span>' +
    pill(pr.ar, pr.p) +
    '<span class="end">' + pill(a.state, st.p) + '</span></div>';
}

function cmpAssigned(doneOnly) {
  const K = doneOnly ? 'cmd' : 'cma';
  const q = qOf(K);
  let list = (V.assigns || []).filter(a => a.type === 'comply' &&
    (doneOnly ? a.state === 'منجزة' : a.state !== 'منجزة'));
  const total = list.length;
  if (fOf(K, 'hotel')) list = list.filter(a => a.hotelId === fOf(K, 'hotel'));
  if (fOf(K, 'form'))  list = list.filter(a => a.formId === fOf(K, 'form'));
  if (fOf(K, 'prio'))  list = list.filter(a => a.prio === fOf(K, 'prio'));
  if (fOf(K, 'state')) list = list.filter(a => a.state === fOf(K, 'state'));
  if (fOf(K, 'shift')) list = list.filter(a => a.shift === fOf(K, 'shift'));
  if (fOf(K, 'lead')) {
    const id = fOf(K, 'lead');
    list = list.filter(a => { const u = userById(a.to); return u && u.leaderId === id; });
  }
  if (q) list = list.filter(a => {
    const f = formById(a.formId) || {}, u = userById(a.to) || {};
    return (a.no + ' ' + (f.no || '') + ' ' + (a.permit || '') + ' ' + (f.title || '') + ' ' +
      a.target + ' ' + (u.name || '')).indexOf(q) >= 0;
  });
  list.sort((a, b) => doneOnly ? b.at - a.at
    : (prioOf(a.prio).o - prioOf(b.prio).o) || (a.at - b.at));

  return '<div class="card">' +
    head(doneOnly ? 'المهام المنجزة' : 'المهام المُسنَدة',
      doneOnly ? 'من أنجز، وماذا أنجز، وبأيّ درجة'
        : 'بانتظار التعبئة — مرتّبةً بالأولوية ثم بالموعد',
      pill(AR(list.length) + ' من ' + AR(total), 'gold'), doneOnly ? 'i-checkc' : 'i-send') +
    filterBar(K, [
      { k:'hotel', label:'الجهة',    opts:HOTELS.map(h => [h.id, h.ar]) },
      { k:'form',  label:'النموذج',  opts:(V.forms || []).map(f => [f.id, f.no + ' · ' + f.title]) },
      { k:'lead',  label:'الليدر',   opts:optLeaders() },
      { k:'prio',  label:'الأولوية', opts:Object.keys(PRIO).map(k => [k, PRIO[k].ar]) },
      { k:'shift', label:'الشِفت',   opts:SHIFTS.map(s => [s.k, s.k]) },
      { k:'state', label:'الحالة',   opts:Object.keys(CMP_ST).map(k => [k, k]) }
    ], list.length, total, 'ابحث برقم المهمة أو النموذج أو التصريح أو الاسم…') +
    (list.length ? pagedList(list, K, cmpAsgRow)
      : empty(doneOnly ? 'لا منجزة بعد' : 'لا مهام مُسنَدة',
        'جدوِل نموذجًا من باب القوالب', 'i-clip')) +
  '</div>';
}

/* ══════ ٣) القوالب ══════ */
function cmpForms() {
  const K = 'cmf';
  const q = qOf(K);
  let list = (V.forms || []).slice();
  if (q) list = list.filter(f => (f.no + ' ' + f.title + ' ' + f.scope).indexOf(q) >= 0);
  return '<div class="card gold">' +
    head('قوالب الامتثال', 'القالب يُبنى مرّة، ويُجدوَل مرارًا على من شئت وفي أي وقت',
      '<button class="btn p sm" data-a="fnew">' + icon('i-plus','s16') + 'قالب جديد</button>', 'i-clip') +
    filterBar(K, [], list.length, (V.forms || []).length, 'ابحث برقم القالب أو اسمه…') +
    '<div class="gcards">' + list.map((f, i) => {
      const bs = subsOf(f.id);
      const avg = bs.length ? Math.round(bs.reduce((a, b) => a + b.score, 0) / bs.length) : 0;
      const targets = [...new Set(bs.map(b => b.target))];
      const asg = (V.assigns || []).filter(a => a.formId === f.id);
      return '<div class="gcard" style="animation-delay:' + (i * 60) + 'ms">' +
        '<span class="gtop" style="background:' + f.color + '"></span>' +
        '<div class="fl" style="margin-bottom:11px">' +
          '<span class="ico" style="color:' + f.color + '">' + icon(f.icon,'s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(f.title) + '</b>' +
          '<span>' + LTR(f.no) + ' · ' + AR(f.qs.length) + ' أسئلة · ' + E(f.scope) + '</span></span>' +
          pill(AR(avg) + '٪', avg >= 85 ? 'live' : avg >= 70 ? 'wait' : 'no') + '</div>' +
        '<div class="mrow">' +
          '<span class="mchip">' + icon('i-users','s14') + AR(targets.length) + ' جهة</span>' +
          '<span class="mchip">' + icon('i-hist','s14') + AR(bs.length) + ' زيارة</span>' +
          '<span class="mchip">' + icon('i-send','s14') + AR(asg.length) + ' إسنادًا</span>' +
        '</div>' +
        '<div class="pfoot">' +
          '<span class="ok">آخر زيارة ' + (bs.length ? ago(Math.max.apply(null, bs.map(b => b.at))) : '—') + '</span>' +
          '<span class="fl" style="gap:7px">' +
            '<button class="btn l sm" data-a="fedit" data-id="' + f.id + '">تعديل</button>' +
            '<button class="btn p sm" data-a="fsched" data-id="' + f.id + '">' +
              icon('i-cal','s14') + 'جدولة</button>' +
            '<button class="btn l sm" data-a="fdash" data-id="' + f.id + '">اللوحة</button></span>' +
        '</div></div>';
    }).join('') + '</div>' +
  '</div>';
}

/* ══════ ٤) الإدخالات ══════ */
function cmpEntries() {
  const K = 'cme';
  const q = qOf(K);
  let list = (V.subs || []).slice().sort((a, b) => b.at - a.at);
  const total = list.length;
  if (fOf(K, 'form'))  list = list.filter(b => b.formId === fOf(K, 'form'));
  if (fOf(K, 'hotel')) {
    const h = HOTELS.find(x => x.id === fOf(K, 'hotel'));
    if (h) list = list.filter(b => b.target === h.ar);
  }
  if (fOf(K, 'lead')) list = list.filter(b => b.leaderId === fOf(K, 'lead'));
  if (fOf(K, 'band')) {
    const bd = fOf(K, 'band');
    list = list.filter(b => bd === 'hi' ? b.score >= 85 : bd === 'mid' ? (b.score >= 70 && b.score < 85) : b.score < 70);
  }
  if (q) list = list.filter(b => {
    const f = formById(b.formId) || {}, u = userById(b.by) || {};
    return ((f.no || '') + ' ' + (f.title || '') + ' ' + b.target + ' ' + permitOf(b.target) +
      ' ' + (u.name || '')).indexOf(q) >= 0;
  });

  return '<div class="card">' +
    head('آخر الإدخالات', 'كل إدخال زيارة لها رقمها — والتحسّن يُقرأ بين الزيارتين',
      pill(AR(list.length) + ' من ' + AR(total), 'gold'), 'i-hist') +
    filterBar(K, [
      { k:'form',  label:'النموذج', opts:(V.forms || []).map(f => [f.id, f.no + ' · ' + f.title]) },
      { k:'hotel', label:'الجهة',   opts:HOTELS.map(h => [h.id, h.ar]) },
      { k:'lead',  label:'الليدر',  opts:optLeaders() },
      { k:'band',  label:'الدرجة',  opts:[['hi','٨٥٪ فأعلى'],['mid','٧٠–٨٤٪'],['lo','دون ٧٠٪']] }
    ], list.length, total, 'ابحث برقم النموذج أو اسم الجهة أو التصريح…') +
    (list.length ? pagedList(list, K, b => {
      const f = formById(b.formId) || {}, by = userById(b.by) || {};
      return '<div class="prow" data-a="fsub" data-id="' + b.id + '">' +
        '<span class="krail" style="background:' + (f.color || 'var(--dim)') + '"></span>' +
        avatar(by, 'sm') +
        '<span class="nm" style="flex:1"><b>' + E(b.target) + '</b>' +
        '<span>' + LTR(f.no || '') + ' · ' + E(f.title || '') + ' · ' + E(by.name || '') +
          ' · تصريح ' + LTR(permitOf(b.target)) + '</span></span>' +
        pill('الزيارة ' + AR(b.visit) + ' من ' + AR(b.of), 'grey') +
        '<span class="fl" style="gap:9px;min-width:150px">' +
          '<span class="meter' + (b.score < 70 ? ' red' : b.score < 85 ? ' gold' : '') +
            '" style="flex:1"><i data-w="' + b.score + '"></i></span>' +
          '<b class="num" style="min-width:34px">' + AR(b.score) + '٪</b></span>' +
        '<span class="tiny faint">' + ago(b.at) + '</span></div>';
    }) : empty('لا إدخالات بهذه الفلاتر', 'امسح الفلاتر', 'i-hist')) +
  '</div>';
}

/* ============================================================
   الجدولة: قالبٌ + أوقاتٌ من تقويم + أشخاصٌ من الشِفت
   أيَّ عددٍ شئت، في أي وقتٍ شئت، لأي نموذج.
   ============================================================ */
function schedDraft() {
  S.sched = S.sched || { formId:null, hotels:[], slots:[], prio:'mid', mode:'auto', people:[] };
  return S.sched;
}
/* شبكة التقويم: أربعة عشر يومًا × ثلاث نوافذ — تُنقر فتُختار */
const SLOT_H = [8, 16, 22];
const SLOT_AR = ['صباحًا ٨', 'عصرًا ٤', 'ليلًا ١٠'];
function slotTs(dayOff, si) {
  const d = new Date(now());
  d.setHours(SLOT_H[si], 0, 0, 0);
  return d.getTime() + dayOff * DAY;
}
const slotKey = (d, s) => d + ':' + s;

function formSchedule(id) {
  const d = schedDraft();
  if (id && d.formId !== id) { d.formId = id; d.hotels = []; d.slots = []; }
  const f = formById(d.formId) || {};
  const chosen = d.slots.length, tgts = d.hotels.length;
  const total = chosen * Math.max(1, tgts);

  S.drawer = { title:'جدولة «' + (f.title || '') + '»',
    /* نصٌّ خالص: renderDrawer يهرّب العنوان فيظهر الوسم حرفيًّا */
    sub:(f.no || '') + ' · اختر الجهات ثم الأوقات ثم من يُعبّئها',
    icon:'i-cal', wide:!!S.dwide, expand:d.formId, body:

    '<div class="note b">' + icon('i-info','s16') +
      '<span>تُنشئ الجدولة مهمّةً لكل <b>جهة × وقت</b>. ' +
      'والمُسنَد إليه لا يُختار إلا ممّن يغطّي شِفتُه ذلك الوقت.</span></div>' +

    '<div class="card">' +
      head('١ · الجهات', 'أي جهةٍ يُعبَّأ لها هذا النموذج؟',
        pill(AR(tgts) + ' مختارة', tgts ? 'gold' : 'grey'), 'i-key') +
      '<div class="chipwrap">' + HOTELS.map(h =>
        '<button class="chipbtn' + (d.hotels.indexOf(h.id) >= 0 ? ' on' : '') + '" ' +
          'data-a="schoteb" data-v="' + h.id + '">' + E(h.ar) + '</button>').join('') + '</div>' +
      '<div class="grid g2" style="gap:8px;margin-top:11px">' +
        '<button class="btn l sm" data-a="schall">' + icon('i-checkc','s14') + 'كل الجهات</button>' +
        '<button class="btn l sm" data-a="schnone">' + icon('i-x','s14') + 'مسح الاختيار</button>' +
      '</div></div>' +

    '<div class="card">' +
      head('٢ · الأوقات', 'أربعة عشر يومًا × ثلاث نوافذ — انقر ما تريد',
        pill(AR(chosen) + ' وقتًا', chosen ? 'gold' : 'grey'), 'i-cal') +
      '<div class="calgrid">' +
        '<div class="calhead"><span></span>' + SLOT_AR.map(s =>
          '<span>' + E(s) + '</span>').join('') + '</div>' +
        Array.from({ length: 14 }, (_, i) => i).map(day => {
          const ts = slotTs(day, 0);
          return '<div class="calrow">' +
            '<span class="cald"><b>' + DAY_SHORT[new Date(ts).getDay()] + '</b>' +
            '<span>' + AR(new Date(ts).getDate()) + '</span></span>' +
            SLOT_H.map((_, si) => {
              const k = slotKey(day, si), on = d.slots.indexOf(k) >= 0;
              const t = slotTs(day, si), past = t < now();
              return '<button class="calc' + (on ? ' on' : '') + (past ? ' off' : '') + '" ' +
                (past ? 'disabled' : 'data-a="schslot" data-v="' + k + '"') + '>' +
                '<b>' + shiftAt(t) + '</b>' +
                '<span class="num">' + AR(onShift(t).length) + '</span></button>';
            }).join('') + '</div>';
        }).join('') +
      '</div>' +
      '<div class="tiny faint" style="margin-top:10px">' +
        'الرقم في الخانة: عدد المحسنين الذين يغطّي شِفتُهم تلك النافذة.</div>' +
    '</div>' +

    '<div class="card">' +
      head('٣ · الأولوية', 'تُقرأ في التطبيق وتُرتّب بها القائمة', '', 'i-flag') +
      '<div class="grid g4" style="gap:8px">' + Object.keys(PRIO).map(k =>
        '<button class="chipbtn' + (d.prio === k ? ' on' : '') + '" data-a="schprio" data-v="' + k + '">' +
        '<i style="width:8px;height:8px;border-radius:50%;background:' + PRIO[k].c + '"></i>' +
        PRIO[k].ar + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' +
      head('٤ · من يُعبّئها', d.mode === 'auto'
        ? 'النظام يختار من هو في الشِفت وغيرُ مشغول — وهو الأصحّ'
        : 'اختيارٌ يدويّ من أهل الشِفت', '', 'i-users') +
      '<div class="grid g2" style="gap:8px">' +
        '<button class="chipbtn' + (d.mode === 'auto' ? ' on' : '') + '" data-a="schmode" data-v="auto">' +
          icon('i-target','s13') + 'تلقائيًّا من الشِفت</button>' +
        '<button class="chipbtn' + (d.mode === 'pick' ? ' on' : '') + '" data-a="schmode" data-v="pick">' +
          icon('i-user','s13') + 'أختارهم بنفسي</button>' +
      '</div>' +
      (d.mode === 'pick' ? (function () {
        const t0 = d.slots.length ? slotTs.apply(null, d.slots[0].split(':').map(Number)) : now();
        const cands = shiftCands(t0).slice(0, 24);
        return '<div class="tiny faint" style="margin:12px 0 8px">' +
          'المعروضون يغطّي شِفتُهم أوّل وقتٍ اخترتَه (' + shiftAt(t0) + ')' +
          (Math.abs(t0 - now()) < 4 * HR ? ' — ومن أثبت حضوره اليوم وحده' : '') + '</div>' +
          '<div class="chipwrap">' + (cands.length ? cands.map(u =>
            '<button class="chipbtn' + (d.people.indexOf(u.id) >= 0 ? ' on' : '') + '" ' +
              'data-a="schwho" data-v="' + u.id + '">' + E(u.name) +
              (busyAt(u.id, t0) ? ' · مشغول' : '') + '</button>').join('')
            : '<span class="tiny faint">لا أحد في هذا الشِفت — غيّر الوقت.</span>') + '</div>';
      })() : '') +
    '</div>' +

    '<div class="card gold">' +
      head('الحصيلة', total ? AR(total) + ' مهمّة ستُنشأ' : 'اختر جهةً ووقتًا على الأقلّ',
        pill(AR(total), total ? 'gold' : 'grey'), 'i-checkc') +
      '<button class="btn p" style="width:100%" data-a="schsave"' +
        (total ? '' : ' disabled') + '>' + icon('i-check','s16') +
        'إنشاء ' + AR(total) + ' مهمّة</button>' +
    '</div>' };
  renderDrawer();
}

/* ---------- تنفيذ الجدولة ---------- */
function schedRun() {
  const d = schedDraft(), f = formById(d.formId);
  if (!f || !d.slots.length || !d.hotels.length) { toast('اختر جهةً ووقتًا', 'r'); return; }
  let n = 0, skipped = 0;
  d.slots.slice().sort().forEach(k => {
    const [day, si] = k.split(':').map(Number);
    const ts = slotTs(day, si);
    d.hotels.forEach(hid => {
      const h = HOTELS.find(x => x.id === hid); if (!h) return;
      /* المرشّحون: أهل الشِفت من ساكني الفندق أوّلًا، ثم أهل الشِفت عمومًا */
      const gs = (S.groups || []).filter(g => g.hotelId === hid);
      const ids = [];
      gs.forEach(g => { ids.push(g.leaderId); g.members.forEach(m => ids.push(m.id)); });
      const inHotel = [...new Set(ids)].map(userById).filter(Boolean);
      let pool = d.mode === 'pick'
        ? d.people.map(userById).filter(Boolean).filter(u => shiftOf(u) === shiftAt(ts))
        : shiftCands(ts, inHotel);
      if (!pool.length) pool = shiftCands(ts);
      const pick = pool[n % Math.max(1, pool.length)];
      if (!pick) { skipped++; return; }
      n++;
      S.assigns.unshift({
        id:uid('A'), no:'CA-' + (5100 + S.assigns.length + n), type:'comply',
        formId:f.id, target:h.ar, hotelId:hid, permit:permitOf(h.ar),
        to:pick.id, by:'الكنترول', prio:d.prio,
        at:ts, madeAt:now(), shift:shiftAt(ts),
        title:f.title + ' — ' + h.ar, sub:'نموذج امتثال · ' + h.ar,
        state:'بانتظار التعبئة', subId:null,
        trail:[{ at:now(), by:'الكنترول',
          text:'جُدوِلت وأُسندت إلى ' + pick.name + ' — شِفت ' + shiftAt(ts) }]
      });
    });
  });
  logIt('جُدوِل نموذج «' + f.title + '» — ' + AR(n) + ' مهمّة', 'assign');
  toast(n ? 'أُنشئت ' + AR(n) + ' مهمّة' + (skipped ? ' · تعذّر ' + AR(skipped) : '')
    : 'تعذّر الإسناد — لا أحد في تلك الشِفتات', n ? 'g' : 'r');
  S.sched = null; S.tab.cmp = 'assigned';
  S.drawer = null; clearDrawerStack(); render();
}

/* ============================================================
   درج مهمّة الامتثال: تفصيلها، وتبديل من يُعبّئها، وأولويّتها
   ============================================================ */
function cmpAsgDrawer(id) {
  const a = (S.assigns || []).find(x => x.id === id); if (!a) return;
  const f = formById(a.formId) || {}, u = userById(a.to) || {};
  const st = CMP_ST[a.state] || CMP_ST['بانتظار التعبئة'];
  const pr = prioOf(a.prio);
  const sub = a.subId ? (S.subs || []).find(b => b.id === a.subId) : null;
  /* حالتان تُبطلان الإسناد: ليس في شِفت الموعد أصلًا، أو فيه ولم يحضر */
  const offShift = a.state !== 'منجزة' && shiftOf(u) !== shiftAt(a.at);
  const absent = a.state !== 'منجزة' && !offShift && isAbsent(a.to, a.at);
  const bad = offShift || absent;

  S.drawer = { title:f.title || 'مهمّة امتثال', sub:a.no + ' · ' + a.target,
    icon:f.icon || 'i-clip', wide:!!S.dwide, expand:id, body:

    '<div class="card" style="--kc:' + pr.c + '">' +
      head(a.state, 'أولويّتها ' + pr.ar, pill(pr.ar, pr.p), 'i-clip') +
      '<div class="grid g2" style="gap:10px">' +
        '<span><div class="tiny faint">رقم المهمة</div><b>' + LTR(a.no) + '</b></span>' +
        '<span><div class="tiny faint">رقم النموذج</div><b>' + LTR(f.no || '') + '</b></span>' +
        '<span><div class="tiny faint">رقم التصريح</div><b>' + LTR(a.permit || '') + '</b></span>' +
        '<span><div class="tiny faint">الجهة</div><b>' + E(a.target) + '</b></span>' +
        '<span><div class="tiny faint">الموعد</div><b>' + hijri(a.at) + ' · ' + t12(a.at) + '</b></span>' +
        '<span><div class="tiny faint">الشِفت</div><b>' + E(a.shift || '') + '</b></span>' +
      '</div>' +
      '<div class="row" style="padding:12px 4px 0;margin-top:12px;border-top:1px solid var(--line)">' +
        avatar(u) + '<span class="nm" style="flex:1"><b>' + E(u.name || '') + '</b>' +
        '<span>' + E(u.specialty || '') + ' · شِفت ' + E(shiftOf(u)) + '</span></span>' +
        (a.state === 'منجزة' ? pill('عبّأها', 'live')
          : offShift ? pill('خارج الشِفت', 'no')
          : isPresent(a.to, a.at) ? pill('حاضر في شِفته', 'live') : pill('لم يُثبت حضوره', 'no')) +
      '</div>' +
    '</div>' +

    (bad ? '<div class="note r">' + icon('i-warn','s16') +
      '<span><b>' + (offShift ? 'المُسنَد إليه ليس في شِفت هذا الموعد'
                              : 'المُسنَد إليه غائب عن شِفته') + '</b><br>' +
      (offShift
        ? E(u.name || '') + ' شِفته ' + E(shiftOf(u)) + '، وموعد المهمّة في شِفت ' +
          E(a.shift || '') + '. لن يكون في الموقع.'
        : 'لم يُثبت ' + E(u.name || '') + ' حضوره في شِفت ' + E(a.shift || '') + '.') +
      ' أعِد إسنادها إلى حاضرٍ من الشِفت نفسه.</span></div>' +
      '<button class="btn p" style="width:100%" data-a="careassign" data-id="' + a.id + '">' +
        icon('i-swap','s16') + 'إعادة إسناد تلقائيّة من الشِفت</button>' : '') +

    (a.state !== 'منجزة' ? '<div class="card">' +
      head('تحكّم الكنترول', 'التبديل والأولوية والإغلاق', '', 'i-shield') +
      '<div class="grid g2" style="gap:8px">' +
        '<button class="btn l sm" data-a="caswap" data-id="' + a.id + '">' +
          icon('i-swap','s14') + 'تبديل المحسن</button>' +
        '<button class="btn l sm" data-a="careassign" data-id="' + a.id + '">' +
          icon('i-target','s14') + 'إسناد تلقائيّ</button>' +
      '</div>' +
      '<div class="tiny faint" style="margin:13px 0 7px">الأولوية</div>' +
      '<div class="grid g4" style="gap:8px">' + Object.keys(PRIO).map(k =>
        '<button class="chipbtn' + (a.prio === k ? ' on' : '') + '" data-a="caprio" ' +
        'data-id="' + a.id + '" data-v="' + k + '">' + PRIO[k].ar + '</button>').join('') + '</div>' +
    '</div>' : '') +

    (sub ? '<div class="card">' +
      head('الإدخال المرتبط', 'الزيارة ' + AR(sub.visit) + ' من ' + AR(sub.of),
        pill(AR(sub.score) + '٪', sub.score >= 85 ? 'live' : sub.score >= 70 ? 'gold' : 'no'), 'i-checkc') +
      '<button class="btn l sm" style="width:100%;margin-top:6px" data-a="fsub" data-id="' + sub.id + '">' +
        icon('i-eye','s14') + 'عرض الإجابات</button></div>' : '') +

    '<div class="card">' + head('مسار المهمة', AR((a.trail || []).length) + ' واقعة', '', 'i-hist') +
      histLog((a.trail || []).map(x => ({ at:x.at, text:x.text, kind:'info' }))) + '</div>' +

    '<button class="btn l" data-a="hprof" data-id="' + (a.hotelId || '') + '">' +
      icon('i-key','s16') + 'ملفّ الجهة</button>' };
  renderDrawer();
}

/* إعادة الإسناد: حاضرٌ من الشِفت نفسه بلا مهمّة في تلك النافذة */
function reassignComply(a, why) {
  const gs = (S.groups || []).filter(g => g.hotelId === a.hotelId);
  const ids = [];
  gs.forEach(g => { ids.push(g.leaderId); g.members.forEach(m => ids.push(m.id)); });
  const inHotel = [...new Set(ids)].map(userById).filter(Boolean);
  let pool = shiftCands(a.at, inHotel).filter(u => u.id !== a.to);
  if (!pool.length) pool = shiftCands(a.at).filter(u => u.id !== a.to);
  if (!pool.length) { toast('لا بديل حاضرٌ في هذا الشِفت', 'r'); return null; }
  const old = userById(a.to) || {};
  const pick = pool[0];
  a.to = pick.id;
  a.state = 'أُعيد إسنادها';
  a.trail = a.trail || [];
  a.trail.unshift({ at:now(), by:'النظام',
    text:'أُعيد الإسناد من ' + (old.name || '') + ' إلى ' + pick.name + ' — ' + (why || 'غياب') });
  /* إشعارٌ يصل الكنترول، فلا يمرّ التبديل صامتًا */
  S.casts = S.casts || [];
  S.casts.unshift({ id:uid('C'), dest:'control', cat:'إسناد', at:now(),
    title:'أُعيد إسناد ' + a.no,
    body:'غاب ' + (old.name || '') + ' عن شِفت ' + a.shift + '، فأُسندت «' +
      (formById(a.formId) || {}).title + ' — ' + a.target + '» إلى ' + pick.name + '.' });
  logIt('أُعيد إسناد ' + a.no + ' إلى ' + pick.name + ' لغياب ' + (old.name || ''), 'assign');
  return pick;
}
