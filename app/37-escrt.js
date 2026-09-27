/* ============================================================
   ربطُ الكتالوج بدورة البلاغ — الجدول يحكم، لا يُزيّن

   كانت المراحل الثلاث — التصنيف (٦) والخطورة (٧) وقاعدة المعالجة (٨) —
   تُختار بيد الكنترول من قوائم عامّة. وهذا يجعل بلاغَين متطابقين
   يُصنَّفان مختلفَين حسب من استلمهما.

   فصارت تُملأ من **آليّة الجدول**: يُختار المستوى الثالث مرّةً، فتُشتقّ
   الخطورةُ والمسؤولُ والمهلةُ وجهةُ التصعيد وشرطُه وشرطُ الإغلاق. وللكنترول
   أن يتجاوزها — بسببٍ مكتوب، فالتجاوزُ قرارٌ لا سهو.
   ============================================================ */

/* تصنيفُ الحوادث القديم يقابل التصنيف الشامل في الجدول */
const INC_TO_ESC = {
  trans: 'النقل والحركة',
  house: 'السكن والمرافق',
  food:  'الإعاشة',
  med:   'الصحة والمساندة',
  sec:   'الأمن والسلامة',
  crowd: 'النقل والحركة'
};

/* ---------- الوسم: كل بلاغٍ يُنسب إلى آليّته ---------- */
function escTagSignals(st) {
  const pool = st.escal || ESCAL;
  (st.signals || []).forEach((s, i) => {
    const cat = INC_TO_ESC[s.cat] || 'أخرى';
    let cands = pool.filter(e => e.cat === cat);
    if (!cands.length) cands = pool.filter(e => e.cat === 'أخرى');
    if (!cands.length) cands = pool;
    const e = cands[i % cands.length];
    if (!e) return;
    s.escId  = e.id;
    s.escCat = e.cat;
    s.escSub = e.sub;
    s.risk   = e.risk;                 /* الخطورة من الجدول لا من الهوى */
    s.sla    = e.sla;
    s.escTo  = e.escTo;
    s.due    = e.sla == null ? null : s.at + e.sla * MIN;
    /* ما تجاوز مهلته ولم يُغلق: صُعِّد فعلًا */
    if (s.due && s.state !== 'closed' && now() > s.due + 10 * MIN && i % 3 === 0) {
      s.escalated = true;
      s.escAt = s.due + 5 * MIN;
      (s.trail = s.trail || []).unshift({ at:s.escAt, by:'النظام',
        text:'انقضت مهلة المعالجة (' + slaAr(e.sla) + ') فصُعِّد إلى ' + (e.escTo || 'الكنترول') });
    }
  });
}

/* ---------- حساباتُ المهلة ---------- */
const sigEsc  = s => s && s.escId ? escOf(s.escId) : null;
const sigLate = s => !!(s && s.due && s.state !== 'closed' && now() > s.due);
const sigLeft = s => (!s || !s.due) ? null : Math.round((s.due - now()) / MIN);
/* ما تجاوز مهلته، الأحدّ خطورةً أوّلًا */
const sigOverdue = () => (V.signals || []).filter(sigLate)
  .sort((a, b) => (ESC_RISK[a.risk] || ESC_RISK.mid).o - (ESC_RISK[b.risk] || ESC_RISK.mid).o ||
    a.due - b.due);
/* ما بقي على انقضاء مهلته أقلُّ من ربع ساعة */
const sigSoon = () => (V.signals || []).filter(s =>
  s.due && s.state !== 'closed' && !sigLate(s) && sigLeft(s) <= 15)
  .sort((a, b) => a.due - b.due);

const lateAr = s => {
  const m = sigLeft(s);
  if (m == null) return 'بلا مهلة';
  return m < 0 ? 'تجاوزت بـ' + slaAr(-m) : 'بقي ' + slaAr(m);
};

/* ---------- لوحةُ المهل: تُدرَج في شاشة البلاغات ---------- */
function escBoardCard() {
  const late = sigOverdue(), soon = sigSoon();
  if (!late.length && !soon.length) return '';
  const row = (s, kind) => {
    const e = sigEsc(s) || {};
    const r = ESC_RISK[s.risk] || ESC_RISK.mid;
    return '<div class="prow" style="--tsc:' + r.c + '" data-a="sigopen" data-id="' + s.id + '">' +
      '<span class="krail"></span>' +
      '<span class="nm" style="flex:1;min-width:170px"><b>' + E(s.title) + '</b>' +
      '<span>' + LTR(s.no) + ' · ' + E(s.escCat || '') +
      (s.escSub ? ' ← ' + E(s.escSub) : '') + '</span></span>' +
      pill(r.ar, r.p) +
      '<span class="slaclk' + (kind === 'late' ? ' late' : '') + '">' +
        icon(kind === 'late' ? 'i-warn' : 'i-clock', 's13') + E(lateAr(s)) + '</span>' +
      (e.escTo ? pill('→ ' + e.escTo, kind === 'late' ? 'no' : 'gold') : '') +
      (s.escalated ? pill('صُعِّد', 'no') : '') +
      '<span class="end">' + icon('i-fwd','s16') + '</span></div>';
  };
  return '<div class="card' + (late.length ? ' red' : ' gold') + '">' +
    head('مهلُ المعالجة', 'المهلةُ من الجدول، والتصعيدُ يقع عند انقضائها',
      (late.length ? pill(AR(late.length) + ' تجاوزت', 'no') : '') +
      (soon.length ? pill(AR(soon.length) + ' توشك', 'wait') : ''), 'i-clock') +
    (late.length ? '<div class="tiny faint" style="margin:4px 0 7px">تجاوزت مهلتها</div>' +
      '<div class="plist">' + late.slice(0, 6).map(s => row(s, 'late')).join('') + '</div>' : '') +
    (soon.length ? '<div class="tiny faint" style="margin:13px 0 7px">توشك أن تتجاوز</div>' +
      '<div class="plist">' + soon.slice(0, 4).map(s => row(s, 'soon')).join('') + '</div>' : '') +
  '</div>';
}

/* ---------- بطاقةُ الآليّة داخل درج البلاغ ---------- */
function escCardFor(s) {
  const e = sigEsc(s);
  if (!e) return '<div class="note a">' + icon('i-warn','s16') +
    '<span>لم تُنسَب لهذا البلاغ آليّةٌ من الكتالوج — فخطورتُه ومهلتُه اجتهادٌ لا قاعدة.' +
    '<br><button class="chipbtn" style="margin-top:8px" data-a="escpick" data-id="' + s.id +
    '">اختر آليّته</button></span></div>';
  const r = ESC_RISK[e.risk] || ESC_RISK.mid;
  const late = sigLate(s);
  return '<div class="card' + (late ? ' red' : '') + '" style="--kc:' + r.c + '">' +
    head('آليّة التصعيد', e.cat + ' ← ' + e.sub,
      '<span class="fl" style="gap:6px">' + pill(r.ar, r.p) +
      '<button class="chipbtn" data-a="escopen" data-id="' + e.id + '">الآليّة</button>' +
      '<button class="chipbtn" data-a="escpick" data-id="' + s.id + '">تغيير</button></span>',
      'i-shield') +
    '<div class="quote">' + E(e.name) + '</div>' +
    '<div class="grid g2" style="gap:11px;margin-top:12px">' +
      kv2('المسؤول', E(e.owner || '—')) +
      kv2('مهلة المعالجة', slaAr(e.sla)) +
      kv2('حالة المهلة', '<span class="' + (late ? 'bad' : '') + '">' + E(lateAr(s)) + '</span>') +
      kv2('جهة التصعيد', E(e.escTo || '—')) +
    '</div>' +
    '<div class="tiny faint" style="margin:13px 0 5px">قاعدة المعالجة — المرحلة الثامنة</div>' +
    '<div class="quote">' + E(e.rule || '—') + '</div>' +
    (e.escIf ? '<div class="tiny faint" style="margin:12px 0 5px">شرط التصعيد</div>' +
      '<div class="quote">' + E(e.escIf) + '</div>' : '') +
    (e.closeIf ? '<div class="tiny faint" style="margin:12px 0 5px">شرط الإغلاق ومن يتحقّق منه</div>' +
      '<div class="quote">' + E(e.closeIf) + '</div>' : '') +
    (s.escalated ? '<div class="note r" style="margin-top:12px">' + icon('i-send','s16') +
      '<span>صُعِّد هذا البلاغ ' + ago(s.escAt || s.due) + ' إلى <b>' +
      E(e.escTo || 'الكنترول') + '</b> — لانقضاء مهلته.</span></div>'
      : late ? '<button class="btn p sm" style="width:100%;margin-top:12px" data-a="escgo" ' +
        'data-id="' + s.id + '">' + icon('i-send','s14') +
        'تصعيدٌ الآن إلى ' + E(e.escTo || 'الكنترول') + '</button>' : '') +
  '</div>';
}

/* ---------- اختيار الآليّة لبلاغٍ بعينه ---------- */
function escPick(sigId) {
  const s = (S.signals || []).find(x => x.id === sigId); if (!s) return;
  const cat = S.q.ep_cat || s.escCat || INC_TO_ESC[s.cat] || escCats()[0];
  const subs = escSubs(cat);
  const sub = S.q.ep_sub || (subs.indexOf(s.escSub) >= 0 ? s.escSub : subs[0]);
  const list = escFor(cat, sub);

  S.drawer = { title:'آليّةُ «' + s.title + '»', sub:s.no + ' · ' + s.kt,
    icon:'i-shield', wide:!!S.dwide, body:

    '<div class="note b">' + icon('i-info','s16') +
      '<span>اختر الحالةَ من الجدول، فتُشتقّ منها الخطورةُ والمسؤولُ والمهلةُ ' +
      'وجهةُ التصعيد — بدل أن تُختار بالهوى.</span></div>' +

    '<div class="card">' + head('التصنيف الشامل', '', '', 'i-list') +
      '<div class="chipwrap">' + escCats().map(c =>
        '<button class="chipbtn' + (c === cat ? ' on' : '') + '" data-a="epcat" ' +
        'data-id="' + s.id + '" data-v="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>' +
      '<div class="tiny faint" style="margin:13px 0 7px">التصنيف التفصيلي</div>' +
      '<div class="chipwrap">' + subs.map(x =>
        '<button class="chipbtn' + (x === sub ? ' on' : '') + '" data-a="epsub" ' +
        'data-id="' + s.id + '" data-v="' + E(x) + '">' + E(x) + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' +
      head('الحالة', AR(list.length) + ' آليّةً تحت هذا الفرع', '', 'i-shield') +
      (list.length ? '<div class="plist">' + list.map(e => {
        const r = ESC_RISK[e.risk] || ESC_RISK.mid;
        return '<div class="prow' + (e.id === s.escId ? ' on' : '') + '" style="--tsc:' + r.c +
          '" data-a="epgo" data-id="' + s.id + '" data-v="' + e.id + '">' +
          '<span class="krail"></span>' +
          '<span class="nm" style="flex:1"><b>' + E(e.name) + '</b>' +
          '<span>' + E(e.owner || '') + ' · مهلة ' + slaAr(e.sla) +
          (e.escTo ? ' · يُصعَّد إلى ' + E(e.escTo) : '') + '</span></span>' +
          pill(r.ar, r.p) +
          (e.id === s.escId ? icon('i-check','s16') : icon('i-fwd','s16')) + '</div>';
      }).join('') + '</div>'
        : empty('لا آليّة لهذا الفرع', 'اختر فرعًا آخر', 'i-shield')) +
    '</div>' };
  renderDrawer();
}

/* تطبيقُ الآليّة على البلاغ */
function escApply(s, e) {
  if (!s || !e) return;
  const was = s.escId ? (escOf(s.escId) || {}).name : null;
  s.escId = e.id; s.escCat = e.cat; s.escSub = e.sub;
  s.risk = e.risk; s.sla = e.sla; s.escTo = e.escTo;
  s.due = e.sla == null ? null : s.at + e.sla * MIN;
  (s.trail = s.trail || []).unshift({ at:now(), by:actorLabel(),
    text:(was ? 'بُدِّلت الآليّة من «' + was + '» إلى ' : 'نُسبت الآليّة ') +
      '«' + e.name + '» — الخطورة ' + ESC_RISK[e.risk].ar + '، والمهلة ' + slaAr(e.sla) });
}
