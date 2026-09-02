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
  const dur = 850, t0 = performance.now();
  const suffix = el.getAttribute('data-suffix') || '';
  function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    const v = target * e;
    el.textContent = AR(dec ? v.toFixed(1) : Math.round(v)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- ضوء يتبع المؤشّر على البطاقات ---------- */
function bindPointerLight(root) {
  root.querySelectorAll('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
}

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
  root.querySelectorAll('.meter i[data-w]').forEach(i => {
    requestAnimationFrame(() => { i.style.width = i.getAttribute('data-w') + '%'; });
  });
}

/* ---------- طبقة ما بعد الرسم ---------- */
function afterRender() {
  const wrap = document.getElementById('stagewrap');
  wrap.querySelectorAll('[data-n]').forEach(countUp);
  bindPointerLight(wrap);
  fillMeters(wrap);
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
function renderDrawer() {
  const w = document.getElementById('drawerwrap');
  if (!S.drawer) { w.innerHTML = ''; return; }
  const d = S.drawer;
  w.innerHTML = '<div class="scrim" data-a="closedrawer"></div>' +
    '<aside class="drawer" role="dialog" aria-label="' + E(d.title) + '">' +
      '<div class="dh">' + icon(d.icon || 'i-info','s18') +
        '<span class="sp"><b style="font-size:15px">' + E(d.title) + '</b>' +
        '<div class="tiny faint">' + E(d.sub || '') + '</div></span>' +
        '<button class="iconbtn" data-a="closedrawer" aria-label="إغلاق">' + icon('i-x','s18') + '</button></div>' +
      '<div class="db">' + d.body + '</div></aside>';
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

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'pq') { S.pq = e.target.value; S.psel = 0; renderPalette(); }
});

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
