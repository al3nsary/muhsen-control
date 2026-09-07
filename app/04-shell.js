/* ============================================================
   مُحسن · الكنترول — الهيكل: السكة واللوح والشريط
   ============================================================ */
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const icon = (n, cls) => '<svg class="ic ' + (cls || '') + '"><use href="#' + n + '"/></svg>';
/* معرّف مختلط: لاتيني وأرقام وشرطة — يُعزَل وإلا انقلب ترتيبه في العربية */
const LTR = t => '<bdi class="ltr">' + E(t == null ? '' : t) + '</bdi>';
const pill = (t, c) => '<span class="pill ' + (c || 'grey') + '">' + E(t) + '</span>';
const IMG = window.IMG || {};

/* خريطة الأقسام — قائمة واحدة تتوسّع وتنطوي، لا سكة ولوح منفصلين */
const NAV = [
  { g:'العمليات', items:[
    { k:'ops',      i:'i-target',  l:'لوحة العمليات',   d:'الوضع الآن على المستوى الكلي' },
    { k:'tasks',    i:'i-tasks',   l:'المهام',          d:'أربعة أنواع من العمل الميداني',
      kids:[
        { t:'hajj',   i:'i-kaaba',  l:'مهام الحجّ' },
        { t:'enrich', i:'i-bus',    l:'إثراء التجربة' },
        { t:'nusuk',  i:'i-idcard', l:'نُسك' },
        { t:'comply', i:'i-clip',   l:'الامتثال' }
      ] },
    { k:'timeline', i:'i-hist',    l:'الخط الزمني',     d:'مسار اليوم لكل مجموعة' },
    { k:'incidents',i:'i-warn',    l:'الحوادث',         d:'ما يحتاج تدخّلًا الآن' }
  ]},
  { g:'التشكيل', items:[
    { k:'assign',   i:'i-swap',    l:'التسكين',          d:'ثلاث خطوات: مشرفون · ليدرز · محسنون' },
    { k:'build',    i:'i-users',   l:'التشكيل السريع',   d:'بناء مجموعة كاملة في صندوق واحد' },
    { k:'staff',    i:'i-idcard',  l:'الموظفون',        d:'مشرفون وليدرز ومحسنون — وبروفايل لكلٍّ' },
    { k:'teams',    i:'i-flag',    l:'الفرق والمجموعات', d:'كل KT وفريقه' },
    { k:'reserve',  i:'i-shield',  l:'الفريق الاحتياطي', d:'يديره الكنترول وحده' }
  ]},
  { g:'الطلبات الصاعدة', items:[
    { k:'support',  i:'i-send',    l:'طلبات الدعم',     d:'من الليدرز — تُسند من الاحتياط' },
    { k:'reports',  i:'i-flag',    l:'التقارير',        d:'المصعَّدة من الميدان' },
    { k:'tickets',  i:'i-ticket',  l:'التذاكر',         d:'ترد من التطبيق وتُوجَّه' },
    { k:'shifts',   i:'i-swap',    l:'تبديل الشِفتات',  d:'ما رفعه الليدرز' }
  ]},
  { g:'السجلات والنشر', items:[
    { k:'pilgrims', i:'i-user',    l:'قاعدة الحجاج',    d:'الغرف والأدوار والحالات' },
    { k:'quality',  i:'i-star',    l:'الجودة والتقييم', d:'تقييم المشرفين والحجاج' },
    { k:'guides',   i:'i-guide',   l:'أدلة التنفيذ',    d:'تُحرَّر هنا وتُنشر إلى التطبيق' },
    { k:'broadcast',i:'i-bell',    l:'البثّ والإشعارات',d:'إلى فئة مختارة' },
    { k:'audit',    i:'i-hist',    l:'سجل النظام',      d:'كل قرار بصاحبه ووقته' },
    { k:'perms',    i:'i-shield',  l:'الصلاحيات',       d:'من يرى ماذا — وأمن مستوى الصفّ' },
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
  if (k === 'shifts')    return openSwaps().length;
  if (k === 'nusuk')     return openNusuk().length;
  if (k === 'enrich')    return freeEnrich().length;
  return 0;
}
const navUrgent = k => ['support', 'incidents', 'nusuk'].indexOf(k) >= 0;

/* ---------- القائمة الواحدة ----------
   حالتان لا لوحان: موسَّعة بأسمائها، ومطويّة بأيقوناتها.
   التوسيع والطيّ من الزرّ نفسه في رأس القائمة. */
function sidebar() {
  const r = S.route.n, sub = S.tab.tt || 'hajj';
  const narrow = !!S.wide;
  return '<nav class="side' + (narrow ? ' mini' : '') + '" aria-label="الأقسام">' +
    '<div class="sidehead">' +
      '<span class="mark"><i style="background-image:url(' + (IMG.logo_white || '') + ')"></i></span>' +
      '<span class="brandtxt"><b>مُحسن · الكنترول</b>' +
        '<span>غرفة العمليات — موسم حج ١٤٤٨ هـ</span></span>' +
      '<button class="fold" data-a="wide" title="' + (narrow ? 'توسيع القائمة' : 'طيّ القائمة') + ' · B" ' +
        'aria-label="طيّ القائمة">' + icon(narrow ? 'i-fwd' : 'i-back', 's18') + '</button>' +
    '</div>' +

    '<div class="sidescroll">' +
    NAV.map(g => {
      const its = g.items.filter(x => maySee(x.k));
      if (!its.length) return '';
      return '<div class="grp"><span>' + E(g.g) + '</span></div>' +
      its.map(x => {
        const n = navCount(x.k), on = x.k === r;
        const kids = x.kids && on
          ? '<div class="kids">' + x.kids.map(c => {
              const cn = navCount(c.t);
              return '<button class="kid' + (c.t === sub ? ' on' : '') + '" ' +
                'data-a="seg" data-k="tt" data-v="' + c.t + '">' +
                icon(c.i, 's14') + '<b>' + E(c.l) + '</b>' +
                (cn ? '<span class="n' + (navUrgent(c.t) ? '' : ' q') + '">' + AR(cn) + '</span>' : '') +
              '</button>';
            }).join('') + '</div>'
          : '';
        return '<button class="nav' + (on ? ' on' : '') + (n ? ' hasn' : '') +
            '" data-a="go" data-n="' + x.k + '"' +
            (narrow ? ' title="' + E(x.l) + '"' : '') + '>' +
            icon(x.i, 's18') + '<b>' + E(x.l) + '</b>' +
            (n ? '<span class="n' + (navUrgent(x.k) ? '' : ' q') + '">' + AR(n) + '</span>' : '') +
          '</button>' + kids;
      }).join('');
    }).join('') +

    '<div class="grp"><span>العرض</span></div>' +
    '<button class="nav" data-a="theme" title="تبديل الوضع · T">' +
      icon(S.theme === 'day' ? 'i-sun' : 'i-hour','s18') +
      '<b>' + (S.theme === 'day' ? 'الوضع النهاري' : 'الوضع الليلي') + '</b>' +
      '<span class="n q">T</span></button>' +
    '<button class="nav" data-a="wall" title="جدار العرض · F">' + icon('i-fullscreen','s18') +
      '<b>جدار العرض</b><span class="n q">F</span></button>' +
    '<button class="nav" data-a="shortcuts" title="الاختصارات · ؟">' + icon('i-info','s18') +
      '<b>الاختصارات</b><span class="n q">؟</span></button>' +
    '<button class="nav" data-a="logout" title="تسجيل الخروج">' + icon('i-logout','s18') +
      '<b>تسجيل الخروج</b></button>' +
    '<div class="brandfoot">' + icon('i-shield','s14') + '<span>نظام مُحسن · نُزلي</span></div>' +
    '</div>' +
  '</nav>';
}

/* ---------- الشريط العلوي ---------- */
function topbar() {
  const x = navOf(S.route.n);
  const live = runningTasks().length;
  return '<header class="top">' +
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
