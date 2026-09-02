/* ============================================================
   لوحة العمليات — الشاشة التي تُدار منها الغرفة
   ترتيبها يتبع سؤال المشغّل: ماذا يحتاج قراري؟ ثم أين نحن؟
   ثم كيف نسير؟ ثم من يحتاج انتباهي؟
   ============================================================ */

/* عقد الخريطة: مواضع تقريبية للمشاعر ومكة وجدة */
const MAP_NODES = [
  { k:'jeddah',  x:13, y:72, l:'مطار جدة' },
  { k:'makkah',  x:43, y:50, l:'مكة — الحرم' },
  { k:'aziziah', x:53, y:64, l:'العزيزية — السكن' },
  { k:'mina',    x:70, y:42, l:'منى' },
  { k:'muzd',    x:80, y:52, l:'مزدلفة' },
  { k:'arafah',  x:91, y:64, l:'عرفة' }
];
const KIND_NODE = { airport:'jeddah', checkout:'jeddah', checkin:'aziziah',
  umrah:'makkah', wada:'makkah', tour:'makkah', mina:'mina', jamarat:'mina', arafah:'arafah' };
const LEG = [['jeddah','makkah'],['makkah','aziziah'],['aziziah','mina'],['mina','muzd'],['muzd','arafah']];

function mapPath(a, b) {
  const A = MAP_NODES.find(n => n.k === a), B = MAP_NODES.find(n => n.k === b);
  return 'M' + A.x + ' ' + A.y + ' Q' + ((A.x + B.x) / 2) + ' ' + (Math.min(A.y, B.y) - 10) +
    ' ' + B.x + ' ' + B.y;
}

function opsMap() {
  const live = runningTasks();
  const busy = {}, late = {};
  live.forEach(t => {
    const k = KIND_NODE[t.kind] || 'makkah';
    busy[k] = (busy[k] || 0) + 1;
    if (now() > t.end) late[k] = 1;
  });
  /* المسارات القادمة خلال ٦ ساعات تُرسم أخفت — الغرفة ترى ما هو آتٍ */
  const soon = {};
  S.tasks.filter(t => t.start > now() && t.start < now() + 6 * HR).forEach(t => {
    const k = KIND_NODE[t.kind] || 'makkah'; soon[k] = (soon[k] || 0) + 1;
  });
  const hot = LEG.filter(l => busy[l[1]] || busy[l[0]]);
  const warm = LEG.filter(l => !hot.includes(l) && (soon[l[1]] || soon[l[0]]));

  return '<div class="map"><span class="radar"></span>' +
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<g stroke="currentColor" stroke-width=".45" fill="none" style="color:var(--line2)">' +
        LEG.map(l => '<path d="' + mapPath(l[0], l[1]) + '"/>').join('') + '</g>' +
      '<g stroke="currentColor" stroke-width=".8" fill="none" class="dash" style="color:var(--live)">' +
        hot.map(l => '<path d="' + mapPath(l[0], l[1]) + '"/>').join('') + '</g>' +
      '<g stroke="currentColor" stroke-width=".55" fill="none" class="dash slow" ' +
        'style="color:var(--gold2);opacity:.5">' +
        warm.map(l => '<path d="' + mapPath(l[0], l[1]) + '"/>').join('') + '</g>' +
      hot.slice(0, 3).map((l, i) =>
        '<circle class="convoy" r="1.2"><animateMotion dur="' + (7 + i * 2) + 's" ' +
        'repeatCount="indefinite" path="' + mapPath(l[0], l[1]) + '"/></circle>').join('') +
      warm.slice(0, 2).map((l, i) =>
        '<circle class="convoy warm" r="1"><animateMotion dur="' + (13 + i * 3) + 's" ' +
        'repeatCount="indefinite" path="' + mapPath(l[0], l[1]) + '"/></circle>').join('') +
    '</svg>' +
    MAP_NODES.map(n => {
      const cls = late[n.k] ? 'bad' : busy[n.k] ? 'warn' : soon[n.k] ? 'soon' : '';
      return '<span class="node ' + cls + '" style="inset-inline-end:' + n.x + '%;top:' + n.y + '%">' +
        '<span class="pin"></span><span class="lbl">' + E(n.l) +
        (busy[n.k] ? ' · ' + AR(busy[n.k]) : '') + '</span></span>';
    }).join('') +
  '</div>';
}

/* ---------- صفّ الأدوات العلوي ---------- */
function opsBar() {
  const rng = S.tab.rng || 'today';
  return '<div class="opsbar">' +
    '<div class="hello"><b>غرفة العمليات</b>' +
      '<span class="tiny faint">' + dayName(now()) + ' · ' + hijri(now()) + ' — ' +
      AR(leaders().length) + ' فرق · ' + AR(allPilgrims()) + ' حاجًّا تحت الإشراف</span></div>' +
    '<span class="sp"></span>' +
    segmented('rng', [['today','اليوم'],['week','الأسبوع'],['season','الموسم']], rng) +
    '<button class="btn l sm" data-a="go" data-n="timeline">' + icon('i-hist','s16') + 'الخط الزمني</button>' +
    '<button class="btn p sm" data-a="palette">' + icon('i-search','s16') + 'أمر سريع' +
      '<span class="kbd2">Ctrl K</span></button>' +
  '</div>';
}

/* نطاق المدة المختارة */
function rangeTasks() {
  const r = S.tab.rng || 'today';
  if (r === 'season') return S.tasks.slice();
  if (r === 'week') {
    const a = dayStart(now()) - 3 * DAY, b = a + 7 * DAY;
    return S.tasks.filter(t => t.start >= a && t.start < b);
  }
  return todayTasks();
}

function screenOps() {
  const rng = S.tab.rng || 'today';
  const scope = rangeTasks();
  const live = runningTasks();
  const done = scope.filter(t => t.status === 'done');
  const auto = scope.filter(t => t.autoStarted).length;
  const crit = openTickets().filter(k => k.pri === 'حرجة').length;
  const queue = decisionItems();
  const pend = queue.length;
  const rngName = rng === 'today' ? 'اليوم' : rng === 'week' ? 'هذا الأسبوع' : 'الموسم';

  return opsBar() +

    '<div class="grid g4">' +
      stat({ label:'مهام ' + rngName, n:scope.length, delta:scope.length - 8, ic:'i-tasks',
        sub:AR(done.length) + ' منجزة · ' + AR(live.length) + ' جارية',
        series:[6,8,7,11,9,13,10,Math.max(1,scope.length)] }) +
      stat({ label:'قرارات تنتظرك', n:pend, delta:pend ? pend - 1 : 0, ic:'i-send',
        cls:pend ? 'warn' : '', sub:AR(openSupport().length) + ' دعم · ' +
        AR(escalatedReports().length) + ' تقرير مصعَّد', series:[1,2,1,3,2,4,3,Math.max(1,pend)] }) +
      stat({ label:'تذاكر مفتوحة', n:openTickets().length, delta:2, ic:'i-ticket',
        cls:crit ? 'bad' : '', sub:AR(crit) + ' حرجة · من الحجاج',
        series:[3,5,4,6,5,8,6,Math.max(1,openTickets().length)] }) +
      stat({ label:'التزام البدء', n:scope.length ? Math.round((1 - auto / Math.max(1, scope.length)) * 100) : 100,
        suffix:'٪', delta:auto ? -auto : 0, ic:'i-play', cls:auto ? 'warn' : 'up',
        sub:auto ? AR(auto) + ' مهمة بدأها النظام' : 'كل المهام بدأها ليدرها',
        series:[88,90,86,92,89,94,91,100] }) +
    '</div>' +

    decisionQueue() +

    '<div class="grid g23">' +
      '<div class="card hov">' +
        head('حِمل اليوم بالساعات', 'كم مهمة تعمل في كل نافذتين — والعمود المضيء هو الآن',
          pill(AR(live.length) + ' الآن', live.length ? 'live' : 'grey'), 'i-hist') +
        chartBars({ data: loadByHour(), foot: 'الذروة تكشف الساعات التي تحتاج احتياطًا جاهزًا.' }) +
      '</div>' +
      '<div class="card hov">' +
        head('توزيع الحالات', 'من ' + AR(S.tasks.length) + ' مهمة في الموسم', '', 'i-pie') +
        '<div class="donutwrap">' + donut({ data: statusMix(), center:'مهمة' }) + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid g23">' +
      '<div class="card gold hov">' +
        head('خريطة العمليات', 'المسارات الحيّة تتحرّك باتجاه التفويج',
          '<span class="fl" style="gap:8px">' + pill(AR(live.length) + ' نشطة', 'live') +
          '<button class="btn l sm" data-a="go" data-n="tasks">المهام</button></span>') +
        opsMap() +
        '<div class="maplegend">' +
          '<span><i class="ok"></i>مستقر</span>' +
          '<span><i class="wr"></i>مهام جارية</span>' +
          '<span><i class="bd"></i>تجاوز الوقت</span>' +
          '<span><i class="sn"></i>يتحرّك خلال ٦ ساعات</span>' +
          '<span class="faint" style="margin-inline-start:auto">النقطة المتحرّكة رتل في طريقه</span>' +
        '</div>' +
      '</div>' +
      '<div class="card hov fillcol">' +
        head('تدفّق الحوادث', 'مباشر من التطبيق',
          '<button class="btn l sm" data-a="go" data-n="incidents">الكل</button>') +
        '<div class="feed">' + S.feed.slice(0, 9).map((f, i) =>
          '<div class="evt ' + f.kind + '" style="animation-delay:' + (i * 40) + 'ms">' +
          '<span class="dot"></span>' +
          '<span class="sp"><b>' + E(f.title) + '</b><p>' + E(f.body) + '</p></span>' +
          '<span class="t">' + ago(f.at) + '</span></div>').join('') + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="card hov">' +
      head('الفرق الميدانية', 'انقر صفًّا لفتح تفصيله · انقر عنوان عمود لتفرزه',
        '<button class="btn l sm" data-a="go" data-n="teams">' + icon('i-users','s16') + 'كل الفرق</button>') +
      ktTable() +
    '</div>';
}

/* ---------- درج الفريق ---------- */
function ktDrawer(id) {
  const L = userById(id); if (!L) return;
  const org = orgById(L.orgId) || {}, team = teamOf(L.id);
  const ts = S.tasks.filter(t => t.leaderId === L.id);
  const done = ts.filter(t => t.status === 'done');
  const live = ts.filter(t => now() >= t.start && now() < t.end && t.status !== 'done');
  const next = ts.filter(t => t.start > now()).sort((a, b) => a.start - b.start).slice(0, 4);
  const tk = openTickets().filter(k => k.leaderId === L.id);
  const rate = done.length ? (done.reduce((a, t) => a + (t.rating || 0), 0) / done.length).toFixed(1) : '—';

  openDrawer(L.kt + ' · ' + L.name, org.ar + ' · ' + org.country, 'i-shield',
    '<div class="grid g2" style="gap:12px">' +
      ['حجاج,' + L.pilgrims, 'محسنون,' + team.length, 'مهام منجزة,' + done.length].map(x => {
        const p = x.split(',');
        return '<div class="card mini"><span class="tiny faint">' + p[0] + '</span>' +
          '<b class="num" data-n="' + p[1] + '">٠</b></div>';
      }).join('') +
      '<div class="card mini"><span class="tiny faint">متوسط التقييم</span>' +
        '<b style="color:var(--gold3)">' + AR(rate) + '</b></div>' +
    '</div>' +

    (live.length ? '<div class="card live">' + head('جارية الآن', live[0].place) +
      '<b>' + E(live[0].title) + '</b>' +
      '<div class="tiny faint" style="margin-top:5px">تنتهي ' + t12(live[0].end) + '</div>' +
      '<div class="meter" style="margin-top:10px"><i data-w="' +
        Math.min(100, Math.round((now() - live[0].start) / (live[0].end - live[0].start) * 100)) +
        '"></i></div></div>' : '') +

    '<div class="card">' + head('المهام القادمة', AR(next.length) + ' مهمة') +
      '<div class="rows">' + (next.length ? next.map(t => {
        const c = CAT[t.kind] || {};
        return '<div class="row" data-a="tlopen" data-id="' + t.id + '">' +
          '<span class="av" style="color:' + (c.c || 'var(--dim)') + '">' + icon(c.i || 'i-tasks','s16') + '</span>' +
          '<span class="nm"><b>' + E(t.title) + '</b><span>' + hijri(t.start) + ' · ' + t12(t.start) + '</span></span>' +
          pill(untilTxt(t.start), 'wait') + '</div>';
      }).join('') : '<div class="empty" style="padding:20px"><b>لا مهام قادمة</b></div>') + '</div></div>' +

    '<div class="card">' + head('الفريق', AR(team.length) + ' محسن') +
      '<div class="rows">' + team.map(m =>
        '<div class="row" style="padding:9px 4px">' + avatar(m) +
        '<span class="nm"><b>' + E(m.name) + '</b><span>' + E(m.specialty) + '</span></span>' +
        pill('نشط','live') + '</div>').join('') + '</div></div>' +

    (tk.length ? '<div class="card">' + head('تذاكر مفتوحة', AR(tk.length)) +
      tk.slice(0, 4).map(k => '<div class="evt ' + (k.pri === 'حرجة' ? 'bad' : 'warn') + '">' +
        '<span class="dot"></span><span class="sp"><b>' + E(k.title) + '</b>' +
        '<p>' + E(k.from) + ' · ' + E(k.cat) + '</p></span></div>').join('') + '</div>' : ''));
}
