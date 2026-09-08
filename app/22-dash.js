/* ============================================================
   لوحة عمليات تُخصَّص — وتبقى مرتّبة مهما اختار المشغّل
   ─────────────────────────────────────────────────────────────
   الدرس الذي بنى هذا الملف: قائمةٌ واحدة من عناصر مختلفة
   الأعراض والأطوال تُنتج ثقوبًا وحوافّ ممزّقة. فالحلّ ليس
   ترتيبًا أذكى بل **أشرطة متجانسة**: كل شريط أعمدته وارتفاعه،
   وما بداخله متشابه. يُعاد الترتيب داخل الشريط لا عبره.
   ============================================================ */

const BANDS = [
  { k:'kpi',   ar:'المؤشّرات', d:'أرقام تُقرأ في لمحة',        cols:4, h:0   },
  { k:'wide',  ar:'الصفوف العريضة', d:'ما يحتاج عرض الشاشة',   cols:1, h:472 },
  { k:'chart', ar:'الرسوم',    d:'توزيعات ومقارنات',           cols:3, h:352 },
  { k:'list',  ar:'القوائم',   d:'أحدث ما يخصّ كل باب',        cols:3, h:412 },
  { k:'map',   ar:'الخرائط والمسارات', d:'الموقع والزمن',      cols:2, h:452 }
];
const bandOf = k => BANDS.find(b => b.k === k) || BANDS[0];

/* ── كل ودجت: شريطه · عرضه داخله · راسمه ── */
const WIDGETS = [
  /* ═ مؤشّرات ═ */
  { k:'kpiTasks',   ar:'مهام المدة',          b:'kpi', w:1, i:'i-tasks',  f:wTasksKpi },
  { k:'kpiDecide',  ar:'قرارات تنتظرك',       b:'kpi', w:1, i:'i-send',   f:wDecideKpi },
  { k:'kpiTickets', ar:'تذاكر مفتوحة',        b:'kpi', w:1, i:'i-ticket', f:wTicketsKpi },
  { k:'kpiStart',   ar:'التزام البدء',        b:'kpi', w:1, i:'i-play',   f:wStartKpi },
  { k:'kpiStaff',   ar:'المحسنون',            b:'kpi', w:1, i:'i-idcard', f:wStaffKpi },
  { k:'kpiPil',     ar:'الحجاج',              b:'kpi', w:1, i:'i-users',  f:wPilKpi },
  { k:'kpiBus',     ar:'رحلات اليوم',         b:'kpi', w:1, i:'i-bus',    f:wBusKpi },
  { k:'kpiNusuk',   ar:'حالات نُسك',          b:'kpi', w:1, i:'i-idcard', f:wNusukKpi },
  { k:'kpiQuality', ar:'متوسط التقييم',       b:'kpi', w:1, i:'i-star',   f:wQualityKpi },
  { k:'kpiAfasha',  ar:'مقاولو العفاشة',      b:'kpi', w:1, i:'i-truck',  f:wAfashaKpi },
  { k:'kpiInc',     ar:'حوادث حرجة',          b:'kpi', w:1, i:'i-warn',   f:wIncKpi },
  { k:'kpiSupport', ar:'طلبات الدعم',         b:'kpi', w:1, i:'i-send',   f:wSupKpi },
  { k:'kpiReports', ar:'تقارير مصعَّدة',      b:'kpi', w:1, i:'i-flag',   f:wRepKpi },
  { k:'kpiGroups',  ar:'مجموعات مشكَّلة',     b:'kpi', w:1, i:'i-users',  f:wGrpKpi },
  { k:'kpiFree',    ar:'محسنون بلا مجموعة',   b:'kpi', w:1, i:'i-user',   f:wFreeKpi },
  { k:'kpiEnrich',  ar:'رحلات المزارات',      b:'kpi', w:1, i:'i-pin',    f:wEnrKpi },
  { k:'kpiComply',  ar:'إدخالات الامتثال',    b:'kpi', w:1, i:'i-clip',   f:wCmpKpi },
  { k:'kpiGuides',  ar:'أدلة معتمدة',         b:'kpi', w:1, i:'i-guide',  f:wGdKpi },
  { k:'kpiHotels',  ar:'فنادق بلا مشرف',      b:'kpi', w:1, i:'i-key',    f:wHotKpi },
  { k:'kpiShifts',  ar:'طلبات الشِفتات',      b:'kpi', w:1, i:'i-swap',   f:wShfKpi },

  /* ═ صفوف عريضة ═ */
  { k:'queue',      ar:'صفّ القرارات',        b:'wide', w:1, i:'i-send',  f:wQueue },
  { k:'ktTable',    ar:'جدول الفرق',          b:'wide', w:1, i:'i-users', f:wKt },
  { k:'gantt',      ar:'مسار الباصات اليوم',  b:'wide', w:1, i:'i-bus',   f:wGantt },
  { k:'heat',       ar:'كثافة الأسبوع',       b:'wide', w:1, i:'i-hist',  f:wHeat },

  /* ═ رسوم ═ */
  { k:'chLoad',     ar:'حِمل اليوم بالساعات', b:'chart', w:2, i:'i-hist',  f:wLoad },
  { k:'chStatus',   ar:'حالات المهام',        b:'chart', w:1, i:'i-pie',   f:wStatus },
  { k:'chTypes',    ar:'أنواع العمل',         b:'chart', w:1, i:'i-tasks', f:wTypes },
  { k:'chOrgs',     ar:'الحِمل حسب الجهة',    b:'chart', w:2, i:'i-flag',  f:wOrgs },
  { k:'chInc',      ar:'الحوادث حسب النوع',   b:'chart', w:1, i:'i-warn',  f:wInc },
  { k:'chRating',   ar:'توزيع التقييمات',     b:'chart', w:1, i:'i-star',  f:wRating },
  { k:'chHotels',   ar:'إشغال الفنادق',       b:'chart', w:2, i:'i-key',   f:wHotels },
  { k:'chBusDay',   ar:'حِمل الأسطول',        b:'chart', w:2, i:'i-bus',   f:wBusDay },
  { k:'chArrive',   ar:'وصول الحجاج',         b:'chart', w:1, i:'i-users', f:wArrive },
  { k:'chSpec',     ar:'توزيع التخصّصات',     b:'chart', w:2, i:'i-idcard',f:wSpec },
  { k:'chWeek',     ar:'حِمل الأسبوع',        b:'chart', w:2, i:'i-cal',   f:wWeek },
  { k:'chCountry',  ar:'الحجاج حسب الدولة',   b:'chart', w:1, i:'i-flag',  f:wCountry },
  { k:'chSms',      ar:'حالة الرسائل',        b:'chart', w:1, i:'i-send',  f:wSms },
  { k:'chDeals',    ar:'حالات العقود',        b:'chart', w:1, i:'i-doc',   f:wDeals },
  { k:'chNusuk',    ar:'خدمات نُسك',          b:'chart', w:1, i:'i-idcard',f:wNusukCh },
  { k:'gauge',      ar:'مقياس الالتزام',      b:'chart', w:1, i:'i-target',f:wGauge },

  /* ═ قوائم ═ */
  { k:'feed',       ar:'تدفّق الحوادث',       b:'list', w:1, i:'i-warn',   f:wFeed },
  { k:'nextTasks',  ar:'المهام القادمة',      b:'list', w:1, i:'i-cal',    f:wNext },
  { k:'liveTasks',  ar:'الجارية الآن',        b:'list', w:1, i:'i-play',   f:wLive },
  { k:'topStaff',   ar:'أعلى المحسنين',       b:'list', w:1, i:'i-star',   f:wTop },
  { k:'busNext',    ar:'الرحلات القادمة',     b:'list', w:1, i:'i-bus',    f:wBusNext },
  { k:'nusukOpen',  ar:'حالات نُسك المفتوحة', b:'list', w:1, i:'i-idcard', f:wNusukList },
  { k:'lsSupport',  ar:'طلبات الدعم',         b:'list', w:1, i:'i-send',   f:wSupList },
  { k:'lsTickets',  ar:'آخر التذاكر',         b:'list', w:1, i:'i-ticket', f:wTktList },
  { k:'lsReports',  ar:'آخر التقارير',        b:'list', w:1, i:'i-flag',   f:wRepList },
  { k:'lsShifts',   ar:'طلبات الشِفتات',      b:'list', w:1, i:'i-swap',   f:wShfList },
  { k:'lsCare',     ar:'حجاج يحتاجون رعاية',  b:'list', w:1, i:'i-user',   f:wCareList },
  { k:'lsDeals',    ar:'عقود بانتظار الردّ',  b:'list', w:1, i:'i-truck',  f:wDealList },
  { k:'lsGuides',   ar:'أحدث الأدلة',         b:'list', w:1, i:'i-guide',  f:wGdList },
  { k:'lsAudit',    ar:'آخر السجل',           b:'list', w:1, i:'i-hist',   f:wAuditList },
  { k:'lsOrgs',     ar:'الجهات وحِملها',      b:'list', w:1, i:'i-flag',   f:wOrgList },

  /* ═ خرائط ═ */
  { k:'map',        ar:'خريطة العمليات',      b:'map', w:2, i:'i-pin',    f:wMap },
  { k:'mapHotels',  ar:'لوحة الفنادق',        b:'map', w:1, i:'i-key',    f:wHotelBoard },
  { k:'mapNow',     ar:'شريط الساعة القادمة', b:'map', w:1, i:'i-hour',   f:wNowStrip }
];
const widgetOf = k => WIDGETS.find(w => w.k === k);

const DASH_DEFAULT = [
  'kpiTasks','kpiDecide','kpiTickets','kpiStart',
  'queue',
  'chLoad','chStatus','chInc',
  'feed','nextTasks','topStaff',
  'map','mapNow',
  'ktTable'
];
const dashKeys = () => (S.dash && S.dash.length ? S.dash : DASH_DEFAULT.slice())
  .filter(widgetOf);

/* ============================================================
   الرسم: الأشرطة بترتيبها، وداخل كل شريط ترتيب المشغّل
   ============================================================ */
function screenOps() {
  const keys = dashKeys();
  const rng = S.tab.rng || 'today';

  const bands = BANDS.map(b => ({
    b, items: keys.filter(k => widgetOf(k).b === b.k)
  })).filter(x => x.items.length);

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

  (bands.length ? bands.map(x =>
    '<section class="band" style="--cols:' + x.b.cols + ';' +
      (x.b.h ? '--wh:' + x.b.h + 'px' : '--wh:auto') + '">' +
      (x.b.k === 'kpi' || x.b.k === 'wide' ? '' :
        '<div class="bandhead"><span>' + E(x.b.ar) + '</span></div>') +
      '<div class="bandgrid">' + x.items.map((k, i) => {
        const w = widgetOf(k);
        return '<div class="dw w' + w.w + '" style="animation-delay:' + (i * 40) + 'ms">' +
          w.f() + '</div>';
      }).join('') + '</div>' +
    '</section>').join('')
    : '<div class="card">' + empty('اللوحة فارغة',
        'اضغط «تخصيص اللوحة» واختر ما يهمّك', 'i-target') + '</div>');
}

/* ---------- محرّر اللوحة: شريط شريط ---------- */
function dashEdit() {
  const keys = dashKeys();
  return '' + (S.drawer = { title:'تخصيص لوحة العمليات',
    sub:'كل شريط أعمدته وارتفاعه — والترتيب داخله، فلا تتمزّق اللوحة',
    icon:'i-gear', body:

    '<div class="card gold">' +
      head('لوحتك الآن', AR(keys.length) + ' عنصرًا في ' +
        AR(BANDS.filter(b => keys.some(k => widgetOf(k).b === b.k)).length) + ' أشرطة',
        '<button class="btn l sm" data-a="dashreset">الافتراضي</button>') +
      '<div class="quote">الأشرطة ترتيبها ثابت: المؤشّرات ثم الصفوف العريضة ثم الرسوم ' +
        'ثم القوائم ثم الخرائط. وأنت ترتّب داخل الشريط.</div>' +
    '</div>' +

    BANDS.map(b => {
      const mine = keys.filter(k => widgetOf(k).b === b.k);
      const all = WIDGETS.filter(w => w.b === b.k);
      return '<div class="card">' +
        head(b.ar, b.d + ' · ' + AR(b.cols) + ' أعمدة',
          pill(AR(mine.length) + ' من ' + AR(all.length), mine.length ? 'live' : 'grey')) +

        (mine.length ? '<div class="plist" style="margin-bottom:13px">' + mine.map((k, i) => {
          const w = widgetOf(k);
          return '<div class="prow" style="padding:8px 11px">' +
            '<span class="sn">' + AR(i + 1) + '</span>' +
            '<span class="ico sm" style="color:var(--gold2)">' + icon(w.i,'s14') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(w.ar) + '</b>' +
            '<span>عرض ' + AR(w.w) + ' من ' + AR(b.cols) + '</span></span>' +
            '<span class="fl" style="gap:4px">' +
              (i > 0 ? '<button class="xbtn" data-a="dashup" data-k="' + b.k +
                '" data-v="' + i + '" title="أعلى">' + icon('i-back','s14') + '</button>' : '') +
              (i < mine.length - 1 ? '<button class="xbtn" data-a="dashdn" data-k="' + b.k +
                '" data-v="' + i + '" title="أسفل">' + icon('i-fwd','s14') + '</button>' : '') +
              '<button class="xbtn" data-a="dashoff" data-v="' + k + '">' +
                icon('i-x','s14') + '</button>' +
            '</span></div>';
        }).join('') + '</div>' : '') +

        '<div class="permgrid">' + all.map(w => {
          const on = mine.indexOf(w.k) >= 0;
          return '<button class="pchk' + (on ? ' on' : '') + '" data-a="dashtog" data-v="' + w.k + '">' +
            '<span class="box">' + (on ? icon('i-checkc','s14') : '') + '</span>' +
            icon(w.i,'s16') + '<b>' + E(w.ar) + '</b></button>';
        }).join('') + '</div></div>';
    }).join('')
  }, renderDrawer(), '');
}

/* ============================================================
   لبنات مشتركة
   ============================================================ */
function card(title, sub, body, ic, right) {
  return '<div class="card hov">' + head(title, sub, right || '', ic) +
    '<div class="wbody">' + body + '</div></div>';
}
function listCard(title, sub, ic, rows, emptyTxt, right) {
  return '<div class="card hov">' + head(title, sub, right || '', ic) +
    (rows.length ? '<div class="wbody plist">' + rows.join('') + '</div>'
      : '<div class="wbody">' + empty(emptyTxt || 'لا شيء', '', 'i-checkc') + '</div>') + '</div>';
}
function rowMini(ic, color, title, sub, right, act, id) {
  return '<div class="prow"' + (act ? ' data-a="' + act + '" data-id="' + id + '"' : '') +
    ' style="padding:10px 12px">' +
    '<span class="ico" style="color:' + (color || 'var(--dim)') + '">' + icon(ic,'s16') + '</span>' +
    '<span class="nm" style="flex:1"><b>' + E(title) + '</b>' +
    '<span>' + E(sub) + '</span></span>' + (right || '') + '</div>';
}
function rangeTasks() {
  const r = S.tab.rng || 'today';
  if (r === 'season') return V.tasks.slice();
  if (r === 'week') {
    const a = dayStart(now()) - 3 * DAY, b = a + 7 * DAY;
    return V.tasks.filter(t => t.start >= a && t.start < b);
  }
  return V.tasks.filter(t => dayStart(t.start) === dayStart(now()));
}

/* ============================================================
   المؤشّرات
   ============================================================ */
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
  const all = allPilgrimRows(), arr = all.filter(p => p.state === 'وصل').length;
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
function wIncKpi() {
  const bad = V.feed.filter(f => f.kind === 'bad').length;
  return stat({ label:'حوادث حرجة', n:bad, ic:'i-warn', cls:bad ? 'bad' : 'up',
    sub:'من ' + AR(V.feed.length) + ' حادثة', series:[2,3,2,4,3,5,4,Math.max(1, bad)] });
}
function wSupKpi() {
  return stat({ label:'طلبات الدعم', n:openSupport().length, ic:'i-send',
    cls:openSupport().length ? 'warn' : 'up', sub:'بانتظار قرارك',
    series:[1,2,3,2,4,3,4,Math.max(1, openSupport().length)] });
}
function wRepKpi() {
  return stat({ label:'تقارير مصعَّدة', n:escalatedReports().length, ic:'i-flag',
    cls:escalatedReports().length ? 'warn' : 'up', sub:'تجاوزت مستوى الفريق',
    series:[0,1,1,2,2,3,2,Math.max(1, escalatedReports().length)] });
}
function wGrpKpi() {
  const full = V.groups.filter(g => g.members.length === 5).length;
  return stat({ label:'مجموعات مشكَّلة', n:V.groups.length, ic:'i-users', cls:'up',
    sub:AR(full) + ' مكتملة · ' + AR(V.groups.length - full) + ' ناقصة',
    series:[4,8,12,16,19,21,22,V.groups.length] });
}
function wFreeKpi() {
  const n = freeMuhsens().length;
  return stat({ label:'بلا مجموعة', n, ic:'i-user', cls:n ? 'warn' : 'up',
    sub:'متاحون للتشكيل', series:[100,80,60,40,25,15,10,Math.max(0, n)] });
}
function wEnrKpi() {
  return stat({ label:'رحلات المزارات', n:V.enrich.length, ic:'i-pin',
    cls:freeEnrich().length ? 'warn' : 'up',
    sub:AR(freeEnrich().length) + ' بلا تسكين',
    series:[4,7,9,11,13,14,15,Math.max(1, V.enrich.length)] });
}
function wCmpKpi() {
  const low = V.subs.filter(b => b.score < 70).length;
  return stat({ label:'إدخالات الامتثال', n:V.subs.length, ic:'i-clip',
    cls:low ? 'warn' : 'up', sub:AR(low) + ' دون الحدّ',
    series:[3,6,9,12,14,16,18,Math.max(1, V.subs.length)] });
}
function wGdKpi() {
  const live = V.guides.filter(g => g.status === 'live').length;
  return stat({ label:'أدلة معتمدة', n:live, ic:'i-guide', cls:'up',
    sub:'يقرؤها الميدان الآن', series:[4,5,6,7,8,9,10,Math.max(1, live)] });
}
function wHotKpi() {
  const n = HOTELS.filter(h => !supOfHotel(h.id)).length;
  return stat({ label:'فنادق بلا مشرف', n, ic:'i-key', cls:n ? 'bad' : 'up',
    sub:'من ' + AR(HOTELS.length) + ' فندقًا', series:[4,3,3,2,2,1,1,Math.max(0, n)] });
}
function wShfKpi() {
  return stat({ label:'طلبات الشِفتات', n:openSwaps().length, ic:'i-swap',
    cls:openSwaps().length ? 'warn' : 'up', sub:'رفعها الليدرز',
    series:[1,2,1,3,2,4,3,Math.max(1, openSwaps().length)] });
}

/* ============================================================
   الرسوم
   ============================================================ */
function wLoad() {
  return card('حِمل اليوم بالساعات', 'كل نافذة ساعتان — والعمود المضيء هو الآن',
    chartBars({ data: loadByHour() }), 'i-hist',
    pill(AR(runningTasks().length) + ' الآن', runningTasks().length ? 'live' : 'grey'));
}
function wStatus() {
  return card('حالات المهام', 'من ' + AR(V.tasks.length) + ' مهمة',
    '<div class="donutwrap">' + donut({ data: statusMix(), center:'مهمة' }) + '</div>', 'i-pie');
}
function wTypes() {
  const d = [
    { l:'حجّ', v:V.tasks.length, c:TASKTYPE.hajj.c },
    { l:'إثراء', v:V.enrich.length, c:TASKTYPE.enrich.c },
    { l:'نُسك', v:V.nusuk.length, c:TASKTYPE.nusuk.c },
    { l:'امتثال', v:V.subs.length, c:TASKTYPE.comply.c }
  ].filter(x => x.v);
  return card('أنواع العمل', 'أين يتوزّع الجهد',
    '<div class="donutwrap">' + donut({ data:d, center:'بند' }) + '</div>', 'i-tasks');
}
function wOrgs() {
  const d = V.orgs.slice(0, 12).map(o => ({
    l:o.kt.replace('KT',''), v:V.tasks.filter(t => t.kt === o.kt).length, hot:false }));
  return card('الحِمل حسب الجهة', 'عدد مهام كل KT', chartBars({ data:d }), 'i-flag');
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
    l:h.ar.split(' ').slice(-1)[0],
    v:V.groups.filter(g => g.hotelId === h.id).length, hot:false }));
  return card('إشغال الفنادق', 'كم مجموعة في كل فندق', chartBars({ data:d }), 'i-key');
}
function wBusDay() {
  const d0 = dayStart(now());
  const d = V.buses.map(b => ({ l:b.no.replace('باص ',''),
    v:V.trips.filter(t => t.busId === b.id && dayStart(t.at) === d0).length, hot:false }));
  return card('حِمل الأسطول', 'رحلات كل باص اليوم', chartBars({ data:d }), 'i-bus');
}
function wArrive() {
  const all = allPilgrimRows();
  const d = [
    { l:'وصلوا', v:all.filter(p => p.state === 'وصل').length, c:'var(--live)' },
    { l:'لم يصلوا', v:all.filter(p => p.state === 'لم يصل').length, c:'var(--amber)' },
    { l:'غادروا', v:all.filter(p => p.state === 'غادر').length, c:'var(--line2)' }
  ].filter(x => x.v);
  return card('وصول الحجاج', 'من ' + AR(all.length) + ' حاجًّا',
    '<div class="donutwrap">' + donut({ data:d, center:'حاجّ' }) + '</div>', 'i-users');
}
function wSpec() {
  const d = SPECS.map(s => ({ l:s,
    v:V.users.filter(u => u.specialty === s && u.role === 'muhsen').length, hot:false }));
  return card('توزيع التخصّصات', 'أين يكثر المحسنون وأين يقلّون',
    chartBars({ data:d }), 'i-idcard');
}
function wWeek() {
  const d = [];
  for (let i = -3; i <= 3; i++) {
    const d0 = dayStart(now()) + i * DAY;
    d.push({ l:dayName(d0).slice(0, 3),
      v:V.tasks.filter(t => dayStart(t.start) === d0).length, hot:i === 0 });
  }
  return card('حِمل الأسبوع', 'ثلاثة قبل وثلاثة بعد — والمضيء هو اليوم',
    chartBars({ data:d }), 'i-cal');
}
function wCountry() {
  const by = {};
  allPilgrimRows().forEach(p => { by[p.country] = (by[p.country] || 0) + 1; });
  const cs = ['var(--live)','var(--blue)','var(--gold)','var(--violet)'];
  const d = Object.keys(by).map((k, i) => ({ l:k, v:by[k], c:cs[i % cs.length] }));
  return card('الحجاج حسب الدولة', 'من أين جاؤوا',
    '<div class="donutwrap">' + donut({ data:d, center:'حاجّ' }) + '</div>', 'i-flag');
}
function wSms() {
  const d = Object.keys(SMS_ST).map(k => ({ l:SMS_ST[k].ar,
    v:V.contractors.filter(c => c.sms === k).length,
    c:k === 'delivered' ? 'var(--live)' : k === 'failed' ? 'var(--red)'
      : k === 'sent' ? 'var(--amber)' : 'var(--line2)' })).filter(x => x.v);
  return card('حالة الرسائل', 'بيانات دخول المقاولين',
    d.length ? '<div class="donutwrap">' + donut({ data:d, center:'رسالة' }) + '</div>'
      : empty('لا رسائل', '', 'i-send'), 'i-send');
}
function wDeals() {
  const d = Object.keys(DEAL_ST).map(k => ({ l:DEAL_ST[k].ar,
    v:V.deals.filter(x => x.state === k).length,
    c:k === 'agreed' || k === 'offline' ? 'var(--live)' : k === 'refused' ? 'var(--red)'
      : k === 'sent' ? 'var(--amber)' : 'var(--line2)' })).filter(x => x.v);
  return card('حالات العقود', 'مع مقاولي العفاشة',
    d.length ? '<div class="donutwrap">' + donut({ data:d, center:'عقد' }) + '</div>'
      : empty('لا عقود', '', 'i-doc'), 'i-doc');
}
function wNusukCh() {
  const d = Object.keys(NUSUK_SVC).map(k => ({ l:NUSUK_SVC[k].ar,
    v:V.nusuk.filter(c => c.svc === k).length,
    c:k === 'lost' ? 'var(--red)' : k === 'issue' ? 'var(--blue)' : 'var(--live)' }))
    .filter(x => x.v);
  return card('خدمات نُسك', 'أيّها أكثر طلبًا',
    d.length ? '<div class="donutwrap">' + donut({ data:d, center:'حالة' }) + '</div>'
      : empty('لا حالات', '', 'i-idcard'), 'i-idcard');
}
/* مقياس نصف دائري — التزام البدء */
function wGauge() {
  const s = rangeTasks(), auto = s.filter(t => t.autoStarted).length;
  const pct = s.length ? Math.round((1 - auto / s.length) * 100) : 100;
  const R = 62, C = Math.PI * R;                 /* نصف محيط */
  const on = C * (pct / 100);
  return card('مقياس الالتزام', 'كم مهمة بدأها ليدرها لا النظام',
    '<div class="gauge">' +
      '<svg viewBox="0 0 160 92">' +
        '<path d="M18 82 A62 62 0 0 1 142 82" fill="none" stroke="var(--sheen2)" ' +
          'stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M18 82 A62 62 0 0 1 142 82" fill="none" ' +
          'stroke="' + (pct >= 90 ? 'var(--live)' : pct >= 75 ? 'var(--amber)' : 'var(--red)') + '" ' +
          'stroke-width="14" stroke-linecap="round" ' +
          'stroke-dasharray="' + on.toFixed(1) + ' ' + (C - on).toFixed(1) + '"/>' +
      '</svg>' +
      '<span class="gv"><b class="num" data-n="' + pct + '" data-suffix="٪">٠</b>' +
      '<span>' + (auto ? AR(auto) + ' بدأها النظام' : 'كلّها بدأها ليدرها') + '</span></span>' +
    '</div>', 'i-target');
}

/* ============================================================
   القوائم
   ============================================================ */
function wQueue() { return decisionQueue(); }
function wKt() {
  return '<div class="card hov">' +
    head('الفرق الميدانية', 'انقر صفًّا لتفصيله · انقر عنوان عمود لتفرزه',
      '<button class="btn l sm" data-a="go" data-n="teams">' + icon('i-users','s16') +
      'كل الفرق</button>', 'i-users') + ktTable() + '</div>';
}
function wGantt() {
  return '<div class="card hov">' +
    head('مسار الباصات اليوم', 'كل صفٍّ باصّ — والخطّ الأحمر هو الآن',
      '<button class="btn l sm" data-a="go" data-n="transport">النقل</button>', 'i-bus') +
    busGantt(dayStart(now())) + '</div>';
}
/* كثافة الأسبوع: أيام × نوافذ ساعتين */
function wHeat() {
  const days = [], d0 = dayStart(now()) - 3 * DAY;
  for (let i = 0; i < 7; i++) days.push(d0 + i * DAY);
  let mx = 1;
  const grid = days.map(d => {
    const row = [];
    for (let h = 0; h < 24; h += 2) {
      const a = d + h * HR, b = a + 2 * HR;
      const n = V.tasks.filter(t => t.start < b && t.end > a).length;
      if (n > mx) mx = n;
      row.push({ n, at:a });
    }
    return { d, row };
  });
  return '<div class="card hov">' +
    head('كثافة الأسبوع', 'كل مربّع نافذة ساعتين — واللون كثافة المهام فيها',
      pill('الأعلى ' + AR(mx), 'gold'), 'i-hist') +
    '<div class="heat">' +
      '<div class="hhead"><span></span>' + Array.from({ length: 12 }, (_, i) =>
        '<span>' + AR(i * 2) + '</span>').join('') + '</div>' +
      grid.map(g => '<div class="hrow' + (g.d === dayStart(now()) ? ' today' : '') + '">' +
        '<span class="hl">' + E(dayName(g.d).slice(0, 3)) + '</span>' +
        g.row.map(c => '<span class="hc" style="--v:' + (c.n / mx).toFixed(2) + '" ' +
          'title="' + E(dayName(g.d) + ' · ' + AR(c.n) + ' مهمة') + '">' +
          (c.n ? AR(c.n) : '') + '</span>').join('') + '</div>').join('') +
    '</div></div>';
}
function taskMini(t) {
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {};
  return rowMini(c.i || 'i-tasks', c.c, t.title, t.kt + ' · ' + (L.name || ''),
    '<span class="tiny faint num">' + t12(t.start) + '</span>', 'tlopen', t.id);
}
function wFeed() {
  return '<div class="card hov">' +
    head('تدفّق الحوادث', 'مباشر من الميدان',
      '<button class="btn l sm" data-a="go" data-n="incidents">الكل</button>', 'i-warn') +
    '<div class="wbody feed">' + V.feed.slice(0, 12).map((f, i) =>
      '<div class="evt ' + f.kind + '" style="animation-delay:' + (i * 40) + 'ms">' +
      '<span class="dot"></span><span class="sp"><b>' + E(f.title) + '</b>' +
      '<p>' + E(f.body) + '</p></span><span class="t">' + ago(f.at) + '</span></div>').join('') +
    '</div></div>';
}
function wNext() {
  const n = V.tasks.filter(t => t.start > now()).sort((a, b) => a.start - b.start).slice(0, 12);
  return listCard('المهام القادمة', AR(n.length) + ' مهمة', 'i-cal',
    n.map(taskMini), 'لا مهام قادمة');
}
function wLive() {
  const n = runningTasks().slice(0, 12);
  return listCard('الجارية الآن', AR(n.length) + ' مهمة', 'i-play',
    n.map(taskMini), 'لا مهمة جارية');
}
function wTop() {
  const ms = V.users.filter(u => u.role === 'muhsen' && u.groupId)
    .map(u => ({ u, r:muhsenRating(u.id) })).sort((a, b) => b.r - a.r).slice(0, 12);
  return listCard('أعلى المحسنين', 'من الفرق المشكَّلة', 'i-star',
    ms.map((x, i) => '<div class="prow" data-a="staffopen" data-id="' + x.u.id +
      '" style="padding:9px 11px">' +
      '<span class="rk' + (i === 0 ? ' top' : '') + '">' + AR(i + 1) + '</span>' +
      avatar(x.u, 'sm') +
      '<span class="nm" style="flex:1"><b>' + E(x.u.name) + '</b>' +
      '<span>' + E(x.u.kt) + ' · ' + E(x.u.specialty) + '</span></span>' +
      stars(x.r) + '</div>'), 'لا محسنين');
}
function wBusNext() {
  const n = V.trips.filter(t => t.at > now()).sort((a, b) => a.at - b.at).slice(0, 12);
  return listCard('الرحلات القادمة', AR(n.length) + ' رحلة', 'i-bus',
    n.map(t => { const b = busById(t.busId) || {};
      return rowMini('i-bus', b.color, t.to, (b.no || '') + ' · ' + AR(t.riders.length) + ' راكبًا',
        '<span class="tiny faint num">' + t12(t.at) + '</span>', 'tropen', t.id); }),
    'لا رحلة قادمة');
}
function wNusukList() {
  const n = openNusuk().slice(0, 12);
  return listCard('حالات نُسك المفتوحة', AR(n.length) + ' حالة', 'i-idcard',
    n.map(c => rowMini(NUSUK_SVC[c.svc].i, TASKTYPE.nusuk.c, c.pilgrim,
      NUSUK_SVC[c.svc].ar + ' · ' + c.kt,
      pill(NUSUK_STATE[c.state].ar, NUSUK_STATE[c.state].c), 'nopen', c.id)),
    'لا حالة مفتوحة');
}
function wSupList() {
  const n = V.support.filter(s => s.state === 'pending').slice(0, 12);
  return listCard('طلبات الدعم', AR(n.length) + ' بانتظار قرارك', 'i-send',
    n.map(s => { const L = userById(s.by) || {}, t = taskById(s.taskId) || {};
      return rowMini('i-send', 'var(--amber)', (t.title || '') + ' — ' + AR(s.count) + ' محسن',
        (L.name || '') + ' · ' + (t.kt || ''),
        '<span class="tiny faint">' + ago(s.at) + '</span>', 'go', null); }),
    'لا طلب معلّق', '<button class="btn l sm" data-a="go" data-n="support">الكل</button>');
}
function wTktList() {
  const n = V.tickets.filter(k => k.status !== 'مغلقة')
    .sort((a, b) => b.at - a.at).slice(0, 12);
  return listCard('آخر التذاكر', AR(n.length) + ' مفتوحة', 'i-ticket',
    n.map(k => rowMini('i-ticket', k.pri === 'حرجة' ? 'var(--red)' : 'var(--amber)',
      k.title, k.from + ' · ' + k.kt,
      pill(k.pri, k.pri === 'حرجة' ? 'no' : k.pri === 'عاجلة' ? 'wait' : 'grey'),
      'tkopen2', k.id)), 'لا تذاكر');
}
function wRepList() {
  const n = V.reports.slice().sort((a, b) => b.at - a.at).slice(0, 12);
  return listCard('آخر التقارير', AR(n.length) + ' تقريرًا', 'i-flag',
    n.map(r => rowMini('i-flag', r.escalated ? 'var(--red)' : 'var(--dim)',
      r.title, r.kt + ' · ' + r.cat,
      pill(r.status, r.escalated ? 'no' : 'wait'), 'rpopen', r.id)), 'لا تقارير');
}
function wShfList() {
  const n = V.swaps.filter(w => w.state === 'pending').slice(0, 12);
  return listCard('طلبات الشِفتات', AR(n.length) + ' بانتظار القرار', 'i-swap',
    n.map(w => { const a = userById(w.from) || {}, b = userById(w.to) || {};
      return rowMini('i-swap', 'var(--blue)', (a.name || '') + ' ← ' + (b.name || ''),
        w.day + ' · ' + w.slot, '<span class="tiny faint">' + ago(w.at) + '</span>'); }),
    'لا طلبات', '<button class="btn l sm" data-a="go" data-n="shifts">الكل</button>');
}
function wCareList() {
  const n = allPilgrimRows().filter(p => p.flag).slice(0, 12);
  return listCard('حجاج يحتاجون رعاية', AR(n.length) + ' حالة', 'i-user',
    n.map(p => rowMini('i-user', 'var(--red)', p.name,
      p.kt + ' · ' + p.floor + ' · غرفة ' + AR(p.room),
      pill(p.flag, 'no'), 'pilopen', p.id)), 'لا حالات رعاية');
}
function wDealList() {
  const n = V.deals.filter(d => d.state === 'sent').slice(0, 12);
  return listCard('عقود بانتظار الردّ', AR(n.length) + ' عقدًا', 'i-truck',
    n.map(d => { const c = contractorById(d.contractorId) || {};
      return rowMini('i-truck', 'var(--amber)', c.name || '', (c.company || '') + ' · ' + d.no,
        pill(DEAL_ST[d.state].ar, DEAL_ST[d.state].c), 'copen', c.id); }),
    'لا عقود معلّقة', '<button class="btn l sm" data-a="go" data-n="afasha">الكل</button>');
}
function wGdList() {
  const n = V.guides.slice().sort((a, b) => b.at - a.at).slice(0, 12);
  return listCard('أحدث الأدلة', AR(n.length) + ' دليلًا', 'i-guide',
    n.map(g => rowMini((G_SCOPE[g.scope] || G_SCOPE.free).i,
      (G_SCOPE[g.scope] || G_SCOPE.free).c, g.title,
      (G_SCOPE[g.scope] || G_SCOPE.free).ar + ' · ن' + AR(g.ver),
      pill(G_ST[g.status].ar, G_ST[g.status].c), 'gdview', g.id)), 'لا أدلة');
}
function wAuditList() {
  const n = V.log.slice(0, 12);
  return listCard('آخر السجل', AR(V.log.length) + ' قيدًا', 'i-hist',
    n.map(l => { const k = LOG_KIND[l.kind] || LOG_KIND.info;
      return rowMini(k.i, 'var(--gold2)', l.text, l.by + ' · ' + t12(l.at),
        pill(k.ar, k.c)); }),
    'لا قيود', '<button class="btn l sm" data-a="go" data-n="audit">الكل</button>');
}
function wOrgList() {
  const n = V.orgs.slice(0, 12);
  return listCard('الجهات وحِملها', AR(n.length) + ' جهة', 'i-flag',
    n.map(o => rowMini('i-flag', o.type === 'بعثة' ? 'var(--blue)' : 'var(--gold)',
      o.kt + ' · ' + o.ar, o.type + ' · ' + o.country + ' · ' + AR(o.pilgrims) + ' حاجًّا',
      pill(AR(V.tasks.filter(t => t.kt === o.kt).length) + ' مهمة', 'grey'))), 'لا جهات');
}

/* ============================================================
   الخرائط
   ============================================================ */
function wMap() {
  return '<div class="card gold hov">' +
    head('خريطة العمليات', 'المسارات الحيّة تتحرّك باتجاه التفويج',
      '<span class="fl" style="gap:8px">' + pill(AR(runningTasks().length) + ' نشطة', 'live') +
      '<button class="btn l sm" data-a="go" data-n="tasks">المهام</button></span>', 'i-pin') +
    opsMap() +
    '<div class="maplegend">' +
      '<span><i class="ok"></i>مستقر</span><span><i class="wr"></i>مهام جارية</span>' +
      '<span><i class="bd"></i>تجاوز الوقت</span><span><i class="sn"></i>خلال ٦ ساعات</span>' +
    '</div></div>';
}
function wHotelBoard() {
  const rows = HOTELS.map(h => {
    const gs = V.groups.filter(g => g.hotelId === h.id);
    const sv = supOfHotel(h.id);
    return '<div class="prow" style="padding:9px 11px">' +
      '<span class="ico" style="color:' + (sv ? 'var(--live)' : 'var(--amber)') + '">' +
        icon('i-key','s16') + '</span>' +
      '<span class="nm" style="flex:1"><b>' + E(h.ar) + '</b>' +
      '<span>' + (sv ? E(sv.name) : 'بلا مشرف') + '</span></span>' +
      pill(AR(gs.length), gs.length ? 'live' : 'grey') + '</div>';
  });
  return listCard('لوحة الفنادق', AR(HOTELS.length) + ' فندقًا · المجموعات والمشرفون',
    'i-key', rows, 'لا فنادق');
}
/* شريط الساعة القادمة: ما يبدأ وما يتحرّك */
function wNowStrip() {
  const t1 = now() + 60 * MIN;
  const ts = V.tasks.filter(t => t.start > now() && t.start <= t1)
    .sort((a, b) => a.start - b.start);
  const tr = V.trips.filter(t => t.at > now() && t.at <= t1).sort((a, b) => a.at - b.at);
  const items = ts.map(t => ({ at:t.start, i:(CAT[t.kind] || {}).i || 'i-tasks',
      c:(CAT[t.kind] || {}).c, t:t.title, s:t.kt + ' · ' + t.place, a:'tlopen', id:t.id }))
    .concat(tr.map(t => ({ at:t.at, i:'i-bus', c:(busById(t.busId) || {}).color,
      t:'رحلة إلى ' + t.to, s:(busById(t.busId) || {}).no + ' · ' + AR(t.riders.length) + ' راكبًا',
      a:'tropen', id:t.id })))
    .sort((a, b) => a.at - b.at);
  return listCard('الساعة القادمة', AR(items.length) + ' حدثًا خلال ٦٠ دقيقة', 'i-hour',
    items.map(x => rowMini(x.i, x.c, x.t, x.s,
      '<span class="tiny faint num">' + t12(x.at) + '</span>', x.a, x.id)),
    'لا شيء خلال ساعة');
}
