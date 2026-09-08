/* ============================================================
   لوحة العمليات — الشاشة التي تُدار منها الغرفة
   ترتيبها يتبع سؤال المشغّل: ماذا يحتاج قراري؟ ثم أين نحن؟
   ثم كيف نسير؟ ثم من يحتاج انتباهي؟
   ============================================================ */

/* عقد الخريطة: مواضع تقريبية للمشاعر ومكة وجدة */
const MAP_NODES = [
  { k:'jeddah',  x:13, y:72, l:'مطار جدة' },
  { k:'makkah',  x:43, y:50, l:'مكة — الحرم' },
  { k:'aziziah', x:53, y:64, l:'العزيزية — السكن' },
  { k:'mina',    x:70, y:42, l:'منى' },
  { k:'muzd',    x:80, y:52, l:'مزدلفة' },
  { k:'arafah',  x:91, y:64, l:'عرفة' }
];
const KIND_NODE = { airport:'jeddah', checkout:'jeddah', checkin:'aziziah',
  umrah:'makkah', wada:'makkah', tour:'makkah', mina:'mina', jamarat:'mina', arafah:'arafah' };
const LEG = [['jeddah','makkah'],['makkah','aziziah'],['aziziah','mina'],['mina','muzd'],['muzd','arafah']];

function mapPath(a, b) {
  const A = MAP_NODES.find(n => n.k === a), B = MAP_NODES.find(n => n.k === b);
  return 'M' + A.x + ' ' + A.y + ' Q' + ((A.x + B.x) / 2) + ' ' + (Math.min(A.y, B.y) - 10) +
    ' ' + B.x + ' ' + B.y;
}

function opsMap() {
  const live = runningTasks();
  const busy = {}, late = {};
  live.forEach(t => {
    const k = KIND_NODE[t.kind] || 'makkah';
    busy[k] = (busy[k] || 0) + 1;
    if (now() > t.end) late[k] = 1;
  });
  /* المسارات القادمة خلال ٦ ساعات تُرسم أخفت — الغرفة ترى ما هو آتٍ */
  const soon = {};
  V.tasks.filter(t => t.start > now() && t.start < now() + 6 * HR).forEach(t => {
    const k = KIND_NODE[t.kind] || 'makkah'; soon[k] = (soon[k] || 0) + 1;
  });
  const hot = LEG.filter(l => busy[l[1]] || busy[l[0]]);
  const warm = LEG.filter(l => !hot.includes(l) && (soon[l[1]] || soon[l[0]]));

  return '<div class="map"><span class="radar"></span>' +
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<g stroke="currentColor" stroke-width=".45" fill="none" style="color:var(--line2)">' +
        LEG.map(l => '<path d="' + mapPath(l[0], l[1]) + '"/>').join('') + '</g>' +
      '<g stroke="currentColor" stroke-width=".8" fill="none" class="dash" style="color:var(--live)">' +
        hot.map(l => '<path d="' + mapPath(l[0], l[1]) + '"/>').join('') + '</g>' +
      '<g stroke="currentColor" stroke-width=".55" fill="none" class="dash slow" ' +
        'style="color:var(--gold2);opacity:.5">' +
        warm.map(l => '<path d="' + mapPath(l[0], l[1]) + '"/>').join('') + '</g>' +
      hot.slice(0, 3).map((l, i) =>
        '<circle class="convoy" r="1.2"><animateMotion dur="' + (7 + i * 2) + 's" ' +
        'repeatCount="indefinite" path="' + mapPath(l[0], l[1]) + '"/></circle>').join('') +
      warm.slice(0, 2).map((l, i) =>
        '<circle class="convoy warm" r="1"><animateMotion dur="' + (13 + i * 3) + 's" ' +
        'repeatCount="indefinite" path="' + mapPath(l[0], l[1]) + '"/></circle>').join('') +
    '</svg>' +
    MAP_NODES.map(n => {
      const cls = late[n.k] ? 'bad' : busy[n.k] ? 'warn' : soon[n.k] ? 'soon' : '';
      return '<span class="node ' + cls + '" style="inset-inline-end:' + n.x + '%;top:' + n.y + '%">' +
        '<span class="pin"></span><span class="lbl">' + E(n.l) +
        (busy[n.k] ? ' · ' + AR(busy[n.k]) : '') + '</span></span>';
    }).join('') +
  '</div>';
}

/* ---------- درج الفريق ---------- */
function ktDrawer(id) {
  const L = userById(id); if (!L) return;
  const org = orgById(L.orgId) || {}, team = teamOf(L.id);
  const ts = V.tasks.filter(t => t.leaderId === L.id);
  const done = ts.filter(t => t.status === 'done');
  const live = ts.filter(t => now() >= t.start && now() < t.end && t.status !== 'done');
  const next = ts.filter(t => t.start > now()).sort((a, b) => a.start - b.start).slice(0, 4);
  const tk = openTickets().filter(k => k.leaderId === L.id);
  const rate = done.length ? (done.reduce((a, t) => a + (t.rating || 0), 0) / done.length).toFixed(1) : '—';

  openDrawer(L.kt + ' · ' + L.name, org.ar + ' · ' + org.country, 'i-shield',
    '<div class="grid g2" style="gap:12px">' +
      ['حجاج,' + L.pilgrims, 'محسنون,' + team.length, 'مهام منجزة,' + done.length].map(x => {
        const p = x.split(',');
        return '<div class="card mini"><span class="tiny faint">' + p[0] + '</span>' +
          '<b class="num" data-n="' + p[1] + '">٠</b></div>';
      }).join('') +
      '<div class="card mini"><span class="tiny faint">متوسط التقييم</span>' +
        '<b style="color:var(--gold3)">' + AR(rate) + '</b></div>' +
    '</div>' +

    (live.length ? '<div class="card live">' + head('جارية الآن', live[0].place) +
      '<b>' + E(live[0].title) + '</b>' +
      '<div class="tiny faint" style="margin-top:5px">تنتهي ' + t12(live[0].end) + '</div>' +
      '<div class="meter" style="margin-top:10px"><i data-w="' +
        Math.min(100, Math.round((now() - live[0].start) / (live[0].end - live[0].start) * 100)) +
        '"></i></div></div>' : '') +

    '<div class="card">' + head('المهام القادمة', AR(next.length) + ' مهمة') +
      '<div class="rows">' + (next.length ? next.map(t => {
        const c = CAT[t.kind] || {};
        return '<div class="row" data-a="tlopen" data-id="' + t.id + '">' +
          '<span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' + icon(c.i || 'i-tasks','s16') + '</span>' +
          '<span class="nm"><b>' + E(t.title) + '</b><span>' + hijri(t.start) + ' · ' + t12(t.start) + '</span></span>' +
          pill(untilTxt(t.start), 'wait') + '</div>';
      }).join('') : '<div class="empty" style="padding:20px"><b>لا مهام قادمة</b></div>') + '</div></div>' +

    head('الفريق', AR(team.length) + ' محسن') +
    '<div class="plist">' + team.map(m => {
      const r = muhsenRating(m.id), nt = muhsenNotes(m.id);
      return '<div class="prow">' + avatar(m) +
        '<span class="nm"><b>' + E(m.name) + '</b>' +
          '<span>' + LTR(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        '<span class="end">' + stars(r) + '</span></div>';
    }).join('') + '</div>' +

    (tk.length ? '<div class="card">' + head('تذاكر مفتوحة', AR(tk.length)) +
      tk.slice(0, 4).map(k => '<div class="evt ' + (k.pri === 'حرجة' ? 'bad' : 'warn') + '">' +
        '<span class="dot"></span><span class="sp"><b>' + E(k.title) + '</b>' +
        '<p>' + E(k.from) + ' · ' + E(k.cat) + '</p></span></div>').join('') + '</div>' : ''));
}
