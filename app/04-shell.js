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
    { k:'timeline', i:'i-hist',    l:'الخط الزمني',     d:'كل مهام كل الفرق في شاشة واحدة' },
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
    '<button data-a="theme" title="تبديل الوضع · T">' +
      icon(S.theme === 'day' ? 'i-sun' : 'i-hour') + '</button>' +
    '<button data-a="palette" title="لوحة الأوامر · Ctrl+K">' + icon('i-search') + '</button>' +
    '<button data-a="wide" title="طيّ اللوح · B">' + icon('i-menu') + '</button>' +
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
    '<div class="grp">العرض</div>' +
    '<button class="nav" data-a="theme">' + icon(S.theme === 'day' ? 'i-sun' : 'i-hour','s18') +
      '<b>' + (S.theme === 'day' ? 'الوضع النهاري' : 'الوضع الليلي') + '</b>' +
      '<span class="n q">T</span></button>' +
    '<button class="nav" data-a="wall">' + icon('i-fullscreen','s18') +
      '<b>جدار العرض</b><span class="n q">F</span></button>' +
    '<button class="nav" data-a="shortcuts">' + icon('i-info','s18') +
      '<b>الاختصارات</b><span class="n q">؟</span></button>' +
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
    '<button class="iconbtn" data-a="palette" aria-label="لوحة الأوامر" title="Ctrl+K">' +
      icon('i-search','s18') + '</button>' +
    '<button class="themebtn" data-a="theme" title="تبديل الوضع · T">' +
      '<span>' + (S.theme === 'day' ? 'الوضع النهاري' : 'الوضع الليلي') + '</span>' +
      '<span class="knob">' + icon(S.theme === 'day' ? 'i-sun' : 'i-hour', 's14') + '</span></button>' +
    '<button class="iconbtn" data-a="wall" aria-label="جدار العرض" title="جدار العرض · F">' +
      icon('i-fullscreen','s18') + '</button>' +
    '<button class="iconbtn" data-a="shortcuts" aria-label="الاختصارات" title="الاختصارات · ؟">' +
      icon('i-info','s18') + '</button>' +
  '</header>';
}

/* ---------- لبنات مشتركة ---------- */
function kpi(lab, val, sub, cls, ic, num, suffix) {
  return '<div class="card kpi ' + (cls || '') + '">' +
    '<span class="lab">' + (ic ? icon(ic, 's14') : '') + E(lab) + '</span>' +
    '<b class="num" data-n="' + (num == null ? '' : num) + '"' +
      (suffix ? ' data-suffix="' + suffix + '"' : '') + '>' +
      (num == null ? val : AR(0)) + '</b>' +
    (sub ? '<span class="sub">' + E(sub) + '</span>' : '') +
    '<svg class="spark" viewBox="0 0 200 38" preserveAspectRatio="none">' +
      '<path d="M0 30 L28 24 L56 27 L84 16 L112 20 L140 10 L168 14 L200 6" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/></svg></div>';
}
function head(t, sub, right, ic) {
  return '<div class="h">' + (ic ? icon(ic, 's16') : '') +
    '<span class="sp"><b>' + E(t) + '</b>' +
    (sub ? '<div class="tiny faint">' + E(sub) + '</div>' : '') + '</span>' +
    (right || '') + '</div>';
}
function empty(t, s, ic) {
  return '<div class="empty">' + icon(ic || 'i-info', 's26') +
    '<b>' + E(t) + '</b><div class="tiny" style="margin-top:6px">' + E(s || '') + '</div></div>';
}
/* الوجه المرسوم — نفس أفاتار التطبيق بحلقته الذهبية */
const avatar = (u, cls) => '<span class="av ' + (cls || '') + ' ' + (u.av || 'p1') + '">' +
  '<svg viewBox="0 0 44 44"><use href="#av-' + (u.g || 'm') + '"/></svg></span>';

/* النجوم — التقييم يُقرأ لا يُقاس */
function stars(v, size) {
  const full = Math.floor(v), half = v - full >= 0.5;
  let out = '<span class="stars ' + (size || '') + '">';
  for (let i = 1; i <= 5; i++) {
    const on = i <= full, hf = !on && i === full + 1 && half;
    out += icon('i-star', (size === 'lg' ? 's18 ' : 's14 ') + (on ? 'on' : hf ? 'half' : 'off'));
  }
  return out + '<b>' + AR(String(v).replace(/\.0$/, '')) + '</b></span>';
}
