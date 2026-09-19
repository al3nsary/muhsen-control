/* ============================================================
   إدارة الحركة — النقل والمرشدون وعقود النقل

   العقد ليس ملفًّا يُرفَع ويُنسى: هو **صفٌّ فيه أرقام** — باصاتٌ
   وكراسٍ وحجّاج — و**ملفٌّ يُعايَن في مكانه** لا يُنزَّل ليُفتح، و**حالةٌ**
   تقول أسُجِّل في نظام ضيف أم لا، و**كشفُ مرشدين** يُنزَّل قالبًا
   ويُعبَّأ ويُرفع.

   والمرشد محسنٌ تخصّصه نقل — فبابُه هنا لا في سجلّ الموظفين العامّ،
   لأنّ من يدير الحركة لا يبحث في ثلاثمئة اسم عن أربعين.
   ============================================================ */

/* حالة العقد في نظام ضيف — وهي أوّل ما يُسأل عنه */
const DAIF_ST = {
  reg:     { ar:'مسجَّل في ضيف',   p:'live', c:'#16A34A', i:'i-checkc' },
  pending: { ar:'قيد التسجيل',     p:'wait', c:'#E67E22', i:'i-clock' },
  no:      { ar:'غير مسجَّل',      p:'no',   c:'#C0392B', i:'i-xc' },
  na:      { ar:'لا يلزمه تسجيل', p:'grey', c:'#5A6C63', i:'i-info' }
};
const CTR_ST = {
  draft:  { ar:'مسودّة',  p:'grey' },
  active: { ar:'ساري',    p:'live' },
  ended:  { ar:'منتهٍ',   p:'wait' },
  void:   { ar:'ملغى',    p:'no' }
};
const CARRIERS = ['شركة رواحل الحرمين للنقل البري', 'مسار للنقل البرّي',
  'النقل الجماعي الموحّد', 'شركة دروب المشاعر', 'أسطول الحرمين'];

/* ---------- بذر العقود ---------- */
function seedMove(st) {
  st.ctrs = [];
  const kinds = ['نقل الحجاج من المطار', 'التفويج إلى المشاعر', 'جولات المزارات',
    'المغادرة إلى المطار', 'النقل بين الفنادق'];
  ORGS.slice(0, 9).forEach((o, i) => {
    const buses = 6 + (i * 3) % 22;
    const seats = buses * (i % 3 === 0 ? 49 : i % 3 === 1 ? 45 : 53);
    const pil = Math.min(o.pilgrims, Math.round(seats * (0.72 + (i % 4) * 0.06)));
    const daif = i % 5 === 0 ? 'no' : i % 4 === 0 ? 'pending' : i % 7 === 0 ? 'na' : 'reg';
    const nGuides = Math.max(2, Math.round(buses / 3));
    st.ctrs.push({
      id:'TC' + (9800 + i), no:'NQ-' + (2400 + i * 7),
      title:kinds[i % kinds.length] + ' — ' + o.kt,
      carrier:CARRIERS[i % CARRIERS.length],
      orgId:o.id, kt:o.kt,
      buses, seats, pilgrims:pil,
      trips: buses * (2 + i % 3),
      value: 180000 + i * 41000,
      from: Date.now() - (20 - i) * DAY,
      to:   Date.now() + (25 + i * 2) * DAY,
      state: i === 8 ? 'draft' : i === 7 ? 'ended' : 'active',
      daif,
      daifNo: daif === 'reg' ? 'DF-' + (77100 + i * 13) : '',
      file: { name:'عقد-' + (2400 + i * 7) + '.pdf', size:280000 + i * 21000,
        type:'application/pdf' },
      at: Date.now() - (22 - i) * DAY,
      guides: Array.from({ length: nGuides }, (_, k) => {
        const seed = i * 17 + k * 5;
        return {
          name: saName(seed % 5 < 1 ? 'f' : 'm', seed),
          id: '10' + (4000000 + seed * 977),
          phone: '+9665' + (58100000 + seed * 311),
          lic: 'GL-' + (33000 + seed * 7),
          bus: 'BUS-' + (100 + (k % buses)),
          lang: ['العربية','الإنجليزية','الملايوية','الأردية'][seed % 4]
        };
      }),
      log:[{ at: Date.now() - (22 - i) * DAY, by:'الكنترول',
        text:'سُجّل العقد ورُفع ملفّه' }]
    });
  });
}

/* حسابات */
const ctrsAll = () => (V.ctrs || []);
const notInDaif = () => ctrsAll().filter(c => c.daif === 'no' || c.daif === 'pending').length;
/* المرشد: محسنٌ تخصّصه نقل */
const guidesTeam = () => (V.users || []).filter(u => u.role === 'muhsen' && u.specialty === 'نقل');

/* ============================================================
   ١) المرشدون — محسنو النقل وحدهم
   ============================================================ */
function screenGuidesMv() {
  const K = 'gmv';
  const q = qOf(K);
  let list = guidesTeam();
  const total = list.length;
  if (fOf(K, 'shift')) list = list.filter(u => shiftOf(u) === fOf(K, 'shift'));
  if (fOf(K, 'org'))   list = list.filter(u => (staffOrg(u) || {}).id === fOf(K, 'org'));
  if (fOf(K, 'res'))   list = list.filter(u => fOf(K, 'res') === 'y' ? u.reserve : !u.reserve);
  if (fOf(K, 'here'))  list = list.filter(u =>
    fOf(K, 'here') === 'y' ? isPresent(u.id, now()) : !isPresent(u.id, now()));
  if (q) list = list.filter(u => (u.name + ' ' + u.code + ' ' + (u.phone || '')).indexOf(q) >= 0);

  const here = guidesTeam().filter(u => isPresent(u.id, now())).length;
  const onTrip = guidesTeam().filter(u => (V.trips || []).some(t =>
    (t.riders || []).indexOf(u.id) >= 0)).length;
  const inCtr = ctrsAll().reduce((a, c) => a + (c.guides || []).length, 0);

  return '<div class="grid g4">' +
      stat({ label:'المرشدون', n:total, ic:'i-users',
        sub:'محسنون تخصّصهم نقل', series:[20,24,28,32,36,38,39,Math.max(1, total)] }) +
      stat({ label:'حاضرون الآن', n:here, ic:'i-checkc', cls:'up',
        sub:'في شِفت ' + shiftAt(now()), series:[8,10,12,14,13,15,14,Math.max(1, here)] }) +
      stat({ label:'على رحلات', n:onTrip, ic:'i-bus',
        sub:'مسكَّنون على رحلاتٍ اليوم', series:[3,5,4,7,6,8,7,Math.max(1, onTrip)] }) +
      stat({ label:'في كشوف العقود', n:inCtr, ic:'i-doc',
        sub:'أسماءٌ وردت في كشوف الناقلين',
        series:[10,18,26,34,42,48,52,Math.max(1, inCtr)] }) +
    '</div>' +

    '<div class="card">' +
      head('المرشدون', 'محسنو النقل وحدهم — من يدير الحركة لا يبحث في ثلاثمئة اسم',
        '<button class="btn l sm" data-a="gmvxl">' + icon('i-doc','s14') +
        'تصدير إكسل</button>', 'i-bus') +
      filterBar(K, [
        { k:'shift', label:'الشِفت',  opts:SHIFTS.map(s => [s.k, s.k]) },
        { k:'here',  label:'الحضور',  opts:[['y','حاضر'],['n','غير حاضر']] },
        { k:'org',   label:'الجهة',   opts:optOrgs() },
        { k:'res',   label:'الاحتياط', opts:[['y','احتياط'],['n','مسكَّن']] }
      ], list.length, total, 'ابحث باسم المرشد أو رمزه أو جوّاله…') +
      (list.length ? pagedList(list, K, u => {
        const g = staffGroup(u), o = staffOrg(u);
        const trips = (V.trips || []).filter(t => (t.riders || []).indexOf(u.id) >= 0).length;
        const wn = warnsOf(u.id).filter(warnLive).length;
        return '<div class="prow" data-a="staffpage" data-id="' + u.id + '">' +
          avatar(u, 'sm') +
          '<span class="nm" style="flex:1;min-width:150px"><b>' + E(u.name) + '</b>' +
          '<span>' + LTR(u.code) + ' · ' + LTR(u.phone || '') +
          (o ? ' · ' + E(o.kt) : '') + '</span></span>' +
          '<span class="tcnts">' + cnt('i-bus', trips, 'رحلات اليوم') +
            (wn ? cnt('i-warn', wn, 'إنذارات قائمة', 'warn') : '') + '</span>' +
          pill('شِفت ' + shiftOf(u), 'grey') +
          (isPresent(u.id, now()) ? pill('حاضر', 'live') : pill('غير حاضر', 'no')) +
          (u.reserve ? pill('احتياط', 'gold') : (g ? pill(g.no, 'grey') : '')) +
          '<span class="end">' + icon('i-fwd','s16') + '</span></div>';
      }) : empty('لا مرشد مطابق', 'امسح الفلاتر', 'i-bus')) +
    '</div>';
}

/* ============================================================
   ٢) عقود النقل
   ============================================================ */
function screenCtrs() {
  const K = 'ctr';
  const q = qOf(K);
  let list = ctrsAll().slice().sort((a, b) => b.at - a.at);
  const total = list.length;
  if (fOf(K, 'daif'))  list = list.filter(c => c.daif === fOf(K, 'daif'));
  if (fOf(K, 'state')) list = list.filter(c => c.state === fOf(K, 'state'));
  if (fOf(K, 'org'))   list = list.filter(c => c.orgId === fOf(K, 'org'));
  if (fOf(K, 'car'))   list = list.filter(c => c.carrier === fOf(K, 'car'));
  if (q) list = list.filter(c => (c.no + ' ' + c.title + ' ' + c.carrier + ' ' +
    c.kt + ' ' + (c.daifNo || '')).indexOf(q) >= 0);

  const buses = ctrsAll().reduce((a, c) => a + c.buses, 0);
  const seats = ctrsAll().reduce((a, c) => a + c.seats, 0);
  const pil = ctrsAll().reduce((a, c) => a + c.pilgrims, 0);

  return '<div class="grid g4">' +
      stat({ label:'عقود سارية', n:ctrsAll().filter(c => c.state === 'active').length,
        ic:'i-doc', sub:'من ' + AR(total) + ' عقدًا',
        series:[3,4,5,6,7,7,8,Math.max(1, ctrsAll().filter(c => c.state === 'active').length)] }) +
      stat({ label:'إجمالي الحافلات', n:buses, ic:'i-bus',
        sub:AR(seats) + ' مقعدًا', series:[40,60,80,100,120,130,138,Math.max(1, buses)] }) +
      stat({ label:'حجّاج مغطَّون', n:pil, ic:'i-users',
        sub:AR(Math.round(pil / Math.max(1, seats) * 100)) + '٪ إشغال المقاعد',
        series:[300,600,900,1100,1300,1400,1450,Math.max(1, pil)] }) +
      stat({ label:'غير مسجَّل في ضيف', n:notInDaif(), ic:'i-warn',
        cls:notInDaif() ? 'down' : 'up', sub:'يُوقف التفويج إن لم يُسجَّل',
        series:[1,2,2,3,2,3,2,Math.max(1, notInDaif())] }) +
    '</div>' +

    '<div class="card">' +
      head('عقود النقل', 'كل عقدٍ صفٌّ فيه أرقامه، وملفٌّ يُعايَن في مكانه، وكشفُ مرشدين',
        '<button class="btn p sm" data-a="ctrnew">' + icon('i-plus','s16') +
        'تسجيل عقد</button>', 'i-doc') +
      (notInDaif() ? '<div class="note r">' + icon('i-warn','s16') +
        '<span><b>' + AR(notInDaif()) + ' عقدًا لم يُسجَّل في نظام ضيف</b><br>' +
        'التفويج لا يُعتمد بعقدٍ غير مسجَّل — سجّله أو علّم أنه لا يلزمه.</span></div>' : '') +
      filterBar(K, [
        { k:'daif',  label:'نظام ضيف', opts:Object.keys(DAIF_ST).map(k => [k, DAIF_ST[k].ar]) },
        { k:'state', label:'حالة العقد', opts:Object.keys(CTR_ST).map(k => [k, CTR_ST[k].ar]) },
        { k:'org',   label:'الجهة',    opts:optOrgs() },
        { k:'car',   label:'الناقل',   opts:CARRIERS.map(c => [c, c]) }
      ], list.length, total, 'ابحث برقم العقد أو اسمه أو الناقل أو رقم ضيف…') +
      (list.length ? '<div class="xtwrap"><div class="xtbl ctbl">' +
        '<div class="xhead">' + ['العقد','الناقل','الجهة','الحافلات','المقاعد','الحجاج',
          'الرحلات','نظام ضيف','المرشدون','الحالة','الملفّ والكشف']
          .map(t => '<span class="xth">' + t + '</span>').join('') + '</div>' +
        list.map(ctrRow).join('') + '</div></div>'
        : empty('لا عقود بهذه الفلاتر', 'امسح الفلاتر أو سجّل عقدًا', 'i-doc')) +
    '</div>';
}

function ctrRow(c) {
  const d = DAIF_ST[c.daif], st = CTR_ST[c.state];
  const o = orgById(c.orgId) || {};
  return '<div class="xrow" data-a="ctropen" data-id="' + c.id + '">' +
    '<span class="xc nmc"><span class="nm"><b>' + E(c.title) + '</b>' +
      '<span>' + LTR(c.no) + '</span></span></span>' +
    '<span class="xc">' + E(c.carrier) + '</span>' +
    '<span class="xc">' + LTR(c.kt) + '<span class="tiny faint">' + E(o.ar || '') + '</span></span>' +
    '<span class="xc num">' + AR(c.buses) + '</span>' +
    '<span class="xc num">' + AR(c.seats) + '</span>' +
    '<span class="xc num">' + AR(c.pilgrims) + '</span>' +
    '<span class="xc num">' + AR(c.trips) + '</span>' +
    '<span class="xc">' + pill(d.ar, d.p) +
      (c.daifNo ? '<span class="tiny faint">' + LTR(c.daifNo) + '</span>' : '') + '</span>' +
    '<span class="xc num">' + AR((c.guides || []).length) + '</span>' +
    '<span class="xc">' + pill(st.ar, st.p) + '</span>' +
    '<span class="xc act">' +
      '<button class="eyebtn" data-a="ctrfile" data-id="' + c.id + '" data-v="pdf" ' +
        'aria-label="معاينة العقد" title="معاينة العقد في الموقع">' + icon('i-eye','s15') + '</button>' +
      '<button class="eyebtn" data-a="ctrfile" data-id="' + c.id + '" data-v="img" ' +
        'aria-label="معاينة كصورة" title="معاينة كصورة">' + icon('i-photo','s15') + '</button>' +
      '<button class="eyebtn" data-a="ctrxl" data-id="' + c.id + '" ' +
        'aria-label="قالب المرشدين" title="تنزيل قالب المرشدين">' + icon('i-doc','s15') + '</button>' +
      '<label class="eyebtn up" title="رفع كشف المرشدين">' + icon('i-clip','s15') +
        '<input type="file" data-gx="' + c.id + '" accept=".csv,.txt" hidden></label>' +
    '</span></div>';
}

/* ---------- درج العقد ---------- */
function ctrDrawer(id) {
  const c = ctrsAll().find(x => x.id === id); if (!c) return;
  const d = DAIF_ST[c.daif], st = CTR_ST[c.state];
  const o = orgById(c.orgId) || {};
  const gl = c.guides || [];

  S.drawer = { title:c.title, sub:c.no + ' · ' + c.carrier, icon:'i-doc',
    wide:!!S.dwide, expand:id, body:

    '<div class="card" style="--kc:' + d.c + '">' +
      head(st.ar, 'من ' + hijri(c.from) + ' إلى ' + hijri(c.to),
        pill(d.ar, d.p), 'i-doc') +
      '<div class="grid g2" style="gap:11px">' +
        kv2('رقم العقد', LTR(c.no)) +
        kv2('الناقل', E(c.carrier)) +
        kv2('الجهة', LTR(c.kt) + ' · ' + E(o.ar || '')) +
        kv2('قيمة العقد', AR(c.value) + ' ريال') +
        kv2('عدد الحافلات', AR(c.buses)) +
        kv2('عدد المقاعد', AR(c.seats)) +
        kv2('عدد الحجاج', AR(c.pilgrims)) +
        kv2('عدد الرحلات', AR(c.trips)) +
        kv2('إشغال المقاعد', AR(Math.round(c.pilgrims / Math.max(1, c.seats) * 100)) + '٪') +
        kv2('رقم ضيف', c.daifNo ? LTR(c.daifNo) : '—') +
      '</div>' +
      '<div class="grid g2" style="gap:8px;margin-top:13px">' +
        '<button class="btn p sm" data-a="ctrfile" data-id="' + c.id + '" data-v="pdf">' +
          icon('i-eye','s14') + 'معاينة العقد</button>' +
        '<button class="btn l sm" data-a="ctrfile" data-id="' + c.id + '" data-v="img">' +
          icon('i-photo','s14') + 'معاينة كصورة</button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      head('نظام ضيف', 'التفويج لا يُعتمد بعقدٍ غير مسجَّل', '', d.i) +
      '<div class="chipwrap">' + Object.keys(DAIF_ST).map(k =>
        '<button class="chipbtn' + (c.daif === k ? ' on' : '') + '" data-a="ctrdaif" ' +
        'data-id="' + c.id + '" data-v="' + k + '">' + E(DAIF_ST[k].ar) + '</button>').join('') + '</div>' +
      (c.daif === 'reg' || c.daif === 'pending'
        ? '<label class="fl2">رقم التسجيل في ضيف</label>' +
          '<input class="fld" id="q-ctrdf" data-q="ctrdf" value="' + E(c.daifNo || '') +
            '" placeholder="DF-77100">' +
          '<button class="btn l sm" style="width:100%;margin-top:10px" data-a="ctrdfsave" ' +
            'data-id="' + c.id + '">' + icon('i-check','s14') + 'حفظ الرقم</button>' : '') +
      '<div class="tiny faint" style="margin-top:11px">حالة العقد</div>' +
      '<div class="chipwrap">' + Object.keys(CTR_ST).map(k =>
        '<button class="chipbtn' + (c.state === k ? ' on' : '') + '" data-a="ctrstate" ' +
        'data-id="' + c.id + '" data-v="' + k + '">' + E(CTR_ST[k].ar) + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card gold">' +
      head('كشف المرشدين', gl.length ? AR(gl.length) + ' مرشدًا في الكشف'
        : 'لم يُرفع كشفٌ بعد',
        '<span class="fl" style="gap:7px">' +
          '<button class="btn l sm" data-a="ctrxl" data-id="' + c.id + '">' +
            icon('i-doc','s14') + 'قالب فارغ</button>' +
          '<label class="btn p sm" style="cursor:pointer">' + icon('i-clip','s14') +
            'رفع الكشف<input type="file" data-gx="' + c.id + '" accept=".csv,.txt" hidden>' +
          '</label>' +
        '</span>', 'i-users') +
      '<div class="quote">نزِّل القالب فارغًا، عبّئه بأسماء المرشدين وأرقامهم، ثم ارفعه — ' +
        'تُقرأ العناوين لا المواضع، فلا يضرّ ترتيبك.</div>' +
      (gl.length ? '<div class="xtwrap" style="margin-top:12px"><div class="xtbl gtbl">' +
        '<div class="xhead">' + ['الاسم','رقم الهوية','الجوال','رقم الرخصة','الحافلة','اللغة']
          .map(t => '<span class="xth">' + t + '</span>').join('') + '</div>' +
        gl.map(g => '<div class="xrow">' +
          '<span class="xc"><b>' + E(g.name) + '</b></span>' +
          '<span class="xc num">' + LTR(g.id) + '</span>' +
          '<span class="xc num">' + LTR(g.phone) + '</span>' +
          '<span class="xc num">' + LTR(g.lic) + '</span>' +
          '<span class="xc num">' + LTR(g.bus) + '</span>' +
          '<span class="xc">' + E(g.lang) + '</span></div>').join('') +
        '</div></div>'
        : '<div class="tiny faint" style="margin-top:12px">لا أسماء بعد.</div>') +
    '</div>' +

    '<div class="card">' + head('سجلّ العقد', AR((c.log || []).length) + ' قيدًا', '', 'i-hist') +
      histLog((c.log || []).map(x => ({ at:x.at, text:x.by + ' — ' + x.text, kind:'info' }))) +
    '</div>' };
  renderDrawer();
}

/* ---------- معاينة العقد: تُفتح في الموقع لا تُنزَّل ---------- */
function ctrFile(id, mode) {
  const c = ctrsAll().find(x => x.id === id); if (!c) return;
  const o = orgById(c.orgId) || {};
  const kv = (a, b) => '<div class="dkv"><span>' + a + '</span><b>' + b + '</b></div>';
  const paper =
    '<h4>عقد نقل بري لحجاج بيت الله الحرام</h4>' +
    '<div class="dsub">موسم حج ' + AR(1448) + 'هـ · رقم العقد ' + LTR(c.no) +
      (c.daifNo ? ' · ضيف ' + LTR(c.daifNo) : '') + '</div>' +
    '<p>إنه في يوم ' + dayName(c.from) + ' الموافق ' + hijri(c.from) +
      'هـ، تمّ الاتفاق بين كلٍّ من:</p>' +
    kv('الطرف الأول (الناقل)', E(c.carrier)) +
    kv('الطرف الثاني (المتعاقد)', E(o.ar || '') + ' — ' + LTR(c.kt)) +
    kv('الدولة', E(o.country || '—')) +
    kv('موضوع العقد', E(c.title)) +
    '<h5>أولًا: حجم التشغيل</h5>' +
    kv('عدد الحافلات', AR(c.buses) + ' حافلة') +
    kv('إجمالي المقاعد', AR(c.seats) + ' مقعدًا') +
    kv('عدد الحجاج المنقولين', AR(c.pilgrims) + ' حاجًّا') +
    kv('عدد الرحلات المتعاقد عليها', AR(c.trips) + ' رحلة') +
    kv('عدد المرشدين المرافقين', AR((c.guides || []).length) + ' مرشدًا') +
    kv('مدة العقد', hijri(c.from) + 'هـ — ' + hijri(c.to) + 'هـ') +
    kv('قيمة العقد', AR(c.value) + ' ريال سعودي') +
    '<h5>ثانيًا: التزامات الناقل</h5><ol>' +
    '<li>حضور الحافلات قبل الموعد بساعتين على الأقلّ في نقطة الانطلاق.</li>' +
    '<li>أن تكون الحافلات مكيّفة ونظيفة ومزوّدة بمياه باردة وحقيبة إسعافات.</li>' +
    '<li>ألّا يتجاوز عمر الحافلة خمس سنوات، وأن تحمل لوحة المجموعة ورقمها.</li>' +
    '<li>أن يرافق كلَّ ثلاث حافلاتٍ مرشدٌ مرخَّص من الكشف المعتمد.</li>' +
    '<li>الالتزام بالمسار المعتمد من مركز التحكّم، وعدم التوقّف في غير نقاطه.</li></ol>' +
    '<h5>ثالثًا: التسجيل النظامي</h5>' +
    '<p>' + (c.daif === 'reg'
      ? 'هذا العقد مسجَّل في نظام ضيف برقم ' + LTR(c.daifNo) + '، ويُعتمد التفويج بموجبه.'
      : c.daif === 'pending'
      ? 'هذا العقد قيد التسجيل في نظام ضيف، ولا يُعتمد التفويج حتى يكتمل تسجيله.'
      : c.daif === 'na'
      ? 'هذا العقد لا يلزمه تسجيلٌ في نظام ضيف لطبيعة تشغيله.'
      : 'تنبيه: هذا العقد غير مسجَّل في نظام ضيف — ولا يُعتمد التفويج بموجبه.') + '</p>' +
    '<h5>رابعًا: الجزاءات</h5>' +
    '<p>يُخصم من قيمة العقد ما نسبته اثنان في المئة عن كل ساعة تأخير، ويحقّ للطرف ' +
    'الثاني فسخ العقد عند تكرار المخالفة ثلاث مرّات في الموسم الواحد.</p>';

  S.drawer = { title: mode === 'img' ? 'معاينة العقد كصورة' : 'معاينة العقد',
    sub:c.no + ' · ' + c.carrier, icon: mode === 'img' ? 'i-photo' : 'i-file',
    paper:true, expand:id, body:

    '<div class="rpbar">' +
      '<button class="btn' + (mode === 'pdf' ? ' p' : ' l') + ' sm" data-a="ctrfile" ' +
        'data-id="' + c.id + '" data-v="pdf">' + icon('i-file','s14') + 'كـPDF</button>' +
      '<button class="btn' + (mode === 'img' ? ' p' : ' l') + ' sm" data-a="ctrfile" ' +
        'data-id="' + c.id + '" data-v="img">' + icon('i-photo','s14') + 'كصورة</button>' +
      '<span class="fsp"></span>' +
      '<button class="btn l sm" data-a="ctrprint" data-id="' + c.id + '">' +
        icon('i-print','s14') + 'طباعة / حفظ PDF</button>' +
      '<button class="btn l sm" data-a="ctropen" data-id="' + c.id + '">' +
        icon('i-back','s14') + 'رجوع</button>' +
    '</div>' +
    '<div class="tiny faint" style="margin:10px 0">' + icon('i-clip','s13') + ' ' +
      E(c.file ? c.file.name : '—') +
      (c.file ? ' · ' + AR(Math.round(c.file.size / 1024)) + ' ك.ب' : '') +
      ' — يُعايَن هنا ولا يُنزَّل.</div>' +
    '<div class="' + (mode === 'img' ? 'ctrimg' : '') + '">' +
      '<div class="report doc2" id="ctrdoc">' + paper +
        '<div class="dsign"><span><b>الطرف الأول — ' + E(c.carrier) + '</b><i></i></span>' +
        '<span><b>الطرف الثاني — ' + E(o.ar || '') + '</b><i></i></span></div>' +
      '</div>' +
    '</div>' };
  renderDrawer();
}

/* ---------- تسجيل عقد جديد ---------- */
function ctrNew() {
  const d = S.cform = S.cform || { carrier:CARRIERS[0], orgId:(ORGS[0] || {}).id,
    daif:'pending', state:'active' };
  const f = (S.files || {}).ctrf;
  const fld = (k, label, ph) => '<label class="fl2">' + E(label) + '</label>' +
    '<input class="fld" id="q-c_' + k + '" data-q="c_' + k + '" value="' + E(qOf('c_' + k)) +
    '" placeholder="' + E(ph || '') + '">';

  S.drawer = { title:'تسجيل عقد نقل', sub:'بياناته وملفّه — والكشف يُرفع بعد الحفظ',
    icon:'i-doc', wide:!!S.dwide, body:

    '<div class="card">' + head('البيانات', 'الأرقام هي ما يُقرأ في الصفّ', '', 'i-doc') +
      fld('title', 'موضوع العقد', 'نقل الحجاج من المطار — KT085') +
      fld('no', 'رقم العقد', 'NQ-2450') +
      '<label class="fl2">الناقل</label>' +
      '<div class="chipwrap">' + CARRIERS.map(x =>
        '<button class="chipbtn' + (d.carrier === x ? ' on' : '') + '" data-a="ccar" ' +
        'data-v="' + E(x) + '">' + E(x) + '</button>').join('') + '</div>' +
      '<label class="fl2">الجهة</label>' +
      '<label class="fsel" style="width:100%"><span>الجهة</span>' +
        '<select data-q2="cOrg">' + (V.orgs || []).map(o =>
          '<option value="' + o.id + '"' + (d.orgId === o.id ? ' selected' : '') + '>' +
          E(o.kt + ' · ' + o.ar) + '</option>').join('') + '</select>' +
        icon('i-fwd','s14') + '</label>' +
      '<div class="grid g2" style="gap:0 12px">' +
        fld('buses', 'عدد الحافلات', '12') +
        fld('seats', 'عدد المقاعد', '540') +
        fld('pil', 'عدد الحجاج', '480') +
        fld('trips', 'عدد الرحلات', '36') +
        fld('value', 'قيمة العقد', '240000') +
      '</div>' +
    '</div>' +

    '<div class="card">' + head('نظام ضيف', 'أسُجِّل أم لا؟', '', 'i-shield') +
      '<div class="chipwrap">' + Object.keys(DAIF_ST).map(k =>
        '<button class="chipbtn' + (d.daif === k ? ' on' : '') + '" data-a="cdaif" ' +
        'data-v="' + k + '">' + E(DAIF_ST[k].ar) + '</button>').join('') + '</div>' +
      (d.daif === 'reg' || d.daif === 'pending' ? fld('daifno', 'رقم ضيف', 'DF-77100') : '') +
    '</div>' +

    '<div class="card">' + head('ملفّ العقد', 'يُعايَن في الموقع لا يُنزَّل', '', 'i-clip') +
      '<div style="margin-top:6px">' + filePick('ctrf') + '</div>' +
    '</div>' +

    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="ctrsave">' + icon('i-check','s16') + 'تسجيل العقد</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button></div>' };
  renderDrawer();
}

/* ---------- إكسل المرشدين: قالبٌ يُنزَّل ويُرفع بالبنية نفسها ---------- */
const GD_COLS = [
  ['name',  'اسم المرشد'],
  ['id',    'رقم الهوية'],
  ['phone', 'رقم الجوال'],
  ['lic',   'رقم الرخصة'],
  ['bus',   'رقم الحافلة'],
  ['lang',  'اللغة']
];
function guidesTemplate(c) {
  const sample = [{ name:'محمد القحطاني', id:'1044000123', phone:'+966581234567',
    lic:'GL-33010', bus:'BUS-101', lang:'العربية' }];
  download('كشف-مرشدين-' + c.no + '.csv', toCsv(GD_COLS, sample));
}
function parseGuides(text) {
  const t = String(text).replace(/^﻿/, '').replace(/\r/g, '');
  const lines = t.split('\n').filter(x => x.trim());
  if (!lines.length) return [];
  const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
  const head = lines[0].split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
  const map = {};
  GD_COLS.forEach(c => { const i = head.indexOf(c[1]); if (i >= 0) map[c[0]] = i; });
  return lines.slice(1).map(l => {
    const cells = l.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
    const o = {};
    Object.keys(map).forEach(k => { o[k] = cells[map[k]] || ''; });
    return o;
  }).filter(o => o.name);
}
