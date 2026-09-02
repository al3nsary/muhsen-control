/* ============================================================
   مُحسن · الكنترول — الهيكل: السكة واللوح والشريط
   ============================================================ */
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const icon = (n, cls) => '<svg class="ic ' + (cls || '') + '"><use href="#' + n + '"/></svg>';
const pill = (t, c) => '<span class="pill ' + (c || 'grey') + '">' + E(t) + '</span>';
const IMG = window.IMG || {};

/* خريطة الأقسام — كل قسم له شاشة وأيقونة ومجموعة */
const NAV = [
  { g:'العمليات', items:[
    { k:'ops',      i:'i-target',  l:'لوحة العمليات',   d:'الوضع الآن على المستوى الكلي' },
    { k:'tasks',    i:'i-tasks',   l:'المهام',          d:'جدول الموسم لكل الفرق' },
    { k:'incidents',i:'i-warn',    l:'الحوادث',         d:'ما يحتاج تدخّلًا الآن' }
  ]},
  { g:'الطلبات الصاعدة', items:[
    { k:'support',  i:'i-send',    l:'طلبات الدعم',     d:'من الليدرز — تُسند من الاحتياط' },
    { k:'reports',  i:'i-flag',    l:'التقارير',        d:'المصعَّدة من الميدان' },
    { k:'tickets',  i:'i-ticket',  l:'تذاكر الحجاج',    d:'ترد من التطبيق وتُوجَّه' },
    { k:'shifts',   i:'i-swap',    l:'تبديل الشِفتات',  d:'ما رفعه الليدرز' }
  ]},
  { g:'السجلات', items:[
    { k:'teams',    i:'i-users',   l:'الفرق والليدرز',  d:'كل KT وفريقه' },
    { k:'reserve',  i:'i-shield',  l:'الفريق الاحتياطي',d:'يديره الكنترول وحده' },
    { k:'pilgrims', i:'i-user',    l:'قاعدة الحجاج',    d:'الغرف والأدوار والحالات' },
    { k:'quality',  i:'i-star',    l:'الجودة والتقييم', d:'تقييم المشرفين والحجاج' }
  ]},
  { g:'النشر', items:[
    { k:'guides',   i:'i-guide',   l:'أدلة التنفيذ',    d:'تُنشر إلى التطبيق' },
    { k:'broadcast',i:'i-bell',    l:'البثّ والإشعارات',d:'إلى فئة مختارة' },
    { k:'audit',    i:'i-hist',    l:'سجل النظام',      d:'كل قرار بصاحبه ووقته' },
    { k:'settings', i:'i-gear',    l:'الإعدادات',       d:'التجربة وإعادة الضبط' }
  ]}
];
const navItems = () => NAV.reduce((a, g) => a.concat(g.items), []);
const navOf = k => navItems().find(x => x.k === k) || navItems()[0];

/* عدّادات تُعلَّق على الأقسام */
function navCount(k) {
  if (k === 'support')   return openSupport().length;
  if (k === 'reports')   return escalatedReports().length;
  if (k === 'tickets')   return openTickets().length;
  if (k === 'incidents') return S.feed.filter(f => f.kind === 'bad').length;
  if (k === 'shifts')    return 2;
  return 0;
}
const navUrgent = k => ['support', 'incidents'].indexOf(k) >= 0;

/* ---------- السكة ---------- */
function rail() {
  const r = S.route.n;
  return '<nav class="rail" aria-label="الأقسام">' +
    '<span class="mark"><i style="background-image:url(' + (IMG.logo_white || '') + ')"></i></span>' +
    navItems().slice(0, 7).map(x => {
      const n = navCount(x.k);
      return '<button class="' + (x.k === r ? 'on' : '') + '" data-a="go" data-n="' + x.k + '" ' +
        'title="' + E(x.l) + '" aria-label="' + E(x.l) + '">' + icon(x.i) +
        (n ? '<span class="dot"></span>' : '') + '</button>';
    }).join('') +
    '<span class="sp"></span>' +
    '<button data-a="wide" title="طيّ اللوح">' + icon('i-menu') + '</button>' +
    '<button class="' + (r === 'settings' ? 'on' : '') + '" data-a="go" data-n="settings" ' +
      'title="الإعدادات">' + icon('i-gear') + '</button>' +
  '</nav>';
}

/* ---------- لوح التنقّل ---------- */
function sidebar() {
  const r = S.route.n;
  return '<aside class="side">' +
    '<h1>مُحسن · الكنترول</h1>' +
    '<div class="sub">غرفة العمليات — موسم حج ١٤٤٨ هـ</div>' +
    NAV.map(g => '<div class="grp">' + E(g.g) + '</div>' +
      g.items.map(x => {
        const n = navCount(x.k);
        return '<button class="nav ' + (x.k === r ? 'on' : '') + '" data-a="go" data-n="' + x.k + '">' +
          icon(x.i, 's18') + '<b>' + E(x.l) + '</b>' +
          (n ? '<span class="n' + (navUrgent(x.k) ? '' : ' q') + '">' + AR(n) + '</span>' : '') +
        '</button>';
      }).join('')).join('') +
    '<div class="brandfoot">' + icon('i-shield','s14') + 'نظام مُحسن · نُزلي</div>' +
  '</aside>';
}

/* ---------- الشريط العلوي ---------- */
function topbar() {
  const x = navOf(S.route.n);
  const live = runningTasks().length;
  return '<header class="top">' +
    '<button class="burger" data-a="wide" aria-label="طيّ اللوح">' + icon('i-menu','s18') + '</button>' +
    '<span><h2>' + E(x.l) + '</h2><span class="crumb">' + E(x.d) + '</span></span>' +
    '<span class="sp"></span>' +
    '<span class="clockbox"><span class="pulse"></span>' +
      '<span><b id="ctime">' + t12(now()) + '</b> ' +
      '<span>' + dayName(now()) + ' · ' + hijri(now()) + '</span></span></span>' +
    '<span class="clockbox"><span>مهام جارية</span><b class="num">' + AR(live) + '</b></span>' +
    '<button class="iconbtn" data-a="go" data-n="incidents" aria-label="الحوادث">' + icon('i-bell','s18') +
      (navCount('incidents') ? '<span class="bdg">' + AR(navCount('incidents')) + '</span>' : '') + '</button>' +
    '<button class="iconbtn" data-a="go" data-n="settings" aria-label="الإعدادات">' + icon('i-gear','s18') + '</button>' +
  '</header>';
}

/* ---------- لبنات مشتركة ---------- */
function kpi(lab, val, sub, cls, ic) {
  return '<div class="card kpi ' + (cls || '') + '">' +
    '<span class="lab">' + (ic ? icon(ic, 's14') : '') + E(lab) + '</span>' +
    '<b class="num">' + val + '</b>' +
    (sub ? '<span class="sub">' + E(sub) + '</span>' : '') +
    '<svg class="spark" viewBox="0 0 200 38" preserveAspectRatio="none">' +
      '<path d="M0 30 L28 24 L56 27 L84 16 L112 20 L140 10 L168 14 L200 6" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/></svg></div>';
}
function head(t, sub, right) {
  return '<div class="h">' + icon('i-hash','s16') +
    '<span class="sp"><b>' + E(t) + '</b>' +
    (sub ? '<div class="tiny faint">' + E(sub) + '</div>' : '') + '</span>' +
    (right || '') + '</div>';
}
function empty(t, s, ic) {
  return '<div class="empty">' + icon(ic || 'i-info', 's26') +
    '<b>' + E(t) + '</b><div class="tiny" style="margin-top:6px">' + E(s || '') + '</div></div>';
}
const avatar = u => '<span class="av">' + icon(u.role === 'leader' ? 'i-shield' : 'i-user', 's18') + '</span>';
