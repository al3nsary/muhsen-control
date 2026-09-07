/* ============================================================
   مكوّنات النظام — لبنات تُعاد في كل شاشة
   كل مكوّن هنا يرجع نصًّا، وحركته تُشغَّل في afterRender.
   ============================================================ */

/* ---------- شريط أقسام بمؤشّر ينزلق ---------- */
function segmented(key, items, cur) {
  const i = Math.max(0, items.findIndex(x => x[0] === cur));
  return '<div class="sw" data-sw="' + key + '" style="--n:' + items.length + ';--i:' + i + '">' +
    '<span class="swmark"></span>' +
    items.map(x => '<button class="' + (x[0] === cur ? 'on' : '') + '" ' +
      'data-a="seg" data-k="' + key + '" data-v="' + x[0] + '">' + E(x[1]) +
      (x[2] != null ? '<i>' + AR(x[2]) + '</i>' : '') + '</button>').join('') +
  '</div>';
}

/* ---------- فارق عن المدة السابقة ---------- */
function delta(v) {
  if (v === 0 || v == null) return '<span class="delta flat">' + icon('i-list','s14') + 'بلا تغيّر</span>';
  const up = v > 0;
  return '<span class="delta ' + (up ? 'up' : 'dn') + '">' +
    '<svg class="ic s14" viewBox="0 0 24 24"><path d="M12 ' + (up ? '19V5M6 11l6-6 6 6' : '5v14M6 13l6 6 6-6') +
    '"/></svg>' + AR(Math.abs(v)) + '</span>';
}

/* ---------- بطاقة مؤشّر كاملة ---------- */
function stat(o) {
  return '<div class="card kpi hov ' + (o.cls || '') + '">' +
    '<span class="lab">' + icon(o.ic || 'i-hash','s14') + E(o.label) + '</span>' +
    '<div class="kv"><b class="num" data-n="' + o.n + '"' +
      (o.suffix ? ' data-suffix="' + o.suffix + '"' : '') + '>' + AR(0) + '</b>' +
      (o.delta != null ? delta(o.delta) : '') + '</div>' +
    '<span class="sub">' + E(o.sub || '') + '</span>' +
    '<svg class="spark" viewBox="0 0 200 40" preserveAspectRatio="none">' +
      '<path d="' + sparkPath(o.series || [4, 7, 5, 9, 6, 11, 8, 13]) + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8"/></svg></div>';
}
function sparkPath(a) {
  const mx = Math.max.apply(null, a) || 1, n = a.length;
  return a.map((v, i) => (i ? 'L' : 'M') + (i / (n - 1) * 200).toFixed(1) + ' ' +
    (36 - (v / mx) * 30).toFixed(1)).join(' ');
}

/* ---------- رسم أعمدة ---------- */
function chartBars(o) {
  const mx = Math.max.apply(null, o.data.map(d => d.v)) || 1;
  return '<div class="chart">' +
    '<div class="bars">' + o.data.map((d, i) =>
      '<span class="barwrap" title="' + E(d.l + ': ' + AR(d.v)) + '">' +
        '<span class="bar' + (d.hot ? ' hot' : '') + '" data-h="' + Math.max(3, d.v / mx * 100) + '" ' +
          'style="animation-delay:' + (i * 45) + 'ms"><i></i></span>' +
        '<span class="bl">' + E(d.l) + '</span>' +
      '</span>').join('') + '</div>' +
    (o.foot ? '<div class="tiny faint" style="margin-top:10px">' + E(o.foot) + '</div>' : '') +
  '</div>';
}

/* ---------- قرص نسب ---------- */
function donut(o) {
  const tot = o.data.reduce((a, d) => a + d.v, 0) || 1;
  let acc = 0;
  const R = 54, C = 2 * Math.PI * R;
  const arcs = o.data.map((d, i) => {
    const frac = d.v / tot, len = frac * C, off = -acc * C;
    acc += frac;
    return '<circle class="arc" cx="70" cy="70" r="' + R + '" fill="none" stroke="' + d.c + '" ' +
      'stroke-width="15" stroke-linecap="butt" ' +
      'stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" ' +
      'stroke-dashoffset="' + off.toFixed(1) + '" ' +
      'style="animation-delay:' + (i * 110) + 'ms"/>';
  }).join('');
  return '<div class="donut">' +
    '<svg viewBox="0 0 140 140"><g transform="rotate(-90 70 70)">' + arcs + '</g></svg>' +
    '<span class="dc"><b class="num" data-n="' + tot + '">' + AR(0) + '</b>' +
      '<span>' + E(o.center || '') + '</span></span>' +
  '</div>' +
  '<div class="legend">' + o.data.map(d =>
    '<span><i style="background:' + d.c + '"></i>' + E(d.l) +
    '<b class="num">' + AR(d.v) + '</b></span>').join('') + '</div>';
}

/* ---------- جدول يُفرز ---------- */
function dataTable(o) {
  const sk = S.sort && S.sort[o.key] || {};
  const dir = sk.dir || 1, col = sk.col != null ? sk.col : (o.defaultCol || 0);
  const rows = o.rows.slice().sort((a, b) => {
    const A = a.sort[col], B = b.sort[col];
    if (A === B) return 0;
    return (A > B ? 1 : -1) * dir;
  });
  return '<div class="tbl">' +
    '<div class="th" style="grid-template-columns:' + o.cols.map(c => c.w || '1fr').join(' ') + '">' +
      o.cols.map((c, i) => '<button class="' + (i === col ? 'on' : '') + '" ' +
        'data-a="sort" data-k="' + o.key + '" data-v="' + i + '">' + E(c.t) +
        (i === col ? '<svg class="ic s14" viewBox="0 0 24 24"><path d="M12 ' +
          (dir > 0 ? '19V5M6 11l6-6 6 6' : '5v14M6 13l6 6 6-6') + '"/></svg>' : '') +
        '</button>').join('') + '</div>' +
    '<div class="tb' + (rows.length > 12 ? ' bulk' : '') + '">' + (rows.length ? rows.map((r, i) =>
      '<div class="tr" style="grid-template-columns:' + o.cols.map(c => c.w || '1fr').join(' ') + ';' +
        'animation-delay:' + (rows.length > 12 ? 0 : Math.min(i * 26, 300)) + 'ms"' +
        (r.act ? ' data-a="' + r.act + '" data-id="' + r.id + '"' : '') + '>' +
        r.cells.map(c => '<span>' + c + '</span>').join('') + '</div>').join('')
      : '<div class="empty" style="padding:34px">' + icon('i-search','s26') + '<b>لا صفوف</b></div>') +
    '</div></div>';
}

/* ---------- صفّ القرارات: ما ينتظرك الآن ---------- */
function decisionItems() {
  const items = [];
  openSupport().forEach(s => {
    const t = taskById(s.taskId) || {}, L = userById(s.by) || {};
    items.push({
      kind: 'bad', ic: 'i-send', t: 'طلب دعم — ' + (t.kt || ''),
      s: (L.name || '') + ' يطلب ' + AR(s.count) + ' محسن · ' + s.why,
      at: s.at,
      acts: '<button class="btn d sm" data-a="spno" data-id="' + s.id + '">اعتذار</button>' +
            '<button class="btn p sm" data-a="spok" data-id="' + s.id + '">إسناد من الاحتياط</button>'
    });
  });
  V.reports.filter(r => r.room && r.status !== 'مغلق').forEach(r => items.push({
    kind: 'warn', ic: 'i-key', t: 'تعديل بيانات غرفة — ' + r.kt,
    s: r.room.floor + ' · غرفة ' + r.room.no + ' — ' + r.title, at: r.at,
    acts: '<button class="btn p sm" data-a="roomapply" data-id="' + r.id + '">تحديث قاعدة البيانات</button>'
  }));
  escalatedReports().filter(r => !r.room).forEach(r => items.push({
    kind: 'warn', ic: 'i-flag', t: 'تقرير مصعَّد — ' + r.kt,
    s: r.title + ' — ' + r.body.slice(0, 70), at: r.at,
    acts: '<button class="btn l sm" data-a="go" data-n="reports">فتح التقرير</button>'
  }));
  V.tickets.filter(k => k.pri === 'حرجة' && k.status !== 'مغلقة').forEach(k => items.push({
    kind: 'bad', ic: 'i-ticket', t: 'تذكرة حرجة — ' + k.kt,
    s: k.title + ' · ' + k.from, at: k.at,
    acts: '<button class="btn l sm" data-a="go" data-n="tickets">متابعة</button>'
  }));
  items.sort((a, b) => (a.kind === 'bad' ? -1 : 1) - (b.kind === 'bad' ? -1 : 1) || b.at - a.at);
  return items;
}

function decisionQueue() {
  const items = decisionItems();
  return '<div class="card gold queue">' +
    head('يحتاج قرارك الآن', items.length ? 'رتّبتُها بالأولوية ثم بالأحدث' : 'لا شيء معلّق',
      items.length ? pill(AR(items.length) + ' بند', 'no') : pill('نظيف', 'live')) +
    (items.length ? '<div class="qlist">' + items.slice(0, 5).map((x, i) =>
      '<div class="qrow ' + x.kind + '" style="animation-delay:' + (i * 60) + 'ms">' +
        '<span class="qi">' + icon(x.ic, 's18') + '</span>' +
        '<span class="nm"><b>' + E(x.t) + '</b><span>' + E(x.s) + '</span></span>' +
        '<span class="tiny faint">' + ago(x.at) + '</span>' +
        '<span class="qa">' + x.acts + '</span>' +
      '</div>').join('') + '</div>' +
      (items.length > 5 ? '<div class="tiny faint" style="margin-top:10px">و' +
        AR(items.length - 5) + ' بندًا آخر في أقسامها</div>' : '')
      : '<div class="empty" style="padding:30px">' + icon('i-checkc','s26') +
        '<b>لا قرار معلّقًا</b><div class="tiny" style="margin-top:6px">' +
        'كل ما رفعه الميدان بُتَّ فيه.</div></div>') +
  '</div>';
}

/* ---------- حِمل الساعات: كم مهمة تعمل في كل ساعة اليوم ---------- */
function loadByHour() {
  const d0 = dayStart(now()), out = [];
  for (let h = 0; h < 24; h += 2) {
    const a = d0 + h * HR, b = a + 2 * HR;
    const n = V.tasks.filter(t => t.start < b && t.end > a).length;
    out.push({ l: AR(h), v: n, hot: now() >= a && now() < b });
  }
  return out;
}

/* ---------- توزيع حالات المهام ---------- */
function statusMix() {
  const run = runningTasks().length;
  const done = V.tasks.filter(t => t.status === 'done').length;
  const next = V.tasks.filter(t => t.start > now()).length;
  const auto = V.tasks.filter(t => t.autoStarted).length;
  return [
    { l:'جارية',  v:run,  c:'var(--live)' },
    { l:'قادمة',  v:next, c:'var(--blue)' },
    { l:'منجزة',  v:done - auto, c:'var(--gold)' },
    { l:'بدأها النظام', v:auto, c:'var(--red)' }
  ].filter(d => d.v > 0);
}

/* ---------- مقارنة الفرق ---------- */
function ktTable() {
  const rows = leaders().map(L => {
    const ts = V.tasks.filter(t => t.leaderId === L.id);
    const done = ts.filter(t => t.status === 'done');
    const live = ts.filter(t => now() >= t.start && now() < t.end && t.status !== 'done').length;
    const tk = openTickets().filter(k => k.leaderId === L.id).length;
    const sp = V.support.filter(s => (taskById(s.taskId) || {}).leaderId === L.id).length;
    const auto = ts.filter(t => t.autoStarted).length;
    const rate = done.length ? Number((done.reduce((a, t) => a + (t.rating || 0), 0) / done.length).toFixed(1)) : 0;
    return {
      id: L.id, act: 'ktopen',
      sort: [L.kt, L.pilgrims, live, tk, sp, rate],
      cells: [
        '<span class="fl">' + avatar(L, 'sm') +
          '<span class="nm"><b>' + E(L.kt) + '</b><span>' + E(L.name) + '</span></span></span>',
        '<b class="num">' + AR(L.pilgrims) + '</b>',
        live ? pill(AR(live) + ' جارية', 'live') : '<span class="faint">—</span>',
        tk ? pill(AR(tk), 'wait') : '<span class="faint">—</span>',
        sp ? pill(AR(sp), 'no') : '<span class="faint">—</span>',
        auto ? pill(AR(auto), 'no') : '<span class="faint">—</span>',
        rate ? stars(rate) : '<span class="faint">—</span>'
      ]
    };
  });
  return dataTable({
    key: 'kt', defaultCol: 0,
    cols: [{ t:'الفريق', w:'1.6fr' }, { t:'حجاج', w:'.6fr' }, { t:'الآن', w:'.8fr' },
           { t:'تذاكر', w:'.6fr' }, { t:'دعم', w:'.6fr' }, { t:'بدأها النظام', w:'.9fr' },
           { t:'التقييم', w:'1.2fr' }],
    rows
  });
}
