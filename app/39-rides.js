/* ============================================================
   الردود وتأكيد الوصول — حركةُ الكوسترات في المشاعر

   الرَّدُّ ليس مهمّة: هو صعودُ محسنٍ مع حافلةٍ من موضعٍ إلى موضع،
   يَعُدُّ الحجّاج عند الانطلاق ويؤكّد الوصول عند النزول. والمحسنُ
   يعود فيأخذ ردًّا آخر، وهكذا.

   وعددُ الردود ليس ثابتًا: ثلاثةٌ في الحركة العاديّة، وتبلغ سبعةً
   في التنقّل داخل المشاعر. فهو **رقمٌ يملكه الكنترول** لكلّ حركة،
   لا ثابتٌ في الشيفرة.

   وما يُقاس ثلاثة: متى بدأ، وكم حمل، ومتى وصل — ومع البداية
   والوصول تُلتقط إحداثيّةُ الجهاز. فالوصولُ يُؤكَّد بالموقع لا
   بالقول.
   ============================================================ */

const RIDE_MAX = 7;        /* أقصى ما يبلغه الرد في المشاعر */
const RIDE_DEF = 3;        /* الطبيعيّ في الحركة الواحدة */

const RIDE_ST = {
  planned: { ar:'مجدول',   p:'grey', c:'#5A6C63', o:3 },
  running: { ar:'جارٍ',     p:'wait', c:'#D08C00', o:1 },
  done:    { ar:'وصل',      p:'live', c:'#16A34A', o:2 },
  late:    { ar:'متأخّر',   p:'no',   c:'#C0392B', o:0 }
};

/* مساراتُ المشاعر — ذهابًا وإيابًا، وهي ما يتكرّر عليه الرد */
const MOVE_LEGS = [
  { k:'mv1', from:'مكة المكرمة', to:'مشعر منى',   ar:'مكة ← منى',       mins:55 },
  { k:'mv2', from:'مشعر منى',    to:'مشعر عرفة',  ar:'منى ← عرفة',      mins:45 },
  { k:'mv3', from:'مشعر عرفة',   to:'مزدلفة',     ar:'عرفة ← مزدلفة',   mins:40 },
  { k:'mv4', from:'مزدلفة',      to:'مشعر منى',   ar:'مزدلفة ← منى',    mins:35 },
  { k:'mv5', from:'مشعر منى',    to:'جسر الجمرات',ar:'منى ← الجمرات',   mins:25 },
  { k:'mv6', from:'مشعر منى',    to:'مكة المكرمة',ar:'منى ← مكة',       mins:55 }
];

/* حالةُ الرد تُحسب ولا تُخزَّن — فالتأخّرُ يقع بمرور الوقت لا بفعلٍ */
function rideState(r) {
  if (r.endedAt) return 'done';
  if (r.startedAt) return now() > rideDue(r) ? 'late' : 'running';
  return now() > r.planAt + 15 * MIN ? 'late' : 'planned';
}
/* المهلة: من البدء زمنُ المسار ونصفُه احتياطًا — وعندها يُصعَّد */
const rideDue = r => (r.startedAt || r.planAt) + Math.round((r.mins || 40) * 1.5) * MIN;
const rideDur = r => (r.startedAt && r.endedAt) ? r.endedAt - r.startedAt : null;

const ridesOf  = uid2 => (V.rides || []).filter(r => r.userId === uid2)
  .sort((a, b) => a.seq - b.seq);
const rideOpen = () => (V.rides || []).filter(r => !r.endedAt);
const rideLate = () => (V.rides || []).filter(r => rideState(r) === 'late');
const rideDone = () => (V.rides || []).filter(r => r.endedAt);
const ridePax  = () => rideDone().reduce((a, r) => a + (r.pax || 0), 0);

/* الحركاتُ المعلنة: لكلٍّ عددُ ردودها وموعدُها ومن أُسند إليها */
const moveById = id => (S.moves || []).find(m => m.id === id);
const moveRides = id => (V.rides || []).filter(r => r.moveId === id);

/* ---------- التوليد: حركةٌ × محسنون × عددُ الردود ---------- */
function moveGenerate(m) {
  if (!m) return 0;
  S.rides = (S.rides || []).filter(r => r.moveId !== m.id || r.startedAt);
  let n = 0;
  (m.crew || []).forEach((uid2, ui) => {
    for (let i = 0; i < m.rounds; i++) {
      if ((S.rides || []).some(r => r.moveId === m.id && r.userId === uid2 && r.seq === i + 1)) continue;
      const leg = MOVE_LEGS.find(l => l.k === m.leg) || MOVE_LEGS[0];
      S.rides.push({
        id: uid('RD'), no: 'RD-' + (4100 + (S.rides || []).length + n),
        moveId: m.id, userId: uid2, seq: i + 1,
        from: leg.from, to: leg.to, mins: leg.mins, legAr: leg.ar,
        planAt: m.at + i * Math.round(leg.mins * 2.2) * MIN + ui * 4 * MIN,
        busId: null, plate: null,
        startedAt: null, startLoc: null, pax: null, endedAt: null, endLoc: null
      });
      n++;
    }
  });
  S.rides.sort((a, b) => a.planAt - b.planAt);
  return n;
}

/* ---------- لقطةُ الموقع ---------- */
/* لا خادمَ ولا خريطةً في هذه النسخة: تُسجَّل الإحداثيّةُ ودقّتُها
   ووقتُها، ويُحسب بُعدُها عن الموضع المقصود. فالتأكيدُ يُقرأ لا يُدَّعى. */
const SITE_GEO = {
  'مكة المكرمة':  { lat:21.4225, lng:39.8262 },
  'مشعر منى':     { lat:21.4135, lng:39.8930 },
  'مشعر عرفة':    { lat:21.3550, lng:39.9840 },
  'مزدلفة':       { lat:21.3890, lng:39.9370 },
  'جسر الجمرات':  { lat:21.4210, lng:39.8730 }
};
function geoDist(a, b) {
  if (!a || !b) return null;
  const R = 6371000, t = x => x * Math.PI / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
const distTxt = m2 => m2 == null ? '—'
  : m2 < 1000 ? AR(m2) + ' م' : AR((m2 / 1000).toFixed(1)) + ' كم';
const locTxt = l => !l ? '—'
  : LTR(l.lat.toFixed(4) + ', ' + l.lng.toFixed(4));

/* ---------- الشاشة ---------- */
function screenArrive() {
  const K = 'rd';
  const moves = (S.moves || []).slice().sort((a, b) => a.at - b.at);
  const all = (V.rides || []).slice();
  const f = S.tab.rdf || 'live';
  let list = all.filter(r => f === 'live' ? !r.endedAt
    : f === 'late' ? rideState(r) === 'late'
    : f === 'done' ? !!r.endedAt : true);
  const q = qOf(K);
  const fm = fOf(K, 'mv'), fu = fOf(K, 'u');
  if (fm) list = list.filter(r => r.moveId === fm);
  if (fu) list = list.filter(r => r.userId === fu);
  if (q) list = list.filter(r => {
    const u = userById(r.userId) || {};
    return (r.no + ' ' + (u.name || '') + ' ' + r.legAr).indexOf(q) >= 0;
  });
  list.sort((a, b) => (RIDE_ST[rideState(a)].o - RIDE_ST[rideState(b)].o) || a.planAt - b.planAt);

  return '<div class="grid g4">' +
      stat({ label:'ردودٌ جارية', n:(V.rides || []).filter(r => rideState(r) === 'running').length,
        ic:'i-bus', sub:'على الطريق الآن', series:[1,2,3,2,4,3,5,4] }) +
      stat({ label:'وصلت', n:rideDone().length, ic:'i-checkc', cls:'up',
        sub:'أُكّد وصولُها بالموقع', series:[0,1,2,4,5,7,8,Math.max(1, rideDone().length)] }) +
      stat({ label:'متأخّرة', n:rideLate().length, ic:'i-warn',
        cls:rideLate().length ? 'bad' : '', sub:'تجاوزت مهلة المسار',
        series:[0,0,1,0,1,2,1,Math.max(0, rideLate().length)] }) +
      stat({ label:'حجّاجٌ نُقلوا', n:ridePax(), ic:'i-users',
        sub:'مجموعُ ما حمله المؤكَّد', series:[20,60,110,180,240,300,380,Math.max(1, ridePax())] }) +
    '</div>' +

    /* ١ — الحركات: هنا يُملك عددُ الردود */
    '<div class="card">' +
      head('الحركات وعددُ الردود',
        'الرَّدُّ صعودٌ مع حافلةٍ ذهابًا — ثلاثةٌ في الحركة العاديّة وتبلغ سبعةً في المشاعر',
        '<button class="btn p sm" data-a="mvnew">' + icon('i-plus','s16') +
        'حركة جديدة</button>', 'i-bus') +
      '<div class="quote">عددُ الردود يملكه الكنترول لكلّ حركة — ولا يُولَّد الرَّدُّ ' +
        'إلا بعد إسناد المحسنين، فيصير لكلّ محسنٍ ردودُه مرقّمةً بترتيبها.</div>' +
      (moves.length ? '<div class="plist">' + moves.map(moveRow).join('') + '</div>'
        : empty('لا حركات بعد — أضِف حركةً وحدِّد عددَ ردودها', '', 'i-bus')) +
    '</div>' +

    /* ٢ — الردود: ما يجري الآن */
    '<div class="card">' +
      head('الردود وتأكيد الوصول', 'لكلّ ردٍّ بدايتُه وعددُ حجّاجه ووصولُه وموقعُه', '', 'i-target') +
      '<div class="tools">' + segmented('rdf',
        [['live','جارية'],['late','متأخّرة'],['done','وصلت'],['all','الكل']], f) + '</div>' +
      filterBar(K, [
        { k:'mv', label:'الحركة', opts:moves.map(m => [m.id, m.ar]) },
        { k:'u',  label:'المحسن', opts:[...new Set(all.map(r => r.userId))]
            .map(id => [id, (userById(id) || {}).name || id]) }
      ], list.length, all.length, 'ابحث برقم الرد أو اسم المحسن أو المسار…') +
      (list.length ? pagedList(list, K, rideRow)
        : empty('لا ردود بهذه الفلاتر', 'امسح الفلاتر', 'i-target')) +
    '</div>';
}

function moveRow(m) {
  const rs = moveRides(m.id);
  const done = rs.filter(r => r.endedAt).length;
  const leg = MOVE_LEGS.find(l => l.k === m.leg) || MOVE_LEGS[0];
  return '<div class="prow mvrow">' +
    '<span class="ico">' + icon('i-bus','s18') + '</span>' +
    '<span class="nm" style="flex:1;min-width:170px"><b>' + E(m.ar) + '</b>' +
      '<span>' + E(leg.ar) + ' · ' + hijri(m.at) + ' · ' + t12(m.at) + '</span></span>' +

    /* عدّادُ الردود — زرّان ورقمٌ، لا قائمةٌ منسدلة لرقمٍ من سبعة */
    '<span class="rdstep" title="عدد الردود لكلّ محسن">' +
      '<button class="btn l xs" data-a="mvrd" data-id="' + m.id + '" data-v="-1"' +
        (m.rounds <= 1 ? ' disabled' : '') + '>−</button>' +
      '<b class="num">' + AR(m.rounds) + '</b>' +
      '<button class="btn l xs" data-a="mvrd" data-id="' + m.id + '" data-v="1"' +
        (m.rounds >= RIDE_MAX ? ' disabled' : '') + '>+</button>' +
      '<span class="tiny faint">ردًّا</span></span>' +

    '<span class="fl" style="gap:6px">' +
      pill(AR((m.crew || []).length) + ' محسنًا', (m.crew || []).length ? 'gold' : 'grey') +
      pill(AR(rs.length) + ' ردًّا', rs.length ? 'live' : 'grey') +
      (rs.length ? pill(AR(done) + ' وصل', done === rs.length ? 'live' : 'wait') : '') +
    '</span>' +

    '<span class="end fl" style="gap:7px">' +
      '<button class="btn l sm" data-a="mvcrew" data-id="' + m.id + '">' +
        icon('i-users','s14') + 'الطاقم</button>' +
      '<button class="btn p sm" data-a="mvgen" data-id="' + m.id + '">' +
        icon('i-swap','s14') + 'توليد الردود</button>' +
    '</span></div>';
}

function rideRow(r) {
  const u = userById(r.userId) || {}, st = RIDE_ST[rideState(r)];
  const d = r.endLoc ? geoDist(r.endLoc, SITE_GEO[r.to]) : null;
  return '<div class="prow rdrow" style="--tsc:' + st.c + '" ' +
      'data-a="rdopen" data-id="' + r.id + '">' +
    '<span class="krail"></span>' +
    '<span class="ico" style="color:' + st.c + '">' + icon('i-target','s18') + '</span>' +
    '<span class="nm" style="flex:1;min-width:150px"><b>' + E(u.name || '—') +
      ' <i class="rdseq">الرَّدُّ ' + AR(r.seq) + '</i></b>' +
      '<span>' + LTR(r.no) + ' · ' + E(r.legAr) + ' · ' + t12(r.planAt) + '</span></span>' +

    '<span class="rdcells">' +
      rdCell('البداية', r.startedAt ? t12(r.startedAt) : '—') +
      rdCell('الحجّاج', r.pax == null ? '—' : AR(r.pax)) +
      rdCell('الوصول', r.endedAt ? t12(r.endedAt) : '—') +
      rdCell('المدّة', rideDur(r) ? durTxt(rideDur(r)) : '—') +
      rdCell('بُعد التأكيد', d == null ? '—' : distTxt(d)) +
    '</span>' +

    '<span class="end fl" style="gap:7px">' +
      (r.endedAt ? '' : cdown(rideDue(r), { sla:Math.round((r.mins || 40) * 1.5),
        ttl:'حتى يُحتسب الرَّدُّ متأخّرًا ويُصعَّد' })) +
      pill(st.ar, st.p) + '</span></div>';
}
const rdCell = (k, v) => '<span class="rdc"><i>' + E(k) + '</i><b>' + v + '</b></span>';

/* ---------- درج الرد ---------- */
function rideDrawer(id) {
  const r = (S.rides || []).find(x => x.id === id); if (!r) return;
  const u = userById(r.userId) || {}, st = RIDE_ST[rideState(r)];
  const dS = r.startLoc ? geoDist(r.startLoc, SITE_GEO[r.from]) : null;
  const dE = r.endLoc ? geoDist(r.endLoc, SITE_GEO[r.to]) : null;
  const row = (k, v) => '<div class="kv"><span class="k">' + E(k) + '</span><b>' + v + '</b></div>';
  S.drawer = { title:'الرَّدُّ ' + AR(r.seq) + ' — ' + (u.name || ''), sub:r.no + ' · ' + r.legAr,
    icon:'i-target', body:
    '<div class="card">' + head('الرحلة', r.legAr, pill(st.ar, st.p), 'i-bus') +
      row('المسار', E(r.from) + ' ← ' + E(r.to)) +
      row('الموعد المخطّط', hijri(r.planAt) + ' · ' + t12(r.planAt)) +
      row('زمن المسار التقديري', AR(r.mins) + ' د') +
      (r.endedAt ? '' : '<div class="kv"><span class="k">حتى احتساب التأخّر</span><b>' +
        cdown(rideDue(r), { sla:Math.round(r.mins * 1.5) }) + '</b></div>') +
    '</div>' +
    '<div class="card">' + head('التنفيذ', 'ما سجّله المحسن من جهازه', '', 'i-checkc') +
      row('بدء الرد', r.startedAt ? hijri(r.startedAt) + ' · ' + t12(r.startedAt) : '—') +
      row('عدد الحجّاج', r.pax == null ? '—' : AR(r.pax) + ' حاجًّا') +
      row('تأكيد الوصول', r.endedAt ? hijri(r.endedAt) + ' · ' + t12(r.endedAt) : '—') +
      row('مدّة الرد', rideDur(r) ? durTxt(rideDur(r)) : '—') +
    '</div>' +
    '<div class="card">' + head('لقطتا الموقع', 'الوصولُ يُؤكَّد بالإحداثيّة لا بالقول', '', 'i-pin') +
      row('عند البدء', locTxt(r.startLoc) + (dS == null ? '' :
        ' <span class="tiny faint">· ' + distTxt(dS) + ' عن ' + E(r.from) + '</span>')) +
      row('عند الوصول', locTxt(r.endLoc) + (dE == null ? '' :
        ' <span class="tiny faint">· ' + distTxt(dE) + ' عن ' + E(r.to) + '</span>')) +
      '<div class="quote">تُلتقط الإحداثيّةُ من جهاز المحسن لحظةَ البدء ولحظةَ ' +
        'الوصول — فإن بَعُدت عن الموضع المقصود ظهر البُعدُ هنا ولم يُطمس.</div>' +
    '</div>' };
  renderDrawer();
}

/* ---------- طاقمُ الحركة ---------- */
function moveCrewDrawer(id) {
  const m = moveById(id); if (!m) return;
  /* محسنو النقل وحدهم — من يدير الحركة لا يبحث في ثلاثمئة اسم */
  const cands = S.users.filter(u => u.role === 'muhsen' && /نقل|حركة/.test(u.specialty || ''));
  const pool = cands.length ? cands : S.users.filter(u => u.role === 'muhsen').slice(0, 40);
  S.drawer = { title:'طاقم الحركة', sub:m.ar, icon:'i-users', body:
    '<div class="card">' + head('من يصعد مع الحافلات', 'محسنو النقل وحدهم',
      pill(AR((m.crew || []).length) + ' مختار', 'gold'), 'i-users') +
    '<div class="plist">' + pool.map(u => {
      const on = (m.crew || []).indexOf(u.id) >= 0;
      return '<button class="prow' + (on ? ' on' : '') + '" data-a="mvpick" ' +
        'data-id="' + m.id + '" data-v="' + u.id + '">' + avatar(u, 'sm') +
        '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
        '<span>' + LTR(u.code) + ' · ' + E(u.specialty || '') + '</span></span>' +
        (on ? icon('i-checkc','s16') : icon('i-plus','s16')) + '</button>';
    }).join('') + '</div>' +
    '<div class="quote">بعد الاختيار اضغط «توليد الردود» — فيُنشأ لكلّ محسنٍ ' +
      AR(m.rounds) + ' ردًّا مرقّمةً بترتيبها.</div></div>' };
  renderDrawer();
}

/* ---------- حركةٌ جديدة ---------- */
function moveNew() {
  const leg = MOVE_LEGS[(S.moves || []).length % MOVE_LEGS.length];
  const m = {
    id: uid('MV'), ar: leg.ar, leg: leg.k, rounds: RIDE_DEF,
    at: now() + 2 * HR, crew: [], at0: now()
  };
  S.moves = (S.moves || []).concat([m]);
  logIt('أُضيفت حركة «' + m.ar + '» بـ' + AR(m.rounds) + ' ردود');
  toast('أُضيفت الحركة — حدِّد عددَ ردودها وطاقمها');
  save(); render();
}
