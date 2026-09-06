/* ============================================================
   المُوجِّه والأحداث
   ============================================================ */
const SCREENS = {
  ops: screenOps, tasks: screenTasks, build: screenBuild, incidents: screenIncidents,
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

  document.getElementById('railwrap').innerHTML = rail();
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
    case 'closedrawer': S.drawer = null; renderDrawer(); return;
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
    case 'xassign': {
      const x = S.enrich.find(e => e.id === id); if (!x) return;
      /* تُسكَّن على المجموعة الأقلّ حِملًا في ذلك اليوم */
      const load = {};
      S.groups.forEach(g => { load[g.leaderId] = S.enrich.filter(e =>
        e.leaderId === g.leaderId && dayStart(e.start) === dayStart(x.start)).length; });
      const pick = S.groups.slice().sort((a, b) => (load[a.leaderId] || 0) - (load[b.leaderId] || 0))[0];
      if (!pick) { toast('لا مجموعة مشكَّلة بعد', 'r'); return; }
      const L = userById(pick.leaderId) || {};
      x.leaderId = pick.leaderId; x.kt = L.kt; x.status = 'assigned';
      logIt('سُكِّنت رحلة ' + x.ref + ' — ' + siteById(x.siteId).ar + ' على ' + L.kt, 'assign');
      toast('سُكِّنت على ' + L.kt + ' — الأقلّ حِملًا ذلك اليوم');
      break;
    }

    /* ─── نُسك ─── */
    case 'nnew': {
      const L = leaders()[S.nusuk.length % leaders().length];
      const arr = S.pilgrims[L.kt] || [];
      const p = arr[(S.nusuk.length * 37) % Math.max(1, arr.length)];
      if (!p) return;
      S.nusuk.unshift({ id: uid('N'), no: 'NS-' + AR(4400 + S.nusuk.length), svc: 'lost',
        pilgrimId: p.id, pilgrim: p.name, passport: p.no, kt: L.kt, leaderId: L.id,
        openedBy: 'الكنترول', state: 'new', step: 1, assignedTo: null, at: now(),
        note: 'حالة فُتحت من غرفة العمليات — تحتاج تحديد الخدمة' });
      logIt('فُتحت حالة نُسك جديدة للحاجّ ' + p.name + ' — ' + L.kt, 'info');
      toast('فُتحت حالة — أسندها لمحسن أو ليدر');
      break;
    }
    case 'nassign': {
      const c = S.nusuk.find(x => x.id === id); if (!c) return;
      /* الأولوية لمحسن من مجموعة الحاجّ، فإن لم يوجد فالاحتياط */
      const team = teamOf(c.leaderId);
      const who = team[c.no.length % Math.max(1, team.length)] || reserveTeam()[0] || userById(c.leaderId);
      if (!who) { toast('لا محسن متاح', 'r'); return; }
      c.assignedTo = who.id;
      logIt('أُسندت ' + c.no + ' (' + NUSUK_SVC[c.svc].ar + ') إلى ' + who.name, 'assign');
      toast('أُسندت إلى ' + who.name);
      break;
    }
    case 'nstep': {
      const c = S.nusuk.find(x => x.id === id); if (!c) return;
      const V = NUSUK_SVC[c.svc];
      c.step = Math.min(V.steps.length, c.step + 1);
      c.state = c.step >= V.steps.length ? 'delivered'
        : c.step >= V.steps.length - 1 ? 'issued'
        : c.step >= 2 ? 'processing' : 'new';
      logIt(c.no + ' — ' + V.steps[Math.min(c.step, V.steps.length) - 1], 'info');
      toast(NUSUK_STATE[c.state].ar);
      break;
    }

    /* ─── الامتثال ─── */
    case 'fnew': toast('بناء القالب يأتي بعد أن نتفق على أنواع الأسئلة'); return;
    case 'fassign': {
      const f = formById(id); if (!f) return;
      logIt('أُسند قالب «' + f.title + '» إلى كل المجموعات', 'info');
      toast('أُسند إلى ' + AR(S.groups.length) + ' مجموعات');
      break;
    }

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
