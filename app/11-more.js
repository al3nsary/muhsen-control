/* ============================================================
   الشاشات الستّ التي كانت هيكلًا — بُنيت على البيانات الأصل
   قاعدة الحجاج · الجودة · الأدلة · البثّ · الشِفتات · السجل
   ============================================================ */

/* ---------- حقل بحث موحّد ---------- */
function search(key, ph, n) {
  const v = (S.q && S.q[key]) || '';
  return '<div class="find">' + icon('i-search', 's18') +
    '<input id="q-' + key + '" data-q="' + key + '" value="' + E(v) + '" ' +
      'placeholder="' + E(ph) + '" autocomplete="off">' +
    (v ? '<button class="x" data-a="qclear" data-k="' + key + '">' + icon('i-x', 's16') + '</button>'
       : '<span class="tiny faint">' + AR(n) + ' سجل</span>') + '</div>';
}
const qOf = k => ((S.q && S.q[k]) || '').trim();

/* ══════════════ ١) قاعدة الحجاج ══════════════ */
function screenPilgrims() {
  const all = allPilgrimRows();
  const q = qOf('pil');
  let list = all.slice();
  const pk = fOf('pil','kt'), po = fOf('pil','org'), ps = fOf('pil','state'), pf = fOf('pil','flag');
  if (pk) list = list.filter(p => p.kt === pk);
  if (po) { const o = orgById(po) || {}; list = list.filter(p => p.kt === o.kt); }
  if (ps) list = list.filter(p => p.state === ps);
  if (pf) list = list.filter(p => pf === 'y' ? !!p.flag : !p.flag);
  if (q) list = list.filter(p => (p.name + ' ' + p.no + ' ' + p.room + ' ' + p.kt).indexOf(q) >= 0);
  const arrived = all.filter(p => p.state === 'وصل').length;
  const flagged = all.filter(p => p.flag).length;

  return '<div class="grid g4">' +
      stat({ label:'إجمالي الحجاج', n:all.length, ic:'i-users',
        sub:'عبر ' + AR(leaders().length) + ' فرق', series:[380,420,455,490,520,548,562,all.length] }) +
      stat({ label:'وصلوا', n:arrived, ic:'i-checkc', cls:'up',
        sub:AR(Math.round(arrived / all.length * 100)) + '٪ من الكشف',
        series:[40,120,220,310,390,460,510,arrived] }) +
      stat({ label:'لم يصلوا بعد', n:all.filter(p => p.state === 'لم يصل').length, ic:'i-hour',
        cls:'warn', sub:'تُتابَع مع البعثات', series:[520,430,340,250,180,120,80,60] }) +
      stat({ label:'حالات تحتاج رعاية', n:flagged, ic:'i-flag', cls:flagged ? 'bad' : '',
        sub:'صحية أو كرسي متحرّك', series:[3,5,4,7,6,9,8,flagged] }) +
    '</div>' +

    '<div class="card">' +
      head('السجل الأصل', 'منه يقرأ التطبيق أسماء الحجاج وغرفهم — والتعديل هنا يصل الأجهزة',
        pill(AR(list.length) + ' معروض', 'gold')) +
      filterBar('pil', [
        { k:'kt',    label:'الـKT',   opts:optKT() },
        { k:'org',   label:'الجهة',   opts:optOrgs() },
        { k:'state', label:'الحالة',  opts:[['وصل','وصل'],['لم يصل','لم يصل'],['غادر','غادر']] },
        { k:'flag',  label:'رعاية',   opts:[['y','يحتاج رعاية'],['n','بلا']] }
      ], list.length, all.length, 'ابحث باسم أو رقم حاجّ أو رقم غرفة…') +
      (list.length ? dataTable({
        key: 'pil', defaultCol: 1,
        cols: [{ t:'الحاجّ', w:'1.7fr' }, { t:'الفريق', w:'.7fr' }, { t:'البعثة', w:'1.1fr' },
               { t:'السكن', w:'1fr' }, { t:'العمر', w:'.5fr' }, { t:'الحالة', w:'.8fr' }],
        rows: list.slice(0, 40).map(p => ({
          id: p.id, act: 'pilopen',
          sort: [p.name, p.kt + '·' + String(p.room).padStart(4, '0'),
                 p.org, p.room, p.age, p.state],
          cells: [
            '<span class="fl">' + avatar({ g:p.g, av:p.g === 'f' ? 'p5' : 'p2' }, 'sm') +
              '<span class="nm"><b>' + E(p.name) + '</b><span>' + LTR(p.no) + '</span></span></span>',
            '<b>' + E(p.kt) + '</b>',
            '<span class="tiny">' + E(p.org) + '<br><span class="faint">' + E(p.country) + '</span></span>',
            '<span class="tiny">' + E(p.floor) + '<br><b class="num">غرفة ' + AR(p.room) + '</b></span>',
            '<b class="num">' + AR(p.age) + '</b>',
            (p.flag ? pill(p.flag, 'no') : pill(p.state, p.state === 'وصل' ? 'live'
              : p.state === 'غادر' ? 'grey' : 'wait'))
          ]
        }))
      }) + (list.length > 40 ? '<div class="tiny faint" style="margin-top:12px">' +
        'يُعرض أول ٤٠ سجلًّا من ' + AR(list.length) + ' — ضيّق البحث لترى الباقي.</div>' : '')
        : empty('لا نتيجة', 'جرّب اسمًا أو رقم غرفة آخر', 'i-search')) +
    '</div>';
}

function pilgrimDrawer(id) {
  const p = allPilgrimRows().find(x => x.id === id); if (!p) return;
  const L = userById(p.leaderId) || {};
  const tk = S.tickets.filter(k => k.pilgrimId === p.id);
  openDrawer(p.name, p.no + ' · ' + p.org, 'i-user',
    '<div class="fl" style="gap:14px">' + avatar({ g:p.g, av:p.g === 'f' ? 'p5' : 'p2' }, 'lg') +
      '<span class="nm" style="flex:1"><b style="font-size:15px">' + E(p.name) + '</b>' +
      '<span>' + E(p.country) + ' · ' + AR(p.age) + ' سنة</span></span>' +
      (p.flag ? pill(p.flag, 'no') : pill(p.state, p.state === 'وصل' ? 'live' : 'wait')) + '</div>' +

    '<div class="meta">' +
      '<div><span class="k">الفريق</span><b>' + E(p.kt) + '</b></div>' +
      '<div><span class="k">الدور</span><b>' + E(p.floor.replace('الدور ', '')) + '</b></div>' +
      '<div><span class="k">الغرفة</span><b class="num">' + AR(p.room) + '</b></div>' +
    '</div>' +

    '<div class="card">' + head('المسؤول عنه', 'ليدر الفريق') +
      '<div class="prow" style="box-shadow:none;border:0;padding:0">' + avatar(L) +
      '<span class="nm" style="flex:1"><b>' + E(L.name || '') + '</b>' +
      '<span>' + E(L.kt || '') + ' · ' + LTR(L.phone || '') + '</span></span>' +
      '<span>' + stars(ktRating(L.id)) + '</span></div></div>' +

    (tk.length ? '<div class="card">' + head('تذاكره', AR(tk.length)) +
      tk.map(k => '<div class="evt ' + (k.pri === 'حرجة' ? 'bad' : 'warn') + '">' +
        '<span class="dot"></span><span class="sp"><b>' + E(k.title) + '</b>' +
        '<p>' + E(k.body) + '</p></span></div>').join('') + '</div>'
      : '<div class="card">' + head('تذاكره', 'لا شيء مرفوع') +
        empty('لم يرفع تذكرة', 'ولا بلاغ من فريقه عليه', 'i-checkc') + '</div>'));
}

/* ══════════════ ٢) الجودة والتقييم ══════════════ */
function screenQuality() {
  const done = S.tasks.filter(t => t.status === 'done' && t.rating);
  const avg = done.length ? done.reduce((a, t) => a + t.rating, 0) / done.length : 0;
  const board = leaders().map(L => {
    const d = S.tasks.filter(t => t.leaderId === L.id && t.status === 'done' && t.rating);
    return { L, n:d.length, r:ktRating(L.id),
      low:d.filter(t => t.rating < 3.5).length,
      auto:S.tasks.filter(t => t.leaderId === L.id && t.autoStarted).length };
  }).sort((a, b) => b.r - a.r);
  /* توزيع الدرجات على خمس درجات */
  const STARN = { 1:'نجمة', 2:'نجمتان', 3:'٣ نجوم', 4:'٤ نجوم', 5:'٥ نجوم' };
  const dist = [5, 4, 3, 2, 1].map(n => ({
    l: STARN[n],
    v: done.filter(t => Math.round(t.rating) === n).length
  }));
  const worst = done.slice().sort((a, b) => a.rating - b.rating).slice(0, 5);

  return '<div class="grid g4">' +
      stat({ label:'المتوسط التراكمي', n:avg.toFixed(1), ic:'i-star', cls:'up',
        sub:'من ' + AR(done.length) + ' مهمة مقيَّمة', series:[3.6,3.7,3.9,4,4.1,4,4.2,avg] }) +
      stat({ label:'مهام دون ٣٫٥', n:done.filter(t => t.rating < 3.5).length, ic:'i-flag',
        cls:'warn', sub:'تستحق مراجعة سببها', series:[6,5,7,4,6,3,5,4] }) +
      stat({ label:'الفريق الأعلى', n:board[0] ? board[0].r.toFixed(1) : '0.0',
        ic:'i-shield', cls:'up',
        sub:board[0] ? board[0].L.kt + ' · ' + board[0].L.name : '—',
        series:[3.9,4,4.1,4.2,4.3,4.2,4.4,board[0] ? board[0].r : 0] }) +
      stat({ label:'بدأها النظام', n:S.tasks.filter(t => t.autoStarted).length, ic:'i-play',
        cls:'bad', sub:'تُخصم من التزام الفريق', series:[1,2,2,3,4,5,6,7] }) +
    '</div>' +

    '<div class="grid g23">' +
      '<div class="card hov">' +
        head('ترتيب الفرق', 'بالمتوسط التراكمي — والعمود الأخير ما يحتاج مراجعة', '', 'i-star') +
        '<div class="board">' + board.map((b, i) =>
          '<div class="brow" style="animation-delay:' + (i * 70) + 'ms" ' +
            'data-a="ktopen" data-id="' + b.L.id + '">' +
            '<span class="rk' + (i === 0 ? ' top' : '') + '">' + AR(i + 1) + '</span>' +
            avatar(b.L, 'sm') +
            '<span class="nm"><b>' + E(b.L.kt) + '</b><span>' + E(b.L.name) + '</span></span>' +
            '<span class="bar2"><i data-w="' + (b.r / 5 * 100) + '"></i></span>' +
            stars(b.r) +
            (b.low ? pill(AR(b.low) + ' دون ٣٫٥', 'no') : pill('نظيف', 'live')) +
          '</div>').join('') + '</div>' +
      '</div>' +
      '<div class="card hov">' +
        head('توزيع الدرجات', 'أين تتكدّس المهام', '', 'i-pie') +
        chartBars({ data: dist.map(d => ({ l:d.l, v:d.v, hot:false })),
          foot: 'الكتلة في الأربع نجوم — والصعود إلى الخمس هو الهدف.' }) +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      head('أدنى خمس مهام', 'تُراجَع بسببها لا برقمها', '', 'i-flag') +
      '<div class="plist">' + worst.map(t => {
        const L = userById(t.leaderId) || {}, c = CAT[t.kind] || {};
        return '<div class="prow">' +
          '<span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' +
            icon(c.i || 'i-tasks', 's18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(t.title) + '</b>' +
          '<span>' + E(t.kt) + ' · ' + E(L.name || '') + ' · ' + hijri(t.start) + '</span></span>' +
          stars(t.rating) + '</div>';
      }).join('') + '</div>' +
    '</div>';
}

/* ══════════════ ٣) أدلة التنفيذ ══════════════ */
const MEDIA_IC = { 'نص':'i-list', 'صور':'i-photo', 'فيديو':'i-play', 'PDF':'i-doc' };

function screenGuides() {
  const gs = S.guides.slice().sort((a, b) => b.at - a.at);
  const ok = gs.filter(g => g.status === 'معتمد').length;
  return '<div class="grid g3">' +
      stat({ label:'أدلة معتمدة', n:ok, ic:'i-checkc', cls:'up',
        sub:'يقرؤها التطبيق الآن', series:[4,5,5,6,6,7,6,ok] }) +
      stat({ label:'مسودات', n:gs.filter(g => g.status === 'مسودة').length, ic:'i-guide',
        cls:'warn', sub:'لا يراها الميدان', series:[3,2,3,2,3,2,3,2] }) +
      stat({ label:'قيد المراجعة', n:gs.filter(g => g.status === 'قيد المراجعة').length,
        ic:'i-hour', sub:'بانتظار اعتمادك', series:[0,1,0,1,1,0,1,1] }) +
    '</div>' +

    '<div class="card gold">' +
      head('أدلة التنفيذ', 'لكل نشاط دليله — والمعتمَد وحده يصل الأجهزة', '', 'i-guide') +
      '<div class="gcards">' + gs.map((g, i) => {
        const c = CAT[g.kind] || {}, by = userById(g.by) || {};
        const st = g.status === 'معتمد' ? 'live' : g.status === 'مسودة' ? 'grey' : 'wait';
        return '<div class="gcard" style="animation-delay:' + (i * 50) + 'ms">' +
          '<span class="gtop" style="background:' + (c.c || 'var(--dim)') + '"></span>' +
          '<div class="fl" style="margin-bottom:11px">' +
            '<span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' +
              icon(c.i || 'i-tasks', 's18') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(c.ar || g.kind) + '</b>' +
            '<span>النسخة ' + AR(g.ver) + ' · ' + AR(g.steps) + ' خطوة</span></span>' +
            pill(g.status, st) + '</div>' +
          '<div class="mrow">' + g.media.map(m =>
            '<span class="mchip">' + icon(MEDIA_IC[m] || 'i-doc', 's14') + E(m) + '</span>').join('') +
          '</div>' +
          '<div class="pfoot">' +
            '<span class="ok">' + E(by.name || '—') + ' · ' + ago(g.at) + '</span>' +
            (g.status === 'معتمد'
              ? '<button class="btn l sm" data-a="gview" data-id="' + g.id + '">معاينة</button>'
              : '<button class="btn p sm" data-a="gpub" data-id="' + g.id + '">اعتماد ونشر</button>') +
          '</div></div>';
      }).join('') + '</div>' +
    '</div>';
}

function guideDrawer(id) {
  const g = S.guides.find(x => x.id === id); if (!g) return;
  const c = CAT[g.kind] || {}, by = userById(g.by) || {};
  const steps = [];
  for (let i = 1; i <= g.steps; i++) steps.push(i);
  openDrawer(c.ar || g.kind, 'النسخة ' + AR(g.ver) + ' · ' + g.status, c.i || 'i-guide',
    '<div class="meta">' +
      '<div><span class="k">النسخة</span><b class="num">' + AR(g.ver) + '</b></div>' +
      '<div><span class="k">الخطوات</span><b class="num">' + AR(g.steps) + '</b></div>' +
      '<div><span class="k">الوسائط</span><b class="num">' + AR(g.media.length) + '</b></div>' +
    '</div>' +
    '<div class="card">' + head('ما يحويه', g.media.join(' · ')) +
      '<div class="mrow">' + g.media.map(m =>
        '<span class="mchip">' + icon(MEDIA_IC[m] || 'i-doc', 's14') + E(m) + '</span>').join('') +
      '</div></div>' +
    '<div class="card">' + head('الخطوات', 'كما يراها المحسن في التطبيق') +
      '<div class="steps">' + steps.map(i =>
        '<div class="step" style="animation-delay:' + (i * 40) + 'ms">' +
        '<span class="sn">' + AR(i) + '</span>' +
        '<span class="nm"><b>' + E(GUIDE_STEP(g.kind, i)) + '</b></span></div>').join('') +
      '</div></div>' +
    '<div class="tiny faint">حرّرها ' + E(by.name || '—') + ' · ' + ago(g.at) + '</div>');
}

/* نصّ الخطوة — يُشتقّ من النشاط حتى لا يكون حشوًا */
function GUIDE_STEP(kind, i) {
  const M = {
    airport:  ['التأكد من كشف الوصول قبل ساعتين','استلام الشارات والأساور','التمركز عند بوّابة الوصول',
               'عدّ الحجاج بالكشف لا بالنظر','توجيه ذوي الاحتياج أولًا','تسليم الأمتعة للناقل',
               'تأكيد اكتمال العدد قبل التحرّك','إبلاغ الكنترول بالانطلاق'],
    checkin:  ['استلام كشف الغرف من الكنترول','التحقّق من جاهزية الأدوار','تسليم البطاقات بالاسم',
               'مرافقة ذوي الاحتياج للغرف','رفع أي فرق في البيانات فورًا','تأكيد التسكين الكامل'],
    umrah:    ['التذكير بالإحرام قبل الميقات','تجميع المجموعة عند نقطة معلومة','شرح الطواف قبل الدخول',
               'المرافقة في الطواف والسعي','مراقبة كبار السنّ في الزحام','نقطة تجمّع بعد السعي',
               'التحلّل والتأكّد من اكتماله','عدّ المجموعة قبل المغادرة','الإبلاغ عن أي متخلّف',
               'العودة بالكشف كاملًا','إغلاق المهمة بالتقرير'],
    tour:     ['مراجعة خطّ السير مع السائق','التذكير بالماء والمظلّة','شرح المزار قبل النزول',
               'وقت محدّد لكل محطة','العدّ عند كل صعود للحافلة'],
    mina:     ['التأكد من جاهزية المخيم','توزيع الحجاج على الأفرشة بالكشف','شرح مخارج الطوارئ',
               'جدول الوجبات ومواعيدها','مناوبة ليلية معلنة','متابعة الحالات الصحية',
               'التذكير بموعد التحرّك لعرفة','عدّ الحجاج قبل التحرّك','رفع تقرير المبيت'],
    arafah:   ['الوصول قبل الزوال بساعتين','تثبيت الحجاج في المخيم المحدّد','شرح حدود عرفة بوضوح',
               'التذكير بالدعاء ووقت الوقوف','مراقبة الإجهاد الحراري','توزيع الماء كل ساعة',
               'متابعة كبار السنّ باستمرار','خطة الإخلاء الصحي جاهزة','عدّ الحجاج قبل الدفع',
               'التحرّك لمزدلفة بعد الغروب','التقاط الحصى بالعدد','المبيت وضبط المجموعة',
               'رفع تقرير اليوم كاملًا'],
    jamarat:  ['اختيار الوقت الأقلّ زحامًا','شرح مسار الذهاب والعودة','التزام الدور المحدّد',
               'عدم الوقوف بعد الرمي','نقطة تجمّع واضحة','العدّ بعد الخروج','رفع التقرير'],
    wada:     ['التأكّد من إنهاء كل المناسك','تحديد وقت الطواف بدقّة','المرافقة حتى الانتهاء',
               'عدّ المجموعة عند المخرج','تأكيد عدم بقاء أحد','إغلاق المهمة'],
    checkout: ['جمع البطاقات ومراجعة الغرف','التأكّد من عدم ترك متعلّقات',
               'تسليم الأمتعة بالعدد','تأكيد المغادرة للكنترول']
  };
  const a = M[kind] || [];
  return a[i - 1] || ('الخطوة ' + AR(i));
}

/* ══════════════ ٤) البثّ والإشعارات ══════════════ */
function screenBroadcast() {
  const cs = S.casts.slice().sort((a, b) => b.at - a.at);
  const aud = S.tab.aud || CAST_AUD[0];
  const kind = S.tab.ck || 'عادي';
  const reach = cs.reduce((a, c) => a + c.seen, 0), of = cs.reduce((a, c) => a + c.of, 0);
  return '<div class="grid g23">' +
    '<div class="card gold">' +
      head('رسالة جديدة', 'تصل التطبيق فورًا — وخارجه إن كان الجهاز مغلقًا', '', 'i-bell') +
      '<div class="compose">' +
        '<label class="fl2">إلى</label>' +
        '<div class="chips">' + CAST_AUD.map(a =>
          '<button class="chip2' + (a === aud ? ' on' : '') + '" data-a="seg" data-k="aud" ' +
          'data-v="' + E(a) + '">' + E(a) + '</button>').join('') + '</div>' +
        '<label class="fl2">الأهمية</label>' +
        segmented('ck', [['عادي','عادي'],['عاجل','عاجل'],['حرج','حرج']], kind) +
        '<label class="fl2">العنوان</label>' +
        '<input class="fld" id="q-ct" data-q="ct" value="' + E(qOf('ct')) +
          '" placeholder="سطر واحد يُقرأ في الإشعار">' +
        '<label class="fl2">النصّ</label>' +
        '<textarea class="fld" id="q-cb" data-q="cb" rows="4" ' +
          'placeholder="ما الذي يجب أن يفعله من يقرأ؟">' + E(qOf('cb')) + '</textarea>' +
        '<div class="fl" style="margin-top:14px;gap:10px">' +
          '<button class="btn p" data-a="castsend" style="flex:1">' + icon('i-send','s16') + 'بثّ الآن</button>' +
          '<button class="btn l" data-a="castclear">مسح</button>' +
        '</div>' +
        '<div class="tiny faint" style="margin-top:10px">' +
          'يصل إلى: <b>' + E(aud) + '</b> — ويُسجَّل في سجل النظام باسمك ووقته.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card hov">' +
      head('الوصول', 'كم فُتحت من المرسَل', '', 'i-eye') +
      '<div class="donutwrap">' + donut({ data:[
        { l:'فُتحت', v:reach, c:'var(--live)' },
        { l:'لم تُفتح', v:Math.max(0, of - reach), c:'var(--line2)' }
      ], center:'مستلم' }) + '</div>' +
    '</div></div>' +

    '<div class="card">' +
      head('ما أُرسل', AR(cs.length) + ' رسالة — والأحدث أولًا', '', 'i-hist') +
      '<div class="plist">' + cs.map((c, i) => {
        const k = c.kind === 'حرج' ? 'no' : c.kind === 'عاجل' ? 'wait' : 'grey';
        const pct = Math.round(c.seen / Math.max(1, c.of) * 100);
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 60) + 'ms">' +
          '<span class="ico">' + icon('i-bell','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(c.title) + '</b>' +
          '<span>' + LTR(c.no) + ' · إلى ' + E(c.to) + '</span></span>' +
          pill(c.kind, k) + '<span class="tiny faint">' + ago(c.at) + '</span>' +
          '<div style="width:100%;margin-top:9px">' +
            '<div class="tiny muted">' + E(c.body) + '</div>' +
            '<div class="fl" style="gap:10px;margin-top:9px">' +
              '<span class="meter gold" style="flex:1"><i data-w="' + pct + '"></i></span>' +
              '<span class="tiny faint num">' + AR(c.seen) + '/' + AR(c.of) + ' فتحوها</span>' +
            '</div></div></div>';
      }).join('') + '</div>' +
    '</div>';
}

/* ══════════════ ٥) تبديل الشِفتات ══════════════ */
function screenShifts() {
  const f = S.tab.sw || 'open';
  const list = S.swaps.filter(w => f === 'open' ? w.state === 'pending'
    : f === 'done' ? w.state === 'done' : f === 'no' ? w.state === 'no' : true)
    .sort((a, b) => b.at - a.at);
  return '<div class="grid g3">' +
      stat({ label:'بانتظار قرارك', n:openSwaps().length, ic:'i-swap',
        cls:openSwaps().length ? 'warn' : '', sub:'رفعها الليدرز', series:[1,2,1,3,2,4,3,openSwaps().length] }) +
      stat({ label:'اعتُمدت', n:S.swaps.filter(w => w.state === 'done').length, ic:'i-checkc',
        cls:'up', sub:'وأُبلغ الطرفان', series:[2,3,3,4,5,5,6,6] }) +
      stat({ label:'ورديات اليوم', n:SHIFTS.length * leaders().length, ic:'i-hour',
        sub:AR(SHIFTS.length) + ' ورديات × ' + AR(leaders().length) + ' فرق', series:[9,12,12,15,15,15,15,15] }) +
    '</div>' +

    '<div class="card">' +
      head('جدول الورديات', 'ثلاث ورديات تغطّي اليوم كاملًا', '', 'i-hour') +
      '<div class="grid g3">' + SHIFTS.map((sh, i) => {
        const on = S.users.filter(u => u.role === 'muhsen' && !u.reserve).length;
        /* التوزيع لا يقسم بالتساوي: المسائية أثقل والليلية أخفّ */
        const share = [0.38, 0.40, 0.22][i];
        const nOn = Math.round(on * share);
        const need = Math.round(on / 3);
        const cov = Math.min(100, Math.round(nOn / need * 100));
        return '<div class="shift">' +
          '<span class="ico">' + icon(sh.i, 's18') + '</span>' +
          '<b>' + E(sh.k) + '</b>' +
          '<span class="tiny faint num">' + E(sh.t) + '</span>' +
          '<span class="meter' + (cov < 100 ? ' red' : '') + '" style="margin-top:12px">' +
            '<i data-w="' + cov + '"></i></span>' +
          '<span class="tiny faint" style="margin-top:8px">' +
            AR(nOn) + ' من ' + AR(need) + ' — تغطية ' + AR(cov) + '٪</span></div>';
      }).join('') + '</div>' +
    '</div>' +

    '<div class="card gold">' +
      head('طلبات التبديل', 'من رفعه ومن سيحلّ محلّه — والقرار بسبب مكتوب', '', 'i-swap') +
      '<div class="tools">' + segmented('sw',
        [['open','بانتظار القرار'],['done','معتمدة'],['no','مرفوضة'],['all','الكل']], f) + '</div>' +
      (list.length ? '<div class="plist">' + list.map((w, i) => {
        const a = userById(w.from) || {}, b = userById(w.to) || {};
        const st = w.state === 'pending' ? ['بانتظار قرارك','wait']
          : w.state === 'done' ? ['اعتُمد','live'] : ['رُفض','no'];
        return '<div class="prow swap" style="animation-delay:' + (i * 60) + 'ms">' +
          '<span class="fl swapfaces">' + avatar(a, 'sm') +
            '<span class="arrow">' + icon('i-swap','s16') + '</span>' +
            avatar(b, 'sm') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(a.name || '') + ' ← ' + E(b.name || '') + '</b>' +
          '<span>' + LTR(w.no) + ' · ' + E(w.day) + ' · ' + E(w.slot) + '</span>' +
          '<div class="tiny muted" style="margin-top:6px">' + E(w.why) + '</div>' +
          (w.reason ? '<div class="tiny" style="margin-top:5px;color:var(--gold3)">ردّك: ' +
            E(w.reason) + '</div>' : '') + '</span>' +
          '<span style="text-align:left">' + pill(st[0], st[1]) +
            '<div class="tiny faint" style="margin-top:6px">' + ago(w.at) + '</div></span>' +
          (w.state === 'pending' ? '<span class="fl" style="gap:8px">' +
            '<button class="btn d sm" data-a="swno" data-id="' + w.id + '">رفض</button>' +
            '<button class="btn p sm" data-a="swok" data-id="' + w.id + '">اعتماد</button></span>' : '') +
        '</div>';
      }).join('') + '</div>'
        : empty('لا طلبات في هذا التصنيف', 'ما يرفعه الليدرز يظهر هنا فورًا', 'i-swap')) +
    '</div>';
}

/* ══════════════ ٦) سجل النظام ══════════════ */
function screenAudit() {
  const f = S.tab.lg || 'all';
  const q = qOf('log');
  let list = S.log.slice().sort((a, b) => b.at - a.at);
  if (f !== 'all') list = list.filter(l => l.kind === f);
  if (q) list = list.filter(l => l.text.indexOf(q) >= 0);
  const kinds = [['all', 'الكل']].concat(
    Object.keys(LOG_KIND).filter(k => S.log.some(l => l.kind === k))
      .map(k => [k, LOG_KIND[k].ar]));

  return '<div class="card">' +
    head('سجل النظام', 'كل قرار بصاحبه ووقته — لا شيء يُمحى ولا يُعدَّل',
      pill(AR(S.log.length) + ' قيد', 'gold'), 'i-hist') +
    '<div class="tools">' + search('log', 'ابحث في السجل…', S.log.length) +
      segmented('lg', kinds, f) + '</div>' +
    (list.length ? '<div class="tline">' + list.map((l, i) => {
      const k = LOG_KIND[l.kind] || LOG_KIND.info;
      return '<div class="tev" style="animation-delay:' + Math.min(i * 40, 400) + 'ms">' +
        '<span class="tdot ' + k.c + '">' + icon(k.i, 's14') + '</span>' +
        '<div class="tbody">' +
          '<div class="fl" style="gap:8px;flex-wrap:wrap">' + pill(k.ar, k.c) +
            '<b style="font-size:13px;flex:1;min-width:0">' + E(l.text) + '</b></div>' +
          '<span class="tiny faint">' + E(l.by) + ' · ' + hijri(l.at) + ' · ' + t12(l.at) +
            ' · ' + ago(l.at) + '</span>' +
        '</div></div>';
    }).join('') + '</div>' : empty('لا قيد يطابق', 'جرّب تصنيفًا أو كلمة أخرى', 'i-search')) +
    '</div>';
}
