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

/* ══════════════ التذاكر والتقارير: إجراء حقيقي ══════════════ */
function ticketDrawer(id) {
  const k = V.tickets.find(x => x.id === id); if (!k) return;
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
      '<div class="chips">' + [...new Set(V.tickets.map(x => x.cat))].map(c =>
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
          '<span>' + LTR(to.code) + ' · ' + E(ROLE_AR[to.role] || '') + '</span></span>' +
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
  const r = V.reports.find(x => x.id === id); if (!r) return;
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
          '<span>' + LTR(to.code) + '</span></span>' +
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
   البوّابة — يُدخَل بصفة، ويُمثَّل بها شخصٌ بعينه
   ============================================================ */
function renderGate() {
  const w = document.getElementById('gatewrap');
  if (!w) return;
  if (S.auth) { w.innerHTML = ''; return; }
  const a = S.gate = S.gate || { perm:'admin', orgId:null, hotelId:null, leaderId:null, userId:null };
  const p = permOf(a.perm);
  /* grantsOf لا S.grants — فالافتراضيّ يسري ما لم تُخصَّص الصفة */
  const gr = p.scope === 'all' ? navItems().length : grantsOf(p.k).length;

  /* من تُمثِّل؟ يُسأل عنه حسب النطاق */
  let who = '', ready = true;
  if (p.scope === 'org') {
    ready = !!a.orgId;
    who = pickRow('الجهة', S.orgs.filter(o => p.k === 'mission' ? o.type === 'بعثة' : o.type === 'شركة')
      .map(o => [o.id, o.kt + ' · ' + o.ar]), a.orgId, 'gorg');
  } else if (p.scope === 'hotel') {
    ready = !!a.hotelId;
    who = pickRow('الفندق', HOTELS.map(h => [h.id, h.ar]), a.hotelId, 'ghotel');
  } else if (p.scope === 'team') {
    ready = !!a.leaderId;
    who = pickRow('الليدر', leaders().map(l => [l.id, l.kt + ' · ' + l.name]), a.leaderId, 'glead');
  } else if (p.scope === 'deal') {
    ready = true;
  } else if (p.scope === 'self') {
    ready = !!a.userId;
    who = pickRow('المحسن', S.users.filter(u => u.role === 'muhsen' && !u.reserve)
      .slice(0, 60).map(u => [u.id, u.name + ' · ' + u.code]), a.userId, 'guser');
  }

  w.innerHTML =
    '<div id="gate">' +
      '<div class="bg"><span class="grid"></span><span class="sweep"></span></div>' +
      '<button class="themebtn gtheme" data-a="theme">' +
        '<span>' + (S.theme === 'day' ? 'الوضع النهاري' : 'الوضع الليلي') + '</span>' +
        '<span class="knob">' + icon(S.theme === 'day' ? 'i-sun' : 'i-hour', 's14') + '</span></button>' +
      '<div class="gwrap wide">' +
        '<div class="gbrand">' +
          '<span class="gmark"><i style="background-image:url(' + (IMG.logo_white || '') + ')"></i></span>' +
          '<span><h1>مُحسن · الكنترول</h1>' +
          '<div class="gsub">غرفة عمليات موسم الحجّ ١٤٤٨ هـ</div></span>' +
        '</div>' +
        '<div class="gcard">' +
          '<label class="fl2" style="margin-top:0">ادخل بصفتك</label>' +
          '<div class="roles">' + PERMS.map(x => {
            const n = x.scope === 'all' ? navItems().length : grantsOf(x.k).length;
            return '<button class="role' + (x.k === a.perm ? ' on' : '') + '" ' +
              'data-a="grole" data-v="' + x.k + '">' +
              '<span class="fl" style="gap:8px;width:100%">' + icon(x.i, 's18') +
                '<b style="flex:1">' + E(x.ar) + '</b>' +
                (x.scope === 'all' ? pill('بلا قيد','gold')
                  : (n ? pill(AR(n),'live') : pill('بلا','no'))) +
              '</span>' +
              /* المجموعة هي ما يُفعل، والنطاق هو ما يُرى — فيُذكران معًا */
              '<span>' + E(SCOPE_AR[x.scope]) +
              (x.scope === 'all' ? ''
                : ' · ' + E((roleSetOf(x.k) || {}).name || 'بلا مجموعة')) +
              '</span></button>';
          }).join('') + '</div>' +

          (who ? '<div class="whobox">' + who + '</div>' : '') +

          '<div class="gnote">' + icon(gr ? 'i-checkc' : 'i-warn','s16') +
            '<span>' + (p.scope === 'all'
              ? 'الإدارة العليا ترى كل شيء وتعدّل كل شيء.'
              : gr ? 'لهذه الصفة ' + AR(gr) + ' شاشة، ونطاقها: ' + SCOPE_AR[p.scope] + '. ' +
                (roleSetOf(p.k)
                  ? 'وتفعل ما تُجيزه مجموعة «' + E(roleSetOf(p.k).name) + '» — ' +
                    AR(setCount(roleSetOf(p.k))) + ' فعلًا.'
                  : 'ولم تُمنح مجموعة أفعال — اطّلاع بلا تعديل.')
                   : 'لم تُسنَد لهذه الصفة أي شاشة — ستدخل ولا ترى شيئًا. هذا هو السلوك المقصود.') +
            '</span></div>' +

          '<button class="btn p" style="width:100%;margin-top:16px"' +
            (ready ? '' : ' disabled') + ' data-a="gin">' +
            icon('i-logout','s16') + 'دخول' + (ready ? '' : ' — اختر من تُمثِّل') + '</button>' +
        '</div>' +
        '<div class="gfoot">' + icon('i-shield','s14') + 'نظام مُحسن · نُزلي · ' + APP_VER + '</div>' +
      '</div>' +
    '</div>';
}

function pickRow(label, opts, cur, act) {
  return '<label class="fl2">' + E(label) + '</label>' +
    '<label class="fsel wide' + (cur ? ' on' : '') + '"><span>' + E(label) + '</span>' +
      '<select data-g="' + act + '">' +
        '<option value="">— اختر —</option>' +
        opts.map(o => '<option value="' + E(o[0]) + '"' +
          (cur === o[0] ? ' selected' : '') + '>' + E(o[1]) + '</option>').join('') +
      '</select>' + icon('i-fwd','s14') + '</label>';
}
