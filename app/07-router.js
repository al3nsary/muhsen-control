/* ============================================================
   المُوجِّه والأحداث
   ============================================================ */
const SCREENS = {
  ops: screenOps, tasks: screenTasks, build: screenBuild, staff: screenStaff, incidents: screenIncidents,
  support: screenSupport, reports: screenReports, tickets: screenTickets, shifts: screenShifts,
  teams: screenTeams, reserve: screenReserve, pilgrims: screenPilgrims, quality: screenQuality,
  guides: screenGuides, broadcast: screenBroadcast, audit: screenAudit, settings: screenSettings,
  timeline: screenTimeline
};

function render() {
  const n = S.route.n;
  const fn = SCREENS[n] || screenOps;
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
    case 'gview': guideDrawer(id); return;
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
        g = { id: uid('G'), no: 'GR-' + AR(101 + S.groups.length), at: now() };
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
      const d = S.nform || {}; if (!d.pid) return;
      const p = allPilgrimRows().find(x => x.id === d.pid); if (!p) return;
      const L = leaders().find(l => l.kt === p.kt) || {};
      const f = (S.files || {}).nusukNew || null;
      const c = { id:uid('N'), no:'NS-' + AR(4400 + S.nusuk.length), svc:d.svc || 'lost',
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
      const V = NUSUK_SVC[c.svc];
      if (c.step >= V.steps.length) { toast('بلغت آخر خطوة — أنهِ الحالة', 'r'); return; }
      const note = (S.q.nstepnote || '').trim();
      const f = (S.files || {}).nusukStep || null;
      c.trail = c.trail || [];
      c.trail.push({ at:now(), by:'الكنترول',
        text:V.steps[c.step] + (note ? ' — ' + note : ''), file:f });
      c.step += 1;
      c.state = c.step >= V.steps.length ? 'issued'
        : c.step >= 2 ? 'processing' : 'new';
      S.q.nstepnote = ''; if (S.files) delete S.files.nusukStep;
      logIt(c.no + ' — ' + V.steps[c.step - 1], 'info');
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
      const q = (S.q.fbq || '').trim(); if (!q) { toast('اكتب نصّ السؤال', 'r'); return; }
      S.fb.qs.push({ id:'q' + (S.fb.qs.length + 1), q,
        t:fOf('fb','qt') || 'yn', w:Number(fOf('fb','qw') || 2) });
      S.q.fbq = ''; formBuilder(); return;
    }
    case 'fbdel': S.fb.qs.splice(Number(v), 1); formBuilder(); return;
    case 'fbsave': {
      const b2 = S.fb; if (!b2.title || !b2.qs.length) return;
      if (b2.editing) {
        const f = formById(b2.editing);
        Object.assign(f, { title:b2.title, scope:b2.scope, qs:b2.qs });
        logIt('عُدِّل قالب «' + f.title + '»', 'guide');
      } else {
        S.forms.push({ id:uid('F'), no:'FM-' + AR(201 + S.forms.length), title:b2.title,
          scope:b2.scope, icon:'i-clip', color:'#0B7A4B', by:'ctl', at:now(), qs:b2.qs });
        logIt('أُنشئ قالب «' + b2.title + '» بـ' + AR(b2.qs.length) + ' أسئلة', 'guide');
      }
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

    /* ─── تسكين المشرف على فندق ─── */
    case 'supassign': {
      openPicker('sup', id, { title:'من يُشرف على ' + hotelById(id).ar,
        note:'المشرف يتبع الفندق — وتحته كل مجموعة تسكنه.',
        cands:supervisors() });
      return;
    }
    case 'staffopen': staffDrawer(id); return;
    case 'logout': S.auth = false; S.drawer = null; save(); render();
      toast('خرجتَ من الغرفة'); return;
    case 'grole': S.gateRole = v; save(); renderGate(); return;
    case 'gin': S.auth = true; save(); render();
      toast('أهلًا — ' + (GATE_ROLES.find(x => x.k === (S.gateRole || 'ctl')) || {}).l); return;
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
      const to = S.tab.aud || CAST_AUD[0];
      const of = to.indexOf('الليدرز') >= 0 ? leaders().length
        : to.indexOf('الاحتياطي') >= 0 ? reserveTeam().length
        : to.indexOf('كل المحسنين') >= 0 ? S.users.filter(u => u.role === 'muhsen' && !u.reserve).length
        : 5;
      S.casts.unshift({ id: uid('C'), no: 'BR-' + AR(9100 + S.casts.length),
        to, title: t, body: y || '—', kind: S.tab.ck || 'عادي', seen: 0, of, at: now() });
      logIt('بُثّت رسالة «' + t + '» إلى ' + to, 'cast');
      S.q.ct = ''; S.q.cb = '';
      toast('بُثّت إلى ' + to);
      break;
    }
    case 'castclear': S.q.ct = ''; S.q.cb = ''; break;
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
