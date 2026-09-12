/* ============================================================
   المهام بأنواعها الأربعة
   حجّ · إثراء التجربة · نُسك · امتثال
   ============================================================ */

function typeSwitch() {
  const cur = S.tab.tt || 'hajj';
  const n = {
    hajj: V.tasks.length,
    enrich: V.enrich.length,
    nusuk: openNusuk().length,
    comply: V.forms.length
  };
  return '<div class="tswitch">' + Object.keys(TASKTYPE).map(k => {
    const T = TASKTYPE[k];
    return '<button class="tcard' + (k === cur ? ' on' : '') + '" data-a="seg" data-k="tt" data-v="' + k + '">' +
      '<span class="tico" style="color:' + T.c + '">' + icon(T.i, 's18') + '</span>' +
      '<span class="nm"><b>' + E(T.ar) + '</b><span>' + E(T.d) + '</span></span>' +
      '<b class="tn num">' + AR(n[k]) + '</b></button>';
  }).join('') + '</div>';
}

function screenTasks() {
  const t = S.tab.tt || 'hajj';
  /* النوع يُختار من القائمة الجانبية — فلا يُكرَّر هنا */
  return (t === 'enrich' ? tabEnrich() : t === 'nusuk' ? tabNusuk()
      : t === 'comply' ? tabComply() : tabHajj());
}

/* ══════════════ ٢) إثراء التجربة ══════════════ */
function tabEnrich() {
  const f = S.tab.ef || 'open';
  const q = qOf('enr');
  let list = V.enrich.slice().sort((a, b) => a.start - b.start);
  if (f === 'open') list = list.filter(x => x.status === 'unassigned');
  else if (f === 'assigned') list = list.filter(x => x.status === 'assigned');
  else if (f === 'done') list = list.filter(x => x.status === 'done');
  if (q) list = list.filter(x => (siteById(x.siteId).ar + ' ' + x.ref).indexOf(q) >= 0);
  const fc = fOf('enr','city'), fk = fOf('enr','kt'), ft = fOf('enr','type');
  if (fc) list = list.filter(x => siteById(x.siteId).city === fc);
  if (fk) list = list.filter(x => x.kt === fk);
  if (ft) list = list.filter(x => { const o = x.kt ? V.orgs.find(z => z.kt === x.kt) : null;
    return o && o.type === ft; });
  const byCity = {};
  V.enrich.forEach(x => { const c = siteById(x.siteId).city; byCity[c] = (byCity[c] || 0) + 1; });
  const seats = V.enrich.reduce((a, x) => a + x.seats, 0);
  const booked = V.enrich.reduce((a, x) => a + x.booked, 0);

  return '<div class="grid g4">' +
      stat({ label:'رحلات واردة', n:V.enrich.length, ic:'i-bus',
        sub:'من نظام المزارات', series:[4,7,9,11,13,14,15,V.enrich.length] }) +
      stat({ label:'بلا تسكين', n:freeEnrich().length, ic:'i-flag',
        cls:freeEnrich().length ? 'warn' : 'up', sub:'تنتظر مجموعة',
        series:[1,2,2,3,3,4,3,Math.max(1, freeEnrich().length)] }) +
      stat({ label:'إشغال المقاعد', n:Math.round(booked / Math.max(1, seats) * 100), suffix:'٪',
        ic:'i-users', cls:'up', sub:AR(booked) + ' من ' + AR(seats) + ' مقعدًا',
        series:[52,58,61,66,70,73,76,Math.round(booked / Math.max(1, seats) * 100)] }) +
      stat({ label:'مدن المزارات', n:Object.keys(byCity).length, ic:'i-pin',
        sub:Object.keys(byCity).join(' · '), series:[1,2,2,3,3,4,4,Object.keys(byCity).length] }) +
    '</div>' +

    '<div class="card gold">' +
      head('واردة من نظام المزارات', 'لا تُنشأ هنا — تصل جاهزة وتُسكَّن على المجموعات',
        '<span class="fl" style="gap:10px">' +
        '<span class="synced">' + icon('i-reset','s14') + 'آخر مزامنة ' + ago(S.enrichSync) + '</span>' +
        '<button class="btn l sm" data-a="xsync">' + icon('i-reset','s16') + 'مزامنة الآن</button></span>',
        'i-bus') +
      '<div class="tools">' + segmented('ef',
        [['open','بلا تسكين'],['assigned','مسكَّنة'],['done','منتهية'],['all','الكل']], f) + '</div>' +
      filterBar('enr', [
        { k:'city', label:'المدينة', opts:optCities() },
        { k:'kt',   label:'الـKT',   opts:optKT() },
        { k:'type', label:'النوع',   opts:optTypes() }
      ], list.length, V.enrich.length, 'ابحث بمزار أو رقم رحلة…') +
      (list.length ? '<div class="plist">' + list.map((x, i) => {
        const si = siteById(x.siteId);
        const M = x.muhsenId ? userById(x.muhsenId) : null;
        const full = Math.round(x.booked / x.seats * 100);
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 45) + 'ms">' +
          '<span class="krail" style="background:#1B6E9C"></span>' +
          '<span class="ico" style="color:#1B6E9C">' + icon('i-pin','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(si.ar) + '</b>' +
          '<span>' + LTR(x.ref) + ' · ' + E(si.city) + ' · ' + AR(si.dur) + ' ساعات</span></span>' +
          '<span class="when"><b>' + hijri(x.start) + '</b>' +
            '<span class="num">' + t12(x.start) + ' — ' + t12(x.end) + '</span></span>' +
          '<span class="end">' + (M ? '<span class="fl" style="gap:8px">' + avatar(M, 'sm') +
              '<span class="tiny"><b>' + E(M.name) + '</b><br><span class="faint">' +
              E(x.kt || '') + '</span></span></span>' : pill('بلا تسكين', 'no')) + '</span>' +
          '<div style="width:100%;margin-top:10px">' +
            '<div class="fl" style="gap:11px">' +
              '<span class="meter" style="flex:1"><i data-w="' + full + '"></i></span>' +
              '<span class="tiny faint num">' + AR(x.booked) + '/' + AR(x.seats) + ' مقعدًا</span>' +
              (x.status === 'done' ? pill('انتهت', 'grey')
                : '<button class="btn ' + (M ? 'l' : 'p') + ' sm" data-a="xassign" data-id="' +
                  x.id + '">' + (M ? 'تغيير المحسن' : 'إسناد لمحسن') + '</button>') +
            '</div></div></div>';
      }).join('') + '</div>' : empty('لا رحلات في هذا التصنيف', '', 'i-bus')) +
    '</div>';
}

/* ══════════════ ٣) نُسك ══════════════ */
function tabNusuk() {
  const f = S.tab.nf || 'open';
  const q = qOf('nsk');
  let list = V.nusuk.slice().sort((a, b) => b.at - a.at);
  if (f !== 'all') list = list.filter(c => f === 'open' ? c.state !== 'delivered' : c.state === f);
  if (q) list = list.filter(c => (c.pilgrim + ' ' + c.passport + ' ' + c.kt + ' ' + c.no).indexOf(q) >= 0);
  const nk = fOf('nsk','kt'), ns = fOf('nsk','svc'), nb = fOf('nsk','by');
  if (nk) list = list.filter(c => c.kt === nk);
  if (ns) list = list.filter(c => c.svc === ns);
  if (nb) list = list.filter(c => c.openedBy === nb);
  const svcN = k => V.nusuk.filter(c => c.svc === k && c.state !== 'delivered').length;

  return '<div class="grid g4">' +
      stat({ label:'حالات مفتوحة', n:openNusuk().length, ic:'i-idcard',
        cls:openNusuk().length ? 'warn' : 'up', sub:'تنتظر إجراءً منك',
        series:[2,3,4,3,5,4,6,Math.max(1, openNusuk().length)] }) +
      stat({ label:'بدل فاقد', n:svcN('lost'), ic:'i-idcard', cls:svcN('lost') ? 'bad' : '',
        sub:'مهلة ' + AR(NUSUK_SVC.lost.sla) + ' ساعة', series:[1,1,2,1,2,2,3,Math.max(1, svcN('lost'))] }) +
      stat({ label:'إصدار جديد', n:svcN('issue'), ic:'i-plus',
        sub:'مهلة ' + AR(NUSUK_SVC.issue.sla) + ' ساعة', series:[0,1,1,2,1,2,2,Math.max(1, svcN('issue'))] }) +
      stat({ label:'تفعيل بطاقة', n:svcN('enable'), ic:'i-checkc',
        sub:'مهلة ' + AR(NUSUK_SVC.enable.sla) + ' ساعات', series:[1,2,1,2,2,3,2,Math.max(1, svcN('enable'))] }) +
    '</div>' +

    '<div class="card gold">' +
      head('خدمات بطاقة نُسك', 'ابحث عن الحاجّ ثم افتح له حالة — والكنترول من يُسندها',
        '<button class="btn p sm" data-a="nnew">' + icon('i-plus','s16') + 'فتح حالة جديدة</button>',
        'i-idcard') +
      '<div class="tools">' + segmented('nf', [['open','مفتوحة'],['new','جديدة'],
        ['processing','قيد الإصدار'],['issued','تنتظر التسليم'],['delivered','سُلّمت'],['all','الكل']], f) +
      '</div>' +
      filterBar('nsk', [
        { k:'kt',  label:'الـKT',   opts:optKT() },
        { k:'svc', label:'الخدمة', opts:Object.keys(NUSUK_SVC).map(k => [k, NUSUK_SVC[k].ar]) },
        { k:'by',  label:'فتحها',  opts:[['محسن','محسن'],['ليدر','ليدر'],['مشرف','مشرف'],['الكنترول','الكنترول']] }
      ], list.length, V.nusuk.length, 'ابحث باسم الحاجّ أو رقم جوازه…') +
      (list.length ? '<div class="plist">' + list.map((c, i) => {
        const SV = NUSUK_SVC[c.svc], ST = NUSUK_STATE[c.state];
        const to = c.assignedTo ? userById(c.assignedTo) : null;
        const pct = Math.round(c.step / SV.steps.length * 100);
        return '<div class="prow trow" data-a="nopen" data-id="' + c.id + '" ' +
          'style="flex-wrap:wrap;animation-delay:' + (i * 45) + 'ms">' +
          '<span class="krail ' + (c.svc === 'lost' ? 'r' : c.svc === 'issue' ? 'a' : '') + '"></span>' +
          '<span class="ico" style="color:' + TASKTYPE.nusuk.c + '">' + icon(SV.i,'s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(c.pilgrim) + '</b>' +
          '<span>' + LTR(c.no) + ' · جواز ' + LTR(c.passport) + ' · ' + E(c.kt) + '</span></span>' +
          '<span class="fl" style="gap:7px">' + pill(SV.ar, SV.c) + pill(ST.ar, ST.c) + '</span>' +
          '<span class="tiny faint">' + ago(c.at) + '</span>' +
          '<div style="width:100%;margin-top:10px">' +
            '<div class="quote">' + E(c.note) + ' — فتحها ' + E(c.openedBy) + '</div>' +
            '<div class="steps2">' + SV.steps.map((s, k) =>
              '<span class="st2' + (k < c.step ? ' done' : k === c.step ? ' now' : '') + '">' +
              '<i></i>' + E(s) + '</span>').join('') + '</div>' +
            '<div class="fl" style="gap:11px;margin-top:11px;flex-wrap:wrap">' +
              '<span class="meter" style="flex:1;min-width:120px"><i data-w="' + pct + '"></i></span>' +
              (to ? '<span class="fl" style="gap:8px">' + avatar(to, 'sm') +
                  '<span class="tiny"><b>' + E(to.name) + '</b><br>' +
                  '<span class="faint">' + E(to.role === 'leader' ? 'ليدر' : 'محسن') + ' — مُسنَدة إليه</span></span></span>'
                : '<button class="btn p sm" data-a="nassign" data-id="' + c.id + '">إسناد لمحسن أو ليدر</button>') +
              (c.state !== 'delivered'
                ? '<button class="btn l sm" data-a="nstep" data-id="' + c.id + '">تقديم الخطوة</button>' : '') +
            '</div></div></div>';
      }).join('') + '</div>' : empty('لا حالات في هذا التصنيف', 'افتح حالة جديدة من الأعلى', 'i-idcard')) +
    '</div>';
}

/* ══════════════ ٤) الامتثال ══════════════ */
/* ---------- لوحة القالب ---------- */
function formDash(id) {
  const f = formById(id); if (!f) return;
  const bs = subsOf(f.id).sort((a, b) => a.at - b.at);
  const avg = bs.length ? Math.round(bs.reduce((a, b) => a + b.score, 0) / bs.length) : 0;
  const targets = [...new Set(bs.map(b => b.target))];

  openDrawer(f.title, f.no + ' · ' + AR(bs.length) + ' زيارة · ' + AR(targets.length) + ' جهة', f.icon,
    '<div class="meta">' +
      '<div><span class="k">المتوسط</span><b class="num">' + AR(avg) + '٪</b></div>' +
      '<div><span class="k">زيارات</span><b class="num">' + AR(bs.length) + '</b></div>' +
      '<div><span class="k">أسئلة</span><b class="num">' + AR(f.qs.length) + '</b></div>' +
    '</div>' +

    '<div class="card">' + head('الجهات', 'ودرجة آخر زيارة لكلٍّ منها') +
      '<div class="plist">' + targets.map(tg => {
        const mine = bs.filter(b => b.target === tg);
        const last = mine[mine.length - 1];
        const first = mine[0];
        const delta = mine.length > 1 ? last.score - first.score : 0;
        return '<div class="prow">' +
          '<span class="ico">' + icon(f.icon,'s16') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(tg) + '</b>' +
          '<span>' + AR(mine.length) + ' زيارة · آخرها ' + ago(last.at) + '</span></span>' +
          (delta ? '<span class="delta ' + (delta > 0 ? 'up' : 'dn') + '">' +
            (delta > 0 ? '▲' : '▼') + ' ' + AR(Math.abs(delta)) + '</span>' : '') +
          '<span class="fl" style="gap:8px;min-width:120px">' +
            '<span class="meter' + (last.score < 70 ? ' red' : ' gold') + '" style="flex:1">' +
              '<i data-w="' + last.score + '"></i></span>' +
            '<b class="num">' + AR(last.score) + '٪</b></span></div>';
      }).join('') + '</div></div>' +

    '<div class="card">' + head('كل سؤال وإجاباته', 'من ' + AR(bs.length) + ' إدخالًا') +
      f.qs.map(q => {
        const vals = bs.map(b => (b.answers.find(a => a.id === q.id) || {}).v);
        let body;
        if (q.t === 'yn') {
          const yes = vals.filter(v => v === true).length;
          const pct = Math.round(yes / Math.max(1, vals.length) * 100);
          body = '<div class="fl" style="gap:10px;margin-top:8px">' +
            '<span class="meter" style="flex:1"><i data-w="' + pct + '"></i></span>' +
            '<span class="tiny num">' + AR(yes) + ' نعم · ' + AR(vals.length - yes) + ' لا</span></div>';
        } else if (q.t === 'rate') {
          const a = [1,2,3,4,5].map(n => ({ l:AR(n), v:vals.filter(v => v === n).length }));
          body = chartBars({ data:a });
        } else if (q.t === 'num') {
          const nums = vals.filter(v => typeof v === 'number');
          const mean = nums.length ? Math.round(nums.reduce((x, y) => x + y, 0) / nums.length) : 0;
          body = '<div class="fl" style="gap:10px;margin-top:8px">' +
            '<b class="num" style="font-size:22px">' + AR(mean) + '</b>' +
            '<span class="tiny faint">المتوسط · الأدنى ' + AR(Math.min.apply(null, nums.concat(0))) +
            ' · الأعلى ' + AR(Math.max.apply(null, nums.concat(0))) + '</span></div>';
        } else if (q.t === 'photo') {
          const n2 = vals.filter(Boolean).length;
          body = '<div class="fl" style="gap:10px;margin-top:8px">' +
            '<span class="meter" style="flex:1"><i data-w="' +
            Math.round(n2 / Math.max(1, vals.length) * 100) + '"></i></span>' +
            '<span class="tiny num">' + AR(n2) + ' صورة من ' + AR(vals.length) + '</span></div>';
        } else if (q.t === 'sign') {
          const n2 = vals.filter(Boolean).length;
          body = '<div class="fl" style="gap:10px;margin-top:8px">' +
            pill(AR(n2) + ' مُتعهَّد', 'live') +
            pill(AR(vals.length - n2) + ' بلا تعهّد', vals.length - n2 ? 'no' : 'grey') + '</div>';
        } else {
          body = '<div class="quote">' + E(String(vals[vals.length - 1] || '—')) + '</div>';
        }
        return '<div class="qblock"><div class="fl" style="gap:9px">' +
          '<b style="flex:1;font-size:12.5px">' + E(q.q) + '</b>' +
          pill(QT[q.t], 'grey') + '</div>' + body + '</div>';
      }).join('') + '</div>');
}

/* ---------- إدخال واحد ---------- */
function subDrawer(id) {
  const b = V.subs.find(x => x.id === id); if (!b) return;
  const f = formById(b.formId) || {}, by = userById(b.by) || {};
  const mine = subsOf(b.formId).filter(x => x.target === b.target).sort((a, c) => a.at - c.at);
  openDrawer(b.target, f.title + ' · الزيارة ' + AR(b.visit) + ' من ' + AR(b.of), f.icon,
    '<div class="fl" style="gap:13px">' + avatar(by, 'lg') +
      '<span class="nm" style="flex:1"><b style="font-size:15px">' + E(by.name || '') + '</b>' +
      '<span>' + E(b.kt) + ' · ' + hijri(b.at) + ' · ' + t12(b.at) + '</span></span>' +
      pill(AR(b.score) + '٪', b.score >= 85 ? 'live' : b.score >= 70 ? 'wait' : 'no') + '</div>' +

    '<div class="card">' + head('مسار الزيارات', 'هذه الجهة زُرِعت ' + AR(mine.length) + ' مرّة') +
      '<div class="visits">' + mine.map(v =>
        '<div class="vis' + (v.id === b.id ? ' on' : '') + '">' +
        '<b class="num">' + AR(v.visit) + '</b>' +
        '<span class="meter' + (v.score < 70 ? ' red' : ' gold') + '"><i data-w="' + v.score + '"></i></span>' +
        '<span class="tiny num">' + AR(v.score) + '٪</span></div>').join('') + '</div></div>' +

    '<div class="card">' + head('الإجابات', AR(f.qs.length) + ' سؤالًا') +
      '<div class="plist">' + f.qs.map(q => {
        const a = b.answers.find(x => x.id === q.id) || {};
        const v = q.t === 'yn' ? (a.v ? pill('نعم','live') : pill('لا','no'))
          : q.t === 'rate' ? stars(a.v || 0)
          : q.t === 'num' ? '<b class="num">' + AR(a.v) + '</b>'
          : q.t === 'photo' ? (a.v ? fileChip(a.v) : pill('بلا صورة','no'))
          : q.t === 'sign' ? (a.v ? pill('مُتعهَّد','live') : pill('بلا تعهّد','no'))
          : '<span class="tiny">' + E(String(a.v || '—')) + '</span>';
        return '<div class="prow" style="padding:10px 12px">' +
          '<span class="nm" style="flex:1"><b style="font-size:12.5px">' + E(q.q) + '</b>' +
          '<span>' + E(QT[q.t]) + (q.w ? ' · وزن ' + AR(q.w) : ' · لا يُحتسب') + '</span></span>' +
          '<span class="end">' + v + '</span></div>';
      }).join('') + '</div></div>');
}
