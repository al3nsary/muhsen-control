/* ============================================================
   معاينة التطبيق — ومعالجة المهمّة بصفة الميدان

   طلبتَها مرّتين: أن ترى كيف تظهر المهمّة للمحسن وللّيدر في جوّاله،
   وأن تُعالجها بصفته لترى الإجراء نفسه. فهنا هاتفٌ داخل الدرج يرسم
   شاشة التطبيق بعينها من بيانات المهمّة نفسها — لا صورةً ولا محاكاة.

   وله وضعان: **معاينة** يُقرأ ولا يُلمس، و**معالجة بصفته** تعمل أزراره
   فعلًا. وكلّ فعلٍ في الوضع الثاني يُسجَّل في سجلّ المهمّة باسم من نُفِّذ
   بصفته ومعه «من الكنترول» — فلا يُنسب إلى الميدان ما لم يفعله.
   ============================================================ */

const APP_ST = {
  pending_assign: { t:'بانتظار التسكين', c:'wait' },
  assigned:       { t:'مُسكَّنة',        c:'grey' },
  running:        { t:'جارية الآن',      c:'live' },
  done:           { t:'منجزة',           c:'live' },
  cancelled:      { t:'ملغاة',           c:'no'   }
};
const appStOf = t => APP_ST[t.status] || APP_ST.assigned;

/* بصفة من نُعاين؟ الليدر يرى كلّ شيء، والمحسن يرى دوره وحده */
const avAs = t => (S.avq && S.avq[t.id]) || 'leader';
const avLive = t => !!(S.avq && S.avq[t.id + ':live']);

/* المحسن الذي نتقمّصه حين نعاين بصفة محسن */
function avMuhsen(t) {
  const pick = S.avq && S.avq[t.id + ':m'];
  const team = t.assigned.map(userById).filter(Boolean);
  return (pick && team.find(u => u.id === pick)) || team[0] || null;
}

/* ---------- شاشة التطبيق داخل هاتف ---------- */
function appScreen(t) {
  const L = userById(t.leaderId) || {};
  const asLead = avAs(t) === 'leader';
  const me = asLead ? L : avMuhsen(t);
  const live = avLive(t);
  const st = appStOf(t);
  const done = t.status === 'done', running = tState(t) === 'live';
  const doneSubs = t.subs.filter(s => s.done).length;
  const att = t.attended.length;
  const attMe = me ? t.attended.indexOf(me.id) >= 0 : false;
  const act = (a, extra) => live ? ' data-a="' + a + '" data-id="' + t.id + '"' + (extra || '') : ' disabled';

  return '<div class="phone' + (live ? ' live' : '') + '">' +
    '<div class="pbar">' + icon('i-back','s16') +
      '<b>تفاصيل المهمة</b>' +
      (me ? avatar(me, 'sm') : '<span></span>') + '</div>' +
    '<div class="pbody">' +

      /* بطاقة الخدمة — كما في التطبيق: عنوان ووصف ومكان ومصغّرة */
      '<div class="pc gold"><div class="prow2">' +
        '<span class="sp"><b>' + E(t.title) + '</b>' +
          '<span class="ps">' + E(t.desc || '') + '</span>' +
          '<span class="ps dim">' + E(t.place) + '</span>' +
          '<span class="ps dim">' + E(t.city) + '</span></span>' +
        '<span class="pthumb bg-' + (CAT[t.kind] || {}).photo + '"></span>' +
      '</div>' +
      '<div class="prow3">' + pill(st.t, st.c) +
        '<span class="ps dim">' + E((orgById(t.orgId) || {}).ar || '') + ' · ' + E(t.kt) + '</span>' +
      '</div></div>' +

      /* البيانات الأربع */
      '<div class="pmeta">' +
        '<div><span>رقم المهمة</span><b>' + AR(t.code) + '</b></div>' +
        '<div><span>التاريخ</span><b>' + hijri(t.start) + '</b></div>' +
        '<div><span>الوقت</span><b class="num">' + t12(t.start) + '</b></div>' +
        '<div><span>المدة</span><b class="num">' + AR(t.durH) + ' ساعات</b></div>' +
      '</div>' +

      /* الحضور: ما يراه صاحب الصفة عن نفسه */
      (me && !done ? (attMe
        ? '<div class="pn ok">' + icon('i-checkc','s14') + '<span>حضورك مُثبَت</span></div>'
        : '<button class="pcta sm"' + act('avattend', ' data-s="' + me.id + '"') + '>' +
          icon('i-target','s16') + '<span><b>إثبات الحضور</b><i>' +
          (running ? 'المهمة بدأت — أثبت حضورك الآن' : 'يُفتح التحضير قبل المهمة بساعتين') +
          '</i></span></button>') : '') +

      /* البدء والإنهاء — للّيدر وحده، كما في التطبيق */
      (asLead && !done && !running
        ? '<button class="pcta"' + act('avstart') + '>' + icon('i-play','s20') +
          '<span><b>بدء المهمة</b><i>وتبدأ تلقائيًّا ' + t12(t.start) + ' على كل حال</i></span></button>' : '') +
      (!asLead && !done
        ? '<div class="pn">' + icon('i-info','s14') +
          '<span>الليدر هو من يبدأ المهمة ويؤشّر على الإنجاز.</span></div>' : '') +
      (t.autoStarted ? '<div class="pn bad">' + icon('i-warn','s14') +
        '<span>بدأها النظام تلقائيًّا — حان وقتها ولم يبدأها ليدرها.</span></div>' : '') +

      /* المهام الفرعية — يؤشّر عليها الليدر، ويراها المحسن */
      '<div class="plbl">المهام الفرعية<small>' + AR(doneSubs) + ' من ' + AR(t.subs.length) + '</small></div>' +
      '<div class="psubs">' + t.subs.map((s, i) => {
        const next = i === t.subs.findIndex(x => !x.done) && running;
        return '<div class="psub' + (s.done ? ' on' : '') + (next ? ' next' : '') + '">' +
          '<button class="pt"' + (asLead ? act('avsub', ' data-s="' + s.id + '"') : ' disabled') + '>' +
            '<span class="ptick">' + (s.done ? icon('i-check','s12') : '') + '</span>' +
            '<span class="sp">' + E(s.name) + '</span>' +
            (s.done ? '<span class="ps dim num">' + t12(s.at) + '</span>'
                    : next ? '<span class="ps gold">التالية</span>' : '') +
          '</button>' +
          (s.shot ? '<span class="pshot bg-' + s.shot.img + '"></span>' : '') +
        '</div>';
      }).join('') + '</div>' +

      /* الفريق */
      (asLead
        ? '<div class="plbl">المحسنون على المهمة<small>' + AR(att) + ' أثبتوا حضورهم</small></div>' +
          '<div class="pteam">' + t.assigned.map(userById).filter(Boolean).slice(0, 6).map(m =>
            '<div class="pmate">' + avatar(m, 'sm') +
            '<span class="sp"><b>' + E(m.name) + '</b><span class="ps dim">' + E(m.specialty || '') + '</span></span>' +
            (t.attended.indexOf(m.id) >= 0 ? pill('حاضر','live') : pill('لم يحضر','grey')) + '</div>').join('') +
          '</div>' : '') +

      /* الملاحظات كما تصل المحسن */
      (t.notes.length ? '<div class="plbl">ملاحظات المهمة</div>' +
        t.notes.slice(0, 3).map(n => '<div class="pn">' + icon('i-edit','s14') +
          '<span>' + E(n.text) + '</span></div>').join('') : '') +

      /* الإنهاء */
      (asLead && running
        ? '<button class="pcta stop"' + act('avend') + '>' + icon('i-stop','s20') +
          '<span><b>إنهاء المهمة</b><i>' + AR(doneSubs) + ' من ' + AR(t.subs.length) +
          ' مهمة فرعية منجزة</i></span></button>' : '') +
      (done ? '<div class="pn ok">' + icon('i-checkc','s14') +
        '<span>أُنجزت المهمة' + (t.closedBy === 'system' ? ' — أُغلقت من قبل النظام' : '') + '</span></div>' : '') +
    '</div>' +
    '<div class="ptabs"><span class="on">المهام</span><span>الفريق</span><span>الصور</span><span>حسابي</span></div>' +
  '</div>';
}

/* ---------- درج المعاينة ---------- */
function appPreview(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const L = userById(t.leaderId) || {};
  const as = avAs(t), live = avLive(t);
  const team = t.assigned.map(userById).filter(Boolean);
  const who = as === 'leader' ? L : avMuhsen(t);

  S.drawer = { title:'كما تظهر في التطبيق', sub:t.title + ' · ' + t.kt,
    icon:'i-phone', wide:!!S.dwide, expand:t.id, body:

    '<div class="card gold">' +
      head('بصفة من تنظر؟', 'الشاشة نفسها تختلف باختلاف الدور', '', 'i-users') +
      '<div class="grid g2" style="gap:8px">' +
        '<button class="chipbtn' + (as === 'leader' ? ' on' : '') + '" data-a="avas" data-id="' + t.id +
          '" data-v="leader">' + icon('i-star','s13') + 'ليدر — ' + E(L.name || '') + '</button>' +
        '<button class="chipbtn' + (as === 'muhsen' ? ' on' : '') + '" data-a="avas" data-id="' + t.id +
          '" data-v="muhsen">' + icon('i-user','s13') + 'محسن' +
          (who && as === 'muhsen' ? ' — ' + E(who.name) : '') + '</button>' +
      '</div>' +
      (as === 'muhsen' && team.length > 1
        ? '<div class="tiny faint" style="margin:11px 0 7px">أيّ محسن؟</div>' +
          '<div class="fbar" style="margin:0">' + team.slice(0, 8).map(m =>
            '<button class="chipbtn' + (who && m.id === who.id ? ' on' : '') + '" data-a="avm" data-id="' +
            t.id + '" data-v="' + m.id + '">' + E(m.name) + '</button>').join('') + '</div>'
        : '') +
    '</div>' +

    '<div class="card">' +
      head('وضع المعاينة', live ? 'الأزرار تعمل — والأثر حقيقيّ ويُسجَّل' : 'للقراءة فقط — لا يتغيّر شيء',
        pill(live ? 'معالجة بصفته' : 'معاينة', live ? 'no' : 'grey'), 'i-shield') +
      '<div class="grid g2" style="gap:8px">' +
        '<button class="chipbtn' + (!live ? ' on' : '') + '" data-a="avlive" data-id="' + t.id +
          '" data-v="0">' + icon('i-eye','s13') + 'معاينة</button>' +
        '<button class="chipbtn' + (live ? ' on' : '') + '" data-a="avlive" data-id="' + t.id +
          '" data-v="1">' + icon('i-play','s13') + 'عالِجها بصفته</button>' +
      '</div>' +
      (live ? '<div class="note a" style="margin-top:11px">' + icon('i-warn','s16') +
        '<span>ما تضغطه الآن يقع فعلًا على المهمة، ويُكتب في سجلّها: ' +
        '<b>«' + E((who || {}).name || '') + ' — من الكنترول»</b>.</span></div>' : '') +
    '</div>' +

    '<div class="phonewrap">' + appScreen(t) + '</div>' +

    '<button class="btn l" data-a="tlopen" data-id="' + t.id + '">' +
      icon('i-back','s16') + 'رجوع إلى المهمة</button>' };
  renderDrawer();
}

/* الفاعل في وضع المعالجة — ومن يُنسب إليه الفعل */
function avWho(t) {
  const u = avAs(t) === 'leader' ? userById(t.leaderId) : avMuhsen(t);
  return u || { id:null, name:'الميدان' };
}
function avAct(t, text, kind) {
  const u = avWho(t);
  txLog(t, text + ' — بصفة ' + u.name + ' من الكنترول', kind || 'info');
  logIt('الكنترول عالج مهمة ' + t.title + ' بصفة ' + u.name + ': ' + text, 'task');
}

/* ============================================================
   تفويض القيادة — كما في التطبيق: للشركات دون البعثات
   ============================================================ */
function delegDrawer(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const org = orgById(t.orgId) || {}, isCo = org.type === 'شركة';
  const d = t.delegate, u = d ? userById(d.muhsenId) : null;
  const team = t.assigned.map(userById).filter(Boolean);

  S.drawer = { title:'تفويض قيادة المهمة', sub:t.title + ' · ' + t.kt, icon:'i-shield',
    wide:false, expand:t.id, body:
    (!isCo ? '<div class="note a">' + icon('i-shield','s16') +
      '<span>هذه المهمة تتبع <b>بعثة</b>، والتفويض للشركات وحدها — كما في التطبيق. ' +
      'وللكنترول أن يفوّض على كلّ حال، ويُسجَّل استثناءً.</span></div>' : '') +

    (d ? '<div class="card gold">' +
        head('المفوَّض حاليًّا', d.state === 'accepted' ? 'يملك البدء والإغلاق لهذه المهمة'
          : d.state === 'pending' ? 'بانتظار قبوله' : 'رفض التفويض', '', 'i-star') +
        '<div class="row" style="padding:9px 4px">' + (u ? avatar(u) : '') +
        '<span class="nm" style="flex:1"><b>' + E((u || {}).name || '') + '</b>' +
        '<span>' + E((u || {}).specialty || '') + ' · ' +
          (d.keepGroup ? 'ويبقى محسنًا في المهمة' : 'ليدر لهذه المهمة وحدها') + '</span></span>' +
        pill(d.state === 'accepted' ? 'مقبول' : d.state === 'pending' ? 'بانتظار' : 'مرفوض',
          d.state === 'accepted' ? 'live' : d.state === 'pending' ? 'wait' : 'no') + '</div>' +
        '<div class="grid g2" style="gap:8px;margin-top:11px">' +
          (d.state === 'pending' ? '<button class="btn p sm" data-a="avdelok" data-id="' + t.id + '">' +
            icon('i-check','s14') + 'اقبل عنه</button>' : '') +
          '<button class="btn l sm" data-a="avdeloff" data-id="' + t.id + '">' +
            icon('i-x','s14') + 'إلغاء التفويض</button>' +
        '</div></div>'
      : '<div class="card">' +
        head('اختر من يقود هذه المهمة', 'من المسكَّنين عليها — ولهذه المهمة وحدها', '', 'i-users') +
        (team.length ? '<div class="plist">' + team.map(m =>
          '<div class="prow" data-a="avdeleg" data-id="' + t.id + '" data-s="' + m.id + '">' +
            avatar(m) + '<span class="nm" style="flex:1"><b>' + E(m.name) + '</b>' +
            '<span>' + E(m.specialty || '') + (m.reserve ? ' · احتياط' : '') + '</span></span>' +
            pill('فوِّضه','gold') + '</div>').join('') + '</div>'
          : empty('لا أحد مسكَّن على المهمة', 'سكّن محسنين أوّلًا', 'i-users')) +
        '</div>') +

    '<button class="btn l" data-a="tlopen" data-id="' + t.id + '">' +
      icon('i-back','s16') + 'رجوع إلى المهمة</button>' };
  renderDrawer();
}

/* ============================================================
   تفصيل التقييم — ثلاثة مصادر كما في التطبيق
   ============================================================ */
const RATE_PARTS = {
  prep:  { ar:'التحضير والحضور', w:40 },
  start: { ar:'الالتزام بوقت البدء', w:20 },
  subs:  { ar:'إنجاز الخطوات', w:25 },
  close: { ar:'الإغلاق في وقته', w:15 }
};

/* يُحسب من الوقائع لا يُخترع — نفس معادلة التطبيق */
function rateOf(t) {
  const acc = t.assigned.length;
  const prep = acc ? t.attended.length / acc : 0;
  const start = t.autoStarted ? 0 : (t.startedAt && t.startedAt <= t.start) ? 1
    : t.startedAt ? Math.max(0, 1 - (t.startedAt - t.start) / HR) : (t.status === 'done' ? 1 : 0);
  const subs = t.subs.length ? t.subs.filter(s => s.done).length / t.subs.length : 0;
  const close = t.status !== 'done' ? 0 : (t.endedAt && t.endedAt > t.end)
    ? Math.max(0, 1 - (t.endedAt - t.end) / HR) : 1;
  const pct = prep * .40 + start * .20 + subs * .25 + close * .15;
  return { prep:Math.round(prep * 100), start:Math.round(start * 100),
    subs:Math.round(subs * 100), close:Math.round(close * 100),
    total:Math.round(pct * 100), stars:Math.max(1, Math.round(pct * 5 * 2) / 2) };
}

function rateDrawer(id) {
  const t = ensureTask(taskById(id)); if (!t) return;
  const r = rateOf(t);
  const seed = Number(String(t.code).replace(/\D/g, '')) || 1;
  const clamp = v => Math.max(1, Math.min(5, Math.round(v * 2) / 2));
  const sup = clamp(r.stars + ((seed % 5) - 2) * .5);
  const pil = clamp(r.stars + (((seed + 3) % 5) - 2) * .5);

  const bar = (k, v) => '<div style="margin-bottom:12px">' +
    '<div class="fl" style="justify-content:space-between"><span class="tiny">' + RATE_PARTS[k].ar +
      '<span class="faint"> · وزنه ' + AR(RATE_PARTS[k].w) + '٪</span></span>' +
      '<b class="tiny num">' + AR(v) + '٪</b></div>' +
    '<div class="meter' + (v >= 80 ? '' : v >= 50 ? ' gold' : ' red') + '" style="margin-top:5px">' +
      '<i data-w="' + v + '"></i></div></div>';

  S.drawer = { title:'تقييم المهمة', sub:t.title + ' · ' + t.kt, icon:'i-star',
    wide:!!S.dwide, expand:t.id, body:
    '<div class="card gold">' +
      head('المحصّلة', 'ثلاثة مصادر لا مصدر واحد',
        pill(AR(Math.round((r.stars + sup + pil) / 3 * 10) / 10) + ' من ٥', 'gold'), 'i-star') +
      '<div class="grid g3" style="gap:10px">' +
        '<span style="text-align:center"><div class="tiny faint">النظام</div>' +
          '<div style="margin-top:6px">' + stars(r.stars) + '</div></span>' +
        '<span style="text-align:center"><div class="tiny faint">المشرف</div>' +
          '<div style="margin-top:6px">' + stars(sup) + '</div></span>' +
        '<span style="text-align:center"><div class="tiny faint">الحجاج</div>' +
          '<div style="margin-top:6px">' + stars(pil) + '</div></span>' +
      '</div></div>' +

    '<div class="card">' +
      head('كيف حسبه النظام', 'أربعة مكوّنات بأوزانها — تُقرأ ولا تُساوَم', '', 'i-list') +
      Object.keys(RATE_PARTS).map(k => bar(k, r[k])).join('') +
      '<div class="tiny faint">المجموع الموزون ' + AR(r.total) + '٪ — أي ' +
        AR(r.stars) + ' من ٥ نجوم.</div>' +
    '</div>' +

    '<div class="card">' +
      head('ما وراء الأرقام', 'ملاحظتان تُقرآن مع النجوم', '', 'i-edit') +
      '<div class="evt info"><span class="dot"></span><span class="sp"><b>المشرف</b><p>' +
        (r.prep >= 80 ? 'التزم الفريق بالحضور قبل الموعد، والتنسيق مع الفندق كان مرتّبًا.'
          : 'تأخّر جزءٌ من الفريق عن التحضير، ونُبّه ليدر المجموعة.') + '</p></span></div>' +
      '<div class="evt info"><span class="dot"></span><span class="sp"><b>الحجاج</b><p>' +
        (pil >= 4 ? 'ثناءٌ على وضوح الإرشاد وحُسن التعامل في المجموعة.'
          : 'ملاحظاتٌ على الانتظار في نقطة التجمّع وطول مدّته.') + '</p></span></div>' +
    '</div>' +

    '<button class="btn l" data-a="tlopen" data-id="' + t.id + '">' +
      icon('i-back','s16') + 'رجوع إلى المهمة</button>' };
  renderDrawer();
}
