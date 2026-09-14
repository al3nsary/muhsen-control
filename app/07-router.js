/* ============================================================
   المُوجِّه والأحداث
   ============================================================ */
const SCREENS = {
  ops: screenOps, actions: screenActions, orgs: screenOrgs, staffone: screenStaffOne, tasks: screenTasks, build: screenBuild, assign: screenAssign, staff: screenStaff, incidents: screenIncidents,
  support: screenSupport, reports: screenReports, tickets: screenTickets, shifts: screenShifts,
  teams: screenTeams, reserve: screenReserve, pilgrims: screenPilgrims, quality: screenQuality,
  guides: screenGuides, broadcast: screenBroadcast, audit: screenAudit, settings: screenSettings,
  timeline: screenTimeline, perms: screenPerms,
  transport: screenTransport
};

/* أفعال لا تُغيّر شيئًا — مسموحة لكل صفة */
const READ_ACTS = ['go','kgo','gokid','grp','whoami','wide','wall','wallauto','theme','palette','closepal','palrun',
  'closedrawer','shortcuts','timeline','tlopen','seg','sort','ktopen','pilopen','gdview','tropen','copen','whoami','dashedit','dashtog',
  'dashoff','dashup','dashdn','dashreset',
  'fdash','fsub','staffopen','qclear','fclear','fmore','logout','grole','gin','nopen','tkopen2',
  'rpopen','bedit','bclear','clock','dback','pg','alerts','hprof','caopen','pilopen2','pcard','vgopen','qtopen','sigopen','staffpage','actopen','mnote','glog','orgedit','hotedit','tlmove','trep','rpprint','rpxl','rppng','txfold','txwide','txphoto','txfileopen','avopen','avas','avm','avrate','avdelegopen'];

function render() {
  buildView();                       /* الرؤية قبل أي قراءة */
  let n = S.route.n;
  if (!maySee(n)) {                  /* شاشة غير ممنوحة: أوّل مسموحة أو صفحة المنع */
    const first = allowed()[0];
    if (first) { n = first; S.route = { n }; }
  }
  const fn = maySee(n) ? (SCREENS[n] || screenOps) : screenDenied;
  applyTheme();
  const room = document.getElementById('room');
  room.className = (S.wall ? 'wall' : '') + (S.wide && !S.wall ? ' wide' : '');

  const key = n + ':' + (S.route.id || '');
  const same = S._key === key;
  const wrap = document.getElementById('stagewrap');
  const prev = wrap.querySelector('.view');
  const keep = same && prev ? prev.scrollTop : 0;
  document.getElementById('sidewrap').innerHTML = sidebar();
  /* لا يُمسح صنف .stage وإلا فقد المسرح تخطيطه ولم يعمل أي تمرير */
  wrap.className = 'stage' + (same ? ' nofx' : '');
  wrap.innerHTML = topbar() + '<div class="view">' + fn() + '</div>';

  const v = wrap.querySelector('.view');
  if (v && keep) v.scrollTop = keep;
  S._key = key;

  const tw = document.getElementById('toastwrap');
  tw.innerHTML = S.toast
    ? '<div class="toast ' + (S.toast.kind || 'g') + '">' +
      icon(S.toast.kind === 'r' ? 'i-warn' : 'i-checkc', 's18') + '<span>' + E(S.toast.text) + '</span>' +
      '<i class="bar"></i></div>'
    : '';
  /* في جدار العرض: شريط تقدّم إن كان الدوران مفعّلًا، ومخرج ظاهر دائمًا */
  document.getElementById('wallbar').innerHTML = S.wall
    ? (S.wallAuto ? '<div class="wallbar"><i></i></div>' : '') +
      '<button class="wallexit" data-a="wall">' + icon('i-x','s16') +
        'الخروج من جدار العرض · Esc</button>' +
      '<button class="wallexit" style="inset-inline-start:auto;inset-inline-end:22px" ' +
        'data-a="wallauto">' + icon(S.wallAuto ? 'i-stop' : 'i-play','s16') +
        (S.wallAuto ? 'إيقاف الدوران' : 'دوران تلقائي') + '</button>'
    : '';
  afterRender();
  renderPalette();
  renderDrawer();
  syncWall();
  renderGate();
  save();
  if (S.toast) {
    const t = S.toast;
    setTimeout(() => { if (S.toast === t) { S.toast = null; render(); } }, 2800);
  }
}

/* ساعة حيّة بلا إعادة رسم */
setInterval(() => {
  const c = document.getElementById('ctime');
  if (c && S) c.textContent = t12(now());
}, 1000);

const val = id => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };

document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a, id = b.dataset.id, v = b.dataset.v;

  /* الحارس: من لا يملك التعديل لا يُنفّذ إجراءً — والاطّلاع مباح */
  if (!canEdit() && READ_ACTS.indexOf(a) < 0) {
    toast('صفتك للاطّلاع لا للتعديل — ' + curPerm().ar, 'r');
    return;
  }

  switch (a) {
    case 'go': S.route = { n: b.dataset.n, id }; break;
    case 'kgo': {
      if (b.dataset.k) S.tab[b.dataset.k] = b.dataset.v;
      S.route = { n: b.dataset.n };
      break;
    }
    case 'wide': S.wide = !S.wide; break;
    case 'wall': S.wall = !S.wall; if (!S.wall) S.wallAuto = false;
      toast(S.wall ? 'جدار العرض — Esc أو F للخروج' : 'عاد العرض العادي'); break;
    case 'wallauto': S.wallAuto = !S.wallAuto;
      toast(S.wallAuto ? 'يدور بين اللوحات كل ١٢ ثانية' : 'أُوقف الدوران'); break;
    case 'theme': toggleTheme(); break;
    case 'palette': S.palette = true; S.pq = ''; S.psel = 0; renderPalette(); return;
    case 'closepal': S.palette = false; renderPalette(); return;
    case 'palrun': runPalette(Number(v)); return;
    case 'closedrawer': S.drawer = null; S.picker = null; clearDrawerStack(); renderDrawer(); return;
    case 'dback': drawerBack(); return;
    case 'pg': {
      S.page = S.page || {};
      S.page[b.dataset.k] = Math.max(0, Number(v));
      save(); render();
      /* الصفحة الجديدة تبدأ من أعلى الجدول لا من حيث كنت */
      const vw = document.querySelector('.view');
      const tb = vw && vw.querySelector('.plist');
      if (tb) tb.scrollIntoView({ block:'start', behavior:'auto' });
      return;
    }
    case 'shortcuts': showShortcuts(); return;
    case 'timeline': S.route = { n: 'timeline' }; break;
    case 'tlopen': taskDrawer(id); return;

    /* ═══ المهمّة كاملةً — ما يفعله الميدان تفعله الغرفة ═══ */
    case 'txfold': {
      S.open = S.open || {};
      const k = 'tx:' + id + ':' + v;
      S.open[k] = !S.open[k];
      save(); taskDrawer(id); return;
    }
    case 'txwide': S.dwide = !S.dwide; save(); taskDrawer(id); return;

    case 'txsub': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const sb = t.subs.find(x => x.id === b.dataset.s); if (!sb) return;
      sb.done = !sb.done;
      sb.at = sb.done ? now() : null;
      sb.by = sb.done ? null : null;
      txLog(t, (sb.done ? 'أشّر الكنترول على إنجاز «' : 'أُلغي تأشير «') + sb.name + '»',
        sb.done ? 'ok' : 'warn');
      logIt('المهمة ' + t.title + ' — ' + (sb.done ? 'أُنجزت' : 'أُلغيت') + ' خطوة «' + sb.name +
        '» من الكنترول', 'task');
      toast(sb.done ? 'أُنجزت: ' + sb.name : 'أُلغي تأشيرها');
      save(); taskDrawer(id); return;
    }

    case 'txreq': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const r = t.reqs.find(x => x.id === b.dataset.s); if (!r) return;
      r.done = !r.done;
      r.by = r.done ? actorLabel() : null;
      r.at = r.done ? now() : null;
      txLog(t, (r.done ? 'تحقَّق الكنترول من «' : 'رُفع التحقّق عن «') + r.text + '» — ' +
        REQ_PH[r.ph].ar, r.done ? 'ok' : 'warn');
      save(); taskDrawer(id); return;
    }
    case 'txreqdel': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const r = t.reqs.find(x => x.id === b.dataset.s); if (!r) return;
      t.reqs = t.reqs.filter(x => x.id !== r.id);
      txLog(t, 'حُذف المتطلّب «' + r.text + '»', 'warn');
      toast('حُذف المتطلّب'); save(); taskDrawer(id); return;
    }
    case 'txreqnew': S.txq = S.txq || {}; if (v) S.txq.ph = v; S.q.txrq = ''; txReqNew(id, v); return;
    case 'txreqph': S.txq = S.txq || {}; S.txq.ph = v; txReqNew(id, v); return;
    case 'txreqsave': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const txt = (S.q.txrq || '').trim();
      if (!txt) { toast('اكتب نصّ الشرط', 'r'); return; }
      const ph = (S.txq && S.txq.ph) || 'pre';
      t.reqs.push({ id:uid('Q'), ph, text:txt, done:false, by:null, at:null, note:'' });
      S.open = S.open || {}; S.open['tx:' + t.id + ':req' + ph] = true;
      txLog(t, 'أضاف الكنترول متطلّبًا في ' + REQ_PH[ph].ar + ': «' + txt + '»', 'info');
      logIt('أُضيف متطلّب على مهمة ' + t.title + ' — ' + REQ_PH[ph].ar, 'task');
      S.q.txrq = ''; toast('أُضيف المتطلّب'); save(); taskDrawer(id); return;
    }
    case 'txtpl': txTplPick(id); return;
    case 'txtplpick': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const tp = (S.reqtpl || []).find(x => x.id === b.dataset.s); if (!tp) return;
      let n = 0;
      tp.items.forEach(it => {
        if (t.reqs.some(r => r.text === it.text && r.ph === it.ph)) return;
        t.reqs.push({ id:uid('Q'), ph:it.ph, text:it.text, done:false, by:null, at:null, note:'' });
        n++;
      });
      txLog(t, 'رُبط قالب «' + tp.name + '» — أُضيف ' + AR(n) + ' شرطًا', 'info');
      logIt('رُبط قالب متطلّبات بمهمة ' + t.title + ' — ' + AR(n) + ' شرطًا', 'task');
      toast(n ? 'أُضيف ' + AR(n) + ' شرطًا' : 'كلّها موجودة أصلًا', n ? 'g' : 'r');
      save(); taskDrawer(id); return;
    }

    case 'txfilenew': S.txq = S.txq || {}; S.txq.req = b.dataset.s || null;
      S.q.txfn = ''; S.q.txfd = ''; txFileNew(id); return;
    case 'txfk': S.txq = S.txq || {}; S.txq.fk = v; txFileNew(id); return;
    case 'txfilesave': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const f = (S.files || {}).txf;
      const nm = (S.q.txfn || '').trim() || (f ? f.name : '');
      if (!nm) { toast('سمِّ الملف أو أرفقه', 'r'); return; }
      const kind = (S.txq && S.txq.fk) || 'extra';
      const seq = t.files.length + 1;
      t.files.push({ id:uid('F'), kind, doc:null, name:nm,
        ref:(kind === 'contract' ? 'CT' : 'DOC') + '-' + t.code + '-' + seq,
        note:(S.q.txfd || '').trim() || (kind === 'contract' ? 'عقد أضافه الكنترول' : 'ملفّ مساند'),
        size:f ? f.size : 0, type:f ? f.type : 'application/pdf', at:now(), by:actorLabel(),
        reqId:(S.txq && S.txq.req) || null });
      S.open = S.open || {}; S.open['tx:' + t.id + ':files'] = true;
      txLog(t, 'رفع الكنترول ' + (kind === 'contract' ? 'عقدًا' : 'ملفًّا') + ': «' + nm + '»', 'file');
      logIt('رُفع ' + (kind === 'contract' ? 'عقد' : 'ملف') + ' على مهمة ' + t.title, 'task');
      if (S.files) delete S.files.txf;
      S.q.txfn = ''; S.q.txfd = '';
      toast('رُفع على المهمة'); save(); taskDrawer(id); return;
    }
    case 'txfiledel': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const f = t.files.find(x => x.id === b.dataset.s); if (!f) return;
      t.files = t.files.filter(x => x.id !== f.id);
      txLog(t, 'حُذف الملف «' + f.name + '»', 'warn');
      toast('حُذف الملف'); save(); taskDrawer(id); return;
    }
    case 'txfileopen': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const f = t.files.find(x => x.id === b.dataset.s); if (!f) return;
      if (f.doc) { docView(t, f.doc); return; }
      toast('ملفّ مرفوع: ' + f.name + ' — ' + (f.ref || ''));
      save(); render(); return;
    }

    case 'txassign': {
      const t = ensureTask(taskById(id)); if (!t) return;
      openPicker('task', t.id, { title:'تسكين على ' + t.title,
        note:'فريق ليدرها أوّلًا، ثم الاحتياط، ثم بقيّة المحسنين — والكنترول يسكّن من شاء.',
        cands:candFor('task', t) });
      return;
    }
    case 'txunassign': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const u = userById(b.dataset.s); if (!u) return;
      t.assigned = t.assigned.filter(x => x !== u.id);
      t.attended = (t.attended || []).filter(x => x !== u.id);
      txLog(t, 'سحب الكنترول ' + u.name + ' من المهمة', 'warn');
      logIt('سُحب ' + u.name + ' من مهمة ' + t.title, 'assign');
      toast('سُحب ' + u.name); save(); taskDrawer(id); return;
    }
    case 'txattend': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const u = userById(b.dataset.s); if (!u) return;
      t.attended = t.attended || [];
      const on = t.attended.indexOf(u.id) >= 0;
      t.attended = on ? t.attended.filter(x => x !== u.id) : t.attended.concat(u.id);
      txLog(t, (on ? 'أُلغي إثبات حضور ' : 'أثبت الكنترول حضور ') + u.name, on ? 'warn' : 'ok');
      save(); taskDrawer(id); return;
    }

    case 'txstart': {
      const t = ensureTask(taskById(id)); if (!t) return;
      t.status = 'running'; t.startedAt = now(); t.startedBy = 'system';
      t.autoStarted = now() > t.start;
      txLog(t, 'بدأ الكنترول المهمة — تُسجَّل بدايةً من النظام', 'ok');
      logIt('بدأ الكنترول مهمة ' + t.title + ' — ' + t.kt, 'task');
      toast('بدأت المهمة — مسجَّلة باسم النظام'); save(); taskDrawer(id); return;
    }
    case 'txclose': S.q.txcw = ''; txCloseAsk(id); return;
    case 'txclosedo': {
      const t = ensureTask(taskById(id)); if (!t) return;
      t.status = 'done'; t.endedAt = now(); t.endedBy = 'system';
      t.closedBy = 'system'; t.closeWhy = (S.q.txcw || '').trim() || 'أغلقها الكنترول';
      if (!t.rating) t.rating = 0;
      txLog(t, 'أُغلقت من قبل النظام — ' + t.closeWhy, 'warn');
      logIt('أُغلقت مهمة ' + t.title + ' من قبل النظام', 'task');
      S.q.txcw = ''; toast('أُغلقت — من قبل النظام'); save(); taskDrawer(id); return;
    }
    case 'txreopen': {
      const t = ensureTask(taskById(id)); if (!t) return;
      t.status = now() >= t.start ? 'running' : 'assigned';
      t.endedAt = null; t.endedBy = null; t.closedBy = null; t.closeWhy = null;
      txLog(t, 'أُعيد فتح المهمة من الكنترول', 'warn');
      logIt('أُعيد فتح مهمة ' + t.title, 'task');
      toast('أُعيد فتحها'); save(); taskDrawer(id); return;
    }

    case 'txnote': S.q.txnt = ''; txNoteNew(id); return;
    case 'txnotesave': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const txt = (S.q.txnt || '').trim();
      if (!txt) { toast('اكتب الملاحظة', 'r'); return; }
      t.notes.unshift({ at:now(), by:actorLabel(), text:txt, kind:'note' });
      S.open = S.open || {}; S.open['tx:' + t.id + ':notes'] = true;
      txLog(t, 'أضاف الكنترول ملاحظة', 'info');
      S.q.txnt = ''; toast('أُضيفت الملاحظة'); save(); taskDrawer(id); return;
    }

    case 'txphoto': txPhoto(id, b.dataset.s); return;

    /* ═══ تنبيهات المهام ═══ */
    case 'alerts': alertsDrawer(); return;
    case 'tlmove': {
      const d = Number(v);
      S.tab.tlo = d === 0 ? 0 : (Number(S.tab.tlo || 0) + d);
      break;
    }

    /* ═══ التشكيل: حالة · سجلّ · تراجع · سبب ═══ */
    case 'gstate': {
      const g = (S.groups || []).find(x => x.id === id); if (!g) return;
      snapForm('تغيير حالة ' + g.no);
      g.state = gState(g) === 'approved' ? 'draft' : 'approved';
      formLog(g, g.state === 'approved' ? 'اعتُمدت المجموعة — صارت تُقرأ في التطبيق'
        : 'أُرجعت مسودّةً — لا يقرؤها التطبيق');
      logIt(g.no + ': ' + GST[g.state].ar, 'assign');
      toast(GST[g.state].ar); save();
      if (S.drawer) groupLog(g.id); else render();
      return;
    }
    case 'fapproveall': {
      snapForm('اعتماد كل المسودّات');
      let n = 0;
      (S.groups || []).forEach(g => {
        if (gState(g) !== 'approved') { g.state = 'approved'; formLog(g, 'اعتُمدت ضمن اعتمادٍ جماعي'); n++; }
      });
      logIt('اعتُمدت ' + AR(n) + ' مجموعة دفعةً واحدة', 'assign');
      toast('اعتُمدت ' + AR(n) + ' مجموعة'); break;
    }
    case 'glog': groupLog(id); return;
    case 'funfo': { if (undoForm()) { save(); render(); } return; }
    case 'soutr': S.q.soutr = v; S.q.sout = v; repaintDrawer(); return;
    case 'soutdo': {
      const g = (S.groups || []).find(x => x.id === id); if (!g) return;
      const u = userById(v); if (!u) return;
      const why = (S.q.sout || S.q.soutr || '').trim();
      if (!why) { toast('اكتب السبب أو اخترْه', 'r'); return; }
      snapForm('إخراج ' + u.name + ' من ' + g.no);
      g.members = g.members.filter(m => m.id !== v);
      u.groupId = null; u.leaderId = null; u.kt = '—';
      (S.tasks || []).forEach(t => {
        if (t.leaderId === g.leaderId) t.assigned = (t.assigned || []).filter(x => x !== v); });
      formLog(g, 'أُخرج ' + u.name + ' — السبب: ' + why);
      if (gState(g) === 'approved') { g.state = 'draft'; formLog(g, 'عادت مسودّةً بعد التعديل'); }
      logIt('أُخرج ' + u.name + ' من ' + g.no + ' — ' + why, 'assign');
      S.q.sout = ''; S.q.soutr = '';
      S.drawer = null; clearDrawerStack();
      toast('أُخرج ' + u.name); save(); render(); return;
    }
    case 'seatdrop': {
      const g = (S.groups || []).find(x => x.id === b.dataset.g); if (!g) return;
      const u = userById(b.dataset.u); if (!u) return;
      if (g.members.length >= 5) { toast('المجموعة مكتملة', 'r'); return; }
      if (g.members.some(m => m.id === u.id)) { toast('هو فيها أصلًا', 'r'); return; }
      snapForm('إدخال ' + u.name + ' إلى ' + g.no);
      const cf = seatConflicts(g, u);
      const org = orgById(g.orgId) || {};
      g.members.push({ id:u.id, spec:u.specialty || SPECS[0] });
      u.groupId = g.id; u.leaderId = g.leaderId; u.kt = org.kt;
      if (u.reserve) u.reserve = false;
      let n = 0;
      (S.tasks || []).forEach(t => { if (t.leaderId === g.leaderId) {
        t.assigned = t.assigned || [];
        if (t.assigned.indexOf(u.id) < 0) { t.assigned.push(u.id); n++; } } });
      formLog(g, 'دخل ' + u.name + ' المجموعة وسُكِّن على ' + AR(n) + ' مهمة' +
        (cf.length ? ' — مع ' + AR(cf.length) + ' تعارض: ' + cf.map(x => x.ar).join('، ') : ''));
      if (gState(g) === 'approved') { g.state = 'draft'; formLog(g, 'عادت مسودّةً بعد التعديل'); }
      logIt('دخل ' + u.name + ' ' + g.no + ' — ' + AR(n) + ' مهمة', 'assign');
      toast(cf.length ? u.name + ' → ' + g.no + ' · ' + AR(cf.length) + ' تعارض'
        : u.name + ' → ' + g.no, cf.length ? 'r' : 'g');
      save(); render(); return;
    }

    /* ═══ الجهات والفنادق ═══ */
    case 'orgnew':  S.oform = null; ['ar','name','kt','country','pilgrims','type']
      .forEach(k => { S.q['o_' + k] = ''; }); orgEdit(null); return;
    case 'orgedit': S.oform = null; ['ar','name','kt','country','pilgrims','type']
      .forEach(k => { S.q['o_' + k] = ''; }); orgEdit(id); return;
    case 'otype':   S.q.o_type = v; repaintDrawer(); return;
    case 'orgsave': {
      const get = k => (S.q['o_' + k] || '').trim();
      const o = id ? (S.orgs || []).find(x => x.id === id) : null;
      const ar = get('ar') || (o ? o.ar : '');
      const kt = get('kt') || (o ? o.kt : '');
      if (!ar || !kt) { toast('الاسم والرمز لا بدّ منهما', 'r'); return; }
      const rec = { ar, kt, name:get('name') || (o ? o.name : ar),
        country:get('country') || (o ? o.country : '—'),
        type:S.q.o_type || (o ? o.type : 'بعثة'),
        pilgrims:Number(String(get('pilgrims')).replace(/\D/g, '')) || (o ? o.pilgrims : 0) };
      if (o) { Object.assign(o, rec); logIt('عُدِّلت الجهة ' + ar, 'info'); toast('حُفظت'); }
      else {
        S.orgs.push(Object.assign({ id:'o' + (S.orgs.length + 1) }, rec));
        logIt('أُضيفت الجهة ' + ar + ' (' + kt + ')', 'info'); toast('أُضيفت الجهة');
      }
      S.oform = null; S.drawer = null; clearDrawerStack(); save(); render(); return;
    }
    case 'hotnew':  S.hform = null; ['ar','rooms','dist','city']
      .forEach(k => { S.q['h_' + k] = ''; }); hotelEdit(null); return;
    case 'hotedit': S.hform = null; ['ar','rooms','dist','city']
      .forEach(k => { S.q['h_' + k] = ''; }); hotelEdit(id); return;
    case 'hcity':   S.q.h_city = v; repaintDrawer(); return;
    case 'hotsave': {
      const get = k => (S.q['h_' + k] || '').trim();
      const h = id ? HOTELS.find(x => x.id === id) : null;
      const ar = get('ar') || (h ? h.ar : '');
      if (!ar) { toast('اسم الفندق لا بدّ منه', 'r'); return; }
      const rec = { ar, city:S.q.h_city || (h ? h.city : 'مكة المكرمة'),
        rooms:Number(String(get('rooms')).replace(/\D/g, '')) || (h ? h.rooms : 0),
        dist:get('dist') || (h ? h.dist : '—') };
      if (h) { Object.assign(h, rec); logIt('عُدِّل الفندق ' + ar, 'info'); toast('حُفظ'); }
      else {
        HOTELS.push(Object.assign({ id:'h' + (HOTELS.length + 1) }, rec));
        logIt('أُضيف الفندق ' + ar, 'info'); toast('أُضيف الفندق');
      }
      S.hform = null; S.drawer = null; clearDrawerStack(); save(); render(); return;
    }

    /* ═══ الإجراءات والجزاءات ═══ */
    case 'staffpage': S.route = { n:'staffone', id }; break;
    case 'actopen':   actDrawer(id); return;
    case 'mnote': { S.open = S.open || {}; const k2 = 'mn:' + id;
      S.open[k2] = !S.open[k2]; save(); render(); return; }
    case 'acwhy': {
      const a2 = (S.acts || []).find(x => x.id === id); if (!a2) return;
      const t2 = (S.q.acwhy || '').trim();
      if (!t2) { toast('اكتب السبب', 'r'); return; }
      a2.why = t2; a2.state = a2.state === 'closed' ? 'closed' : 'answered';
      a2.trail.unshift({ at:now(), by:actorLabel(), text:'سُجّل السبب: ' + t2 });
      S.q.acwhy = ''; toast('سُجّل السبب'); save(); actDrawer(id); return;
    }
    case 'acsms': {
      const a2 = (S.acts || []).find(x => x.id === id); if (!a2) return;
      const u2 = userById(a2.userId) || {};
      const t2 = a2.taskId ? taskById(a2.taskId) : null;
      a2.smsText = smsText(a2.kind, { task:t2 ? t2.title : 'مهمّة',
        date:hijri(a2.at), n:a2.n || actsOf(a2.userId).length });
      a2.to = u2.name;
      a2.trail.unshift({ at:now(), by:actorLabel(), text:'أُرسل إنذار SMS إلى ' + u2.name });
      sendSms(a2, u2.phone, id2 => (S.acts || []).find(x => x.id === id2));
      logIt('أُرسل إنذار SMS إلى ' + u2.name + ' — ' + ACT_KIND[a2.kind].ar, 'info');
      toast('أُرسلت الرسالة — تصل الحالة بعد لحظات');
      save(); actDrawer(id); return;
    }
    case 'acpen': {
      const a2 = (S.acts || []).find(x => x.id === id); if (!a2) return;
      a2.penalty = v;
      a2.trail.unshift({ at:now(), by:actorLabel(), text:'الجزاء: ' + PENALTY[v].ar });
      logIt('جزاءُ ' + a2.no + ': ' + PENALTY[v].ar, 'info');
      toast(PENALTY[v].ar); save(); actDrawer(id); return;
    }
    case 'acclose': {
      const a2 = (S.acts || []).find(x => x.id === id); if (!a2) return;
      a2.state = 'closed';
      a2.trail.unshift({ at:now(), by:actorLabel(), text:'أُغلق الإجراء' });
      toast('أُغلق الإجراء'); save(); actDrawer(id); return;
    }
    case 'acopen2': {
      const a2 = (S.acts || []).find(x => x.id === id); if (!a2) return;
      a2.state = 'open';
      a2.trail.unshift({ at:now(), by:actorLabel(), text:'أُعيد فتح الإجراء' });
      save(); actDrawer(id); return;
    }
    case 'acperf': S.drawer = null; S.route = { n:'staffone', id }; break;

    /* ═══ البلاغات: دورةٌ من اثنتي عشرة محطّة ═══ */
    case 'sigopen': sigDrawer(id); return;
    case 'signew':  S.sform = null; S.q.sg_t = ''; S.q.sg_b = ''; sigNew(); return;
    case 'sgcat':   { const d = S.sform || {}; d.cat = v; S.sform = d; sigNew(); return; }
    case 'sgkt':    { const d = S.sform || {}; d.kt = v; S.sform = d; sigNew(); return; }
    case 'sgsrc':   { const d = S.sform || {}; d.source = v; S.sform = d; sigNew(); return; }
    case 'sgch':    { const d = S.sform || {}; d.channel = v; S.sform = d; sigNew(); return; }
    case 'sgcls':   { const d = S.sform || {}; d.cls = v; S.sform = d; sigNew(); return; }
    case 'sgrisk':  { const d = S.sform || {}; d.risk = v; S.sform = d; sigNew(); return; }
    case 'sgsave': {
      const d = S.sform || {};
      const t2 = (S.q.sg_t || '').trim();
      if (!t2) { toast('اكتب عنوان البلاغ', 'r'); return; }
      const cat = INC_CATS.find(c => c.k === d.cat) || INC_CATS[0];
      const s2 = { id:uid('SG'), no:'SG-' + (8100 + (S.signals || []).length),
        title:t2, text:(S.q.sg_b || '').trim(), cat:cat.k, catAr:cat.ar,
        source:d.source || SIG_SOURCE[0], channel:d.channel || SIG_CHANNEL[1],
        outside:true, verify:'pending', wrongNote:'',
        cls:d.cls || 'complaint', risk:d.risk || 'mid', rule:null, owner:null,
        followed:false, confirm:false, state:'open',
        kt:d.kt || (ORGS[0] || {}).kt, hotel:'', at:now(), resp:0, closedAt:null,
        trail:[{ at:now(), by:actorLabel(),
          text:'سُجِّل بلاغٌ وصل خارج النظام عبر ' + (d.channel || '') }] };
      S.signals.unshift(s2);
      logIt('سُجّل بلاغ ' + s2.no + ' — ' + t2, 'info');
      S.sform = null; S.q.sg_t = ''; S.q.sg_b = '';
      toast('سُجّل البلاغ — ادخل عليه لإكمال دورته');
      save(); sigDrawer(s2.id); return;
    }
    case 'sigver': {
      const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.verify = v;
      s2.trail.unshift({ at:now(), by:actorLabel(), text:'التحقّق: ' + SIG_VERIFY[v].ar });
      if (v !== 'pending' && s2.state === 'open') s2.state = 'working';
      save(); sigDrawer(id); return;
    }
    case 'sigfix': {
      const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      const t2 = (S.q.sigfix || '').trim();
      if (!t2) { toast('اكتب المعلومة الصحيحة', 'r'); return; }
      s2.trail.unshift({ at:now(), by:actorLabel(),
        text:'أُعيد التسجيل بالمعلومة الصحيحة: ' + t2 });
      s2.text = t2; s2.verify = 'confirmed'; s2.wrongNote = '';
      S.q.sigfix = '';
      toast('سُجّلت المعلومة الصحيحة'); save(); sigDrawer(id); return;
    }
    case 'sigcls': { const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.cls = v; s2.trail.unshift({ at:now(), by:actorLabel(),
        text:'التصنيف: ' + SIG_CLASS[v].ar }); save(); sigDrawer(id); return; }
    case 'sigrisk': { const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.risk = v; s2.trail.unshift({ at:now(), by:actorLabel(),
        text:'درجة الخطورة: ' + SIG_RISK[v].ar }); save(); sigDrawer(id); return; }
    case 'sigrule': { const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.rule = v; s2.trail.unshift({ at:now(), by:actorLabel(),
        text:'قاعدة المعالجة: ' + SIG_RULE[v].ar });
      if (v === 'notify') { S.casts = S.casts || [];
        S.casts.unshift({ id:uid('C'), dest:'muhsen', cat:'بلاغ', at:now(),
          title:s2.title, body:s2.text }); }
      toast(SIG_RULE[v].ar); save(); sigDrawer(id); return; }
    case 'sigown': {
      const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      openPicker('signal', s2.id, { title:'إسناد ' + s2.no,
        note:'من يغطّي شِفته الآن — فالبلاغ يُعالَج الآن لا غدًا.',
        cands:shiftCands(now()) });
      return;
    }
    case 'sigfollow': { const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.followed = !s2.followed;
      s2.trail.unshift({ at:now(), by:actorLabel(),
        text:s2.followed ? 'تأكّد تنفيذ المطلوب' : 'أُلغي تأكيد التنفيذ' });
      save(); sigDrawer(id); return; }
    case 'sigconfirm': { const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.confirm = !s2.confirm;
      s2.trail.unshift({ at:now(), by:actorLabel(),
        text:s2.confirm ? 'تأكّد تحقّق الهدف' : 'أُلغي تأكيد الهدف' });
      save(); sigDrawer(id); return; }
    case 'sigclose': {
      const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      if (!(s2.followed && s2.confirm)) {
        toast('لا يُغلق قبل تأكيد التنفيذ وتحقّق الهدف', 'r'); return; }
      s2.state = 'closed'; s2.closedAt = now();
      s2.resp = Math.max(1, Math.round((s2.closedAt - s2.at) / MIN));
      s2.trail.unshift({ at:now(), by:actorLabel(), text:'أُغلقت الحالة وأُرشفت' });
      logIt('أُغلق بلاغ ' + s2.no, 'info');
      toast('أُغلق وأُرشف'); save(); sigDrawer(id); return;
    }
    case 'sigreopen': {
      const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      s2.state = 'working'; s2.closedAt = null; s2.confirm = false;
      s2.trail.unshift({ at:now(), by:actorLabel(), text:'أُعيد فتح الحالة' });
      save(); sigDrawer(id); return;
    }
    case 'sigreply': {
      const s2 = S.signals.find(x => x.id === id); if (!s2) return;
      const t2 = (S.q.sigrep || '').trim();
      if (!t2) { toast('اكتب الردّ', 'r'); return; }
      const f = (S.files || {}).sigRep;
      s2.trail.unshift({ at:now(), by:actorLabel(),
        text:'ردّ: ' + t2 + (f ? ' (مرفق: ' + f.name + ')' : '') });
      if (s2.state === 'open') s2.state = 'working';
      S.q.sigrep = ''; if (S.files) delete S.files.sigRep;
      toast('أُرسل الردّ'); save(); sigDrawer(id); return;
    }
    case 'trep': taskReport(id); return;
    case 'rpprint': { const t = taskById(id); if (t) reportPrint(t); return; }
    case 'rpxl':    { const t = taskById(id); if (t) reportXl(t); return; }
    case 'rppng':   { const t = taskById(id); if (t) reportPng(t); return; }
    case 'alseen1': {
      (S.tasks || []).forEach(t => (t.alerts || []).forEach(x => {
        if (x.id === b.dataset.s) x.seen = true; }));
      save(); repaintDrawer(); return;
    }
    case 'txreqneed': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const q = t.reqs.find(x => x.id === b.dataset.s); if (!q) return;
      q.needFile = !q.needFile;
      txLog(t, (q.needFile ? 'اشترط الكنترول ملفًّا لـ«' : 'رفع اشتراط الملفّ عن «') +
        q.text + '»', 'info');
      save(); taskDrawer(id); return;
    }

    /* ═══ بيانات الحجاج · المجموعات · الاكسترا كوتا ═══ */
    case 'pilopen2': pilgrimFull(id); return;
    case 'pcard':    cardStates(id); return;
    case 'vgopen':   vgDrawer(id); return;
    case 'pcstep': {
      const p = pilFind(id); if (!p) return;
      p.cardStep = v;
      p.cardLog = CARD_FLOW.slice(0, CARD_IDX(v) + 1).map((c, i) => {
        const old = (p.cardLog || []).find(x => x.k === c.k);
        return { k:c.k, at: old ? old.at : now() - (CARD_IDX(v) - i) * HR };
      });
      logIt('حُدّثت بطاقة ' + p.name + ' إلى «' + CARD_FLOW[CARD_IDX(v)].ar + '»', 'info');
      toast(CARD_FLOW[CARD_IDX(v)].ar); save(); cardStates(id); return;
    }
    case 'phealth': {
      const p = pilFind(id); if (!p) return;
      const was = p.health; p.health = v;
      p.healthLog = p.healthLog || [];
      p.healthLog.unshift({ at:now(), by:actorLabel(),
        text:'غُيّرت الحالة من «' + HEALTH[was].ar + '» إلى «' + HEALTH[v].ar + '»' });
      p.flag = v === 'none' ? null : HEALTH[v].ar;
      logIt('حالة ' + p.name + ' الصحّية: ' + HEALTH[v].ar, 'info');
      save(); pilgrimFull(id); return;
    }
    case 'phnote': {
      const p = pilFind(id); if (!p) return;
      const t2 = (S.q.phn || '').trim();
      if (!t2) { S.q.phn = ''; S.drawer = { title:'قيدٌ صحّي', sub:p.name, icon:'i-med', body:
        '<div class="card">' + head('نصّ القيد', 'يُقرأ في السجلّ الصحّي') +
        '<textarea class="fld" id="q-phn" data-q="phn" rows="4" ' +
        'placeholder="ما الذي حدث؟ ومتى؟ وما الإجراء؟"></textarea></div>' +
        '<div class="grid g2" style="gap:8px">' +
        '<button class="btn p" data-a="phnsave" data-id="' + id + '">حفظ</button>' +
        '<button class="btn l" data-a="pilopen2" data-id="' + id + '">إلغاء</button></div>' };
        renderDrawer(); return; }
      return;
    }
    case 'phnsave': {
      const p = pilFind(id); if (!p) return;
      const t2 = (S.q.phn || '').trim();
      if (!t2) { toast('اكتب القيد', 'r'); return; }
      p.healthLog = p.healthLog || [];
      p.healthLog.unshift({ at:now(), by:actorLabel(), text:t2 });
      S.q.phn = ''; toast('أُضيف القيد'); save(); pilgrimFull(id); return;
    }

    /* الإكسل: تصديرٌ واستيراد بالبنية نفسها */
    case 'pxlall': {
      const cols = XL_COLS.concat(XL_MORE);
      download('muhsen-pilgrims-' + dkey(now()) + '.csv', toCsv(cols, allPil()));
      toast('نُزِّل سجلّ ' + AR(allPil().length) + ' حاجًّا'); return;
    }
    case 'vgxl': {
      const v2 = vgById(id); if (!v2) return;
      const rows = allPil().filter(p => p.visaGroup === id);
      download('group-' + id + '.csv', toCsv(XL_COLS.concat(XL_MORE), rows));
      toast('نُزِّل ' + AR(rows.length) + ' حاجًّا'); return;
    }
    case 'qtxl': {
      download('extra-quota-template.csv', toCsv(XL_COLS, [{
        permit:'44705010578xxxx', firstEn:'AIDILAZMAN', fatherEn:'BIN NASIRON', grandEn:'—',
        familyEn:'BIN NASIRON', firstAr:'عبدالله', fatherAr:'محمد', grandAr:'—',
        familyAr:'القحطاني', passport:'A12345678', nationality:'ماليزيا',
        patCat:PAT_CAT[1], patKind:PAT_KIND[0], dob:'1974-01-19', g:'m', pkg:'PKG-620000'
      }]));
      toast('نُزِّل القالب — عبّئه ثم ارفعه'); return;
    }
    case 'qtnew': S.qform = { orgId:(ORGS[0] || {}).id, rows:[], mode:'xl' };
      if (S.files) delete S.files.qtxl; quotaNew(); return;
    case 'qtopen': quotaDrawer(id); return;
    case 'qtdl': {
      const x = (S.quota || []).find(v2 => v2.id === id); if (!x) return;
      download(x.no + '.csv', toCsv(XL_COLS, x.rows || []));
      toast('نُزِّلت ' + AR((x.rows || []).length) + ' صفًّا'); return;
    }
    case 'qpcat':  S.q.qp_cat = v;  quotaNew(); return;
    case 'qpkind': S.q.qp_kind = v; quotaNew(); return;
    case 'qpg':    S.q.qp_g = v;    quotaNew(); return;
    case 'qprow': {
      const d = S.qform = S.qform || { orgId:(ORGS[0] || {}).id, rows:[] };
      const row = {
        permit:qOf('qp_permit'), passport:qOf('qp_pass'),
        firstEn:qOf('qp_fe'), fatherEn:qOf('qp_ae'), grandEn:qOf('qp_ge') || '—',
        familyEn:qOf('qp_le'), firstAr:qOf('qp_fa'), fatherAr:qOf('qp_aa'),
        grandAr:qOf('qp_ga') || '—', familyAr:qOf('qp_la'),
        nationality:qOf('qp_nat') || 'ماليزيا', dob:qOf('qp_dob'),
        patCat:S.q.qp_cat || PAT_CAT[0], patKind:S.q.qp_kind || PAT_KIND[0],
        g:S.q.qp_g || 'm', pkg:'PKG-' + (700000 + Math.floor(Math.random() * 99999))
      };
      row.ok = !!(row.permit && row.passport && row.firstEn && row.familyEn && row.dob);
      if (!row.ok) { toast('التصريح والجواز والاسم والميلاد لا بدّ منها', 'r'); return; }
      d.rows = (d.rows || []).concat(row);
      ['qp_permit','qp_pass','qp_fe','qp_ae','qp_ge','qp_le','qp_fa','qp_aa','qp_ga','qp_la','qp_dob']
        .forEach(k => { S.q[k] = ''; });
      toast('أُضيف — الدفعة ' + AR(d.rows.length) + ' حاجًّا');
      save(); quotaNew(); return;
    }
    case 'qtsave': {
      const d = S.qform || {};
      if (!(d.rows || []).length) { toast('لا صفوف', 'r'); return; }
      const o = orgById(d.orgId) || ORGS[0];
      const L = leaders().find(x => x.orgId === o.id) || leaders()[0];
      const bad2 = d.rows.filter(x => !x.ok).length;
      const q = { id:uid('QT'), no:'EQ-' + (7300 + (S.quota || []).length),
        orgId:o.id, kt:o.kt, leaderId:L ? L.id : null, count:d.rows.length,
        state: bad2 ? 'incomplete' : 'pending', at:now(), by:o.ar,
        note: bad2 ? 'ينقص بيانٌ في ' + AR(bad2) + ' صفًّا.' : '', rows:d.rows };
      S.quota.unshift(q);
      logIt('وردت دفعة اكسترا كوتا ' + q.no + ' — ' + AR(q.count) + ' حاجًّا من ' + o.ar, 'info');
      S.qform = null; if (S.files) delete S.files.qtxl;
      toast('أُنشئت الدفعة — ' + (bad2 ? 'وفيها نقص' : 'تنتظر موافقتك'), bad2 ? 'r' : 'g');
      save(); S.tab.pil = 'quota'; quotaDrawer(q.id); return;
    }
    case 'qtok': {
      const x = (S.quota || []).find(v2 => v2.id === id); if (!x) return;
      if ((x.rows || []).some(z => !z.ok)) { toast('أكمِل البيانات أوّلًا', 'r'); return; }
      const n = quotaApprove(x);
      toast('اعتُمدت — أُضيف ' + AR(n) + ' حاجًّا ووُزِّعوا');
      save(); quotaDrawer(id); return;
    }
    case 'qtno': {
      const x = (S.quota || []).find(v2 => v2.id === id); if (!x) return;
      x.state = 'rejected';
      logIt('رُدَّت دفعة ' + x.no, 'deny');
      toast('رُدَّت الدفعة'); save(); quotaDrawer(id); return;
    }

    /* ═══ الامتثال: ملفّ الجهة · الجدولة · الإسناد ═══ */
    case 'hprof': hotelProfile(id); return;
    case 'hsched': {
      S.sched = { formId:(V.forms[0] || {}).id || null, hotels:[id], slots:[], prio:'mid',
        mode:'auto', people:[] };
      formSchedule(S.sched.formId); return;
    }
    case 'fsched': S.sched = null; formSchedule(id); return;
    case 'schoteb': {
      const d = schedDraft(), k = d.hotels.indexOf(v);
      if (k >= 0) d.hotels.splice(k, 1); else d.hotels.push(v);
      save(); formSchedule(d.formId); return;
    }
    case 'schall':  { const d = schedDraft(); d.hotels = HOTELS.map(h => h.id);
      save(); formSchedule(d.formId); return; }
    case 'schnone': { const d = schedDraft(); d.hotels = []; save(); formSchedule(d.formId); return; }
    case 'schslot': {
      const d = schedDraft(), k = d.slots.indexOf(v);
      if (k >= 0) d.slots.splice(k, 1); else d.slots.push(v);
      save(); formSchedule(d.formId); return;
    }
    case 'schprio': { const d = schedDraft(); d.prio = v; save(); formSchedule(d.formId); return; }
    case 'schmode': { const d = schedDraft(); d.mode = v; save(); formSchedule(d.formId); return; }
    case 'schwho': {
      const d = schedDraft(), k = d.people.indexOf(v);
      if (k >= 0) d.people.splice(k, 1); else d.people.push(v);
      save(); formSchedule(d.formId); return;
    }
    case 'schsave': schedRun(); return;

    case 'caopen': cmpAsgDrawer(id); return;
    case 'caprio': {
      const a2 = S.assigns.find(x => x.id === id); if (!a2) return;
      a2.prio = v;
      a2.trail = a2.trail || [];
      a2.trail.unshift({ at:now(), by:'الكنترول', text:'صارت أولويّتها ' + prioOf(v).ar });
      toast('الأولوية: ' + prioOf(v).ar); save(); cmpAsgDrawer(id); return;
    }
    case 'careassign': {
      const a2 = S.assigns.find(x => x.id === id); if (!a2) return;
      const pick = reassignComply(a2, isAbsent(a2.to, a2.at) ? 'غياب المُسنَد إليه' : 'قرار الكنترول');
      if (pick) toast('أُعيد الإسناد إلى ' + pick.name);
      save(); cmpAsgDrawer(id); return;
    }
    case 'caswap': {
      const a2 = S.assigns.find(x => x.id === id); if (!a2) return;
      const cands = shiftCands(a2.at).filter(u => u.id !== a2.to);
      if (!cands.length) { toast('لا بديل في هذا الشِفت', 'r'); return; }
      S.swapAsg = a2.id;
      openPicker('caswap', a2.id, { title:'تبديل من يُعبّئ ' + a2.no,
        note:'المعروضون يغطّي شِفتُهم موعد المهمّة (' + a2.shift + ')' +
          (Math.abs(a2.at - now()) < 4 * HR ? '، ومن أثبت حضوره وحده' : '') + '.',
        cands });
      return;
    }
    case 'alopen': {
      const t = ensureTask(taskById(id));
      if (!t) { alertsDrawer(); return; }
      const al = taskAlerts(t).find(x => x.id === b.dataset.s);
      if (al) al.seen = true;
      save(); taskDrawer(t.id); return;
    }
    case 'alseen': {
      const t = ensureTask(taskById(id)); if (!t) return;
      taskAlerts(t).forEach(x => { x.seen = true; });
      toast('وُسمت تنبيهات المهمة مقروءة'); save(); taskDrawer(t.id); return;
    }
    case 'alall': {
      (S.tasks || []).forEach(t => (t.alerts || []).forEach(x => { x.seen = true; }));
      toast('وُسمت كل التنبيهات مقروءة'); save(); alertsDrawer(); return;
    }

    /* ═══ معاينة التطبيق والمعالجة بصفة الميدان ═══ */
    case 'avopen': appPreview(id); return;
    case 'avas':   S.avq = S.avq || {}; S.avq[id] = v; save(); appPreview(id); return;
    case 'avm':    S.avq = S.avq || {}; S.avq[id + ':m'] = v; save(); appPreview(id); return;
    case 'avlive': {
      S.avq = S.avq || {};
      S.avq[id + ':live'] = v === '1';
      const t = taskById(id);
      toast(v === '1' ? 'وضع المعالجة — ما تضغطه يقع فعلًا' : 'عادت المعاينة للقراءة');
      save(); appPreview(id); return;
    }
    case 'avattend': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const u = userById(b.dataset.s); if (!u) return;
      if (t.attended.indexOf(u.id) < 0) t.attended.push(u.id);
      avAct(t, 'أثبت حضوره', 'ok');
      toast('أُثبت حضور ' + u.name); save(); appPreview(id); return;
    }
    case 'avstart': {
      const t = ensureTask(taskById(id)); if (!t) return;
      t.status = 'running'; t.startedAt = now(); t.startedBy = t.leaderId;
      t.autoStarted = now() > t.start;
      avAct(t, 'بدأ المهمة', 'ok');
      toast('بدأت المهمة'); save(); appPreview(id); return;
    }
    case 'avsub': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const sb = t.subs.find(x => x.id === b.dataset.s); if (!sb) return;
      sb.done = !sb.done; sb.at = sb.done ? now() : null;
      sb.by = sb.done ? t.leaderId : null;
      avAct(t, (sb.done ? 'أنجز «' : 'ألغى إنجاز «') + sb.name + '»', sb.done ? 'ok' : 'warn');
      save(); appPreview(id); return;
    }
    case 'avend': {
      const t = ensureTask(taskById(id)); if (!t) return;
      t.status = 'done'; t.endedAt = now(); t.endedBy = t.leaderId;
      if (!t.rating) t.rating = rateOf(t).stars;
      avAct(t, 'أنهى المهمة', 'ok');
      toast('أُنهيت المهمة'); save(); appPreview(id); return;
    }

    /* ═══ تفويض القيادة ═══ */
    case 'avdelegopen': delegDrawer(id); return;
    case 'avdeleg': {
      const t = ensureTask(taskById(id)); if (!t) return;
      const u = userById(b.dataset.s); if (!u) return;
      t.delegate = { muhsenId:u.id, state:'pending', keepGroup:true, at:now(), by:'الكنترول' };
      txLog(t, 'فوّض الكنترول قيادة المهمة إلى ' + u.name + ' — بانتظار قبوله', 'info');
      logIt('فُوِّضت قيادة مهمة ' + t.title + ' إلى ' + u.name, 'assign');
      toast('أُرسل التفويض إلى ' + u.name); save(); delegDrawer(id); return;
    }
    case 'avdelok': {
      const t = ensureTask(taskById(id)); if (!t || !t.delegate) return;
      t.delegate.state = 'accepted'; t.delegate.respAt = now();
      const u = userById(t.delegate.muhsenId) || {};
      txLog(t, 'قَبِل الكنترول التفويض نيابةً عن ' + (u.name || '') + ' — يملك البدء والإغلاق', 'ok');
      toast('صار ' + (u.name || '') + ' ليدر هذه المهمة'); save(); delegDrawer(id); return;
    }
    case 'avdeloff': {
      const t = ensureTask(taskById(id)); if (!t || !t.delegate) return;
      const u = userById(t.delegate.muhsenId) || {};
      t.delegate = null;
      txLog(t, 'أُلغي تفويض القيادة عن ' + (u.name || ''), 'warn');
      toast('أُلغي التفويض'); save(); delegDrawer(id); return;
    }

    case 'avrate': rateDrawer(id); return;


    case 'seg': S.tab[b.dataset.k] = v; break;
    /* الحاوية تُفتح وتُطوى ولا تنتقل */
    case 'grp': {
      const p = b.dataset.n;
      S.open = S.open || {};
      const item = NAV.reduce((r, g) => r || g.items.find(x => x.p === p), null);
      S.open[p] = !grpOpen(item);
      save(); render(); return;
    }
    case 'gokid': {
      if (b.dataset.k) S.tab[b.dataset.k] = b.dataset.v;
      S.route = { n: b.dataset.n };
      break;
    }
    case 'whoami': whoDrawer(); return;

    /* ─── النقل ─── */
    case 'tropen': tripDrawer(id); return;
    case 'trmove': {
      const t = S.trips.find(x => x.id === id); if (!t) return;
      t.at += Number(v) * MIN;
      logIt('أُعيدت جدولة ' + t.no + ' ' + (Number(v) > 0 ? 'تأخيرًا' : 'تقديمًا') +
        ' ' + AR(Math.abs(Number(v))) + ' دقيقة', 'info');
      save(); tripDrawer(id); toast('الانطلاق ' + t12(t.at));
      return;
    }
    case 'trdone': {
      const t = S.trips.find(x => x.id === id); if (!t) return;
      t.done = true; logIt('انتهت الرحلة ' + t.no, 'info');
      save(); tripDrawer(id); toast('انتهت'); return;
    }
    case 'trbus': {
      const t = S.trips.find(x => x.id === id); if (!t) return;
      S.pendTrip = id;
      S.drawer = { title:'باص ' + t.no, sub:'اختر باصًا آخر', icon:'i-bus',
        body:'<div class="plist">' + S.buses.map(b => {
          const busy = S.trips.filter(x => x.busId === b.id &&
            Math.abs(x.at - t.at) < 60 * MIN && x.id !== t.id).length;
          return '<button class="prow pick' + (b.id === t.busId ? ' on' : '') + '" ' +
            'data-a="trbusset" data-id="' + b.id + '">' +
            '<span class="ico" style="color:' + b.color + '">' + icon('i-bus','s16') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(b.no) + '</b>' +
            '<span>' + LTR(b.plate) + ' · ' + E(b.driver) + ' · ' + AR(b.cap) + ' مقعدًا</span></span>' +
            (busy ? pill('تعارض ' + AR(busy), 'no') : pill('متاح', 'live')) + '</button>';
        }).join('') + '</div>' };
      renderDrawer(); return;
    }
    case 'trbusset': {
      const t = S.trips.find(x => x.id === S.pendTrip); if (!t) return;
      const b2 = busById(id);
      t.busId = id; t.driver = b2.driver; t.cap = b2.cap;
      if (t.riders.length > b2.cap) t.riders = t.riders.slice(0, b2.cap);
      logIt('نُقلت ' + t.no + ' إلى ' + b2.no, 'info');
      S.pendTrip = null; S.drawer = null; toast('الباص ' + b2.no);
      break;
    }
    case 'trider': {
      const t = S.trips.find(x => x.id === id); if (!t) return;
      if (t.riders.length >= t.cap) { toast('الباص مكتمل', 'r'); return; }
      const task = t.taskId ? taskById(t.taskId) : null;
      const cands = (task ? (task.assigned || []).map(userById).filter(Boolean)
        : S.users.filter(u => u.role === 'muhsen' && u.groupId))
        .filter(u => t.riders.indexOf(u.id) < 0);
      if (!cands.length) { toast('لا مرشّح متاح', 'r'); return; }
      openPicker('rider', t.id, { title:'راكب في ' + t.no,
        note:'محسنو المهمّة أولى بالمقعد.', cands });
      return;
    }
    case 'trrmv': {
      const t = S.trips.find(x => x.id === id); if (!t) return;
      t.riders = t.riders.filter(r => r !== v);
      save(); tripDrawer(id); return;
    }
    case 'trnew': {
      const day = S.tab.trday ? Number(S.tab.trday) : dayStart(now());
      const t2 = S.tasks.filter(x => dayStart(x.start) === day)
        .sort((a, b) => a.start - b.start)[0];
      const bus = S.buses.reduce((best, b) => {
        const n1 = S.trips.filter(x => x.busId === b.id && dayStart(x.at) === day).length;
        const n2 = S.trips.filter(x => x.busId === best.id && dayStart(x.at) === day).length;
        return n1 < n2 ? b : best;
      }, S.buses[0]);
      const at = t2 ? t2.start - 45 * MIN : day + 8 * HR;
      const g = t2 ? S.groups.find(x => x.leaderId === t2.leaderId) : null;
      const tr = { id:uid('TR'), no:'TP-' + (701 + S.trips.length), busId:bus.id,
        taskId:t2 ? t2.id : null, kind:t2 ? 'toTask' : 'toHotel',
        from:g ? (hotelById(g.hotelId).ar || 'نقطة التجمّع') : 'نقطة التجمّع',
        to:t2 ? t2.place : 'الفندق', at, dur:40, cap:bus.cap,
        riders:g ? g.members.slice(0, 4).map(m => m.id) : [], driver:bus.driver, done:false };
      S.trips.push(tr);
      logIt('جُدولت رحلة ' + tr.no + ' على ' + bus.no + ' — ' + t12(at), 'info');
      toast('جُدولت على ' + bus.no + ' — الأقلّ حِملًا');
      break;
    }
    /* الفرز: النقرة الأولى تختار العمود، والثانية تعكس الاتجاه */
    case 'sort': {
      const k = b.dataset.k, c = Number(v);
      S.sort = S.sort || {};
      const cur = S.sort[k] || {};
      S.sort[k] = { col: c, dir: cur.col === c ? -(cur.dir || 1) : 1 };
      break;
    }
    case 'ktopen': ktDrawer(id); return;
    case 'pilopen': pilgrimDrawer(id); return;
    case 'gdview': guideView(id); return;
    case 'gdnew':  S.gb = null; S.q.gbs = ''; guideEdit(null); return;
    case 'gdedit': S.gb = null; guideEdit(id); return;
    case 'gbscope': {
      S.gb.scope = v;
      const t = gTargets(v);
      S.gb.target = t.length ? t[0][0] : null;
      guideEdit(); return;
    }
    case 'gbadd': {
      const s2 = (S.q.gbs || '').trim();
      if (!s2) { toast('اكتب نصّ الخطوة', 'r'); return; }
      S.gb.steps.push(s2); S.q.gbs = ''; guideEdit(); return;
    }
    case 'gbdel': S.gb.steps.splice(Number(v), 1); guideEdit(); return;
    case 'gbup': {
      const i = Number(v), a2 = S.gb.steps;
      const tmp = a2[i - 1]; a2[i - 1] = a2[i]; a2[i] = tmp;
      guideEdit(); return;
    }
    case 'gbmadd': {
      const f = (S.files || {}).guide;
      const k = fOf('gb','mk') || 'video';
      if (!f && k !== 'text') { toast('اختر ملفًا أوّلًا', 'r'); return; }
      S.gb.media.push({ k, name:f ? f.name : 'نصّ الخطوات', size:f ? f.size : 0 });
      if (S.files) delete S.files.guide;
      guideEdit(); return;
    }
    case 'gbmdel': S.gb.media.splice(Number(v), 1); guideEdit(); return;
    case 'gbsave':
    case 'gbsavepub': {
      const b2 = S.gb;
      b2.title = (S.q.gbt || b2.title || '').trim();
      if (!b2.title) { toast('اكتب عنوان الدليل', 'r'); return; }
      if (!b2.steps.length) { toast('أضف خطوة واحدة على الأقلّ', 'r'); return; }
      const pub = a === 'gbsavepub';
      if (b2.editing) {
        const g = S.guides.find(x => x.id === b2.editing);
        Object.assign(g, { title:b2.title, scope:b2.scope, target:b2.target,
          taskId:b2.taskId, steps:b2.steps, media:b2.media, at:now() });
        if (pub) { g.status = 'live'; g.ver += 1; }
        logIt('عُدِّل دليل «' + g.title + '»' + (pub ? ' ونُشر ن' + AR(g.ver) : ''), 'guide');
      } else {
        S.guides.unshift({ id:uid('GD'), scope:b2.scope, target:b2.target, taskId:b2.taskId,
          title:b2.title, ver:1, status:pub ? 'live' : 'draft',
          media:b2.media, steps:b2.steps, by:'ctl', at:now() });
        logIt('أُنشئ دليل «' + b2.title + '»' + (pub ? ' ونُشر' : ' كمسودة'), 'guide');
      }
      S.gb = null; S.q.gbt = ''; S.drawer = null;
      toast(pub ? 'حُفظ ونُشر — يقرؤه الميدان' : 'حُفظ كمسودة');
      break;
    }
    case 'gdpub': {
      const g = S.guides.find(x => x.id === id); if (!g) return;
      g.status = 'live'; g.ver += 1; g.at = now();
      logIt('اعتُمدت النسخة ' + AR(g.ver) + ' من «' + g.title + '»', 'guide');
      toast('نُشر — يقرؤه الميدان الآن'); break;
    }
    case 'gdunpub': {
      const g = S.guides.find(x => x.id === id); if (!g) return;
      g.status = 'draft';
      logIt('سُحب دليل «' + g.title + '» من النشر', 'guide');
      toast('سُحب — لم يعد يراه الميدان', 'r'); break;
    }
    /* ربط دليل بمهمّة بعينها */
    case 'tguide': {
      const t = taskById(id); if (!t) return;
      S.pendTask = id;
      const own = S.guides.filter(g => !g.taskId || g.taskId === id);
      S.drawer = { title:'دليل ' + t.title, sub:'اختر دليلًا يَغلب على دليل التصنيف',
        icon:'i-guide', body:
        '<div class="quote">دليل التصنيف الآن: <b>' +
          E((guideFor('hajj', t.kind) || {}).title || 'لا يوجد') + '</b></div>' +
        '<div class="plist" style="margin-top:12px">' + own.map(g =>
          '<button class="prow pick' + (g.taskId === id ? ' on' : '') + '" ' +
          'data-a="tguideset" data-id="' + g.id + '">' +
          '<span class="ico">' + icon((G_SCOPE[g.scope] || G_SCOPE.free).i,'s16') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(g.title) + '</b>' +
          '<span>' + E((G_SCOPE[g.scope] || G_SCOPE.free).ar) + ' · ' +
            AR((g.steps || []).length) + ' خطوة</span></span>' +
          pill(G_ST[g.status].ar, G_ST[g.status].c) + '</button>').join('') + '</div>' +
        '<button class="btn l" style="width:100%;margin-top:12px" data-a="tguideclr">' +
          'إلغاء الربط — يعود إلى دليل التصنيف</button>' };
      renderDrawer(); return;
    }
    case 'tguideset': {
      const g = S.guides.find(x => x.id === id); if (!g) return;
      S.guides.forEach(x => { if (x.taskId === S.pendTask) x.taskId = null; });
      g.taskId = S.pendTask;
      logIt('رُبط دليل «' + g.title + '» بمهمّة ' + (taskById(S.pendTask) || {}).title, 'guide');
      S.drawer = null; toast('رُبط الدليل بالمهمّة'); break;
    }
    case 'tguideclr': {
      S.guides.forEach(x => { if (x.taskId === S.pendTask) x.taskId = null; });
      S.drawer = null; toast('عاد إلى دليل التصنيف'); break;
    }
    case 'fdash': formDash(id); return;
    case 'fsub': subDrawer(id); return;

    /* ─── إثراء التجربة: تصل من نظام المزارات ─── */
    case 'xsync':
      S.enrichSync = now();
      logIt('زُوملت مهام إثراء التجربة من نظام المزارات', 'info');
      toast('لا جديد — الوارد محدَّث');
      break;

    /* ─── التشكيل ─── */
    case 'blead': {
      const d = draft();
      if (groupsOf(id).length >= 2 && d.editing == null) {
        toast('هذا الليدر يقود مجموعتين — لا ثالثة', 'r'); return;
      }
      d.leaderId = id; break;
    }
    case 'bclrlead': draft().leaderId = null; break;
    case 'bmem': {
      const d = draft();
      if (d.members.length >= 5) { toast('المجموعة ستّة: ليدر وخمسة', 'r'); return; }
      if (d.members.some(m => m.id === id)) return;
      const u = userById(id);
      d.members.push({ id, spec: (u && u.specialty) || SPECS[0] });
      break;
    }
    case 'bdel': draft().members = draft().members.filter(m => m.id !== id); break;
    case 'bspec': return;   /* يُلتقط من حدث التغيير لا النقر */
    case 'borg': draft().orgId = id; break;
    case 'bhotel': {
      const d = draft(); d.hotelId = id;
      const sv = supervisors().find(u => u.hotelId === id);
      d.supervisorId = sv ? sv.id : null;
      break;
    }
    case 'bsup': {
      const d = draft(); const u = userById(id); if (!u) return;
      d.supervisorId = id; d.hotelId = u.hotelId;
      break;
    }
    case 'bclear': S.draft = DRAFT0(); break;
    case 'bedit': {
      const g = groupById(id); if (!g) return;
      S.draft = { leaderId: g.leaderId, members: g.members.map(m => ({ id:m.id, spec:m.spec })),
        orgId: g.orgId, hotelId: g.hotelId, supervisorId: g.supervisorId, editing: g.id };
      toast('افتح التعديل — احفظ لتثبيته');
      break;
    }
    case 'bsave': {
      const d = draft();
      if (!d.leaderId || d.members.length !== 5 || !d.orgId) {
        toast('المجموعة ستّة وجهة حجّ — أكملها', 'r'); return;
      }
      const org = orgById(d.orgId) || {};
      let g = d.editing ? groupById(d.editing) : null;
      if (g) {
        /* من خرج من التعديل يعود حرًّا */
        g.members.forEach(m => { const u = userById(m.id);
          if (u && !d.members.some(x => x.id === m.id)) { u.groupId = null; u.leaderId = null; } });
      } else {
        g = { id: uid('G'), no: 'GR-' + (101 + S.groups.length), at: now() };
        S.groups.push(g);
      }
      Object.assign(g, { leaderId: d.leaderId, orgId: d.orgId, hotelId: d.hotelId,
        supervisorId: d.supervisorId, members: d.members.map(m => ({ id:m.id, spec:m.spec })) });
      d.members.forEach(m => { const u = userById(m.id);
        if (u) { u.groupId = g.id; u.leaderId = g.leaderId; u.kt = org.kt; u.specialty = m.spec; } });
      const L = userById(g.leaderId) || {};
      /* التسكين التلقائي: كل مهام الجهة تصير على هذه المجموعة */
      let n = 0;
      S.tasks.forEach(t => {
        if (t.orgId === g.orgId && t.leaderId === g.leaderId) {
          t.assigned = g.members.map(m => m.id); t.kt = org.kt; n++;
        }
      });
      logIt((d.editing ? 'عُدِّلت ' : 'شُكِّلت ') + g.no + ' — ' + L.name + ' · ' + org.kt +
        ' وسُكِّنت ' + AR(n) + ' مهمة', 'assign');
      S.draft = DRAFT0();
      toast(d.editing ? 'حُفظ التعديل' : 'شُكِّلت المجموعة وسُكِّنت ' + AR(n) + ' مهمة');
      break;
    }
    case 'qclear': S.q[b.dataset.k] = ''; break;
    case 'fmore': { S.open = S.open || {}; const k2 = 'flt:' + b.dataset.k;
      S.open[k2] = !S.open[k2]; save(); render(); return; }
    case 'fclear': { const k = b.dataset.k; S.flt[k] = {}; S.q[k] = ''; break; }

    /* ─── نُسك: فتح حالة ─── */
    case 'nclose': {
    }

    /* ─── إثراء: إسناد لمحسن ─── */
    case 'xassign': {
      const x = S.enrich.find(e => e.id === id); if (!x) return;
      openPicker('enrich', x.id, { title:'إسناد ' + siteById(x.siteId).ar,
        note:'المحسن يرافق الرحلة — والرقم بجانبه حِمله الحالي.',
        cands:candFor('enrich', x) });
      return;
    }

    /* ─── الامتثال ─── */
    case 'fnew':  S.fb = null; formBuilder(null); return;
    case 'fedit': S.fb = null; formBuilder(id); return;
    case 'fbscope': S.fb.scope = v; formBuilder(); return;
    case 'fbadd': {
      const q = (S.q.fbq || '').trim();
      if (!q) { toast('اكتب نصّ السؤال أوّلًا', 'r'); return; }
      const t2 = fOf('fb','qt') || 'yn';
      S.fb.qs.push({ id:'q' + (S.fb.qs.length + 1), q, t:t2,
        w:QT_NOSCORE.indexOf(t2) < 0 ? Number(fOf('fb','qw') || 2) : 0,
        req:!!fOf('fb','qr') });
      S.q.fbq = ''; formBuilder(); return;
    }
    case 'fbup': {
      const i = Number(v); if (i < 1) return;
      const a2 = S.fb.qs; const tmp = a2[i - 1]; a2[i - 1] = a2[i]; a2[i] = tmp;
      formBuilder(); return;
    }
    case 'fbdel': S.fb.qs.splice(Number(v), 1); formBuilder(); return;
    case 'fbsave': {
      const b2 = S.fb;
      if (!b2.title) { toast('اكتب عنوان القالب', 'r'); return; }
      if (!b2.qs.length) { toast('أضف سؤالًا واحدًا على الأقلّ', 'r'); return; }
      b2.intro = S.q.fbi || b2.intro || '';
      b2.pledge = S.q.fbp || b2.pledge || '';
      if (b2.editing) {
        const f = formById(b2.editing);
        Object.assign(f, { title:b2.title, scope:b2.scope, qs:b2.qs,
          intro:b2.intro, pledge:b2.pledge });
        logIt('عُدِّل قالب «' + f.title + '» — ' + AR(f.qs.length) + ' أسئلة', 'guide');
      } else {
        S.forms.push({ id:uid('F'), no:'FM-' + (201 + S.forms.length), title:b2.title,
          scope:b2.scope, icon:'i-clip', color:'#0B7A4B', by:'ctl', at:now(),
          qs:b2.qs, intro:b2.intro, pledge:b2.pledge });
        logIt('أُنشئ قالب «' + b2.title + '» بـ' + AR(b2.qs.length) + ' أسئلة', 'guide');
      }
      S.q.fbi = ''; S.q.fbp = '';
      S.fb = null; S.drawer = null; toast('حُفظ القالب');
      break;
    }
    case 'fassign': formAssign(id); return;
    case 'fatarget': {
      const h = hotelById(id);
      S.pendForm.target = h.ar;
      openPicker('comply', id, { title:'من ينفّذه في ' + h.ar,
        note:'المرشّحون من مجموعات تسكن هذا الفندق ومشرفيه.',
        cands:candFor('comply', id) });
      return;
    }

    /* ─── التذاكر ─── */
    case 'tkopen2': ticketDrawer(id); return;
    case 'tkassign': {
      const k = S.tickets.find(x => x.id === id); if (!k) return;
      openPicker('ticket', k.id, { title:'إسناد ' + k.no, cands:candFor('ticket', k) });
      return;
    }
    case 'tkcat': { const k = S.tickets.find(x => x.id === id); if (k) k.cat = v;
      save(); ticketDrawer(id); return; }
    case 'tkpri': { const k = S.tickets.find(x => x.id === id); if (k) k.pri = v;
      logIt('غُيّرت أولوية ' + k.no + ' إلى ' + v, 'ticket'); save(); ticketDrawer(id); return; }
    case 'tkreply': {
      const k = S.tickets.find(x => x.id === id); if (!k) return;
      const t = (S.q.tkreply || '').trim();
      if (!t) { toast('اكتب ردًّا', 'r'); return; }
      k.thread = k.thread || [];
      k.thread.push({ at:now(), by:'الكنترول', text:t, file:(S.files || {}).tkReply || null });
      if (k.status === 'مفتوحة') k.status = 'قيد المعالجة';
      S.q.tkreply = ''; if (S.files) delete S.files.tkReply;
      logIt('رُدّ على تذكرة ' + k.no, 'ticket');
      save(); ticketDrawer(id); toast('أُرسل الردّ');
      return;
    }
    case 'tkclose': { const k = S.tickets.find(x => x.id === id); if (!k) return;
      k.status = 'مغلقة'; k.thread = k.thread || [];
      k.thread.push({ at:now(), by:'الكنترول', text:'أُغلقت التذكرة' });
      logIt('أُغلقت تذكرة ' + k.no, 'ticket'); save(); ticketDrawer(id);
      toast('أُغلقت'); return; }
    case 'tkopen': { const k = S.tickets.find(x => x.id === id); if (!k) return;
      k.status = 'قيد المعالجة'; save(); ticketDrawer(id); toast('أُعيد فتحها'); return; }

    /* ─── التقارير ─── */
    case 'rpopen': reportDrawer(id); return;
    case 'rpassign': {
      const r = S.reports.find(x => x.id === id); if (!r) return;
      openPicker('report', r.id, { title:'إسناد ' + r.no, cands:candFor('report', r) });
      return;
    }
    case 'rpreply': {
      const r = S.reports.find(x => x.id === id); if (!r) return;
      const t = (S.q.rpreply || '').trim();
      if (!t) { toast('اكتب ردًّا', 'r'); return; }
      r.thread = r.thread || [];
      r.thread.push({ at:now(), by:'الكنترول', text:t, file:(S.files || {}).rpReply || null });
      r.status = 'قيد المعالجة'; S.q.rpreply = '';
      if (S.files) delete S.files.rpReply;
      logIt('رُدّ على تقرير ' + r.no, 'info');
      save(); reportDrawer(id); toast('أُرسل الردّ'); return;
    }
    case 'rpclose': { const r = S.reports.find(x => x.id === id); if (!r) return;
      r.status = 'مغلق'; r.escalated = false;
      logIt('أُغلق تقرير ' + r.no, 'info'); save(); reportDrawer(id);
      toast('أُغلق التقرير'); return; }

    /* ─── ١) المشرف على الفندق: واحد لا أكثر ─── */
    case 'supassign':
    case 'supswap': {
      const cur = supOfHotel(id);
      openPicker('sup', id, { title:(cur ? 'تغيير مشرف ' : 'تسكين مشرف ') + hotelById(id).ar,
        note:'لكل فندق مشرف واحد. من يُختار يُزاح عن فندقه السابق إن كان له فندق، ' +
          'ومن يُزاح هنا يعود حرًّا.',
        cands:supervisors().filter(u => u.hotelId !== id) });
      return;
    }
    case 'suprm': {
      const sv = supOfHotel(id); if (!sv) return;
      sv.hotelId = null;
      S.groups.forEach(g => { if (g.hotelId === id) g.supervisorId = null; });
      logIt('أُزيل المشرف ' + sv.name + ' عن ' + hotelById(id).ar, 'assign');
      toast(sv.name + ' عاد حرًّا', 'r');
      break;
    }

    /* ─── ٢) الليدر على المجموعة ─── */
    case 'gleadswap': {
      const g = groupById(id); if (!g) return;
      openPicker('glead', g.id, { title:'ليدر ' + g.no,
        note:'لا يقود الليدر أكثر من مجموعتين. من يخرج هنا يعود إلى قائمة الليدرز.',
        cands:leaders().filter(l => l.id !== g.leaderId && groupsOf(l.id).length < 2) });
      return;
    }
    case 'ghotel': {
      const g = groupById(id); if (!g) return;
      S.pendHotel = g.id;
      S.drawer = { title:'سكن ' + g.no, sub:'المشرف يتبع الفندق تلقائيًّا', icon:'i-key',
        body:'<div class="plist">' + HOTELS.map(h => {
          const sv = supOfHotel(h.id);
          return '<button class="prow pick' + (g.hotelId === h.id ? ' on' : '') + '" ' +
            'data-a="ghotelset" data-id="' + h.id + '">' +
            '<span class="ico">' + icon('i-key','s16') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(h.ar) + '</b>' +
            '<span>' + E(h.dist) + ' · ' + (sv ? 'المشرف ' + E(sv.name) : 'بلا مشرف') +
            '</span></span>' +
            pill(AR(S.groups.filter(x => x.hotelId === h.id).length) + ' مجموعة', 'grey') +
          '</button>';
        }).join('') + '</div>' };
      renderDrawer(); return;
    }
    case 'ghotelset': {
      const g = groupById(S.pendHotel); if (!g) return;
      g.hotelId = id;
      const sv = supOfHotel(id);
      g.supervisorId = sv ? sv.id : null;
      logIt('نُقلت ' + g.no + ' إلى ' + hotelById(id).ar, 'assign');
      toast('السكن ' + hotelById(id).ar + (sv ? ' — المشرف ' + sv.name : ' — بلا مشرف'));
      S.pendHotel = null; S.drawer = null;
      break;
    }
    case 'gnew': {
      const L = leaders().find(l => groupsOf(l.id).length < 2);
      if (!L) { toast('كل ليدر يقود مجموعتين', 'r'); return; }
      const o = orgById(L.orgId) || S.orgs[0];
      const g = { id:uid('G'), no:'GR-' + (101 + S.groups.length), leaderId:L.id,
        orgId:o.id, hotelId:null, supervisorId:null, members:[], at:now() };
      S.groups.push(g);
      logIt('أُنشئت مجموعة ' + g.no + ' بقيادة ' + L.name, 'assign');
      toast('أُنشئت ' + g.no + ' — أضف محسنيها وسكنها');
      break;
    }

    /* ─── ٣) المحسن في مقعده ─── */
    case 'mseatin': {
      const g = groupById(id); if (!g) return;
      if (g.members.length >= 5) { toast('المجموعة مكتملة', 'r'); return; }
      openPicker('mseat', g.id, { title:'مقعد في ' + g.no,
        note:'المتاحون وحدهم — ومعهم الاحتياط، فهو مشترك بين كل الفرق.',
        cands:freeMuhsens().concat(reserveTeam()) });
      return;
    }
    case 'mseatout': S.q.sout = ''; S.q.soutr = ''; seatOutAsk(id, v); return;
    case 'staffopen': staffDrawer(id); return;
    case 'logout': S.auth = false; S.drawer = null; save(); render();
      toast('خرجتَ من الغرفة'); return;
    case 'grole': S.gate = S.gate || {}; S.gate.perm = v; save(); renderGate(); return;
    case 'pgtog': {
      const k = b.dataset.k;
      S.grants[k] = S.grants[k] || [];
      const i = S.grants[k].indexOf(v);
      if (i >= 0) S.grants[k].splice(i, 1); else S.grants[k].push(v);
      logIt((i >= 0 ? 'مُنعت' : 'مُنحت') + ' شاشة «' + (navOf(v) || {}).l +
        '» لصفة ' + permOf(k).ar, 'info');
      break;
    }
    case 'pgall': {
      S.grants[v] = navItems().map(x => x.k).filter(x => x !== 'perms');
      logIt('مُنحت كل الشاشات لصفة ' + permOf(v).ar, 'info');
      toast('مُنحت كل الشاشات — بلا تعديل'); break;
    }
    case 'pgdef': {
      delete S.grants[v];
      logIt('أُعيدت صفة ' + permOf(v).ar + ' إلى صلاحياتها الافتراضية', 'info');
      toast('عادت إلى الافتراضي — ' + AR(grantsOf(v).length) + ' شاشة'); break;
    }
    case 'pgnone': {
      S.grants[v] = [];
      logIt('مُنعت كل الشاشات عن صفة ' + permOf(v).ar, 'info');
      toast('لن ترى هذه الصفة شيئًا', 'r'); break;
    }
    case 'gin': {
      const g = S.gate || { perm:'admin' };
      S.actor = { perm:g.perm, orgId:g.orgId, hotelId:g.hotelId,
        leaderId:g.leaderId, userId:g.userId };
      S.auth = true;
      const first = allowed()[0];
      S.route = { n: first || 'ops' };
      save(); render();
      toast('دخلتَ بصفة ' + curPerm().ar + ' — ' + SCOPE_AR[curPerm().scope]);
      return;
    }
    /* المنتقي: من يُسنَد إليه */
    case 'pickdo': {
      const p = S.picker; if (!p) return;
      const u = userById(id); if (!u) return;
      applyPick(p.kind, p.id, u);
      S.picker = null; S.drawer = null;
      break;
    }
    /* اعتماد دليل: النسخة تُرفع والتطبيق يقرأ المعتمد وحده */
    case 'gpub': {
      const g = S.guides.find(x => x.id === id); if (!g) return;
      g.status = 'معتمد'; g.ver += 1; g.at = now();
      logIt('اعتُمدت النسخة ' + AR(g.ver) + ' من دليل ' + (CAT[g.kind] || {}).ar, 'guide');
      toast('نُشر الدليل — يقرؤه الميدان الآن');
      break;
    }
    /* بثّ رسالة */
    case 'castsend': {
      const t = (S.q.ct || '').trim(), y = (S.q.cb || '').trim();
      if (!t) { toast('اكتب عنوانًا يُقرأ في الإشعار', 'r'); return; }
      const dest = S.tab.cdest || 'muhsen';
      const aud = S.tab['caud_' + dest] || 'all';
      const of = audN(dest, aud) || 1;
      const toAr = audAr(dest, aud);
      S.casts.unshift({ id: uid('C'), no: 'BR-' + (9100 + S.casts.length),
        dest, aud, to: toAr, title: t, body: y || '—',
        kind: S.tab.ck || 'عادي', seen: 0, of, at: now() });
      logIt('بُثّت «' + t + '» إلى ' + CAST_DEST[dest].ar + ' — ' + toAr +
        ' (' + AR(of) + ' مستلمًا)', 'cast');
      S.q.ct = ''; S.q.cb = '';
      toast('بُثّت إلى ' + AR(of) + ' مستلمًا في ' + CAST_DEST[dest].ar);
      break;
    }
    case 'castclear': S.q.ct = ''; S.q.cb = ''; break;
    /* ─── تخصيص اللوحة ─── */
    case 'dashedit': dashEdit(); return;
    case 'dashtog': {
      const cur = dashKeys();
      const i = cur.indexOf(v);
      if (i >= 0) cur.splice(i, 1); else cur.push(v);
      S.dash = cur; save(); dashEdit(); return;
    }
    case 'dashoff': {
      S.dash = dashKeys().filter(x => x !== v); save(); dashEdit(); return;
    }
    case 'dashup': {
      const c = dashKeys(), i = Number(v);
      const t = c[i - 1]; c[i - 1] = c[i]; c[i] = t;
      S.dash = c; save(); dashEdit(); return;
    }
    case 'dashdn': {
      const c = dashKeys(), i = Number(v);
      const t = c[i + 1]; c[i + 1] = c[i]; c[i] = t;
      S.dash = c; save(); dashEdit(); return;
    }
    case 'dashreset': {
      S.dash = DASH_DEFAULT.slice(); save(); dashEdit();
      toast('عادت اللوحة إلى الافتراضي'); return;
    }
    case 'cfgtog': {
      S.cfg[v] = S.cfg[v] === false;
      logIt('غُيّر إعداد «' + v + '» إلى ' + (S.cfg[v] === false ? 'مطفأ' : 'مشغّل'), 'info');
      break;
    }
    case 'cfgsave': {
      S.cfg.name = (S.q.cfgname || '').trim() || 'مُحسن · الكنترول';
      S.cfg.season = (S.q.cfgseason || '').trim() || 'موسم حج ١٤٤٨ هـ';
      S.cfg.theme = S.tab.cfgtheme || 'sys';
      logIt('حُفظت إعدادات الموقع', 'info');
      toast('حُفظت'); break;
    }
    /* الشِفتات */
    case 'swok': {
      const w = S.swaps.find(x => x.id === id); if (!w) return;
      w.state = 'done'; w.reason = 'اعتُمد — وأُبلغ الطرفان';
      const a = userById(w.from) || {}, c = userById(w.to) || {};
      logIt('اعتُمد تبديل وردية بين ' + (a.name || '') + ' و' + (c.name || ''), 'shift');
      toast('اعتُمد التبديل');
      break;
    }
    case 'swno': {
      const w = S.swaps.find(x => x.id === id); if (!w) return;
      w.state = 'no'; w.reason = 'الوردية لا تحتمل نقصًا في هذا اليوم';
      logIt('رُفض طلب تبديل ' + w.no + ' — الوردية لا تحتمل نقصًا', 'shift');
      toast('رُفض الطلب — وسُجّل السبب', 'r');
      break;
    }

    case 'spok': {
      const s = S.support.find(x => x.id === id);
      if (!s || s.state !== 'pending') break;
      const t = taskById(s.taskId);
      const pool = reserveTeam().filter(m => t && t.assigned.indexOf(m.id) < 0);
      const take = pool.slice(0, s.count);
      if (t) take.forEach(m => t.assigned.push(m.id));
      s.state = 'done'; s.at2 = now();
      s.reason = 'توفّر ' + AR(take.length) + ' محسن في الاحتياط ضمن نطاق المهمة بلا تعارض في أوقاتهم.';
      pushFeed('ok', 'لُبّي طلب دعم',
        (t ? t.kt + ' · ' + t.title : '') + ' — أُسند ' + AR(take.length) + ' محسن');
      logIt('لُبّي طلب الدعم ' + s.no + ' بإسناد ' + AR(take.length) + ' محسن من الاحتياط', 'ok');
      toast('أُسند ' + AR(take.length) + ' محسن من الاحتياط');
      break;
    }
    case 'spno': {
      const s = S.support.find(x => x.id === id);
      if (!s || s.state !== 'pending') break;
      s.state = 'denied'; s.at2 = now();
      s.reason = 'لا يتوفّر محسن غير مرتبط في هذا التوقيت — أعد التوزيع من فريقك.';
      pushFeed('warn', 'اعتُذر عن طلب دعم', s.no + ' — لا احتياط متاح في التوقيت');
      logIt('اعتُذر عن طلب الدعم ' + s.no, 'warn');
      toast('أُبلغ الليدر بالاعتذار', 'r');
      break;
    }
    case 'roomapply': {
      const r = S.reports.find(x => x.id === id);
      if (!r || !r.room) break;
      r.status = 'مغلق'; r.applied = now();
      const arr = S.pilgrims[r.kt] || [];
      if (arr[0]) { arr[0].floor = r.room.floor; arr[0].room = r.room.no; }
      pushFeed('ok', 'حُدِّثت بيانات غرفة', r.kt + ' · ' + r.room.floor + ' · غرفة ' + r.room.no);
      logIt('حُدِّثت بيانات الغرفة من التقرير ' + r.no, 'ok');
      toast('حُدِّثت قاعدة البيانات');
      break;
    }
    case 'clock':
      S.clockOffset = v === '0' ? 0 : (S.clockOffset || 0) + Number(v);
      toast(S.clockOffset ? 'الإزاحة ' + AR(S.clockOffset) + ' دقيقة' : 'عاد الوقت الحقيقي');
      break;
    case 'reset': reset(); return;
    default: return;
  }
  render();
});

/* لوحة المفاتيح: تنقّل سريع بالأرقام */
document.addEventListener('keydown', e => {
  if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
  if (e.key >= '1' && e.key <= '9') {
    const it = navItems()[Number(e.key) - 1];
    if (it) { S.route = { n: it.k }; render(); }
  }
  if (e.key === 'b' || e.key === 'B') { S.wide = !S.wide; render(); }
});

/* ---------- إقلاع ---------- */
load();
if (!S.theme) {
  S.theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'day' : 'night';
}
applyTheme();
render();
