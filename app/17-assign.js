/* ============================================================
   التسكين التراتبي — ثلاث خطوات لا لوحة واحدة
     ١) المشرفون على الفنادق — مشرف واحد لكل فندق لا أكثر
     ٢) الليدرز على المجموعات — لكل مجموعة جهةٌ وسكنٌ وليدر
     ٣) المحسنون على الليدرز — خمسة لكل مجموعة
   ============================================================ */

const ASG_STEPS = [
  { k:'sup',  ar:'المشرفون على الفنادق', i:'i-key',   d:'مشرف واحد لكل فندق' },
  { k:'lead', ar:'الليدرز على المجموعات', i:'i-star',  d:'ليدر يقود مجموعتين لا ثلاثًا' },
  { k:'muh',  ar:'المحسنون على الليدرز',  i:'i-users', d:'خمسة لكل مجموعة — ولا يُثنّى محسن' }
];

function screenAssign() {
  const step = S.tab.asg || 'sup';
  const done = {
    sup:  HOTELS.filter(h => supOfHotel(h.id)).length,
    lead: S.groups.length,
    muh:  S.groups.filter(g => g.members.length === 5).length
  };
  const need = { sup: HOTELS.length, lead: S.groups.length || 1, muh: S.groups.length || 1 };

  return '<div class="asgsteps">' + ASG_STEPS.map((s, i) => {
    const pct = Math.round(done[s.k] / Math.max(1, need[s.k]) * 100);
    return '<button class="astep' + (s.k === step ? ' on' : '') + '" ' +
      'data-a="seg" data-k="asg" data-v="' + s.k + '">' +
      '<span class="an">' + AR(i + 1) + '</span>' +
      '<span class="ico" style="color:var(--gold2)">' + icon(s.i, 's18') + '</span>' +
      '<span class="nm"><b>' + E(s.ar) + '</b><span>' + E(s.d) + '</span></span>' +
      '<span class="ae"><b class="num">' + AR(done[s.k]) + '/' + AR(need[s.k]) + '</b>' +
        '<span class="meter' + (pct < 100 ? ' gold' : '') + '"><i data-w="' + pct + '"></i></span>' +
      '</span></button>';
  }).join('') + '</div>' +
    (step === 'sup' ? stepSup() : step === 'lead' ? stepLead() : stepMuh());
}

const supOfHotel = hid => supervisors().find(u => u.hotelId === hid) || null;

/* ══════════════ ١) المشرفون على الفنادق ══════════════ */
function stepSup() {
  const q = qOf('asup');
  const fs2 = fOf('asup','state');
  let list = HOTELS.slice();
  if (q) list = list.filter(h => h.ar.indexOf(q) >= 0);
  if (fs2) list = list.filter(h => fs2 === 'y' ? !!supOfHotel(h.id) : !supOfHotel(h.id));
  const free = supervisors().filter(u => !u.hotelId);

  return '<div class="grid g23">' +
    '<div class="card">' +
      head('الفنادق', 'لكل فندق مشرف واحد — لا اثنان',
        pill(AR(HOTELS.filter(h => supOfHotel(h.id)).length) + ' مُسكَّن', 'gold'), 'i-key') +
      filterBar('asup', [
        { k:'state', label:'التسكين', opts:[['y','له مشرف'],['n','بلا مشرف']] }
      ], list.length, HOTELS.length, 'ابحث باسم فندق…') +
      '<div class="plist">' + list.map(h => {
        const sv = supOfHotel(h.id);
        const gs = S.groups.filter(g => g.hotelId === h.id);
        return '<div class="prow" style="flex-wrap:wrap">' +
          '<span class="krail" style="background:' + (sv ? 'var(--live)' : 'var(--amber)') + '"></span>' +
          '<span class="ico">' + icon('i-key','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(h.ar) + '</b>' +
          '<span>' + E(h.city) + ' · ' + E(h.dist) + ' · ' + AR(h.rooms) + ' غرفة</span></span>' +
          pill(AR(gs.length) + ' مجموعة', gs.length ? 'live' : 'grey') +
          '<div style="width:100%;margin-top:10px">' +
            (sv
              ? '<div class="fl" style="gap:10px;flex-wrap:wrap">' + avatar(sv, 'sm') +
                '<span class="nm" style="flex:1"><b>' + E(sv.name) + '</b>' +
                '<span>' + LTR(sv.code) + ' · مشرف سكن</span></span>' +
                '<button class="btn l sm" data-a="supswap" data-id="' + h.id + '">تغيير</button>' +
                '<button class="btn d sm" data-a="suprm" data-id="' + h.id + '">إزالة</button></div>'
              : '<div class="fl" style="gap:10px">' +
                '<span class="mchip">' + icon('i-warn','s14') + 'بلا مشرف</span>' +
                '<button class="btn p sm" data-a="supswap" data-id="' + h.id + '">تسكين مشرف</button></div>') +
          '</div></div>';
      }).join('') + '</div>' +
    '</div>' +

    '<div class="card gold">' +
      head('مشرفون بلا فندق', free.length ? 'متاحون للتسكين' : 'كلّهم مسكَّنون',
        pill(AR(free.length), free.length ? 'live' : 'grey'), 'i-shield') +
      (free.length ? '<div class="plist">' + free.map(u =>
        '<div class="prow">' + avatar(u, 'sm') +
        '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
        '<span>' + LTR(u.code) + ' · ' + AR(u.age || 34) + ' سنة</span></span>' +
        pill('حرّ', 'live') + '</div>').join('') + '</div>'
        : empty('لا مشرف حرّ', 'أزِل مشرفًا من فندقه ليعود إلى هنا', 'i-checkc')) +
    '</div></div>';
}

/* ══════════════ ٢) الليدرز على المجموعات ══════════════ */
function stepLead() {
  const q = qOf('alead');
  const fo = fOf('alead','org'), fh = fOf('alead','hotel'), ft = fOf('alead','type');
  let gs = S.groups.slice();
  if (fo) gs = gs.filter(g => g.orgId === fo);
  if (fh) gs = gs.filter(g => g.hotelId === fh);
  if (ft) gs = gs.filter(g => (orgById(g.orgId) || {}).type === ft);
  if (q) gs = gs.filter(g => (g.no + ' ' + (userById(g.leaderId) || {}).name +
    ' ' + (orgById(g.orgId) || {}).kt).indexOf(q) >= 0);
  const freeL = leaders().filter(l => groupsOf(l.id).length < 2);

  return '<div class="grid g23">' +
    '<div class="card">' +
      head('المجموعات وليدرزها', 'الليدر يقود مجموعتين لا ثلاثًا',
        pill(AR(gs.length) + ' من ' + AR(S.groups.length), 'gold'), 'i-star') +
      filterBar('alead', [
        { k:'org',   label:'الجهة', opts:optOrgs() },
        { k:'type',  label:'النوع', opts:optTypes() },
        { k:'hotel', label:'السكن', opts:optHotels() }
      ], gs.length, S.groups.length, 'ابحث برقم مجموعة أو ليدر أو KT…') +
      '<div class="plist">' + (gs.length ? gs.map(g => {
        const L = userById(g.leaderId) || {}, o = orgById(g.orgId) || {};
        const h = hotelById(g.hotelId), sv = g.supervisorId ? userById(g.supervisorId) : null;
        const n = groupsOf(g.leaderId).length;
        return '<div class="prow" style="flex-wrap:wrap">' +
          '<span class="krail" style="background:' +
            (o.type === 'بعثة' ? 'var(--blue)' : 'var(--gold)') + '"></span>' +
          avatar(L, 'sm') +
          '<span class="nm" style="flex:1"><b>' + LTR(g.no) + ' · ' + E(L.name || '—') + '</b>' +
          '<span>' + E(o.kt || '') + ' · ' + E(o.ar || '') + ' · ' + E(h.ar || 'بلا سكن') + '</span></span>' +
          pill(E(o.type || '—'), o.type === 'بعثة' ? 'blue' : 'gold') +
          pill(AR(g.members.length + 1) + '/٦', g.members.length === 5 ? 'live' : 'wait') +
          (n > 1 ? pill('يقود ' + AR(n), 'wait') : '') +
          '<div class="pfoot" style="width:100%">' +
            '<span class="ok">' + (sv ? 'المشرف ' + E(sv.name) : 'بلا مشرف — سكِّن مشرف الفندق أوّلًا') + '</span>' +
            '<span class="fl" style="gap:7px">' +
              '<button class="btn l sm" data-a="gleadswap" data-id="' + g.id + '">تغيير الليدر</button>' +
              '<button class="btn l sm" data-a="ghotel" data-id="' + g.id + '">تغيير السكن</button>' +
            '</span></div></div>';
      }).join('') : empty('لا مجموعة تطابق', 'وسّع الفلاتر', 'i-search')) + '</div>' +
    '</div>' +

    '<div class="card gold">' +
      head('ليدرز يقبلون مجموعة', AR(freeL.length) + ' ليدرًا',
        '<button class="btn p sm" data-a="gnew">' + icon('i-plus','s16') + 'مجموعة جديدة</button>',
        'i-star') +
      (freeL.length ? '<div class="plist">' + freeL.slice(0, 14).map(l =>
        '<div class="prow">' + avatar(l, 'sm') +
        '<span class="nm" style="flex:1"><b>' + E(l.name) + '</b>' +
        '<span>' + E(l.kt) + ' · ' + AR(l.pilgrims) + ' حاجًّا</span></span>' +
        pill(groupsOf(l.id).length ? 'يقود ١' : 'حرّ',
          groupsOf(l.id).length ? 'wait' : 'live') + '</div>').join('') + '</div>'
        : empty('كل ليدر يقود مجموعتين', 'لا مزيد', 'i-checkc')) +
    '</div></div>';
}

/* ══════════════ ٣) المحسنون على الليدرز ══════════════ */
function stepMuh() {
  const q = qOf('amuh');
  const fo = fOf('amuh','org'), fh = fOf('amuh','hotel'), fst = fOf('amuh','full');
  let gs = S.groups.slice();
  if (fo) gs = gs.filter(g => g.orgId === fo);
  if (fh) gs = gs.filter(g => g.hotelId === fh);
  if (fst) gs = gs.filter(g => fst === 'y' ? g.members.length === 5 : g.members.length < 5);
  if (q) gs = gs.filter(g => (g.no + ' ' + (userById(g.leaderId) || {}).name).indexOf(q) >= 0 ||
    g.members.some(m => ((userById(m.id) || {}).name || '').indexOf(q) >= 0));
  const free = freeMuhsens();
  const fq = qOf('afree');
  const freeList = fq ? free.filter(u => (u.name + ' ' + u.code + ' ' + u.specialty).indexOf(fq) >= 0) : free;

  return '<div class="grid g23">' +
    '<div class="card">' +
      head('المجموعات ومحسنوها', 'انقر مقعدًا فارغًا لتملأه، أو محسنًا لتُخرجه',
        pill(AR(gs.length) + ' مجموعة', 'gold'), 'i-users') +
      filterBar('amuh', [
        { k:'org',   label:'الجهة',  opts:optOrgs() },
        { k:'hotel', label:'السكن',  opts:optHotels() },
        { k:'full',  label:'الاكتمال', opts:[['y','مكتملة'],['n','ناقصة']] }
      ], gs.length, S.groups.length, 'ابحث بمجموعة أو ليدر أو محسن…') +
      (gs.length ? gs.map(g => {
        const L = userById(g.leaderId) || {}, o = orgById(g.orgId) || {};
        return '<div class="gseat">' +
          '<div class="fl" style="gap:10px;margin-bottom:11px">' + avatar(L, 'sm') +
            '<span class="nm" style="flex:1"><b>' + LTR(g.no) + ' · ' + E(L.name || '') + '</b>' +
            '<span>' + E(o.kt || '') + ' · ' + E(hotelById(g.hotelId).ar || '') + '</span></span>' +
            pill(AR(g.members.length) + '/٥', g.members.length === 5 ? 'live' : 'wait') + '</div>' +
          '<div class="seats">' + [0,1,2,3,4].map(i => {
            const m = g.members[i], u = m ? userById(m.id) : null;
            return u
              ? '<button class="seat full" data-a="mseatout" data-id="' + g.id +
                '" data-v="' + u.id + '" title="إخراجه من المجموعة">' + avatar(u, 'sm') +
                '<span class="nm"><b>' + E(u.name) + '</b>' +
                '<span>' + E(m.spec) + '</span></span>' +
                '<span class="x">' + icon('i-x','s14') + '</span></button>'
              : '<button class="seat" data-a="mseatin" data-id="' + g.id + '">' +
                '<span class="plus">' + icon('i-plus','s16') + '</span>' +
                '<span class="nm"><b>مقعد فارغ</b><span>انقر لتملأه</span></span></button>';
          }).join('') + '</div></div>';
      }).join('') : empty('لا مجموعة تطابق', 'وسّع الفلاتر', 'i-search')) +
    '</div>' +

    '<div class="card gold src">' +
      head('محسنون بلا مجموعة', 'هؤلاء وحدهم متاحون',
        pill(AR(free.length), free.length ? 'live' : 'grey'), 'i-user') +
      '<div style="margin-bottom:11px">' + search('afree', 'ابحث في المتاحين…', free.length) + '</div>' +
      (freeList.length ? freeList.slice(0, 40).map(u =>
        '<div class="pcard" style="cursor:default">' + avatar(u, 'sm') +
        '<span class="nm"><b>' + E(u.name) + '</b>' +
        '<span>' + LTR(u.code) + ' · ' + E(u.specialty) + ' · ' + AR(u.age || 28) + ' سنة</span></span>' +
        '</div>').join('') +
        (freeList.length > 40 ? '<div class="tiny faint" style="margin-top:10px">و' +
          AR(freeList.length - 40) + ' آخرين — ضيّق البحث</div>' : '')
        : empty('لا محسن متاح', 'أخرِج محسنًا من مجموعته ليعود هنا', 'i-checkc')) +
    '</div></div>';
}
