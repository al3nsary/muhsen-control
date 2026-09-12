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
