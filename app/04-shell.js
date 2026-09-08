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

/* ============================================================
   خريطة الأقسام
   ─────────────────────────────────────────────────────────────
   عنصران لا ثالث لهما:
     · ورقة  { k }        تنتقل عند النقر.
     · حاوية { p, kids }  تُفتح وتُطوى عند النقر — ولا تنتقل.
   وكل ابن ورقة كاملة: طريقٌ وتابٌ إن لزم.
   ============================================================ */
const NAV = [
  { g:'العمليات', items:[
    { k:'ops',      i:'i-target', l:'لوحة العمليات', d:'الوضع الآن — لوحة تُخصَّص' },
    { p:'tasksg',   i:'i-tasks',  l:'المهام', d:'أربعة أنواع وأدلّتها', kids:[
      { k:'tasks', t:['tt','hajj'],   i:'i-kaaba',  l:'مهام الحجّ' },
      { k:'tasks', t:['tt','enrich'], i:'i-pin',    l:'إثراء التجربة' },
      { k:'tasks', t:['tt','nusuk'],  i:'i-idcard', l:'نُسك' },
      { k:'tasks', t:['tt','comply'], i:'i-clip',   l:'الامتثال' },
      { k:'guides',                   i:'i-guide',  l:'أدلة التنفيذ' }
    ]},
    { k:'timeline',  i:'i-hist', l:'الخط الزمني', d:'مسار اليوم لكل مجموعة' },
    { k:'transport', i:'i-bus',  l:'النقل',       d:'جدولة عشرة باصات على الموسم' },
    { k:'incidents', i:'i-warn', l:'الحوادث',     d:'ما يحتاج تدخّلًا الآن' }
  ]},

  { g:'الموظفون', items:[
    { p:'staffg', i:'i-idcard', l:'الموظفون', d:'السجلّ والتسكين والتعاقد', kids:[
      { k:'staff',                     i:'i-idcard', l:'سجلّ الموظفين' },
      { k:'assign', t:['asg','sup'],   i:'i-key',    l:'المشرفون على الفنادق' },
      { k:'assign', t:['asg','lead'],  i:'i-star',   l:'الليدرز على المجموعات' },
      { k:'assign', t:['asg','muh'],   i:'i-users',  l:'المحسنون على الليدرز' },
      { k:'teams',                     i:'i-flag',   l:'الفرق والمجموعات' },
      { k:'reserve',                   i:'i-shield', l:'الفريق الاحتياطي' },
      { k:'shifts',                    i:'i-swap',   l:'تبديل الشِفتات' },
      { k:'afasha',                    i:'i-truck',  l:'العفاشة' }
    ]},
    { k:'build', i:'i-users', l:'التشكيل السريع', d:'مجموعة كاملة في صندوق واحد' }
  ]},

  { g:'المتابعة', items:[
    { p:'followg', i:'i-send', l:'المتابعة', d:'ما يصعد من الميدان', kids:[
      { k:'support', i:'i-send',   l:'طلبات الدعم' },
      { k:'reports', i:'i-flag',   l:'التقارير' },
      { k:'tickets', i:'i-ticket', l:'التذاكر' }
    ]}
  ]},

  { g:'السجلات والنشر', items:[
    { k:'pilgrims',  i:'i-user',   l:'الحجاج',          d:'السجلّ الأصل — غرفهم وحالاتهم' },
    { k:'quality',   i:'i-star',   l:'الجودة والتقييم', d:'تقييم المشرفين والحجاج' },
    { k:'broadcast', i:'i-bell',   l:'الإشعارات',       d:'إلى المحسن أو الحاجّ أو الكنترول' },
    { k:'audit',     i:'i-hist',   l:'سجل النظام',      d:'كل قرار بصاحبه ووقته' },
    { k:'perms',     i:'i-shield', l:'الصلاحيات',       d:'من يرى ماذا — وأمن مستوى الصفّ' },
    { k:'settings',  i:'i-gear',   l:'الإعدادات',       d:'إعدادات الموقع والتجربة' }
  ]}
];

/* كل ورقة في النظام — الأوراق المباشرة وأبناء الحاويات */
const navItems = () => NAV.reduce((a, g) =>
  a.concat(g.items.reduce((b, x) => b.concat(x.kids ? x.kids : [x]), [])), []);
const navOf = k => navItems().find(x => x.k === k) || navItems()[0];
/* هل هذا الابن هو المفتوح الآن؟ الطريق والتاب معًا */
const kidOn = x => x.k === S.route.n && (!x.t || S.tab[x.t[0]] === x.t[1]);
/* الحاوية مفتوحة إن طُلب فتحها أو كان الطريق داخلها */
function grpOpen(x) {
  if (S.open && Object.prototype.hasOwnProperty.call(S.open, x.p)) return !!S.open[x.p];
  return x.kids.some(c => c.k === S.route.n);
}

/* عدّادات تُعلَّق على الأقسام */
function navCount(k, t) {
  if (t && t[0] === 'tt') {
    if (t[1] === 'nusuk')  return openNusuk().length;
    if (t[1] === 'enrich') return freeEnrich().length;
    return 0;
  }
  if (k === 'support')   return openSupport().length;
  if (k === 'reports')   return escalatedReports().length;
  if (k === 'tickets')   return openTickets().length;
  if (k === 'incidents') return V.feed.filter(f => f.kind === 'bad').length;
  if (k === 'shifts')    return openSwaps().length;
  if (k === 'afasha')    return openDeals().length;
  return 0;
}
const navUrgent = k => ['support', 'incidents', 'afasha'].indexOf(k) >= 0;
/* عدّاد الحاوية: مجموع أبنائها */
const grpCount = x => x.kids.reduce((a, c) => a + navCount(c.k, c.t), 0);

/* ---------- القائمة الواحدة ---------- */
function sidebar() {
  const narrow = !!S.wide;
  return '<nav class="side' + (narrow ? ' mini' : '') + '" aria-label="الأقسام">' +
    '<div class="sidehead">' +
      '<span class="mark"><i style="background-image:url(' + (IMG.logo_white || '') + ')"></i></span>' +
      '<span class="brandtxt"><b>مُحسن · الكنترول</b>' +
        '<span>غرفة العمليات — موسم حج ١٤٤٨ هـ</span></span>' +
      '<button class="fold" data-a="wide" title="' + (narrow ? 'توسيع' : 'طيّ') + ' القائمة · B" ' +
        'aria-label="طيّ القائمة">' + icon(narrow ? 'i-fwd' : 'i-back', 's18') + '</button>' +
    '</div>' +

    '<div class="sidescroll">' +
    NAV.map(g => {
      const its = g.items.filter(x => x.kids
        ? x.kids.some(c => maySee(c.k)) : maySee(x.k));
      if (!its.length) return '';
      return '<div class="grp"><span>' + E(g.g) + '</span></div>' +
        its.map(x => x.kids ? navGroup(x, narrow) : navLeaf(x)).join('');
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
    '<div class="brandfoot">' + icon('i-shield','s14') + '<span>نظام مُحسن · نُزلي</span></div>' +
    '</div>' +
  '</nav>';
}

function navLeaf(x) {
  const n = navCount(x.k), on = x.k === S.route.n;
  return '<button class="nav' + (on ? ' on' : '') + (n ? ' hasn' : '') +
    '" data-a="go" data-n="' + x.k + '"' + (S.wide ? ' title="' + E(x.l) + '"' : '') + '>' +
    icon(x.i, 's18') + '<b>' + E(x.l) + '</b>' +
    (n ? '<span class="n' + (navUrgent(x.k) ? '' : ' q') + '">' + AR(n) + '</span>' : '') +
  '</button>';
}

function navGroup(x, narrow) {
  const open = grpOpen(x), n = grpCount(x);
  const inside = x.kids.some(c => c.k === S.route.n);
  const kids = x.kids.filter(c => maySee(c.k));
  return '<button class="nav grpnav' + (open ? ' open' : '') + (inside ? ' inside' : '') +
      (n ? ' hasn' : '') + '" data-a="grp" data-n="' + x.p + '"' +
      (narrow ? ' title="' + E(x.l) + '"' : '') + '>' +
      icon(x.i, 's18') + '<b>' + E(x.l) + '</b>' +
      (n ? '<span class="n' + (navUrgent(x.p) ? '' : ' q') + '">' + AR(n) + '</span>' : '') +
      '<span class="chev">' + icon('i-fwd','s14') + '</span>' +
    '</button>' +
    (open && !narrow ? '<div class="kids">' + kids.map(c => {
      const cn = navCount(c.k, c.t);
      return '<button class="kid' + (kidOn(c) ? ' on' : '') + '" data-a="gokid" ' +
        'data-n="' + c.k + '"' + (c.t ? ' data-k="' + c.t[0] + '" data-v="' + c.t[1] + '"' : '') + '>' +
        icon(c.i, 's14') + '<b>' + E(c.l) + '</b>' +
        (cn ? '<span class="n' + (navUrgent(c.k) ? '' : ' q') + '">' + AR(cn) + '</span>' : '') +
      '</button>';
    }).join('') + '</div>' : '');
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
    whoami() +
  '</header>';
}

/* من الداخل الآن — صورته واسمه وصفته ونطاقه */
function actorUser() {
  const a = S.actor || {};
  if (a.userId)   return userById(a.userId);
  if (a.leaderId) return userById(a.leaderId);
  if (a.hotelId)  return S.users.find(u => u.role === 'supervisor' && u.hotelId === a.hotelId);
  return null;
}
function actorLabel() {
  const a = S.actor || {}, p = curPerm();
  if (a.orgId)   { const o = orgById(a.orgId) || {}; return o.kt + ' · ' + o.ar; }
  if (a.hotelId) return (hotelById(a.hotelId) || {}).ar || '';
  const u = actorUser();
  return u ? (u.kt && u.kt !== '—' ? u.kt : u.code) : SCOPE_AR[p.scope];
}
function whoami() {
  const p = curPerm(), u = actorUser();
  return '<button class="who" data-a="whoami" title="هويتك ونطاقك">' +
    (u ? avatar(u, 'sm')
       : '<span class="ico sm" style="color:var(--gold2)">' + icon(p.i, 's16') + '</span>') +
    '<span class="nm"><b>' + E(u ? u.name : p.ar) + '</b>' +
    '<span>' + E(u ? p.ar : actorLabel()) + '</span></span>' +
    icon('i-fwd','s14') + '</button>';
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
