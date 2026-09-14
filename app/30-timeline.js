/* ============================================================
   الخطّ الزمني — يُقرأ لغير المختصّ

   كان شريطًا واحدًا لموسمٍ كامل: كل مهمّة فيه أرقّ من شعرة، ولا
   يُعرف أين نحن منه. والمختصّ يُخمّن، وغير المختصّ يُعرض عنه.

   فصار:
     · **نافذة** تُختار — يوم أو ثلاثة أو أسبوع — لا الموسم كلّه.
     · **ساعاتٌ مكتوبة** فوقه، وخطُّ «الآن» يحمل الساعة.
     · **صفٌّ لكل فريق** باسمه وحِمله، والمهمّة فيه بعنوانها لا بلونها فقط.
     · **فلاترُ كاملة**: الفريق، والنوع، والحالة، والمدينة، والفندق.
     · **قراءاتٌ مكتوبة**: ذروة التزامن ومتى، وأطول فجوة، والمتعثّر.
   ============================================================ */

const TL_SPANS = [
  { k:'day',  ar:'اليوم',     h:24,  step:2 },
  { k:'d3',   ar:'ثلاثة أيام', h:72,  step:6 },
  { k:'week', ar:'أسبوع',     h:168, step:12 }
];
const tlSpan = () => TL_SPANS.find(s => s.k === (S.tab.tls || 'day')) || TL_SPANS[0];

/* بداية النافذة: من يوم الانتقال، ويُزاح بالأزرار */
function tlRange() {
  const sp = tlSpan();
  const off = Number(S.tab.tlo || 0);
  const a = dayStart(now()) + off * sp.h * HR;
  return { a, b: a + sp.h * HR, sp };
}

function screenTimeline() {
  const K = 'tml';
  const { a, b, sp } = tlRange();
  const span = b - a;
  const pct = ts => Math.max(0, Math.min(100, ((ts - a) / span) * 100));

  /* الفلاتر */
  let tasks = (V.tasks || []).filter(t => t.start < b && t.end > a);
  const inWin = tasks.length;
  const g = k => fOf(K, k);
  if (g('kind'))  tasks = tasks.filter(t => t.kind === g('kind'));
  if (g('state')) tasks = tasks.filter(t => tState(t) === g('state'));
  if (g('city'))  tasks = tasks.filter(t => t.city === g('city'));
  if (g('hotel')) tasks = tasks.filter(t => (taskHotel(t) || {}).id === g('hotel'));
  if (g('org'))   tasks = tasks.filter(t => t.orgId === g('org'));
  const q = qOf(K);
  if (q) tasks = tasks.filter(t => (t.title + ' ' + t.kt + ' ' + t.place).indexOf(q) >= 0);

  let rows = leaders();
  if (g('lead')) rows = rows.filter(L => L.id === g('lead'));
  if (g('org'))  rows = rows.filter(L => L.orgId === g('org'));
  rows = rows.filter(L => tasks.some(t => t.leaderId === L.id));

  /* القراءات: تُكتب ولا تُستنبط */
  const peak = tlPeak(tasks);
  const gap = tlGap(tasks, a, b);
  const stuck = tasks.filter(t => ['late', 'over'].indexOf(tState(t)) >= 0).length;
  const live = tasks.filter(t => tState(t) === 'live').length;

  /* شواهد الساعات */
  const marks = [];
  for (let t = a; t <= b; t += sp.step * HR) marks.push(t);

  return '<div class="grid g4">' +
      stat({ label:'مهام النافذة', n:tasks.length, ic:'i-tasks',
        sub:'من ' + AR(inWin) + ' في هذه المدّة',
        series:[8, 12, 10, 16, 14, 18, 15, Math.max(1, tasks.length)] }) +
      stat({ label:'جارية الآن', n:live, ic:'i-play', cls:live ? 'up' : '',
        sub:'تحت خطّ الساعة', series:[0, 1, 2, 1, 3, 2, 1, Math.max(1, live)] }) +
      stat({ label:'ذروة التزامن', n:peak.n, ic:'i-warn', cls:peak.n > 6 ? 'down' : '',
        sub:peak.n ? 'عند ' + t12(peak.at) + ' — ' + AR(peak.n) + ' مهمّة معًا' : 'لا تزامن',
        series:[2, 3, 4, 6, 5, 7, 6, Math.max(1, peak.n)] }) +
      stat({ label:'متعثّرة', n:stuck, ic:'i-clock', cls:stuck ? 'down' : 'up',
        sub:'حان وقتها أو فات', series:[1, 2, 1, 3, 2, 4, 2, Math.max(1, stuck)] }) +
    '</div>' +

    '<div class="card gold">' +
      head('الخطّ الزمني', 'نافذةٌ تُختار، وساعاتٌ مكتوبة، وصفٌّ لكل فريق',
        '<span class="fl" style="gap:7px">' +
          '<button class="btn l sm" data-a="tlmove" data-v="-1" aria-label="السابق">' +
            icon('i-fwd','s14') + '</button>' +
          '<button class="btn l sm" data-a="tlmove" data-v="0">الآن</button>' +
          '<button class="btn l sm" data-a="tlmove" data-v="1" aria-label="التالي">' +
            icon('i-back','s14') + '</button>' +
        '</span>', 'i-hist') +

      '<div class="tools">' + segmented('tls', TL_SPANS.map(s => [s.k, s.ar]),
        S.tab.tls || 'day') + '</div>' +

      '<div class="tlwin">' + icon('i-cal','s14') +
        '<b>' + dayName(a) + ' ' + hijri(a) + '</b>' +
        (sp.h > 24 ? '<span>إلى ' + dayName(b - HR) + ' ' + hijri(b - HR) + '</span>' : '') +
        '<span class="fsp"></span>' +
        '<span class="tiny faint">أطول فجوة بلا مهمّة: ' +
          (gap.ms ? AR(Math.round(gap.ms / HR)) + ' ساعة من ' + t12(gap.at) : 'لا فجوة') +
        '</span></div>' +

      filterBar(K, [
        { k:'lead',  label:'الفريق',    opts:optLeaders() },
        { k:'kind',  label:'نوع المهمة', opts:optKinds() },
        { k:'state', label:'الحالة',    opts:optStates() },
        { k:'city',  label:'المدينة',   opts:optTaskCities() },
        { k:'hotel', label:'الفندق',    opts:optHotels() },
        { k:'org',   label:'الجهة',     opts:optOrgs() }
      ], tasks.length, inWin, 'ابحث باسم المهمة أو الـKT أو المكان…') +

      (rows.length ? '<div class="tl2">' +
        '<div class="tl2head"><span class="tl2nm"></span><span class="tl2ax">' +
          marks.map(m => '<i style="inset-inline-end:' + pct(m) + '%">' +
            (sp.h > 24 ? dayName(m).slice(0, 3) + ' ' : '') + t12(m) + '</i>').join('') +
        '</span></div>' +
        rows.map(L => {
          const ts = tasks.filter(t => t.leaderId === L.id).sort((x, y) => x.start - y.start);
          const org = orgById(L.orgId) || {};
          return '<div class="tl2row">' +
            '<span class="tl2nm" data-a="ktopen" data-id="' + L.id + '">' +
              '<b>' + LTR(L.kt) + '</b>' +
              '<span>' + E(L.name.split(' ').slice(0, 2).join(' ')) + '</span>' +
              '<i>' + AR(ts.length) + ' مهمّة</i></span>' +
            '<span class="tl2ax">' +
              marks.map(m => '<u style="inset-inline-end:' + pct(m) + '%"></u>').join('') +
              (now() >= a && now() <= b
                ? '<span class="tl2now" style="inset-inline-end:' + pct(now()) + '%"></span>' : '') +
              ts.map(t => {
                const st = tsOf(t), c = CAT[t.kind] || {};
                const l = pct(t.start), w = Math.max(1.6, pct(t.end) - l);
                return '<span class="tl2seg ' + tState(t) + '" data-a="tlopen" data-id="' + t.id + '" ' +
                  'style="inset-inline-end:' + l + '%;width:' + w + '%;--tsc:' + st.c + '" ' +
                  'title="' + E(t.title + ' · ' + t12(t.start) + ' — ' + t12(t.end) +
                    ' · ' + st.ar) + '">' +
                  '<i>' + icon(c.i || 'i-tasks', 's12') + '</i>' +
                  '<b>' + E(t.title) + '</b>' +
                  '<u>' + t12(t.start) + '</u></span>';
              }).join('') +
            '</span></div>';
        }).join('') +
        '</div>' +
        '<div class="tl2key">' + Object.keys(TSTATE).filter(k => k !== 'cancelled').map(k =>
          '<span><i style="background:' + TSTATE[k].c + '"></i>' + TSTATE[k].ar + '</span>').join('') +
          '<span class="fsp"></span>' +
          '<span><i class="nowk"></i>خطّ الساعة الحالية</span>' +
        '</div>'
        : empty('لا مهام في هذه النافذة', 'انتقل يومًا أو وسّع المدّة أو امسح الفلاتر', 'i-cal')) +
    '</div>' +

    '<div class="grid g2">' +
      '<div class="card">' + head('ما يجري الآن', 'ما تحت خطّ الساعة تحديدًا', '', 'i-play') +
        (function () {
          const nowT = tasks.filter(t => now() >= t.start && now() < t.end);
          return nowT.length ? '<div class="plist">' + nowT.map(taskRow).join('') + '</div>'
            : '<div class="tiny faint">لا مهمّة جارية في هذه اللحظة.</div>';
        })() +
      '</div>' +
      '<div class="card">' + head('التالي خلال ساعتين', 'استعدّ قبل أن يحين', '', 'i-clock') +
        (function () {
          const nx = tasks.filter(t => t.start > now() && t.start - now() <= 2 * HR)
            .sort((x, y) => x.start - y.start);
          return nx.length ? '<div class="plist">' + nx.map(taskRow).join('') + '</div>'
            : '<div class="tiny faint">لا شيء وشيك — النافذة هادئة.</div>';
        })() +
      '</div>' +
    '</div>';
}

/* ذروة التزامن: كم مهمّة معًا، ومتى */
function tlPeak(list) {
  const pts = [];
  list.forEach(t => { pts.push([t.start, 1]); pts.push([t.end, -1]); });
  pts.sort((a, b) => a[0] - b[0]);
  let cur = 0, best = 0, at = 0;
  pts.forEach(p => { cur += p[1]; if (cur > best) { best = cur; at = p[0]; } });
  return { n: best, at };
}
/* أطول فجوة بلا مهمّة داخل النافذة */
function tlGap(list, a, b) {
  if (!list.length) return { ms: b - a, at: a };
  const iv = list.map(t => [Math.max(a, t.start), Math.min(b, t.end)])
    .sort((x, y) => x[0] - y[0]);
  let end = a, ms = 0, at = a;
  iv.forEach(([s, e]) => {
    if (s > end && s - end > ms) { ms = s - end; at = end; }
    if (e > end) end = e;
  });
  if (b > end && b - end > ms) { ms = b - end; at = end; }
  return { ms, at };
}
