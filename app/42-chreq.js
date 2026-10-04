/* ============================================================
   طلباتُ تعديل المهام — بابٌ واحدٌ وحارسان

   البعثةُ والشركةُ تملكان تعديلَ مهامهما: وقتَها وعددَ حجّاجها
   وتفاصيلَها، وتأجيلَها وإلغاءَها وإنشاءَ غيرها. لكنّ ما تفعله
   **لا يقع فورًا**: يصير طلبًا ينتظر اعتمادَ الكنترول.

   والكنترولُ يفعل الشيءَ نفسَه فيقع في حينه بلا حاجز.

   فالبابُ واحد — نموذجٌ واحدٌ لا نموذجان — والفرقُ في من يضغط:
   يُقرأ من صفته لا من زرٍّ مختلف. ولو كان البابان اثنين لتفرّقت
   القواعدُ بينهما، فعُدِّل من هنا ما لا يُعدَّل من هناك.
   ============================================================ */

const CR_KIND = {
  edit:     { ar:'تعديل مهمة',  i:'i-edit',  c:'#1B6E9C' },
  postpone: { ar:'تأجيل مهمة',  i:'i-clock', c:'#D08C00' },
  cancel:   { ar:'إلغاء مهمة',  i:'i-x',     c:'#C0392B' },
  create:   { ar:'إنشاء مهمة',  i:'i-plus',  c:'#16A34A' }
};
const CR_STATE = {
  pending:  { ar:'بانتظار الاعتماد', p:'wait', c:'#D08C00', o:0 },
  approved: { ar:'مُعتمَد',          p:'live', c:'#16A34A', o:1 },
  rejected: { ar:'مرفوض',            p:'no',   c:'#C0392B', o:2 }
};
/* مهلةُ البتّ في الطلب — وبعدها يُصعَّد كما يُصعَّد البلاغ */
const CR_SLA = 120;

const chreqAll  = () => (V.chreq || []);
const chreqOpen = () => chreqAll().filter(r => r.state === 'pending');
const chreqDue  = r => r.state === 'pending' ? r.at + CR_SLA * MIN : null;

/* من يملك القرار المباشر: الإدارة العليا وحدها */
const mayApplyDirect = () => curPerm().scope === 'all';
/* من يملك الطلب: الجهاتُ على مهامها */
const mayRequest = () => ['org'].indexOf(curPerm().scope) >= 0;

/* ---------- نموذجُ التعديل ---------- */
/* حقلٌ واحدٌ لكلّ حقيقة، ولا حقلَ بلا عنوانٍ يقوله */
function taskForm(t, kind) {
  const f = S.tform || {};
  const v = k => f[k] != null ? f[k] : (t ? t[k] : '');
  const dt = ts => {
    const d = new Date(ts || Date.now());
    const p = n => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  const cats = Object.keys(CAT);
  const row = (lbl, hint, inner) =>
    '<div class="frow"><label class="flbl"><b>' + E(lbl) + '</b>' +
    (hint ? '<span>' + E(hint) + '</span>' : '') + '</label>' + inner + '</div>';

  return '<div class="card">' +
    head(kind === 'create' ? 'مهمة جديدة' : 'تفاصيل المهمة',
      kind === 'create' ? 'تُنشأ بكلّ تفاصيلها ثم تُسنَد'
        : 'عدِّل ما تحتاج — والباقي يبقى كما هو', '', 'i-tasks') +

    row('عنوان المهمة', 'الاسم هو ما يُقرأ في التطبيق',
      '<div class="field"><input id="tf_title" value="' + E(v('title')) + '" ' +
      'placeholder="مثال: استقبال الحجاج من المطار"></div>') +

    row('نوع المهمة', 'النوعُ يجلب دليلَ تنفيذه ومهامَه الفرعية',
      '<div class="chips">' + cats.map(k =>
        '<button class="chipbtn' + ((f.kind || (t && t.kind) || cats[0]) === k ? ' on' : '') +
        '" data-a="tfk" data-v="' + k + '">' + E(CAT[k].ar) + '</button>').join('') + '</div>') +

    '<div class="grid g2">' +
      row('وقت البداية', 'يُقرأ في التطبيق ويفتح التحضير قبله بساعتين',
        '<div class="field"><input id="tf_start" type="datetime-local" value="' +
        dt(f.start != null ? f.start : (t ? t.start : now() + 2 * HR)) + '"></div>') +
      row('المدّة بالساعات', 'منها يُحسب وقت الانتهاء',
        '<div class="field"><input id="tf_dur" type="number" min="1" max="24" value="' +
        AR0(f.durH != null ? f.durH : (t ? t.durH : 3)) + '"></div>') +
    '</div>' +

    '<div class="grid g2">' +
      row('عدد الحجّاج', 'كشفُ المجموعة المشمول بهذه المهمة',
        '<div class="field"><input id="tf_pax" type="number" min="0" max="500" value="' +
        AR0(f.pax != null ? f.pax : (t ? taskPilgrims(t) : 0)) + '"></div>') +
      row('المكان', 'يُعلن للفريق ويُقاس عليه نطاقُ الحضور',
        '<div class="field"><input id="tf_place" value="' + E(v('place')) + '" ' +
        'placeholder="مثال: صالة الحج — مطار الملك عبدالعزيز"></div>') +
    '</div>' +

    row('سبب التعديل', 'يُقرأ في السجلّ ويصل من يعتمد — فاكتبه بوضوح',
      '<div class="field"><textarea id="tf_why" rows="2" ' +
      'placeholder="لماذا يُعدَّل؟ وما الذي تغيّر في الميدان؟"></textarea></div>') +
  '</div>';
}

/* الأرقامُ في حقول الإدخال لاتينيّةٌ دائمًا — فالمتصفّح لا يقرأ العربيّة */
const AR0 = n => String(n == null ? '' : n);

function taskEditDrawer(id, kind) {
  const t = id ? taskById(id) : null;
  if (id && !t) return;
  kind = kind || (t ? 'edit' : 'create');
  const direct = mayApplyDirect();
  S.tform = S.tform && S.tform._id === (id || 'new') ? S.tform : { _id: id || 'new' };

  S.drawer = {
    title: CR_KIND[kind].ar, sub: t ? t.title + ' · ' + t.kt : 'تُنشأ ثم تُسنَد',
    icon: CR_KIND[kind].i, wide: true, body:

    /* الحارسُ يُقال أوّلًا لا بعد الضغط */
    '<div class="note ' + (direct ? '' : 'a') + '">' +
      icon(direct ? 'i-shield' : 'i-send', 's16') +
      '<span>' + (direct
        ? 'صفتُك <b>إدارة عليا</b> — ما تحفظه يقع في حينه ويُقيَّد باسمك ووقته.'
        : 'صفتُك <b>' + E(curPerm().ar) + '</b> — ما تحفظه يصير <b>طلبًا</b> ' +
          'ينتظر اعتماد الكنترول، ولا يقع قبله.') + '</span></div>' +

    taskForm(t, kind) +

    (t ? '<div class="card">' +
      head('إجراءاتٌ على المهمة', direct ? 'تقع في حينها' : 'تُرفع طلبًا', '', 'i-swap') +
      '<div class="fl" style="gap:9px;flex-wrap:wrap">' +
        '<button class="btn l" data-a="crask" data-id="' + t.id + '" data-v="postpone">' +
          icon('i-clock','s16') + 'تأجيل المهمة</button>' +
        '<button class="btn d" data-a="crask" data-id="' + t.id + '" data-v="cancel">' +
          icon('i-x','s16') + 'إلغاء المهمة</button>' +
      '</div></div>' : '') +

    '<div class="fl" style="gap:9px">' +
      '<button class="btn p sp" data-a="crsave" data-id="' + (t ? t.id : '') + '" ' +
        'data-v="' + kind + '">' + icon(direct ? 'i-checkc' : 'i-send','s16') +
        (direct ? 'حفظ التعديل' : 'رفع الطلب إلى الكنترول') + '</button>' +
      '<button class="btn l" data-a="closedrawer">إلغاء</button>' +
    '</div>' };
  renderDrawer();
}

/* ---------- القراءة من النموذج ---------- */
function taskFormRead(t) {
  const g = id => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };
  const num = id => { const x = Number(deAr(g(id))); return isFinite(x) ? x : null; };
  const startRaw = g('tf_start');
  const start = startRaw ? new Date(startRaw).getTime() : (t ? t.start : now());
  const durH = num('tf_dur') || (t ? t.durH : 3);
  return {
    title: g('tf_title') || (t ? t.title : ''),
    kind:  (S.tform && S.tform.kind) || (t ? t.kind : Object.keys(CAT)[0]),
    start: start, durH: durH, end: start + durH * HR,
    pax:   num('tf_pax'), place: g('tf_place') || (t ? t.place : ''),
    why:   g('tf_why')
  };
}

/* ---------- الحفظ: يقع أو يُرفع ---------- */
function crSave(id, kind) {
  const t = id ? taskById(id) : null;
  const d = taskFormRead(t);
  if (!d.title) { toast('اكتب عنوان المهمة', 'r'); return; }
  if (!d.why || d.why.length < 6) {
    toast(mayApplyDirect() ? 'اكتب سبب التعديل — يُقرأ في السجلّ'
      : 'اكتب سبب الطلب — يقرؤه من يعتمده', 'r'); return;
  }
  if (mayApplyDirect()) { crApply(kind, t, d, 'الكنترول'); S.drawer = null; S.tform = null; save(); render(); return; }
  crQueue(kind, t, d);
}

/* الوقوع المباشر */
function crApply(kind, t, d, by) {
  if (kind === 'create') {
    const c = CAT[d.kind] || CAT[Object.keys(CAT)[0]];
    const L = (leaders()[0] || {});
    const nt = {
      id: uid('T'), kind: d.kind, code: 1900 + S.tasks.length,
      title: d.title, desc: c.desc, place: d.place || c.place, city: c.city, photo: c.photo,
      leaderId: L.id, orgId: L.orgId, kt: L.kt,
      start: d.start, end: d.end, durH: d.durH,
      status: 'assigned', assigned: [], attended: [], rating: null,
      paxOverride: d.pax, notes: [], subs: [], hist: []
    };
    S.tasks.unshift(ensureTask(nt));
    logIt('أُنشئت مهمة «' + d.title + '» — ' + by);
    toast('أُنشئت المهمة');
    return nt.id;
  }
  if (!t) return null;
  if (kind === 'cancel') {
    t.status = 'cancelled'; t.cancelledAt = now(); t.cancelWhy = d.why;
    logIt('أُلغيت مهمة «' + t.title + '» — ' + by + ' · ' + d.why, 'warn');
    toast('أُلغيت المهمة');
    return t.id;
  }
  const was = { start:t.start, durH:t.durH, title:t.title, place:t.place };
  t.title = d.title; t.kind = d.kind; t.place = d.place;
  t.start = d.start; t.durH = d.durH; t.end = d.end;
  if (d.pax != null) t.paxOverride = d.pax;
  (t.hist = t.hist || []).unshift({ at:now(), by:by, kind:'edit',
    text:(kind === 'postpone' ? 'أُجّلت المهمة إلى ' : 'عُدّلت المهمة — ') +
      t12(t.start) + ' · ' + d.why });
  logIt((kind === 'postpone' ? 'أُجّلت' : 'عُدّلت') + ' مهمة «' + t.title + '» — ' + by);
  toast(kind === 'postpone' ? 'أُجّلت المهمة' : 'حُفظ التعديل');
  return t.id;
}

/* الرفعُ طلبًا */
function crQueue(kind, t, d) {
  const p = curPerm();
  const r = {
    id: uid('CR'), no: 'CR-' + (1400 + (S.chreq || []).length),
    at: now(), kind: kind, taskId: t ? t.id : null,
    taskTitle: t ? t.title : d.title, kt: t ? t.kt : '—',
    byPerm: p.k, byAr: p.ar, byOrg: (S.actor || {}).orgId || null,
    fields: d, reason: d.why, state: 'pending',
    decidedAt: null, decidedBy: null, decideNote: ''
  };
  S.chreq = (S.chreq || []).concat([r]);
  logIt('طلبُ ' + CR_KIND[kind].ar + ' «' + r.taskTitle + '» من ' + p.ar + ' — بانتظار الاعتماد');
  toast('رُفع الطلب إلى الكنترول — ' + r.no);
  S.drawer = null; S.tform = null; save(); render();
}

/* طلبٌ سريع بلا نموذج: تأجيلٌ أو إلغاء */
function crAsk(id, kind) {
  const t = taskById(id); if (!t) return;
  S.drawer = {
    title: CR_KIND[kind].ar, sub: t.title + ' · ' + t.kt, icon: CR_KIND[kind].i, body:
    '<div class="card">' +
      head(CR_KIND[kind].ar, mayApplyDirect() ? 'يقع في حينه' : 'يُرفع طلبًا إلى الكنترول',
        '', CR_KIND[kind].i) +
      (kind === 'postpone' ? '<div class="frow">' +
        '<label class="flbl"><b>الموعد الجديد</b><span>إلى متى تُؤجَّل؟</span></label>' +
        '<div class="field"><input id="tf_start" type="datetime-local"></div></div>' : '') +
      '<div class="frow"><label class="flbl"><b>السبب</b>' +
        '<span>يُقرأ في السجلّ ولا يُمحى</span></label>' +
        '<div class="field"><textarea id="tf_why" rows="3" ' +
        'placeholder="اكتب السبب بوضوح — يقرؤه من يراجع بعدك."></textarea></div></div>' +
    '</div>' +
    '<button class="btn p" style="width:100%" data-a="crdo" data-id="' + t.id + '" ' +
      'data-v="' + kind + '">' + icon('i-checkc','s16') +
      (mayApplyDirect() ? 'تنفيذ' : 'رفع الطلب') + '</button>' };
  renderDrawer();
}
function crDo(id, kind) {
  const t = taskById(id); if (!t) return;
  const g = i2 => { const e = document.getElementById(i2); return e ? String(e.value).trim() : ''; };
  const why = g('tf_why');
  if (!why || why.length < 6) { toast('اكتب السبب بوضوح', 'r'); return; }
  const sr = g('tf_start');
  const d = { title:t.title, kind:t.kind, place:t.place,
    start: sr ? new Date(sr).getTime() : t.start, durH:t.durH,
    end: (sr ? new Date(sr).getTime() : t.start) + t.durH * HR,
    pax: null, why: why };
  if (mayApplyDirect()) { crApply(kind, t, d, 'الكنترول'); S.drawer = null; save(); render(); return; }
  crQueue(kind, t, d);
}

/* ---------- الاعتماد ---------- */
function crDecide(id, ok) {
  const r = (S.chreq || []).find(x => x.id === id); if (!r || r.state !== 'pending') return;
  const el = document.getElementById('cr_note');
  const note = el ? String(el.value).trim() : '';
  if (!ok && note.length < 4) { toast('اكتب سبب الرفض — يصل مقدّم الطلب', 'r'); return; }
  r.state = ok ? 'approved' : 'rejected';
  r.decidedAt = now(); r.decidedBy = 'الكنترول'; r.decideNote = note;
  if (ok) crApply(r.kind, r.taskId ? taskById(r.taskId) : null, r.fields, r.byAr + ' — باعتماد الكنترول');
  logIt((ok ? 'اعتُمد' : 'رُفض') + ' طلبُ ' + CR_KIND[r.kind].ar + ' ' + r.no +
    ' من ' + r.byAr + (note ? ' · ' + note : ''), ok ? 'ok' : 'warn');
  toast(ok ? 'اعتُمد الطلب ووقع أثرُه' : 'رُفض الطلب وأُبلغ مقدّمُه');
  S.drawer = null; save(); render();
}

/* ---------- الشاشة ---------- */
function screenChreq() {
  const K = 'cr';
  const all = chreqAll().slice().sort((a, b) =>
    (CR_STATE[a.state].o - CR_STATE[b.state].o) || b.at - a.at);
  const f = S.tab.crf || 'pending';
  let list = all.filter(r => f === 'all' ? true : r.state === f);
  const q = qOf(K);
  if (q) list = list.filter(r => (r.no + ' ' + r.taskTitle + ' ' + r.byAr).indexOf(q) >= 0);
  const late = chreqOpen().filter(r => now() > chreqDue(r)).length;

  return '<div class="grid g4">' +
      stat({ label:'بانتظار قرارك', n:chreqOpen().length, ic:'i-send',
        cls:chreqOpen().length ? 'warn' : '', sub:'لا يقع شيءٌ قبل اعتمادك',
        series:[1,2,1,3,2,4,3,Math.max(1, chreqOpen().length)] }) +
      stat({ label:'تجاوزت المهلة', n:late, ic:'i-warn', cls:late ? 'bad' : '',
        sub:'مضى عليها أكثر من ساعتين', series:[0,0,1,0,1,1,2,Math.max(0, late)] }) +
      stat({ label:'اعتُمدت', n:all.filter(r => r.state === 'approved').length, ic:'i-checkc',
        cls:'up', sub:'ووقع أثرُها على المهمة', series:[0,1,2,3,5,6,8,9] }) +
      stat({ label:'رُفضت', n:all.filter(r => r.state === 'rejected').length, ic:'i-x',
        sub:'وأُبلغ مقدّمُها بالسبب', series:[0,0,1,1,1,2,2,2] }) +
    '</div>' +

    '<div class="card">' +
      head('طلبات تعديل المهام',
        'البعثةُ والشركةُ تعدّلان مهامهما — ولا يقع التعديلُ قبل اعتماد الكنترول',
        '<button class="btn p sm" data-a="tnew">' + icon('i-plus','s16') +
        'مهمة جديدة</button>', 'i-send') +
      '<div class="quote">ما يصل هنا طلبٌ لا أمر. والاعتمادُ يُوقِع أثرَه على المهمة ' +
        'في حينه، والرفضُ يُبلَّغ بسببه — وكلاهما يُقيَّد في السجلّ باسمه ووقته.</div>' +
      '<div class="tools">' + segmented('crf',
        [['pending','بانتظار الاعتماد'],['approved','مُعتمَدة'],['rejected','مرفوضة'],['all','الكل']],
        f) + '</div>' +
      filterBar(K, [], list.length, all.length, 'ابحث برقم الطلب أو اسم المهمة أو الجهة…') +
      (list.length ? '<div class="plist">' + list.map(crRow).join('') + '</div>'
        : empty('لا طلبات في هذا التصنيف', '', 'i-send')) +
    '</div>';
}

function crRow(r) {
  const k = CR_KIND[r.kind], st = CR_STATE[r.state];
  return '<div class="prow" style="--tsc:' + k.c + '" data-a="cropen" data-id="' + r.id + '">' +
    '<span class="krail"></span>' +
    '<span class="ico" style="color:' + k.c + '">' + icon(k.i,'s18') + '</span>' +
    '<span class="nm" style="flex:1;min-width:160px"><b>' + E(r.taskTitle) + '</b>' +
      '<span>' + LTR(r.no) + ' · ' + E(k.ar) + ' · ' + E(r.byAr) + ' · ' + LTR(r.kt) + '</span></span>' +
    '<span class="nm" style="flex:1.2;min-width:180px"><span class="tiny faint">السبب</span>' +
      '<b style="font-weight:500">' + E(String(r.reason || '').slice(0, 90)) + '</b></span>' +
    '<span class="when"><b>' + ago(r.at) + '</b>' +
      (r.state === 'pending'
        ? cdown(chreqDue(r), { sla:CR_SLA, ttl:'حتى يُصعَّد الطلبُ لتأخّر البتّ فيه' })
        : '<span class="num">' + (r.decidedAt ? t12(r.decidedAt) : '—') + '</span>') + '</span>' +
    '<span class="end">' + pill(st.ar, st.p) + '</span></div>';
}

function crDrawer(id) {
  const r = (S.chreq || []).find(x => x.id === id); if (!r) return;
  const k = CR_KIND[r.kind], st = CR_STATE[r.state], d = r.fields || {};
  const t = r.taskId ? taskById(r.taskId) : null;
  const row = (a, b) => '<div class="kv"><span class="k">' + E(a) + '</span><b>' + b + '</b></div>';
  /* المقارنة: ما كان وما يُطلب — في عمودين لا في سطرٍ يُفكّ بالذهن */
  const diff = (lbl, was, now2) => '<div class="crdiff"><span class="k">' + E(lbl) + '</span>' +
    '<s>' + was + '</s>' + icon('i-back','s13') + '<b>' + now2 + '</b></div>';

  S.drawer = { title:k.ar, sub:r.no + ' · ' + r.byAr, icon:k.i, body:
    '<div class="card">' + head(E(r.taskTitle), E(r.kt) + ' · ' + ago(r.at),
      pill(st.ar, st.p), k.i) +
      row('مُقدِّم الطلب', E(r.byAr)) +
      row('نوع الطلب', E(k.ar)) +
      (r.state === 'pending' ? '<div class="kv"><span class="k">حتى تصعيد الطلب</span><b>' +
        cdown(chreqDue(r), { sla:CR_SLA }) + '</b></div>' : '') +
      '<div class="quote">' + E(r.reason || '—') + '</div>' +
    '</div>' +

    '<div class="card">' + head('ما يُطلب تغييرُه', t ? 'مقارنةً بالمسجَّل الآن' : 'مهمةٌ جديدة',
      '', 'i-swap') +
      (t ? diff('العنوان', E(t.title), E(d.title)) +
           diff('البداية', t12(t.start) + ' · ' + hijri(t.start),
                           t12(d.start) + ' · ' + hijri(d.start)) +
           diff('المدّة', AR(t.durH) + ' س', AR(d.durH) + ' س') +
           diff('المكان', E(t.place), E(d.place)) +
           (d.pax != null ? diff('عدد الحجّاج', AR(taskPilgrims(t)), AR(d.pax)) : '')
         : row('العنوان', E(d.title)) + row('النوع', E((CAT[d.kind] || {}).ar || '')) +
           row('البداية', t12(d.start) + ' · ' + hijri(d.start)) +
           row('المدّة', AR(d.durH) + ' ساعات') +
           row('المكان', E(d.place))) +
    '</div>' +

    (r.state === 'pending' && mayApplyDirect() ? '<div class="card">' +
      head('القرار', 'الاعتمادُ يُوقِع الأثرَ في حينه، والرفضُ يُبلَّغ بسببه', '', 'i-shield') +
      '<div class="field"><textarea id="cr_note" rows="2" ' +
        'placeholder="ملاحظةٌ تصل مقدّم الطلب — إلزاميّةٌ عند الرفض"></textarea></div>' +
      '<div class="fl" style="gap:9px;margin-top:10px">' +
        '<button class="btn p sp" data-a="crok" data-id="' + r.id + '">' +
          icon('i-checkc','s16') + 'اعتماد وتنفيذ</button>' +
        '<button class="btn d" data-a="crno" data-id="' + r.id + '">' +
          icon('i-x','s16') + 'رفض</button>' +
      '</div></div>'
      : r.state !== 'pending' ? '<div class="card">' +
        head('القرار', (r.decidedBy || '') + ' · ' + (r.decidedAt ? hijri(r.decidedAt) + ' · ' + t12(r.decidedAt) : ''),
          pill(st.ar, st.p), 'i-shield') +
        '<div class="quote">' + E(r.decideNote || 'بلا ملاحظة') + '</div></div>' : '') };
  renderDrawer();
}
