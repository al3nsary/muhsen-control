/* ============================================================
   الخط الزمني للموسم — كل مهام كل الفرق في شاشة واحدة
   ترى التداخل والفجوة والضغط بنظرة، وتفتح أيّ مهمة بنقرة.
   ============================================================ */

function tlWindow() {
  const all = V.tasks;
  if (!all.length) return { a: now() - DAY, b: now() + DAY };
  const a = Math.min.apply(null, all.map(t => t.start)) - 4 * HR;
  const b = Math.max.apply(null, all.map(t => t.end)) + 4 * HR;
  return { a, b };
}

function screenTimeline() {
  const w = tlWindow(), span = w.b - w.a;
  const pct = ts => ((ts - w.a) / span) * 100;

  /* أعمدة الأيام */
  const days = [];
  for (let d = dayStart(w.a); d <= w.b; d += DAY) days.push(d);

  const zoom = S.tab.tlz || 'all';
  const rows = leaders().filter(L => zoom === 'all' || zoom === L.id);

  return '<div class="grid g4">' +
      kpi('مهام الموسم', '', 'عبر ' + AR(leaders().length) + ' فرق', '', 'i-tasks', V.tasks.length) +
      kpi('أيام التشغيل', '', 'من أول مهمة إلى آخرها', '', 'i-cal', days.length) +
      kpi('ذروة التزامن', '', 'أكثر عدد مهام في وقت واحد', 'warn', 'i-play', peakOverlap()) +
      kpi('متوسط التقييم', '', 'للمهام المنجزة', 'up', 'i-star',
        Number((V.tasks.filter(t => t.rating).reduce((a, t) => a + t.rating, 0) /
          Math.max(1, V.tasks.filter(t => t.rating).length)).toFixed(1))) +
    '</div>' +

    '<div class="card gold">' +
      head('الخط الزمني للموسم', 'كل مهمة بلونها ونوعها — والخط الأحمر هو الآن',
        '<span style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn ' + (zoom === 'all' ? 'p' : 'l') + ' sm" data-a="seg" data-k="tlz" data-v="all">كل الفرق</button>' +
        leaders().map(L => '<button class="btn ' + (zoom === L.id ? 'p' : 'l') + ' sm" ' +
          'data-a="seg" data-k="tlz" data-v="' + L.id + '">' + E(L.kt) + '</button>').join('') + '</span>') +

      '<div class="tl"><div class="tlgrid">' +
        '<div class="tlhead">' + days.map(d =>
          '<span>' + dayName(d).slice(0, 3) + ' ' + AR(new Date(d).getDate()) + '</span>').join('') + '</div>' +
        rows.map((L, ri) => {
          const ts = V.tasks.filter(t => t.leaderId === L.id).sort((a, b) => a.start - b.start);
          return '<div class="tlrow">' +
            '<span class="tlname">' + E(L.kt) + '<br><span class="tiny faint">' +
              E(L.name.split(' ')[0]) + '</span></span>' +
            '<span class="tlbar">' +
              ts.map((t, i) => {
                const c = CAT[t.kind] || {};
                const l = pct(t.start), wd = Math.max(0.7, pct(t.end) - l);
                const done = t.status === 'done';
                return '<span class="seg" data-a="tlopen" data-id="' + t.id + '" ' +
                  'title="' + E(t.title + ' — ' + hijri(t.start) + ' ' + t12(t.start)) + '" ' +
                  'style="inset-inline-end:' + l + '%;width:' + wd + '%;' +
                  'background:linear-gradient(150deg,' + (c.c || '#3A4A42') + ',' +
                  'color-mix(in srgb,' + (c.c || '#3A4A42') + ' 60%, #06110C));' +
                  'opacity:' + (done ? '.55' : '1') + ';' +
                  'animation-delay:' + (ri * 60 + i * 26) + 'ms">' +
                  (wd > 5 ? E(t.title.slice(0, 14)) : '') + '</span>';
              }).join('') +
              (now() >= w.a && now() <= w.b
                ? '<span class="now" style="inset-inline-end:' + pct(now()) + '%"></span>' : '') +
            '</span></div>';
        }).join('') +
      '</div></div>' +

      '<div class="tiny faint" style="margin-top:14px;display:flex;gap:14px;flex-wrap:wrap">' +
        Object.keys(CAT).map(k => '<span style="display:inline-flex;align-items:center;gap:6px">' +
          '<i style="width:9px;height:9px;border-radius:3px;background:' + CAT[k].c + ';display:block"></i>' +
          E(CAT[k].ar.split(' — ')[0]) + '</span>').join('') + '</div>' +
    '</div>';
}

/* أكثر عدد مهام متزامنة في الموسم */
function peakOverlap() {
  const pts = [];
  V.tasks.forEach(t => { pts.push([t.start, 1]); pts.push([t.end, -1]); });
  pts.sort((a, b) => a[0] - b[0]);
  let cur = 0, peak = 0;
  pts.forEach(p => { cur += p[1]; if (cur > peak) peak = cur; });
  return peak;
}

/* فتح مهمة في الدرج الجانبي */
function taskDrawer(id) {
  const t = taskById(id); if (!t) return;
  const c = CAT[t.kind] || {}, L = userById(t.leaderId) || {}, org = orgById(t.orgId) || {};
  const running = now() >= t.start && now() < t.end && t.status !== 'done';
  const team = t.assigned.map(userById).filter(Boolean);
  const sp = (V.support || []).filter(s => s.taskId === t.id);

  openDrawer(t.title, t.kt + ' · ' + (L.name || ''), c.i || 'i-tasks',
    '<div class="card" style="--kc:' + (c.c || 'var(--g)') + '">' +
      '<div class="h"><span class="ico" style="color:' + (c.c || 'var(--dim)') + '">' +
        icon(c.i || 'i-tasks','s18') + '</span>' +
        '<span class="sp"><b>' + E(t.desc || '') + '</b>' +
        '<div class="tiny faint">' + E(t.place) + ' · ' + E(t.city) + '</div></span>' +
        (t.status === 'done' ? pill('منجزة','live') : running ? pill('جارية','live') : pill(untilTxt(t.start),'wait')) +
      '</div>' +
      '<div class="grid g2" style="gap:10px">' +
        '<span><div class="tiny faint">التاريخ</div><b>' + hijri(t.start) + '</b></span>' +
        '<span><div class="tiny faint">الوقت</div><b class="num">' + t12(t.start) + ' — ' + t12(t.end) + '</b></span>' +
        '<span><div class="tiny faint">الجهة</div><b>' + E(org.ar || '') + '</b></span>' +
        '<span><div class="tiny faint">المدة</div><b class="num">' + AR(t.durH) + ' ساعات</b></span>' +
      '</div>' +
      (t.rating ? '<div style="margin-top:14px"><div class="tiny faint">التقييم</div>' +
        '<div class="meter gold" style="margin-top:6px"><i data-w="' + (t.rating / 5 * 100) + '"></i></div>' +
        '<div class="tiny num" style="margin-top:5px">' + AR(t.rating) + ' من ٥</div></div>' : '') +
      (t.autoStarted ? '<div class="evt bad" style="margin-top:14px"><span class="dot"></span>' +
        '<span class="sp"><b>بدأها النظام</b><p>لم يبدأها ليدرها في وقتها — تُحتسب في تقييمه.</p></span></div>' : '') +
    '</div>' +

    '<div class="card"><div class="h">' + icon('i-users','s16') +
      '<span class="sp"><b>المسكَّنون</b><div class="tiny faint">' + AR(team.length) + ' محسن · ' +
      AR(t.attended.length) + ' أثبتوا حضورهم</div></span></div>' +
      '<div class="rows">' + team.slice(0, 8).map(m =>
        '<div class="row" style="padding:9px 4px">' + avatar(m) +
        '<span class="nm"><b>' + E(m.name) + '</b><span>' + E(m.specialty) +
        (m.reserve ? ' · احتياط' : '') + '</span></span>' +
        (t.attended.indexOf(m.id) >= 0 ? pill('حاضر','live') : pill('لم يحضر','grey')) +
        '</div>').join('') + '</div></div>' +

    (sp.length ? '<div class="card"><div class="h">' + icon('i-send','s16') +
      '<span class="sp"><b>طلبات الدعم</b></span></div>' +
      sp.map(s => '<div class="evt ' + (s.state === 'done' ? 'ok' : s.state === 'pending' ? 'warn' : 'bad') + '">' +
        '<span class="dot"></span><span class="sp"><b>' + LTR(s.no) + ' — ' + AR(s.count) + ' محسن</b>' +
        '<p>' + E(s.why) + (s.reason ? '<br>ردّك: ' + E(s.reason) : '') + '</p></span></div>').join('') +
      '</div>' : '') +

    '<button class="btn l" data-a="go" data-n="tasks">' + icon('i-tasks','s16') + 'عرض في جدول المهام</button>');
}
