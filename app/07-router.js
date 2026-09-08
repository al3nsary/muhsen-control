/* ============================================================
   المُوجِّه والأحداث
   ============================================================ */
const SCREENS = {
  ops: screenOps, tasks: screenTasks, build: screenBuild, assign: screenAssign, staff: screenStaff, incidents: screenIncidents,
  support: screenSupport, reports: screenReports, tickets: screenTickets, shifts: screenShifts,
  teams: screenTeams, reserve: screenReserve, pilgrims: screenPilgrims, quality: screenQuality,
  guides: screenGuides, broadcast: screenBroadcast, audit: screenAudit, settings: screenSettings,
  timeline: screenTimeline, perms: screenPerms,
  afasha: screenAfasha, transport: screenTransport
};

/* أفعال لا تُغيّر شيئًا — مسموحة لكل صفة */
const READ_ACTS = ['go','gokid','grp','whoami','wide','wall','wallauto','theme','palette','closepal','palrun',
  'closedrawer','shortcuts','timeline','tlopen','seg','sort','ktopen','pilopen','gdview','tropen','copen','whoami','dashedit','dashtog',
  'dashoff','dashup','dashdn','dashreset',
  'fdash','fsub','staffopen','qclear','fclear','logout','grole','gin','nopen','tkopen2',
  'rpopen','bedit','bclear','clock'];

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
    case 'wide': S.wide = !S.wide; break;
    case 'wall': S.wall = !S.wall; if (!S.wall) S.wallAuto = false;
      toast(S.wall ? 'جدار العرض — Esc أو F للخروج' : 'عاد العرض العادي'); break;
    case 'wallauto': S.wallAuto = !S.wallAuto;
      toast(S.wallAuto ? 'يدور بين اللوحات كل ١٢ ثانية' : 'أُوقف الدوران'); break;
    case 'theme': toggleTheme(); break;
    case 'palette': S.palette = true; S.pq = ''; S.psel = 0; renderPalette(); return;
    case 'closepal': S.palette = false; renderPalette(); return;
    case 'palrun': runPalette(Number(v)); return;
    case 'closedrawer': S.drawer = null; S.picker = null; renderDrawer(); return;
    case 'shortcuts': showShortcuts(); return;
    case 'timeline': S.route = { n: 'timeline' }; break;
    case 'tlopen': taskDrawer(id); return;
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

    /* ─── العفاشة ─── */
    case 'cnew': S.q.cn = ''; S.q.cc = ''; S.q.cp = ''; S.q.cw = ''; contractorNew(); return;
    case 'copen': contractorDrawer(id); return;
    case 'csave': {
      const n = (S.q.cn || '').trim(), co = (S.q.cc || '').trim(), ph = (S.q.cp || '').trim();
      if (!n || !ph) { toast('الاسم ورقم الجوال لا بدّ منهما', 'r'); return; }
      const seq = 401 + S.contractors.length;
      const c = { id:uid('CT'), name:n, company:co || '—',
        workers:Number(String(S.q.cw || '').replace(/\D/g, '')) || 10, phone:ph,
        user:'afasha' + seq, pass:'MC' + (7100 + S.contractors.length * 13),
        sms:'queued', smsAt:now(), at:now() };
      S.contractors.unshift(c);
      /* الرسالة تُرسَل فورًا، وحالتها تُحدَّث بعد لحظات كما في المزوّد */
      sendSms(c);
      logIt('أُضيف المقاول ' + n + ' وأُرسلت بيانات دخوله', 'info');
      S.drawer = null; toast('أُضيف — وأُرسلت رسالته');
      break;
    }
    case 'csms': {
      const c = contractorById(id); if (!c) return;
      c.sms = 'queued'; c.smsAt = now(); sendSms(c);
      logIt('أُعيد إرسال بيانات الدخول إلى ' + c.name, 'info');
      toast('أُعيد الإرسال');
      break;
    }
    case 'cdeal': dealNew(id); return;
    case 'dsend': {
      const c = contractorById(S.pendDeal); if (!c) return;
      const d = mkDeal(c, 'sent');
      logIt('أُرسل عقد ' + d.no + ' إلى ' + c.name, 'info');
      S.drawer = null; S.pendDeal = null;
      toast('أُرسل العقد — بانتظار ردّه');
      break;
    }
    case 'doffline': {
      const c = contractorById(S.pendDeal); if (!c) return;
      const d = mkDeal(c, 'offline');
      d.reason = 'وُقّع خارج النظام واعتمده الكنترول';
      logIt('اعتُمد عقد ' + d.no + ' مع ' + c.name + ' — وُقّع خارج النظام', 'info');
      S.drawer = null; S.pendDeal = null;
      toast('اعتُمد العقد');
      break;
    }
    case 'cagree': {
      const d = dealById(id); if (!d) return;
      const own = curPerm().scope === 'deal';
      d.state = 'agreed';
      d.reason = own ? 'قبله المقاول من حسابه' : 'وافق الكنترول نيابةً عنه';
      d.actAt = now();
      logIt('قُبل عقد ' + d.no + ' — ' + d.reason, 'info');
      toast('قُبل العقد');
      break;
    }
    case 'crefuse': {
      const d = dealById(id); if (!d) return;
      d.state = 'refused';
      d.reason = curPerm().scope === 'deal' ? 'رفضه المقاول' : 'سُجّل رفضه';
      d.actAt = now();
      logIt('رُفض عقد ' + d.no, 'info');
      toast('سُجّل الرفض', 'r');
      break;
    }

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
    case 'fclear': { const k = b.dataset.k; S.flt[k] = {}; S.q[k] = ''; break; }

    /* ─── نُسك: فتح حالة ─── */
    case 'nfsvc':  S.nform = S.nform || {}; S.nform.svc = v; nusukNew(); return;
    case 'nfpil':  S.nform = S.nform || {}; S.nform.pid = id; nusukNew(); return;
    case 'nfclr':  S.nform.pid = ''; S.q.npil = ''; nusukNew(); return;
    case 'nfsave': {
      const d = S.nform || {};
      if (!d.pid) { toast('اختر الحاجّ أوّلًا — ابحث باسمه أو رقم جوازه', 'r'); return; }
      const p = allPilgrimRows().find(x => x.id === d.pid); if (!p) return;
      const L = leaders().find(l => l.kt === p.kt) || {};
      const f = (S.files || {}).nusukNew || null;
      const c = { id:uid('N'), no:'NS-' + (4400 + S.nusuk.length), svc:d.svc || 'lost',
        pilgrimId:p.id, pilgrim:p.name, passport:p.no, kt:p.kt, leaderId:L.id || null,
        openedBy:'الكنترول', state:'new', step:1, assignedTo:null, at:now(),
        note:(S.q.nnote || '').trim() || 'حالة فُتحت من غرفة العمليات',
        trail:[{ at:now(), by:'الكنترول', text:'فُتحت الحالة', file:f }] };
      S.nusuk.unshift(c);
      logIt('فُتحت حالة ' + NUSUK_SVC[c.svc].ar + ' للحاجّ ' + p.name + ' — ' + p.kt, 'info');
      S.nform = null; S.q.nnote = ''; S.q.npil = '';
      if (S.files) delete S.files.nusukNew;
      S.drawer = null; save(); render(); nusukDrawer(c.id);
      toast('فُتحت ' + c.no + ' — أسندها الآن');
      return;
    }
    case 'nopen': nusukDrawer(id); return;
    case 'nnew':  S.nform = { svc:'lost', pid:'', note:'' }; nusukNew(); return;
    case 'nassign': {
      const c = S.nusuk.find(x => x.id === id); if (!c) return;
      openPicker('nusuk', c.id, { title:'إسناد ' + c.no,
        note:'المرشّحون: فريق ' + c.kt + ' وليدره والاحتياط.',
        cands:candFor('nusuk', c) });
      return;
    }
    case 'nstep': {
      const c = S.nusuk.find(x => x.id === id); if (!c) return;
      const SV = NUSUK_SVC[c.svc];
      if (c.step >= SV.steps.length) { toast('بلغت آخر خطوة — أنهِ الحالة', 'r'); return; }
      const note = (S.q.nstepnote || '').trim();
      const f = (S.files || {}).nusukStep || null;
      c.trail = c.trail || [];
      c.trail.push({ at:now(), by:'الكنترول',
        text:SV.steps[c.step] + (note ? ' — ' + note : ''), file:f });
      c.step += 1;
      c.state = c.step >= SV.steps.length ? 'issued'
        : c.step >= 2 ? 'processing' : 'new';
      S.q.nstepnote = ''; if (S.files) delete S.files.nusukStep;
      logIt(c.no + ' — ' + SV.steps[c.step - 1], 'info');
      save(); nusukDrawer(c.id); toast(NUSUK_STATE[c.state].ar);
      return;
    }
    case 'nclose': {
      const c = S.nusuk.find(x => x.id === id); if (!c) return;
      c.state = 'delivered'; c.step = NUSUK_SVC[c.svc].steps.length;
      c.trail = c.trail || [];
      c.trail.push({ at:now(), by:'الكنترول', text:'أُنهيت الحالة وسُلّمت', file:null });
      logIt('أُنهيت ' + c.no + ' — ' + NUSUK_SVC[c.svc].ar, 'info');
      save(); nusukDrawer(c.id); toast('أُنهيت الحالة');
      return;
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
        note:'المتاحون وحدهم — من دخل مجموعةً خرج من هذه القائمة.',
        cands:freeMuhsens() });
      return;
    }
    case 'mseatout': {
      const g = groupById(id); if (!g) return;
      const u = userById(v);
      g.members = g.members.filter(m => m.id !== v);
      if (u) { u.groupId = null; u.leaderId = null; u.kt = '—'; }
      S.tasks.forEach(t => { if (t.leaderId === g.leaderId)
        t.assigned = (t.assigned || []).filter(x => x !== v); });
      logIt('أُخرج ' + ((u || {}).name || '') + ' من ' + g.no, 'assign');
      toast(((u || {}).name || '') + ' عاد إلى المتاحين', 'r');
      break;
    }
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
        leaderId:g.leaderId, userId:g.userId, contractorId:g.contractorId };
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
