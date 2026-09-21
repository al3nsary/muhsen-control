/* ============================================================
   التشكيل: سحبٌ وإفلات · كشف تعارض · مسودّة ومعتمدة · تراجع

   المنتقي يصلح لمقعدٍ واحد. أمّا تشكيل أربع وعشرين مجموعة فيحتاج
   يدًا تسحب وتُفلت. ولذلك: المتاحون في عمود، والمقاعد في آخر،
   وما بينهما جرٌّ لا نقرتان.

   وقبل أن يستقرّ المحسن في مقعده يُسأل عنه ثلاثة أسئلة: أفي شِفت
   المجموعة هو؟ وهل تخصّصه موجودٌ فيها أصلًا؟ وهل عليه مهمّةٌ تتعارض
   مع مهامّها؟ فإن تعارض، قيل ولم يُمنع — القرار للمشغّل لا للنظام.
   ============================================================ */

/* ---------- حالة المجموعة: مسودّة حتى تُعتمد ---------- */
const GST = {
  draft:    { ar:'مسودّة',  p:'wait', c:'#D4A017', d:'تُعدَّل ولا يقرؤها التطبيق' },
  approved: { ar:'معتمدة',  p:'live', c:'#16A34A', d:'يقرؤها التطبيق ويُسنِد عليها' }
};
const gState = g => (g && g.state) || 'draft';

/* ---------- كشف التعارض ---------- */
function seatConflicts(g, u) {
  const out = [];
  if (!g || !u) return out;
  /* ١) الشِفت: مجموعةٌ شِفتها الغالب مسائي ومحسنٌ صباحيّ = لا يلتقيان */
  const mem = (g.members || []).map(m => userById(m.id)).filter(Boolean);
  const L = userById(g.leaderId);
  const pool = mem.concat(L ? [L] : []);
  if (pool.length) {
    const cnt = {};
    pool.forEach(x => { const s = shiftOf(x); cnt[s] = (cnt[s] || 0) + 1; });
    const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    if (main && shiftOf(u) !== main)
      out.push({ k:'shift', ar:'شِفتُه ' + shiftOf(u) + ' وغالب المجموعة ' + main });
  }
  /* ٢) التخصّص: تكراره يترك ثغرةً في تخصّصٍ آخر */
  const specs = (g.members || []).map(m => m.spec);
  const mine = u.specialty || SPECS[0];
  if (specs.indexOf(mine) >= 0)
    out.push({ k:'spec', ar:'تخصّص «' + mine + '» موجودٌ في المجموعة' });
  /* ٣) الوقت: مهمّةٌ عليه تتقاطع مع مهامّ هذه المجموعة */
  const his = (S.tasks || []).filter(t => (t.assigned || []).indexOf(u.id) >= 0);
  const theirs = (S.tasks || []).filter(t => t.leaderId === g.leaderId);
  const clash = his.find(a => theirs.some(b2 =>
    b2.id !== a.id && a.start < b2.end && b2.start < a.end));
  if (clash) out.push({ k:'time', ar:'عليه «' + clash.title + '» تتقاطع مع جدول المجموعة' });
  return out;
}
const conflictPill = n => n === 0 ? pill('بلا تعارض', 'live')
  : n === 1 ? pill('تعارضٌ واحد', 'wait') : pill(AR(n) + ' تعارضات', 'no');

/* ---------- التراجع: لقطةٌ قبل كل تغيير ---------- */
function snapForm(why) {
  S.undoForm = S.undoForm || [];
  S.undoForm.unshift({
    at: now(), why,
    groups: JSON.parse(JSON.stringify(S.groups || [])),
    users: (S.users || []).map(u => ({ id:u.id, groupId:u.groupId, leaderId:u.leaderId,
      kt:u.kt, spec:u.spec, reserve:u.reserve, hotelId:u.hotelId }))
  });
  if (S.undoForm.length > 12) S.undoForm.pop();
}
function undoForm() {
  const s = (S.undoForm || []).shift();
  if (!s) { toast('لا خطوة للتراجع عنها', 'r'); return false; }
  S.groups = s.groups;
  s.users.forEach(x => {
    const u = (S.users || []).find(y => y.id === x.id);
    if (u) Object.assign(u, x);
  });
  logIt('تُرووجع عن: ' + s.why, 'warn');
  toast('تُرووجع عن: ' + s.why);
  return true;
}

/* ---------- سبب مكتوب لكل إعادة إسناد ---------- */
function formLog(g, text) {
  g.log = g.log || [];
  g.log.unshift({ at: now(), by: actorLabel(), text });
  if (g.log.length > 40) g.log.pop();
}

/* ============================================================
   الخطوة الثالثة معادةً: سحبٌ وإفلات
   ============================================================ */
function stepMuh() {
  const K = 'amuh';
  const q = qOf(K);
  let gs = (S.groups || []).slice();
  const total = gs.length;
  const g2 = k => fOf(K, k);
  if (g2('org'))   gs = gs.filter(g => g.orgId === g2('org'));
  if (g2('hotel')) gs = gs.filter(g => g.hotelId === g2('hotel'));
  if (g2('full'))  gs = gs.filter(g => g2('full') === 'y' ? g.members.length === 5 : g.members.length < 5);
  if (g2('state')) gs = gs.filter(g => gState(g) === g2('state'));
  if (g2('lead'))  gs = gs.filter(g => g.leaderId === g2('lead'));
  if (g2('shift')) {
    gs = gs.filter(g => {
      const L = userById(g.leaderId);
      return L && shiftOf(L) === g2('shift');
    });
  }
  if (q) gs = gs.filter(g => (g.no + ' ' + (userById(g.leaderId) || {}).name).indexOf(q) >= 0 ||
    g.members.some(m => ((userById(m.id) || {}).name || '').indexOf(q) >= 0));

  const free = freeMuhsens();
  const res = reserveTeam();
  const fq = qOf('afree');
  const src = S.tab.asrc === 'res' ? res : free;
  const freeList = fq ? src.filter(u => (u.name + ' ' + u.code + ' ' + u.specialty).indexOf(fq) >= 0) : src;
  const undoN = (S.undoForm || []).length;
  const drafts = (S.groups || []).filter(g => gState(g) === 'draft').length;

  return '<div class="fbar" style="margin-bottom:14px">' +
      '<button class="btn l sm" data-a="funfo"' + (undoN ? '' : ' disabled') + '>' +
        icon('i-reset','s14') + 'تراجع' + (undoN ? ' (' + AR(undoN) + ')' : '') + '</button>' +
      (drafts ? '<button class="btn p sm" data-a="fapproveall">' + icon('i-checkc','s14') +
        'اعتماد ' + AR(drafts) + ' مسودّة</button>' : '') +
      '<span class="fsp"></span>' +
      '<span class="tiny faint">' + icon('i-info','s13') +
        ' اسحب محسنًا من العمود الأيسر وأفلِته في مقعدٍ فارغ — ' +
        'أو انقر المقعد لتختار من قائمة.</span>' +
    '</div>' +

    '<div class="grid g23">' +
    '<div class="card">' +
      head('المجموعات ومحسنوها', 'المسودّة تُعدَّل، والمعتمدة يقرؤها التطبيق',
        pill(AR(gs.length) + ' من ' + AR(total), 'gold'), 'i-users') +
      filterBar(K, [
        { k:'org',   label:'الجهة',    opts:optOrgs() },
        { k:'hotel', label:'السكن',    opts:optHotels() },
        { k:'lead',  label:'الليدر',   opts:optLeaders() },
        { k:'shift', label:'الشِفت',   opts:SHIFTS.map(s => [s.k, s.k]) },
        { k:'state', label:'الحالة',   opts:Object.keys(GST).map(k2 => [k2, GST[k2].ar]) },
        { k:'full',  label:'الاكتمال', opts:[['y','مكتملة'],['n','ناقصة']] }
      ], gs.length, total, 'ابحث بمجموعة أو ليدر أو محسن…') +
      (gs.length ? gs.map(g => groupSeatCard(g)).join('')
        : empty('لا مجموعة تطابق', 'وسّع الفلاتر', 'i-search')) +
    '</div>' +

    '<div class="card gold src">' +
      head('من يُسحب', S.tab.asrc === 'res' ? 'الاحتياط — مشتركٌ بين كل الفرق'
        : 'محسنون بلا مجموعة',
        pill(AR(src.length), src.length ? 'live' : 'grey'), 'i-user') +
      '<div class="tools" style="margin-bottom:11px">' + segmented('asrc',
        [['free','بلا مجموعة · ' + AR(free.length)], ['res','الاحتياط · ' + AR(res.length)]],
        S.tab.asrc || 'free') + '</div>' +
      '<div style="margin-bottom:11px">' + search('afree', 'ابحث في المتاحين…', src.length) + '</div>' +
      (freeList.length ? '<div class="dragcol">' + freeList.slice(0, 40).map(u =>
        '<div class="pcard drag" draggable="true" data-drag="' + u.id + '">' +
        '<span class="grip">' + icon('i-dots','s14') + '</span>' +
        avatar(u, 'sm') +
        '<span class="nm"><b>' + E(u.name) + '</b>' +
        '<span>' + LTR(u.code) + ' · ' + E(u.specialty) + ' · شِفت ' + E(shiftOf(u)) + '</span></span>' +
        (u.reserve ? pill('احتياط', 'gold') : '') +
        '</div>').join('') + '</div>' +
        (freeList.length > 40 ? '<div class="tiny faint" style="margin-top:10px">و' +
          AR(freeList.length - 40) + ' آخرين — ضيّق البحث</div>' : '')
        : empty('لا محسن متاح', 'أخرِج محسنًا من مجموعته ليعود هنا', 'i-checkc')) +
    '</div></div>';
}

function groupSeatCard(g) {
  const L = userById(g.leaderId) || {}, o = orgById(g.orgId) || {};
  const st = GST[gState(g)];
  const h = hotelById(g.hotelId) || {};
  const sup = (V.users || []).find(u => u.role === 'supervisor' && u.hotelId === g.hotelId);
  return '<div class="gseat' + (gState(g) === 'draft' ? ' draft' : '') + '" ' +
      'style="--gsc:' + st.c + '">' +
    '<div class="fl" style="gap:10px;margin-bottom:11px">' + avatar(L, 'sm') +
      '<span class="nm" style="flex:1"><b>' + LTR(g.no) + ' · ' + E(L.name || '') + '</b>' +
      '<span>' + E(o.kt || '') + ' · ' + E(h.ar || '') +
      (sup ? ' · المشرف ' + E(sup.name) : ' · بلا مشرف') + '</span></span>' +
      pill(AR(g.members.length) + '/٥', g.members.length === 5 ? 'live' : 'wait') +
      '<button class="chipbtn' + (gState(g) === 'approved' ? ' on' : '') + '" ' +
        'data-a="gstate" data-id="' + g.id + '">' +
        icon(gState(g) === 'approved' ? 'i-checkc' : 'i-edit','s13') + E(st.ar) + '</button>' +
      '<button class="chipbtn" data-a="glog" data-id="' + g.id + '" ' +
        'aria-label="سجلّ المجموعة" title="سجلّ المجموعة">' + icon('i-hist','s13') + '</button>' +
    '</div>' +
    '<div class="seats">' + [0, 1, 2, 3, 4].map(i => {
      const m = g.members[i], u = m ? userById(m.id) : null;
      if (u) {
        const cf = seatConflicts({ id:g.id, leaderId:g.leaderId,
          members:g.members.filter(x => x.id !== u.id) }, u);
        return '<div class="seat full' + (cf.length ? ' warn' : '') + '" ' +
          'data-drop="' + g.id + '" data-slot="' + i + '">' +
          avatar(u, 'sm') +
          '<span class="nm"><b>' + E(u.name) + '</b>' +
          '<span>' + E(m.spec) + ' · ' + E(shiftOf(u)) + '</span></span>' +
          (cf.length ? '<span class="cfl" title="' + E(cf.map(x => x.ar).join(' · ')) + '">' +
            icon('i-warn','s13') + '</span>' : '') +
          '<button class="x" data-a="mseatout" data-id="' + g.id + '" data-v="' + u.id + '" ' +
            'aria-label="إخراجه">' + icon('i-x','s14') + '</button></div>';
      }
      return '<div class="seat empty" data-drop="' + g.id + '" data-slot="' + i + '" ' +
        'data-a="mseatin" data-id="' + g.id + '">' +
        '<span class="plus">' + icon('i-plus','s16') + '</span>' +
        '<span class="nm"><b>مقعد فارغ</b><span>اسحب إليه أو انقر</span></span></div>';
    }).join('') + '</div></div>';
}

/* ---------- درج سجلّ المجموعة ---------- */
function groupLog(id) {
  const g = (S.groups || []).find(x => x.id === id); if (!g) return;
  const L = userById(g.leaderId) || {};
  S.drawer = { title:'سجلّ ' + g.no, sub:(L.name || '') + ' · ' + GST[gState(g)].ar,
    icon:'i-hist', wide:false, expand:id, body:
    '<div class="card" style="--kc:' + GST[gState(g)].c + '">' +
      head(GST[gState(g)].ar, GST[gState(g)].d,
        pill(AR(g.members.length) + '/٥', g.members.length === 5 ? 'live' : 'wait'), 'i-users') +
      '<div class="grid g2" style="gap:8px;margin-top:6px">' +
        '<button class="btn ' + (gState(g) === 'draft' ? 'p' : 'l') + ' sm" data-a="gstate" ' +
          'data-id="' + g.id + '">' + icon('i-checkc','s14') +
          (gState(g) === 'draft' ? 'اعتماد المجموعة' : 'إرجاعها مسودّة') + '</button>' +
        '<button class="btn l sm" data-a="funfo">' + icon('i-reset','s14') + 'تراجع</button>' +
      '</div></div>' +
    '<div class="card">' + head('ما جرى عليها', AR((g.log || []).length) + ' قيدًا', '', 'i-hist') +
      ((g.log || []).length
        ? histLog((g.log || []).map(x => ({ at:x.at, text:x.by + ' — ' + x.text, kind:'info' })))
        : '<div class="tiny faint">لا قيود بعد.</div>') +
    '</div>' };
  renderDrawer();
}

/* ---------- سبب مكتوب عند الإخراج ---------- */
function seatOutAsk(gid, uid_) {
  const g = (S.groups || []).find(x => x.id === gid);
  const u = userById(uid_);
  if (!g || !u) return;
  S.drawer = { title:'إخراج ' + u.name, sub:g.no + ' · السبب يُحفظ في السجلّ',
    icon:'i-out', wide:false, body:
    '<div class="note a">' + icon('i-warn','s16') +
      '<span>لا يُنقل محسنٌ من مقعده بلا سبب مكتوب — فالسجلّ هو ما يُحتكم إليه لاحقًا.</span></div>' +
    '<div class="card">' + head('السبب', 'يُقرأ في سجلّ المجموعة وسجلّ النظام') +
      '<div class="chipwrap">' + ['تعارض في الشِفت','حاجة مجموعة أخرى','طلب الليدر',
        'تكرار عدم الإنجاز','إعادة توزيع التخصّصات','بطلب المحسن'].map(r =>
        '<button class="chipbtn' + (S.q.soutr === r ? ' on' : '') + '" data-a="soutr" ' +
        'data-v="' + E(r) + '">' + E(r) + '</button>').join('') + '</div>' +
      '<label class="fl2">أو اكتب سببًا</label>' +
      '<textarea class="fld" id="q-sout" data-q="sout" rows="3" ' +
        'placeholder="لماذا يُخرَج من مجموعته؟">' + E(qOf('sout')) + '</textarea>' +
    '</div>' +
    '<div class="note b">' + icon('i-swap','s16') +
      '<span>وإن كان المقعد لا يُترك فارغًا فاستبدلْه: يقع الخروجُ والدخول ' +
      'معًا بسببٍ واحد، ويُكتب في الملفَّين من حلَّ محلَّ من.</span></div>' +
    '<button class="btn l" style="width:100%;margin-bottom:9px" data-a="gswap" ' +
      'data-id="' + gid + '" data-s="' + uid_ + '">' +
      icon('i-swap','s16') + 'استبدالُه ببديلٍ من الاحتياط</button>' +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="soutdo" data-id="' + gid + '" data-v="' + uid_ + '">' +
        icon('i-out','s16') + 'إخراجه بلا بديل</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button></div>' };
  renderDrawer();
}

/* ============================================================
   إدارة الجهات والفنادق — تُضاف وتُعدَّل، لا تُقرأ فقط

   كانت الجهات والفنادق ثوابتَ في الشيفرة. والموسم يتغيّر: تُضاف
   بعثة، ويُستبدل فندق، ويتبدّل عدد الغرف. فصارت بياناتٍ تُدار.
   ============================================================ */
function screenOrgs() {
  const seg = S.tab.og || 'orgs';
  const noSup = HOTELS.filter(h =>
    !(V.users || []).some(u => u.role === 'supervisor' && u.hotelId === h.id)).length;
  return '<div class="grid g4">' +
      stat({ label:'الجهات', n:V.orgs.length, ic:'i-flag',
        sub:AR(V.orgs.filter(o => o.type === 'بعثة').length) + ' بعثة · ' +
          AR(V.orgs.filter(o => o.type === 'شركة').length) + ' شركة',
        series:[8, 10, 12, 14, 16, 18, 20, V.orgs.length] }) +
      stat({ label:'الفنادق', n:HOTELS.length, ic:'i-key',
        sub:AR(HOTELS.reduce((a, h) => a + h.rooms, 0)) + ' غرفة',
        series:[6, 7, 8, 9, 10, 11, 12, HOTELS.length] }) +
      stat({ label:'فنادق بلا مشرف', n:noSup, ic:'i-warn',
        cls:noSup ? 'down' : 'up', sub:'لا أحد مسؤول عن سكنها',
        series:[3, 3, 2, 2, 1, 1, 1, Math.max(1, noSup)] }) +
      stat({ label:'حجاج الجهات', n:V.orgs.reduce((a, o) => a + o.pilgrims, 0), ic:'i-users',
        sub:'حسب كشوف التأشيرات', series:[900, 1100, 1300, 1450, 1550, 1620, 1660, 1684] }) +
    '</div>' +
    '<div class="card">' +
      head('الجهات والفنادق', 'تُضاف وتُعدَّل — ويقرؤها النظام كلّه',
        '<button class="btn p sm" data-a="' + (seg === 'orgs' ? 'orgnew' : 'hotnew') + '">' +
        icon('i-plus', 's16') + (seg === 'orgs' ? 'جهة جديدة' : 'فندق جديد') + '</button>', 'i-flag') +
      '<div class="tools">' + segmented('og',
        [['orgs', 'الجهات · ' + AR(V.orgs.length)], ['hotels', 'الفنادق · ' + AR(HOTELS.length)]],
        seg) + '</div>' +
    '</div>' +
    (seg === 'orgs' ? orgTable() : hotelTable());
}

function orgTable() {
  const K = 'org';
  const q = qOf(K);
  let list = V.orgs.slice();
  const total = list.length;
  if (fOf(K, 'type')) list = list.filter(o => o.type === fOf(K, 'type'));
  if (fOf(K, 'country')) list = list.filter(o => o.country === fOf(K, 'country'));
  if (q) list = list.filter(o => (o.kt + ' ' + o.ar + ' ' + o.name + ' ' + o.country).indexOf(q) >= 0);
  return '<div class="card">' +
    head('الجهات', 'بعثاتٌ وشركات — لكلٍّ رمزُها وحجّاجها',
      pill(AR(list.length) + ' من ' + AR(total), 'gold'), 'i-flag') +
    filterBar(K, [
      { k:'type',    label:'النوع',  opts:optTypes() },
      { k:'country', label:'الدولة', opts:[...new Set(V.orgs.map(o => o.country))].map(c => [c, c]) }
    ], list.length, total, 'ابحث برمز الجهة أو اسمها أو دولتها…') +
    (list.length ? '<div class="plist">' + list.map(o => {
      const ls = leaders().filter(L => L.orgId === o.id);
      const gs = (V.groups || []).filter(g => g.orgId === o.id);
      return '<div class="prow" data-a="orgedit" data-id="' + o.id + '">' +
        '<span class="ico" style="color:' + (o.type === 'بعثة' ? '#1B6E9C' : '#B8791A') + '">' +
          icon('i-flag', 's18') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(o.ar) + '</b>' +
          '<span>' + LTR(o.kt) + ' · ' + E(o.name) + ' · ' + E(o.country) + '</span></span>' +
        '<span class="tcnts">' + cnt('i-users', o.pilgrims, 'حجاج') +
          cnt('i-star', ls.length, 'ليدرز') + cnt('i-flag', gs.length, 'مجموعات') + '</span>' +
        pill(o.type, o.type === 'بعثة' ? 'blue' : 'gold') +
        '<span class="end">' + icon('i-edit', 's16') + '</span></div>';
    }).join('') + '</div>' : empty('لا جهة', 'امسح الفلاتر', 'i-flag')) +
  '</div>';
}

function hotelTable() {
  const K = 'hot';
  const q = qOf(K);
  let list = HOTELS.slice();
  const total = list.length;
  const has = h => (V.users || []).some(u => u.role === 'supervisor' && u.hotelId === h.id);
  if (fOf(K, 'city')) list = list.filter(h => h.city === fOf(K, 'city'));
  if (fOf(K, 'sup')) list = list.filter(h => fOf(K, 'sup') === 'y' ? has(h) : !has(h));
  if (q) list = list.filter(h => (h.ar + ' ' + h.city + ' ' + h.dist).indexOf(q) >= 0);
  return '<div class="card">' +
    head('الفنادق', 'سكن الحجّاج — ولكلٍّ مشرفٌ واحد لا أكثر',
      pill(AR(list.length) + ' من ' + AR(total), 'gold'), 'i-key') +
    filterBar(K, [
      { k:'city', label:'المدينة', opts:[...new Set(HOTELS.map(h => h.city))].map(c => [c, c]) },
      { k:'sup',  label:'المشرف',  opts:[['y', 'له مشرف'], ['n', 'بلا مشرف']] }
    ], list.length, total, 'ابحث باسم الفندق أو موقعه…') +
    (list.length ? '<div class="plist">' + list.map(h => {
      const sup = (V.users || []).find(u => u.role === 'supervisor' && u.hotelId === h.id);
      const gs = (V.groups || []).filter(g => g.hotelId === h.id);
      const sc = hotelScore(h.id), gr = GRADE(sc);
      return '<div class="prow" data-a="hotedit" data-id="' + h.id + '">' +
        '<span class="krail" style="background:' + gr.c + '"></span>' +
        '<span class="ico" style="color:var(--gold2)">' + icon('i-key', 's18') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(h.ar) + '</b>' +
          '<span>' + E(h.city) + ' · ' + E(h.dist) + ' · تصريح ' + LTR(permitOf(h.ar)) + '</span></span>' +
        '<span class="tcnts">' + cnt('i-key', h.rooms, 'غرف') +
          cnt('i-flag', gs.length, 'مجموعات ساكنة') + '</span>' +
        (sup ? pill('المشرف ' + sup.name, 'live') : pill('بلا مشرف', 'no')) +
        pill(gr.ar, gr.p) +
        '<span class="end">' + icon('i-edit', 's16') + '</span></div>';
    }).join('') + '</div>' : empty('لا فندق', 'امسح الفلاتر', 'i-key')) +
  '</div>';
}

/* ---------- درج الجهة ---------- */
function orgEdit(id) {
  const o = id ? (S.orgs || []).find(x => x.id === id) : null;
  const d = S.oform = (S.oform && S.oform.id === id) ? S.oform
    : { id:id || null, ar:o ? o.ar : '', name:o ? o.name : '', kt:o ? o.kt : '',
        type:o ? o.type : 'بعثة', country:o ? o.country : '', pilgrims:o ? o.pilgrims : 0 };
  const val = k => S.q['o_' + k] != null && S.q['o_' + k] !== '' ? S.q['o_' + k] : d[k];
  const fld = (k, label, ph) => '<label class="fl2">' + E(label) + '</label>' +
    '<input class="fld" id="q-o_' + k + '" data-q="o_' + k + '" value="' + E(val(k)) +
    '" placeholder="' + E(ph || '') + '">';

  S.drawer = { title:o ? o.ar : 'جهة جديدة', sub:o ? o.kt + ' · ' + o.country : 'بعثة أو شركة',
    icon:'i-flag', wide:false, expand:id || '', body:
    '<div class="card">' + head('البيانات', 'يقرؤها النظام كلّه — فالدقّة هنا تُوفّر لاحقًا') +
      fld('ar', 'الاسم بالعربية', 'بعثة تابونغ حاجي') +
      fld('name', 'الاسم بالإنجليزية', 'Tabung Haji Mission') +
      fld('kt', 'رمز الـKT', 'KT085') +
      fld('country', 'الدولة', 'ماليزيا') +
      fld('pilgrims', 'عدد الحجاج', '141') +
      '<label class="fl2">النوع</label>' +
      '<div class="chipwrap">' + ['بعثة', 'شركة'].map(t =>
        '<button class="chipbtn' + ((S.q.o_type || d.type) === t ? ' on' : '') +
        '" data-a="otype" data-v="' + E(t) + '">' + E(t) + '</button>').join('') + '</div>' +
    '</div>' +
    (o ? '<div class="card">' + head('ما يتعلّق بها', '', '', 'i-users') +
      '<div class="grid g2" style="gap:10px">' +
        '<span><div class="tiny faint">الليدرز</div><b class="num">' +
          AR(leaders().filter(L => L.orgId === o.id).length) + '</b></span>' +
        '<span><div class="tiny faint">المجموعات</div><b class="num">' +
          AR((V.groups || []).filter(g => g.orgId === o.id).length) + '</b></span>' +
        '<span><div class="tiny faint">المهام</div><b class="num">' +
          AR((V.tasks || []).filter(t => t.orgId === o.id).length) + '</b></span>' +
        '<span><div class="tiny faint">مجموعات التأشيرة</div><b class="num">' +
          AR((S.groupsV || []).filter(v => v.orgId === o.id).length) + '</b></span>' +
      '</div></div>' : '') +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="orgsave" data-id="' + (id || '') + '">' +
        icon('i-check', 's16') + (o ? 'حفظ' : 'إضافة') + '</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button></div>' };
  renderDrawer();
}

/* ---------- درج الفندق ---------- */
function hotelEdit(id) {
  const h = id ? HOTELS.find(x => x.id === id) : null;
  const d = S.hform = (S.hform && S.hform.id === id) ? S.hform
    : { id:id || null, ar:h ? h.ar : '', city:h ? h.city : 'مكة المكرمة',
        rooms:h ? h.rooms : 0, dist:h ? h.dist : '' };
  const val = k => S.q['h_' + k] != null && S.q['h_' + k] !== '' ? S.q['h_' + k] : d[k];
  const fld = (k, label, ph) => '<label class="fl2">' + E(label) + '</label>' +
    '<input class="fld" id="q-h_' + k + '" data-q="h_' + k + '" value="' + E(val(k)) +
    '" placeholder="' + E(ph || '') + '">';
  const sup = h ? (V.users || []).find(u => u.role === 'supervisor' && u.hotelId === h.id) : null;

  S.drawer = { title:h ? h.ar : 'فندق جديد', sub:h ? h.city + ' · ' + h.dist : 'سكنُ حجّاج',
    icon:'i-key', wide:false, expand:id || '', body:
    '<div class="card">' + head('البيانات', 'الغرف والموقع — ومنهما يُحسب الإشغال') +
      fld('ar', 'اسم الفندق', 'فندق منازل المقام') +
      fld('rooms', 'عدد الغرف', '180') +
      fld('dist', 'الموقع والبُعد', '٤٠٠ م من الحرم') +
      '<label class="fl2">المدينة</label>' +
      '<div class="chipwrap">' + ['مكة المكرمة', 'المدينة المنوّرة', 'جدة'].map(c =>
        '<button class="chipbtn' + ((S.q.h_city || d.city) === c ? ' on' : '') +
        '" data-a="hcity" data-v="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>' +
    '</div>' +
    (h ? '<div class="card">' + head('المشرف والساكنون', '',
      sup ? pill(sup.name, 'live') : pill('بلا مشرف', 'no'), 'i-shield') +
      '<div class="grid g2" style="gap:10px">' +
        '<span><div class="tiny faint">المجموعات الساكنة</div><b class="num">' +
          AR((V.groups || []).filter(g => g.hotelId === h.id).length) + '</b></span>' +
        '<span><div class="tiny faint">تصنيف الامتثال</div><b>' +
          E(GRADE(hotelScore(h.id)).ar) + '</b></span>' +
      '</div>' +
      '<button class="btn l sm" style="width:100%;margin-top:12px" data-a="hprof" ' +
        'data-id="' + h.id + '">' + icon('i-eye', 's14') + 'ملفّ الجهة في الامتثال</button>' +
      '</div>' : '') +
    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="hotsave" data-id="' + (id || '') + '">' +
        icon('i-check', 's16') + (h ? 'حفظ' : 'إضافة') + '</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button></div>' };
  renderDrawer();
}
