/* ============================================================
   الإنذارات — سجلٌّ لكل محسن، لا رسائل متفرّقة

   الإجراءات (٢٨) تُوثّق ما لم يُنفَّذ من المهامّ ويُرصد آليًّا. وهذه
   شيءٌ آخر: **إنذارٌ يُسجَّل على الشخص** — تأخّرًا كان أو غيابًا أو
   لبسًا غير لائق أو سوء تعامل. منها ما يرصده النظام، ومنها ما يكتبه
   الكنترول بيده.

   والتكرار هو المهمّ: ثلاثة إنذاراتٍ من نوعٍ واحد ليست ثلاثة أشياء،
   بل شيءٌ واحد يتفاقم — فالشاشة تُظهر التكرار قبل أن تُظهر القائمة.
   ============================================================ */
const WARN_KIND = {
  late:    { ar:'تأخّر عن مهمّة',     c:'#E67E22', p:'wait', i:'i-clock',  auto:true },
  absent:  { ar:'غياب',               c:'#C0392B', p:'no',   i:'i-xc',     auto:true },
  noshow:  { ar:'لم يُثبت حضوره',     c:'#B8791A', p:'gold', i:'i-target', auto:true },
  undone:  { ar:'مهمّة لم تُنفَّذ',    c:'#A03028', p:'no',   i:'i-warn',   auto:true },
  dress:   { ar:'لبس غير لائق',       c:'#6B4E9E', p:'grey', i:'i-idcard', auto:false },
  conduct: { ar:'سوء تعامل',          c:'#8A5A1E', p:'gold', i:'i-users',  auto:false },
  safety:  { ar:'مخالفة سلامة',       c:'#1B6E9C', p:'wait', i:'i-shield', auto:false },
  device:  { ar:'عدم استخدام التطبيق', c:'#5A6C63', p:'grey', i:'i-phone',  auto:false },
  other:   { ar:'أخرى',               c:'#7C8C84', p:'grey', i:'i-edit',   auto:false }
};
const WARN_LVL = {
  note:  { ar:'ملاحظة',       p:'grey', w:1 },
  first: { ar:'إنذار أول',    p:'wait', w:2 },
  second:{ ar:'إنذار ثانٍ',   p:'gold', w:3 },
  final: { ar:'إنذار نهائي',  p:'no',   w:5 }
};
const WARN_ST = {
  open:     { ar:'قائم',        p:'no' },
  ack:      { ar:'أُبلغ به',    p:'wait' },
  explained:{ ar:'قُدّم عذر',   p:'gold' },
  cleared:  { ar:'أُسقط',       p:'live' }
};

/* ---------- بذر: يُشتقّ من وقائع النظام ثم يُزاد ما يُكتب يدويًّا ---------- */
function seedWarns(st) {
  st.warns = [];
  let n = 0;
  const add = (u, kind, lvl, text, at, extra) => {
    n++;
    st.warns.push(Object.assign({
      id:'WN' + (9600 + n), no:'WN-' + (9600 + n),
      userId:u.id, kind, lvl, text,
      at, by: WARN_KIND[kind].auto ? 'النظام' : 'الكنترول',
      state: n % 5 === 0 ? 'cleared' : n % 3 === 0 ? 'explained' : n % 2 === 0 ? 'ack' : 'open',
      sms: n % 3 === 0 ? 'delivered' : null, smsAt: n % 3 === 0 ? at + HR : null,
      note:'', taskId:null
    }, extra || {}));
  };
  st.users.filter(u => u.role === 'muhsen').forEach((u, i) => {
    const mine = st.tasks.filter(t => (t.assigned || []).indexOf(u.id) >= 0);
    const missed = mine.filter(t => t.status === 'done' && (t.attended || []).indexOf(u.id) < 0);
    missed.slice(0, 3).forEach((t, k) => {
      add(u, k === 0 ? 'noshow' : 'absent',
        k === 0 ? 'note' : k === 1 ? 'first' : 'second',
        'لم يُثبت حضوره في «' + t.title + '»',
        t.start + 30 * MIN, { taskId: t.id });
    });
    if (i % 9 === 2 && mine[0]) add(u, 'late', 'first',
      'تأخّر خمسًا وعشرين دقيقة عن «' + mine[0].title + '»',
      mine[0].start + 25 * MIN, { taskId: mine[0].id });
    /* ما يكتبه الكنترول بيده */
    if (i % 17 === 5) add(u, 'dress', 'note',
      'حضر بلا الزيّ الرسميّ في نوبة الاستقبال', Date.now() - 6 * DAY);
    if (i % 23 === 7) add(u, 'conduct', 'first',
      'رفع صوته على حاجّ في اللوبي — أفاد المشرف', Date.now() - 4 * DAY);
    if (i % 29 === 11) add(u, 'safety', 'first',
      'لم يلتزم بمسار الطوارئ أثناء التفويج', Date.now() - 9 * DAY);
    if (i % 31 === 13) add(u, 'device', 'note',
      'لم يؤشّر على خطواته في التطبيق ثلاث مهامّ متتالية', Date.now() - 2 * DAY);
  });
  st.warns.sort((a, b) => b.at - a.at);
}

/* ---------- حسابات ---------- */
const warnsOf = uid_ => (V.warns || []).filter(w => w.userId === uid_);
const warnLive = w => w.state !== 'cleared';
const warnScore = uid_ => warnsOf(uid_).filter(warnLive)
  .reduce((a, w) => a + (WARN_LVL[w.lvl] || WARN_LVL.note).w, 0);
/* التكرار: أي نوعٍ تكرّر وكم مرّة — هو ما يُقرأ قبل القائمة */
function warnRepeat(uid_) {
  const c = {};
  warnsOf(uid_).filter(warnLive).forEach(w => { c[w.kind] = (c[w.kind] || 0) + 1; });
  return Object.keys(c).filter(k => c[k] > 1)
    .map(k => ({ kind:k, n:c[k] })).sort((a, b) => b.n - a.n);
}
/* المستوى التالي يُقترح لا يُفرض */
const nextLvl = uid_ => {
  const live = warnsOf(uid_).filter(warnLive).length;
  return live >= 3 ? 'final' : live === 2 ? 'second' : live === 1 ? 'first' : 'note';
};

/* ============================================================
   الشاشة
   ============================================================ */
function screenWarns() {
  const K = 'wrn';
  const q = qOf(K);
  const seg = S.tab.wk || 'all';
  let list = (V.warns || []).slice().sort((a, b) => b.at - a.at);
  const total = list.length;
  if (seg === 'auto') list = list.filter(w => WARN_KIND[w.kind].auto);
  else if (seg === 'manual') list = list.filter(w => !WARN_KIND[w.kind].auto);
  else if (seg !== 'all') list = list.filter(w => w.kind === seg);
  if (fOf(K, 'lvl'))   list = list.filter(w => w.lvl === fOf(K, 'lvl'));
  if (fOf(K, 'state')) list = list.filter(w => w.state === fOf(K, 'state'));
  if (fOf(K, 'kind'))  list = list.filter(w => w.kind === fOf(K, 'kind'));
  if (fOf(K, 'lead'))  list = list.filter(w =>
    (userById(w.userId) || {}).leaderId === fOf(K, 'lead'));
  if (fOf(K, 'sms'))   list = list.filter(w => (w.sms || 'none') === fOf(K, 'sms'));
  if (q) list = list.filter(w => (w.no + ' ' + w.text + ' ' +
    ((userById(w.userId) || {}).name || '')).indexOf(q) >= 0);

  const live = (V.warns || []).filter(warnLive).length;
  const fin = (V.warns || []).filter(w => w.lvl === 'final' && warnLive(w)).length;
  /* من تكرّر عليه نوعٌ واحد — هؤلاء أوّل من يُنظر فيهم */
  const rep = [...new Set((V.warns || []).map(w => w.userId))]
    .map(id => ({ id, r:warnRepeat(id), s:warnScore(id) }))
    .filter(x => x.r.length).sort((a, b) => b.s - a.s);

  return '<div class="grid g4">' +
      stat({ label:'إنذارات قائمة', n:live, ic:'i-warn', cls:live ? 'down' : 'up',
        sub:'لم تُسقَط بعد', series:[12,16,14,20,18,22,19,Math.max(1, live)] }) +
      stat({ label:'إنذارات نهائية', n:fin, ic:'i-xc', cls:fin ? 'down' : 'up',
        sub:'تُحال إلى لجنة الجزاءات', series:[1,2,1,3,2,4,3,Math.max(1, fin)] }) +
      stat({ label:'تكرارٌ على شخص', n:rep.length, ic:'i-reset', cls:rep.length ? 'down' : 'up',
        sub:'نوعٌ واحد تكرّر عليه', series:[4,6,5,8,7,9,8,Math.max(1, rep.length)] }) +
      stat({ label:'سجّلها الكنترول', n:(V.warns || []).filter(w => !WARN_KIND[w.kind].auto).length,
        ic:'i-edit', sub:'لبسٌ وتعاملٌ وسلامة', series:[2,4,6,8,10,12,13,14] }) +
    '</div>' +

    (rep.length ? '<div class="card gold">' +
      head('تكرارٌ يستحقّ النظر', 'نوعٌ واحد تكرّر على الشخص — والتكرار غير الحادثة',
        pill(AR(rep.length), 'no'), 'i-reset') +
      '<div class="plist">' + rep.slice(0, 6).map(x => {
        const u = userById(x.id) || {};
        return '<div class="prow" data-a="wuser" data-id="' + x.id + '">' + avatar(u, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(u.name || '') + '</b>' +
          '<span>' + LTR(u.code || '') + ' · ' + E(u.specialty || '') + '</span></span>' +
          '<span class="fl" style="gap:6px;flex-wrap:wrap">' + x.r.map(r =>
            '<span class="actk" style="color:' + WARN_KIND[r.kind].c +
            ';background:color-mix(in srgb,' + WARN_KIND[r.kind].c + ' 14%,transparent)">' +
            icon(WARN_KIND[r.kind].i,'s13') + E(WARN_KIND[r.kind].ar) + ' ×' + AR(r.n) +
            '</span>').join('') + '</span>' +
          pill('ثِقل ' + AR(x.s), x.s >= 8 ? 'no' : 'wait') + '</div>';
      }).join('') + '</div></div>' : '') +

    '<div class="card">' +
      head('الإنذارات', 'ما يرصده النظام وما يكتبه الكنترول — في سجلٍّ واحد',
        '<button class="btn p sm" data-a="wnew">' + icon('i-plus','s16') +
        'تسجيل إنذار</button>', 'i-warn') +
      '<div class="tools">' + segmented('wk', [
        ['all','الكل · ' + AR(total)],
        ['auto','آليّة'], ['manual','سجّلها الكنترول']
      ], seg) + '</div>' +
      filterBar(K, [
        { k:'kind',  label:'النوع',    opts:Object.keys(WARN_KIND).map(k => [k, WARN_KIND[k].ar]) },
        { k:'lvl',   label:'الدرجة',   opts:Object.keys(WARN_LVL).map(k => [k, WARN_LVL[k].ar]) },
        { k:'state', label:'الحالة',   opts:Object.keys(WARN_ST).map(k => [k, WARN_ST[k].ar]) },
        { k:'lead',  label:'الليدر',   opts:optLeaders() },
        { k:'sms',   label:'الرسالة',  opts:Object.keys(SMS_ST).map(k => [k, SMS_ST[k].ar]) }
      ], list.length, total, 'ابحث برقم الإنذار أو نصّه أو اسم المحسن…') +
      (list.length ? pagedList(list, K, warnRow)
        : empty('لا إنذارات', 'السجلّ نظيف', 'i-checkc')) +
    '</div>';
}

function warnRow(w) {
  const u = userById(w.userId) || {}, k = WARN_KIND[w.kind], l = WARN_LVL[w.lvl];
  const st = WARN_ST[w.state];
  return '<div class="prow" style="--tsc:' + k.c + '" data-a="wopen" data-id="' + w.id + '">' +
    '<span class="krail"></span>' + avatar(u, 'sm') +
    '<span class="nm" style="flex:1;min-width:150px"><b>' + E(u.name || '') + '</b>' +
      '<span>' + LTR(w.no) + ' · ' + E(w.text) + '</span></span>' +
    '<span class="actk" style="color:' + k.c + ';background:color-mix(in srgb,' + k.c +
      ' 14%,transparent)">' + icon(k.i,'s13') + E(k.ar) + '</span>' +
    pill(l.ar, l.p) +
    (w.sms ? pill('رسالة: ' + SMS_ST[w.sms].ar, SMS_ST[w.sms].p) : '') +
    '<span class="when"><b>' + hijri(w.at) + '</b>' +
      '<span class="num">' + ago(w.at) + '</span></span>' +
    pill(w.by, 'grey') +
    '<span class="end">' + pill(st.ar, st.p) + '</span></div>';
}

/* ---------- درج الإنذار ---------- */
function warnDrawer(id) {
  const w = (V.warns || []).find(x => x.id === id); if (!w) return;
  const u = userById(w.userId) || {}, k = WARN_KIND[w.kind], l = WARN_LVL[w.lvl];
  const t = w.taskId ? taskById(w.taskId) : null;
  const mine = warnsOf(w.userId);
  const rep = warnRepeat(w.userId);

  S.drawer = { title:k.ar, sub:w.no + ' · ' + (u.name || ''), icon:k.i,
    wide:!!S.dwide, expand:id, body:

    '<div class="card" style="--kc:' + k.c + '">' +
      head(k.ar, 'سجّله ' + w.by + ' ' + ago(w.at), pill(l.ar, l.p), k.i) +
      '<div class="quote">' + E(w.text) + '</div>' +
      '<div class="row" style="padding:10px 4px;margin-top:8px;border-top:1px solid var(--line)">' +
        avatar(u, 'lg') +
        '<span class="nm" style="flex:1"><b>' + E(u.name || '') + '</b>' +
        '<span>' + LTR(u.code || '') + ' · ' + E(u.specialty || '') + ' · شِفت ' +
        E(shiftOf(u)) + '</span></span>' +
        '<button class="chipbtn" data-a="staffpage" data-id="' + u.id + '">الملفّ</button>' +
      '</div>' +
      (t ? '<button class="btn l sm" style="width:100%;margin-top:11px" data-a="tlopen" ' +
        'data-id="' + t.id + '">' + icon('i-tasks','s14') + E(t.title) + '</button>' : '') +
    '</div>' +

    (rep.length ? '<div class="note r">' + icon('i-reset','s16') +
      '<span><b>تكرارٌ على هذا المحسن</b><br>' +
      rep.map(r => WARN_KIND[r.kind].ar + ' ×' + AR(r.n)).join(' · ') +
      ' — وثِقل سجلّه ' + AR(warnScore(w.userId)) + '.</span></div>' : '') +

    '<div class="card">' +
      head('الدرجة والحالة', 'الدرجة تُصعَّد بالتكرار لا بالمزاج', '', 'i-shield') +
      '<div class="tiny faint" style="margin:4px 0 7px">الدرجة</div>' +
      '<div class="chipwrap">' + Object.keys(WARN_LVL).map(x =>
        '<button class="chipbtn' + (w.lvl === x ? ' on' : '') + '" data-a="wlvl" ' +
        'data-id="' + w.id + '" data-v="' + x + '">' + E(WARN_LVL[x].ar) + '</button>').join('') + '</div>' +
      '<div class="tiny faint" style="margin:13px 0 7px">الحالة</div>' +
      '<div class="chipwrap">' + Object.keys(WARN_ST).map(x =>
        '<button class="chipbtn' + (w.state === x ? ' on' : '') + '" data-a="wstate" ' +
        'data-id="' + w.id + '" data-v="' + x + '">' + E(WARN_ST[x].ar) + '</button>').join('') + '</div>' +
      (w.note ? '<div class="quote" style="margin-top:12px">' + E(w.note) + '</div>' : '') +
      '<label class="fl2">عذرُ المحسن أو ملاحظة الكنترول</label>' +
      '<textarea class="fld" id="q-wnote" data-q="wnote" rows="3" ' +
        'placeholder="ما أفاد به، أو ما رآه الكنترول">' + E(qOf('wnote')) + '</textarea>' +
      '<button class="btn l sm" style="width:100%;margin-top:10px" data-a="wnote" ' +
        'data-id="' + w.id + '">' + icon('i-check','s14') + 'حفظ الملاحظة</button>' +
    '</div>' +

    '<div class="card gold">' +
      head('إبلاغ المحسن', 'نصٌّ ثابتٌ لدرجة الإنذار',
        w.sms ? pill(SMS_ST[w.sms].ar, SMS_ST[w.sms].p) : '', 'i-send') +
      '<div class="smscard"><div class="smsline">' + icon('i-phone','s13') +
        LTR(u.phone || '') + '</div>' +
        '<div class="smsbody">' + E(warnSms(w)) + '</div>' +
        (w.smsAt ? '<div class="tiny faint" style="margin-top:8px">' +
          hijri(w.smsAt) + ' · ' + t12(w.smsAt) + '</div>' : '') + '</div>' +
      '<button class="btn p sm" style="width:100%;margin-top:12px" data-a="wsms" ' +
        'data-id="' + w.id + '">' + icon('i-send','s14') +
        (w.sms ? 'إعادة الإرسال' : 'إرسال الإنذار') + '</button>' +
    '</div>' +

    (mine.length > 1 ? '<div class="card">' +
      head('سجلّ إنذاراته', AR(mine.length) + ' إنذارًا — ' +
        AR(mine.filter(warnLive).length) + ' قائمًا', '', 'i-hist') +
      '<div class="plist">' + mine.slice(0, 10).map(x => {
        const kk = WARN_KIND[x.kind];
        return '<div class="prow" data-a="wopen" data-id="' + x.id + '">' +
          '<span class="actk" style="color:' + kk.c + ';background:color-mix(in srgb,' + kk.c +
          ' 14%,transparent)">' + icon(kk.i,'s13') + E(kk.ar) + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(x.text) + '</b>' +
          '<span>' + LTR(x.no) + ' · ' + E(x.by) + ' · ' + ago(x.at) + '</span></span>' +
          pill(WARN_LVL[x.lvl].ar, WARN_LVL[x.lvl].p) +
          pill(WARN_ST[x.state].ar, WARN_ST[x.state].p) + '</div>';
      }).join('') + '</div></div>' : '') +

    '<button class="btn l" data-a="wuser" data-id="' + u.id + '">' +
      icon('i-user','s16') + 'كل إنذارات ' + E(u.name || '') + '</button>' };
  renderDrawer();
}

const WARN_SMS = {
  note:  'ملاحظة من غرفة عمليات مُحسن: {text}. نأمل تلافيها. — الكنترول',
  first: 'إنذار أول من غرفة عمليات مُحسن: {text} بتاريخ {date}. ' +
         'يُرجى الالتزام تفاديًا للتصعيد. — الكنترول',
  second:'إنذار ثانٍ: {text}. تكرّر عليك ({n}) مرّات هذا الموسم. ' +
         'التكرار يُحال إلى لجنة الجزاءات. — غرفة عمليات مُحسن',
  final: 'إنذار نهائي: {text}. أُحيل ملفّك إلى لجنة الجزاءات. ' +
         'راجع مشرفك فورًا. — غرفة عمليات مُحسن'
};
const warnSms = w => String(WARN_SMS[w.lvl] || WARN_SMS.note)
  .replace('{text}', w.text)
  .replace('{date}', hijri(w.at))
  .replace('{n}', AR(warnsOf(w.userId).filter(x => x.kind === w.kind && warnLive(x)).length));

/* ---------- سجلّ شخصٍ بعينه ---------- */
function warnUser(uid_) {
  const u = userById(uid_); if (!u) return;
  const mine = warnsOf(uid_);
  const rep = warnRepeat(uid_);
  const sc = warnScore(uid_);
  S.drawer = { title:'إنذارات ' + u.name, sub:(u.code || '') + ' · ثِقل السجلّ ' + AR(sc),
    icon:'i-warn', wide:!!S.dwide, expand:uid_, body:

    '<div class="card" style="--kc:' + (sc >= 8 ? 'var(--red)' : 'var(--gold2)') + '">' +
      head('ثِقل السجلّ', 'يُحسب بدرجات الإنذارات القائمة وحدها',
        pill(AR(sc), sc >= 8 ? 'no' : sc >= 4 ? 'gold' : 'live'), 'i-shield') +
      '<div class="fl" style="gap:12px">' +
        ring(Math.min(100, sc * 10), sc >= 8 ? 'var(--red)' : 'var(--gold2)', 56) +
        '<span class="sp"><b>' + AR(mine.filter(warnLive).length) + ' إنذارًا قائمًا</b>' +
        '<div class="tiny faint">من ' + AR(mine.length) + ' سُجّل عليه هذا الموسم</div></span>' +
      '</div>' +
      (rep.length ? '<div class="note r" style="margin-top:12px">' + icon('i-reset','s16') +
        '<span><b>تكرار:</b> ' + rep.map(r => WARN_KIND[r.kind].ar + ' ×' + AR(r.n)).join(' · ') +
        '</span></div>' : '') +
      '<button class="btn p sm" style="width:100%;margin-top:12px" data-a="wnew" ' +
        'data-id="' + uid_ + '">' + icon('i-plus','s14') + 'تسجيل إنذار جديد عليه</button>' +
    '</div>' +

    '<div class="card">' + head('السجلّ', AR(mine.length) + ' إنذارًا', '', 'i-hist') +
      (mine.length ? '<div class="plist">' + mine.map(x => {
        const kk = WARN_KIND[x.kind];
        return '<div class="prow" data-a="wopen" data-id="' + x.id + '">' +
          '<span class="actk" style="color:' + kk.c + ';background:color-mix(in srgb,' + kk.c +
          ' 14%,transparent)">' + icon(kk.i,'s13') + E(kk.ar) + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(x.text) + '</b>' +
          '<span>' + LTR(x.no) + ' · ' + E(x.by) + ' · ' + hijri(x.at) + '</span></span>' +
          pill(WARN_LVL[x.lvl].ar, WARN_LVL[x.lvl].p) +
          (x.sms ? pill(SMS_ST[x.sms].ar, SMS_ST[x.sms].p) : '') +
          pill(WARN_ST[x.state].ar, WARN_ST[x.state].p) + '</div>';
      }).join('') + '</div>' : empty('لا إنذارات', 'سجلّه نظيف', 'i-checkc')) +
    '</div>' +

    ((u.moves || []).length ? '<div class="card">' +
      head('حركاته', 'كل نقلٍ أو سحبٍ بسببه المكتوب', '', 'i-swap') +
      histLog((u.moves || []).map(m => ({ at:m.at, text:m.by + ' — ' + m.text, kind:'info' }))) +
    '</div>' : '') };
  renderDrawer();
}

/* ---------- تسجيل إنذار جديد ---------- */
function warnNew(uid_) {
  const d = S.wform = S.wform || { userId:uid_ || null, kind:'dress', lvl:null };
  if (uid_) d.userId = uid_;
  const u = d.userId ? userById(d.userId) : null;
  const lvl = d.lvl || (u ? nextLvl(u.id) : 'note');

  S.drawer = { title:'تسجيل إنذار', sub:u ? u.name : 'اختر المحسن أوّلًا',
    icon:'i-warn', wide:!!S.dwide, body:

    '<div class="note b">' + icon('i-info','s16') +
      '<span>ما يرصده النظام يُسجَّل وحده. وهذه لما يراه الكنترول بعينه: ' +
      'لبسًا، أو تعاملًا، أو سلامةً — أو أيّ شيءٍ آخر.</span></div>' +

    '<div class="card">' + head('المحسن', u ? 'مختار' : 'لم يُختر بعد', '', 'i-user') +
      (u ? '<div class="row" style="padding:9px 4px">' + avatar(u) +
        '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
        '<span>' + LTR(u.code || '') + ' · ' + E(u.specialty || '') + '</span></span>' +
        pill(AR(warnsOf(u.id).filter(warnLive).length) + ' قائمًا',
          warnsOf(u.id).filter(warnLive).length ? 'no' : 'live') +
        '<button class="chipbtn" data-a="wpick">تغيير</button></div>'
        : '<button class="btn p sm" style="width:100%" data-a="wpick">' +
          icon('i-users','s14') + 'اختيار المحسن</button>') +
    '</div>' +

    '<div class="card">' + head('النوع', 'ما الذي وقع؟', '', 'i-list') +
      '<div class="chipwrap">' + Object.keys(WARN_KIND).map(k =>
        '<button class="chipbtn' + (d.kind === k ? ' on' : '') + '" data-a="wkind" ' +
        'data-v="' + k + '">' + icon(WARN_KIND[k].i,'s13') + E(WARN_KIND[k].ar) +
        '</button>').join('') + '</div>' +
      '<label class="fl2">وصف الواقعة</label>' +
      '<textarea class="fld" id="q-wtxt" data-q="wtxt" rows="3" ' +
        'placeholder="أين ومتى وماذا — بوضوحٍ يُغني عن السؤال">' + E(qOf('wtxt')) + '</textarea>' +
    '</div>' +

    '<div class="card">' + head('الدرجة',
      u ? 'المقترح بناءً على سجلّه: ' + WARN_LVL[nextLvl(u.id)].ar : 'تُصعَّد بالتكرار',
      '', 'i-shield') +
      '<div class="chipwrap">' + Object.keys(WARN_LVL).map(k =>
        '<button class="chipbtn' + (lvl === k ? ' on' : '') + '" data-a="wnlvl" ' +
        'data-v="' + k + '">' + E(WARN_LVL[k].ar) + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="wsave"' + (u ? '' : ' disabled') + '>' +
        icon('i-check','s16') + 'تسجيل الإنذار</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button></div>' };
  renderDrawer();
}
