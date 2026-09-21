/* ============================================================
   الإجراءات والجزاءات — ملفّ أداء المحسن لا قائمة عقوبات

   المهمّة التي لم تُنفَّذ لا تختفي: تُوثَّق، ويُسأل عن سببها، ويُرصد
   تكرارُها في سجلّ صاحبها. والشكوى كذلك. ومن هنا — لا من الهاتف —
   تُرسَل الرسالة، بنصٍّ ثابتٍ لكل حالة، ويُحفَظ أنها أُرسلت ووصلت.
   ============================================================ */
const ACT_KIND = {
  late:    { ar:'متأخّر',                  c:'#E67E22', p:'wait', i:'i-clock' },
  undone:  { ar:'غير منجز',                c:'#C0392B', p:'no',   i:'i-xc' },
  repeat:  { ar:'تكرار التأخير أو عدم الإنجاز', c:'#A03028', p:'no', i:'i-reset' },
  complaint:{ ar:'شكوى على المحسن',        c:'#8A5A1E', p:'gold', i:'i-warn' }
};
/* نصّ ثابت لكل حالة — لا يُرتجل في لحظة الغضب */
const SMS_TPL = {
  late:     'تنبيه من غرفة عمليات مُحسن: سُجِّل تأخّرك عن مهمّة {task} بتاريخ {date}. ' +
            'نأمل الالتزام بمواعيد التحضير. — الكنترول',
  undone:   'إنذار من غرفة عمليات مُحسن: لم تُنفَّذ مهمّة {task} المسنَدة إليك بتاريخ {date}. ' +
            'يُرجى إفادتنا بالسبب خلال ٢٤ ساعة. — الكنترول',
  repeat:   'إنذار نهائي: تكرّر لديك عدم التنفيذ أو التأخير ({n}) مرّات هذا الموسم. ' +
            'استمرار ذلك يُحال إلى لجنة الجزاءات. — غرفة عمليات مُحسن',
  complaint:'تنبيه: وردت شكوى بخصوص {task}. يُرجى مراجعة مشرفك لتوضيح الموقف. ' +
            '— غرفة عمليات مُحسن'
};
const smsText = (kind, o) => String(SMS_TPL[kind] || '')
  .replace('{task}', (o && o.task) || 'مهمّة')
  .replace('{date}', (o && o.date) || '')
  .replace('{n}', AR((o && o.n) || 2));

const SMS_ST = {
  queued:    { ar:'في الطابور', p:'grey' },
  sent:      { ar:'أُرسلت',     p:'wait' },
  delivered: { ar:'وصلت',       p:'live' },
  failed:    { ar:'لم تصل',     p:'no' }
};
const PENALTY = {
  none:   { ar:'بلا جزاء',       p:'grey' },
  notice: { ar:'تنبيه شفهي',     p:'wait' },
  warn:   { ar:'إنذار مكتوب',    p:'gold' },
  cut:    { ar:'خصم من المستحقّ', p:'no' },
  stop:   { ar:'إيقاف عن العمل',  p:'no' }
};

/* ---------- بذر الإجراءات من وقائع النظام ---------- */
function seedActions(st) {
  st.acts = [];
  const muh = st.users.filter(u => u.role === 'muhsen');
  let n = 0;
  muh.forEach((u, i) => {
    /* من بدأ النظام مهامّه أو لم يثبت حضوره — عليه قيد */
    const mine = st.tasks.filter(t => (t.assigned || []).indexOf(u.id) >= 0);
    const missed = mine.filter(t => t.status === 'done' &&
      (t.attended || []).indexOf(u.id) < 0);
    if (!missed.length && i % 7) return;
    const kinds = [];
    if (missed.length >= 2) kinds.push('repeat');
    else if (missed.length === 1) kinds.push('undone');
    if (i % 5 === 0) kinds.push('late');
    if (i % 11 === 3) kinds.push('complaint');
    kinds.forEach((k, j) => {
      n++;
      const t = missed[j % Math.max(1, missed.length)] || mine[0];
      const done = n % 4 === 0;
      st.acts.push({
        id: 'AC' + (9100 + n), no: 'AC-' + (9100 + n),
        userId: u.id, kind: k,
        taskId: t ? t.id : null,
        title: k === 'complaint'
          ? 'شكوى من حاجّ على التعامل أثناء ' + (t ? t.title : 'مهمّة')
          : (t ? t.title : 'مهمّة') + ' — ' + ACT_KIND[k].ar,
        why: k === 'undone' ? '' : k === 'late' ? 'ازدحام على الطريق' : '',
        n: missed.length,
        at: Date.now() - (3 + (i % 20)) * DAY,
        state: done ? 'closed' : n % 3 === 0 ? 'answered' : 'open',
        penalty: done ? (n % 8 === 0 ? 'warn' : 'notice') : 'none',
        sms: n % 3 === 0 ? 'delivered' : n % 5 === 0 ? 'failed' : null,
        smsAt: n % 3 === 0 ? Date.now() - 2 * DAY : null,
        smsText: '',
        trail: [{ at: Date.now() - (3 + (i % 20)) * DAY, by:'النظام',
          text:'رُصد تلقائيًّا من سجلّ المهمّة' }]
      });
    });
  });
}

/* حسابات */
const actsOf = uid_ => (V.acts || []).filter(a => a.userId === uid_);
const actOpen = () => (V.acts || []).filter(a => a.state !== 'closed');
const actPerf = uid_ => {
  const a = actsOf(uid_);
  const bad = a.filter(x => x.kind !== 'complaint').length;
  return Math.max(40, 100 - bad * 9 - a.filter(x => x.kind === 'complaint').length * 5);
};
const teamPerf = () => {
  const m = (V.users || []).filter(u => u.role === 'muhsen');
  return m.length ? Math.round(m.reduce((a, u) => a + actPerf(u.id), 0) / m.length) : 0;
};

/* ============================================================
   الشاشة
   ============================================================ */
function screenActions() {
  const K = 'act';
  const q = qOf(K);
  const seg = S.tab.ak || 'all';
  let list = (V.acts || []).slice().sort((a, b) => b.at - a.at);
  const total = list.length;
  if (seg !== 'all') list = list.filter(a => a.kind === seg);
  if (fOf(K, 'state')) list = list.filter(a => a.state === fOf(K, 'state'));
  if (fOf(K, 'pen'))   list = list.filter(a => a.penalty === fOf(K, 'pen'));
  if (fOf(K, 'sms'))   list = list.filter(a => (a.sms || 'none') === fOf(K, 'sms'));
  if (fOf(K, 'lead')) {
    const id = fOf(K, 'lead');
    list = list.filter(a => (userById(a.userId) || {}).leaderId === id);
  }
  if (q) list = list.filter(a => (a.no + ' ' + a.title + ' ' +
    ((userById(a.userId) || {}).name || '')).indexOf(q) >= 0);

  const review = actOpen().length;
  const active = (V.users || []).filter(u => u.role === 'muhsen' && !u.reserve).length;
  const cnt2 = k => (V.acts || []).filter(a => a.kind === k).length;

  return '<div class="grid g3">' +
      stat({ label:'طلبات قيد المراجعة', n:review, ic:'i-report',
        cls:review ? 'down' : 'up', sub:'لم يُبتّ فيها بعد',
        series:[6,8,7,10,9,11,8,Math.max(1, review)] }) +
      stat({ label:'متوسط أداء الفريق', n:teamPerf(), ic:'i-star', suffix:'٪',
        cls:teamPerf() >= 80 ? 'up' : 'down', sub:'يهبط بتكرار عدم الإنجاز',
        series:[74,76,78,80,82,81,83,Math.max(1, teamPerf())] }) +
      stat({ label:'إجمالي الموظفين النشطين', n:active, ic:'i-idcard', cls:'up',
        sub:'محسنون في الميدان', series:[300,318,330,338,344,346,347,Math.max(1, active)] }) +
    '</div>' +

    '<div class="card">' +
      head('الإجراءات', 'توثيق ما لم يُنفَّذ، ومتابعة أسبابه، والشكاوى — والجزاء بتصنيفه',
        pill(AR(list.length) + ' من ' + AR(total), 'gold'), 'i-shield') +
      '<div class="tools">' + segmented('ak', [['all','الكل']].concat(
        Object.keys(ACT_KIND).map(k => [k, ACT_KIND[k].ar + ' · ' + AR(cnt2(k))])), seg) + '</div>' +
      filterBar(K, [
        { k:'state', label:'الحالة', opts:[['open','مفتوح'],['answered','أُفيد بالسبب'],['closed','مغلق']] },
        { k:'pen',   label:'الجزاء', opts:Object.keys(PENALTY).map(p => [p, PENALTY[p].ar]) },
        { k:'sms',   label:'الرسالة', opts:Object.keys(SMS_ST).map(p => [p, SMS_ST[p].ar]) },
        { k:'lead',  label:'الليدر', opts:optLeaders() }
      ], list.length, total, 'ابحث برقم الإجراء أو اسم المحسن…') +
      (list.length ? pagedList(list, K, actRow)
        : empty('لا إجراءات', 'الفريق ملتزم', 'i-checkc')) +
    '</div>';
}

function actRow(a) {
  const u = userById(a.userId) || {}, k = ACT_KIND[a.kind];
  const pen = PENALTY[a.penalty] || PENALTY.none;
  const st = a.state === 'closed' ? ['مغلق','live'] :
    a.state === 'answered' ? ['أُفيد بالسبب','wait'] : ['مفتوح','no'];
  return '<div class="prow" style="--tsc:' + k.c + '" data-a="actopen" data-id="' + a.id + '">' +
    '<span class="krail"></span>' + avatar(u, 'sm') +
    '<span class="nm" style="flex:1;min-width:140px"><b>' + E(u.name || '') + '</b>' +
      '<span>' + LTR(a.no) + ' · ' + E(a.title) + '</span></span>' +
    '<span class="actk" style="color:' + k.c + ';background:color-mix(in srgb,' + k.c +
      ' 14%,transparent)">' + icon(k.i,'s13') + E(k.ar) + '</span>' +
    '<span class="fl" style="gap:9px;min-width:120px">' +
      '<span class="meter' + (actPerf(a.userId) < 70 ? ' red' : '') + '" style="flex:1">' +
      '<i data-w="' + actPerf(a.userId) + '"></i></span>' +
      '<b class="num" style="min-width:32px">' + AR(actPerf(a.userId)) + '٪</b></span>' +
    (a.sms ? pill('رسالة: ' + SMS_ST[a.sms].ar, SMS_ST[a.sms].p) : '') +
    pill(pen.ar, pen.p) +
    '<span class="when"><b>' + hijri(a.at) + '</b>' +
      '<span class="num">' + ago(a.at) + '</span></span>' +
    '<span class="end">' + pill(st[0], st[1]) + '</span></div>';
}

/* ---------- درج الإجراء ---------- */
function actDrawer(id) {
  const a = (V.acts || []).find(x => x.id === id); if (!a) return;
  const u = userById(a.userId) || {}, k = ACT_KIND[a.kind];
  const t = a.taskId ? taskById(a.taskId) : null;
  const mine = actsOf(a.userId);
  const txt = a.smsText || smsText(a.kind, {
    task: t ? t.title : 'مهمّة', date: hijri(a.at), n: a.n || mine.length });

  S.drawer = { title:a.title, sub:a.no + ' · ' + (u.name || ''), icon:k.i,
    wide:!!S.dwide, expand:id, body:

    '<div class="card" style="--kc:' + k.c + '">' +
      head(k.ar, 'رُصد ' + ago(a.at), pill(PENALTY[a.penalty].ar, PENALTY[a.penalty].p), k.i) +
      '<div class="row" style="padding:10px 4px">' + avatar(u, 'lg') +
        '<span class="nm" style="flex:1"><b>' + E(u.name || '') + '</b>' +
        '<span>' + LTR(u.code || '') + ' · ' + E(u.specialty || '') + ' · شِفت ' +
        E(shiftOf(u)) + '</span></span>' +
        '<button class="chipbtn" data-a="staffopen" data-id="' + u.id + '">الملفّ</button>' +
      '</div>' +
      '<div class="fl" style="gap:12px;margin-top:12px">' +
        ring(actPerf(a.userId), actPerf(a.userId) >= 80 ? 'var(--live)' : 'var(--red)', 52) +
        '<span class="sp"><b>مؤشّر الأداء</b>' +
        '<div class="tiny faint">' + AR(mine.length) + ' قيدًا على المحسن هذا الموسم — ' +
        AR(mine.filter(x => x.kind === 'repeat' || x.kind === 'undone').length) +
        ' منها عدم إنجاز</div></span>' +
      '</div>' +
      (t ? '<button class="btn l sm" style="width:100%;margin-top:12px" data-a="tlopen" ' +
        'data-id="' + t.id + '">' + icon('i-tasks','s14') + 'المهمّة: ' + E(t.title) + '</button>' : '') +
    '</div>' +

    '<div class="card">' +
      head('سبب عدم الإنجاز', a.why ? 'أفاد به المحسن' : 'لم يُفِد بعد', '', 'i-edit') +
      (a.why ? '<div class="quote">' + E(a.why) + '</div>' : '') +
      '<textarea class="fld" id="q-acwhy" data-q="acwhy" rows="3" ' +
        'placeholder="ما السبب كما أفاد به؟">' + E(qOf('acwhy')) + '</textarea>' +
      '<button class="btn l sm" style="width:100%;margin-top:10px" data-a="acwhy" ' +
        'data-id="' + a.id + '">' + icon('i-check','s14') + 'تسجيل السبب</button>' +
    '</div>' +

    '<div class="card gold">' +
      head('الرسالة إلى جوّال المحسن', 'نصٌّ ثابتٌ لكل حالة — لا يُرتجل',
        a.sms ? pill(SMS_ST[a.sms].ar, SMS_ST[a.sms].p) : '', 'i-send') +
      '<div class="smscard"><div class="smsline">' + icon('i-phone','s13') +
        LTR(u.phone || '') + '</div>' +
        '<div class="smsbody">' + E(txt) + '</div>' +
        (a.smsAt ? '<div class="tiny faint" style="margin-top:8px">' +
          hijri(a.smsAt) + ' · ' + t12(a.smsAt) + '</div>' : '') +
      '</div>' +
      '<button class="btn p sm" style="width:100%;margin-top:12px" data-a="acsms" ' +
        'data-id="' + a.id + '">' + icon('i-send','s14') +
        (a.sms ? 'إعادة الإرسال' : 'إرسال إنذار عبر SMS') + '</button>' +
    '</div>' +

    '<div class="card">' +
      head('الجزاء', 'حسب تصنيف الحالة — ويُسجَّل في ملفّه', '', 'i-shield') +
      '<div class="chipwrap">' + Object.keys(PENALTY).map(p =>
        '<button class="chipbtn' + (a.penalty === p ? ' on' : '') + '" data-a="acpen" ' +
        'data-id="' + a.id + '" data-v="' + p + '">' + E(PENALTY[p].ar) + '</button>').join('') + '</div>' +
      '<div class="grid g2" style="gap:8px;margin-top:13px">' +
        (a.state === 'closed'
          ? '<button class="btn l sm" data-a="acopen2" data-id="' + a.id + '">' +
            icon('i-back','s14') + 'إعادة فتح</button>'
          : '<button class="btn p sm" data-a="acclose" data-id="' + a.id + '">' +
            icon('i-checkc','s14') + 'إغلاق الإجراء</button>') +
        '<button class="btn l sm" data-a="acperf" data-id="' + a.userId + '">' +
          icon('i-star','s14') + 'توثيق الأداء</button>' +
      '</div>' +
    '</div>' +

    (mine.length > 1 ? '<div class="card">' +
      head('سجلّ أداء المحسن', AR(mine.length) + ' قيدًا — التكرار يُرصد هنا', '', 'i-hist') +
      '<div class="plist">' + mine.map(x => {
        const kk = ACT_KIND[x.kind];
        return '<div class="prow" data-a="actopen" data-id="' + x.id + '">' +
          '<span class="actk" style="color:' + kk.c + ';background:color-mix(in srgb,' + kk.c +
          ' 14%,transparent)">' + icon(kk.i,'s13') + E(kk.ar) + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(x.title) + '</b>' +
          '<span>' + LTR(x.no) + ' · ' + ago(x.at) + '</span></span>' +
          pill(PENALTY[x.penalty].ar, PENALTY[x.penalty].p) + '</div>';
      }).join('') + '</div></div>' : '') +

    '<div class="card">' + head('المسار', AR((a.trail || []).length) + ' قيدًا', '', 'i-hist') +
      histLog((a.trail || []).map(x => ({ at:x.at, text:x.by + ' — ' + x.text, kind:'info' }))) +
    '</div>' };
  renderDrawer();
}

/* ============================================================
   ملفّ الموظّف — شاشةٌ كاملة لا درجٌ ضيّق

   بيانات الموظّف كانت تُقرأ في درجٍ عرضه أربعمئة بكسل، وفيها
   المجموعة والسكن والمشرف والحجاج والمهام والإجراءات. الدرج
   للمعاينة، والشاشة للقراءة.
   ============================================================ */
function screenStaffOne() {
  const u = userById(S.route.id);
  if (!u) { S.route = { n:'staff' }; return screenStaff(); }
  const g = staffGroup(u), h = staffHotel(u), o = staffOrg(u);
  const L = u.leaderId ? userById(u.leaderId) : null;
  const sup = h ? (V.users || []).find(x => x.role === 'supervisor' && x.hotelId === h.id) : null;
  const tasks = staffTasks(u.id);
  const acts = actsOf(u.id);
  const rate = u.role === 'leader' ? leaderRating(u.id) : muhsenRating(u.id);
  const pil = L ? (L.pilgrims || 0) : (u.pilgrims || 0);
  const perf = actPerf(u.id);
  const wMine = warnsOf(u.id), wLive = wMine.filter(warnLive);
  const wRep = warnRepeat(u.id), wScore = warnScore(u.id);

  const kv = (ic, k, v) => '<div class="pfrow"><span class="ico">' + icon(ic,'s16') + '</span>' +
    '<span class="k">' + k + '</span><b>' + v + '</b></div>';

  return '<div class="pfhead card">' +
      '<button class="btn l sm pfback" data-a="go" data-n="staff">' +
        icon('i-fwd','s14') + 'سجلّ الموظفين</button>' +
      '<div class="fl" style="gap:16px;align-items:flex-start">' +
        avatar(u, 'xl') +
        '<span class="sp">' +
          '<b style="font-size:20px;display:block">' + E(u.name) + '</b>' +
          '<div class="tiny faint" style="margin-top:4px">' + LTR(u.code || '') + ' · ' +
            E(ROLE_AR[u.role] || '') + (u.reserve ? ' · احتياط' : '') + '</div>' +
          '<div class="fl" style="gap:7px;margin-top:11px;flex-wrap:wrap">' +
            pill(E(u.specialty || ''), 'grey') +
            pill('شِفت ' + E(shiftOf(u)), 'gold') +
            (isPresent(u.id, now()) ? pill('حاضر الآن','live') : pill('غير حاضر','no')) +
            (acts.length ? pill(AR(acts.length) + ' إجراءً', 'no') : pill('بلا إجراءات','live')) +
            (wLive.length ? pill(AR(wLive.length) + ' إنذارًا قائمًا', 'no')
                          : pill('بلا إنذارات','live')) +
          '</div>' +
        '</span>' +
        '<div class="pfstats">' +
          '<span><b class="num">' + AR(u.age || 0) + '</b><i>العمر</i></span>' +
          '<span><b class="num">' + AR(tasks.length) + '</b><i>المهام</i></span>' +
          '<span><b class="num">' + AR(rate ? rate.toFixed(1) : 0) + '</b><i>التقييم</i></span>' +
          '<span><b class="num">' + AR(perf) + '٪</b><i>الأداء</i></span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid g2">' +
      '<div class="card">' + head('البيانات', 'ما يعرفه النظام عنه', '', 'i-idcard') +
        '<div class="pfkv">' +
          kv('i-phone', 'الجوال', LTR(u.phone || '—')) +
          kv('i-users', 'المجموعة', g ? E(g.no) : '<span class="faint">بلا مجموعة</span>') +
          kv('i-flag',  'الجهة', o ? E(o.kt + ' · ' + o.ar + ' (' + o.type + ')') : '—') +
          kv('i-target','رقم المركز', LTR(centerNo(u))) +
          kv('i-key',   'السكن', h ? E(h.ar + ' · ' + h.city) : '—') +
          kv('i-shield','مشرفه', sup ? E(sup.name) : '—') +
          kv('i-star',  'ليدره', L ? E(L.name) : (u.role === 'leader' ? 'هو الليدر' : '—')) +
          kv('i-user',  'حجاجه', AR(pil) + ' حاجًّا') +
          kv('i-swap',  'الشِفت', E(shiftOf(u)) + ' · ' +
            (SHIFTS.find(s => s.k === shiftOf(u)) || {}).t) +
        '</div>' +
      '</div>' +

      '<div class="card">' + head('الأداء والإجراءات',
        acts.length ? AR(acts.length) + ' قيدًا هذا الموسم' : 'لا قيود — ملفّه نظيف',
        '<button class="btn l sm" data-a="go" data-n="actions">' + icon('i-shield','s14') +
        'كل الإجراءات</button>', 'i-shield') +
        '<div class="fl" style="gap:14px">' +
          ring(perf, perf >= 80 ? 'var(--live)' : 'var(--red)', 64) +
          '<span class="sp"><b style="font-size:15px">' + AR(perf) + '٪ مؤشّر أداء</b>' +
          '<div class="tiny faint">يهبط تسعًا مع كل عدم إنجاز، وخمسًا مع كل شكوى.</div></span>' +
        '</div>' +
        (acts.length ? '<div class="plist" style="margin-top:14px">' + acts.slice(0, 6).map(a => {
          const kk = ACT_KIND[a.kind];
          return '<div class="prow" data-a="actopen" data-id="' + a.id + '">' +
            '<span class="actk" style="color:' + kk.c + ';background:color-mix(in srgb,' + kk.c +
            ' 14%,transparent)">' + icon(kk.i,'s13') + E(kk.ar) + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(a.title) + '</b>' +
            '<span>' + LTR(a.no) + ' · ' + ago(a.at) + '</span></span>' +
            (a.sms ? pill(SMS_ST[a.sms].ar, SMS_ST[a.sms].p) : '') +
            pill(PENALTY[a.penalty].ar, PENALTY[a.penalty].p) + '</div>';
        }).join('') + '</div>'
          : '<div class="tiny faint" style="margin-top:12px">لا إجراءات مسجّلة عليه.</div>') +
      '</div>' +
    '</div>' +

    /* ── الإنذارات: سجلُّه هو، في ملفّه هو ── */
    '<div class="card' + (wScore >= 8 ? ' red' : wLive.length ? ' gold' : '') + '">' +
      head('الإنذارات', wMine.length
          ? AR(wLive.length) + ' قائمًا من ' + AR(wMine.length) + ' هذا الموسم · ثِقل السجلّ ' +
            AR(wScore)
          : 'سجلُّه نظيف — لا إنذار عليه',
        '<span class="fl" style="gap:7px">' +
          '<button class="btn p sm" data-a="wnew" data-id="' + u.id + '">' +
            icon('i-plus','s14') + 'تسجيل إنذار</button>' +
          (wMine.length ? '<button class="btn l sm" data-a="wuser" data-id="' + u.id + '">' +
            icon('i-hist','s14') + 'السجلّ كاملًا</button>' : '') +
        '</span>', 'i-warn') +

      (wRep.length ? '<div class="note r">' + icon('i-reset','s16') +
        '<span><b>تكرارٌ عليه:</b> ' +
        wRep.map(r => WARN_KIND[r.kind].ar + ' ×' + AR(r.n)).join(' · ') +
        ' — والتكرار غير الحادثة.</span></div>' : '') +

      (wMine.length ? '<div class="plist">' + wMine.slice(0, 8).map(x => {
        const kk = WARN_KIND[x.kind];
        return '<div class="prow" style="--tsc:' + kk.c + '" data-a="wopen" data-id="' + x.id + '">' +
          '<span class="krail"></span>' +
          '<span class="actk" style="color:' + kk.c + ';background:color-mix(in srgb,' + kk.c +
          ' 14%,transparent)">' + icon(kk.i,'s13') + E(kk.ar) + '</span>' +
          '<span class="nm" style="flex:1;min-width:150px"><b>' + E(x.text) + '</b>' +
          '<span>' + LTR(x.no) + ' · ' + E(x.by) + ' · ' + ago(x.at) + '</span></span>' +
          pill(WARN_LVL[x.lvl].ar, WARN_LVL[x.lvl].p) +
          (x.sms ? pill(SMS_ST[x.sms].ar, SMS_ST[x.sms].p) : '') +
          pill(WARN_ST[x.state].ar, WARN_ST[x.state].p) + '</div>';
      }).join('') + '</div>' +
        (wMine.length > 8 ? '<div class="tiny faint" style="margin-top:9px">' +
          'وأقدمُ منها ' + AR(wMine.length - 8) + ' — في السجلّ كاملًا.</div>' : '')
        : empty('لا إنذارات', 'لم يُسجَّل عليه شيء', 'i-checkc')) +
    '</div>' +

    /* ── حركاته: كلُّ سحبٍ أو تسكينٍ أو استبدالٍ بسببه المكتوب ── */
    ((u.moves || []).length ? '<div class="card">' +
      head('حركاته', 'كلُّ نقلٍ أو سحبٍ أو استبدالٍ — بسببه كما كُتب وقتَه',
        pill(AR(u.moves.length), 'grey'), 'i-swap') +
      histLog(u.moves.map(m => ({ at:m.at, text:m.by + ' — ' + m.text, kind:'info' }))) +
    '</div>' : '') +

    '<div class="card">' + head('مهامّه', AR(tasks.length) + ' مهمة',
      '', 'i-tasks') +
      (tasks.length ? '<div class="plist">' + tasks.slice(0, 14).map(t =>
        '<div class="prow"' + (t.type === 'hajj' ? ' data-a="tlopen" data-id="' + t.id + '"' : '') + '>' +
        pill((TASKTYPE[t.type] || {}).ar || t.type, TTYPE_PILL[t.type] || 'grey') +
        '<span class="nm" style="flex:1"><b>' + E(t.title) + '</b>' +
        '<span>' + E(t.sub || '') + '</span></span>' +
        '<span class="when"><b>' + hijri(t.at) + '</b>' +
          '<span class="num">' + t12(t.at) + '</span></span>' +
        pill(t.state || '', 'grey') + '</div>').join('') + '</div>'
        : empty('لا مهام', 'لم تُسنَد إليه بعد', 'i-tasks')) +
    '</div>';
}

/* رقم المركز: ثابتٌ للشخص، يُشتقّ من مجموعته وجهته */
function centerNo(u) {
  const g = staffGroup(u);
  const o = staffOrg(u);
  const base = g ? Number(String(g.no).replace(/\D/g, '')) : 0;
  const ob = o ? Number(String(o.kt).replace(/\D/g, '')) : 0;
  return 'CN-' + (4400 + ((base + ob) % 600));
}
