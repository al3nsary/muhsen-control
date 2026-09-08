/* ============================================================
   النقل — عشرة باصات تنقل المحسنين طوال الموسم
   ─────────────────────────────────────────────────────────────
   الرحلة تتبع مهمّة: من نقطة الانطلاق إلى موقعها، ثم عودة.
   وللباص الواحد رحلات في اليوم، تُجدوَل وتُعاد جدولتها.
   ============================================================ */

const BUS_ST = {
  planned: { ar:'مجدولة',  c:'wait' },
  running: { ar:'جارية',   c:'live' },
  done:    { ar:'انتهت',   c:'grey' },
  late:    { ar:'متأخّرة', c:'no'   }
};
const tripsOf = bid => V.trips.filter(t => t.busId === bid);
const busById = id => S.buses.find(b => b.id === id);
const tripState = t => t.done ? 'done'
  : now() > t.at + 30 * MIN && !t.done ? 'late'
  : now() >= t.at ? 'running' : 'planned';

/* رحلات يومٍ بعينه مرتّبة */
function tripsOn(day) {
  const d0 = dayStart(day), d1 = d0 + DAY;
  return V.trips.filter(t => t.at >= d0 && t.at < d1).sort((a, b) => a.at - b.at);
}

function screenTransport() {
  const day = S.tab.trday ? Number(S.tab.trday) : dayStart(now());
  const q = qOf('trp');
  const fb = fOf('trp','bus'), fk = fOf('trp','kind');
  let list = tripsOn(day);
  if (fb) list = list.filter(t => t.busId === fb);
  if (fk) list = list.filter(t => t.kind === fk);
  if (q) list = list.filter(t => (t.from + ' ' + t.to + ' ' + t.no).indexOf(q) >= 0);
  const late = tripsOn(day).filter(t => tripState(t) === 'late').length;
  const seats = tripsOn(day).reduce((a, t) => a + t.cap, 0);
  const taken = tripsOn(day).reduce((a, t) => a + t.riders.length, 0);

  /* أيام الموسم: خمسة قبل وخمسة بعد */
  const days = [];
  for (let i = -3; i <= 4; i++) days.push(dayStart(now()) + i * DAY);

  return '<div class="grid g4">' +
      stat({ label:'الباصات', n:S.buses.length, ic:'i-bus',
        sub:'تنقل المحسنين طوال الموسم', series:[4,6,7,8,9,10,10,S.buses.length] }) +
      stat({ label:'رحلات اليوم', n:tripsOn(day).length, ic:'i-hist',
        sub:dayName(day) + ' · ' + hijri(day),
        series:[12,18,22,26,30,34,38,Math.max(1, tripsOn(day).length)] }) +
      stat({ label:'إشغال المقاعد', n:seats ? Math.round(taken / seats * 100) : 0, suffix:'٪',
        ic:'i-users', cls:'up', sub:AR(taken) + ' من ' + AR(seats) + ' مقعدًا',
        series:[42,50,58,63,70,74,78,seats ? Math.round(taken / seats * 100) : 0] }) +
      stat({ label:'متأخّرة', n:late, ic:'i-warn', cls:late ? 'bad' : 'up',
        sub:late ? 'تجاوزت موعدها بنصف ساعة' : 'كل الرحلات في وقتها',
        series:[2,1,2,1,1,0,1,late] }) +
    '</div>' +

    '<div class="card">' +
      head('يوم الجدول', 'اختر يومًا لترى رحلاته',
        pill(AR(tripsOn(day).length) + ' رحلة', 'gold'), 'i-cal') +
      '<div class="daystrip">' + days.map(d =>
        '<button class="dchip' + (d === day ? ' on' : '') + (d === dayStart(now()) ? ' today' : '') +
        '" data-a="seg" data-k="trday" data-v="' + d + '">' +
        '<b>' + E(dayName(d)) + '</b><span>' + hijri(d) + '</span>' +
        '<i>' + AR(tripsOn(d).length) + '</i></button>').join('') + '</div>' +
    '</div>' +

    '<div class="card gold">' +
      head('مسار اليوم', 'كل صفٍّ باصّ، وكل كتلة رحلة — والخطّ الأحمر هو الآن',
        '<button class="btn p sm" data-a="trnew">' + icon('i-plus','s16') + 'جدولة رحلة</button>',
        'i-bus') +
      busGantt(day) +
    '</div>' +

    '<div class="card">' +
      head('رحلات اليوم', 'مرتّبة بوقتها', '', 'i-hist') +
      filterBar('trp', [
        { k:'bus',  label:'الباص',  opts:S.buses.map(b => [b.id, b.no + ' · ' + b.plate]) },
        { k:'kind', label:'النوع',  opts:[['toTask','إلى مهمة'],['toHotel','إلى فندق'],
          ['airport','استقبال حجاج'],['back','عودة']] }
      ], list.length, tripsOn(day).length, 'ابحث بنقطة أو رقم رحلة…') +
      (list.length ? '<div class="plist">' + list.map((t, i) => {
        const b = busById(t.busId) || {}, st = BUS_ST[tripState(t)];
        const full = Math.round(t.riders.length / Math.max(1, t.cap) * 100);
        return '<div class="prow trow" data-a="tropen" data-id="' + t.id + '" ' +
          'style="flex-wrap:wrap;animation-delay:' + (i * 35) + 'ms">' +
          '<span class="krail" style="background:' + (b.color || 'var(--dim)') + '"></span>' +
          '<span class="ico" style="color:' + (b.color || 'var(--dim)') + '">' +
            icon('i-bus','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(t.from) + ' ← ' + E(t.to) + '</b>' +
          '<span>' + LTR(t.no) + ' · ' + E(b.no || '') + ' · ' + E(t.driver) + '</span></span>' +
          '<span class="when"><b>' + t12(t.at) + '</b>' +
            '<span class="num">' + AR(t.dur) + ' دقيقة</span></span>' +
          '<span class="fl" style="gap:9px;min-width:140px">' +
            '<span class="meter" style="flex:1"><i data-w="' + full + '"></i></span>' +
            '<span class="tiny faint num">' + AR(t.riders.length) + '/' + AR(t.cap) + '</span></span>' +
          pill(st.ar, st.c) + '</div>';
      }).join('') + '</div>' : empty('لا رحلة في هذا اليوم', 'جدوِل رحلة من الأعلى', 'i-bus')) +
    '</div>' +

    '<div class="card">' +
      head('الأسطول', AR(S.buses.length) + ' باصات', '', 'i-bus') +
      '<div class="grid g3">' + S.buses.map(b => {
        const mine = tripsOn(day).filter(t => t.busId === b.id);
        const busy = mine.reduce((a, t) => a + t.dur, 0);
        return '<div class="busbox" style="--bc:' + b.color + '">' +
          '<div class="fl" style="gap:10px;margin-bottom:10px">' +
            '<span class="ico" style="color:' + b.color + '">' + icon('i-bus','s18') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(b.no) + '</b>' +
            '<span>' + LTR(b.plate) + ' · ' + AR(b.cap) + ' مقعدًا</span></span>' +
            pill(AR(mine.length) + ' رحلة', mine.length ? 'live' : 'grey') + '</div>' +
          '<div class="tiny faint">' + E(b.driver) + ' · ' + LTR(b.phone) + '</div>' +
          '<div class="meter gold" style="margin-top:10px"><i data-w="' +
            Math.min(100, Math.round(busy / 600 * 100)) + '"></i></div>' +
          '<div class="tiny faint" style="margin-top:6px">' +
            AR(Math.round(busy / 60)) + ' ساعات تشغيل اليوم</div>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
}

/* ---------- مسار اليوم: صفّ لكل باص ---------- */
function busGantt(day) {
  const d0 = dayStart(day);
  const H0 = 4, H1 = 24;                    /* اليوم يُعرض من الرابعة فجرًا */
  const span = (H1 - H0) * 60;
  const pos = ms => Math.max(0, Math.min(100,
    ((ms - d0) / MIN - H0 * 60) / span * 100));
  const nowPct = dayStart(now()) === d0 ? pos(now()) : -1;

  return '<div class="gantt">' +
    '<div class="ghead">' + Array.from({ length: 10 }, (_, i) => {
      const h = H0 + i * 2;
      return '<span style="inset-inline-start:' + ((h - H0) * 60 / span * 100) + '%">' +
        AR(h > 12 ? h - 12 : h) + (h >= 12 ? ' م' : ' ص') + '</span>';
    }).join('') + '</div>' +
    S.buses.map(b => {
      const mine = tripsOn(day).filter(t => t.busId === b.id);
      return '<div class="grow">' +
        '<span class="glabel" style="--bc:' + b.color + '"><b>' + E(b.no) + '</b>' +
          '<span>' + AR(mine.length) + '</span></span>' +
        '<span class="gtrack">' +
          (nowPct >= 0 ? '<i class="gnow" style="inset-inline-start:' + nowPct + '%"></i>' : '') +
          mine.map(t => {
            const l = pos(t.at), w = Math.max(1.4, t.dur / span * 100);
            const st = tripState(t);
            return '<button class="gtrip ' + st + '" data-a="tropen" data-id="' + t.id + '" ' +
              'style="inset-inline-start:' + l + '%;width:' + w + '%;--bc:' + b.color + '" ' +
              'title="' + E(t.from + ' ← ' + t.to + ' · ' + t12(t.at)) + '">' +
              '<span>' + E(t.to) + '</span></button>';
          }).join('') +
        '</span></div>';
    }).join('') +
  '</div>';
}

/* ---------- درج الرحلة ---------- */
function tripDrawer(id) {
  const t = V.trips.find(x => x.id === id) || S.trips.find(x => x.id === id);
  if (!t) return;
  const b = busById(t.busId) || {}, st = BUS_ST[tripState(t)];
  const task = t.taskId ? taskById(t.taskId) : null;
  S.drawer = { title:t.from + ' ← ' + t.to, sub:t.no + ' · ' + b.no + ' · ' + t12(t.at),
    icon:'i-bus', body:
    '<div class="fl" style="gap:9px;flex-wrap:wrap">' + pill(st.ar, st.c) +
      pill(AR(t.dur) + ' دقيقة', 'grey') +
      pill(AR(t.riders.length) + '/' + AR(t.cap) + ' مقعدًا', 'gold') + '</div>' +

    '<div class="meta">' +
      '<div><span class="k">الانطلاق</span><b>' + t12(t.at) + '</b></div>' +
      '<div><span class="k">الوصول</span><b>' + t12(t.at + t.dur * MIN) + '</b></div>' +
      '<div><span class="k">السائق</span><b>' + E(t.driver.split(' ')[0]) + '</b></div>' +
    '</div>' +

    (task ? '<div class="card">' + head('المهمّة المرتبطة', task.kt + ' · ' + task.place) +
      '<div class="prow" data-a="tlopen" data-id="' + task.id + '">' +
        '<span class="ico">' + icon((CAT[task.kind] || {}).i || 'i-tasks','s16') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(task.title) + '</b>' +
        '<span>' + hijri(task.start) + ' · ' + t12(task.start) + '</span></span></div></div>' : '') +

    '<div class="card gold">' + head('إعادة الجدولة', 'قدِّم الرحلة أو أخِّرها') +
      '<div class="fl" style="gap:8px;flex-wrap:wrap">' +
        [-60, -30, -15, 15, 30, 60].map(m =>
          '<button class="btn l sm" data-a="trmove" data-id="' + t.id + '" data-v="' + m + '">' +
          (m > 0 ? '+' : '−') + ' ' + AR(Math.abs(m)) + ' د</button>').join('') +
      '</div>' +
      '<div class="fl" style="gap:10px;margin-top:13px">' +
        '<button class="btn l" style="flex:1" data-a="trbus" data-id="' + t.id + '">' +
          icon('i-swap','s16') + 'تغيير الباص</button>' +
        (t.done ? '' : '<button class="btn p" data-a="trdone" data-id="' + t.id + '">' +
          icon('i-checkc','s16') + 'إنهاء</button>') +
      '</div></div>' +

    '<div class="card">' + head('الركّاب', AR(t.riders.length) + ' محسنًا',
        '<button class="btn l sm" data-a="trider" data-id="' + t.id + '">إضافة راكب</button>') +
      (t.riders.length ? '<div class="plist">' + t.riders.map(rid => {
        const u = userById(rid); if (!u) return '';
        return '<div class="prow">' + avatar(u, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
          '<span>' + LTR(u.code) + ' · ' + E(u.kt) + '</span></span>' +
          '<button class="xbtn" data-a="trrmv" data-id="' + t.id + '" data-v="' + rid + '">' +
            icon('i-x','s14') + '</button></div>';
      }).join('') + '</div>' : empty('لا ركّاب بعد', 'أضف من محسني المهمّة', 'i-users')) +
    '</div>'
  };
  renderDrawer();
}
