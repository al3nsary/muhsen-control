/* ============================================================
   بقية الشاشات — مبدئية، تُستكمل بتفاصيلك
   ============================================================ */

/* ---------- طلبات الدعم: القرار الذي ينتظره الميدان ---------- */
function screenSupport() {
  const list = S.support.slice().sort((a, b) => b.at - a.at);
  return '<div class="grid g3">' +
      kpi('بانتظار قرارك', AR(openSupport().length), 'كل دقيقة تأخير تُحسب', 'warn', 'i-send') +
      kpi('لُبّيت اليوم', AR(S.support.filter(s => s.state === 'done').length), 'أُسند محسنون من الاحتياط', 'up', 'i-checkc') +
      kpi('الاحتياط المتاح', AR(reserveTeam().length), 'مشترك بين كل الفرق', '', 'i-shield') +
    '</div>' +
    '<div class="card gold">' +
      head('طلبات الدعم', 'الليدر لا يرى الاحتياط ولا يختار منه — أنت من يُسند ويوضّح السبب') +
      (list.length ? '<div class="rows">' + list.map(s => {
        const t = taskById(s.taskId) || {};
        const L = userById(s.by) || {};
        const st = s.state === 'pending' ? ['بانتظار قرارك','wait']
          : s.state === 'done' ? ['لُبّي','live'] : ['اعتُذر','no'];
        return '<div class="row" style="align-items:flex-start;padding:16px 4px">' +
          '<span class="av">' + icon('i-send','s18') + '</span>' +
          '<span class="nm"><b>' + E(s.no) + ' · ' + E(t.title || '') + '</b>' +
          '<span>' + E(t.kt || '') + ' · ' + E(L.name || '') + ' — يطلب ' + AR(s.count) + ' محسن</span>' +
          '<div class="tiny muted" style="margin-top:7px">' + E(s.why) + '</div>' +
          (s.reason ? '<div class="tiny" style="margin-top:6px;color:var(--gold3)">ردّك: ' + E(s.reason) + '</div>' : '') +
          '</span>' +
          '<span style="text-align:left">' + pill(st[0], st[1]) +
          '<div class="tiny faint" style="margin-top:6px">' + ago(s.at) + '</div></span>' +
          (s.state === 'pending' ? '<span style="display:flex;gap:8px">' +
            '<button class="btn d sm" data-a="spno" data-id="' + s.id + '">اعتذار</button>' +
            '<button class="btn p sm" data-a="spok" data-id="' + s.id + '">إسناد من الاحتياط</button></span>' : '') +
        '</div>';
      }).join('') + '</div>'
        : empty('لا طلبات دعم', 'ما يرفعه الليدرز يظهر هنا فورًا', 'i-send')) +
    '</div>';
}

/* ---------- الحوادث ---------- */
function screenIncidents() {
  const f = S.tab.inc || 'all';
  const list = S.feed.filter(x => f === 'all' ? true : x.kind === f);
  return '<div class="card">' +
    head('تدفّق الحوادث', 'كل ما يجري في الميدان — مرتّبًا بوقته',
      '<span style="display:flex;gap:8px">' +
      [['all','الكل'],['bad','حرجة'],['warn','تحتاج انتباهًا'],['ok','مكتملة']].map(x =>
        '<button class="btn ' + (f === x[0] ? 'p' : 'l') + ' sm" data-a="seg" data-k="inc" data-v="' + x[0] + '">' +
        x[1] + '</button>').join('') + '</span>') +
    (list.length ? '<div class="feed" style="max-height:none">' + list.map(x =>
      '<div class="evt ' + x.kind + '"><span class="dot"></span>' +
      '<span class="sp"><b>' + E(x.title) + '</b><p>' + E(x.body) + '</p></span>' +
      '<span class="t">' + ago(x.at) + '</span></div>').join('') + '</div>'
      : empty('لا حوادث في هذا التصنيف', '', 'i-checkc')) + '</div>';
}

/* ---------- المهام ---------- */
function screenTasks() {
  const f = S.tab.tf || 'today';
  const all = S.tasks.slice().sort((a, b) => a.start - b.start);
  const list = f === 'today' ? all.filter(t => dayStart(t.start) === dayStart(now()))
    : f === 'live' ? all.filter(t => now() >= t.start && now() < t.end && t.status !== 'done')
    : f === 'next' ? all.filter(t => t.start > now())
    : f === 'done' ? all.filter(t => t.status === 'done') : all;
  return '<div class="grid g4">' +
      kpi('مهام الموسم', AR(all.length), 'عبر ' + AR(leaders().length) + ' فرق', '', 'i-tasks') +
      kpi('اليوم', AR(todayTasks().length), dayName(now()), '', 'i-cal') +
      kpi('جارية', AR(runningTasks().length), 'الآن', 'up', 'i-play') +
      kpi('منجزة', AR(all.filter(t => t.status === 'done').length), 'بمتوسط تقييم ' +
        AR((all.filter(t => t.rating).reduce((a, t) => a + t.rating, 0) /
          Math.max(1, all.filter(t => t.rating).length)).toFixed(1)), 'up', 'i-checkc') +
    '</div>' +
    '<div class="card">' +
      head('جدول المهام', 'المصدر الذي يقرأ منه التطبيق',
        '<span style="display:flex;gap:8px">' +
        [['today','اليوم'],['live','جارية'],['next','قادمة'],['done','منجزة'],['all','الكل']].map(x =>
          '<button class="btn ' + (f === x[0] ? 'p' : 'l') + ' sm" data-a="seg" data-k="tf" data-v="' + x[0] + '">' +
          x[1] + '</button>').join('') + '</span>') +
      (list.length ? '<div class="rows">' + list.map(t => {
        const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {};
        const running = now() >= t.start && now() < t.end && t.status !== 'done';
        return '<div class="row">' +
          '<span class="av" style="color:' + (c.c || 'var(--dim)') + '">' + icon(c.i || 'i-tasks','s18') + '</span>' +
          '<span class="nm"><b>' + E(t.title) + '</b>' +
          '<span>' + E(t.kt) + ' · ' + E(L.name || '') + ' · ' + E(t.place) + '</span></span>' +
          '<span class="tiny faint num" style="min-width:120px">' + hijri(t.start) + '<br>' +
            t12(t.start) + ' — ' + t12(t.end) + '</span>' +
          pill(AR(t.assigned.length) + ' محسن', 'grey') +
          (t.status === 'done' ? pill('منجزة · ★ ' + AR(t.rating || 0), 'live')
            : running ? pill('جارية', 'live') : pill(untilTxt(t.start), 'wait')) +
          (t.autoStarted ? pill('بدأها النظام', 'no') : '') +
        '</div>';
      }).join('') + '</div>' : empty('لا مهام في هذا التصنيف', '', 'i-cal')) +
    '</div>';
}

/* ---------- الفرق ---------- */
function screenTeams() {
  return '<div class="grid g2">' + leaders().map(L => {
    const team = teamOf(L.id), org = orgById(L.orgId) || {};
    const ts = S.tasks.filter(t => t.leaderId === L.id);
    return '<div class="card">' +
      head(L.kt + ' · ' + L.name, org.ar + ' · ' + org.country,
        pill(AR(L.pilgrims) + ' حاج', 'gold')) +
      '<div class="grid g3" style="gap:10px;margin-bottom:14px">' +
        '<span><div class="tiny faint">محسنون</div><b class="num">' + AR(team.length) + '</b></span>' +
        '<span><div class="tiny faint">مهام</div><b class="num">' + AR(ts.length) + '</b></span>' +
        '<span><div class="tiny faint">منجزة</div><b class="num">' +
          AR(ts.filter(t => t.status === 'done').length) + '</b></span>' +
      '</div>' +
      '<div class="rows">' + team.map(m =>
        '<div class="row" style="padding:9px 4px">' + avatar(m) +
        '<span class="nm"><b>' + E(m.name) + '</b><span>' + E(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        pill('نشط', 'live') + '</div>').join('') + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

/* ---------- الاحتياط ---------- */
function screenReserve() {
  const res = reserveTeam();
  return '<div class="card gold">' +
      head('الفريق الاحتياطي', 'يديره الكنترول وحده — لا يراه ليدر ولا يختار منه',
        pill(AR(res.length) + ' متاح', 'live')) +
      '<div class="tiny muted" style="margin-bottom:14px">' +
        'يُسنَد من هنا استجابةً لطلبات الدعم، ويُوضَّح سبب القرار للّيدر الطالب.</div>' +
      '<div class="rows">' + res.map(m =>
        '<div class="row">' + avatar(m) +
        '<span class="nm"><b>' + E(m.name) + '</b><span>' + E(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        pill('متاح', 'live') +
        '<button class="btn l sm" data-a="go" data-n="support">إسناد لطلب</button></div>').join('') +
      '</div></div>';
}

/* ---------- التذاكر ---------- */
function screenTickets() {
  const f = S.tab.kf || 'open';
  const list = S.tickets.filter(k => f === 'open' ? k.status !== 'مغلقة'
    : f === 'crit' ? k.pri === 'حرجة' : f === 'closed' ? k.status === 'مغلقة' : true)
    .sort((a, b) => b.at - a.at);
  return '<div class="card">' +
    head('تذاكر الحجاج', 'يرفعها الحجاج وحدهم — تصل الليدر ونراها هنا',
      '<span style="display:flex;gap:8px">' +
      [['open','مفتوحة'],['crit','حرجة'],['closed','مغلقة'],['all','الكل']].map(x =>
        '<button class="btn ' + (f === x[0] ? 'p' : 'l') + ' sm" data-a="seg" data-k="kf" data-v="' + x[0] + '">' +
        x[1] + '</button>').join('') + '</span>') +
    (list.length ? '<div class="rows">' + list.map(k =>
      '<div class="row" style="align-items:flex-start;padding:14px 4px">' +
      '<span class="av">' + icon('i-ticket','s18') + '</span>' +
      '<span class="nm"><b>' + E(k.title) + '</b>' +
      '<span>' + E(k.no) + ' · ' + E(k.from) + ' · ' + E(k.kt) + '</span>' +
      '<div class="tiny muted" style="margin-top:6px">' + E(k.body) + '</div></span>' +
      pill(k.cat, 'grey') +
      pill(k.pri, k.pri === 'حرجة' ? 'no' : k.pri === 'عاجلة' ? 'wait' : 'grey') +
      pill(k.status, k.status === 'مغلقة' ? 'live' : 'wait') +
      '<span class="tiny faint">' + ago(k.at) + '</span></div>').join('') + '</div>'
      : empty('لا تذاكر', '', 'i-ticket')) + '</div>';
}

/* ---------- التقارير ---------- */
function screenReports() {
  const list = S.reports.slice().sort((a, b) => b.at - a.at);
  return '<div class="card">' +
    head('التقارير الصاعدة', 'ما صعّده الليدرز — ومنها تعديلات بيانات الغرف') +
    (list.length ? '<div class="rows">' + list.map(r =>
      '<div class="row" style="align-items:flex-start;padding:14px 4px">' +
      '<span class="av">' + icon(r.room ? 'i-key' : 'i-flag','s18') + '</span>' +
      '<span class="nm"><b>' + E(r.title) + '</b>' +
      '<span>' + E(r.no) + ' · ' + E(r.kt) + ' · ' + E((userById(r.from) || {}).name || '') + '</span>' +
      '<div class="tiny muted" style="margin-top:6px">' + E(r.body) + '</div>' +
      (r.room ? '<div class="tiny" style="margin-top:6px;color:var(--gold3)">' +
        icon('i-key','s14') + ' ' + E(r.room.floor) + ' · غرفة ' + E(r.room.no) + '</div>' : '') +
      '</span>' +
      pill(r.cat, 'gold') + pill(r.status, r.escalated ? 'no' : 'wait') +
      (r.room ? '<button class="btn p sm" data-a="roomapply" data-id="' + r.id + '">' +
        'تحديث قاعدة البيانات</button>' : '') +
      '<span class="tiny faint">' + ago(r.at) + '</span></div>').join('') + '</div>'
      : empty('لا تقارير', '', 'i-flag')) + '</div>';
}

/* ---------- شاشات مبدئية ---------- */
function stub(t, d, ic, points) {
  return '<div class="card gold">' + head(t, d) +
    '<div class="tiny muted" style="line-height:2.1">' +
    (points || []).map(p => '· ' + E(p)).join('<br>') + '</div>' +
    '<div class="empty" style="padding:34px 20px">' + icon(ic, 's26') +
      '<b>جاهزة للبناء</b><div class="tiny" style="margin-top:6px">' +
      'أعطني تفاصيلها ونبنيها بالكامل كما بنينا لوحة العمليات.</div></div></div>';
}
const screenPilgrims = () => stub('قاعدة الحجاج', 'السجل الأصل — الغرف والأدوار والحالات', 'i-user',
  ['بحث فوري في ' + AR(allPilgrims()) + ' حاج عبر كل الـKT',
   'تعديل الدور ورقم الغرفة — ومنه يُحدَّث التطبيق',
   'الحالات الصحية والبلاغات المرفوعة من الميدان',
   'استيراد كشوف الوصول والمغادرة']);
const screenQuality = () => stub('الجودة والتقييم', 'مصدر تقييم المشرفين والحجاج', 'i-star',
  ['إدخال تقييم مشرف السكن لكل مهمة منتهية',
   'تجميع تقييم الحجاج ورفعه إلى التطبيق',
   'ترتيب الفرق والليدرز بالمتوسط التراكمي',
   'الملاحظات المسجّلة على كل محسن']);
const screenGuides = () => stub('أدلة التنفيذ', 'تُنشر من هنا إلى كل الأجهزة', 'i-guide',
  ['تحرير دليل كل نوع نشاط: نص · صور · فيديو · PDF',
   'الشرح المتحرك لكل مهمة',
   'نشر نسخة واعتمادها — والتطبيق يقرأ المعتمد',
   'سجل النسخ ومن حرّرها']);
const screenBroadcast = () => stub('البثّ والإشعارات', 'رسالة واحدة إلى فئة مختارة', 'i-bell',
  ['الفئات: كل الليدرز · كل المحسنين · فريق بعينه · KT بعينه',
   'إشعار فوري داخل التطبيق وخارجه',
   'سجل ما أُرسل ومن استلم']);
const screenShifts = () => stub('تبديل الشِفتات', 'ما رفعه الليدرز إلى الكنترول', 'i-swap',
  ['طلبات التبديل المرفوعة مع مسارها',
   'الاعتماد أو الاعتذار بسبب مكتوب',
   'جدول الشِفتات لكل الموظفين']);
const screenAudit = () => stub('سجل النظام', 'كل قرار بصاحبه ووقته — لا شيء يُمحى', 'i-hist',
  ['كل إسناد ودعم واعتماد وتعديل',
   'تصفية بالفاعل وبالنوع وبالتاريخ',
   'تصدير السجل']);

function screenSettings() {
  return '<div class="grid g2">' +
    '<div class="card">' + head('التجربة', 'أدوات معاينة لا تُشحن للعميل') +
      '<div class="tiny muted" style="margin-bottom:12px">تقديم الساعة يكشف سلوك النوافذ الزمنية.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        [['-60','− ساعة'],['-15','− ١٥ د'],['0','الآن'],['15','+ ١٥ د'],['60','+ ساعة'],['360','+ ٦ ساعات']]
          .map(x => '<button class="btn l sm" data-a="clock" data-v="' + x[0] + '">' + x[1] + '</button>').join('') +
      '</div>' +
      '<div class="tiny faint" style="margin-top:12px">الإزاحة الحالية: ' +
        AR(S.clockOffset || 0) + ' دقيقة</div>' +
      '<button class="btn d" style="margin-top:16px" data-a="reset">' + icon('i-reset','s16') +
        'إعادة ضبط كل البيانات</button>' +
    '</div>' +
    '<div class="card gold">' + head('عن النظام', 'مُحسن · الكنترول') +
      '<div class="tiny muted" style="line-height:2.1">' +
      '· هذا النظام هو <b>المصدر الأصل</b>: منه تُخلق المهام والفرق والحجاج والأدلة.<br>' +
      '· تطبيق الميدان يقرأ منه ويرفع إليه الطلبات والتقارير.<br>' +
      '· مشروعان منفصلان في مستودعين — يربطهما العقد لا الملفات.</div>' +
      '<div class="tiny faint" style="margin-top:14px">' + APP_VER + ' · بنية ' + AR(SCHEMA) + '</div>' +
    '</div></div>';
}
