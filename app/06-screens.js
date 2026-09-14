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


/* ---------- الفرق ---------- */
/* صفّ محسن — نفس بطاقة التطبيق: وجه · اسم ورمز وتخصّص · نجوم · حصيلة */
function muhsenRow(m, doneN) {
  const notes = muhsenNotes(m.id);
  const open = !!(S.open && S.open['mn:' + m.id]);
  return '<div class="prow" style="flex-wrap:wrap">' +
    '<span class="fl" style="flex:1;min-width:0;cursor:pointer" ' +
      'data-a="staffpage" data-id="' + m.id + '">' + avatar(m) +
      '<span class="nm"><b>' + E(m.name) + '</b>' +
      '<span>' + LTR(m.code) + ' · ' + E(m.specialty) + '</span></span></span>' +
    '<span class="end">' + stars(muhsenRating(m.id)) + '</span>' +
    '<div class="pfoot" style="width:100%">' +
      '<span class="ok">' + AR(doneN) + ' مهمة مُتقنة</span>' +
      /* الملاحظة تُفتح لا تُعدّ فقط */
      (notes ? '<button class="notebtn' + (open ? ' on' : '') + '" data-a="mnote" ' +
        'data-id="' + m.id + '">' + icon('i-edit','s12') + AR(notes) + ' ملاحظة' +
        icon(open ? 'i-down' : 'i-fwd','s12') + '</button>'
             : '<span class="ok">بلا ملاحظات</span>') +
    '</div>' +
    (open ? '<div class="mnotes">' + muhsenNoteList(m.id) + '</div>' : '') +
  '</div>';
}

/* ملاحظات المحسن: من مهامّه ومن إجراءاته */
function muhsenNoteList(id) {
  const out = [];
  (V.tasks || []).forEach(t => {
    if ((t.assigned || []).indexOf(id) < 0) return;
    (t.notes || []).forEach(n => out.push({ at:n.at, by:n.by || 'الكنترول',
      text:n.text, src:t.title }));
  });
  (V.acts || []).filter(a => a.userId === id).forEach(a => out.push({
    at:a.at, by:'الإجراءات', text:a.title + (a.why ? ' — السبب: ' + a.why : ''),
    src:ACT_KIND[a.kind].ar }));
  if (!out.length) return '<div class="tiny faint">لا ملاحظات مكتوبة.</div>';
  return out.sort((a, b) => b.at - a.at).slice(0, 6).map(n =>
    '<div class="mnote"><span class="mn1">' + E(n.by) + ' · ' + E(n.src) + '</span>' +
    '<b>' + E(n.text) + '</b>' +
    '<span class="tiny faint">' + hijri(n.at) + ' · ' + t12(n.at) + '</span></div>').join('');
}

/* مشرف المجموعة: من فندقها — كان ناقصًا في البطاقة */
const supOfGroup = g => g && g.hotelId
  ? (V.users || []).find(u => u.role === 'supervisor' && u.hotelId === g.hotelId) : null;

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
        (g0 ? ' · ' + E(hotelById(g0.hotelId).ar || '') : '') +
        (supOfGroup(g0) ? ' · المشرف ' + E(supOfGroup(g0).name) : ' · بلا مشرف') +
        '</span></span>' +
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
  /* من نزل الميدان: من أُسند إلى مهمّة أو إجراءٍ جارٍ */
  const busy = res.filter(m => (V.tasks || []).some(t =>
    (t.assigned || []).indexOf(m.id) >= 0 && t.status !== 'done'));
  const free = res.filter(m => busy.indexOf(m) < 0);
  return '<div class="grid g3">' +
      stat({ label:'عدد الاحتياط', n:res.length, ic:'i-shield',
        sub:'مشتركٌ بين كل الفرق', series:[22,24,26,28,29,30,30,Math.max(1, res.length)] }) +
      stat({ label:'نزلوا الميدان', n:busy.length, ic:'i-play', cls:'up',
        sub:'مُسنَدون على مهامّ جارية',
        series:[2,4,6,8,9,11,12,Math.max(1, busy.length)] }) +
      stat({ label:'بانتظار مهمّة', n:free.length, ic:'i-clock',
        sub:'متاحون الآن للإسناد',
        series:[20,20,20,20,20,19,18,Math.max(1, free.length)] }) +
    '</div>' +
    '<div class="card gold">' +
      head('الفريق الاحتياطي', 'يديره الكنترول وحده — لا يراه ليدر ولا يختار منه',
        pill(AR(res.length) + ' متاح', 'live'), 'i-shield') +
      '<div class="tiny muted" style="margin-bottom:14px">' +
        'يُسنَد من هنا استجابةً لطلبات الدعم، ويُوضَّح سبب القرار للّيدر الطالب.</div>' +
      '<div class="plist">' + res.map(m =>
        '<div class="prow">' + avatar(m) +
        '<span class="nm" style="flex:1"><b>' + E(m.name) + '</b>' +
        '<span>' + LTR(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        '<span class="fl" style="gap:9px">' +
        ((V.tasks || []).some(t => (t.assigned || []).indexOf(m.id) >= 0 && t.status !== 'done')
          ? pill('في الميدان', 'wait') : pill('متاح', 'live')) +
        pill('شِفت ' + E(shiftOf(m)), 'grey') +
        '<button class="btn l sm" data-a="staffpage" data-id="' + m.id + '">الملفّ</button>' +
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

