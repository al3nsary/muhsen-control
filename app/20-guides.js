/* ============================================================
   أدلة التنفيذ — تُبنى هنا وتُربط بالمهام وتُنشر إلى الأجهزة
   ─────────────────────────────────────────────────────────────
   الدليل يُربط بطريقين:
     · بالتصنيف — فيسري على كل مهام نوعه تلقائيًّا.
     · بمهمّة بعينها — فيَغلب على تصنيفها.
   ============================================================ */

const G_SCOPE = {
  hajj:   { ar:'نشاط حجّ',       i:'i-kaaba',  c:'#0B7A4B' },
  enrich: { ar:'مزار — إثراء',   i:'i-pin',    c:'#1B6E9C' },
  nusuk:  { ar:'خدمة نُسك',      i:'i-idcard', c:'#6B4E9E' },
  comply: { ar:'نموذج امتثال',   i:'i-clip',   c:'#B8791A' },
  free:   { ar:'دليل خاصّ',      i:'i-guide',  c:'#8A5A1E' }
};
const G_ST = {
  draft:  { ar:'مسودة',        c:'grey' },
  review: { ar:'قيد المراجعة', c:'wait' },
  live:   { ar:'معتمد',        c:'live' }
};
const MEDIA_KIND = {
  text:  { ar:'نص',    i:'i-list' },
  photo: { ar:'صور',   i:'i-photo' },
  video: { ar:'فيديو', i:'i-play' },
  pdf:   { ar:'PDF',   i:'i-doc' }
};

/* خيارات الهدف حسب التصنيف */
function gTargets(scope) {
  if (scope === 'hajj')   return Object.keys(CAT).map(k => [k, CAT[k].ar]);
  if (scope === 'enrich') return SITES.map(s => [s.id, s.ar]);
  if (scope === 'nusuk')  return Object.keys(NUSUK_SVC).map(k => [k, NUSUK_SVC[k].ar]);
  if (scope === 'comply') return V.forms.map(f => [f.id, f.title]);
  return [];
}
const gTargetAr = (scope, t) => {
  const o = gTargets(scope).find(x => x[0] === t);
  return o ? o[1] : '—';
};
/* دليل هذه المهمّة: الخاصّ أوّلًا ثم دليل تصنيفها */
function guideForTask(t) {
  const own = V.guides.find(g => g.taskId === t.id && g.status === 'live');
  if (own) return own;
  return V.guides.find(g => g.scope === 'hajj' && g.target === t.kind && g.status === 'live') || null;
}
const guideFor = (scope, target) =>
  V.guides.find(g => g.scope === scope && g.target === target && g.status === 'live') || null;

function screenGuides() {
  const q = qOf('gd');
  const fs2 = fOf('gd','scope'), fst = fOf('gd','state');
  let list = V.guides.slice().sort((a, b) => b.at - a.at);
  if (fs2) list = list.filter(g => g.scope === fs2);
  if (fst) list = list.filter(g => g.status === fst);
  if (q) list = list.filter(g => (g.title + ' ' + gTargetAr(g.scope, g.target)).indexOf(q) >= 0);
  const live = V.guides.filter(g => g.status === 'live').length;

  return '<div class="grid g4">' +
      stat({ label:'أدلة معتمدة', n:live, ic:'i-checkc', cls:'up',
        sub:'يقرؤها الميدان الآن', series:[4,5,6,7,8,9,10,live] }) +
      stat({ label:'مسودات', n:V.guides.filter(g => g.status === 'draft').length, ic:'i-guide',
        cls:'warn', sub:'لا يراها أحد', series:[3,2,3,2,3,2,3,2] }) +
      stat({ label:'مرتبطة بمهمّة بعينها', n:V.guides.filter(g => g.taskId).length, ic:'i-tasks',
        sub:'تَغلب على دليل التصنيف', series:[0,1,1,2,2,3,3,3] }) +
      stat({ label:'وسائط مرفوعة', n:V.guides.reduce((a, g) => a + (g.media || []).length, 0),
        ic:'i-photo', sub:'نصّ وصور وفيديو وPDF', series:[6,9,12,15,18,20,22,24] }) +
    '</div>' +

    '<div class="card gold">' +
      head('أدلة التنفيذ', 'الدليل يُربط بتصنيف فيسري على كل مهامه، أو بمهمّة بعينها',
        '<button class="btn p sm" data-a="gdnew">' + icon('i-plus','s16') + 'دليل جديد</button>',
        'i-guide') +
      filterBar('gd', [
        { k:'scope', label:'التصنيف', opts:Object.keys(G_SCOPE).map(k => [k, G_SCOPE[k].ar]) },
        { k:'state', label:'الحالة',  opts:Object.keys(G_ST).map(k => [k, G_ST[k].ar]) }
      ], list.length, V.guides.length, 'ابحث بعنوان أو هدف…') +

      (list.length ? '<div class="gcards">' + list.map((g, i) => {
        const sc = G_SCOPE[g.scope] || G_SCOPE.free, st = G_ST[g.status] || G_ST.draft;
        const t = g.taskId ? taskById(g.taskId) : null;
        return '<div class="gcard" style="animation-delay:' + (i * 45) + 'ms">' +
          '<span class="gtop" style="background:' + sc.c + '"></span>' +
          '<div class="fl" style="margin-bottom:11px">' +
            '<span class="ico" style="color:' + sc.c + '">' + icon(sc.i,'s18') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(g.title) + '</b>' +
            '<span>' + E(sc.ar) + ' · ' + E(t ? t.title : gTargetAr(g.scope, g.target)) +
            ' · ن' + AR(g.ver) + '</span></span>' +
            pill(st.ar, st.c) + '</div>' +
          '<div class="mrow">' + (g.media || []).map(m =>
            '<span class="mchip">' + icon(MEDIA_KIND[m.k].i,'s14') + E(m.name || MEDIA_KIND[m.k].ar) +
            '</span>').join('') +
            '<span class="mchip">' + icon('i-list','s14') + AR((g.steps || []).length) + ' خطوة</span>' +
          '</div>' +
          '<div class="pfoot">' +
            '<span class="ok">' + ago(g.at) + '</span>' +
            '<span class="fl" style="gap:7px">' +
              '<button class="btn l sm" data-a="gdedit" data-id="' + g.id + '">تعديل</button>' +
              '<button class="btn l sm" data-a="gdview" data-id="' + g.id + '">معاينة</button>' +
              (g.status === 'live'
                ? '<button class="btn l sm" data-a="gdunpub" data-id="' + g.id + '">سحب</button>'
                : '<button class="btn p sm" data-a="gdpub" data-id="' + g.id + '">اعتماد ونشر</button>') +
            '</span></div></div>';
      }).join('') + '</div>'
        : empty('لا دليل يطابق', 'أنشئ دليلًا أو وسّع الفلاتر', 'i-guide')) +
    '</div>';
}

/* ---------- محرّر الدليل ---------- */
function guideEdit(id) {
  S.gb = S.gb || (id
    ? Object.assign({ editing:id }, JSON.parse(JSON.stringify(V.guides.find(g => g.id === id))))
    : { title:'', scope:'hajj', target:Object.keys(CAT)[0], taskId:null,
        steps:[], media:[], status:'draft', ver:1, editing:null });
  const b = S.gb;
  const sc = G_SCOPE[b.scope] || G_SCOPE.free;
  const targets = gTargets(b.scope);

  S.drawer = { title:b.editing ? 'تعديل دليل' : 'دليل تنفيذ جديد',
    sub:'يُربط بتصنيف فيسري على كل مهامه، أو بمهمّة بعينها', icon:'i-guide', body:

    '<div class="card">' + head('١ · هويّته', 'عنوانه وما يخدمه') +
      '<label class="fl2" style="margin-top:0">العنوان</label>' +
      '<input class="fld" id="q-gbt" data-q="gbt" value="' + E(b.title) + '" ' +
        'placeholder="مثال: خطوات استقبال الحجاج في صالة الحج">' +
      '<label class="fl2">التصنيف</label>' +
      '<div class="chips">' + Object.keys(G_SCOPE).map(k =>
        '<button class="chip2' + (b.scope === k ? ' on' : '') + '" data-a="gbscope" data-v="' + k + '">' +
        E(G_SCOPE[k].ar) + '</button>').join('') + '</div>' +
      (targets.length
        ? '<label class="fl2">يسري على</label>' +
          '<label class="fsel wide on"><span>' + E(sc.ar) + '</span>' +
            '<select data-f="gb" data-fk="target">' + targets.map(o =>
              '<option value="' + E(o[0]) + '"' + (b.target === o[0] ? ' selected' : '') + '>' +
              E(o[1]) + '</option>').join('') + '</select>' + icon('i-fwd','s14') + '</label>'
        : '<div class="quote" style="margin-top:12px">دليل خاصّ — يُربط بمهمّة بعينها من شاشة المهمّة.</div>') +
    '</div>' +

    '<div class="card">' + head('٢ · الخطوات', AR(b.steps.length) + ' خطوة — ترتيبها هو ترتيب التنفيذ') +
      (b.steps.length ? '<div class="steps">' + b.steps.map((s, i) =>
        '<div class="step"><span class="sn">' + AR(i + 1) + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(s) + '</b></span>' +
          (i > 0 ? '<button class="xbtn" data-a="gbup" data-v="' + i + '">' +
            icon('i-back','s14') + '</button>' : '') +
          '<button class="xbtn" data-a="gbdel" data-v="' + i + '">' + icon('i-x','s14') + '</button>' +
        '</div>').join('') + '</div>'
        : '<div class="tiny faint">لا خطوة بعد.</div>') +
      '<div class="qadd">' +
        '<input class="fld" id="q-gbs" data-q="gbs" value="' + E(qOf('gbs')) + '" ' +
          'placeholder="نصّ الخطوة…">' +
        '<button class="btn l sm" style="margin-top:10px" data-a="gbadd">' +
          icon('i-plus','s14') + 'أضف خطوة</button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' + head('٣ · الوسائط', 'فيديو قصير أو PDF أو صور — ما يُغني عن الشرح') +
      ((b.media || []).length ? '<div class="plist">' + b.media.map((m, i) =>
        '<div class="prow" style="padding:10px 12px">' +
          '<span class="ico sm" style="color:var(--gold2)">' + icon(MEDIA_KIND[m.k].i,'s14') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(m.name) + '</b>' +
          '<span>' + E(MEDIA_KIND[m.k].ar) + (m.size ? ' · ' + AR(Math.round(m.size / 1024)) + ' ك.ب' : '') +
          '</span></span>' +
          '<button class="xbtn" data-a="gbmdel" data-v="' + i + '">' + icon('i-x','s14') + '</button>' +
        '</div>').join('') + '</div>'
        : '<div class="tiny faint">لا وسائط بعد.</div>') +
      '<div class="fl" style="gap:9px;margin-top:12px;flex-wrap:wrap">' +
        '<label class="fsel"><span>النوع</span>' +
          '<select data-f="gb" data-fk="mk">' + Object.keys(MEDIA_KIND).map(k =>
            '<option value="' + k + '"' + ((fOf('gb','mk') || 'video') === k ? ' selected' : '') +
            '>' + E(MEDIA_KIND[k].ar) + '</option>').join('') + '</select>' +
          icon('i-fwd','s14') + '</label>' +
        filePick('guide') +
        '<button class="btn l sm" data-a="gbmadd">' + icon('i-plus','s14') + 'أضف الوسيط</button>' +
      '</div>' +
    '</div>' +

    '<div class="fl" style="gap:10px">' +
      '<button class="btn p" style="flex:1" data-a="gbsave">' + icon('i-checkc','s16') +
        (b.editing ? 'حفظ التعديل' : 'حفظ الدليل') + '</button>' +
      '<button class="btn l" data-a="gbsavepub">' + icon('i-send','s16') + 'حفظ ونشر</button>' +
    '</div>'
  };
  renderDrawer();
}

/* ---------- معاينة الدليل كما يراه المحسن ---------- */
function guideView(id) {
  const g = V.guides.find(x => x.id === id) || S.guides.find(x => x.id === id);
  if (!g) return;
  const sc = G_SCOPE[g.scope] || G_SCOPE.free, st = G_ST[g.status];
  const t = g.taskId ? taskById(g.taskId) : null;
  S.drawer = { title:g.title, sub:sc.ar + ' · ' + (t ? t.title : gTargetAr(g.scope, g.target)),
    icon:sc.i, body:
    '<div class="fl" style="gap:9px;flex-wrap:wrap">' + pill(st.ar, st.c) +
      pill('النسخة ' + AR(g.ver), 'grey') +
      pill(AR((g.steps || []).length) + ' خطوة', 'gold') + '</div>' +

    ((g.media || []).length ? '<div class="card">' + head('الوسائط', 'كما تُفتح في التطبيق') +
      '<div class="plist">' + g.media.map(m =>
        '<div class="prow" style="padding:11px 13px">' +
          '<span class="ico" style="color:var(--gold2)">' + icon(MEDIA_KIND[m.k].i,'s16') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(m.name) + '</b>' +
          '<span>' + E(MEDIA_KIND[m.k].ar) + '</span></span>' +
          pill('يُفتح في التطبيق', 'blue') + '</div>').join('') + '</div></div>' : '') +

    '<div class="card gold">' + head('الخطوات', 'كما يقرؤها المحسن') +
      '<div class="fprev">' + (g.steps || []).map((s, i) =>
        '<div class="fq"><b>' + AR(i + 1) + ' · ' + E(s) + '</b></div>').join('') +
      '</div></div>'
  };
  renderDrawer();
}
