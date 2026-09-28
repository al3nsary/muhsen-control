/* ============================================================
   ربطُ الكتالوج بالبلاغات — الجدول يحكم، لا يُزيّن

   كانت المراحل ٦ (التصنيف) و٧ (الخطورة) و٨ (قاعدة المعالجة) تُختار
   بيد الكنترول من قوائم عامّة، فبلاغان متطابقان يُصنَّفان مختلفَين
   حسب من استلمهما. فصارت تُملأ من **حالة الجدول**.

   ومهلتان لا واحدة: مهلةُ الاستجابة الميدانيّة (دقائق) يقع التصعيدُ
   عند تجاوزها، ومهلةُ الإغلاق (ساعات بحسب الخطورة) تُقاس على الحالة
   كاملةً. والأولى قد تمرّ وتبقى الثانية — فالحافلةُ يُستجاب لها في
   عشر دقائق ولا تُغلق حالتُها حتى تصل.
   ============================================================ */

/* تصنيفُ الحوادث القديم يقابل القطاع في الجدول */
const INC_TO_SEC = {
  trans: 'نقل', house: 'إسكان', food: 'إعاشة',
  med: 'صحة ومساندة', sec: 'إسكان', crowd: 'نقل'
};
/* الفنادقُ في مكة أو المدينة، والمشاعرُ مشاعر */
const HOTEL_TO_LOC = h => /المدينة/.test(String(h || '')) ? 'المدينة المنورة' : 'مكة المكرمة';

/* ---------- الوسم: كلّ بلاغٍ يُنسب إلى حالته ---------- */
function escTagSignals(st) {
  const pool = st.escal || ESCAL;
  (st.signals || []).forEach((s, i) => {
    if (s.escId && pool.some(e => e.id === s.escId)) { escSync(s, pool); return; }
    const sec = INC_TO_SEC[s.cat] || 'نقل';
    const loc = s.cat === 'crowd' ? 'المشاعر' : HOTEL_TO_LOC(s.hotel);
    let c = pool.filter(e => e.sec === sec && e.loc === loc);
    if (!c.length) c = pool.filter(e => e.sec === sec);
    if (!c.length) c = pool;
    const e = c[i % c.length];
    if (!e) return;
    s.escId = e.id;
    escSync(s, pool);
    /* ما تجاوز مهلته ولم يُغلق: صُعِّد فعلًا */
    if (s.due && s.state !== 'closed' && now() > s.due + 10 * MIN && i % 3 === 0) {
      s.escalated = true; s.escAt = s.due + 5 * MIN;
      (s.trail = s.trail || []).unshift({ at:s.escAt, by:'النظام',
        text:'انقضت مهلة المعالجة (' + slaAr(e.sla) + ') فصُعِّد إلى ' +
          (e.escTo || 'الكنترول') });
    }
  });
}
/* تُنسخ حقولُ الحالة على البلاغ — فتُقرأ بلا بحثٍ في كلّ رسم */
function escSync(s, pool) {
  const e = (pool || escAll()).find(x => x.id === s.escId);
  if (!e) return;
  s.escLoc = e.loc; s.escSec = e.sec; s.escName = e.name;
  s.risk = e.risk; s.sla = e.sla; s.escTo = e.escTo;
  s.due = e.sla == null ? null : s.at + e.sla * MIN;
  s.closeDue = s.at + closeSla(e.risk) * MIN;
}

/* ---------- حساباتُ المهلتين ---------- */
const sigEsc   = s => s && s.escId ? escOf(s.escId) : null;
const sigLate  = s => !!(s && s.due && s.state !== 'closed' && now() > s.due);
const sigOverC = s => !!(s && s.closeDue && s.state !== 'closed' && now() > s.closeDue);
const sigLeft  = s => (!s || !s.due) ? null : Math.round((s.due - now()) / MIN);
const sigLeftC = s => (!s || !s.closeDue) ? null : Math.round((s.closeDue - now()) / MIN);
const sigOverdue = () => (V.signals || []).filter(sigLate)
  .sort((a, b) => (ESC_RISK[a.risk] || ESC_RISK.mid).o - (ESC_RISK[b.risk] || ESC_RISK.mid).o ||
    a.due - b.due);
/* «توشك» نسبةٌ من مهلتها هي: ما بقي منها الخُمس. فربعُ ساعةٍ على مهلةِ
   ساعةٍ ليس كربعِ ساعةٍ على مهلةِ عشرين دقيقة. */
const sigSoon = () => (V.signals || []).filter(s => {
  if (!s.due || s.state === 'closed' || sigLate(s)) return false;
  const left = sigLeft(s), sla = Math.max(1, s.sla || 10);
  return left <= Math.max(2, Math.round(sla * 0.2));
}).sort((a, b) => a.due - b.due);
/* ما تجاوز مهلةَ الإغلاق — وهي الأخطر: الحالةُ مفتوحةٌ أكثر ممّا يُحتمل */
const sigStale = () => (V.signals || []).filter(sigOverC)
  .sort((a, b) => a.closeDue - b.closeDue);

const lateAr = s => {
  const m = sigLeft(s);
  if (m == null) return 'بلا مهلة';
  return m < 0 ? 'تجاوزت بـ' + slaAr(-m) : 'بقي ' + slaAr(m);
};
const closeAr = s => {
  const m = sigLeftC(s);
  if (m == null) return '—';
  return m < 0 ? 'تجاوزت الإغلاق بـ' + slaAr(-m) : 'للإغلاق ' + slaAr(m);
};

/* ---------- لوحةُ المهل ---------- */
function escBoardCard() {
  const late = sigOverdue(), soon = sigSoon(), stale = sigStale();
  if (!late.length && !soon.length && !stale.length) return '';
  const row = (s, kind) => {
    const e = sigEsc(s) || {};
    const r = ESC_RISK[s.risk] || ESC_RISK.mid;
    return '<div class="prow" style="--tsc:' + r.c + '" data-a="sigopen" data-id="' + s.id + '">' +
      '<span class="krail"></span>' +
      '<span class="nm" style="flex:1;min-width:170px"><b>' + E(s.title) + '</b>' +
      '<span>' + LTR(s.no) + ' · ' + E(s.escLoc || '') +
      (s.escSec ? ' · ' + E(s.escSec) : '') + '</span></span>' +
      pill(r.ar, r.p) +
      '<span class="slaclk' + (kind === 'soon' ? '' : ' late') + '">' +
        icon(kind === 'soon' ? 'i-clock' : 'i-warn', 's13') +
        E(kind === 'stale' ? closeAr(s) : lateAr(s)) + '</span>' +
      (e.escTo ? pill('→ ' + e.escTo, kind === 'soon' ? 'gold' : 'no') : '') +
      (s.escalated ? pill('صُعِّد', 'no') : '') +
      '<span class="end">' + icon('i-fwd','s16') + '</span></div>';
  };
  const blk = (ttl, arr, kind, n) => arr.length
    ? '<div class="tiny faint" style="margin:13px 0 7px">' + ttl + '</div>' +
      '<div class="plist">' + arr.slice(0, n).map(s => row(s, kind)).join('') + '</div>' : '';
  return '<div class="card' + (late.length || stale.length ? ' red' : ' gold') + '">' +
    head('مهلُ المعالجة والإغلاق',
      'مهلةُ الاستجابة تُصعِّد، ومهلةُ الإغلاق تقيس بقاءَ الحالة مفتوحة',
      (late.length ? pill(AR(late.length) + ' تجاوزت الاستجابة', 'no') : '') +
      (stale.length ? pill(AR(stale.length) + ' تجاوزت الإغلاق', 'no') : '') +
      (soon.length ? pill(AR(soon.length) + ' توشك', 'wait') : ''), 'i-clock') +
    blk('تجاوزت مهلة الاستجابة', late, 'late', 5) +
    blk('تجاوزت مهلة الإغلاق — مفتوحةٌ أكثر ممّا يُحتمل', stale, 'stale', 4) +
    blk('توشك أن تتجاوز', soon, 'soon', 3) +
  '</div>';
}

/* ---------- بطاقةُ الحالة داخل درج البلاغ ---------- */
function escCardFor(s) {
  const e = sigEsc(s);
  if (!e) return '<div class="note a">' + icon('i-warn','s16') +
    '<span>لم تُنسَب لهذا البلاغ حالةٌ من الكتالوج — فخطورتُه ومهلتُه اجتهادٌ لا قاعدة.' +
    '<br><button class="chipbtn" style="margin-top:8px" data-a="escpick" data-id="' + s.id +
    '">اختر حالته</button></span></div>';
  const r = ESC_RISK[e.risk] || ESC_RISK.mid;
  const late = sigLate(s), stale = sigOverC(s);
  return '<div class="card' + (late || stale ? ' red' : '') + '" style="--kc:' + r.c + '">' +
    head('حالةُ الجدول', e.loc + ' · ' + e.sec,
      '<span class="fl" style="gap:6px">' + pill(r.ar, r.p) +
      '<button class="chipbtn" data-a="escopen" data-id="' + e.id + '">الحالة</button>' +
      '<button class="chipbtn" data-a="escpick" data-id="' + s.id + '">تغيير</button></span>',
      'i-shield') +
    '<div class="quote">' + E(e.name) + '</div>' +
    '<div class="grid g2" style="gap:11px;margin-top:12px">' +
      kv2('المسؤول', E(e.owner || '—')) +
      kv2('مهلة المعالجة', slaAr(e.sla)) +
      kv2('حالة الاستجابة', '<span class="' + (late ? 'bad' : '') + '">' + E(lateAr(s)) + '</span>') +
      kv2('حالة الإغلاق', '<span class="' + (stale ? 'bad' : '') + '">' + E(closeAr(s)) + '</span>') +
    '</div>' +
    '<div class="tiny faint" style="margin:13px 0 5px">قاعدة المعالجة — تُقرأ كما هي</div>' +
    '<div class="quote">' + E(e.rule || '—') + '</div>' +
    (e.docs ? '<div class="tiny faint" style="margin:12px 0 5px">الوثائق المطلوبة</div>' +
      '<div class="quote">' + E(e.docs) + '</div>' : '') +
    (e.escIf ? '<div class="tiny faint" style="margin:12px 0 5px">شرط التصعيد</div>' +
      '<div class="quote">' + E(e.escIf) + '</div>' : '') +
    (e.closeIf ? '<div class="tiny faint" style="margin:12px 0 5px">شرط الإغلاق ومن يتحقّق</div>' +
      '<div class="quote">' + E(e.closeIf) + '</div>' : '') +
    (s.escalated ? '<div class="note r" style="margin-top:12px">' + icon('i-send','s16') +
      '<span>صُعِّد ' + ago(s.escAt || s.due) + ' إلى <b>' + E(e.escTo || 'الكنترول') +
      '</b> — لانقضاء مهلته.</span></div>'
      : late ? '<button class="btn p sm" style="width:100%;margin-top:12px" data-a="escgo" ' +
        'data-id="' + s.id + '">' + icon('i-send','s14') +
        'تصعيدٌ الآن إلى ' + E(e.escTo || 'الكنترول') + '</button>' : '') +
  '</div>';
}

/* ---------- اختيار الحالة: موقعٌ ← قطاعٌ ← حالة ---------- */
function escPick(sigId) {
  const s = (S.signals || []).find(x => x.id === sigId); if (!s) return;
  const loc = S.q.ep_loc || s.escLoc || escLocs()[0];
  const secs = escSecs(loc);
  const sec = S.q.ep_sec || (secs.indexOf(s.escSec) >= 0 ? s.escSec : secs[0]);
  const list = escFor(loc, sec);

  S.drawer = { title:'حالةُ «' + s.title + '»', sub:s.no + ' · ' + s.kt,
    icon:'i-shield', wide:!!S.dwide, body:

    '<div class="note b">' + icon('i-info','s16') +
      '<span>اخترِ الحالةَ من الجدول، فتُشتقّ منها الخطورةُ والمسؤولُ والمهلتان ' +
      'وجهةُ التصعيد — بدل أن تُختار بالهوى. والموقعُ يغيّرها.</span></div>' +

    '<div class="card">' + head('الموقع', '', '', 'i-pin') +
      '<div class="chipwrap">' + escLocs().map(c =>
        '<button class="chipbtn' + (c === loc ? ' on' : '') + '" data-a="eploc" ' +
        'data-id="' + s.id + '" data-v="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>' +
      '<div class="tiny faint" style="margin:13px 0 7px">القطاع</div>' +
      '<div class="chipwrap">' + secs.map(x =>
        '<button class="chipbtn' + (x === sec ? ' on' : '') + '" data-a="epsec" ' +
        'data-id="' + s.id + '" data-v="' + E(x) + '">' + E(x) + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' +
      head('الحالة', AR(list.length) + ' حالةً تحت هذا القطاع', '', 'i-shield') +
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
        : empty('لا حالة لهذا القطاع', 'اخترْ قطاعًا آخر', 'i-shield')) +
    '</div>' };
  renderDrawer();
}

function escApply(s, e) {
  if (!s || !e) return;
  const was = s.escId ? (escOf(s.escId) || {}).name : null;
  s.escId = e.id;
  escSync(s);
  (s.trail = s.trail || []).unshift({ at:now(), by:actorLabel(),
    text:(was ? 'بُدِّلت الحالة من «' + was + '» إلى ' : 'نُسبت الحالة ') +
      '«' + e.name + '» — ' + e.loc + ' · ' + e.sec + '، الخطورة ' +
      ESC_RISK[e.risk].ar + '، والمهلة ' + slaAr(e.sla) });
}

/* ============================================================
   توزيعُ الأزمنة — لوحةٌ كلُّها حمراء لا تُفيد

   كان البذرُ يضع البلاغات قبل ساعاتٍ ومهلُها دقائق، فكلُّ بلاغٍ
   متجاوزٌ، ولوحةُ المهل تصير جدارًا أحمرَ لا يُميَّز فيه العاجلُ من
   المتأخّر. والغرفةُ الحقيقيّة ليست كذلك: أكثرُها في مهلته، وقليلٌ
   تجاوز، وأقلُّ منه بقي مفتوحًا أكثر ممّا يُحتمل.

   فيُعاد وضعُ زمن كلّ بلاغٍ **نسبةً إلى مهلته هو** لا إلى الساعة.
   ============================================================ */
function escSpread(st) {
  const open = (st.signals || []).filter(s => s.state !== 'closed' && s.sla != null);
  open.forEach((s, i) => {
    const sla = Math.max(1, s.sla || 10);
    const close = closeSla(s.risk);
    const b = i % 10;
    let age;
    if (b <= 4)      age = Math.round(sla * (0.15 + b * 0.16));   /* خمسةٌ في مهلتها */
    else if (b <= 6) age = Math.round(sla * 0.92);                /* اثنان يوشكان */
    else if (b <= 8) age = Math.round(sla * (1.4 + (b - 7) * 0.8)); /* اثنان تجاوزا */
    else             age = Math.round(close * 1.25);              /* واحدٌ بقي طويلًا */
    /* الرجّةُ نسبيّةٌ لا مطلقة: خمسُ دقائقَ على مهلةِ عشرٍ ليست كخمسٍ على مهلةِ ساعة */
    age = Math.max(1, Math.round(age * (0.78 + ((i * 13) % 9) * 0.055)));
    s.at = now() - age * MIN;
    s.due = s.at + sla * MIN;
    s.closeDue = s.at + close * MIN;
    /* التصعيدُ يتبع الواقع لا العكس */
    const late = now() > s.due;
    if (!late) { s.escalated = false; s.escAt = null;
      s.trail = (s.trail || []).filter(t => !/صُعِّد/.test(t.text)); }
    else if (!s.escalated && b >= 8) {
      s.escalated = true; s.escAt = s.due + 3 * MIN;
      (s.trail = s.trail || []).unshift({ at:s.escAt, by:'النظام',
        text:'انقضت مهلة المعالجة (' + slaAr(sla) + ') فصُعِّد إلى ' +
          (s.escTo || 'الكنترول') });
    }
    (s.trail || []).forEach(t => { if (t.at > now()) t.at = s.at; });
    if (s.trail && s.trail.length) s.trail[s.trail.length - 1].at = s.at;
  });
  (st.signals || []).sort((a, b2) => b2.at - a.at);
}
