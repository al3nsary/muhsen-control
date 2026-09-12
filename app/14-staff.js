/* ============================================================
   مكوّن الفلاتر الموحّد · الموظفون وبروفايلاتهم · منتقي المحسن
   ============================================================ */

/* ---------- فلاتر: صفّ واحد يخدم كل الشاشات ---------- */
const fOf = (key, k) => ((S.flt && S.flt[key]) || {})[k] || '';
function fltSet(key, k, v) {
  S.flt = S.flt || {}; S.flt[key] = S.flt[key] || {};
  if (v) S.flt[key][k] = v; else delete S.flt[key][k];
}
const fltCount = key => Object.keys((S.flt && S.flt[key]) || {}).length;

/* defs: [{ k, label, opts:[[value,label],…] }] */
function filterBar(key, defs, n, total, ph) {
  const active = fltCount(key) + (qOf(key) ? 1 : 0);
  return '<div class="fbar">' +
    (ph === false ? '' : search(key, ph || 'ابحث…', total)) +
    defs.map(d => '<label class="fsel' + (fOf(key, d.k) ? ' on' : '') + '">' +
      '<span>' + E(d.label) + '</span>' +
      '<select data-f="' + key + '" data-fk="' + d.k + '">' +
        '<option value="">الكل</option>' +
        d.opts.map(o => '<option value="' + E(o[0]) + '"' +
          (fOf(key, d.k) === String(o[0]) ? ' selected' : '') + '>' + E(o[1]) + '</option>').join('') +
      '</select>' + icon('i-fwd', 's14') + '</label>').join('') +
    '<span class="fsp"></span>' +
    (n != null ? '<span class="fcount"><b class="num">' + AR(n) + '</b> من ' + AR(total) + '</span>' : '') +
    (active ? '<button class="btn l sm" data-a="fclear" data-k="' + key + '">' +
      icon('i-x','s14') + 'مسح الفلاتر' + '</button>' : '') +
  '</div>';
}

/* خيارات شائعة */
const optOrgs   = () => V.orgs.map(o => [o.id, o.kt + ' · ' + o.ar]);
const optKT     = () => V.orgs.map(o => [o.kt, o.kt + ' · ' + (o.type || '')]);
const optHotels = () => HOTELS.map(h => [h.id, h.ar]);
const optSpecs  = () => SPECS.map(s => [s, s]);
const optCities = () => [...new Set(SITES.map(s => s.city))].map(c => [c, c]);
const optLeaders= () => leaders().map(l => [l.id, l.kt + ' · ' + l.name]);
const optTypes  = () => [['بعثة','بعثات'], ['شركة','شركات']];

/* ---------- أدوات الموظف ---------- */
const ROLE_AR = { supervisor:'مشرف', leader:'ليدر', muhsen:'محسن' };
function staffGroup(u) {
  if (u.role === 'leader') return groupsOf(u.id)[0] || null;
  return u.groupId ? groupById(u.groupId) : null;
}
function staffHotel(u) {
  if (u.role === 'supervisor') return hotelById(u.hotelId);
  const g = staffGroup(u);
  return g ? hotelById(g.hotelId) : {};
}
function staffOrg(u) {
  const g = staffGroup(u);
  return g ? orgById(g.orgId) : (u.orgId ? orgById(u.orgId) : null);
}
/* كل ما أُسند إليه من الأنواع الأربعة */
function staffTasks(id) {
  const u = userById(id); if (!u) return [];
  const out = [];
  V.tasks.forEach(t => {
    if (t.leaderId === id || (t.assigned || []).indexOf(id) >= 0)
      out.push({ type:'hajj', at:t.start, title:t.title, sub:t.kt + ' · ' + t.place,
        state:t.status === 'done' ? 'منجزة' : now() >= t.start ? 'جارية' : 'قادمة', id:t.id });
  });
  V.enrich.forEach(x => { if (x.muhsenId === id) {
    const si = siteById(x.siteId);
    out.push({ type:'enrich', at:x.start, title:si.ar, sub:x.ref + ' · ' + si.city,
      state:x.status === 'done' ? 'منتهية' : 'مسكَّنة', id:x.id });
  }});
  V.nusuk.forEach(c => { if (c.assignedTo === id) {
    out.push({ type:'nusuk', at:c.at, title:NUSUK_SVC[c.svc].ar + ' — ' + c.pilgrim,
      sub:c.no + ' · ' + c.kt, state:NUSUK_STATE[c.state].ar, id:c.id });
  }});
  V.subs.forEach(b => { if (b.by === id) {
    const f = formById(b.formId) || {};
    out.push({ type:'comply', at:b.at, title:f.title + ' — ' + b.target,
      sub:'الزيارة ' + AR(b.visit) + ' · ' + AR(b.score) + '٪', state:'مُعبَّأ', id:b.id });
  }});
  V.assigns.forEach(a => { if (a.to === id) {
    out.push({ type:a.type, at:a.at, title:a.title, sub:a.sub, state:a.state, id:a.id });
  }});
  return out.sort((a, b) => b.at - a.at);
}

/* ---------- شاشة الموظفين ---------- */
function screenStaff() {
  const role = S.tab.sr || 'all';
  const q = qOf('stf');
  let all = V.users.filter(u => u.role === 'supervisor' || u.role === 'leader' || u.role === 'muhsen');
  const total = all.length;
  let list = all.slice();
  if (role !== 'all') list = list.filter(u => role === 'reserve' ? u.reserve
    : u.role === role && !u.reserve);
  const fo = fOf('stf','org'), fh = fOf('stf','hotel'), fs = fOf('stf','spec'), fst = fOf('stf','state');
  if (fo) list = list.filter(u => { const o = staffOrg(u); return o && o.id === fo; });
  if (fh) list = list.filter(u => (staffHotel(u) || {}).id === fh);
  if (fs) list = list.filter(u => u.specialty === fs);
  if (fst) list = list.filter(u => fst === 'in' ? !!staffGroup(u) : !staffGroup(u));
  if (q) list = list.filter(u => (u.name + ' ' + u.code + ' ' + (u.specialty || '')).indexOf(q) >= 0);

  const n = r => all.filter(u => r === 'reserve' ? u.reserve : u.role === r && !u.reserve).length;

  return '<div class="grid g4">' +
      stat({ label:'إجمالي الموظفين', n:total, ic:'i-idcard',
        sub:AR(n('supervisor')) + ' مشرفًا · ' + AR(n('leader')) + ' ليدرًا · ' +
          AR(n('muhsen')) + ' محسنًا', series:[40,80,120,160,190,210,225,total] }) +
      stat({ label:'مسكَّنون', n:all.filter(u => staffGroup(u)).length, ic:'i-checkc', cls:'up',
        sub:'في مجموعات قائمة', series:[20,60,100,140,170,190,200,all.filter(u => staffGroup(u)).length] }) +
      stat({ label:'بلا مجموعة', n:all.filter(u => u.role === 'muhsen' && !u.reserve && !staffGroup(u)).length,
        ic:'i-user', cls:'warn', sub:'متاحون للتشكيل',
        series:[100,80,60,40,25,15,10,Math.max(0, freeMuhsens().length)] }) +
      stat({ label:'الاحتياط', n:n('reserve'), ic:'i-shield',
        sub:'مشترك بين كل الفرق', series:[8,12,16,20,24,28,30,n('reserve')] }) +
    '</div>' +

    '<div class="card">' +
      head('سجلّ الموظفين', 'انقر أي صفّ لتفتح بروفايله كاملًا',
        pill(AR(list.length) + ' معروض', 'gold'), 'i-idcard') +
      '<div class="tools">' + segmented('sr',
        [['all','الكل'],['supervisor','مشرفون'],['leader','ليدرز'],
         ['muhsen','محسنون'],['reserve','احتياط']], role) + '</div>' +
      filterBar('stf', [
        { k:'org',   label:'الجهة',   opts:optOrgs() },
        { k:'hotel', label:'السكن',   opts:optHotels() },
        { k:'spec',  label:'التخصّص', opts:optSpecs() },
        { k:'state', label:'التسكين', opts:[['in','مسكَّن'],['out','بلا مجموعة']] }
      ], list.length, total, 'ابحث باسم أو رمز أو تخصّص…') +
      (list.length ? dataTable({
        key:'stf', defaultCol:0,
        cols:[{ t:'الموظف', w:'1.8fr' }, { t:'الصفة', w:'.7fr' }, { t:'المجموعة', w:'1fr' },
              { t:'الجهة', w:'1.1fr' }, { t:'السكن', w:'1fr' }, { t:'المهام', w:'.6fr' },
              { t:'التقييم', w:'1fr' }],
        rows:list.slice(0, 60).map(u => {
          const g = staffGroup(u), o = staffOrg(u), h = staffHotel(u);
          const tn = staffTasks(u.id).length;
          const rt = u.role === 'leader' ? ktRating(u.id) : muhsenRating(u.id);
          return { id:u.id, act:'staffopen',
            sort:[u.name, ROLE_AR[u.role] || '', g ? g.no : 'ـ', o ? o.kt : 'ـ',
                  h && h.ar ? h.ar : 'ـ', tn, rt],
            cells:[
              '<span class="fl">' + avatar(u, 'sm') +
                '<span class="nm"><b>' + E(u.name) + '</b><span>' + LTR(u.code) +
                (u.specialty ? ' · ' + E(u.specialty) : '') + '</span></span></span>',
              u.reserve ? pill('احتياط','gold') : pill(ROLE_AR[u.role] || '—',
                u.role === 'supervisor' ? 'blue' : u.role === 'leader' ? 'live' : 'grey'),
              g ? '<b>' + LTR(g.no) + '</b>' : '<span class="faint">—</span>',
              o ? '<span class="tiny"><b>' + E(o.kt) + '</b><br>' +
                '<span class="faint">' + E(o.type) + '</span></span>' : '<span class="faint">—</span>',
              h && h.ar ? '<span class="tiny">' + E(h.ar) + '</span>' : '<span class="faint">—</span>',
              '<b class="num">' + AR(tn) + '</b>',
              rt ? stars(rt) : '<span class="faint">—</span>'
            ] };
        })
      }) + (list.length > 60 ? '<div class="tiny faint" style="margin-top:12px">' +
        'يُعرض أول ٦٠ من ' + AR(list.length) + ' — ضيّق الفلاتر لترى الباقي.</div>' : '')
        : empty('لا موظف يطابق', 'جرّب فلترًا آخر', 'i-search')) +
    '</div>';
}

/* ---------- بروفايل الموظف ---------- */
const TTYPE_PILL = { hajj:'live', enrich:'blue', nusuk:'gold', comply:'wait' };
function staffDrawer(id) {
  const u = userById(id); if (!u) return;
  const g = staffGroup(u), o = staffOrg(u), h = staffHotel(u);
  const ts = staffTasks(id);
  const L = u.role === 'muhsen' && g ? userById(g.leaderId) : null;
  const sv = g && g.supervisorId ? userById(g.supervisorId) : null;
  const rt = u.role === 'leader' ? ktRating(u.id) : muhsenRating(u.id);
  const byType = k => ts.filter(t => t.type === k).length;

  openDrawer(u.name, (ROLE_AR[u.role] || '') + ' · ' + u.code, 'i-idcard',
    '<div class="fl" style="gap:14px">' + avatar(u, 'lg') +
      '<span class="nm" style="flex:1"><b style="font-size:16px">' + E(u.name) + '</b>' +
      '<span>' + LTR(u.code) + (u.specialty ? ' · ' + E(u.specialty) : '') + '</span></span>' +
      (u.reserve ? pill('احتياط','gold') : pill(ROLE_AR[u.role] || '', 'live')) + '</div>' +

    '<div class="meta">' +
      '<div><span class="k">العمر</span><b class="num">' + AR(u.age || 29) + '</b></div>' +
      '<div><span class="k">المهام</span><b class="num">' + AR(ts.length) + '</b></div>' +
      '<div><span class="k">التقييم</span><b class="num">' + (rt ? AR(rt) : '—') + '</b></div>' +
    '</div>' +

    '<div class="card">' + head('البيانات', 'ما يعرفه النظام عنه') +
      '<div class="kvlist">' +
        kvRow('i-phone', 'الجوال', u.phone || '—', true) +
        kvRow('i-users', 'المجموعة', g ? g.no : 'بلا مجموعة', true) +
        kvRow('i-flag', 'الجهة', o ? o.kt + ' · ' + o.ar + ' (' + o.type + ')' : '—') +
        kvRow('i-key', 'السكن', h && h.ar ? h.ar + ' · ' + h.city : '—') +
        (L ? kvRow('i-star', 'ليدره', L.name) : '') +
        (sv ? kvRow('i-shield', 'مشرفه', sv.name) : '') +
        (u.role === 'leader' ? kvRow('i-user', 'حجاجه', AR(u.pilgrims || 0) + ' حاجًّا') : '') +
      '</div></div>' +

    '<div class="card">' + head('حصيلة مهامه', 'موزّعة على الأنواع الأربعة') +
      '<div class="grid g4" style="gap:9px">' +
        Object.keys(TASKTYPE).map(k =>
          '<div class="card mini"><span class="tiny faint">' + E(TASKTYPE[k].ar) + '</span>' +
          '<b class="num" style="color:' + TASKTYPE[k].c + '">' + AR(byType(k)) + '</b></div>').join('') +
      '</div></div>' +

    '<div class="card">' + head('مهامه', AR(ts.length) + ' مهمة — الأحدث أولًا') +
      (ts.length ? '<div class="plist">' + ts.slice(0, 20).map(t =>
        '<div class="prow">' +
        '<span class="krail" style="background:' + TASKTYPE[t.type].c + '"></span>' +
        '<span class="ico" style="color:' + TASKTYPE[t.type].c + '">' +
          icon(TASKTYPE[t.type].i, 's16') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(t.title) + '</b>' +
        '<span>' + E(t.sub) + ' · ' + hijri(t.at) + '</span></span>' +
        pill(TASKTYPE[t.type].ar, TTYPE_PILL[t.type]) +
        pill(t.state, t.state === 'منجزة' || t.state === 'سُلّمت' ? 'live'
          : t.state === 'جارية' ? 'live' : 'grey') + '</div>').join('') + '</div>'
        : empty('لا مهام مُسنَدة', 'أسنِد له من شاشة المهام', 'i-tasks')) +
    '</div>');
}
function kvRow(ic, k, v, ltr) {
  return '<div class="kv2"><span class="ico sm">' + icon(ic, 's14') + '</span>' +
    '<span class="k">' + E(k) + '</span><b>' + (ltr ? LTR(v) : E(v)) + '</b></div>';
}

/* ============================================================
   منتقي المحسن — الإسناد لشخص بعينه لا لمجموعة
   ============================================================ */
function openPicker(kind, id, opts) {
  S.picker = { kind, id, q:'', title:opts.title, note:opts.note, cands:opts.cands.map(u => u.id) };
  paintPicker();
}
function paintPicker() {
  const p = S.picker; if (!p) return;
  S.drawer = { title:p.title, sub:'اختر من يُنفّذها — الرقم بجانب الاسم حِمله الحالي',
    icon:'i-users', body:pickerBody() };
  renderDrawer();
}

/* ما يقع عند الاختيار — لكل نوع أثره */
function applyPick(kind, id, u) {
  if (kind === 'enrich') {
    const x = V.enrich.find(e => e.id === id); if (!x) return;
    const g = staffGroup(u), L = g ? userById(g.leaderId) : null;
    x.muhsenId = u.id; x.leaderId = g ? g.leaderId : x.leaderId;
    x.kt = g ? (orgById(g.orgId) || {}).kt : x.kt; x.status = 'assigned';
    logIt('سُكِّنت رحلة ' + x.ref + ' — ' + siteById(x.siteId).ar + ' على ' + u.name +
      (L ? ' · ' + L.kt : ''), 'assign');
    toast('أُسندت إلى ' + u.name);
  } else if (kind === 'nusuk') {
    const c = V.nusuk.find(x => x.id === id); if (!c) return;
    c.assignedTo = u.id;
    c.trail = c.trail || [];
    c.trail.push({ at:now(), by:'الكنترول', text:'أُسندت إلى ' + u.name, file:null });
    logIt('أُسندت ' + c.no + ' (' + NUSUK_SVC[c.svc].ar + ') إلى ' + u.name, 'assign');
    toast('أُسندت إلى ' + u.name);
  } else if (kind === 'comply') {
    const a = S.pendForm; if (!a) return;
    const f = formById(a.formId) || {};
    S.assigns.unshift({ id:uid('A'), type:'comply', to:u.id, at:now(),
      title:f.title + ' — ' + a.target, sub:'نموذج امتثال · ' + a.target, state:'بانتظار التعبئة',
      formId:a.formId, target:a.target });
    logIt('أُسند نموذج «' + f.title + '» على ' + a.target + ' إلى ' + u.name, 'assign');
    toast('أُسند إلى ' + u.name);
    S.pendForm = null;
  } else if (kind === 'ticket') {
    const k = V.tickets.find(x => x.id === id); if (!k) return;
    k.assignedTo = u.id; k.status = 'قيد المعالجة';
    k.thread = k.thread || [];
    k.thread.push({ at:now(), by:'الكنترول', text:'أُسندت إلى ' + u.name });
    logIt('أُسندت تذكرة ' + k.no + ' إلى ' + u.name, 'ticket');
    toast('أُسندت إلى ' + u.name);
  } else if (kind === 'report') {
    const r = V.reports.find(x => x.id === id); if (!r) return;
    r.assignedTo = u.id; r.status = 'قيد المعالجة';
    r.thread = r.thread || [];
    r.thread.push({ at:now(), by:'الكنترول', text:'أُسند إلى ' + u.name });
    logIt('أُسند تقرير ' + r.no + ' إلى ' + u.name, 'assign');
    toast('أُسند إلى ' + u.name);
  } else if (kind === 'sup') {
    /* لكل فندق مشرف واحد: يُزاح السابق، ويُترك فندق المختار الأوّل */
    const h = hotelById(id);
    const prev = S.users.find(x => x.role === 'supervisor' && x.hotelId === id && x.id !== u.id);
    if (prev) prev.hotelId = null;
    const old = u.hotelId;
    u.hotelId = id;
    if (old && old !== id)
      S.groups.forEach(g => { if (g.hotelId === old) g.supervisorId = null; });
    S.groups.forEach(g => { if (g.hotelId === id) g.supervisorId = u.id; });
    logIt('سُكِّن المشرف ' + u.name + ' على ' + h.ar +
      (prev ? ' بدل ' + prev.name : ''), 'assign');
    toast(u.name + ' → ' + h.ar + (prev ? ' — وأُزيح ' + prev.name : ''));
  } else if (kind === 'glead') {
    const g = S.groups.find(x => x.id === id); if (!g) return;
    const org = orgById(g.orgId) || {};
    g.leaderId = u.id;
    g.members.forEach(m => { const mu = userById(m.id);
      if (mu) { mu.leaderId = u.id; mu.kt = org.kt; } });
    logIt('صار ' + u.name + ' ليدر ' + g.no, 'assign');
    toast(g.no + ' → ' + u.name);
  } else if (kind === 'rider') {
    const t = S.trips.find(x => x.id === id); if (!t) return;
    if (t.riders.indexOf(u.id) < 0) t.riders.push(u.id);
    logIt('أُضيف ' + u.name + ' راكبًا في ' + t.no, 'info');
    toast(u.name + ' → ' + t.no);
  } else if (kind === 'task') {
    const t = ensureTask(S.tasks.find(x => x.id === id)); if (!t) return;
    if (t.assigned.indexOf(u.id) >= 0) { toast('هو مسكَّن عليها أصلًا', 'r'); return; }
    t.assigned.push(u.id);
    txLog(t, 'سكّن الكنترول ' + u.name + (u.reserve ? ' من الاحتياط' : '') + ' على المهمة', 'assign');
    logIt('سُكِّن ' + u.name + ' على مهمة ' + t.title + ' — ' + t.kt + ' · من الكنترول', 'assign');
    toast(u.name + ' → ' + t.title);
    S.picker = null; taskDrawer(t.id); return;
  } else if (kind === 'mseat') {
    const g = S.groups.find(x => x.id === id); if (!g) return;
    if (g.members.length >= 5) { toast('المجموعة مكتملة', 'r'); return; }
    const org = orgById(g.orgId) || {};
    g.members.push({ id:u.id, spec:u.specialty || SPECS[0] });
    u.groupId = g.id; u.leaderId = g.leaderId; u.kt = org.kt;
    if (u.reserve) u.reserve = false;   /* من دخل مجموعةً لم يعد احتياطًا */
    let n = 0;
    S.tasks.forEach(t => { if (t.leaderId === g.leaderId) {
      t.assigned = t.assigned || [];
      if (t.assigned.indexOf(u.id) < 0) { t.assigned.push(u.id); n++; }
    } });
    logIt('دخل ' + u.name + ' مجموعة ' + g.no + ' وسُكِّن على ' + AR(n) + ' مهمة', 'assign');
    toast(u.name + ' → ' + g.no + ' · ' + AR(n) + ' مهمة');
  }
}

/* مرشّحو كل نوع */
function candFor(kind, ref) {
  const all = V.users.filter(u => u.role === 'muhsen');
  /* الاحتياط مشترك بين كل الفرق — فهو مرشّح لكل نوع مهمّة */
  const res = reserveTeam();
  if (kind === 'enrich') {
    const x = ref;
    const g = x.leaderId ? groupsOf(x.leaderId)[0] : null;
    const inGrp = g ? g.members.map(m => userById(m.id)).filter(Boolean) : [];
    return (inGrp.length ? inGrp : all.filter(u => staffGroup(u))).concat(res);
  }
  /* المهمّة: فريق ليدرها أوّلًا، ثم كل محسن حرّ، ومعهم الاحتياط دائمًا */
  if (kind === 'task') {
    const t = ref;
    const inTask = t.assigned || [];
    const team = all.filter(u => u.leaderId === t.leaderId);
    const rest = all.filter(u => u.leaderId !== t.leaderId && !u.reserve);
    return team.concat(res).concat(rest).filter(u => inTask.indexOf(u.id) < 0);
  }
  if (kind === 'nusuk') {
    const c = ref, team = teamOf(c.leaderId);
    const L = userById(c.leaderId);
    return team.concat(L ? [L] : []).concat(reserveTeam());
  }
  if (kind === 'comply') {
    /* المحسن يُختار حسب الفندق الذي تسكن فيه مجموعته */
    const hid = ref;
    const gs = V.groups.filter(g => g.hotelId === hid);
    const ids = [];
    gs.forEach(g => { ids.push(g.leaderId); g.members.forEach(m => ids.push(m.id)); });
    const sup = supervisors().filter(u => u.hotelId === hid);
    return [...new Set(ids)].map(userById).filter(Boolean).concat(sup).concat(res);
  }
  if (kind === 'ticket' || kind === 'report') {
    const t = ref, team = teamOf(t.leaderId), L = userById(t.leaderId);
    return team.concat(L ? [L] : []).concat(reserveTeam());
  }
  return all;
}
function pickerBody() {
  const p = S.picker; if (!p) return '';
  const q = (p.q || '').trim();
  let list = p.cands.map(userById).filter(Boolean);
  if (q) list = list.filter(u => (u.name + ' ' + u.code + ' ' + (u.specialty || '')).indexOf(q) >= 0);
  return '<div class="find" style="margin-bottom:14px">' + icon('i-search','s18') +
      '<input id="q-pick" data-q="pick" value="' + E(p.q || '') + '" ' +
      'placeholder="ابحث باسم أو تخصّص…" autocomplete="off">' +
      '<span class="tiny faint">' + AR(list.length) + '</span></div>' +
    (p.note ? '<div class="quote">' + E(p.note) + '</div>' : '') +
    (list.length ? '<div class="plist" style="margin-top:12px">' + list.map(u => {
      const g = staffGroup(u), h = staffHotel(u);
      const load = staffTasks(u.id).length;
      return '<button class="prow pick" data-a="pickdo" data-id="' + u.id + '">' +
        avatar(u, 'sm') +
        '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
        '<span>' + LTR(u.code) + ' · ' + E(u.specialty || '') +
          (g ? ' · ' + g.no : '') + (h && h.ar ? ' · ' + h.ar : '') + '</span></span>' +
        (u.reserve ? pill('احتياط · مشترك','gold') : '') +
        pill(AR(load) + ' مهمة', load > 14 ? 'no' : load > 8 ? 'wait' : 'live') +
      '</button>';
    }).join('') + '</div>'
      : empty('لا مرشّح مطابق', 'وسّع البحث', 'i-search'));
}
