/* ============================================================
   البلاغات — دورةٌ من إحدى عشرة مرحلة لا صندوقُ وارد

   شاشة الحوادث وشاشة البلاغات شيءٌ واحد: كلاهما **حدثٌ** وقع في
   الميدان ووصل بطريقةٍ ما. والفرق بينهما كان في المسمّى لا في
   المعنى، ففُصلا فتاه الأثر.

   والدورة تُجيب أحد عشر سؤالًا بترتيبها — وأخطرها الرابع: إذا ثبت
   أن المعلومة مغلوطة، **نعود إليه** ونسجّل الصحيحة، ولا نُغلق على
   خطأ. ولذلك يحتفظ السجلّ بالتسجيلين معًا.
   ============================================================ */
const SIG_STAGES = [
  { k:'event',   no:1,  ar:'الحدث',            q:'الموقف باختصار — طلب عفاشين، وفاة، تأخّر باص' },
  { k:'source',  no:2,  ar:'المصدر',           q:'من أين جاءت المعلومة؟' },
  { k:'channel', no:3,  ar:'القناة',           q:'كيف وصلت؟' },
  { k:'record',  no:4,  ar:'تسجيل المعلومة',   q:'فرصتان لتسجيلها إذا كانت مغلوطة' },
  { k:'verify',  no:5,  ar:'التحقّق',          q:'هل المعلومة صحيحة وكافية؟ وما الإثبات؟' },
  { k:'class',   no:6,  ar:'التصنيف',          q:'ما نوعها؟' },
  { k:'risk',    no:7,  ar:'درجة الخطورة',     q:'ما مستوى الخطورة؟' },
  { k:'rule',    no:8,  ar:'قاعدة المعالجة',   q:'ماذا يجب أن نقوم به؟' },
  { k:'owner',   no:9,  ar:'إسناد المسؤولية',  q:'من سيقوم بالإجراء؟' },
  { k:'follow',  no:10, ar:'المتابعة',         q:'هل تمّ تنفيذ المطلوب؟' },
  { k:'confirm', no:11, ar:'التأكيد النهائي',  q:'هل تحقّق الهدف فعلًا؟' },
  { k:'close',   no:12, ar:'الإغلاق',          q:'هل أصبحت الحالة مكتملة ويمكن أرشفتها؟' }
];
const SIG_SOURCE  = ['المحسن','الليدر','المشرف','الحاجّ','مركز','جهة خارجية','ملاحظة الكنترول'];
const SIG_CHANNEL = ['تطبيق مُحسن','اتصال هاتفي','واتساب','بلاغ شفهي','رصد ميداني','بريد رسمي'];
const SIG_VERIFY  = {
  confirmed: { ar:'مؤكّدة', p:'live', c:'#16A34A' },
  rumor:     { ar:'إشاعة',  p:'wait', c:'#E67E22' },
  wrong:     { ar:'مغلوطة', p:'no',   c:'#C0392B' },
  pending:   { ar:'لم يُتحقَّق', p:'grey', c:'#5A6C63' }
};
const SIG_CLASS = {
  request: { ar:'طلب',     i:'i-send',   c:'#1B6E9C' },
  ask:     { ar:'استفسار', i:'i-info',   c:'#6B4E9E' },
  notice:  { ar:'إشعار',   i:'i-bell',   c:'#B8791A' },
  complaint:{ ar:'شكوى (بلاغ)', i:'i-warn', c:'#C0392B' }
};
const SIG_RISK = {
  low:  { ar:'منخفض', p:'grey', c:'#5A6C63', o:2 },
  mid:  { ar:'متوسط', p:'wait', c:'#E67E22', o:1 },
  high: { ar:'عالي',  p:'no',   c:'#C0392B', o:0 }
};
const SIG_RULE = {
  journey: { ar:'تحديث Journey', d:'تُحدَّث رحلة الحاجّ أو المهمّة', i:'i-hist' },
  caseNew: { ar:'إنشاء Case',    d:'تُفتح حالةٌ تُتابَع حتى تُغلق',  i:'i-ticket' },
  notify:  { ar:'إرسال إشعار',   d:'يُبلَّغ المعنيّون فورًا',        i:'i-send' }
};
const SIG_STATE = {
  open:    { ar:'مفتوح',        p:'no',   c:'#C0392B' },
  working: { ar:'قيد المعالجة', p:'wait', c:'#E67E22' },
  waiting: { ar:'بانتظار تأكيد',p:'gold', c:'#B8791A' },
  closed:  { ar:'مغلق',         p:'live', c:'#16A34A' }
};

const sigStage = s => {
  if (s.state === 'closed') return 12;
  if (s.confirm) return 11;
  if (s.followed) return 10;
  if (s.owner) return 9;
  if (s.rule) return 8;
  if (s.risk) return 7;
  if (s.cls) return 6;
  if (s.verify && s.verify !== 'pending') return 5;
  if (s.text) return 4;
  return 3;
};

/* ---------- بذر البلاغات من الحوادث القائمة ---------- */
function seedSignals(st) {
  st.signals = [];
  (st.feed || []).forEach((f, i) => {
    const cat = INC_CATS.find(c => c.k === f.cat) || INC_CATS[0];
    const closed = f.state === 'مغلق';
    const work = f.state === 'قيد المعالجة';
    const L = LEADERS[i % LEADERS.length];
    const team = st.users.filter(u => u.role === 'muhsen' && u.leaderId === L.id);
    const risk = i % 5 === 0 ? 'high' : i % 3 === 0 ? 'mid' : 'low';
    const ver = i % 9 === 4 ? 'wrong' : i % 7 === 3 ? 'rumor' : 'confirmed';
    const at = f.at;
    const trail = [
      { at, by:SIG_SOURCE[i % SIG_SOURCE.length], text:'وصل البلاغ عبر ' +
        SIG_CHANNEL[i % SIG_CHANNEL.length] + ' — ' + f.title },
      { at: at + 4 * MIN, by:'الكنترول', text:'سُجِّلت المعلومة' }
    ];
    /* المغلوطة: فرصةٌ ثانية للتسجيل — وهذا صلب الدورة */
    if (ver === 'wrong') trail.push({ at: at + 12 * MIN, by:'الكنترول',
      text:'ثبت أن المعلومة مغلوطة — أُعيد التسجيل بالمعلومة الصحيحة' });
    if (ver !== 'pending') trail.push({ at: at + 16 * MIN, by:'الكنترول',
      text:'التحقّق: ' + SIG_VERIFY[ver].ar });
    if (work || closed) trail.push({ at: at + 22 * MIN, by:'الكنترول',
      text:'أُسندت المسؤولية' });
    if (closed) trail.push({ at: at + f.resp * MIN, by:'الكنترول',
      text:'تأكّد تحقّق الهدف — أُغلقت الحالة وأُرشفت' });

    st.signals.push({
      id:'SG' + (8100 + i), no:'SG-' + (8100 + i),
      title:f.title, text:f.body,
      cat:f.cat, catAr:cat.ar,
      source:SIG_SOURCE[i % SIG_SOURCE.length],
      channel:SIG_CHANNEL[i % SIG_CHANNEL.length],
      outside: i % 6 === 2,                 /* وصل خارج النظام */
      verify:ver,
      wrongNote: ver === 'wrong' ? 'الرواية الأولى قالت إن الحافلة تعطّلت، والصحيح أنها تأخّرت في الشحن.' : '',
      cls: i % 4 === 0 ? 'complaint' : i % 4 === 1 ? 'request' : i % 4 === 2 ? 'notice' : 'ask',
      risk,
      rule: i % 3 === 0 ? 'caseNew' : i % 3 === 1 ? 'notify' : 'journey',
      owner: (work || closed) ? (team[i % Math.max(1, team.length)] || L).id : null,
      followed: closed, confirm: closed,
      state: closed ? 'closed' : work ? 'working' : 'open',
      kt:f.kt, hotel:f.hotel, at, resp:f.resp,
      closedAt: closed ? at + f.resp * MIN : null,
      trail
    });
  });
}

/* حسابات */
const sigOpen = () => (V.signals || []).filter(s => s.state !== 'closed');
const sigAvgResp = () => {
  const c = (V.signals || []).filter(s => s.closedAt);
  return c.length ? Math.round(c.reduce((a, s) => a + (s.closedAt - s.at), 0) / c.length / MIN) : 0;
};

/* ============================================================
   الشاشة
   ============================================================ */
function screenIncidents() {
  const K = 'sig';
  const q = qOf(K);
  let list = (V.signals || []).slice().sort((a, b) =>
    (SIG_RISK[a.risk].o - SIG_RISK[b.risk].o) || (b.at - a.at));
  const total = list.length;
  const g = k => fOf(K, k);
  if (g('state')) list = list.filter(s => s.state === g('state'));
  if (g('cls'))   list = list.filter(s => s.cls === g('cls'));
  if (g('risk'))  list = list.filter(s => s.risk === g('risk'));
  if (g('ver'))   list = list.filter(s => s.verify === g('ver'));
  if (g('cat'))   list = list.filter(s => s.cat === g('cat'));
  if (g('kt'))    list = list.filter(s => s.kt === g('kt'));
  if (g('ch'))    list = list.filter(s => s.channel === g('ch'));
  if (q) list = list.filter(s => (s.no + ' ' + s.title + ' ' + s.text + ' ' + s.kt).indexOf(q) >= 0);

  const open = sigOpen().length;
  const high = (V.signals || []).filter(s => s.risk === 'high' && s.state !== 'closed').length;
  const work = (V.signals || []).filter(s => s.state === 'working').length;
  const closed = (V.signals || []).filter(s => s.state === 'closed').length;

  return '<div class="grid g4">' +
      stat({ label:'مفتوحة', n:open, ic:'i-warn', cls:open ? 'down' : 'up',
        sub:AR(high) + ' منها خطورتها عالية', series:[4,6,5,8,7,9,6,Math.max(1, open)] }) +
      stat({ label:'قيد المعالجة', n:work, ic:'i-hour',
        sub:'لدى الليدر أو الكنترول', series:[2,3,2,4,3,5,4,Math.max(1, work)] }) +
      stat({ label:'مغلقة', n:closed, ic:'i-checkc', cls:'up',
        sub:'حُلّت وأُبلغ صاحبها', series:[1,2,4,6,8,10,12,Math.max(1, closed)] }) +
      stat({ label:'متوسط الحلّ', n:sigAvgResp(), ic:'i-clock', suffix:' د',
        sub:'من الورود إلى الإغلاق', series:[40,36,34,30,28,26,24,Math.max(1, sigAvgResp())] }) +
    '</div>' +

    '<div class="card">' +
      head('البلاغات والحوادث', 'حدثٌ واحد له دورةٌ واحدة — من وروده إلى أرشفته',
        '<button class="btn p sm" data-a="signew">' + icon('i-plus','s16') +
        'إضافة بلاغ</button>', 'i-warn') +
      '<div class="quote">البلاغ الذي يصل خارج النظام — هاتفًا أو شفاهةً — يُسجَّل هنا ' +
        'ليدخل الدورة، فلا يبقى في ذاكرة أحد.</div>' +
      filterBar(K, [
        { k:'state', label:'الحالة',   opts:Object.keys(SIG_STATE).map(k2 => [k2, SIG_STATE[k2].ar]) },
        { k:'cls',   label:'التصنيف',  opts:Object.keys(SIG_CLASS).map(k2 => [k2, SIG_CLASS[k2].ar]) },
        { k:'risk',  label:'الخطورة',  opts:Object.keys(SIG_RISK).map(k2 => [k2, SIG_RISK[k2].ar]) },
        { k:'ver',   label:'التحقّق',  opts:Object.keys(SIG_VERIFY).map(k2 => [k2, SIG_VERIFY[k2].ar]) },
        { k:'cat',   label:'النوع',    opts:INC_CATS.map(c => [c.k, c.ar]) },
        { k:'ch',    label:'القناة',   opts:SIG_CHANNEL.map(c => [c, c]) },
        { k:'kt',    label:'الـKT',    opts:optKT() }
      ], list.length, total, 'ابحث برقم البلاغ أو عنوانه أو نصّه…') +
      (list.length ? pagedList(list, K, sigRow)
        : empty('لا بلاغات بهذه الفلاتر', 'امسح الفلاتر', 'i-warn')) +
    '</div>';
}

function sigRow(s) {
  const rk = SIG_RISK[s.risk], cl = SIG_CLASS[s.cls], st = SIG_STATE[s.state];
  const ver = SIG_VERIFY[s.verify];
  const stg = sigStage(s);
  return '<div class="prow sigrow" style="--tsc:' + rk.c + '" data-a="sigopen" data-id="' + s.id + '">' +
    '<span class="krail"></span>' +
    '<span class="ico" style="color:' + cl.c + '">' + icon(cl.i, 's18') + '</span>' +
    '<span class="nm" style="flex:1;min-width:150px"><b>' + E(s.title) + '</b>' +
      '<span>' + LTR(s.no) + ' · ' + E(s.catAr) + ' · ' + LTR(s.kt) + ' · ' + E(s.channel) +
      (s.outside ? ' · <b style="color:var(--amber)">خارج النظام</b>' : '') + '</span></span>' +
    '<span class="sigq"><span class="tiny faint">المرحلة</span>' +
      '<b class="num">' + AR(stg) + '<i>/١٢</i></b>' +
      '<span class="sigbar"><i style="width:' + Math.round(stg / 12 * 100) + '%"></i></span></span>' +
    '<span class="fl" style="gap:6px;flex-wrap:wrap">' +
      pill(cl.ar, 'grey') + pill(ver.ar, ver.p) + pill(rk.ar, rk.p) + '</span>' +
    '<span class="when"><b>' + untilTxt(s.at) + '</b>' +
      '<span class="num">استجابة ' + AR(s.resp) + ' د</span></span>' +
    '<span class="end">' + pill(st.ar, st.p) + '</span></div>';
}

/* ---------- درج البلاغ: الدورة كاملةً، كلّ مرحلةٍ تُملأ ---------- */
function sigDrawer(id) {
  const s = (S.signals || []).find(x => x.id === id); if (!s) return;
  const rk = SIG_RISK[s.risk], cl = SIG_CLASS[s.cls], st = SIG_STATE[s.state];
  const ver = SIG_VERIFY[s.verify];
  const stg = sigStage(s);
  const owner = s.owner ? userById(s.owner) : null;
  const chip = (act, cur, k, label, col) =>
    '<button class="chipbtn' + (cur === k ? ' on' : '') + '" data-a="' + act +
    '" data-id="' + s.id + '" data-v="' + k + '"' +
    (col ? ' style="--cc:' + col + '"' : '') + '>' + E(label) + '</button>';

  S.drawer = { title:s.title, sub:s.no + ' · ' + s.catAr + ' · ' + s.kt,
    icon:cl.i, wide:!!S.dwide, expand:id, body:

    '<div class="card" style="--kc:' + rk.c + '">' +
      head('المرحلة ' + AR(stg) + ' من ١٢', SIG_STAGES[Math.min(11, stg - 1)].ar,
        pill(st.ar, st.p), 'i-hist') +
      '<div class="sigsteps">' + SIG_STAGES.map(x =>
        '<span class="sigs' + (x.no <= stg ? ' on' : '') + (x.no === stg ? ' now' : '') + '" ' +
        'title="' + E(x.ar) + ' — ' + E(x.q) + '">' + AR(x.no) + '</span>').join('') + '</div>' +
      '<div class="quote" style="margin-top:12px">' + E(s.text) + '</div>' +
      '<div class="grid g2" style="gap:10px;margin-top:12px">' +
        '<span><div class="tiny faint">١ · الحدث</div><b>' + E(s.title) + '</b></span>' +
        '<span><div class="tiny faint">٢ · المصدر</div><b>' + E(s.source) + '</b></span>' +
        '<span><div class="tiny faint">٣ · القناة</div><b>' + E(s.channel) +
          (s.outside ? ' · خارج النظام' : '') + '</b></span>' +
        '<span><div class="tiny faint">الجهة</div><b>' + LTR(s.kt) + ' · ' + E(s.hotel || '') + '</b></span>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      head('٤–٥ · تسجيل المعلومة والتحقّق',
        'إن ثبت أنها مغلوطة، نعود للتسجيل ولا نُغلق على خطأ',
        pill(ver.ar, ver.p), 'i-shield') +
      '<div class="chipwrap">' + Object.keys(SIG_VERIFY).map(k =>
        chip('sigver', s.verify, k, SIG_VERIFY[k].ar)).join('') + '</div>' +
      (s.verify === 'wrong' ? '<div class="note r" style="margin-top:12px">' +
        icon('i-warn','s16') + '<span><b>المعلومة مغلوطة</b><br>' +
        E(s.wrongNote || 'أعِد تسجيل المعلومة الصحيحة قبل المضيّ.') + '</span></div>' +
        '<label class="fl2">التسجيل الصحيح</label>' +
        '<textarea class="fld" id="q-sigfix" data-q="sigfix" rows="3" ' +
          'placeholder="ما الذي حدث فعلًا؟">' + E(qOf('sigfix')) + '</textarea>' +
        '<button class="btn p sm" style="width:100%;margin-top:10px" data-a="sigfix" ' +
          'data-id="' + s.id + '">' + icon('i-check','s14') +
          'تسجيل المعلومة الصحيحة</button>' : '') +
    '</div>' +

    '<div class="card">' +
      head('٦–٧ · التصنيف والخطورة', 'ما نوعها؟ وما مستوى خطورتها؟', '', 'i-list') +
      '<div class="tiny faint" style="margin:4px 0 7px">التصنيف</div>' +
      '<div class="chipwrap">' + Object.keys(SIG_CLASS).map(k =>
        chip('sigcls', s.cls, k, SIG_CLASS[k].ar)).join('') + '</div>' +
      '<div class="tiny faint" style="margin:13px 0 7px">درجة الخطورة</div>' +
      '<div class="chipwrap">' + Object.keys(SIG_RISK).map(k =>
        chip('sigrisk', s.risk, k, SIG_RISK[k].ar)).join('') + '</div>' +
    '</div>' +

    '<div class="card">' +
      head('٨ · قاعدة المعالجة', 'ماذا يجب أن نقوم به؟', '', 'i-target') +
      '<div class="rules">' + Object.keys(SIG_RULE).map(k =>
        '<button class="rulebtn' + (s.rule === k ? ' on' : '') + '" data-a="sigrule" ' +
        'data-id="' + s.id + '" data-v="' + k + '">' + icon(SIG_RULE[k].i,'s16') +
        '<span><b>' + E(SIG_RULE[k].ar) + '</b>' +
        '<span class="tiny faint">' + E(SIG_RULE[k].d) + '</span></span>' +
        (s.rule === k ? icon('i-check','s14') : '') + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' +
      head('٩ · إسناد المسؤولية', owner ? 'المسؤول عن الإجراء' : 'لم يُسنَد بعد',
        '', 'i-users') +
      (owner ? '<div class="row" style="padding:9px 4px">' + avatar(owner) +
        '<span class="nm" style="flex:1"><b>' + E(owner.name) + '</b>' +
        '<span>' + E(owner.specialty || '') + ' · شِفت ' + E(shiftOf(owner)) + '</span></span>' +
        '<button class="chipbtn" data-a="sigown" data-id="' + s.id + '">تغيير</button></div>'
        : '<button class="btn p sm" style="width:100%" data-a="sigown" data-id="' + s.id + '">' +
          icon('i-assign','s14') + 'إسناد لمن يعالجه</button>') +
    '</div>' +

    '<div class="card gold">' +
      head('١٠–١٢ · المتابعة والتأكيد والإغلاق',
        'هل نُفِّذ المطلوب؟ وهل تحقّق الهدف؟', '', 'i-checkc') +
      '<div class="grid g3" style="gap:8px">' +
        '<button class="chipbtn' + (s.followed ? ' on' : '') + '" data-a="sigfollow" ' +
          'data-id="' + s.id + '">' + icon('i-checkc','s13') + 'نُفِّذ المطلوب</button>' +
        '<button class="chipbtn' + (s.confirm ? ' on' : '') + '" data-a="sigconfirm" ' +
          'data-id="' + s.id + '">' + icon('i-target','s13') + 'تحقّق الهدف</button>' +
        (s.state === 'closed'
          ? '<button class="chipbtn" data-a="sigreopen" data-id="' + s.id + '">' +
            icon('i-back','s13') + 'إعادة فتح</button>'
          : '<button class="chipbtn bad" data-a="sigclose" data-id="' + s.id + '">' +
            icon('i-stop','s13') + 'إغلاق وأرشفة</button>') +
      '</div>' +
      (s.state !== 'closed' && !(s.followed && s.confirm)
        ? '<div class="tiny faint" style="margin-top:10px">' +
          'لا يُغلق البلاغ قبل تأكيد التنفيذ وتحقّق الهدف معًا.</div>' : '') +
    '</div>' +

    '<div class="card">' + head('الردّ', 'يصل صاحب البلاغ', '', 'i-send') +
      '<textarea class="fld" id="q-sigrep" data-q="sigrep" rows="3" ' +
        'placeholder="ما الإجراء؟ ومتى؟">' + E(qOf('sigrep')) + '</textarea>' +
      '<div style="margin-top:11px">' + filePick('sigRep') + '</div>' +
      '<button class="btn p" style="width:100%;margin-top:12px" data-a="sigreply" ' +
        'data-id="' + s.id + '">' + icon('i-send','s16') + 'إرسال</button>' +
    '</div>' +

    '<div class="card">' + head('سجلّ الدورة', AR((s.trail || []).length) + ' قيدًا', '', 'i-hist') +
      histLog((s.trail || []).map(x => ({ at:x.at, text:x.by + ' — ' + x.text, kind:'info' }))) +
    '</div>' };
  renderDrawer();
}

/* ---------- بلاغ جديد: يصل خارج النظام فيُسجَّل ---------- */
function sigNew() {
  const d = S.sform = S.sform || { cat:INC_CATS[0].k, source:SIG_SOURCE[0],
    channel:SIG_CHANNEL[1], cls:'complaint', risk:'mid', kt:(ORGS[0] || {}).kt };
  const chip = (act, cur, k, label) =>
    '<button class="chipbtn' + (cur === k ? ' on' : '') + '" data-a="' + act +
    '" data-v="' + E(k) + '">' + E(label) + '</button>';

  S.drawer = { title:'إضافة بلاغ', sub:'بلاغٌ وصل خارج النظام — يُسجَّل ليدخل الدورة',
    icon:'i-plus', wide:!!S.dwide, body:

    '<div class="note b">' + icon('i-info','s16') +
      '<span>ما يصل هاتفًا أو شفاهةً لا يدخل الدورة ما لم يُسجَّل. ' +
      'وهذه الشاشة بابُه.</span></div>' +

    '<div class="card">' + head('١ · الحدث', 'الموقف باختصار', '', 'i-warn') +
      '<label class="fl2">العنوان</label>' +
      '<input class="fld" id="q-sg_t" data-q="sg_t" value="' + E(qOf('sg_t')) +
        '" placeholder="مثال: تأخّر باص التفويج · طلب عفاشين · وفاة">' +
      '<label class="fl2">التفصيل</label>' +
      '<textarea class="fld" id="q-sg_b" data-q="sg_b" rows="3" ' +
        'placeholder="ماذا حدث؟ وأين؟ ومتى؟">' + E(qOf('sg_b')) + '</textarea>' +
      '<label class="fl2">النوع</label>' +
      '<div class="chipwrap">' + INC_CATS.map(c =>
        chip('sgcat', d.cat, c.k, c.ar)).join('') + '</div>' +
      '<label class="fl2">الجهة</label>' +
      '<div class="chipwrap">' + ORGS.slice(0, 10).map(o =>
        chip('sgkt', d.kt, o.kt, o.kt)).join('') + '</div>' +
    '</div>' +

    '<div class="card">' + head('٢–٣ · المصدر والقناة', 'من أين جاءت؟ وكيف وصلت؟', '', 'i-send') +
      '<label class="fl2">المصدر</label>' +
      '<div class="chipwrap">' + SIG_SOURCE.map(x =>
        chip('sgsrc', d.source, x, x)).join('') + '</div>' +
      '<label class="fl2">القناة</label>' +
      '<div class="chipwrap">' + SIG_CHANNEL.map(x =>
        chip('sgch', d.channel, x, x)).join('') + '</div>' +
    '</div>' +

    '<div class="card">' + head('٦–٧ · التصنيف والخطورة', 'يمكن تعديلهما بعد التحقّق', '', 'i-list') +
      '<div class="chipwrap">' + Object.keys(SIG_CLASS).map(k =>
        chip('sgcls', d.cls, k, SIG_CLASS[k].ar)).join('') + '</div>' +
      '<div class="chipwrap" style="margin-top:9px">' + Object.keys(SIG_RISK).map(k =>
        chip('sgrisk', d.risk, k, SIG_RISK[k].ar)).join('') + '</div>' +
    '</div>' +

    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="sgsave">' + icon('i-check','s16') + 'تسجيل البلاغ</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button></div>' };
  renderDrawer();
}
