/* ============================================================
   لوحة عمليات تُخصَّص
   ─────────────────────────────────────────────────────────────
   كل عنصر «ودجت» له مفتاح ومقاس وراسم. المشغّل يختار ما يريد
   ويعيد ترتيبه، ويُحفظ اختياره. والافتراض لوحة كاملة معقولة.
   ============================================================ */

const WIDGETS = [
  /* ── مؤشّرات ── */
  { k:'kpiTasks',   ar:'مؤشّر المهام',        g:'مؤشّرات', w:1, i:'i-tasks',  f:wTasksKpi },
  { k:'kpiDecide',  ar:'مؤشّر القرارات',      g:'مؤشّرات', w:1, i:'i-send',   f:wDecideKpi },
  { k:'kpiTickets', ar:'مؤشّر التذاكر',       g:'مؤشّرات', w:1, i:'i-ticket', f:wTicketsKpi },
  { k:'kpiStart',   ar:'مؤشّر التزام البدء',  g:'مؤشّرات', w:1, i:'i-play',   f:wStartKpi },
  { k:'kpiStaff',   ar:'مؤشّر الموظفين',      g:'مؤشّرات', w:1, i:'i-idcard', f:wStaffKpi },
  { k:'kpiPil',     ar:'مؤشّر الحجاج',        g:'مؤشّرات', w:1, i:'i-users',  f:wPilKpi },
  { k:'kpiBus',     ar:'مؤشّر الباصات',       g:'مؤشّرات', w:1, i:'i-bus',    f:wBusKpi },
  { k:'kpiNusuk',   ar:'مؤشّر نُسك',          g:'مؤشّرات', w:1, i:'i-idcard', f:wNusukKpi },
  { k:'kpiQuality', ar:'مؤشّر الجودة',        g:'مؤشّرات', w:1, i:'i-star',   f:wQualityKpi },
  { k:'kpiAfasha',  ar:'مؤشّر العفاشة',       g:'مؤشّرات', w:1, i:'i-truck',  f:wAfashaKpi },

  /* ── رسوم ── */
  { k:'chLoad',     ar:'حِمل اليوم بالساعات', g:'رسوم', w:2, i:'i-hist',   f:wLoad },
  { k:'chStatus',   ar:'توزيع حالات المهام',  g:'رسوم', w:1, i:'i-pie',    f:wStatus },
  { k:'chTypes',    ar:'أنواع العمل',         g:'رسوم', w:1, i:'i-tasks',  f:wTypes },
  { k:'chOrgs',     ar:'الحِمل حسب الجهة',    g:'رسوم', w:2, i:'i-flag',   f:wOrgs },
  { k:'chInc',      ar:'الحوادث حسب النوع',   g:'رسوم', w:1, i:'i-warn',   f:wInc },
  { k:'chRating',   ar:'توزيع التقييمات',     g:'رسوم', w:1, i:'i-star',   f:wRating },
  { k:'chHotels',   ar:'إشغال الفنادق',       g:'رسوم', w:2, i:'i-key',    f:wHotels },
  { k:'chBusDay',   ar:'رحلات الباصات اليوم', g:'رسوم', w:2, i:'i-bus',    f:wBusDay },

  /* ── قوائم ── */
  { k:'queue',      ar:'صفّ القرارات',        g:'قوائم', w:3, i:'i-send',   f:wQueue },
  { k:'feed',       ar:'تدفّق الحوادث',       g:'قوائم', w:1, i:'i-warn',   f:wFeed },
  { k:'nextTasks',  ar:'المهام القادمة',      g:'قوائم', w:1, i:'i-cal',    f:wNext },
  { k:'liveTasks',  ar:'الجارية الآن',        g:'قوائم', w:1, i:'i-play',   f:wLive },
  { k:'ktTable',    ar:'جدول الفرق',          g:'قوائم', w:3, i:'i-users',  f:wKt },
  { k:'topStaff',   ar:'أعلى المحسنين تقييمًا', g:'قوائم', w:1, i:'i-star', f:wTop },
  { k:'busNext',    ar:'الرحلات القادمة',     g:'قوائم', w:1, i:'i-bus',    f:wBusNext },
  { k:'nusukOpen',  ar:'حالات نُسك المفتوحة', g:'قوائم', w:1, i:'i-idcard', f:wNusukList },

  /* ── خرائط ── */
  { k:'map',        ar:'خريطة العمليات',      g:'خرائط', w:2, i:'i-pin',    f:wMap },
  { k:'gantt',      ar:'مسار الباصات',        g:'خرائط', w:3, i:'i-bus',    f:wGantt }
];
const widgetOf = k => WIDGETS.find(w => w.k === k);
const DASH_DEFAULT = ['kpiTasks','kpiDecide','kpiTickets','kpiStart',
  'queue','chLoad','chStatus','map','feed','ktTable'];
const dashKeys = () => (S.dash && S.dash.length ? S.dash : DASH_DEFAULT.slice())
  .filter(widgetOf);

function screenOps() {
  const keys = dashKeys();
  const rng = S.tab.rng || 'today';
  return '<div class="opsbar">' +
    '<div class="hello"><b>' + E((S.cfg && S.cfg.name) || 'غرفة العمليات') + '</b>' +
      '<span class="tiny faint">' + dayName(now()) + ' · ' + hijri(now()) + ' — ' +
      AR(leaders().length) + ' فرق · ' + AR(allPilgrimRows().length) + ' حاجًّا</span></div>' +
    '<span class="sp"></span>' +
    segmented('rng', [['today','اليوم'],['week','الأسبوع'],['season','الموسم']], rng) +
    '<button class="btn l sm" data-a="go" data-n="timeline">' + icon('i-hist','s16') + 'الخط الزمني</button>' +
    '<button class="btn p sm" data-a="dashedit">' + icon('i-gear','s16') + 'تخصيص اللوحة' +
      '<span class="kbd2">' + AR(keys.length) + '</span></button>' +
  '</div>' +
  (keys.length
    ? '<div class="dashgrid">' + keys.map((k, i) => {
        const w = widgetOf(k);
        return '<div class="dw w' + w.w + '" style="animation-delay:' + (i * 45) + 'ms">' +
          w.f() + '</div>';
      }).join('') + '</div>'
    : '<div class="card">' + empty('اللوحة فارغة', 'اضغط «تخصيص اللوحة» واختر ما يهمّك', 'i-target') +
      '</div>');
}

/* ---------- محرّر اللوحة ---------- */
function dashEdit() {
  const keys = dashKeys();
  const groups = [...new Set(WIDGETS.map(w => w.g))];
  S.drawer = { title:'تخصيص لوحة العمليات',
    sub:'اختر ما يهمّك ورتّبه — يُحفظ لك وحدك', icon:'i-gear', body:

    '<div class="card gold">' + head('لوحتك الآن', AR(keys.length) + ' عنصرًا — الأعلى أوّلًا',
        '<button class="btn l sm" data-a="dashreset">الافتراضي</button>') +
      (keys.length ? '<div class="plist">' + keys.map((k, i) => {
        const w = widgetOf(k);
        return '<div class="prow" style="padding:9px 11px">' +
          '<span class="sn">' + AR(i + 1) + '</span>' +
          '<span class="ico sm" style="color:var(--gold2)">' + icon(w.i,'s14') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(w.ar) + '</b>' +
          '<span>' + E(w.g) + ' · عرض ' + AR(w.w) + '</span></span>' +
          '<span class="fl" style="gap:4px">' +
            (i > 0 ? '<button class="xbtn" data-a="dashup" data-v="' + i + '" title="أعلى">' +
              icon('i-back','s14') + '</button>' : '') +
            (i < keys.length - 1 ? '<button class="xbtn" data-a="dashdn" data-v="' + i +
              '" title="أسفل">' + icon('i-fwd','s14') + '</button>' : '') +
            '<button class="xbtn" data-a="dashoff" data-v="' + k + '">' + icon('i-x','s14') + '</button>' +
          '</span></div>';
      }).join('') + '</div>' : '<div class="tiny faint">لا عنصر — اختر من الأسفل.</div>') +
    '</div>' +

    groups.map(g => '<div class="card">' +
      head(g, AR(WIDGETS.filter(w => w.g === g).length) + ' عنصرًا') +
      '<div class="permgrid">' + WIDGETS.filter(w => w.g === g).map(w => {
        const on = keys.indexOf(w.k) >= 0;
        return '<button class="pchk' + (on ? ' on' : '') + '" data-a="dashtog" data-v="' + w.k + '">' +
          '<span class="box">' + (on ? icon('i-checkc','s14') : '') + '</span>' +
          icon(w.i,'s16') + '<b>' + E(w.ar) + '</b></button>';
      }).join('') + '</div></div>').join('')
  };
  renderDrawer();
}

/* ============================================================
   الودجتس — كل واحد يقرأ الرؤية V فيحترم الصلاحية
   ============================================================ */
function rangeTasks() {
  const r = S.tab.rng || 'today';
  if (r === 'season') return V.tasks.slice();
  if (r === 'week') {
    const a = dayStart(now()) - 3 * DAY, b = a + 7 * DAY;
    return V.tasks.filter(t => t.start >= a && t.start < b);
  }
  return V.tasks.filter(t => dayStart(t.start) === dayStart(now()));
}

function wTasksKpi() {
  const s = rangeTasks(), d = s.filter(t => t.status === 'done');
  return stat({ label:'مهام المدة', n:s.length, delta:s.length - 8, ic:'i-tasks',
    sub:AR(d.length) + ' منجزة · ' + AR(runningTasks().length) + ' جارية',
    series:[6,8,7,11,9,13,10,Math.max(1, s.length)] });
}
function wDecideKpi() {
  const n = decisionItems().length;
  return stat({ label:'قرارات تنتظرك', n, delta:n ? n - 1 : 0, ic:'i-send',
    cls:n ? 'warn' : 'up', sub:AR(openSupport().length) + ' دعم · ' +
      AR(escalatedReports().length) + ' تقرير', series:[1,2,1,3,2,4,3,Math.max(1, n)] });
}
function wTicketsKpi() {
  const crit = V.tickets.filter(k => k.pri === 'حرجة' && k.status !== 'مغلقة').length;
  return stat({ label:'تذاكر مفتوحة', n:openTickets().length, delta:2, ic:'i-ticket',
    cls:crit ? 'bad' : '', sub:AR(crit) + ' حرجة · من الحجاج',
    series:[3,5,4,6,5,8,6,Math.max(1, openTickets().length)] });
}
function wStartKpi() {
  const s = rangeTasks(), auto = s.filter(t => t.autoStarted).length;
  const pct = s.length ? Math.round((1 - auto / s.length) * 100) : 100;
  return stat({ label:'التزام البدء', n:pct, suffix:'٪', delta:auto ? -auto : 0,
    ic:'i-play', cls:auto ? 'warn' : 'up',
    sub:auto ? AR(auto) + ' مهمة بدأها النظام' : 'كل المهام بدأها ليدرها',
    series:[88,90,86,92,89,94,91,pct] });
}
function wStaffKpi() {
  const n = V.users.filter(u => u.role === 'muhsen' && !u.reserve).length;
  return stat({ label:'المحسنون', n, ic:'i-idcard', cls:'up',
    sub:AR(leaders().length) + ' ليدرًا · ' + AR(supervisors().length) + ' مشرفًا',
    series:[40,70,100,120,140,150,158,n] });
}
function wPilKpi() {
  const all = allPilgrimRows();
  const arr = all.filter(p => p.state === 'وصل').length;
  return stat({ label:'الحجاج', n:all.length, ic:'i-users',
    sub:AR(arr) + ' وصلوا · ' + AR(all.filter(p => p.flag).length) + ' حالة رعاية',
    series:[380,620,900,1180,1400,1550,1640,all.length] });
}
function wBusKpi() {
  const t = V.trips.filter(x => dayStart(x.at) === dayStart(now()));
  return stat({ label:'رحلات اليوم', n:t.length, ic:'i-bus',
    sub:AR(V.buses.length) + ' باصات · ' + AR(t.filter(x => x.done).length) + ' انتهت',
    series:[12,18,24,30,36,42,48,Math.max(1, t.length)] });
}
function wNusukKpi() {
  return stat({ label:'حالات نُسك', n:openNusuk().length, ic:'i-idcard',
    cls:openNusuk().length ? 'warn' : 'up', sub:'مفتوحة تنتظر إجراءً',
    series:[2,3,4,3,5,4,6,Math.max(1, openNusuk().length)] });
}
function wQualityKpi() {
  const d = V.tasks.filter(t => t.status === 'done' && t.rating);
  const avg = d.length ? (d.reduce((a, t) => a + t.rating, 0) / d.length).toFixed(1) : '0.0';
  return stat({ label:'متوسط التقييم', n:avg, ic:'i-star', cls:'up',
    sub:'من ' + AR(d.length) + ' مهمة مقيَّمة', series:[3.6,3.7,3.9,4,4.1,4,4.2,Number(avg)] });
}
function wAfashaKpi() {
  const ag = V.contractors.filter(c => {
    const d = lastDeal(c.id); return d && (d.state === 'agreed' || d.state === 'offline'); }).length;
  return stat({ label:'مقاولو العفاشة', n:V.contractors.length, ic:'i-truck',
    sub:AR(ag) + ' متعاقَد معهم', series:[2,4,6,8,9,10,10,V.contractors.length] });
}

/* ── رسوم ── */
function card(title, sub, body, ic, right) {
  return '<div class="card hov">' + head(title, sub, right || '', ic) + body + '</div>';
}
function wLoad() {
  return card('حِمل اليوم بالساعات', 'كل نافذة ساعتان — والعمود المضيء هو الآن',
    chartBars({ data: loadByHour(), foot:'الذروة تكشف الساعات التي تحتاج احتياطًا جاهزًا.' }),
    'i-hist', pill(AR(runningTasks().length) + ' الآن', runningTasks().length ? 'live' : 'grey'));
}
function wStatus() {
  return card('توزيع الحالات', 'من ' + AR(V.tasks.length) + ' مهمة',
    '<div class="donutwrap">' + donut({ data: statusMix(), center:'مهمة' }) + '</div>', 'i-pie');
}
function wTypes() {
  const d = Object.keys(TASKTYPE).map(k => ({
    l: TASKTYPE[k].ar, c: TASKTYPE[k].c,
    v: k === 'hajj' ? V.tasks.length : k === 'enrich' ? V.enrich.length
      : k === 'nusuk' ? V.nusuk.length : V.subs.length
  })).filter(x => x.v);
  return card('أنواع العمل', 'أين يتوزّع الجهد',
    '<div class="donutwrap">' + donut({ data:d, center:'بند' }) + '</div>', 'i-tasks');
}
function wOrgs() {
  const d = V.orgs.slice(0, 12).map(o => ({
    l: o.kt.replace('KT',''), v: V.tasks.filter(t => t.kt === o.kt).length, hot:false }));
  return card('الحِمل حسب الجهة', 'عدد مهام كل KT',
    chartBars({ data:d, foot:'الجهة الأثقل تستحق احتياطًا أقرب.' }), 'i-flag');
}
function wInc() {
  const d = INC_CATS.map(c => ({ l:c.ar, v:V.feed.filter(f => f.cat === c.k).length, c:c.c }))
    .filter(x => x.v);
  return card('الحوادث حسب النوع', 'ما يتكرّر يُعالَج من جذره',
    '<div class="donutwrap">' + donut({ data:d, center:'حادثة' }) + '</div>', 'i-warn');
}
function wRating() {
  const d = V.tasks.filter(t => t.status === 'done' && t.rating);
  const a = [5,4,3,2,1].map(n => ({ l:AR(n), v:d.filter(t => Math.round(t.rating) === n).length }));
  return card('توزيع التقييمات', 'أين تتكدّس المهام', chartBars({ data:a }), 'i-star');
}
function wHotels() {
  const d = HOTELS.slice(0, 12).map(h => ({
    l:h.ar.split(' ')[h.ar.split(' ').length - 1],
    v:V.groups.filter(g => g.hotelId === h.id).length, hot:false }));
  return card('إشغال الفنادق', 'كم مجموعة في كل فندق',
    chartBars({ data:d, foot:'الفندق بلا مجموعة يعني عقدًا معطّلًا.' }), 'i-key');
}
function wBusDay() {
  const d0 = dayStart(now());
  const d = V.buses.map(b => ({ l:b.no.replace('باص ',''),
    v:V.trips.filter(t => t.busId === b.id && dayStart(t.at) === d0).length, hot:false }));
  return card('رحلات الباصات اليوم', 'توزيع الحِمل على الأسطول',
    chartBars({ data:d, foot:'الباص الفارغ يُسنَد إليه، والمزدحم يُخفَّف.' }), 'i-bus');
}

/* ── قوائم ── */
function wQueue() { return decisionQueue(); }
function wFeed() {
  return '<div class="card hov fillcol">' +
    head('تدفّق الحوادث', 'مباشر من الميدان',
      '<button class="btn l sm" data-a="go" data-n="incidents">الكل</button>', 'i-warn') +
    '<div class="feed">' + V.feed.slice(0, 9).map((f, i) =>
      '<div class="evt ' + f.kind + '" style="animation-delay:' + (i * 40) + 'ms">' +
      '<span class="dot"></span><span class="sp"><b>' + E(f.title) + '</b>' +
      '<p>' + E(f.body) + '</p></span><span class="t">' + ago(f.at) + '</span></div>').join('') +
    '</div></div>';
}
function taskMini(t) {
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {};
  return '<div class="prow" data-a="tlopen" data-id="' + t.id + '" style="padding:10px 12px">' +
    '<span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' +
      icon(c.i || 'i-tasks','s16') + '</span>' +
    '<span class="nm" style="flex:1"><b>' + E(t.title) + '</b>' +
    '<span>' + E(t.kt) + ' · ' + E(L.name || '') + '</span></span>' +
    '<span class="tiny faint num">' + t12(t.start) + '</span></div>';
}
function wNext() {
  const n = V.tasks.filter(t => t.start > now()).sort((a, b) => a.start - b.start).slice(0, 7);
  return card('المهام القادمة', AR(n.length) + ' مهمة',
    n.length ? '<div class="plist">' + n.map(taskMini).join('') + '</div>'
      : empty('لا مهام قادمة', '', 'i-cal'), 'i-cal');
}
function wLive() {
  const n = runningTasks().slice(0, 7);
  return card('الجارية الآن', AR(n.length) + ' مهمة',
    n.length ? '<div class="plist">' + n.map(taskMini).join('') + '</div>'
      : empty('لا مهمة جارية', 'وهذا خبر جيّد', 'i-checkc'), 'i-play');
}
function wKt() {
  return '<div class="card hov">' +
    head('الفرق الميدانية', 'انقر صفًّا لتفصيله · انقر عنوان عمود لتفرزه',
      '<button class="btn l sm" data-a="go" data-n="teams">' + icon('i-users','s16') +
      'كل الفرق</button>', 'i-users') + ktTable() + '</div>';
}
function wTop() {
  const ms = V.users.filter(u => u.role === 'muhsen' && u.groupId)
    .map(u => ({ u, r:muhsenRating(u.id) })).sort((a, b) => b.r - a.r).slice(0, 7);
  return card('أعلى المحسنين تقييمًا', 'من الفرق المشكَّلة',
    '<div class="plist">' + ms.map((x, i) =>
      '<div class="prow" data-a="staffopen" data-id="' + x.u.id + '" style="padding:9px 11px">' +
      '<span class="rk' + (i === 0 ? ' top' : '') + '">' + AR(i + 1) + '</span>' +
      avatar(x.u, 'sm') +
      '<span class="nm" style="flex:1"><b>' + E(x.u.name) + '</b>' +
      '<span>' + E(x.u.kt) + ' · ' + E(x.u.specialty) + '</span></span>' +
      stars(x.r) + '</div>').join('') + '</div>', 'i-star');
}
function wBusNext() {
  const n = V.trips.filter(t => t.at > now()).sort((a, b) => a.at - b.at).slice(0, 7);
  return card('الرحلات القادمة', AR(n.length) + ' رحلة',
    n.length ? '<div class="plist">' + n.map(t => {
      const b = busById(t.busId) || {};
      return '<div class="prow" data-a="tropen" data-id="' + t.id + '" style="padding:10px 12px">' +
        '<span class="ico" style="color:' + (b.color || 'var(--dim)') + '">' +
          icon('i-bus','s16') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(t.to) + '</b>' +
        '<span>' + E(b.no || '') + ' · ' + AR(t.riders.length) + ' راكبًا</span></span>' +
        '<span class="tiny faint num">' + t12(t.at) + '</span></div>';
    }).join('') + '</div>' : empty('لا رحلة قادمة', '', 'i-bus'), 'i-bus');
}
function wNusukList() {
  const n = openNusuk().slice(0, 7);
  return card('حالات نُسك المفتوحة', AR(n.length) + ' حالة',
    n.length ? '<div class="plist">' + n.map(c =>
      '<div class="prow" data-a="nopen" data-id="' + c.id + '" style="padding:10px 12px">' +
      '<span class="ico" style="color:' + TASKTYPE.nusuk.c + '">' +
        icon(NUSUK_SVC[c.svc].i,'s16') + '</span>' +
      '<span class="nm" style="flex:1"><b>' + E(c.pilgrim) + '</b>' +
      '<span>' + E(NUSUK_SVC[c.svc].ar) + ' · ' + E(c.kt) + '</span></span>' +
      pill(NUSUK_STATE[c.state].ar, NUSUK_STATE[c.state].c) + '</div>').join('') + '</div>'
      : empty('لا حالة مفتوحة', '', 'i-checkc'), 'i-idcard');
}

/* ── خرائط ── */
function wMap() {
  return '<div class="card gold hov">' +
    head('خريطة العمليات', 'المسارات الحيّة تتحرّك باتجاه التفويج',
      '<span class="fl" style="gap:8px">' + pill(AR(runningTasks().length) + ' نشطة', 'live') +
      '<button class="btn l sm" data-a="go" data-n="tasks">المهام</button></span>', 'i-pin') +
    opsMap() +
    '<div class="maplegend">' +
      '<span><i class="ok"></i>مستقر</span><span><i class="wr"></i>مهام جارية</span>' +
      '<span><i class="bd"></i>تجاوز الوقت</span><span><i class="sn"></i>يتحرّك خلال ٦ ساعات</span>' +
      '<span class="faint" style="margin-inline-start:auto">النقطة المتحرّكة رتل في طريقه</span>' +
    '</div></div>';
}
function wGantt() {
  return '<div class="card hov">' +
    head('مسار الباصات اليوم', 'كل صفٍّ باصّ — والخطّ الأحمر هو الآن',
      '<button class="btn l sm" data-a="go" data-n="transport">النقل</button>', 'i-bus') +
    busGantt(dayStart(now())) + '</div>';
}
