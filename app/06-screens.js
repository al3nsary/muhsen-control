/* ============================================================
   بقية الشاشات — على مسطرة التطبيق نفسها:
   بطاقة لكل بند · وجه · نجوم · حصيلة تحت خطّ فاصل
   ============================================================ */

/* ---------- طلبات الدعم: القرار الذي ينتظره الميدان ---------- */
function screenSupport() {
  const f = S.tab.sf || 'open';
  const all = V.support.slice().sort((a, b) => b.at - a.at);
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
          '<span class="nm" style="flex:1"><b>' + LTR(s.no) + ' · ' + E(t.title || '') + '</b>' +
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
  const q = qOf('inc');
  let list = V.feed.filter(x => f === 'all' ? true : x.kind === f);
  const ic = fOf('inc','cat'), ik = fOf('inc','kt'), ist = fOf('inc','state');
  if (ic) list = list.filter(x => x.cat === ic);
  if (ik) list = list.filter(x => x.kt === ik);
  if (ist) list = list.filter(x => (x.state || 'مفتوح') === ist);
  if (q) list = list.filter(x => (x.title + ' ' + x.body + ' ' + (x.no || '')).indexOf(q) >= 0);
  return '<div class="grid g3">' +
      stat({ label:'حرجة', n:V.feed.filter(x => x.kind === 'bad').length, ic:'i-flag',
        cls:'bad', sub:'تحتاج تدخّلًا الآن', series:[2,3,2,4,3,5,4,3] }) +
      stat({ label:'تحتاج انتباهًا', n:V.feed.filter(x => x.kind === 'warn').length, ic:'i-info',
        cls:'warn', sub:'تُراقَب ولا تُهمَل', series:[4,5,4,6,5,7,6,5] }) +
      stat({ label:'مكتملة', n:V.feed.filter(x => x.kind === 'ok').length, ic:'i-checkc',
        cls:'up', sub:'أُغلقت في الميدان', series:[6,7,8,9,10,11,12,13] }) +
    '</div>' +
    '<div class="card">' +
      head('تدفّق الحوادث', 'كل ما يجري في الميدان — مرتّبًا بوقته', '', 'i-flag') +
      '<div class="tools">' + segmented('inc',
        [['all','الكل'],['bad','حرجة'],['warn','تحتاج انتباهًا'],['ok','مكتملة']], f) + '</div>' +
      filterBar('inc', [
        { k:'cat',   label:'النوع',  opts:INC_CATS.map(c => [c.k, c.ar]) },
        { k:'kt',    label:'الـKT',  opts:optKT() },
        { k:'state', label:'الحالة', opts:[['مفتوح','مفتوح'],['قيد المعالجة','قيد المعالجة'],['مغلق','مغلق']] }
      ], list.length, V.feed.length, 'ابحث بعنوان أو رقم حادثة…') +
      (list.length ? '<div class="plist">' + list.map((x, i) => {
        const C = INC_CATS.find(c => c.k === x.cat) || INC_CATS[0];
        const st = x.state || 'مفتوح';
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' +
          Math.min(i * 40, 320) + 'ms">' +
          '<span class="krail ' + (x.kind === 'bad' ? 'r' : x.kind === 'warn' ? 'a' : '') + '"></span>' +
          '<span class="ico" style="color:' + C.c + '">' + icon(C.i, 's18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(x.title) + '</b>' +
          '<span>' + LTR(x.no || '') + ' · ' + E(C.ar) + (x.kt ? ' · ' + E(x.kt) : '') +
          (x.hotel ? ' · ' + E(x.hotel) : '') + '</span></span>' +
          pill(x.kind === 'bad' ? 'حرجة' : x.kind === 'warn' ? 'تحتاج انتباهًا' : 'مكتملة',
            x.kind === 'bad' ? 'no' : x.kind === 'warn' ? 'wait' : 'live') +
          pill(st, st === 'مغلق' ? 'live' : st === 'قيد المعالجة' ? 'wait' : 'no') +
          '<span class="tiny faint">' + ago(x.at) +
          (x.resp ? '<br>استجابة ' + AR(x.resp) + ' د' : '') + '</span>' +
          '<div class="quote" style="width:100%">' + E(x.body) + '</div></div>';
      }).join('') + '</div>'
        : empty('لا حوادث في هذا التصنيف', 'وهذا خبر جيّد', 'i-checkc')) + '</div>';
}

/* ---------- الفرق ---------- */
/* صفّ محسن — نفس بطاقة التطبيق: وجه · اسم ورمز وتخصّص · نجوم · حصيلة */
function muhsenRow(m, doneN) {
  const notes = muhsenNotes(m.id);
  return '<div class="prow" style="flex-wrap:wrap">' +
    '<span class="fl" style="flex:1;min-width:0">' + avatar(m) +
      '<span class="nm"><b>' + E(m.name) + '</b>' +
      '<span>' + LTR(m.code) + ' · ' + E(m.specialty) + '</span></span></span>' +
    '<span class="end">' + stars(muhsenRating(m.id)) + '</span>' +
    '<div class="pfoot" style="width:100%">' +
      '<span class="ok">' + AR(doneN) + ' مهمة مُتقنة</span>' +
      (notes ? '<span class="no">' + AR(notes) + ' ملاحظة</span>'
             : '<span class="ok">بلا ملاحظات</span>') +
    '</div></div>';
}

function screenTeams() {
  const q = qOf('tm');
  const fo = fOf('tm','org'), fh = fOf('tm','hotel'), ft = fOf('tm','type');
  let ls = leaders();
  if (fo) ls = ls.filter(L => L.orgId === fo);
  if (ft) ls = ls.filter(L => (orgById(L.orgId) || {}).type === ft);
  if (fh) ls = ls.filter(L => groupsOf(L.id).some(g => g.hotelId === fh));
  if (q) ls = ls.filter(L => (L.name + ' ' + L.kt).indexOf(q) >= 0 ||
    teamOf(L.id).some(m => m.name.indexOf(q) >= 0));
  const open = S.tab.tmopen || '';
  return '<div class="card">' +
      head('الفرق والمجموعات', 'انقر رأس البطاقة لتفتحها أو تطويها',
        pill(AR(ls.length) + ' من ' + AR(leaders().length), 'gold'), 'i-flag') +
      filterBar('tm', [
        { k:'org',   label:'الجهة',  opts:optOrgs() },
        { k:'type',  label:'النوع',  opts:optTypes() },
        { k:'hotel', label:'السكن',  opts:optHotels() }
      ], ls.length, leaders().length, 'ابحث بليدر أو KT أو اسم محسن…') +
    '</div>' +
    '<div class="grid g2">' + ls.map(L => {
    const team = teamOf(L.id), org = orgById(L.orgId) || {};
    const ts = V.tasks.filter(t => t.leaderId === L.id);
    const done = ts.filter(t => t.status === 'done').length;
    const g0 = groupsOf(L.id)[0];
    const isOpen = open === L.id;
    return '<div class="card teamcard' + (isOpen ? ' open' : '') + '">' +
      '<button class="fl teamhead" data-a="seg" data-k="tmopen" data-v="' +
        (isOpen ? '' : L.id) + '">' + avatar(L, 'lg') +
        '<span class="nm" style="flex:1"><b style="font-size:15px">' + E(L.kt) + ' · ' + E(L.name) + '</b>' +
        '<span>' + E(org.ar) + ' · ' + E(org.type) + ' · ' + E(org.country) +
        (g0 ? ' · ' + E(hotelById(g0.hotelId).ar || '') : '') + '</span></span>' +
        pill(E(org.type), org.type === 'بعثة' ? 'blue' : 'gold') +
        pill(AR(L.pilgrims) + ' حاج', 'grey') +
        '<span class="chev">' + icon('i-fwd','s16') + '</span></button>' +
      '<div class="meta">' +
        '<div><span class="k">محسنون</span><b class="num">' + AR(team.length) + '</b></div>' +
        '<div><span class="k">مهام</span><b class="num">' + AR(ts.length) + '</b></div>' +
        '<div><span class="k">منجزة</span><b class="num">' + AR(done) + '</b></div>' +
      '</div>' +
      (isOpen ? '<div class="plist" style="margin-top:14px">' +
        (team.length ? team.map(m => muhsenRow(m, done)).join('')
          : '<div class="tiny faint" style="padding:14px 4px">لا محسنين — لم تُشكَّل مجموعته بعد.</div>') +
        '</div>' : '') +
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
        '<span>' + LTR(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        '<span class="fl" style="gap:9px">' + pill('متاح', 'live') +
        '<button class="btn l sm" data-a="go" data-n="support">إسناد لطلب</button></span></div>').join('') +
      '</div></div>';
}

/* ---------- التذاكر ---------- */
function screenTickets() {
  const f = S.tab.kf || 'open';
  let list = V.tickets.filter(k => f === 'open' ? k.status !== 'مغلقة'
    : f === 'crit' ? k.pri === 'حرجة' : f === 'closed' ? k.status === 'مغلقة' : true)
    .sort((a, b) => b.at - a.at);
  const q = qOf('tkt');
  const tk = fOf('tkt','kt'), tc = fOf('tkt','cat'), tp = fOf('tkt','pri'), ta = fOf('tkt','asg');
  if (tk) list = list.filter(k => k.kt === tk);
  if (tc) list = list.filter(k => k.cat === tc);
  if (tp) list = list.filter(k => k.pri === tp);
  if (ta) list = list.filter(k => ta === 'y' ? !!k.assignedTo : !k.assignedTo);
  if (q) list = list.filter(k => (k.title + ' ' + k.no + ' ' + k.from + ' ' + k.body).indexOf(q) >= 0);
  const crit = V.tickets.filter(k => k.pri === 'حرجة' && k.status !== 'مغلقة').length;
  return '<div class="grid g3">' +
      stat({ label:'مفتوحة', n:openTickets().length, ic:'i-ticket',
        cls:crit ? 'bad' : '', sub:AR(crit) + ' حرجة منها',
        series:[3,5,4,6,5,8,6,Math.max(1, openTickets().length)] }) +
      stat({ label:'قيد المعالجة', n:V.tickets.filter(k => k.status === 'قيد المعالجة').length,
        ic:'i-hour', cls:'warn', sub:'لدى الليدر أو الكنترول', series:[1,2,2,3,2,3,2,2] }) +
      stat({ label:'مغلقة', n:V.tickets.filter(k => k.status === 'مغلقة').length, ic:'i-checkc',
        cls:'up', sub:'حُلّت وأُبلغ صاحبها', series:[0,0,1,1,1,1,1,1] }) +
    '</div>' +
    '<div class="card">' +
      head('تذاكر الحجاج', 'يرفعها الحجاج وحدهم — تصل الليدر ونراها هنا', '', 'i-ticket') +
      '<div class="tools">' + segmented('kf',
        [['open','مفتوحة'],['crit','حرجة'],['closed','مغلقة'],['all','الكل']], f) + '</div>' +
      filterBar('tkt', [
        { k:'kt',  label:'الـKT',     opts:optKT() },
        { k:'cat', label:'التصنيف',   opts:[...new Set(V.tickets.map(k => k.cat))].map(c => [c, c]) },
        { k:'pri', label:'الأولوية',  opts:[['حرجة','حرجة'],['عاجلة','عاجلة'],['عادية','عادية']] },
        { k:'asg', label:'الإسناد',   opts:[['y','مُسنَدة'],['n','بلا إسناد']] }
      ], list.length, V.tickets.length, 'ابحث بعنوان أو رقم أو اسم حاجّ…') +
      (list.length ? '<div class="plist">' + list.map((k, i) => {
        const pr = k.pri === 'حرجة' ? 'no' : k.pri === 'عاجلة' ? 'wait' : 'grey';
        const to = k.assignedTo ? userById(k.assignedTo) : null;
        return '<div class="prow trow" data-a="tkopen2" data-id="' + k.id + '" ' +
          'style="flex-wrap:wrap;animation-delay:' + (i * 50) + 'ms">' +
          '<span class="krail ' + (k.pri === 'حرجة' ? 'r' : k.pri === 'عاجلة' ? 'a' : '') + '"></span>' +
          '<span class="ico">' + icon('i-ticket','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(k.title) + '</b>' +
          '<span>' + LTR(k.no) + ' · ' + E(k.from) + ' · ' + E(k.kt) + '</span></span>' +
          '<span class="fl" style="gap:7px">' + pill(k.cat, 'grey') + pill(k.pri, pr) +
            pill(k.status, k.status === 'مغلقة' ? 'live' : 'wait') + '</span>' +
          (to ? '<span class="fl" style="gap:7px">' + avatar(to, 'sm') +
            '<span class="tiny faint">' + E(to.name) + '</span></span>' : '') +
          '<span class="tiny faint">' + ago(k.at) + '</span>' +
          '<div class="quote" style="width:100%">' + E(k.body) + '</div>' +
          ((k.thread || []).length ? '<div class="tiny" style="width:100%;margin-top:8px;' +
            'color:var(--gold3)">' + icon('i-send','s14') + ' ' + AR(k.thread.length) +
            ' ردًّا — آخره: ' + E(k.thread[k.thread.length-1].text.slice(0,60)) + '</div>' : '') +
        '</div>';
      }).join('') + '</div>' : empty('لا تذاكر في هذا التصنيف', '', 'i-ticket')) + '</div>';
}

/* ---------- التقارير ---------- */
function screenReports() {
  const f = S.tab.rf || 'all';
  const all = V.reports.slice().sort((a, b) => b.at - a.at);
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
        return '<div class="prow trow" data-a="rpopen" data-id="' + r.id + '" ' +
          'style="flex-wrap:wrap;animation-delay:' + (i * 50) + 'ms">' +
          '<span class="krail ' + (r.escalated ? 'a' : '') + '"></span>' +
          avatar(L, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(r.title) + '</b>' +
          '<span>' + LTR(r.no) + ' · ' + E(r.kt) + ' · ' + E(L.name || '') + '</span></span>' +
          '<span class="fl" style="gap:7px">' + pill(r.cat, 'gold') +
            pill(r.status, r.escalated ? 'no' : 'wait') + '</span>' +
          '<span class="tiny faint">' + ago(r.at) + '</span>' +
          '<div style="width:100%">' +
            '<div class="quote">' + E(r.body) + '</div>' +
            (r.room ? '<div class="fl" style="gap:11px;margin-top:11px;flex-wrap:wrap">' +
              '<span class="mchip">' + icon('i-key','s14') + E(r.room.floor) +
                ' · غرفة ' + E(r.room.no) + '</span></div>' : '') +
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
