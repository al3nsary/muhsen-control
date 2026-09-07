/* ============================================================
   الإجراءات الحقيقية
   نُسك: فتح حالة · مسار خطوات · مرفقات وملاحظات · إنهاء
   الامتثال: بناء قالب · إسناد حسب الفندق
   التذاكر والتقارير: ردّ · إسناد · تصنيف · إغلاق
   ============================================================ */

/* ---------- المرفقات: يُلتقط الملف الحقيقي ويُحفظ وصفه ---------- */
function fileChip(f) {
  if (!f) return '';
  const kb = f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' م.ب'
    : Math.max(1, Math.round(f.size / 1024)) + ' ك.ب';
  return '<span class="fchip">' + icon(/image/.test(f.type || '') ? 'i-photo' : 'i-doc', 's14') +
    '<b>' + E(f.name) + '</b><span>' + E(kb) + '</span></span>';
}
function filePick(key) {
  const f = (S.files || {})[key];
  return '<label class="fpick">' + icon('i-clip','s16') +
    '<span>' + (f ? 'تغيير المرفق' : 'إرفاق ملف') + '</span>' +
    '<input type="file" data-file="' + key + '" hidden></label>' +
    (f ? fileChip(f) : '');
}

/* ══════════════ نُسك: فتح حالة حقيقية ══════════════ */
function nusukNew() {
  S.nform = S.nform || { svc:'lost', pid:'', note:'' };
  const d = S.nform;
  const q = qOf('npil');
  let pool = allPilgrimRows();
  if (q) pool = pool.filter(p => (p.name + ' ' + p.no + ' ' + p.kt + ' ' + p.room).indexOf(q) >= 0);
  const chosen = d.pid ? allPilgrimRows().find(p => p.id === d.pid) : null;

  S.drawer = { title:'فتح حالة نُسك', sub:'ابحث عن الحاجّ، اختر الخدمة، وارفع مرفقًا إن وُجد',
    icon:'i-idcard', body:
    '<div class="card">' + head('١ · الخدمة', 'لكلٍّ مهلتها وخطواتها') +
      '<div class="chips">' + Object.keys(NUSUK_SVC).map(k =>
        '<button class="chip2' + (d.svc === k ? ' on' : '') + '" data-a="nfsvc" data-v="' + k + '">' +
        E(NUSUK_SVC[k].ar) + ' · ' + AR(NUSUK_SVC[k].sla) + ' س</button>').join('') + '</div>' +
      '<div class="steps2" style="margin-top:12px">' + NUSUK_SVC[d.svc].steps.map((s, i) =>
        '<span class="st2">' + '<i></i>' + AR(i + 1) + ' · ' + E(s) + '</span>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' + head('٢ · الحاجّ', chosen ? 'اختير' : 'ابحث بالاسم أو رقم الجواز') +
      '<div class="find">' + icon('i-search','s18') +
        '<input id="q-npil" data-q="npil" value="' + E(q) + '" ' +
        'placeholder="اسم الحاجّ أو رقم جوازه أو مجموعته…" autocomplete="off">' +
        '<span class="tiny faint">' + AR(pool.length) + '</span></div>' +
      (chosen ? '<div class="prow" style="margin-top:12px">' +
          avatar({ g:chosen.g, av:chosen.g === 'f' ? 'p5' : 'p2' }, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(chosen.name) + '</b>' +
          '<span>' + E(chosen.no) + ' · ' + E(chosen.kt) + ' · غرفة ' + AR(chosen.room) + '</span></span>' +
          '<button class="xbtn" data-a="nfclr">' + icon('i-x','s14') + '</button></div>'
        : (q ? '<div class="plist" style="margin-top:12px">' + pool.slice(0, 8).map(p =>
            '<button class="prow pick" data-a="nfpil" data-id="' + p.id + '">' +
            avatar({ g:p.g, av:p.g === 'f' ? 'p5' : 'p2' }, 'sm') +
            '<span class="nm" style="flex:1"><b>' + E(p.name) + '</b>' +
            '<span>' + E(p.no) + ' · ' + E(p.kt) + '</span></span></button>').join('') + '</div>'
          : '<div class="tiny faint" style="margin-top:12px">اكتب حرفين على الأقلّ.</div>')) +
    '</div>' +

    '<div class="card">' + head('٣ · البلاغ', 'ما الذي حدث؟ ومرفق إن وُجد') +
      '<textarea class="fld" id="q-nnote" data-q="nnote" rows="3" ' +
        'placeholder="مثال: فقد البطاقة في الحرم بعد صلاة العصر">' + E(qOf('nnote')) + '</textarea>' +
      '<div style="margin-top:11px">' + filePick('nusukNew') + '</div>' +
    '</div>' +

    '<button class="btn p" style="width:100%"' + (chosen ? '' : ' disabled') +
      ' data-a="nfsave">' + icon('i-checkc','s16') + 'فتح الحالة</button>'
  };
  renderDrawer();
}

/* ---------- مسار الحالة ---------- */
function nusukDrawer(id) {
  const c = S.nusuk.find(x => x.id === id); if (!c) return;
  const V = NUSUK_SVC[c.svc], ST = NUSUK_STATE[c.state];
  const to = c.assignedTo ? userById(c.assignedTo) : null;
  const done = c.state === 'delivered';

  S.drawer = { title:V.ar + ' — ' + c.pilgrim, sub:c.no + ' · جواز ' + c.passport + ' · ' + c.kt,
    icon:V.i, body:
    '<div class="fl" style="gap:11px">' + pill(ST.ar, ST.c) +
      pill('مهلة ' + AR(V.sla) + ' ساعة', 'grey') +
      '<span class="sp"></span><span class="tiny faint">فُتحت ' + ago(c.at) + ' · ' + E(c.openedBy) + '</span></div>' +

    '<div class="card">' + head('المسار', 'الخطوة ' + AR(Math.min(c.step + 1, V.steps.length)) +
        ' من ' + AR(V.steps.length)) +
      '<div class="wf">' + V.steps.map((s, i) =>
        '<div class="wfs' + (i < c.step ? ' done' : i === c.step ? ' now' : '') + '">' +
          '<span class="wfn">' + (i < c.step ? icon('i-checkc','s14') : AR(i + 1)) + '</span>' +
          '<span class="nm"><b>' + E(s) + '</b></span></div>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' + head('المُسنَد إليه', to ? 'ينفّذها في الميدان' : 'لم تُسنَد بعد') +
      (to ? '<div class="prow">' + avatar(to, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(to.name) + '</b>' +
          '<span>' + E(to.code) + ' · ' + E(ROLE_AR[to.role] || '') +
          (to.reserve ? ' · احتياط' : '') + '</span></span>' +
          '<button class="btn l sm" data-a="nassign" data-id="' + c.id + '">تغيير</button></div>'
        : '<button class="btn p" style="width:100%" data-a="nassign" data-id="' + c.id + '">' +
          icon('i-users','s16') + 'إسناد لمحسن أو ليدر</button>') +
    '</div>' +

    (done ? '' :
    '<div class="card gold">' + head('تقديم الخطوة', 'اكتب ما تمّ، وأرفق إن لزم') +
      '<textarea class="fld" id="q-nstepnote" data-q="nstepnote" rows="2" ' +
        'placeholder="ماذا تمّ في هذه الخطوة؟">' + E(qOf('nstepnote')) + '</textarea>' +
      '<div style="margin-top:11px">' + filePick('nusukStep') + '</div>' +
      '<div class="fl" style="gap:10px;margin-top:13px">' +
        '<button class="btn p" style="flex:1" data-a="nstep" data-id="' + c.id + '">' +
          icon('i-fwd','s16') + 'الخطوة التالية</button>' +
        '<button class="btn l" data-a="nclose" data-id="' + c.id + '">' +
          icon('i-checkc','s16') + 'إنهاء الحالة</button>' +
      '</div></div>') +

    '<div class="card">' + head('السجلّ', AR((c.trail || []).length) + ' قيدًا') +
      ((c.trail || []).length ? '<div class="tline">' + c.trail.slice().reverse().map(t =>
        '<div class="tev"><span class="tdot live">' + icon('i-checkc','s14') + '</span>' +
        '<div class="tbody"><b style="font-size:12.5px">' + E(t.text) + '</b>' +
        (t.file ? '<div style="margin-top:7px">' + fileChip(t.file) + '</div>' : '') +
        '<span class="tiny faint">' + E(t.by) + ' · ' + hijri(t.at) + ' · ' + t12(t.at) + '</span>' +
        '</div></div>').join('') + '</div>'
        : empty('لا قيود بعد', 'كل خطوة تُكتب هنا', 'i-hist')) +
    '</div>'
  };
  renderDrawer();
}

/* ══════════════ الامتثال: باني القالب ══════════════ */
function formBuilder(id) {
  S.fb = S.fb || (id ? Object.assign({ editing:id }, JSON.parse(JSON.stringify(formById(id))))
    : { title:'', scope:'فندق', icon:'i-clip', color:'#0B7A4B', qs:[], editing:null });
  const b = S.fb;
  S.drawer = { title:b.editing ? 'تعديل قالب' : 'قالب امتثال جديد',
    sub:'يُبنى مرّة، ويُسنَد مرارًا، ولكل إجابة وزنها', icon:'i-clip', body:
    '<div class="card">' + head('هوية القالب', 'اسمه ونطاقه') +
      '<label class="fl2">العنوان</label>' +
      '<input class="fld" id="q-fbt" data-q="fbt" value="' + E(b.title) + '" ' +
        'placeholder="مثال: التزام الفندق بالعقد">' +
      '<label class="fl2">النطاق</label>' +
      '<div class="chips">' + ['فندق','نقل','إعاشة','تفويج'].map(s =>
        '<button class="chip2' + (b.scope === s ? ' on' : '') + '" data-a="fbscope" data-v="' + s + '">' +
        E(s) + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' + head('الأسئلة', AR(b.qs.length) + ' سؤالًا — الوزن صفر يعني لا يُحتسب') +
      (b.qs.length ? '<div class="plist">' + b.qs.map((q, i) =>
        '<div class="prow" style="flex-wrap:wrap">' +
          '<span class="sn">' + AR(i + 1) + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(q.q) + '</b>' +
          '<span>' + E(QT[q.t]) + ' · وزن ' + AR(q.w) + '</span></span>' +
          '<button class="xbtn" data-a="fbdel" data-v="' + i + '">' + icon('i-x','s14') + '</button>' +
        '</div>').join('') + '</div>'
        : '<div class="tiny faint">لا سؤال بعد.</div>') +

      '<div class="qadd">' +
        '<input class="fld" id="q-fbq" data-q="fbq" value="' + E(qOf('fbq')) + '" ' +
          'placeholder="نصّ السؤال…">' +
        '<div class="fl" style="gap:9px;margin-top:10px;flex-wrap:wrap">' +
          '<label class="fsel"><span>الإجابة</span>' +
            '<select data-f="fb" data-fk="qt">' + Object.keys(QT).map(k =>
              '<option value="' + k + '"' + (fOf('fb','qt') === k ? ' selected' : '') + '>' +
              E(QT[k]) + '</option>').join('') + '</select>' + icon('i-fwd','s14') + '</label>' +
          '<label class="fsel"><span>الوزن</span>' +
            '<select data-f="fb" data-fk="qw">' + [0,1,2,3].map(w =>
              '<option value="' + w + '"' + (String(fOf('fb','qw')) === String(w) ? ' selected' : '') +
              '>' + AR(w) + '</option>').join('') + '</select>' + icon('i-fwd','s14') + '</label>' +
          '<button class="btn l sm" data-a="fbadd">' + icon('i-plus','s14') + 'أضف سؤالًا</button>' +
        '</div></div>' +
    '</div>' +

    '<button class="btn p" style="width:100%"' + (b.title && b.qs.length ? '' : ' disabled') +
      ' data-a="fbsave">' + icon('i-checkc','s16') +
      (b.editing ? 'حفظ التعديل' : 'حفظ القالب') + '</button>'
  };
  renderDrawer();
}

/* إسناد نموذج: يُختار الفندق أوّلًا، ثم المحسن من ساكنيه */
function formAssign(id) {
  const f = formById(id); if (!f) return;
  S.pendForm = { formId:id, target:null };
  S.drawer = { title:'إسناد «' + f.title + '»', sub:'اختر الجهة، ثم من ينفّذها من ساكنيها',
    icon:f.icon, body:
    '<div class="card">' + head('الجهة', 'المحسن يُختار من مجموعة تسكن فيها') +
      '<div class="plist">' + HOTELS.map(h => {
        const gs = S.groups.filter(g => g.hotelId === h.id);
        const n = gs.reduce((a, g) => a + g.members.length + 1, 0);
        return '<button class="prow pick" data-a="fatarget" data-id="' + h.id + '"' +
          (n ? '' : ' disabled') + '>' +
          '<span class="ico">' + icon('i-key','s16') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(h.ar) + '</b>' +
          '<span>' + E(h.city) + ' · ' + AR(h.rooms) + ' غرفة</span></span>' +
          pill(AR(gs.length) + ' مجموعة', gs.length ? 'live' : 'grey') +
          pill(AR(n) + ' موظفًا', n ? 'gold' : 'grey') + '</button>';
      }).join('') + '</div></div>'
  };
  renderDrawer();
}

/* ══════════════ التذاكر والتقارير: إجراء حقيقي ══════════════ */
function ticketDrawer(id) {
  const k = S.tickets.find(x => x.id === id); if (!k) return;
  const to = k.assignedTo ? userById(k.assignedTo) : null;
  const closed = k.status === 'مغلقة';
  S.drawer = { title:k.title, sub:k.no + ' · ' + k.from + ' · ' + k.kt, icon:'i-ticket', body:
    '<div class="fl" style="gap:9px;flex-wrap:wrap">' +
      pill(k.cat, 'grey') +
      pill(k.pri, k.pri === 'حرجة' ? 'no' : k.pri === 'عاجلة' ? 'wait' : 'grey') +
      pill(k.status, closed ? 'live' : 'wait') +
      '<span class="sp"></span><span class="tiny faint">' + ago(k.at) + '</span></div>' +
    '<div class="quote">' + E(k.body) + '</div>' +

    '<div class="card">' + head('التصنيف والأولوية', 'يُغيَّران من هنا') +
      '<label class="fl2">التصنيف</label>' +
      '<div class="chips">' + [...new Set(S.tickets.map(x => x.cat))].map(c =>
        '<button class="chip2' + (k.cat === c ? ' on' : '') + '" data-a="tkcat" data-id="' + k.id +
        '" data-v="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>' +
      '<label class="fl2">الأولوية</label>' +
      '<div class="chips">' + ['حرجة','عاجلة','عادية'].map(p =>
        '<button class="chip2' + (k.pri === p ? ' on' : '') + '" data-a="tkpri" data-id="' + k.id +
        '" data-v="' + E(p) + '">' + E(p) + '</button>').join('') + '</div>' +
    '</div>' +

    '<div class="card">' + head('المُسنَد إليه', to ? '' : 'لم تُسنَد بعد') +
      (to ? '<div class="prow">' + avatar(to, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(to.name) + '</b>' +
          '<span>' + E(to.code) + ' · ' + E(ROLE_AR[to.role] || '') + '</span></span>' +
          '<button class="btn l sm" data-a="tkassign" data-id="' + k.id + '">تغيير</button></div>'
        : '<button class="btn p" style="width:100%" data-a="tkassign" data-id="' + k.id + '">' +
          icon('i-users','s16') + 'إسناد لمحسن أو ليدر</button>') +
    '</div>' +

    '<div class="card gold">' + head('الردّ', 'يصل صاحب التذكرة في التطبيق') +
      '<textarea class="fld" id="q-tkreply" data-q="tkreply" rows="3" ' +
        'placeholder="اكتب ردًّا واضحًا يُغني عن سؤال آخر…">' + E(qOf('tkreply')) + '</textarea>' +
      '<div style="margin-top:11px">' + filePick('tkReply') + '</div>' +
      '<div class="fl" style="gap:10px;margin-top:13px">' +
        '<button class="btn p" style="flex:1" data-a="tkreply" data-id="' + k.id + '">' +
          icon('i-send','s16') + 'إرسال الردّ</button>' +
        (closed ? '<button class="btn l" data-a="tkopen" data-id="' + k.id + '">إعادة فتح</button>'
          : '<button class="btn l" data-a="tkclose" data-id="' + k.id + '">' +
            icon('i-checkc','s16') + 'إغلاق</button>') +
      '</div></div>' +

    '<div class="card">' + head('المحادثة', AR((k.thread || []).length) + ' رسالة') +
      ((k.thread || []).length ? '<div class="tline">' + k.thread.slice().reverse().map(t =>
        '<div class="tev"><span class="tdot gold">' + icon('i-send','s14') + '</span>' +
        '<div class="tbody"><b style="font-size:12.5px">' + E(t.text) + '</b>' +
        (t.file ? '<div style="margin-top:7px">' + fileChip(t.file) + '</div>' : '') +
        '<span class="tiny faint">' + E(t.by) + ' · ' + t12(t.at) + ' · ' + ago(t.at) + '</span>' +
        '</div></div>').join('') + '</div>'
        : empty('لا ردّ بعد', 'أوّل ردّ يبدأ المحادثة', 'i-send')) +
    '</div>'
  };
  renderDrawer();
}

function reportDrawer(id) {
  const r = S.reports.find(x => x.id === id); if (!r) return;
  const L = userById(r.from) || {}, to = r.assignedTo ? userById(r.assignedTo) : null;
  S.drawer = { title:r.title, sub:r.no + ' · ' + r.kt + ' · ' + (L.name || ''), icon:'i-flag', body:
    '<div class="fl" style="gap:9px;flex-wrap:wrap">' + pill(r.cat, 'gold') +
      pill(r.status, r.escalated ? 'no' : 'wait') +
      '<span class="sp"></span><span class="tiny faint">' + ago(r.at) + '</span></div>' +
    '<div class="quote">' + E(r.body) + '</div>' +

    (r.room ? '<div class="card gold">' + head('تعديل بيانات غرفة', 'يمسّ قاعدة البيانات مباشرة') +
      '<div class="fl" style="gap:11px;flex-wrap:wrap">' +
        '<span class="mchip">' + icon('i-key','s14') + E(r.room.floor) + ' · غرفة ' + E(r.room.no) + '</span>' +
        '<button class="btn p sm" data-a="roomapply" data-id="' + r.id + '">تحديث قاعدة البيانات</button>' +
      '</div></div>' : '') +

    '<div class="card">' + head('المُسنَد إليه', to ? '' : 'لم يُسنَد بعد') +
      (to ? '<div class="prow">' + avatar(to, 'sm') +
          '<span class="nm" style="flex:1"><b>' + E(to.name) + '</b>' +
          '<span>' + E(to.code) + '</span></span>' +
          '<button class="btn l sm" data-a="rpassign" data-id="' + r.id + '">تغيير</button></div>'
        : '<button class="btn p" style="width:100%" data-a="rpassign" data-id="' + r.id + '">' +
          icon('i-users','s16') + 'إسناد لمن يعالجه</button>') +
    '</div>' +

    '<div class="card gold">' + head('الردّ على الليدر', 'يصله في التطبيق') +
      '<textarea class="fld" id="q-rpreply" data-q="rpreply" rows="3" ' +
        'placeholder="ما القرار؟ ولماذا؟">' + E(qOf('rpreply')) + '</textarea>' +
      '<div style="margin-top:11px">' + filePick('rpReply') + '</div>' +
      '<div class="fl" style="gap:10px;margin-top:13px">' +
        '<button class="btn p" style="flex:1" data-a="rpreply" data-id="' + r.id + '">' +
          icon('i-send','s16') + 'إرسال</button>' +
        '<button class="btn l" data-a="rpclose" data-id="' + r.id + '">' +
          icon('i-checkc','s16') + 'إغلاق التقرير</button>' +
      '</div></div>' +

    '<div class="card">' + head('السجلّ', AR((r.thread || []).length) + ' قيدًا') +
      ((r.thread || []).length ? '<div class="tline">' + r.thread.slice().reverse().map(t =>
        '<div class="tev"><span class="tdot gold">' + icon('i-flag','s14') + '</span>' +
        '<div class="tbody"><b style="font-size:12.5px">' + E(t.text) + '</b>' +
        (t.file ? '<div style="margin-top:7px">' + fileChip(t.file) + '</div>' : '') +
        '<span class="tiny faint">' + E(t.by) + ' · ' + ago(t.at) + '</span></div></div>').join('') + '</div>'
        : empty('لا قيود', '', 'i-hist')) +
    '</div>'
  };
  renderDrawer();
}

/* ============================================================
   بوّابة الدخول — أوّل ما يُرى، فليكن على مستوى ما بعده
   ============================================================ */
const GATE_ROLES = [
  { k:'ctl',  i:'i-target', l:'غرفة العمليات', d:'صلاحية كاملة' },
  { k:'sup',  i:'i-shield', l:'مشرف سكن',      d:'فنادقه ومجموعاتها' },
  { k:'ops',  i:'i-users',  l:'منسّق تشكيل',   d:'المجموعات والتسكين' },
  { k:'view', i:'i-eye',    l:'قراءة فقط',     d:'بلا إجراءات' }
];

function renderGate() {
  const w = document.getElementById('gatewrap');
  if (!w) return;
  if (S.auth) { w.innerHTML = ''; return; }
  const role = S.gateRole || 'ctl';
  w.innerHTML =
    '<div id="gate">' +
      '<div class="bg"><span class="grid"></span><span class="sweep"></span></div>' +
      '<button class="themebtn gtheme" data-a="theme">' +
        '<span>' + (S.theme === 'day' ? 'الوضع النهاري' : 'الوضع الليلي') + '</span>' +
        '<span class="knob">' + icon(S.theme === 'day' ? 'i-sun' : 'i-hour', 's14') + '</span></button>' +
      '<div class="gwrap">' +
        '<div class="gbrand">' +
          '<span class="gmark"><i style="background-image:url(' + (IMG.logo_white || '') + ')"></i></span>' +
          '<span><h1>مُحسن · الكنترول</h1>' +
          '<div class="gsub">غرفة عمليات موسم الحجّ ١٤٤٨ هـ</div></span>' +
        '</div>' +
        '<div class="gcard">' +
          '<label class="fl2" style="margin-top:0">ادخل بصفتك</label>' +
          '<div class="roles">' + GATE_ROLES.map(r =>
            '<button class="role' + (r.k === role ? ' on' : '') + '" data-a="grole" data-v="' + r.k + '">' +
            icon(r.i, 's18') + '<b>' + E(r.l) + '</b><span>' + E(r.d) + '</span></button>').join('') +
          '</div>' +
          '<label class="fl2">اسم المستخدم</label>' +
          '<input class="fld" id="q-gu" data-q="gu" value="' + E(qOf('gu') || 'control') + '" ' +
            'placeholder="اسم المستخدم" autocomplete="username">' +
          '<label class="fl2">كلمة المرور</label>' +
          '<input class="fld" type="password" id="q-gp" data-q="gp" value="' + E(qOf('gp') || '••••••••') + '" ' +
            'placeholder="كلمة المرور" autocomplete="current-password">' +
          '<button class="btn p" style="width:100%;margin-top:18px" data-a="gin">' +
            icon('i-logout','s16') + 'دخول غرفة العمليات</button>' +
          '<div class="tiny faint" style="margin-top:12px;text-align:center">' +
            'نسخة معاينة — الدخول لا يتحقّق من كلمة مرور حقيقية.</div>' +
        '</div>' +
        '<div class="gfoot">' + icon('i-shield','s14') + 'نظام مُحسن · نُزلي · ' + APP_VER + '</div>' +
      '</div>' +
    '</div>';
}
