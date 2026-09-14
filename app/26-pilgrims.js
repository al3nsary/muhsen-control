/* ============================================================
   بيانات الحجاج · المجموعات · الاكسترا كوتا

   حلّ هذا محلّ «مهام نُسك». فالنُّسك في الواقع ليس مهامًّا تُسنَد، بل
   **سجلّ حجّاج** ببياناتهم التأشيريّة وحالات بطاقاتهم — ومنه تُشتقّ
   المجموعات، وإليه تُضاف الاكسترا كوتا.

   والقاعدة هنا: ما يُصدَّر إلى إكسل يُستورَد منه بالبنية نفسها حرفًا
   بحرف. فالقالب الذي تُنزّله هو الذي ترفعه.
   ============================================================ */

/* ---------- حالات إصدار البطاقة: عشر محطّات بترتيبها ---------- */
const CARD_FLOW = [
  { k:'batch',   ar:'دفعة جديدة' },
  { k:'approve', ar:'في انتظار الموافقة على الطباعة' },
  { k:'sent',    ar:'أُرسلت للطباعة' },
  { k:'printing',ar:'جاري الطباعة' },
  { k:'printed', ar:'تمت الطباعة' },
  { k:'arrived', ar:'وصلت إلى مركز التوزيع' },
  { k:'onway',   ar:'في الطريق إلى مركز التوزيع' },
  { k:'slot',    ar:'تم تحديد موعد الاستلام' },
  { k:'accepted',ar:'تم قبول الاستلام من مقدّم الخدمة' },
  { k:'handed',  ar:'تم التسليم للحاج' }
];
const CARD_IDX = k => Math.max(0, CARD_FLOW.findIndex(x => x.k === k));

const ISSUE_ST = {
  first:  { ar:'الإصدار الأول', p:'grey' },
  reissue:{ ar:'تم إعادة الإصدار', p:'gold' }
};
const ACT_ST = { on:{ ar:'فعّال', p:'live' }, off:{ ar:'غير فعّال', p:'no' } };

/* أنماط الحاجّ كما في بطاقة نُسك */
const PAT_CAT = ['حجاج خارج مجموعات', 'حجاج ضمن مجموعة', 'حجاج الشركات'];
const PAT_KIND = ['حاج عادي', 'حاج كبير سنّ', 'حاج ذو احتياج', 'مرافق'];

/* أين هو الآن — تُحدَّث من الميدان، وتُقرأ في الكنترول */
const WHERE = {
  makkah:  { ar:'مكة المكرمة', c:'#0B7A4B', i:'i-kaaba' },
  madinah: { ar:'المدينة المنوّرة', c:'#1B6E9C', i:'i-pin' },
  hada:    { ar:'مزارات الهدا', c:'#B8791A', i:'i-bus' },
  mashaer: { ar:'المشاعر', c:'#A85A22', i:'i-tent' },
  transit: { ar:'في الطريق', c:'#6B4E9E', i:'i-bus' },
  none:    { ar:'لم يصل', c:'#5A6C63', i:'i-clock' }
};

/* حالة صحّية مفصّلة — لا وسمٌ واحد */
const HEALTH = {
  none:  { ar:'سليم', c:'#16A34A', p:'live' },
  chron: { ar:'مرض مزمن', c:'#B8791A', p:'gold' },
  wheel: { ar:'كرسي متحرّك', c:'#1B6E9C', p:'wait' },
  acute: { ar:'حالة حادّة', c:'#C0392B', p:'no' },
  watch: { ar:'تحت الملاحظة', c:'#E67E22', p:'wait' }
};

/* ---------- الأسماء اللاتينية: تُشتقّ من العربية لتبقى متّسقة ---------- */
const TRANSLIT = {
  'محمد':'MUHAMMAD','أحمد':'AHMAD','عبدالله':'ABDULLAH','خالد':'KHALID','سعود':'SAUD',
  'فهد':'FAHAD','ياسر':'YASIR','بندر':'BANDAR','تركي':'TURKI','مشعل':'MISHAL',
  'ناصر':'NASIR','سلطان':'SULTAN','عمر':'OMAR','فيصل':'FAISAL','راكان':'RAKAN',
  'نورة':'NOURAH','هند':'HIND','سميرة':'SAMIRAH','ريم':'REEM','منى':'MUNA',
  'أسماء':'ASMA','دانة':'DANAH','شهد':'SHAHAD','أمل':'AMAL','سارة':'SARAH'
};
const latin = ar => TRANSLIT[ar] || String(ar || '').replace(/[^؀-ۿ ]/g, '')
  .split('').map(() => '').join('') || 'BIN ' + String(ar || '').length;

/* ---------- بذر السجلّ الكامل ---------- */
const HOSP = ['مركز ضيافة نزلي (66)', 'مركز ضيافة نزلي (112)', 'مركز ضيافة نزلي (64)',
  'مركز ضيافة نزلي (67)', 'مركز ضيافة نزلي (14)'];
const SVC_CO = ['شركة فندق هوليدي إن بكة لشخص واحد', 'شركة رواحل الحرمين للخدمة',
  'مؤسسة مطوّفي حجاج جنوب شرق آسيا'];
const MY_NAMES = ['AIDILAZMAN','BIN NASIRON','TARMIZI','SHAHRIMAN','JOHARI','ISMAIL',
  'SAUFI','YUSRI','ZAINAL','MOHD ALI','SARNAZNI','SALLALA','AMINA','HASIM','MUSA'];

function seedPilgrimData(st) {
  st.groupsV = [];          /* مجموعات التأشيرة — غير مجموعات التشكيل */
  let gi = 0;
  LEADERS.forEach((L, li) => {
    const org = ORGS.find(o => o.id === L.orgId) || {};
    const arr = st.pilgrims[L.kt] || [];
    /* لكل ليدر مجموعتا تأشيرة */
    const nG = 2;
    for (let k = 0; k < nG; k++) {
      gi++;
      st.groupsV.push({
        id: 'VG' + (900 + gi),
        no: L.kt + (k ? 'B' : 'A') + '-' + (140000 + gi * 137),
        name: ['Aqiq B','FLIGHT 4 - ELAF - MAJR','Az Zuha','SAFWAH','YASKIN-ANBAR PMN',
               'MAJR AL KABSH-PMN','DSSB FAIRUZ 3'][gi % 7] + ' - ' + (100 + gi) + ' PAX',
        kt: L.kt, leaderId: L.id, orgId: L.orgId,
        svcCo: SVC_CO[gi % SVC_CO.length],
        hospVisa: HOSP[gi % HOSP.length],
        hospPre: HOSP[(gi + 2) % HOSP.length],
        office: (306 + (gi % 20)) + ' - ' + (org.country || 'ماليزيا'),
        preNo: L.kt + 'B-' + (84000 + gi * 61) + ' Pax-1',
        orgSub: '—', orgIndep: '—',
        at: Date.now() - (60 - gi) * DAY
      });
    }
    arr.forEach((p, i) => {
      const vg = st.groupsV[st.groupsV.length - nG + (i % nG)];
      const seed = li * 13 + i * 7;
      const step = i % 11 === 0 ? 'batch' : i % 7 === 0 ? 'approve'
        : i % 5 === 0 ? 'printing' : i % 3 === 0 ? 'accepted' : 'handed';
      const nm = String(p.name).split(' ');
      Object.assign(p, {
        permit: '4470' + String(50105788782 + seed).slice(0, 11),
        pkg: 'PKG-' + (620000 + li * 977 + i * 13),   /* رقم الباقة الشاملة */
        firstAr: nm[0] || '', fatherAr: nm[1] || '—', grandAr: '—', familyAr: nm[2] || nm[1] || '—',
        firstEn: MY_NAMES[seed % MY_NAMES.length],
        fatherEn: MY_NAMES[(seed + 3) % MY_NAMES.length],
        grandEn: '—',
        familyEn: 'BIN ' + MY_NAMES[(seed + 7) % MY_NAMES.length],
        passport: 'A' + (70000000 + seed * 1237),
        nationality: org.country || 'ماليزيا',
        patCat: PAT_CAT[seed % PAT_CAT.length],
        patKind: PAT_KIND[(seed + 1) % PAT_KIND.length],
        dob: (1950 + (seed % 45)) + '-' + String(1 + seed % 12).padStart(2, '0') +
             '-' + String(1 + seed % 27).padStart(2, '0'),
        batchId: (4700000 + li * 900 + i) + '-01',
        office: vg.office,
        visaGroup: vg.id,
        hosp: vg.hospVisa,
        arrived: step !== 'batch',
        arriveAt: Date.now() - ((30 - (seed % 28)) * DAY),
        issue: seed % 6 === 0 ? 'reissue' : 'first',
        active: seed % 9 === 0 ? 'off' : 'on',
        cardStep: step,
        cardLog: CARD_FLOW.slice(0, CARD_IDX(step) + 1).map((c, k2) => ({
          k: c.k, at: Date.now() - (26 - k2 * 2 - (seed % 3)) * DAY })),
        /* السكن في الحرمين */
        makkah: HOTELS[(li + i) % HOTELS.length].ar,
        makkahRoom: 100 + ((i * 7 + li * 13) % 380),
        madinah: ['دار التقوى','فندق الأنصار جولدن','منازل طيبة','الحرم بلازا'][(li + i) % 4],
        madinahRoom: 200 + ((i * 5 + li * 11) % 250),
        where: !step || step === 'batch' ? 'none'
          : ['makkah','makkah','makkah','madinah','hada','mashaer','transit'][(seed) % 7],
        health: p.flag === 'حالة صحية' ? 'chron' : p.flag === 'كرسي متحرّك' ? 'wheel'
          : seed % 31 === 0 ? 'acute' : seed % 17 === 0 ? 'watch' : 'none',
        healthLog: [],
        extra: false
      });
      /* سجلّ صحّي من لحظة الوصول لمن له حالة */
      if (p.health !== 'none') {
        p.healthLog = [
          { at: p.arriveAt, by:'مركز الاستقبال', text:'رُصدت الحالة عند الوصول: ' + HEALTH[p.health].ar },
          { at: p.arriveAt + 2 * DAY, by:'مشرف السكن', text:'متابعة دوريّة — الحالة مستقرّة' }
        ];
        if (p.health === 'acute') p.healthLog.unshift(
          { at: Date.now() - 6 * HR, by:'الهلال الأحمر', text:'نُقل إلى المستشفى وعاد بعد ساعتين' });
      }
    });
  });

  /* ---------- الاكسترا كوتا: دفعات من الشركات تنتظر الموافقة ---------- */
  st.quota = [];
  ORGS.slice(0, 6).forEach((o, i) => {
    const n = [50, 30, 18, 42, 25, 12][i];
    const L = LEADERS.find(x => x.orgId === o.id) || LEADERS[0];
    const state = i === 0 ? 'pending' : i === 1 ? 'pending' : i === 2 ? 'approved'
      : i === 3 ? 'incomplete' : i === 4 ? 'approved' : 'rejected';
    st.quota.push({
      id: 'QT' + (700 + i), no: 'EQ-' + (7300 + i),
      orgId: o.id, kt: o.kt, leaderId: L.id,
      count: n, state,
      at: Date.now() - (2 + i) * DAY,
      by: o.ar,
      note: state === 'incomplete' ? 'ينقص جواز ثلاثة حجّاج ورقم تصريح موحّد لاثنين.' : '',
      rows: Array.from({ length: Math.min(n, 60) }, (_, k) => {
        const seed = i * 31 + k * 7;
        return {
          permit: '4470' + String(50105799000 + seed).slice(0, 11),
          firstEn: MY_NAMES[seed % MY_NAMES.length],
          fatherEn: MY_NAMES[(seed + 4) % MY_NAMES.length],
          grandEn: '—',
          familyEn: 'BIN ' + MY_NAMES[(seed + 9) % MY_NAMES.length],
          firstAr: SA_M[seed % SA_M.length], fatherAr: SA_M[(seed + 5) % SA_M.length],
          grandAr: '—', familyAr: SA_L[seed % SA_L.length],
          passport: 'A' + (71000000 + seed * 911),
          nationality: o.country, patCat: PAT_CAT[seed % 3], patKind: PAT_KIND[seed % 4],
          dob: (1955 + seed % 40) + '-0' + (1 + seed % 9) + '-1' + (seed % 9),
          g: seed % 3 ? 'm' : 'f',
          pkg: 'PKG-' + (690000 + i * 411 + k * 17),
          ok: state === 'incomplete' ? (k % 9 !== 2) : true
        };
      })
    });
  });
}

/* ---------- حسابات ---------- */
const allPil = () => Object.keys(S.pilgrims || {})
  .reduce((a, k) => a.concat((S.pilgrims[k] || []).map(p =>
    Object.assign({ kt: k }, p))), []);
const vgById = id => (S.groupsV || []).find(g => g.id === id) || null;
const quotaPending = () => (S.quota || []).filter(q => q.state === 'pending').length;
const quotaTotal = () => (S.quota || []).filter(q => q.state === 'pending')
  .reduce((a, q) => a + q.count, 0);

/* ============================================================
   إكسل: يُنزَّل قالبًا، ويُعبَّأ، ويُرفع — بالبنية نفسها حرفًا بحرف
   (CSV بفاصلة منقوطة و BOM، فيفتحه إكسل العربي بلا عبث بالترميز)
   ============================================================ */
const XL_COLS = [
  ['permit',      'رقم التصريح الموحد'],
  ['firstEn',     'الاسم الأول (بالإنجليزية)'],
  ['fatherEn',    'اسم الأب (بالإنجليزية)'],
  ['grandEn',     'اسم الجد (بالإنجليزية)'],
  ['familyEn',    'اسم العائلة (بالإنجليزية)'],
  ['firstAr',     'الاسم الأول (بالعربية)'],
  ['fatherAr',    'اسم الأب (بالعربية)'],
  ['grandAr',     'اسم الجد (بالعربية)'],
  ['familyAr',    'اسم العائلة (بالعربية)'],
  ['passport',    'رقم الجواز'],
  ['nationality', 'الجنسية'],
  ['patCat',      'فئة النمط'],
  ['patKind',     'تصنيف النمط'],
  ['dob',         'تاريخ الميلاد'],
  ['g',           'الجنس'],
  ['pkg',         'رقم الباقة الشاملة']
];
/* أعمدة إضافية في تصدير السجلّ الكامل */
const XL_MORE = [
  ['no','رقم الحاج'], ['kt','الـKT'], ['batchId','معرّف الدفعة'],
  ['cardStep','حالة البطاقة'], ['office','معرّف مكتب شؤون الحج'],
  ['visaGroup','رقم المجموعة (التأشيرة)'], ['hosp','مركز الضيافة'],
  ['issue','حالة إعادة الإصدار'], ['active','حالة التفعيل'],
  ['makkah','سكن مكة'], ['makkahRoom','غرفة مكة'],
  ['madinah','سكن المدينة'], ['madinahRoom','غرفة المدينة'],
  ['where','متواجد حاليًا'], ['health','الحالة الصحية']
];

const csvCell = v => {
  const s = v == null ? '' : String(v);
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
function toCsv(cols, rows) {
  return '﻿' + cols.map(c => csvCell(c[1])).join(';') + '\n' +
    rows.map(r => cols.map(c => csvCell(
      c[0] === 'g' ? (r.g === 'f' ? 'أنثى' : 'ذكر')
      : c[0] === 'cardStep' ? (CARD_FLOW[CARD_IDX(r.cardStep)] || {}).ar
      : c[0] === 'issue' ? (ISSUE_ST[r.issue] || {}).ar
      : c[0] === 'active' ? (ACT_ST[r.active] || {}).ar
      : c[0] === 'where' ? (WHERE[r.where] || {}).ar
      : c[0] === 'health' ? (HEALTH[r.health] || {}).ar
      : c[0] === 'visaGroup' ? ((vgById(r.visaGroup) || {}).no || '')
      : r[c[0]])).join(';')).join('\n');
}
/* التنزيل: المتصفّح لا يحفظ ملفًّا إلا بنقرة، فنصنع الرابط ونضغطه */
function download(name, text, mime) {
  try {
    const b = new Blob([text], { type: (mime || 'text/csv') + ';charset=utf-8' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 400);
    return true;
  } catch (e) { toast('تعذّر التنزيل في هذا المتصفّح', 'r'); return false; }
}
/* القراءة: نقبل الفاصلة والمنقوطة، ونقرأ العناوين لا المواضع */
function parseCsv(text) {
  const t = String(text).replace(/^﻿/, '').replace(/\r/g, '');
  const lines = t.split('\n').filter(x => x.trim());
  if (!lines.length) return [];
  const sep = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';
  const split = line => {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === sep && !q) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur); return out.map(x => x.trim());
  };
  const head = split(lines[0]);
  const map = {};
  XL_COLS.forEach(c => { const i = head.indexOf(c[1]); if (i >= 0) map[c[0]] = i; });
  return lines.slice(1).map(l => {
    const cells = split(l), o = {};
    Object.keys(map).forEach(k => { o[k] = cells[map[k]] || ''; });
    o.g = /أنثى|f/i.test(o.g || '') ? 'f' : 'm';
    o.ok = !!(o.permit && o.passport && o.firstEn && o.familyEn && o.dob);
    return o;
  });
}

/* ============================================================
   الشاشة: ثلاثة أبواب تحت تبويب نُسك
   ============================================================ */
function tabPilgrims() {
  const seg = S.tab.pil || 'list';
  const all = allPil();
  const arrived = all.filter(p => p.arrived).length;
  const handed = all.filter(p => p.cardStep === 'handed').length;
  const care = all.filter(p => p.health !== 'none').length;

  return '<div class="grid g4">' +
      stat({ label:'إجمالي الحجاج', n:all.length, ic:'i-users',
        sub:'عبر ' + AR(leaders().length) + ' فرق', series:[900,1100,1250,1400,1520,1600,1650,all.length] }) +
      stat({ label:'وصلوا', n:arrived, ic:'i-checkc', cls:'up',
        sub:AR(Math.round(arrived / Math.max(1, all.length) * 100)) + '٪ من الكشف',
        series:[200,420,700,900,1050,1100,1110,Math.max(1, arrived)] }) +
      stat({ label:'بطاقات سُلِّمت', n:handed, ic:'i-idcard',
        sub:'من إجمالي البطاقات', series:[100,300,600,800,950,1000,1040,Math.max(1, handed)] }) +
      stat({ label:'حالات تحتاج رعاية', n:care, ic:'i-flag', cls:care ? 'down' : 'up',
        sub:'صحّية أو كرسي متحرّك', series:[60,80,95,105,112,118,119,Math.max(1, care)] }) +
    '</div>' +

    '<div class="card">' +
      head('بيانات الحجاج', 'السجلّ الأصل — منه يقرأ التطبيق، وإليه تُضاف الاكسترا كوتا',
        '<span class="fl" style="gap:8px">' +
          (quotaPending() ? '<span class="qbadge">' + icon('i-warn','s13') +
            AR(quotaPending()) + ' دفعة تنتظر موافقتك</span>' : '') +
          '<button class="btn l sm" data-a="pxlall">' + icon('i-doc','s14') + 'تصدير إكسل</button>' +
        '</span>', 'i-idcard') +
      '<div class="tools">' + segmented('pil', [
        ['list','الحجاج'], ['groups','المجموعات'],
        ['quota','الاكسترا كوتا' + (quotaPending() ? ' · ' + AR(quotaPending()) : '')]
      ], seg) + '</div>' +
    '</div>' +
    (seg === 'groups' ? pilGroups() : seg === 'quota' ? pilQuota() : pilList());
}

/* ══════ ١) جدول الحجاج — بأعمدة التأشيرة كما هي ══════ */
function pilList() {
  const K = 'pdt';
  const q = qOf(K);
  let list = allPil();
  const total = list.length;
  const g = k => fOf(K, k);
  if (g('kt'))    list = list.filter(p => p.kt === g('kt'));
  if (g('card'))  list = list.filter(p => p.cardStep === g('card'));
  if (g('act'))   list = list.filter(p => p.active === g('act'));
  if (g('issue')) list = list.filter(p => p.issue === g('issue'));
  if (g('where')) list = list.filter(p => p.where === g('where'));
  if (g('health'))list = list.filter(p => p.health === g('health'));
  if (g('vg'))    list = list.filter(p => p.visaGroup === g('vg'));
  if (q) list = list.filter(p => (p.name + ' ' + p.no + ' ' + p.passport + ' ' + p.permit +
    ' ' + p.firstEn + ' ' + p.familyEn + ' ' + p.pkg).indexOf(q) >= 0);

  return '<div class="card">' +
    head('السجلّ الكامل', 'كل عمودٍ هنا يقابل عمودًا في كشف التأشيرة',
      pill(AR(list.length) + ' من ' + AR(total), 'gold'), 'i-list') +
    filterBar(K, [
      { k:'kt',     label:'الـKT',     opts:optKT() },
      { k:'vg',     label:'المجموعة',  opts:(S.groupsV || []).map(v => [v.id, v.no]) },
      { k:'card',   label:'حالة البطاقة', opts:CARD_FLOW.map(c => [c.k, c.ar]) },
      { k:'issue',  label:'الإصدار',   opts:Object.keys(ISSUE_ST).map(k => [k, ISSUE_ST[k].ar]) },
      { k:'act',    label:'التفعيل',   opts:Object.keys(ACT_ST).map(k => [k, ACT_ST[k].ar]) },
      { k:'where',  label:'متواجد في', opts:Object.keys(WHERE).map(k => [k, WHERE[k].ar]) },
      { k:'health', label:'الحالة الصحية', opts:Object.keys(HEALTH).map(k => [k, HEALTH[k].ar]) }
    ], list.length, total, 'ابحث باسم أو جواز أو تصريح أو رقم باقة…') +
    (list.length ? '<div class="xtwrap">' + pilTable(list, K) + '</div>'
      : empty('لا حاجّ بهذه الفلاتر', 'امسح الفلاتر', 'i-users')) +
  '</div>';
}

function pilTable(list, key) {
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const p = Math.min(pageOf(key), pages - 1);
  const slice = list.slice(p * PAGE, p * PAGE + PAGE);
  const th = t => '<span class="xth">' + t + '</span>';
  return '<div class="xtbl">' +
    '<div class="xhead">' + [
      'الحاج','معرّف الدفعة','حالة البطاقة','مكتب شؤون الحج','الجنس',
      'المجموعة (التأشيرة)','الوصول','مركز الضيافة','إعادة الإصدار',
      'رقم الجواز','التفعيل','تاريخ الوصول','الإجراءات'
    ].map(th).join('') + '</div>' +
    slice.map(pl => {
      const vg = vgById(pl.visaGroup) || {};
      const st = CARD_FLOW[CARD_IDX(pl.cardStep)] || CARD_FLOW[0];
      const hl = HEALTH[pl.health] || HEALTH.none;
      const wh = WHERE[pl.where] || WHERE.none;
      return '<div class="xrow" data-a="pilopen2" data-id="' + pl.kt + '|' + pl.id + '">' +
        '<span class="xc nmc">' + avatar({ g:pl.g, av:pl.g === 'f' ? 'p5' : 'p2' }, 'sm') +
          '<span class="nm"><b>' + E(pl.name) + '</b>' +
          '<span>' + LTR(pl.no) + ' · ' + LTR(pl.pkg) + '</span></span>' +
          (pl.health !== 'none' ? '<span class="hdot" style="background:' + hl.c +
            '" title="' + E(hl.ar) + '"></span>' : '') + '</span>' +
        '<span class="xc num">' + LTR(pl.batchId) + '</span>' +
        '<span class="xc">' + pill(st.ar, CARD_IDX(pl.cardStep) >= 8 ? 'live'
          : CARD_IDX(pl.cardStep) >= 4 ? 'gold' : 'wait') + '</span>' +
        '<span class="xc num">' + LTR(pl.office) + '</span>' +
        '<span class="xc">' + (pl.g === 'f' ? 'أنثى' : 'ذكر') + '</span>' +
        '<span class="xc"><b class="ltr">' + E(vg.no || '') + '</b>' +
          '<span class="tiny faint">' + E(vg.name || '') + '</span></span>' +
        '<span class="xc">' + (pl.arrived ? '<b style="color:var(--live)">نعم</b>' :
          '<span class="faint">لا</span>') + '</span>' +
        '<span class="xc">' + E(pl.hosp) + '</span>' +
        '<span class="xc">' + pill((ISSUE_ST[pl.issue] || {}).ar, (ISSUE_ST[pl.issue] || {}).p) + '</span>' +
        '<span class="xc num">' + LTR(pl.passport) + '</span>' +
        '<span class="xc">' + pill((ACT_ST[pl.active] || {}).ar, (ACT_ST[pl.active] || {}).p) + '</span>' +
        '<span class="xc num">' + hijri(pl.arriveAt) + '</span>' +
        '<span class="xc act">' +
          '<button class="eyebtn" data-a="pcard" data-id="' + pl.kt + '|' + pl.id +
            '" aria-label="حالات إصدار البطاقة" title="حالات إصدار البطاقة">' +
            icon('i-eye','s15') + '</button>' +
          '<span class="wchip" style="color:' + wh.c + '" title="متواجد حاليًا">' +
            icon(wh.i,'s12') + E(wh.ar) + '</span>' +
        '</span></div>';
    }).join('') + '</div>' +
    (pages > 1 ? '<div class="pager">' +
      '<button class="pgb" data-a="pg" data-k="' + key + '" data-v="' + (p - 1) + '"' +
        (p === 0 ? ' disabled' : '') + '>' + icon('i-fwd','s14') + 'السابق</button>' +
      '<span class="pgn">' + Array.from({ length: pages }, (_, i) => i)
        .filter(i => i === 0 || i === pages - 1 || Math.abs(i - p) <= 2)
        .map((i, k2, a) => (k2 && i - a[k2 - 1] > 1 ? '<span class="pgd">…</span>' : '') +
          '<button class="pgi' + (i === p ? ' on' : '') + '" data-a="pg" data-k="' + key +
          '" data-v="' + i + '">' + AR(i + 1) + '</button>').join('') + '</span>' +
      '<button class="pgb" data-a="pg" data-k="' + key + '" data-v="' + (p + 1) + '"' +
        (p >= pages - 1 ? ' disabled' : '') + '>التالي' + icon('i-back','s14') + '</button>' +
      '<span class="pgc">' + AR(p * PAGE + 1) + '–' + AR(Math.min(list.length, (p + 1) * PAGE)) +
        ' من ' + AR(list.length) + '</span></div>' : '');
}

/* ══════ ٢) المجموعات ══════ */
function pilGroups() {
  const K = 'pvg';
  const q = qOf(K);
  let list = (S.groupsV || []).slice();
  const total = list.length;
  if (fOf(K, 'kt')) list = list.filter(v => v.kt === fOf(K, 'kt'));
  if (q) list = list.filter(v => (v.no + ' ' + v.name + ' ' + v.svcCo + ' ' + v.kt).indexOf(q) >= 0);
  return '<div class="card">' +
    head('مجموعات التأشيرة', 'انقر المجموعة لترى بياناتها كاملةً وحجّاجها',
      pill(AR(list.length) + ' مجموعة', 'gold'), 'i-flag') +
    filterBar(K, [{ k:'kt', label:'الـKT', opts:optKT() }],
      list.length, total, 'ابحث برقم المجموعة أو اسمها أو شركة الخدمة…') +
    (list.length ? '<div class="plist">' + list.map(v => {
      const n = allPil().filter(p => p.visaGroup === v.id).length;
      return '<div class="prow" data-a="vgopen" data-id="' + v.id + '">' +
        '<span class="ico" style="color:var(--gold2)">' + icon('i-flag','s18') + '</span>' +
        '<span class="nm" style="flex:1"><b class="ltr">' + E(v.no) + '</b>' +
          '<span>' + E(v.name) + ' · ' + E(v.svcCo) + '</span></span>' +
        '<span class="tcnts">' + cnt('i-users', n, 'حجاج المجموعة') + '</span>' +
        pill(LTR(v.kt), 'grey') +
        '<span class="end">' + pill(E(v.hospVisa), 'gold') + '</span></div>';
    }).join('') + '</div>' : empty('لا مجموعة', 'امسح الفلاتر', 'i-flag')) +
  '</div>';
}

/* ══════ ٣) الاكسترا كوتا ══════ */
const QT_ST = {
  pending:   { ar:'تنتظر الموافقة', p:'wait', c:'#D4A017' },
  incomplete:{ ar:'بيانات ناقصة',   p:'no',   c:'#C0392B' },
  approved:  { ar:'معتمدة',         p:'live', c:'#16A34A' },
  rejected:  { ar:'مرفوضة',         p:'grey', c:'#5A6C63' }
};

function pilQuota() {
  const K = 'pqt';
  const q = qOf(K);
  let list = (S.quota || []).slice().sort((a, b) => b.at - a.at);
  const total = list.length;
  if (fOf(K, 'st')) list = list.filter(x => x.state === fOf(K, 'st'));
  if (fOf(K, 'org')) list = list.filter(x => x.orgId === fOf(K, 'org'));
  if (q) list = list.filter(x => (x.no + ' ' + x.by + ' ' + x.kt).indexOf(q) >= 0);

  return '<div class="card gold">' +
    head('الاكسترا كوتا', 'دفعاتٌ تصل من الشركات — تُعتمد على البيانات المكتملة وحدها، ' +
      'ثم تُوزَّع على المجموعات تلقائيًّا',
      '<span class="fl" style="gap:8px">' +
        '<button class="btn l sm" data-a="qtxl">' + icon('i-doc','s14') + 'قالب إكسل</button>' +
        '<button class="btn p sm" data-a="qtnew">' + icon('i-plus','s14') + 'دفعة جديدة</button>' +
      '</span>', 'i-idcard') +
    '<div class="quote">الدفعة لا تُعتمد وفيها صفٌّ ناقص. والاعتماد يفعل ثلاثة أشياء معًا: ' +
      'يُضيف الحجّاج إلى السجلّ، ويوزّعهم على مجموعاتهم، ويُبلغ الليدر أن لديه اكسترا كوتا.</div>' +
    filterBar(K, [
      { k:'st',  label:'الحالة', opts:Object.keys(QT_ST).map(k => [k, QT_ST[k].ar]) },
      { k:'org', label:'الجهة',  opts:optOrgs() }
    ], list.length, total, 'ابحث برقم الدفعة أو اسم الجهة…') +
    (list.length ? '<div class="plist">' + list.map(x => {
      const st = QT_ST[x.state], bad = (x.rows || []).filter(r => !r.ok).length;
      return '<div class="prow" data-a="qtopen" data-id="' + x.id + '">' +
        '<span class="krail" style="background:' + st.c + '"></span>' +
        '<span class="ico" style="color:' + st.c + '">' + icon('i-idcard','s18') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(x.by) + ' — ' + AR(x.count) + ' حاجًّا</b>' +
          '<span>' + LTR(x.no) + ' · ' + LTR(x.kt) + ' · ' + ago(x.at) + '</span></span>' +
        '<span class="tcnts">' + cnt('i-users', x.count, 'عدد الحجاج') +
          (bad ? cnt('i-warn', bad, 'صفوف ناقصة', 'warn') : '') + '</span>' +
        '<span class="end">' + pill(st.ar, st.p) + '</span></div>';
    }).join('') + '</div>' : empty('لا دفعات', 'أضِف دفعةً أو ارفع قالب إكسل', 'i-idcard')) +
  '</div>';
}

/* ---------- درج الدفعة: بياناتها وصفوفها واعتمادها ---------- */
function quotaDrawer(id) {
  const x = (S.quota || []).find(v => v.id === id); if (!x) return;
  const st = QT_ST[x.state];
  const bad = (x.rows || []).filter(r => !r.ok);
  const org = orgById(x.orgId) || {};
  const L = userById(x.leaderId) || {};
  const open = x.state === 'pending' || x.state === 'incomplete';

  S.drawer = { title:'اكسترا كوتا — ' + x.by, sub:x.no + ' · ' + x.kt + ' · ' + AR(x.count) + ' حاجًّا',
    icon:'i-idcard', wide:!!S.dwide, expand:id, body:

    '<div class="card" style="--kc:' + st.c + '">' +
      head(st.ar, bad.length ? AR(bad.length) + ' صفًّا ينقصه بيان' : 'كل الصفوف مكتملة',
        pill(AR(x.count), 'gold'), 'i-idcard') +
      '<div class="grid g2" style="gap:10px">' +
        '<span><div class="tiny faint">رقم الدفعة</div><b>' + LTR(x.no) + '</b></span>' +
        '<span><div class="tiny faint">الجهة</div><b>' + E(org.ar || x.by) + '</b></span>' +
        '<span><div class="tiny faint">الـKT</div><b>' + LTR(x.kt) + '</b></span>' +
        '<span><div class="tiny faint">الليدر</div><b>' + E(L.name || '—') + '</b></span>' +
        '<span><div class="tiny faint">وردت</div><b>' + hijri(x.at) + '</b></span>' +
        '<span><div class="tiny faint">العدد</div><b class="num">' + AR(x.count) + '</b></span>' +
      '</div>' +
      (x.note ? '<div class="note r" style="margin-top:12px">' + icon('i-warn','s16') +
        '<span>' + E(x.note) + '</span></div>' : '') +
    '</div>' +

    (open ? '<div class="card gold">' +
      head('القرار', bad.length
        ? 'لا تُعتمد وفيها ' + AR(bad.length) + ' صفًّا ناقصًا — أعِدها للجهة أو أكمِلها'
        : 'البيانات مكتملة — الاعتماد يُضيفهم ويوزّعهم ويُبلغ الليدر', '', 'i-shield') +
      '<div class="grid g2" style="gap:8px">' +
        '<button class="btn p sm" data-a="qtok" data-id="' + x.id + '"' +
          (bad.length ? ' disabled' : '') + '>' + icon('i-checkc','s14') + 'اعتماد وتوزيع</button>' +
        '<button class="btn l sm" data-a="qtno" data-id="' + x.id + '">' +
          icon('i-x','s14') + 'ردّ الدفعة</button>' +
      '</div></div>' : '') +

    '<div class="card">' +
      head('الصفوف', AR((x.rows || []).length) + ' صفًّا — البيانات كما وردت',
        '<button class="btn l sm" data-a="qtdl" data-id="' + x.id + '">' +
          icon('i-doc','s14') + 'تنزيل</button>', 'i-list') +
      '<div class="xtwrap"><div class="xtbl qtbl">' +
        '<div class="xhead">' + ['التصريح الموحّد','الاسم (إنجليزي)','الاسم (عربي)',
          'الجواز','الجنسية','فئة النمط','الميلاد','الباقة الشاملة'].map(t =>
          '<span class="xth">' + t + '</span>').join('') + '</div>' +
        (x.rows || []).slice(0, 40).map(r =>
          '<div class="xrow' + (r.ok ? '' : ' bad') + '">' +
            '<span class="xc num">' + LTR(r.permit || '—') + '</span>' +
            '<span class="xc ltr">' + E([r.firstEn, r.fatherEn, r.familyEn].filter(z => z && z !== '—').join(' ')) + '</span>' +
            '<span class="xc">' + E([r.firstAr, r.fatherAr, r.familyAr].filter(z => z && z !== '—').join(' ')) + '</span>' +
            '<span class="xc num">' + LTR(r.passport || '—') + '</span>' +
            '<span class="xc">' + E(r.nationality || '—') + '</span>' +
            '<span class="xc">' + E(r.patCat || '—') + '</span>' +
            '<span class="xc num">' + LTR(r.dob || '—') + '</span>' +
            '<span class="xc num">' + LTR(r.pkg || '—') + '</span>' +
          '</div>').join('') +
      '</div></div>' +
      ((x.rows || []).length > 40 ? '<div class="tiny faint" style="margin-top:9px">' +
        'يُعرض أربعون صفًّا — ونزِّل الملف لترى البقية.</div>' : '') +
    '</div>' };
  renderDrawer();
}

/* ---------- دفعة جديدة: نموذجٌ أو رفع إكسل ---------- */
function quotaNew() {
  const d = S.qform = S.qform || { orgId:(ORGS[0] || {}).id, rows:[], mode:'xl' };
  const f = (S.files || {}).qtxl;
  const parsed = d.rows || [];
  const bad = parsed.filter(r => !r.ok).length;

  S.drawer = { title:'دفعة اكسترا كوتا جديدة', sub:'ارفع القالب المعبّأ، أو أدخِل حاجًّا واحدًا',
    icon:'i-idcard', wide:!!S.dwide, body:

    '<div class="note b">' + icon('i-info','s16') +
      '<span>القالب الذي تنزّله هو الذي ترفعه — العناوين نفسها وبالترتيب نفسه. ' +
      'وما ينقصه بيانٌ يُوسَم أحمر ولا تُعتمد الدفعة حتى يكتمل.</span></div>' +

    '<div class="card">' +
      head('الجهة', 'إلى أي جهة تُنسب هذه الدفعة؟', '', 'i-flag') +
      '<label class="fsel" style="width:100%"><span>الجهة</span>' +
        '<select data-q2="qorg">' + ORGS.map(o =>
          '<option value="' + o.id + '"' + (d.orgId === o.id ? ' selected' : '') + '>' +
          E(o.kt + ' · ' + o.ar) + '</option>').join('') + '</select>' +
        icon('i-fwd','s14') + '</label>' +
    '</div>' +

    '<div class="card">' +
      head('١ · القالب', 'نزِّله، عبّئه، ثم ارفعه',
        '<button class="btn l sm" data-a="qtxl">' + icon('i-doc','s14') + 'تنزيل القالب</button>',
        'i-doc') +
      '<div style="margin-top:11px">' +
        '<label class="fpick"><input type="file" data-xl="qtxl" accept=".csv,.txt" hidden>' +
        icon('i-clip','s16') + '<span>' + (f ? 'تغيير الملف' : 'رفع الملف المعبّأ') +
        '</span></label>' + (f ? fileChip(f) : '') + '</div>' +
      (parsed.length ? '<div class="fl" style="gap:9px;margin-top:13px;flex-wrap:wrap">' +
        pill(AR(parsed.length) + ' صفًّا قُرئ', 'live') +
        (bad ? pill(AR(bad) + ' ناقصًا', 'no') : pill('كلّها مكتملة', 'live')) +
        '</div>' : '') +
    '</div>' +

    (parsed.length ? '<div class="card">' +
      head('معاينة', 'أوّل عشرة صفوف كما قُرئت', '', 'i-eye') +
      '<div class="xtwrap"><div class="xtbl qtbl">' +
        '<div class="xhead">' + ['التصريح','الاسم (إنجليزي)','الجواز','الجنسية','الميلاد','الباقة']
          .map(t => '<span class="xth">' + t + '</span>').join('') + '</div>' +
        parsed.slice(0, 10).map(r => '<div class="xrow' + (r.ok ? '' : ' bad') + '">' +
          '<span class="xc num">' + LTR(r.permit || '—') + '</span>' +
          '<span class="xc ltr">' + E([r.firstEn, r.familyEn].filter(Boolean).join(' ')) + '</span>' +
          '<span class="xc num">' + LTR(r.passport || '—') + '</span>' +
          '<span class="xc">' + E(r.nationality || '—') + '</span>' +
          '<span class="xc num">' + LTR(r.dob || '—') + '</span>' +
          '<span class="xc num">' + LTR(r.pkg || '—') + '</span></div>').join('') +
      '</div></div></div>' : '') +

    '<div class="card">' +
      head('٢ · أو أدخِل حاجًّا واحدًا', 'بنفس حقول البطاقة', '', 'i-edit') +
      '<div class="grid g2" style="gap:0 12px">' +
        qf('qp_permit', 'رقم التصريح الموحّد') + qf('qp_pass', 'رقم الجواز') +
        qf('qp_fe', 'الاسم الأول (بالإنجليزية)') + qf('qp_fa', 'الاسم الأول (بالعربية)') +
        qf('qp_ae', 'اسم الأب (بالإنجليزية)') + qf('qp_aa', 'اسم الأب (بالعربية)') +
        qf('qp_ge', 'اسم الجد (بالإنجليزية)') + qf('qp_ga', 'اسم الجد (بالعربية)') +
        qf('qp_le', 'اسم العائلة (بالإنجليزية)') + qf('qp_la', 'اسم العائلة (بالعربية)') +
        qf('qp_nat', 'الجنسية') + qf('qp_dob', 'تاريخ الميلاد') +
      '</div>' +
      '<label class="fl2">فئة النمط</label>' +
      '<div class="chipwrap">' + PAT_CAT.map(c =>
        '<button class="chipbtn' + ((S.q.qp_cat || PAT_CAT[0]) === c ? ' on' : '') +
        '" data-a="qpcat" data-v="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>' +
      '<label class="fl2">تصنيف النمط</label>' +
      '<div class="chipwrap">' + PAT_KIND.map(c =>
        '<button class="chipbtn' + ((S.q.qp_kind || PAT_KIND[0]) === c ? ' on' : '') +
        '" data-a="qpkind" data-v="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>' +
      '<label class="fl2">الجنس</label>' +
      '<div class="chipwrap">' + [['m','ذكر'],['f','أنثى']].map(z =>
        '<button class="chipbtn' + ((S.q.qp_g || 'm') === z[0] ? ' on' : '') +
        '" data-a="qpg" data-v="' + z[0] + '">' + z[1] + '</button>').join('') + '</div>' +
      '<button class="btn l sm" style="width:100%;margin-top:13px" data-a="qprow">' +
        icon('i-plus','s14') + 'إضافة هذا الحاجّ إلى الدفعة</button>' +
    '</div>' +

    '<button class="btn p" style="width:100%" data-a="qtsave"' +
      (parsed.length ? '' : ' disabled') + '>' + icon('i-check','s16') +
      'إنشاء الدفعة (' + AR(parsed.length) + ' حاجًّا)</button>' };
  renderDrawer();
}
const qf = (k, label) => '<label class="fl2">' + E(label) + '</label>' +
  '<input class="fld" id="q-' + k + '" data-q="' + k + '" value="' + E(qOf(k)) + '">';

/* ---------- الاعتماد: يُضيف ويوزّع ويُبلغ ---------- */
function quotaApprove(x) {
  const org = orgById(x.orgId) || {};
  const L = userById(x.leaderId) || {};
  const kt = x.kt;
  S.pilgrims[kt] = S.pilgrims[kt] || [];
  const arr = S.pilgrims[kt];
  /* مجموعات التأشيرة لهذا الـKT — يُوزَّعون عليها بالتناوب */
  const vgs = (S.groupsV || []).filter(v => v.kt === kt);
  let added = 0;
  (x.rows || []).forEach((r, i) => {
    const vg = vgs[i % Math.max(1, vgs.length)] || {};
    const n = arr.length + 1;
    arr.push({
      id: 'P' + kt + '-Q' + (n), no: 'HJ-' + (79000 + arr.length),
      name: [r.firstAr, r.fatherAr, r.familyAr].filter(z => z && z !== '—').join(' ') ||
            [r.firstEn, r.familyEn].filter(Boolean).join(' '),
      g: r.g || 'm', country: r.nationality || org.country, org: org.ar || '',
      age: Math.max(18, 1447 - Number(String(r.dob).slice(0, 4) || 1970) + 578),
      permit: r.permit, pkg: r.pkg || ('PKG-' + (700000 + added * 13)),
      firstAr:r.firstAr, fatherAr:r.fatherAr, grandAr:r.grandAr, familyAr:r.familyAr,
      firstEn:r.firstEn, fatherEn:r.fatherEn, grandEn:r.grandEn, familyEn:r.familyEn,
      passport: r.passport, nationality: r.nationality || org.country,
      patCat: r.patCat || PAT_CAT[0], patKind: r.patKind || PAT_KIND[0], dob: r.dob,
      batchId: (4790000 + added) + '-01',
      office: vg.office || '—', visaGroup: vg.id || null, hosp: vg.hospVisa || HOSP[0],
      arrived: false, arriveAt: now() + 2 * DAY,
      issue: 'first', active: 'on', cardStep: 'batch',
      cardLog: [{ k:'batch', at: now() }],
      floor: 'الدور الأول', room: 100 + added,
      makkah: (HOTELS[added % HOTELS.length] || {}).ar, makkahRoom: 100 + added,
      madinah: 'دار التقوى', madinahRoom: 200 + added,
      where: 'none', health: 'none', healthLog: [],
      state: 'لم يصل', flag: null,
      extra: true, quotaId: x.id
    });
    added++;
  });
  x.state = 'approved'; x.doneAt = now();
  /* التنبيه بثلاثة بنود كما طُلب — يصل الكنترول والليدر معًا */
  S.casts = S.casts || [];
  S.casts.unshift({ id:uid('C'), dest:'control', cat:'اكسترا كوتا', at:now(),
    title:'تم إضافة اكسترا كوتا (' + AR(x.count) + ')',
    body:'تأكّد من اكتمال الوثائق · أُرسل لليدر ' + (L.name || '') +
      ': لديك اكسترا كوتا، قم بتسكين المحسنين · وُزِّع الحجّاج على ' +
      AR(vgs.length || 1) + ' مجموعة تلقائيًّا.' });
  S.casts.unshift({ id:uid('C'), dest:'muhsen', cat:'اكسترا كوتا', at:now(),
    title:'لديك اكسترا كوتا — ' + AR(x.count) + ' حاجًّا',
    body:'أُضيفوا إلى ' + kt + '. قم بتسكين المحسنين على مهامّهم.' });
  /* وتنبيهٌ على مهام الـKT القادمة، فلا يفوت الميدان */
  (S.tasks || []).filter(t => t.kt === kt && t.start > now()).slice(0, 4).forEach(t => {
    ensureTask(t);
    t.alerts = t.alerts || [];
    t.alerts.unshift({ id:uid('AL'), kind:'change', at:now(), seen:false, by:'النظام',
      text:'اكسترا كوتا: أُضيف ' + AR(x.count) + ' حاجًّا إلى المجموعة — راجع التسكين' });
    txLog(t, 'اكسترا كوتا ' + x.no + ': أُضيف ' + AR(x.count) + ' حاجًّا إلى ' + kt, 'warn');
  });
  logIt('اعتُمدت دفعة اكسترا كوتا ' + x.no + ' — ' + AR(added) + ' حاجًّا وُزِّعوا على مجموعاتهم', 'assign');
  return added;
}

/* ============================================================
   الأدراج: الحاجّ · المجموعة · حالات البطاقة
   ============================================================ */
const pilFind = key => {
  const [kt, id] = String(key).split('|');
  return ((S.pilgrims || {})[kt] || []).find(p => p.id === id) || null;
};

const kv2 = (k, v) => '<span><div class="tiny faint">' + k + '</div><b>' + v + '</b></span>';

function pilgrimFull(key) {
  const p = pilFind(key); if (!p) return;
  const kt = String(key).split('|')[0];
  const vg = vgById(p.visaGroup) || {};
  const L = leaders().find(x => x.kt === kt) || {};
  const st = CARD_FLOW[CARD_IDX(p.cardStep)] || CARD_FLOW[0];
  const hl = HEALTH[p.health] || HEALTH.none;
  const wh = WHERE[p.where] || WHERE.none;

  S.drawer = { title:p.name, sub:p.no + ' · ' + kt + ' · ' + (p.nationality || ''),
    icon:'i-user', wide:!!S.dwide, expand:key, body:

    '<div class="card" style="--kc:' + hl.c + '">' +
      '<div class="fl" style="gap:13px">' +
        avatar({ g:p.g, av:p.g === 'f' ? 'p5' : 'p2' }, 'xl') +
        '<span class="sp"><b style="font-size:16px;display:block">' + E(p.name) + '</b>' +
        '<div class="ltr tiny faint" style="margin-top:3px">' +
          E([p.firstEn, p.fatherEn, p.familyEn].filter(z => z && z !== '—').join(' ')) + '</div>' +
        '<div class="fl" style="gap:7px;margin-top:9px;flex-wrap:wrap">' +
          pill(hl.ar, hl.p) +
          '<span class="wchip" style="color:' + wh.c + '">' + icon(wh.i,'s12') + E(wh.ar) + '</span>' +
          pill((ACT_ST[p.active] || {}).ar, (ACT_ST[p.active] || {}).p) +
        '</div></span>' +
        '<button class="eyebtn big" data-a="pcard" data-id="' + key + '" ' +
          'aria-label="حالات إصدار البطاقة" title="حالات إصدار البطاقة">' +
          icon('i-eye','s18') + '</button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' + head('بيانات الحاجّ', 'كما في بطاقة نُسك', '', 'i-idcard') +
      '<div class="grid g2" style="gap:11px">' +
        kv2('رقم التصريح الموحد', LTR(p.permit || '—')) +
        kv2('رقم الباقة الشاملة', LTR(p.pkg || '—')) +
        kv2('الاسم الأول (بالإنجليزية)', '<span class="ltr">' + E(p.firstEn || '—') + '</span>') +
        kv2('الاسم الأول (بالعربية)', E(p.firstAr || '—')) +
        kv2('اسم الأب (بالإنجليزية)', '<span class="ltr">' + E(p.fatherEn || '—') + '</span>') +
        kv2('اسم الأب (بالعربية)', E(p.fatherAr || '—')) +
        kv2('اسم الجد (بالإنجليزية)', '<span class="ltr">' + E(p.grandEn || '—') + '</span>') +
        kv2('اسم الجد (بالعربية)', E(p.grandAr || '—')) +
        kv2('اسم العائلة (بالإنجليزية)', '<span class="ltr">' + E(p.familyEn || '—') + '</span>') +
        kv2('اسم العائلة (بالعربية)', E(p.familyAr || '—')) +
        kv2('رقم الجواز', LTR(p.passport || '—')) +
        kv2('الجنسية', E(p.nationality || '—')) +
        kv2('فئة النمط', E(p.patCat || '—')) +
        kv2('تصنيف النمط', E(p.patKind || '—')) +
        kv2('تاريخ الميلاد', LTR(p.dob || '—')) +
        kv2('الجنس', p.g === 'f' ? 'أنثى' : 'ذكر') +
      '</div></div>' +

    '<div class="card">' + head('السكن في الحرمين', 'مكة والمدينة', '', 'i-key') +
      '<div class="grid g2" style="gap:11px">' +
        kv2('سكن مكة المكرمة', E(p.makkah || '—')) +
        kv2('الغرفة', AR(p.makkahRoom || 0)) +
        kv2('سكن المدينة المنوّرة', E(p.madinah || '—')) +
        kv2('الغرفة', AR(p.madinahRoom || 0)) +
        kv2('مركز الضيافة', E(p.hosp || '—')) +
        kv2('متواجد حاليًا في', '<span style="color:' + wh.c + '">' + E(wh.ar) + '</span>') +
      '</div></div>' +

    '<div class="card">' + head('المجموعة', vg.no || '—',
      vg.id ? '<button class="btn l sm" data-a="vgopen" data-id="' + vg.id + '">' +
        icon('i-flag','s14') + 'بيانات المجموعة</button>' : '', 'i-flag') +
      '<div class="grid g2" style="gap:11px">' +
        kv2('رقم-اسم المجموعة (التأشيرة)', '<span class="ltr">' + E(vg.no || '—') + '</span>') +
        kv2('معرّف مكتب شؤون الحج', LTR(vg.office || '—')) +
        kv2('الـKT', LTR(kt)) +
        kv2('الليدر', E(L.name || '—')) +
      '</div></div>' +

    '<div class="card" style="--kc:' + hl.c + '">' +
      head('الحالة الصحّية', p.healthLog && p.healthLog.length
        ? 'سجلٌّ من لحظة الوصول' : 'لا سجلّ — الحالة سليمة',
        pill(hl.ar, hl.p), 'i-med') +
      '<div class="chipwrap">' + Object.keys(HEALTH).map(k =>
        '<button class="chipbtn' + (p.health === k ? ' on' : '') + '" data-a="phealth" ' +
        'data-id="' + key + '" data-v="' + k + '">' + E(HEALTH[k].ar) + '</button>').join('') + '</div>' +
      (p.healthLog && p.healthLog.length
        ? histLog(p.healthLog.map(h => ({ at:h.at, text:h.by + ' — ' + h.text, kind:'info' })))
        : '') +
      '<button class="btn l sm" style="width:100%;margin-top:11px" data-a="phnote" data-id="' + key + '">' +
        icon('i-edit','s14') + 'إضافة قيدٍ صحّي</button>' +
    '</div>' +

    '<div class="card">' + head('التذاكر المرفوعة', 'ما رفعه هذا الحاجّ', '', 'i-ticket') +
      (function () {
        const tk = (V.tickets || []).filter(k2 => k2.pilgrimId === p.id);
        return tk.length ? '<div class="plist">' + tk.map(k2 =>
          '<div class="prow" data-a="tkopen2" data-id="' + k2.id + '">' +
          '<span class="nm" style="flex:1"><b>' + E(k2.title) + '</b>' +
          '<span>' + LTR(k2.no) + ' · ' + ago(k2.at) + '</span></span>' +
          pill(k2.status, 'grey') + '</div>').join('') + '</div>'
          : '<div class="tiny faint">لم يرفع تذكرة.</div>';
      })() +
    '</div>' };
  renderDrawer();
}

/* ---------- حالات إصدار البطاقة: أيقونة العين ---------- */
function cardStates(key) {
  const p = pilFind(key); if (!p) return;
  const at = CARD_IDX(p.cardStep);
  const log = {};
  (p.cardLog || []).forEach(l => { log[l.k] = l.at; });

  S.drawer = { title:'حالات إصدار البطاقة', sub:p.name + ' · ' + LTR(p.no),
    icon:'i-idcard', wide:!!S.dwide, expand:key, body:

    '<div class="card gold">' +
      head('المحطّة الحالية', CARD_FLOW[at].ar,
        pill(AR(at + 1) + ' من ' + AR(CARD_FLOW.length), 'gold'), 'i-idcard') +
      '<div class="meter gold" style="margin-top:10px">' +
        '<i data-w="' + Math.round((at + 1) / CARD_FLOW.length * 100) + '"></i></div>' +
    '</div>' +

    '<div class="card">' +
      head('المسار', 'عشر محطّات — والمقطوعة منها بتاريخها', '', 'i-hist') +
      '<div class="cflow">' + CARD_FLOW.map((c, i) => {
        const done = i <= at;
        return '<div class="cstep' + (done ? ' on' : '') + (i === at ? ' now' : '') + '">' +
          '<span class="cdot">' + (done ? icon('i-check','s12') : '') + '</span>' +
          '<span class="cx"><b>' + E(c.ar) + '</b>' +
          '<span class="tiny faint">' + (log[c.k] ? hijri(log[c.k]) : '—') + '</span></span>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>' +

    '<div class="card">' +
      head('تحديث المحطّة', 'للكنترول أن يدفع البطاقة إلى محطّتها الصحيحة', '', 'i-shield') +
      '<div class="chipwrap">' + CARD_FLOW.map((c, i) =>
        '<button class="chipbtn' + (i === at ? ' on' : '') + '" data-a="pcstep" ' +
        'data-id="' + key + '" data-v="' + c.k + '">' + AR(i + 1) + ' · ' + E(c.ar) +
        '</button>').join('') + '</div>' +
    '</div>' +

    '<button class="btn l" data-a="pilopen2" data-id="' + key + '">' +
      icon('i-back','s16') + 'رجوع إلى بيانات الحاجّ</button>' };
  renderDrawer();
}

/* ---------- درج المجموعة ---------- */
function vgDrawer(id) {
  const v = vgById(id); if (!v) return;
  const mem = allPil().filter(p => p.visaGroup === id);
  const L = userById(v.leaderId) || {};
  const org = orgById(v.orgId) || {};

  S.drawer = { title:v.no, sub:v.name + ' · ' + v.kt, icon:'i-flag',
    wide:!!S.dwide, expand:id, body:

    '<div class="card gold">' +
      head('بيانات المجموعة', 'كما ترد في كشف التأشيرة',
        pill(AR(mem.length) + ' حاجًّا', 'gold'), 'i-flag') +
      '<div class="grid g2" style="gap:11px">' +
        kv2('شركة تقديم الخدمة', E(v.svcCo)) +
        kv2('مركز الضيافة (التأشيرة)', E(v.hospVisa)) +
        kv2('رقم-اسم المجموعة (التأشيرة)', '<span class="ltr">' + E(v.no) + '</span>' +
          '<div class="tiny faint">' + E(v.name) + '</div>') +
        kv2('مركز الضيافة (الاستعداد المسبق)', E(v.hospPre)) +
        kv2('معرّف-اسم مكتب شؤون الحج', LTR(v.office)) +
        kv2('رقم-اسم المجموعة (الاستعداد المسبق)', '<span class="ltr">' + E(v.preNo) + '</span>') +
        kv2('معرّف-اسم المنظّم التابع', E(v.orgSub)) +
        kv2('معرّف-اسم المنظّم المستقلّ', E(v.orgIndep)) +
        kv2('الجهة', E(org.ar || '—')) +
        kv2('الليدر', E(L.name || '—')) +
      '</div>' +
      '<button class="btn l sm" style="width:100%;margin-top:13px" data-a="vgxl" data-id="' + id + '">' +
        icon('i-doc','s14') + 'تصدير حجّاج المجموعة إلى إكسل</button>' +
    '</div>' +

    '<div class="card">' +
      head('حجّاج المجموعة', AR(mem.length) + ' حاجًّا', '', 'i-users') +
      (mem.length ? '<div class="plist">' + mem.slice(0, 30).map(p => {
        const hl = HEALTH[p.health] || HEALTH.none;
        const st = CARD_FLOW[CARD_IDX(p.cardStep)];
        return '<div class="prow" data-a="pilopen2" data-id="' + p.kt + '|' + p.id + '">' +
          avatar({ g:p.g, av:p.g === 'f' ? 'p5' : 'p2' }, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(p.name) + '</b>' +
          '<span>' + LTR(p.no) + ' · ' + LTR(p.passport) + ' · ' + E(p.makkah || '') + '</span></span>' +
          (p.health !== 'none' ? pill(hl.ar, hl.p) : '') +
          pill(st.ar, CARD_IDX(p.cardStep) >= 8 ? 'live' : 'wait') +
          (p.extra ? pill('اكسترا كوتا', 'gold') : '') + '</div>';
      }).join('') + '</div>' + (mem.length > 30 ? '<div class="tiny faint" style="margin-top:9px">' +
        'يُعرض ثلاثون — والبقيّة في الجدول.</div>' : '')
        : '<div class="tiny faint">لا حجّاج بعد.</div>') +
    '</div>' };
  renderDrawer();
}
