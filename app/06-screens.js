/* ============================================================
   بقية الشاشات — على مسطرة التطبيق نفسها:
   بطاقة لكل بند · وجه · نجوم · حصيلة تحت خطّ فاصل
   ============================================================ */

/* ---------- بطاقة مهمة: ضلع نوعها ملوّن، ووقتها كتلة واحدة ---------- */
function taskRow(t) {
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {};
  const running = now() >= t.start && now() < t.end && t.status !== 'done';
  return '<div class="prow trow" data-a="tlopen" data-id="' + t.id + '">' +
    '<span class="krail" style="background:' + (c.c || 'var(--dim)') + '"></span>' +
    '<span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' +
      icon(c.i || 'i-tasks', 's18') + '</span>' +
    '<span class="nm" style="flex:1"><b>' + E(t.title) + '</b>' +
      '<span>' + E(t.kt) + ' · ' + E(L.name || '') + ' · ' + E(t.place) + '</span></span>' +
    '<span class="when"><b>' + hijri(t.start) + '</b>' +
      '<span class="num">' + t12(t.start) + ' — ' + t12(t.end) + '</span></span>' +
    '<span class="fl" style="gap:9px">' +
      avatar(L, 'sm') + pill(AR(t.assigned.length) + ' محسن', 'grey') + '</span>' +
    '<span class="end">' +
      (t.status === 'done' ? stars(t.rating || 0)
        : running ? pill('جارية الآن', 'live') : pill(untilTxt(t.start), 'wait')) +
      (t.autoStarted ? '<div style="margin-top:6px">' + pill('بدأها النظام', 'no') + '</div>' : '') +
    '</span></div>';
}

/* ---------- طلبات الدعم: القرار الذي ينتظره الميدان ---------- */
function screenSupport() {
  const f = S.tab.sf || 'open';
  const all = S.support.slice().sort((a, b) => b.at - a.at);
  const list = all.filter(s => f === 'open' ? s.state === 'pending'
    : f === 'done' ? s.state === 'done' : f === 'no' ? s.state === 'no' : true);
  return '<div class="grid g3">' +
      stat({ label:'بانتظار قرارك', n:openSupport().length, ic:'i-send',
        cls:openSupport().length ? 'warn' : '', sub:'كل دقيقة تأخير تُحسب',
        series:[1,2,1,3,2,4,3,Math.max(1, openSupport().length)] }) +
      stat({ label:'لُبّيت', n:all.filter(s => s.state === 'done').length, ic:'i-checkc',
        cls:'up', sub:'أُسند محسنون من الاحتياط', series:[0,1,1,2,2,3,3,4] }) +
      stat({ label:'الاحتياط المتاح', n:reserveTeam().length, ic:'i-shield',
        sub:'مشترك بين كل الفرق', series:[8,8,7,8,8,8,8,reserveTeam().length] }) +
    '</div>' +
    '<div class="card gold">' +
      head('طلبات الدعم', 'الليدر لا يرى الاحتياط ولا يختار منه — أنت من يُسند ويوضّح السبب',
        '', 'i-send') +
      '<div class="tools">' + segmented('sf',
        [['open','بانتظار القرار'],['done','لُبّيت'],['no','اعتُذر'],['all','الكل']], f) + '</div>' +
      (list.length ? '<div class="plist">' + list.map((s, i) => {
        const t = taskById(s.taskId) || {}, L = userById(s.by) || {};
        const st = s.state === 'pending' ? ['بانتظار قرارك','wait']
          : s.state === 'done' ? ['لُبّي','live'] : ['اعتُذر','no'];
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 60) + 'ms">' +
          avatar(L, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(s.no) + ' · ' + E(t.title || '') + '</b>' +
          '<span>' + E(t.kt || '') + ' · ' + E(L.name || '') + ' — يطلب ' +
            AR(s.count) + ' محسن</span></span>' +
          '<span class="end">' + pill(st[0], st[1]) +
            '<div class="tiny faint" style="margin-top:6px">' + ago(s.at) + '</div></span>' +
          '<div style="width:100%">' +
            '<div class="quote">' + E(s.why) + '</div>' +
            (s.reason ? '<div class="tiny" style="margin-top:8px;color:var(--gold3)">' +
              'ردّك: ' + E(s.reason) + '</div>' : '') +
            (s.state === 'pending' ? '<div class="fl" style="gap:9px;margin-top:11px">' +
              '<button class="btn p sm" data-a="spok" data-id="' + s.id + '">إسناد من الاحتياط</button>' +
              '<button class="btn d sm" data-a="spno" data-id="' + s.id + '">اعتذار</button></div>' : '') +
          '</div></div>';
      }).join('') + '</div>'
        : empty('لا طلبات في هذا التصنيف', 'ما يرفعه الليدرز يظهر هنا فورًا', 'i-send')) +
    '</div>';
}

/* ---------- الحوادث ---------- */
function screenIncidents() {
  const f = S.tab.inc || 'all';
  const list = S.feed.filter(x => f === 'all' ? true : x.kind === f);
  return '<div class="grid g3">' +
      stat({ label:'حرجة', n:S.feed.filter(x => x.kind === 'bad').length, ic:'i-flag',
        cls:'bad', sub:'تحتاج تدخّلًا الآن', series:[2,3,2,4,3,5,4,3] }) +
      stat({ label:'تحتاج انتباهًا', n:S.feed.filter(x => x.kind === 'warn').length, ic:'i-info',
        cls:'warn', sub:'تُراقَب ولا تُهمَل', series:[4,5,4,6,5,7,6,5] }) +
      stat({ label:'مكتملة', n:S.feed.filter(x => x.kind === 'ok').length, ic:'i-checkc',
        cls:'up', sub:'أُغلقت في الميدان', series:[6,7,8,9,10,11,12,13] }) +
    '</div>' +
    '<div class="card">' +
      head('تدفّق الحوادث', 'كل ما يجري في الميدان — مرتّبًا بوقته', '', 'i-flag') +
      '<div class="tools">' + segmented('inc',
        [['all','الكل'],['bad','حرجة'],['warn','تحتاج انتباهًا'],['ok','مكتملة']], f) + '</div>' +
      (list.length ? '<div class="feed" style="max-height:none">' + list.map((x, i) =>
        '<div class="evt ' + x.kind + '" style="animation-delay:' + Math.min(i * 40, 320) + 'ms">' +
        '<span class="dot"></span>' +
        '<span class="sp"><b>' + E(x.title) + '</b><p>' + E(x.body) + '</p></span>' +
        '<span class="t">' + ago(x.at) + '</span></div>').join('') + '</div>'
        : empty('لا حوادث في هذا التصنيف', 'وهذا خبر جيّد', 'i-checkc')) + '</div>';
}

/* ---------- المهام ---------- */
function screenTasks() {
  const f = S.tab.tf || 'today';
  const all = S.tasks.slice().sort((a, b) => a.start - b.start);
  const list = f === 'today' ? all.filter(t => dayStart(t.start) === dayStart(now()))
    : f === 'live' ? all.filter(t => now() >= t.start && now() < t.end && t.status !== 'done')
    : f === 'next' ? all.filter(t => t.start > now())
    : f === 'done' ? all.filter(t => t.status === 'done') : all;
  const rated = all.filter(t => t.rating);
  const avg = rated.length ? (rated.reduce((a, t) => a + t.rating, 0) / rated.length).toFixed(1) : '0.0';
  return '<div class="grid g4">' +
      stat({ label:'مهام الموسم', n:all.length, ic:'i-tasks',
        sub:'عبر ' + AR(leaders().length) + ' فرق', series:[12,24,36,44,50,55,58,all.length] }) +
      stat({ label:'اليوم', n:todayTasks().length, ic:'i-cal', sub:dayName(now()),
        series:[6,8,7,11,9,13,10,Math.max(1, todayTasks().length)] }) +
      stat({ label:'جارية', n:runningTasks().length, ic:'i-play',
        cls:runningTasks().length ? 'up' : '', sub:'الآن',
        series:[0,1,2,1,3,2,1,Math.max(1, runningTasks().length)] }) +
      stat({ label:'منجزة', n:all.filter(t => t.status === 'done').length, ic:'i-checkc',
        cls:'up', sub:'بمتوسط تقييم ' + AR(avg), series:[4,9,14,19,23,26,28,30] }) +
    '</div>' +
    '<div class="card">' +
      head('جدول المهام', 'المصدر الذي يقرأ منه التطبيق',
        pill(AR(list.length) + ' معروضة', 'gold'), 'i-tasks') +
      '<div class="tools">' + segmented('tf',
        [['today','اليوم'],['live','جارية'],['next','قادمة'],['done','منجزة'],['all','الكل']], f) +
      '</div>' +
      (list.length ? '<div class="plist">' + list.map(taskRow).join('') + '</div>'
        : empty('لا مهام في هذا التصنيف', 'جرّب تصنيفًا آخر', 'i-cal')) +
    '</div>';
}

/* ---------- الفرق ---------- */
/* صفّ محسن — نفس بطاقة التطبيق: وجه · اسم ورمز وتخصّص · نجوم · حصيلة */
function muhsenRow(m, doneN) {
  const notes = muhsenNotes(m.id);
  return '<div class="prow" style="flex-wrap:wrap">' +
    '<span class="fl" style="flex:1;min-width:0">' + avatar(m) +
      '<span class="nm"><b>' + E(m.name) + '</b>' +
      '<span>' + E(m.code) + ' · ' + E(m.specialty) + '</span></span></span>' +
    '<span class="end">' + stars(muhsenRating(m.id)) + '</span>' +
    '<div class="pfoot" style="width:100%">' +
      '<span class="ok">' + AR(doneN) + ' مهمة مُتقنة</span>' +
      (notes ? '<span class="no">' + AR(notes) + ' ملاحظة</span>'
             : '<span class="ok">بلا ملاحظات</span>') +
    '</div></div>';
}

function screenTeams() {
  return '<div class="grid g2">' + leaders().map(L => {
    const team = teamOf(L.id), org = orgById(L.orgId) || {};
    const ts = S.tasks.filter(t => t.leaderId === L.id);
    const done = ts.filter(t => t.status === 'done').length;
    return '<div class="card">' +
      '<div class="fl" style="margin-bottom:14px">' + avatar(L, 'lg') +
        '<span class="nm" style="flex:1"><b style="font-size:15px">' + E(L.kt) + ' · ' + E(L.name) + '</b>' +
        '<span>' + E(org.ar) + ' · ' + E(org.country) + '</span></span>' +
        pill(AR(L.pilgrims) + ' حاج', 'gold') + '</div>' +
      '<div class="meta">' +
        '<div><span class="k">محسنون</span><b class="num">' + AR(team.length) + '</b></div>' +
        '<div><span class="k">مهام</span><b class="num">' + AR(ts.length) + '</b></div>' +
        '<div><span class="k">منجزة</span><b class="num">' + AR(done) + '</b></div>' +
      '</div>' +
      '<div class="plist" style="margin-top:14px">' +
        team.map(m => muhsenRow(m, done)).join('') + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

/* ---------- الاحتياط ---------- */
function screenReserve() {
  const res = reserveTeam();
  return '<div class="card gold">' +
      head('الفريق الاحتياطي', 'يديره الكنترول وحده — لا يراه ليدر ولا يختار منه',
        pill(AR(res.length) + ' متاح', 'live'), 'i-shield') +
      '<div class="tiny muted" style="margin-bottom:14px">' +
        'يُسنَد من هنا استجابةً لطلبات الدعم، ويُوضَّح سبب القرار للّيدر الطالب.</div>' +
      '<div class="plist">' + res.map(m =>
        '<div class="prow">' + avatar(m) +
        '<span class="nm" style="flex:1"><b>' + E(m.name) + '</b>' +
        '<span>' + E(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        '<span class="fl" style="gap:9px">' + pill('متاح', 'live') +
        '<button class="btn l sm" data-a="go" data-n="support">إسناد لطلب</button></span></div>').join('') +
      '</div></div>';
}

/* ---------- التذاكر ---------- */
function screenTickets() {
  const f = S.tab.kf || 'open';
  const list = S.tickets.filter(k => f === 'open' ? k.status !== 'مغلقة'
    : f === 'crit' ? k.pri === 'حرجة' : f === 'closed' ? k.status === 'مغلقة' : true)
    .sort((a, b) => b.at - a.at);
  const crit = S.tickets.filter(k => k.pri === 'حرجة' && k.status !== 'مغلقة').length;
  return '<div class="grid g3">' +
      stat({ label:'مفتوحة', n:openTickets().length, ic:'i-ticket',
        cls:crit ? 'bad' : '', sub:AR(crit) + ' حرجة منها',
        series:[3,5,4,6,5,8,6,Math.max(1, openTickets().length)] }) +
      stat({ label:'قيد المعالجة', n:S.tickets.filter(k => k.status === 'قيد المعالجة').length,
        ic:'i-hour', cls:'warn', sub:'لدى الليدر أو الكنترول', series:[1,2,2,3,2,3,2,2] }) +
      stat({ label:'مغلقة', n:S.tickets.filter(k => k.status === 'مغلقة').length, ic:'i-checkc',
        cls:'up', sub:'حُلّت وأُبلغ صاحبها', series:[0,0,1,1,1,1,1,1] }) +
    '</div>' +
    '<div class="card">' +
      head('تذاكر الحجاج', 'يرفعها الحجاج وحدهم — تصل الليدر ونراها هنا', '', 'i-ticket') +
      '<div class="tools">' + segmented('kf',
        [['open','مفتوحة'],['crit','حرجة'],['closed','مغلقة'],['all','الكل']], f) + '</div>' +
      (list.length ? '<div class="plist">' + list.map((k, i) => {
        const pr = k.pri === 'حرجة' ? 'no' : k.pri === 'عاجلة' ? 'wait' : 'grey';
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 50) + 'ms">' +
          '<span class="krail ' + (k.pri === 'حرجة' ? 'r' : k.pri === 'عاجلة' ? 'a' : '') + '"></span>' +
          '<span class="ico">' + icon('i-ticket','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(k.title) + '</b>' +
          '<span>' + E(k.no) + ' · ' + E(k.from) + ' · ' + E(k.kt) + '</span></span>' +
          '<span class="fl" style="gap:7px">' + pill(k.cat, 'grey') + pill(k.pri, pr) +
            pill(k.status, k.status === 'مغلقة' ? 'live' : 'wait') + '</span>' +
          '<span class="tiny faint">' + ago(k.at) + '</span>' +
          '<div class="quote" style="width:100%">' + E(k.body) + '</div></div>';
      }).join('') + '</div>' : empty('لا تذاكر في هذا التصنيف', '', 'i-ticket')) + '</div>';
}

/* ---------- التقارير ---------- */
function screenReports() {
  const f = S.tab.rf || 'all';
  const all = S.reports.slice().sort((a, b) => b.at - a.at);
  const list = f === 'room' ? all.filter(r => r.room)
    : f === 'esc' ? all.filter(r => r.escalated) : all;
  return '<div class="grid g3">' +
      stat({ label:'تقارير صاعدة', n:all.length, ic:'i-flag',
        sub:'رفعها الليدرز', series:[1,2,2,3,4,4,5,all.length] }) +
      stat({ label:'مصعَّدة إليك', n:all.filter(r => r.escalated).length, ic:'i-send',
        cls:'warn', sub:'تجاوزت مستوى الفريق', series:[0,1,1,2,2,3,2,3] }) +
      stat({ label:'تعديل بيانات غرف', n:all.filter(r => r.room).length, ic:'i-key',
        sub:'تُحدَّث في قاعدة البيانات', series:[0,0,1,1,1,2,1,1] }) +
    '</div>' +
    '<div class="card">' +
      head('التقارير الصاعدة', 'ما صعّده الليدرز — ومنها تعديلات بيانات الغرف', '', 'i-flag') +
      '<div class="tools">' + segmented('rf',
        [['all','الكل'],['esc','مصعَّدة'],['room','تعديل غرف']], f) + '</div>' +
      (list.length ? '<div class="plist">' + list.map((r, i) => {
        const L = userById(r.from) || {};
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 50) + 'ms">' +
          '<span class="krail ' + (r.escalated ? 'a' : '') + '"></span>' +
          avatar(L, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(r.title) + '</b>' +
          '<span>' + E(r.no) + ' · ' + E(r.kt) + ' · ' + E(L.name || '') + '</span></span>' +
          '<span class="fl" style="gap:7px">' + pill(r.cat, 'gold') +
            pill(r.status, r.escalated ? 'no' : 'wait') + '</span>' +
          '<span class="tiny faint">' + ago(r.at) + '</span>' +
          '<div style="width:100%">' +
            '<div class="quote">' + E(r.body) + '</div>' +
            (r.room ? '<div class="fl" style="gap:11px;margin-top:11px;flex-wrap:wrap">' +
              '<span class="mchip">' + icon('i-key','s14') + E(r.room.floor) +
                ' · غرفة ' + E(r.room.no) + '</span>' +
              '<button class="btn p sm" data-a="roomapply" data-id="' + r.id + '">' +
                'تحديث قاعدة البيانات</button></div>' : '') +
          '</div></div>';
      }).join('') + '</div>' : empty('لا تقارير في هذا التصنيف', '', 'i-flag')) + '</div>';
}

/* ---------- الإعدادات ---------- */
function screenSettings() {
  return '<div class="grid g2">' +
    '<div class="card">' + head('التجربة', 'أدوات معاينة لا تُشحن للعميل', '', 'i-hour') +
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
    '<div class="card gold">' + head('عن النظام', 'مُحسن · الكنترول', '', 'i-shield') +
      '<div class="tiny muted" style="line-height:2.1">' +
      '· هذا النظام هو <b>المصدر الأصل</b>: منه تُخلق المهام والفرق والحجاج والأدلة.<br>' +
      '· تطبيق الميدان يقرأ منه ويرفع إليه الطلبات والتقارير.<br>' +
      '· مشروعان منفصلان في مستودعين — يربطهما العقد لا الملفات.</div>' +
      '<div class="meta" style="margin-top:14px">' +
        '<div><span class="k">النسخة</span><b>' + APP_VER.replace('نسخة ', '') + '</b></div>' +
        '<div><span class="k">البنية</span><b class="num">' + AR(SCHEMA) + '</b></div>' +
        '<div><span class="k">الشاشات</span><b class="num">' + AR(Object.keys(SCREENS).length) + '</b></div>' +
      '</div>' +
    '</div></div>';
}
