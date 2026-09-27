/* ============================================================
   السجلّاتُ الغائبة — ستٌّ كانت تُنشَأ فارغةً ولا تُبذَر قطّ

   `trips` و`buses` و`log` و`guides` و`swaps` و`casts` كانت تُعرَّف
   `[]` في `load()` ثم تُترك. فشاشةُ النقل خاليةٌ من باصٍ واحد، وسجلُّ
   النظام صفحةٌ بيضاء، وأدلّةُ التنفيذ بلا دليل — والبياناتُ موجودةٌ
   في `02-data.js` منذ البداية، لكنّ أحدًا لم يصِلْها بالحالة.

   وشاشةٌ خاليةٌ لا يكتشفها حارسٌ ولا تدقيق: تُرسَم صحيحةً، وتقول
   «لا بيانات»، فتبدو سليمةً وهي عُطل.
   ============================================================ */

/* ---------- ١) الأسطول: باصاتٌ ورحلاتٌ مجدولة ---------- */
const BUS_KIND = [
  { k:'كبيرة',  cap:49, c:'#1B6E9C' },
  { k:'متوسطة', cap:45, c:'#0B7A4B' },
  { k:'فارهة',  cap:33, c:'#8A5A1E' },
  { k:'دينة',   cap:14, c:'#6B4E9E' }
];
const TRIP_LEGS = [
  ['مطار الملك عبدالعزيز', 'فندق الحرم'],
  ['فندق الحرم', 'المسجد الحرام'],
  ['مكة المكرمة', 'مشعر منى'],
  ['مشعر منى', 'مشعر عرفة'],
  ['مشعر عرفة', 'مزدلفة'],
  ['مزدلفة', 'الجمرات'],
  ['فندق الحرم', 'مزارات مكة'],
  ['مكة المكرمة', 'المدينة المنوّرة'],
  ['فندق الحرم', 'مطار الملك عبدالعزيز']
];
const DRIVERS = ['سالم بن عايض القحطاني', 'مبارك بن راشد الدوسري',
  'عبدالله بن حمد الشمري', 'فهد بن سعيد الزهراني', 'ماجد بن علي العتيبي',
  'خالد بن ناصر الحربي', 'سعود بن مرزوق المطيري', 'بندر بن طلال الغامدي',
  'محمد بن يحيى العسيري', 'تركي بن فهد السبيعي', 'نايف بن سعد الرشيدي',
  'عايض بن مسفر الشهري'];

function seedFleet(st) {
  st.buses = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const k = BUS_KIND[i % BUS_KIND.length];
    st.buses.push({
      id: 'BS' + (301 + i),
      no: 'حافلة ' + AR(101 + i),
      plate: ['أ','ب','ح','د','ر','س'][i % 6] + ' ' +
             ['ن','ق','ل','م','ع','ط'][(i + 2) % 6] + ' ' +
             ['ك','ح','ج','ص','ف','هـ'][(i + 4) % 6] + ' ' + (3100 + i * 37),
      kind: k.k, cap: k.cap, color: k.c,
      driver: DRIVERS[i % DRIVERS.length],
      phone: '+9665' + (53200000 + i * 419),
      carrier: CARRIERS[i % CARRIERS.length],
      state: i % 13 === 5 ? 'صيانة' : 'جاهزة'
    });
  }

  /* الرحلات: يومٌ كاملٌ من الفجر إلى ما بعد العشاء، وأمسٌ وغد */
  st.trips = [];
  const d0 = new Date(Date.now()); d0.setHours(0, 0, 0, 0);
  const base = d0.getTime();
  let seq = 0;
  [-1, 0, 1].forEach(dayOff => {
    const day = base + dayOff * DAY;
    const ready = st.buses.filter(b => b.state === 'جاهزة');
    ready.forEach((b, bi) => {
      /* لكل حافلة ثلاثُ رحلاتٍ أو أربع في اليوم */
      const per = 3 + (bi + dayOff) % 2;
      for (let j = 0; j < per; j++) {
        const leg = TRIP_LEGS[(bi + j * 3) % TRIP_LEGS.length];
        const hour = 5 + j * 4 + (bi % 3);
        const at = day + hour * HR + ((bi * 7) % 4) * 15 * MIN;
        const dur = 35 + ((bi + j) % 5) * 20;
        const L = LEADERS[(bi + j) % LEADERS.length];
        const team = st.users.filter(u => u.leaderId === L.id).slice(0, 5);
        const load = Math.min(b.cap, Math.round(b.cap * (0.62 + ((bi + j) % 5) * 0.08)));
        const t = st.tasks.find(x => x.leaderId === L.id);
        seq++;
        st.trips.push({
          id: 'TR' + (5000 + seq),
          no: 'TR-' + AR(5000 + seq),
          busId: b.id, from: leg[0], to: leg[1],
          at, dur, cap: b.cap,
          driver: b.driver,
          kt: L.kt, leaderId: L.id,
          taskId: t ? t.id : null,
          riders: team.map(u => u.id).slice(0, 2 + (bi + j) % 3),
          pilgrims: load,
          done: at + dur * MIN < Date.now(),
          c: b.color
        });
      }
    });
  });
  st.trips.sort((a, b) => a.at - b.at);
}

/* ---------- ٢) أدلّة التنفيذ: البيانات كانت موجودةً بلا وصل ---------- */
function seedGuidesFrom(st) {
  st.guides = [];
  const ST = { 'معتمد':'live', 'مسودة':'draft', 'قيد المراجعة':'review' };
  /* الوسائط كائناتٌ {k,name} لا نصوصًا — كما تقرؤها الشاشة */
  const MEDIA_AR = { 'نص':'text', 'صور':'photo', 'فيديو':'video', 'PDF':'pdf' };
  GUIDE_SEED.forEach((g, i) => {
    const c = CAT[g.k] || {};
    st.guides.push({
      id: 'GD' + (700 + i),
      scope: 'hajj', target: g.k, taskId: null,
      title: 'دليل ' + (c.ar || g.k),
      ver: g.v, status: ST[g.st] || 'draft',
      media: (g.media || []).map(m => ({ k: MEDIA_AR[m] || 'text', name: m })),
      steps: Array.from({ length: g.steps }, (_, k) =>
        GUIDE_STEPS[(i * 4 + k) % GUIDE_STEPS.length]),
      by: g.by, at: Date.now() - g.ago * MIN
    });
  });
}
const GUIDE_STEPS = [
  'تأكّد من اكتمال العدد قبل التحرّك، ونادِ الغائبين بأسمائهم.',
  'وزّع المياه الباردة على كبار السنّ أوّلًا.',
  'ثبّت لوحة المجموعة على زجاج الحافلة الأمامي.',
  'صوِّر كشف الأسماء بعد التوقيع وارفعه في التطبيق.',
  'تحقّق من أساور المجموعة على المعصم قبل الدخول.',
  'أبلغ الكنترول فور اكتمال الصعود، لا بعد التحرّك.',
  'راجع المسار المعتمد ولا تتوقّف في غير نقاطه.',
  'عُدّ الحجّاج عند النزول كما عددتَهم عند الصعود.',
  'احتفظ بمسافة النظر مع آخر الصفّ ولا تسبقه.',
  'سجّل أيّ حالةٍ صحّية فورًا ولو بدت عابرة.',
  'تأكّد من إغلاق مقصورة الأمتعة قبل الانطلاق.',
  'وجّه من تاه إلى أقرب نقطة تجمّع ولا تتركه وحده.',
  'راجع بطاقة نُسك لكل حاجٍّ قبل دخول المشعر.'
];

/* ---------- ٣) البثّ: ما أُرسل فعلًا ---------- */
function seedCastsFrom(st) {
  st.casts = [];
  const dests = ['muhsen', 'hajj', 'ctl'];
  CAST_SEED.forEach((c, i) => {
    st.casts.push({
      id: 'CS' + (400 + i), no: 'BR-' + (9100 + i),
      dest: dests[i % dests.length], aud: 'all',
      to: c.to, title: c.t, body: c.b,
      kind: c.kind, seen: c.seen, of: c.of,
      at: Date.now() - c.ago * MIN
    });
  });
  /* وبثٌّ أحدثُ يذكر الأمر الواقع */
  st.casts.unshift({
    id:'CS399', no:'BR-9099', dest:'muhsen', aud:'all', to:'كل المحسنين',
    title:'تذكير بمهل المعالجة',
    body:'صار لكلّ بلاغٍ مهلةٌ من جدول التصعيد. ما لم يُعالَج في مهلته صُعِّد تلقائيًّا.',
    kind:'عادي', seen:141, of:190, at: Date.now() - 26 * MIN
  });
}

/* ---------- ٤) طلبات التبديل بين الليدرز ---------- */
const SWAP_WHY = [
  'ارتباطٌ عائليّ لا يُؤجَّل في هذا اليوم.',
  'تعارضٌ مع موعدٍ طبّيّ مثبت.',
  'أعمل شِفتين متتاليتين وأحتاج راحةً بينهما.',
  'أعرف مسار هذا التفويج أكثر من زميلي.',
  'تخصّصي أقرب لمهمّة زميلي فبادلناها.',
  'ظرفٌ طارئ في السكن يستدعي وجودي.'
];
function seedSwaps(st) {
  st.swaps = [];
  const L = st.users.filter(u => u.role === 'leader');
  const slots = ['الفترة الصباحية', 'الفترة المسائية', 'النوبة الليلية'];
  for (let i = 0; i < 11; i++) {
    const a = L[i % L.length], b = L[(i + 3) % L.length];
    if (!a || !b || a.id === b.id) continue;
    const state = i % 5 === 0 ? 'done' : i % 5 === 1 ? 'no' : 'pending';
    st.swaps.push({
      id: 'SW' + (600 + i), no: 'SW-' + (2200 + i),
      from: a.id, to: b.id,
      day: hijri(Date.now() + ((i % 4) - 1) * DAY),
      slot: slots[i % slots.length],
      why: SWAP_WHY[i % SWAP_WHY.length],
      reason: state === 'no' ? 'الفريقان في تفويجٍ واحد — التبديل يُربك الاثنين.' : '',
      state, at: Date.now() - (i * 47 + 18) * MIN
    });
  }
}

/* ---------- ٥) إغناءُ ما كان شحيحًا ---------- */
const SUP_WHY = [
  'الفوج زاد أربعين حاجًّا بعد إضافة دفعة اكسترا كوتا.',
  'محسنان في إجازةٍ مرضيّة اليوم ولم يُعوَّضا.',
  'التفويج في ذروة الحرّ ويحتاج مرافقين إضافيين.',
  'مجموعةٌ فيها ثمانية من كبار السنّ على كراسٍ متحرّكة.',
  'تأخّر وصول الحافلة أربك التوقيت فاحتجنا تنظيمًا إضافيًّا.',
  'مسار المزارات طويل ويحتاج مرشدًا ثانيًا.',
  'الفندق موزّعٌ على برجين ولا يكفيه محسنٌ واحد.'
];
function seedThicken(st) {
  /* طلباتُ الدعم: من مهامٍّ حقيقيّةٍ قادمة */
  const soon = st.tasks.filter(t => t.start > Date.now()).slice(0, 22);
  soon.forEach((t, i) => {
    if (i % 2) return;
    st.support.push({
      id: 'SP' + (3300 + i), no: 'SP-' + (3300 + i),
      taskId: t.id, by: t.leaderId,
      count: 1 + i % 4,
      why: SUP_WHY[i % SUP_WHY.length],
      at: Date.now() - (i * 31 + 12) * MIN,
      state: i % 6 === 0 ? 'done' : i % 6 === 2 ? 'no' : 'pending'
    });
  });

  /* البلاغات: تُبنى على الكتالوج فتتّسق مع آليّاته */
  const pool = st.escal || ESCAL;
  const L = st.users.filter(u => u.role === 'leader');
  const ESC_TO_INC = { 'النقل والحركة':'trans', 'السكن والمرافق':'house',
    'الإعاشة':'food', 'الصحة والمساندة':'med', 'الأمن والسلامة':'sec',
    'مفقودات':'crowd', 'طلبات':'crowd', 'الشكاوى':'crowd',
    'التطبيق':'crowd', 'أخرى':'crowd' };
  const n0 = st.signals.length;
  pool.forEach((e, i) => {
    if (i % 2) return;                      /* واحدةٌ من كلّ اثنتين */
    const ld = L[i % L.length] || {};
    const at = Date.now() - ((i * 37) % 900 + 8) * MIN;
    const closed = i % 4 === 0;
    const work = !closed && i % 3 === 0;
    const cat = ESC_TO_INC[e.cat] || 'crowd';
    const catAr = (INC_CATS.find(c => c.k === cat) || {}).ar || 'تفويج';
    st.signals.push({
      id: 'SG' + (8200 + n0 + i), no: 'SG-' + (8200 + n0 + i),
      title: e.name.split(' — ')[0],
      text: e.rule,
      cat, catAr,
      source: (e.raise || ['المحسن'])[0] === 'حاجّ' ? 'الحاجّ'
        : (e.raise || [])[0] === 'ليدر' ? 'الليدر' : 'المحسن',
      channel: i % 5 === 0 ? 'اتصال هاتفي' : 'تطبيق مُحسن',
      outside: false,
      verify: closed ? 'confirmed' : i % 7 === 3 ? 'rumor' : 'confirmed',
      wrongNote: '',
      cls: e.cat === 'طلبات' ? 'request' : e.cat === 'الشكاوى' ? 'complaint'
        : e.cat === 'التطبيق' ? 'ask' : 'notice',
      risk: e.risk,
      rule: e.risk === 'high' ? 'caseNew' : e.sla === 0 ? 'notify' : 'journey',
      owner: (work || closed) ? ld.id : null,
      followed: closed, confirm: closed,
      state: closed ? 'closed' : work ? 'working' : 'open',
      kt: ld.kt || '—',
      hotel: HOTELS[i % HOTELS.length].ar,
      at, resp: 6 + (i * 5) % 40,
      closedAt: closed ? at + (6 + (i * 5) % 40) * MIN : null,
      trail: [{ at, by:'النظام', text:'وصل البلاغ عبر ' +
        (i % 5 === 0 ? 'اتصال هاتفي' : 'تطبيق مُحسن') + ' — ' + e.cat + ' ← ' + e.sub }]
    });
  });
}

/* ---------- ٦) سجلُّ النظام: يُشتقّ من الوقائع لا يُختلق ---------- */
function seedLog(st) {
  const L = [];
  const put = (at, text, kind) => L.push({ id:'G' + L.length, at, text,
    kind: kind || 'info', by:'الكنترول' });

  (st.tasks || []).filter(t => t.status === 'done').slice(0, 40).forEach(t =>
    put(t.start + 90 * MIN, 'أُغلقت مهمّة ' + t.title + ' — ' + t.kt, 'task'));
  (st.tasks || []).filter(t => t.status !== 'done').slice(0, 30).forEach(t =>
    put(t.start - 40 * MIN, 'سُكِّن ' + AR((t.assigned || []).length) +
      ' محسنًا على ' + t.title, 'assign'));
  (st.signals || []).slice(0, 30).forEach(s =>
    put(s.at, 'بلاغ ' + s.no + ': ' + s.title + ' — ' + (s.kt || ''), 'info'));
  (st.warns || []).slice(0, 25).forEach(w => {
    const u = (st.users || []).find(x => x.id === w.userId) || {};
    put(w.at, 'إنذار ' + (WARN_KIND[w.kind] || {}).ar + ' على ' + (u.name || ''), 'warn');
  });
  (st.ctrs || []).forEach(c =>
    put(c.at, 'سُجّل عقد نقل ' + c.no + ' — ' + c.carrier, 'info'));
  (st.swaps || []).forEach(w => {
    const a = (st.users || []).find(x => x.id === w.from) || {};
    put(w.at, 'طلبُ تبديل ' + w.no + ' من ' + (a.name || ''), 'assign');
  });
  (st.casts || []).forEach(c =>
    put(c.at, 'بُثّت «' + c.title + '» إلى ' + c.to, 'cast'));
  (st.guides || []).forEach(g =>
    put(g.at, (g.status === 'live' ? 'اعتُمدت النسخة ' + AR(g.ver) + ' من ' : 'حُفظت مسودّة ') +
      g.title, 'guide'));
  (st.support || []).slice(0, 20).forEach(s =>
    put(s.at, 'طلبُ دعم ' + s.no + ' — ' + AR(s.count) + ' محسنًا', 'assign'));
  (st.tickets || []).forEach(k =>
    put(k.at, 'تذكرة ' + k.no + ': ' + k.title, 'ticket'));
  (st.trips || []).filter(t => t.done).slice(0, 35).forEach(t =>
    put(t.at + t.dur * MIN, 'انتهت رحلة ' + t.no + ' — ' + t.from + ' ← ' + t.to, 'info'));
  (st.quota || []).forEach(q =>
    put(q.at || Date.now() - 3 * DAY, 'دفعةُ اكسترا كوتا ' + (q.no || '') + ' وصلت', 'info'));

  put(Date.now() - 6 * MIN, 'حُدِّث كتالوج البلاغات — ' +
    AR((st.escal || []).length) + ' آليّةَ تصعيد', 'info');
  put(Date.now() - 3 * MIN, 'بدأت نوبةُ الغرفة — ' +
    AR((st.users || []).filter(u => u.role === 'muhsen').length) + ' محسنًا في الميدان', 'info');

  st.log = L.sort((a, b) => b.at - a.at).slice(0, 300);
}


/* ---------- ٧) التذاكر والتقارير: من شجرتَي الكتالوج ---------- */
const TKT_BODY = {
  'صيانة': 'المكيّف في الغرفة لا يبرّد منذ الأمس، والغرفة فيها ثلاثةٌ من كبار السنّ.',
  'نظافة': 'لم تُنظَّف الغرفة منذ يومين، ولم تُبدَّل المناشف.',
  'مستلزمات': 'نقصٌ في البطانيات — أربعةٌ في الغرفة وبطانيتان فقط.',
  'حالة صحية': 'ارتفاعٌ في السكّر عند والدتي وتحتاج مراجعةً عاجلة.',
  'متابعة صحية': 'أحتاج متابعةً يوميّةً لضغط الدم، ودوائي قارب على النفاد.',
  'مساعدة خاصة': 'أحتاج كرسيًّا متحرّكًا للتنقّل داخل الحرم.',
  'شخص تائه': 'انفصل والدي عن المجموعة عند باب الملك فهد قبل ساعة.',
  'أمتعة وأغراض شخصية': 'حقيبتي لم تصل مع الفوج من المطار.',
  'وثائق وجوازات': 'لم يُعَد إليّ جوازي بعد إنهاء إجراءات الوصول.',
  'بطاقة نسك': 'بطاقة نُسك لا تقرأ عند البوّابة ويُمنع دخولي.',
  'تأخير': 'ننتظر الحافلة منذ أربعين دقيقةً في ساحة الفندق.',
  'عطل حافلة': 'توقّفت الحافلة في الطريق ولم يصل البديل.',
  'وقت الوجبات': 'وجبة العشاء تأخّرت ساعتين عن موعدها.',
  'كمية الوجبات': 'الوجبات نقصت عن عدد المجموعة بستّ وجبات.',
  'جودة وسلامة الغذاء': 'طعم الوجبة غير مستساغ ورائحتها متغيّرة.',
  'تعديل بيانات': 'رقم غرفتي في التطبيق غير رقمها الحقيقي.',
  'عرض الجدول الرحله': 'جدول الرحلات لا يظهر عندي في التطبيق.',
  'شكوى تعامل': 'تعاملٌ غير لائق من أحد العاملين عند بوّابة الفندق.',
  'شكوى خدمة': 'طلبتُ الخدمة ثلاث مرّاتٍ ولم يستجب أحد.'
};
function seedTicketsMore(st) {
  const pairs = [];
  TKT_TREE.forEach(t => t.subs.forEach(s2 => pairs.push([t.cat, s2])));
  const PRI = ['عاجلة', 'متوسطة', 'عادية'];
  const kts = Object.keys(st.pilgrims || {});
  const n0 = st.tickets.length;
  pairs.forEach((p, i) => {
    const kt = kts[i % Math.max(1, kts.length)];
    const pool = (st.pilgrims[kt] || []);
    const pl = pool[(i * 7) % Math.max(1, pool.length)];
    const L = st.users.find(u => u.role === 'leader' && u.kt === kt) ||
              st.users.find(u => u.role === 'leader') || {};
    if (!pl) return;
    const at = Date.now() - ((i * 53) % 1400 + 9) * MIN;
    st.tickets.push({
      id: 'K' + (4300 + n0 + i), no: 'TK-' + (4300 + n0 + i),
      title: p[1] + ' — ' + p[0],
      body: TKT_BODY[p[1]] || ('بلاغٌ من الحاجّ بخصوص ' + p[1] + '.'),
      cat: p[0], sub: p[1],
      pri: PRI[i % PRI.length],
      kt, leaderId: L.id, from: pl.name, pilgrimId: pl.id,
      at,
      status: i % 5 === 0 ? 'مغلقة' : i % 3 === 0 ? 'قيد المعالجة' : 'مفتوحة'
    });
  });
}

const REP_BODY = {
  'تأخير': 'الحافلة لم تصل إلى نقطة الانطلاق بعد صرفها من المستودع بأربعين دقيقة.',
  'تنظيم الحركة والمسارات': 'لوحة المجموعة على الحافلة لا تطابق كشف الحركة.',
  'أعطال الحافلات': 'عطلٌ في مكيّف الحافلة والحجّاج بداخلها.',
  'نظافة': 'الحافلة لم تُنظَّف قبل صعود الحجّاج.',
  'صيانة': 'تسريبُ ماءٍ في دورة مياه الدور الثالث.',
  'تسكين': 'مجموعةٌ وصلت ولا غرف جاهزةً لها.',
  'مستلزمات': 'نقصٌ في مستلزمات السكن لثلاث غرف.',
  'حالة صحية': 'حاجٌّ أصيب بإجهادٍ حراريٍّ في ساحة المشعر.',
  'متابعة صحية': 'حاجّةٌ تحتاج متابعةً يوميّةً ولم تُسجَّل في الكشف.',
  'وفاة': 'حالةُ وفاةٍ في الفندق — أُبلغت الجهات المختصّة.',
  'شخص تائه': 'حاجٌّ انفصل عن الفوج عند الجمرات.',
  'أمتعة': 'حقيبةُ حاجٍّ لم تصل مع الفوج.',
  'وثائق بطاقة نسك': 'بطاقة نُسك مفقودةٌ لحاجٍّ في المجموعة.',
  'بطاقة نسك': 'بطاقة نُسك تالفةٌ ولا تُقرأ في البوّابة.',
  'وقت الوجبات': 'وجبةُ الغداء تأخّرت عن موعدها المعتمد.',
  'كميه الوجبات': 'الوجبات نقصت عن عدد الفوج.',
  'جودة وسلامة الغذاء': 'شكوى من طعم وجبةٍ — وُثّقت وأُوقفت.',
  'تعديل مواعيد المهام': 'طلبُ تقديم موعد التفويج ساعةً واحدة.',
  'استفسارات': 'استفسارٌ عن مسار المزارات المعتمد.',
  'معلومات': 'طلبُ تزويدٍ بكشف أسماء المجموعة محدَّثًا.',
  'تغيير': 'طلبُ تغيير موعد مهمّةٍ لتعارضها مع التفويج.',
  'بالنيابه عن حاج': 'شكوى مرفوعةٌ بالنيابة عن حاجٍّ لا يُحسن الكتابة.',
  'بلاغ أمني': 'تجمّعٌ غير منظّم عند مخرج الفندق.',
  'عطل': 'التطبيق لا يفتح شاشة المهامّ على جهاز المحسن.',
  'تحديث / تعديل بيانات': 'بياناتُ غرفةٍ في التطبيق غير مطابقة للواقع.',
  'استفسار': 'استفسارٌ عن كيفيّة إثبات الحضور خارج النطاق.'
};
function seedReportsMore(st) {
  const pool = st.escal || ESCAL;
  const L = st.users.filter(u => u.role === 'leader');
  const M = st.users.filter(u => u.role === 'muhsen' && !u.reserve);
  const n0 = st.reports.length;
  pool.forEach((e, i) => {
    if (i % 3 === 2) return;
    const from = (e.raise || []).indexOf('محسن') >= 0
      ? (M[(i * 5) % Math.max(1, M.length)] || {}) : (L[i % L.length] || {});
    const ld = L[i % L.length] || {};
    const at = Date.now() - ((i * 41) % 1100 + 6) * MIN;
    const closed = i % 5 === 0;
    const esc = !closed && i % 4 === 0;
    const t = st.tasks.find(x => x.leaderId === ld.id);
    st.reports.push({
      id: 'R' + (5300 + n0 + i), no: 'RP-' + (5300 + n0 + i),
      cat: e.cat, escId: e.id, escCat: e.cat, escSub: e.sub,
      risk: e.risk, sla: e.sla, escTo: e.escTo, ownerRole: e.owner,
      title: e.name.split(' — ')[0],
      body: REP_BODY[e.sub] || e.rule,
      kt: ld.kt || '—',
      from: from.id || ld.id, to: 'CONTROL',
      taskId: i % 3 === 0 && t ? t.id : null,
      at, escalated: esc, escAt: esc ? at + (e.sla || 20) * MIN : null,
      room: null, replies: [],
      status: closed ? 'مغلق' : esc ? ('مُصعّد — ' + (e.escTo || 'الكنترول'))
        : i % 3 === 0 ? 'قيد المعالجة' : 'مرسل'
    });
  });
}

/* الترتيب يهمّ: السجلّ يُشتقّ ممّا قبله، فيأتي آخرًا */
function seedMore(st) {
  seedFleet(st);
  seedGuidesFrom(st);
  seedCastsFrom(st);
  seedSwaps(st);
  seedThicken(st);
  /* الوسمُ يُعاد بعد الإغناء: ما بُذر حديثًا يحتاج آليّته أيضًا */
  escTagSignals(st);
  seedTicketsMore(st);
  seedReportsMore(st);
  seedLog(st);
}
