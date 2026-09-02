/* ============================================================
   لوحة العمليات — الشاشة التي تُقرأ من بعيد
   ============================================================ */

/* عقد الخريطة: مواضع تقريبية للمشاعر ومكة وجدة */
const MAP_NODES = [
  { k:'jeddah',  x:14, y:70, l:'مطار جدة' },
  { k:'makkah',  x:44, y:52, l:'مكة — الحرم' },
  { k:'aziziah', x:53, y:63, l:'العزيزية — السكن' },
  { k:'mina',    x:70, y:44, l:'منى' },
  { k:'muzd',    x:80, y:52, l:'مزدلفة' },
  { k:'arafah',  x:90, y:62, l:'عرفة' }
];
const KIND_NODE = { airport:'jeddah', checkout:'jeddah', checkin:'aziziah',
  umrah:'makkah', wada:'makkah', tour:'makkah', mina:'mina', jamarat:'mina', arafah:'arafah' };

function opsMap() {
  const live = runningTasks();
  const busy = {};
  live.forEach(t => { const k = KIND_NODE[t.kind] || 'makkah'; busy[k] = (busy[k] || 0) + 1; });
  const late = {};
  live.forEach(t => { if (now() > t.end) { const k = KIND_NODE[t.kind] || 'makkah'; late[k] = 1; } });

  const path = (a, b) => {
    const A = MAP_NODES.find(n => n.k === a), B = MAP_NODES.find(n => n.k === b);
    return 'M' + A.x + ' ' + A.y + ' Q' + ((A.x + B.x) / 2) + ' ' + (Math.min(A.y, B.y) - 9) +
      ' ' + B.x + ' ' + B.y;
  };
  return '<div class="map">' +
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<g stroke="#1D3329" stroke-width=".5" fill="none">' +
        '<path d="' + path('jeddah','makkah') + '"/>' +
        '<path d="' + path('makkah','aziziah') + '"/>' +
        '<path d="' + path('aziziah','mina') + '"/>' +
        '<path d="' + path('mina','muzd') + '"/>' +
        '<path d="' + path('muzd','arafah') + '"/></g>' +
      '<g stroke="#12B76A" stroke-width=".7" fill="none" class="dash" opacity=".85">' +
        '<path d="' + path('jeddah','makkah') + '"/>' +
        '<path d="' + path('aziziah','mina') + '"/></g>' +
    '</svg>' +
    MAP_NODES.map(n => {
      const cls = late[n.k] ? 'bad' : busy[n.k] ? 'warn' : '';
      return '<span class="node ' + cls + '" style="inset-inline-end:' + n.x + '%;top:' + n.y + '%">' +
        '<span class="pin"></span><span class="lbl">' + E(n.l) +
        (busy[n.k] ? ' · ' + AR(busy[n.k]) + ' جارية' : '') + '</span></span>';
    }).join('') +
  '</div>';
}

function ktCard(L) {
  const team = teamOf(L.id);
  const live = S.tasks.filter(t => t.leaderId === L.id && t.status !== 'done' &&
    now() >= t.start && now() < t.end);
  const next = S.tasks.filter(t => t.leaderId === L.id && t.start > now())
    .sort((a, b) => a.start - b.start)[0];
  const tk = openTickets().filter(k => k.leaderId === L.id).length;
  const sp = openSupport().filter(s => (taskById(s.taskId) || {}).leaderId === L.id).length;
  const org = orgById(L.orgId) || {};
  const st = sp ? ['يحتاج دعمًا','no'] : live.length ? ['في مهمة','live'] : ['مستقر','grey'];
  return '<button class="card ' + (live.length ? 'live' : '') + '" data-a="go" data-n="teams" ' +
    'data-id="' + L.id + '" style="width:100%;text-align:right">' +
    '<div class="h" style="margin-bottom:10px">' +
      '<span class="av">' + icon('i-shield','s18') + '</span>' +
      '<span class="sp"><b>' + E(L.kt) + ' · ' + E(L.name) + '</b>' +
      '<div class="tiny faint">' + E(org.ar || '') + ' · ' + E(org.country || '') + '</div></span>' +
      pill(st[0], st[1]) + '</div>' +
    '<div class="grid g3" style="gap:8px">' +
      '<span><div class="tiny faint">حجاج</div><b class="num">' + AR(L.pilgrims) + '</b></span>' +
      '<span><div class="tiny faint">محسنون</div><b class="num">' + AR(team.length) + '</b></span>' +
      '<span><div class="tiny faint">تذاكر</div><b class="num" style="color:' +
        (tk ? 'var(--amber)' : 'var(--dim)') + '">' + AR(tk) + '</b></span>' +
    '</div>' +
    (live.length
      ? '<div class="tiny" style="margin-top:11px;color:var(--live)">' + icon('i-play','s14') +
        ' ' + E(live[0].title) + ' — تنتهي ' + t12(live[0].end) + '</div>'
      : next ? '<div class="tiny faint" style="margin-top:11px">' + icon('i-clock','s14') +
        ' التالية: ' + E(next.title) + ' ' + untilTxt(next.start) + '</div>'
      : '<div class="tiny faint" style="margin-top:11px">لا مهام قادمة</div>') +
  '</button>';
}

function screenOps() {
  const live = runningTasks();
  const today = todayTasks();
  const doneToday = today.filter(t => t.status === 'done').length;
  const auto = S.tasks.filter(t => t.autoStarted && t.status !== 'done').length;

  return '<div class="grid g4">' +
      kpi('حجاج تحت الإشراف', AR(allPilgrims()), AR(leaders().length) + ' مجموعة KT', '', 'i-users') +
      kpi('مهام جارية الآن', AR(live.length), AR(today.length) + ' مهمة اليوم', 'up', 'i-play') +
      kpi('طلبات تنتظر قرارك', AR(openSupport().length + escalatedReports().length),
        AR(openSupport().length) + ' دعم · ' + AR(escalatedReports().length) + ' تقرير',
        openSupport().length ? 'warn' : '', 'i-send') +
      kpi('تذاكر مفتوحة', AR(openTickets().length),
        AR(openTickets().filter(k => k.pri === 'حرجة').length) + ' حرجة',
        openTickets().filter(k => k.pri === 'حرجة').length ? 'bad' : '', 'i-ticket') +
    '</div>' +

    '<div class="grid g23">' +
      '<div class="card gold">' +
        head('خريطة العمليات', 'المشاعر والحرم والمطار — المواقع النشطة الآن',
          pill(AR(live.length) + ' نشطة', 'live')) +
        opsMap() +
        '<div class="tiny faint" style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap">' +
          '<span>● أخضر: مستقر</span><span style="color:var(--amber)">● كهرماني: مهام جارية</span>' +
          '<span style="color:var(--red)">● أحمر: تجاوز الوقت</span></div>' +
      '</div>' +
      '<div class="card">' +
        head('تدفّق الحوادث', 'مباشر من التطبيق',
          '<button class="btn l sm" data-a="go" data-n="incidents">الكل</button>') +
        '<div class="feed">' + S.feed.slice(0, 8).map(f =>
          '<div class="evt ' + f.kind + '"><span class="dot"></span>' +
          '<span class="sp"><b>' + E(f.title) + '</b><p>' + E(f.body) + '</p></span>' +
          '<span class="t">' + ago(f.at) + '</span></div>').join('') + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="h" style="margin:6px 2px 0"><b>الفرق الميدانية</b>' +
      '<span class="sp"></span>' +
      '<button class="btn l sm" data-a="go" data-n="teams">' + icon('i-users','s16') + 'كل الفرق</button></div>' +
    '<div class="grid g3">' + leaders().map(ktCard).join('') + '</div>' +

    (auto ? '<div class="card" style="border-color:rgba(229,72,77,.3)">' +
      head('مهام بدأها النظام', 'لم يبدأها ليدرها في وقتها — تُحتسب في التقييم') +
      '<div class="rows">' + S.tasks.filter(t => t.autoStarted && t.status !== 'done').slice(0, 5).map(t =>
        '<div class="row"><span class="av">' + icon('i-warn','s18') + '</span>' +
        '<span class="nm"><b>' + E(t.title) + '</b><span>' + E(t.kt) + ' · ' +
          E((userById(t.leaderId) || {}).name) + '</span></span>' +
        pill('بدأها النظام', 'no') + '<span class="tiny faint">' + t12(t.start) + '</span></div>').join('') +
      '</div></div>' : '');
}
