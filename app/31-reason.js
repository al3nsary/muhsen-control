/* ============================================================
   السبب الإجباري — لا يُنقل أحدٌ بلا سببٍ مكتوب

   القاعدة: كل فعلٍ يُحرّك إنسانًا — سحبًا من مهمّة، أو إدخالًا من
   الاحتياط — يُسأل عن سببه قبل أن يقع، ويُحفَظ السبب في ثلاثة
   أماكن: سجلّ المهمّة، وسجلّ النظام، وملفّ الشخص.

   وليس هذا تشديدًا إداريًّا: حين يُسأل الكنترول بعد شهرٍ «لماذا سُحب
   فلان من مهمّة عرفة؟» فالجواب مكتوبٌ لا مُتذكَّر.
   ============================================================ */

/* أسبابٌ جاهزة لكل فعل — تُنقر، أو يُكتب غيرها */
const WHY_PRESETS = {
  pullTask: ['تعارض في الوقت مع مهمّة أخرى', 'حالة صحّية طارئة', 'طلب الليدر',
             'إعادة توزيع التخصّصات', 'تكرار عدم الإنجاز', 'بطلب المحسن نفسه',
             'خارج شِفت المهمّة'],
  addRes:   ['نقص في عدد المحسنين', 'غياب محسنٍ مسكَّن', 'تخصّص ناقص في الفريق',
             'زيادة في حجم الفوج', 'طلب دعمٍ من الليدر', 'اكسترا كوتا أُضيفت'],
  swapRes:  ['بديلٌ عن غائب', 'أقرب تخصّصًا للمطلوب', 'أخفّ حِملًا',
             'بطلب المشرف', 'قرار الكنترول']
};

/* درج السبب: يعمل لأي فعلٍ — يحمل ما يُنفَّذ بعد الحفظ */
function askWhy(o) {
  /* o = { kind, title, sub, note, act, id, v, warn } */
  /* إعادة الرسم تمرّ من هنا أيضًا — فلا يُمحى ما اختير إلّا عند فتحٍ جديد */
  const fresh = !S.why || S.why.act !== o.act || S.why.id !== o.id;
  S.why = { kind:o.kind, act:o.act, id:o.id, v:o.v || '' };
  if (fresh) { S.q.whyTxt = ''; S.q.whyPick = ''; }
  const list = WHY_PRESETS[o.kind] || [];
  S.drawer = { title:o.title, sub:o.sub || 'السبب يُحفظ في السجلّ ولا يُمحى',
    icon:'i-edit', wide:false, body:

    '<div class="note a">' + icon('i-warn','s16') +
      '<span>' + (o.note || 'لا يقع هذا الفعل بلا سببٍ مكتوب. ' +
      'فالسجلّ هو ما يُحتكم إليه بعد شهر.') + '</span></div>' +

    (o.warn ? '<div class="note r">' + icon('i-warn','s16') +
      '<span>' + o.warn + '</span></div>' : '') +

    '<div class="card">' +
      head('السبب', 'انقر سببًا جاهزًا أو اكتب غيره', '', 'i-edit') +
      (list.length ? '<div class="chipwrap">' + list.map(r =>
        '<button class="chipbtn' + (S.q.whyPick === r ? ' on' : '') + '" ' +
        'data-a="whypick" data-v="' + E(r) + '">' + E(r) + '</button>').join('') + '</div>' : '') +
      '<label class="fl2">أو اكتب سببًا</label>' +
      '<textarea class="fld" id="q-whyTxt" data-q="whyTxt" rows="3" ' +
        'placeholder="اكتب السبب بوضوح — يقرؤه من يراجع بعدك."></textarea>' +
    '</div>' +

    '<div class="grid g2" style="gap:8px">' +
      '<button class="btn p" data-a="whygo">' + icon('i-check','s16') + 'تنفيذ</button>' +
      '<button class="btn l" data-a="whycancel">إلغاء</button></div>' };
  renderDrawer();
}
const whyText = () => (qOf('whyTxt') || S.q.whyPick || '').trim();

/* يُكتب السبب في ملفّ الشخص أيضًا — فالملفّ يجمع ما تفرّق */
function whyOnUser(uid_, text, kind) {
  const u = userById(uid_); if (!u) return;
  u.moves = u.moves || [];
  u.moves.unshift({ at: now(), by: actorLabel(), kind: kind || 'move', text });
  if (u.moves.length > 60) u.moves.pop();
}
