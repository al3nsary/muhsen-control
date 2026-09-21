/* ============================================================
   الحركة والتفاعل — طبقة تعمل بعد كل رسم
   كل حركة هنا لها سبب وظيفي: تُسرّع القراءة أو تدلّ على تغيّر.
   ============================================================ */

/* ---------- الوضع الليلي والنهاري ---------- */
function applyTheme() {
  const t = S.theme || 'night';
  document.documentElement.setAttribute('data-theme', t);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', t === 'day' ? '#F4F7F3' : '#060C09');
}
function toggleTheme() {
  S.theme = (S.theme === 'day') ? 'night' : 'day';
  applyTheme(); save();
  toast(S.theme === 'day' ? 'الوضع النهاري' : 'الوضع الليلي');
}

/* ---------- عدّ تصاعدي للأرقام ---------- */
function countUp(el) {
  const raw = el.getAttribute(String.fromCharCode(100,97,116,97,45,110));
  if (raw == null || raw === '') return;   /* بلا رقم: يُترك النص كما هو */
  const target = Number(raw);
  if (!isFinite(target)) return;
  const dec = /\./.test(raw) ? 1 : 0;
  const suffix = el.getAttribute('data-suffix') || '';
  const write = v => { el.textContent = AR(dec ? v.toFixed(1) : Math.round(v)) + suffix; };
  /* من طلب تقليل الحركة يرى الرقم النهائي فورًا */
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    write(target); return;
  }
  const dur = 850, t0 = performance.now();
  function step(t) {
    const p = Math.max(0, Math.min(1, (t - t0) / dur));   /* لا تقدّم سالبًا */
    write(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- ضوء يتبع المؤشّر على البطاقات ---------- */
/* مستمعٌ واحد مفوَّض لا مستمعٌ لكل بطاقة، ومحبوسٌ بإطار الرسم:
   كان كل تحريك للمؤشّر يكتب متغيّرين فيُعيد حساب الأنماط على شجرةٍ
   فيها آلاف العقد — فيثقل الماوس. الآن كتابةٌ واحدة في الإطار الواحد. */
let lightPend = null;
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.card');
  if (!c) return;
  if (lightPend) return;
  const x = e.clientX, y = e.clientY;
  lightPend = requestAnimationFrame(() => {
    lightPend = null;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', ((x - r.left) / r.width * 100).toFixed(1) + '%');
    c.style.setProperty('--my', ((y - r.top) / r.height * 100).toFixed(1) + '%');
  });
}, { passive: true });
function bindPointerLight() { /* لم يعد يُربط شيء: المستمع أعلاه يكفي الجميع */ }

/* ---------- موجة ضغط على الأزرار ---------- */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest && e.target.closest('.btn');
  if (!b) return;
  const r = b.getBoundingClientRect();
  const i = document.createElement('i');
  i.className = 'rip';
  i.style.left = (e.clientX - r.left) + 'px';
  i.style.top = (e.clientY - r.top) + 'px';
  b.appendChild(i);
  setTimeout(() => i.remove(), 560);
});

/* ---------- مؤشّر السكة الذهبي ينتقل بين الأزرار ---------- */
function moveRailMark() {
  const rail = document.querySelector('.rail'); if (!rail) return;
  let mark = rail.querySelector('.railmark');
  if (!mark) { mark = document.createElement('span'); mark.className = 'railmark'; rail.appendChild(mark); }
  const on = rail.querySelector('button.on');
  if (!on) { mark.style.opacity = 0; return; }
  const r = rail.getBoundingClientRect(), b = on.getBoundingClientRect();
  mark.style.opacity = 1;
  mark.style.top = (b.top - r.top + 12) + 'px';
  mark.style.height = (b.height - 24) + 'px';
}

/* ---------- تعبئة الأشرطة بعد الرسم ---------- */
function fillMeters(root) {
  root.querySelectorAll('.meter i[data-w], .bar2 i[data-w]').forEach(i => {
    requestAnimationFrame(() => { i.style.width = i.getAttribute('data-w') + '%'; });
  });
}

/* ---------- طبقة ما بعد الرسم ---------- */
/* الأعمدة تبدأ من الصفر ثم تنمو — الارتفاع يُكتب بعد الرسم لا معه */
function growBars(root) {
  requestAnimationFrame(() => {
    (root || document).querySelectorAll('.bar[data-h]').forEach(b => {
      b.style.height = b.dataset.h + '%';
    });
  });
}

/* عمق التمرير: الشريط العلوي يعرف أن تحته محتوى */
function bindScrollDepth(wrap) {
  const v = wrap.querySelector('.view'), top = wrap.querySelector('.top');
  if (!v || !top) return;
  const on = () => top.classList.toggle('deep', v.scrollTop > 6);
  v.addEventListener('scroll', on, { passive: true });
  on();
}

/* التلاشي يليق بما يفيض وحده — فيُقاس بعد الرسم ويُرفع عمّا اكتمل */
function markFull(root) {
  (root || document).querySelectorAll('.wbody').forEach(b => {
    b.classList.toggle('full', b.scrollHeight <= b.clientHeight + 2);
  });
}

function afterRender() {
  const wrap = document.getElementById('stagewrap');
  requestAnimationFrame(() => markFull(wrap));
  wrap.querySelectorAll('[data-n]').forEach(countUp);
  bindPointerLight(wrap);
  fillMeters(wrap);
  growBars(wrap);
  bindScrollDepth(wrap);
  moveRailMark();
}

/* ============================================================
   لوحة الأوامر — Ctrl/⌘ + K
   ============================================================ */
function paletteItems() {
  const out = navItems().map(x => ({
    k: 'nav:' + x.k, t: x.l, s: x.d, i: x.i, run: () => { S.route = { n: x.k }; }
  }));
  out.push(
    { k:'act:theme', t: (S.theme === 'day' ? 'الوضع الليلي' : 'الوضع النهاري'),
      s:'تبديل هوية الواجهة', i:'i-sun', run: toggleTheme },
    { k:'act:wall', t:'جدار العرض', s:'ملء الشاشة — يدور بين اللوحات', i:'i-target',
      run: () => { S.wall = !S.wall; } },
    { k:'act:wide', t:'طيّ لوح التنقّل', s:'مساحة أوسع للمحتوى', i:'i-menu',
      run: () => { S.wide = !S.wide; } },
    { k:'act:reset', t:'إعادة ضبط البيانات', s:'تعود كل البيانات إلى حالتها الأولى', i:'i-reset',
      run: () => { reset(); } }
  );
  S.tasks.filter(t => t.start > now()).slice(0, 6).forEach(t => out.push({
    k: 'task:' + t.id, t: t.title, s: t.kt + ' · ' + hijri(t.start), i: 'i-tasks',
    run: () => { S.route = { n: 'tasks' }; }
  }));
  leaders().forEach(L => out.push({
    k: 'kt:' + L.id, t: L.kt + ' · ' + L.name, s: 'فريق ميداني', i: 'i-users',
    run: () => { S.route = { n: 'teams', id: L.id }; }
  }));
  return out;
}
const paletteMatch = (it, q) => !q || (it.t + ' ' + it.s).toLowerCase().indexOf(q.toLowerCase()) >= 0;

function renderPalette() {
  const w = document.getElementById('overlay');
  if (!S.palette) { w.innerHTML = ''; return; }
  const q = S.pq || '';
  const list = paletteItems().filter(it => paletteMatch(it, q)).slice(0, 9);
  S._pl = list;
  const sel = Math.min(S.psel || 0, Math.max(0, list.length - 1));
  w.innerHTML = '<div class="scrim" data-a="closepal"></div>' +
    '<div class="palette" role="dialog" aria-label="لوحة الأوامر">' +
      '<div class="pin">' + icon('i-search','s18') +
        '<input id="pq" placeholder="اكتب للبحث في الأقسام والمهام والفرق…" value="' + E(q) + '" autocomplete="off">' +
        '<span class="kbd">Esc</span></div>' +
      '<div class="res">' + (list.length ? list.map((it, i) =>
        '<button class="pit' + (i === sel ? ' sel' : '') + '" data-a="palrun" data-v="' + i + '">' +
        icon(it.i, 's18') + '<b>' + E(it.t) + '</b><span>' + E(it.s) + '</span></button>').join('')
        : '<div class="empty" style="padding:26px">' + icon('i-search','s26') +
          '<b>لا نتائج</b></div>') + '</div>' +
    '</div>';
  const inp = document.getElementById('pq');
  if (inp) { inp.focus(); try { inp.setSelectionRange(q.length, q.length); } catch (e) {} }
}
function runPalette(i) {
  const it = (S._pl || [])[i]; if (!it) return;
  S.palette = false; S.pq = ''; S.psel = 0;
  it.run();
  render();
}

/* ============================================================
   جدار العرض — يدور بين اللوحات
   ============================================================ */
const WALL_CYCLE = ['ops', 'incidents', 'tasks', 'support'];
let wallTimer = null;
function syncWall() {
  clearInterval(wallTimer); wallTimer = null;
  if (!S.wall || !S.wallAuto) return;   /* الدوران بطلبك لا بذاته */
  let i = Math.max(0, WALL_CYCLE.indexOf(S.route.n));
  wallTimer = setInterval(() => {
    if (!S.wall) { clearInterval(wallTimer); return; }
    i = (i + 1) % WALL_CYCLE.length;
    S.route = { n: WALL_CYCLE[i] };
    render();
  }, 12000);
}

/* ============================================================
   الدرج الجانبي — تفصيل بلا مغادرة الشاشة
   ============================================================ */
/* إعادة رسم الدرج المفتوح أيًّا كان — تُستدعى بعد تغيّر حالته */
let lastDrawer = null;
function repaintDrawer() { if (lastDrawer) lastDrawer(); }

/* مكدّس الرجوع: بعض الأدراج تفتح أدراجًا، وكان الخروج منها إغلاقًا تامًّا.
   كل فتحٍ جديد يُدفَع، و«رجوع» يسحب ويُعيد ما قبله. وإعادة رسم الدرج نفسه
   لا تُدفَع — وإلا امتلأ المكدّس بنسخٍ من الشيء ذاته. */
let dStack = [];
let dQuiet = false;
function drawerBack() {
  if (dStack.length < 2) { S.drawer = null; S.picker = null; renderDrawer(); return; }
  dStack.pop();
  const prev = dStack[dStack.length - 1];
  dQuiet = true; try { prev.run(); } finally { dQuiet = false; }
}
const drawerDepth = () => dStack.length;
/* كل فاتح درج يُلفّ مرّة: يحفظ نداءه ليُعاد بحرفه عند تغيّر الحالة */
['formBuilder','formAssign','ticketDrawer','reportDrawer',
 'staffDrawer','ktDrawer','taskDrawer','pilgrimDrawer','formDash','subDrawer',
 'guideEdit','guideView','tripDrawer',
 'whoDrawer','dashEdit','txReqNew','txTplPick','txFileNew','txNoteNew','txCloseAsk','appPreview','delegDrawer','rateDrawer','txPhoto','docView','hotelProfile','formSchedule','cmpAsgDrawer','pilgrimFull','cardStates','vgDrawer','quotaDrawer','quotaNew','taskReport','sigDrawer','sigNew','actDrawer','groupLog','seatOutAsk','orgEdit','hotelEdit','askWhy','swapAsk','warnDrawer','warnUser','warnNew','ctrDrawer','ctrFile','ctrNew','roleEdit'].forEach(n => {
  const f = window[n];
  if (typeof f !== 'function') return;
  /* كل الوسائط تُمرَّر لا الأوّل وحده: فاتحٌ بوسيطين (txPhoto, docView,
     seatOutAsk, pilFind…) كان يفقد ثانيه فيصمت ولا يفتح شيئًا — ولا يُبلغ. */
  window[n] = function () {
    const args = [].slice.call(arguments);
    const call = () => f.apply(null, args);
    lastDrawer = call;
    if (!dQuiet) {
      const sig = n + ':' + args.join('|');
      const top = dStack[dStack.length - 1];
      if (!top || top.sig !== sig) dStack.push({ sig, run: call });
      if (dStack.length > 12) dStack.shift();
    }
    return call();
  };
});
/* إغلاق الدرج يُفرغ المكدّس — فالرحلة انتهت */
function clearDrawerStack() { dStack = []; }

function renderDrawer() {
  const w = document.getElementById('drawerwrap');
  if (!S.drawer) { w.innerHTML = ''; return; }
  const d = S.drawer;
  /* كل طيّ أو تأشير يُعيد بناء الدرج، وكان يقذفك إلى أوّله. نحفظ الموضع
     ونعيده — ما دام الدرج نفسه لم يتبدّل. */
  const old = w.querySelector('.db');
  const keep = (old && S._dkey === d.title) ? old.scrollTop : 0;
  S._dkey = d.title;
  w.innerHTML = '<div class="scrim" data-a="closedrawer"></div>' +
    '<aside class="drawer' + (d.paper ? ' paper' : d.wide ? ' xl' : '') + '" role="dialog" aria-label="' + E(d.title) + '">' +
      '<div class="dh">' + icon(d.icon || 'i-info','s18') +
        '<span class="sp"><b style="font-size:15px">' +
          E(String(d.title || '').replace(/<[^>]*>/g, '')) + '</b>' +
        /* العنوان نصّ: نُجرّده من أي وسمٍ قبل تهريبه، فلو مرّر أحدهم
           LTR() أو pill() ظهر نصًّا نظيفًا لا ترميزًا حرفيًّا. */
        '<div class="tiny faint">' + E(String(d.sub || '').replace(/<[^>]*>/g, '')) +
        '</div></span>' +
        /* التقرير: يُفتح من رأس الدرج مباشرةً — فهو أكثر ما يُطلب */
        (d.report ? '<button class="iconbtn" data-a="trep" data-id="' + E(d.report) +
          '" aria-label="تقرير المهمة" title="تقرير المهمة">' + icon('i-report','s18') +
          '</button>' : '') +
        /* الرجوع: متى كان تحت هذا الدرج درجٌ فتحناه منه */
        (drawerDepth() > 1 ? '<button class="iconbtn" data-a="dback" aria-label="رجوع" ' +
          'title="رجوع">' + icon('i-fwd','s18') + '</button>' : '') +
        /* التوسيع: البيانات كثيرة، فالعرض يتبعها */
        (d.expand ? '<button class="iconbtn" data-a="txwide" data-id="' + E(d.expand) +
          '" aria-label="' + (d.wide ? 'تضييق' : 'توسيع') + '" title="' +
          (d.wide ? 'تضييق العرض' : 'توسيع العرض') + '">' +
          icon(d.wide ? 'i-fwd' : 'i-back','s18') + '</button>' : '') +
        '<button class="iconbtn" data-a="closedrawer" aria-label="إغلاق">' + icon('i-x','s18') + '</button></div>' +
      '<div class="db">' + d.body + '</div></aside>';
  /* الأشرطة تمتلئ بعد الرسم لا معه — وكانت تُملأ في المسرح وحده فتبقى
     أشرطة الدرج فارغة مهما كانت قيمتها. */
  const db = w.querySelector('.db');
  if (db) { if (keep) db.scrollTop = keep; fillMeters(db); growBars(db); }
}
function openDrawer(title, sub, icon_, body) {
  S.drawer = { title, sub, icon: icon_, body };
  renderDrawer();
}

/* ============================================================
   اختصارات لوحة المفاتيح
   ============================================================ */
document.addEventListener('keydown', e => {
  const typing = e.target && /input|textarea|select/i.test(e.target.tagName);

  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault(); S.palette = !S.palette; S.pq = ''; S.psel = 0; renderPalette(); return;
  }
  if (S.palette) {
    if (e.key === 'Escape') { S.palette = false; renderPalette(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); S.psel = (S.psel || 0) + 1; renderPalette(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); S.psel = Math.max(0, (S.psel || 0) - 1); renderPalette(); return; }
    if (e.key === 'Enter') { e.preventDefault(); runPalette(S.psel || 0); return; }
    return;
  }
  if (S.drawer && e.key === 'Escape') { S.drawer = null; renderDrawer(); return; }
  /* Esc مخرج عام: من الجدار أولًا، ثم إلى لوحة العمليات */
  if (e.key === 'Escape') {
    if (S.wall) { S.wall = false; S.wallAuto = false; render(); return; }
    if (S.wide) { S.wide = false; render(); return; }
    if (S.route.n !== 'ops') { S.route = { n: 'ops' }; render(); return; }
    return;
  }
  if (typing) return;

  if (e.key >= '1' && e.key <= '9') {
    const it = navItems()[Number(e.key) - 1];
    if (it) { S.route = { n: it.k }; render(); }
  }
  else if (e.key === 'b' || e.key === 'B') { S.wide = !S.wide; render(); }
  else if (e.key === 'f' || e.key === 'F') { S.wall = !S.wall; render(); }
  else if (e.key === 't' || e.key === 'T') { toggleTheme(); render(); }
  else if (e.key === '?') { showShortcuts(); }
});

/* اختيار تخصّص المحسن داخل التشكيل */
document.addEventListener('change', e => {
  const t = e.target;
  if (!t) return;
  /* مرفق: نحفظ وصفه لا محتواه — الاسم والحجم والنوع */
  /* ملفّ إكسل: يُقرأ محتواه فعلًا لا وصفُه — فالبيانات هي المقصودة */
  /* ملفّ المرشدين المعبّأ يعود إلى عقده — تُقرأ العناوين لا المواضع */
  const gx = t.getAttribute && t.getAttribute('data-gx');
  if (gx) {
    const gf = t.files && t.files[0];
    if (!gf) return;
    const fr = new FileReader();
    fr.onload = () => {
      const c = ctrsAll().find(x => x.id === gx);
      let rows = [];
      try { rows = parseGuides(fr.result); } catch (e3) { rows = []; }
      if (!c) return;
      if (!rows.length) { toast('الملفّ فارغ أو عناوينه غير مطابقة', 'r'); return; }
      c.guides = rows;
      c.log = c.log || [];
      c.log.unshift({ at:now(), by:actorLabel(),
        text:'رُفع ملفّ المرشدين — ' + AR(rows.length) + ' مرشدًا' });
      logIt('عقد ' + c.no + ': رُفع ' + AR(rows.length) + ' مرشدًا', 'info');
      toast('قُرئ ' + AR(rows.length) + ' مرشدًا');
      save(); ctrDrawer(c.id);
    };
    fr.readAsText(gf, 'utf-8');
    t.value = '';
    return;
  }
  const xk = t.getAttribute && t.getAttribute('data-xl');
  if (xk) {
    const f = t.files && t.files[0];
    if (!f) return;
    S.files = S.files || {};
    S.files[xk] = { name:f.name, size:f.size, type:f.type };
    const rd2 = new FileReader();
    rd2.onload = () => {
      try {
        const rows = parseCsv(rd2.result);
        S.qform = S.qform || { orgId:(ORGS[0] || {}).id, rows:[] };
        S.qform.rows = rows;
        toast('قُرئ ' + AR(rows.length) + ' صفًّا');
      } catch (e2) { toast('تعذّرت قراءة الملف', 'r'); }
      save(); if (S.drawer) repaintDrawer(); else render();
    };
    rd2.readAsText(f, 'utf-8');
    return;
  }
  const fk = t.getAttribute && t.getAttribute('data-file');
  if (fk) {
    const f = t.files && t.files[0];
    S.files = S.files || {};
    if (f) S.files[fk] = { name:f.name, size:f.size, type:f.type };
    save();
    if (S.drawer) { if (S.picker) paintPicker(); else repaintDrawer(); }
    return;
  }
  /* قوائم الفلترة */
  const gk = t.getAttribute && t.getAttribute('data-g');
  if (gk) {
    S.gate = S.gate || {};
    const map = { gorg:'orgId', ghotel:'hotelId', glead:'leaderId', guser:'userId' };
    S.gate[map[gk]] = t.value || null;
    save(); renderGate(); return;
  }
  const q2 = t.getAttribute && t.getAttribute('data-q2');
  if (q2) { S.q = S.q || {}; S.q[q2] = t.value;
    if (q2 === 'qorg' && S.qform) S.qform.orgId = t.value;
    if (q2 === 'cOrg' && S.cform) S.cform.orgId = t.value;
    /* منح مجموعة صلاحيات لصفة: الفراغ نزعٌ لا خطأ */
    if (q2.indexOf('rg_') === 0) {
      const pk = q2.slice(3);
      S.roleOf = S.roleOf || {};
      S.roleOf[pk] = t.value || null;
      const rs = (S.roleSets || []).find(x => x.id === t.value);
      logIt('صفة ' + permOf(pk).ar + ': ' +
        (rs ? 'مُنحت مجموعة «' + rs.name + '»' : 'نُزعت مجموعتها — اطّلاع فقط'), 'info');
      toast(rs ? permOf(pk).ar + ' → ' + rs.name : 'نُزعت المجموعة');
      save(); render(); return;
    }
    save(); if (S.drawer) repaintDrawer(); return; }
  const fsel = t.getAttribute && t.getAttribute('data-f');
  if (fsel) { fltSet(fsel, t.getAttribute('data-fk'), t.value); save(); if (S.drawer) repaintDrawer(); else render(); return; }
  if (!t.classList || !t.classList.contains('spec')) return;
  const id = t.getAttribute('data-id'), d = draft();
  const m = d.members.find(x => x.id === id);
  if (m) { m.spec = t.value; save(); }
});

/* حقول البحث وحدها تُعيد الرسم — وما عداها يُحفَظ ويُترك للكاتب */
const LIVE_Q = ['pil','stf','log','enr','nsk','tkt','inc','tm','bld','npil'];
/* حقول تُنسَخ فورًا إلى حالتها حتى لا يتأخّر التحقّق عن الكتابة */
const MIRROR = { fbt: v => { if (S.fb) S.fb.title = v; } };
document.addEventListener('input', e => {
  const t = e.target; if (!t) return;
  if (t.id === 'pq') { S.pq = t.value; S.psel = 0; renderPalette(); return; }
  const k = t.getAttribute('data-q'); if (!k) return;
  if (k === 'pick') {
    S.picker.q = t.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      const pos = t.selectionStart; paintPicker();
      const again = document.getElementById('q-pick');
      if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e2) {} }
    }, 200);
    return;
  }
  S.q = S.q || {}; S.q[k] = t.value;
  if (MIRROR[k]) MIRROR[k](t.value);
  save();
  if (LIVE_Q.indexOf(k) < 0) return;   /* نصّ يُكتب: لا يُمسّ الرسم */
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    const pos = t.selectionStart;
    if (S.drawer) repaintDrawer(); else render();
    const again = document.getElementById(t.id);
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e2) {} }
  }, 240);
});
let qTimer = null;

function showShortcuts() {
  openDrawer('اختصارات لوحة المفاتيح', 'أسرع طريق في غرفة العمليات', 'i-info',
    '<div class="rows">' + [
      ['Ctrl + K', 'لوحة الأوامر — كل شيء من مكان واحد'],
      ['١ – ٩',    'الانتقال المباشر بين الأقسام'],
      ['B',        'طيّ لوح التنقّل'],
      ['F',        'جدار العرض — دوران تلقائي'],
      ['T',        'تبديل الوضع الليلي والنهاري'],
      ['Esc',      'إغلاق ما هو مفتوح'],
      ['؟',        'هذه القائمة']
    ].map(x => '<div class="row"><span class="kbd" style="min-width:76px;text-align:center;' +
      'padding:5px 9px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--line2);font-size:11px">' +
      x[0] + '</span><span class="nm"><b>' + x[1] + '</b></span></div>').join('') + '</div>');
}

/* ============================================================
   السحب والإفلات في التشكيل

   مستمعٌ واحد مفوَّض على المستند — لا مستمعٌ لكل بطاقة، فالقائمة
   تُعاد رسمًا مع كل تغيير. والمقعد يُضيء حين يمرّ فوقه ما يقبله،
   ويُطفأ حين يبتعد، فالمستخدم يرى أين يستقرّ ما في يده.
   ============================================================ */
let dragId = null;
document.addEventListener('dragstart', e => {
  const c = e.target.closest && e.target.closest('[data-drag]');
  if (!c) return;
  dragId = c.getAttribute('data-drag');
  c.classList.add('dragging');
  document.body.classList.add('dragmode');
  try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; }
  catch (err) {}
});
document.addEventListener('dragend', () => {
  dragId = null;
  document.body.classList.remove('dragmode');
  document.querySelectorAll('.dragging').forEach(x => x.classList.remove('dragging'));
  document.querySelectorAll('.dragover').forEach(x => x.classList.remove('dragover'));
});
document.addEventListener('dragover', e => {
  const z = e.target.closest && e.target.closest('[data-drop]');
  if (!z || !dragId) return;
  e.preventDefault();
  try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
  if (!z.classList.contains('dragover')) {
    document.querySelectorAll('.dragover').forEach(x => x.classList.remove('dragover'));
    z.classList.add('dragover');
  }
});
document.addEventListener('dragleave', e => {
  const z = e.target.closest && e.target.closest('[data-drop]');
  if (z) z.classList.remove('dragover');
});
document.addEventListener('drop', e => {
  const z = e.target.closest && e.target.closest('[data-drop]');
  if (!z) return;
  e.preventDefault();
  const uid_ = dragId || (() => { try { return e.dataTransfer.getData('text/plain'); }
    catch (err) { return null; } })();
  dragId = null;
  document.body.classList.remove('dragmode');
  z.classList.remove('dragover');
  if (!uid_) return;
  /* يُنفَّذ عبر المُوجِّه نفسه ليمرّ بحارس الصلاحيات ويُسجَّل */
  const btn = document.createElement('button');
  btn.dataset.a = 'seatdrop';
  btn.dataset.g = z.getAttribute('data-drop');
  btn.dataset.u = uid_;
  btn.style.display = 'none';
  document.body.appendChild(btn);
  btn.click();
  btn.remove();
});
