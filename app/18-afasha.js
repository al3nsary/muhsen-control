/* ============================================================
   العفاشة — مقاولون لهم عمّال، يُتعاقد معهم
   ─────────────────────────────────────────────────────────────
   الدورة: يُضاف المقاول ← تصل رسالة نصية بدخوله ←
   يُرسَل له عقدٌ بتفاصيله ومرفقه ← يقبل أو يرفض،
   وللكنترول أن يوافق نيابةً عنه إن تُعوقد خارج النظام.
   ============================================================ */

const DEAL_ST = {
  draft:   { ar:'مسودة',            c:'grey' },
  sent:    { ar:'أُرسل — بانتظاره', c:'wait' },
  agreed:  { ar:'قُبل',              c:'live' },
  refused: { ar:'رُفض',              c:'no'   },
  offline: { ar:'مُعتمد خارج النظام', c:'blue' }
};
const SMS_ST = {
  queued:    { ar:'في الطابور',  c:'grey', i:'i-hour' },
  sent:      { ar:'أُرسلت',      c:'wait', i:'i-send' },
  delivered: { ar:'وصلت',        c:'live', i:'i-checkc' },
  failed:    { ar:'لم تصل',      c:'no',   i:'i-x' }
};

const openDeals = () => V.deals.filter(d => d.state === 'sent' || d.state === 'draft');
const dealById = id => S.deals.find(d => d.id === id);
const contractorById = id => S.contractors.find(c => c.id === id);
const dealsOf = cid => V.deals.filter(d => d.contractorId === cid);

function screenAfasha() {
  const q = qOf('afa');
  const fst = fOf('afa','state'), fsm = fOf('afa','sms');
  let list = V.contractors.slice();
  if (fst) list = list.filter(c => (lastDeal(c.id) || {}).state === fst);
  if (fsm) list = list.filter(c => c.sms === fsm);
  if (q) list = list.filter(c => (c.name + ' ' + c.company + ' ' + c.phone).indexOf(q) >= 0);
  const agreed = V.contractors.filter(c => {
    const d = lastDeal(c.id); return d && (d.state === 'agreed' || d.state === 'offline'); }).length;

  return '<div class="grid g4">' +
      stat({ label:'المقاولون', n:V.contractors.length, ic:'i-truck',
        sub:'لكلٍّ عمّاله', series:[2,4,6,8,10,12,13,V.contractors.length] }) +
      stat({ label:'متعاقَد معهم', n:agreed, ic:'i-checkc', cls:'up',
        sub:'قبلوا أو اعتُمدوا خارج النظام', series:[0,1,2,3,4,5,6,agreed] }) +
      stat({ label:'بانتظار ردّهم', n:V.deals.filter(d => d.state === 'sent').length, ic:'i-hour',
        cls:'warn', sub:'أُرسل العقد ولم يُبَتّ',
        series:[1,2,2,3,3,4,3,Math.max(1, V.deals.filter(d => d.state === 'sent').length)] }) +
      stat({ label:'رسائل لم تصل', n:V.contractors.filter(c => c.sms === 'failed').length,
        ic:'i-x', cls:'bad', sub:'تحتاج رقمًا صحيحًا', series:[0,1,0,1,1,2,1,1] }) +
    '</div>' +

    '<div class="card gold">' +
      head('مقاولو العفاشة', 'يُضاف المقاول فتصل رسالته، ثم يُرسَل له العقد',
        '<button class="btn p sm" data-a="cnew">' + icon('i-plus','s16') + 'مقاول جديد</button>',
        'i-truck') +
      filterBar('afa', [
        { k:'state', label:'العقد',   opts:Object.keys(DEAL_ST).map(k => [k, DEAL_ST[k].ar]) },
        { k:'sms',   label:'الرسالة', opts:Object.keys(SMS_ST).map(k => [k, SMS_ST[k].ar]) }
      ], list.length, V.contractors.length, 'ابحث باسم مقاول أو شركة أو رقم…') +

      (list.length ? '<div class="plist">' + list.map((c, i) => {
        const d = lastDeal(c.id), st = d ? DEAL_ST[d.state] : DEAL_ST.draft;
        const sm = SMS_ST[c.sms] || SMS_ST.queued;
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 45) + 'ms">' +
          '<span class="krail" style="background:' +
            (d && (d.state === 'agreed' || d.state === 'offline') ? 'var(--live)'
              : d && d.state === 'refused' ? 'var(--red)' : 'var(--amber)') + '"></span>' +
          '<span class="ico">' + icon('i-truck','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(c.name) + '</b>' +
          '<span>' + E(c.company) + ' · ' + LTR(c.phone) + ' · ' +
            AR(c.workers) + ' عاملًا</span></span>' +
          pill(st.ar, st.c) +
          '<span class="smsbox" title="حالة الرسالة النصية">' + icon(sm.i,'s14') +
            '<span>' + E(sm.ar) + '</span></span>' +
          '<span class="tiny faint">' + ago(c.at) + '</span>' +
          '<div class="pfoot" style="width:100%">' +
            '<span class="ok">' + LTR(c.user) + ' · ' +
              (d ? 'العقد ' + LTR(d.no) + (d.file ? ' · مرفق' : '') : 'بلا عقد بعد') + '</span>' +
            '<span class="fl" style="gap:7px">' +
              (c.sms === 'failed'
                ? '<button class="btn l sm" data-a="csms" data-id="' + c.id + '">إعادة الإرسال</button>' : '') +
              '<button class="btn l sm" data-a="copen" data-id="' + c.id + '">الملفّ</button>' +
              (!d || d.state === 'refused'
                ? '<button class="btn p sm" data-a="cdeal" data-id="' + c.id + '">إرسال عقد</button>'
                : d.state === 'sent'
                ? '<button class="btn p sm" data-a="cagree" data-id="' + d.id + '">موافقة نيابةً عنه</button>'
                : pill('مكتمل', 'live')) +
            '</span></div></div>';
      }).join('') + '</div>'
        : empty('لا مقاول يطابق', 'أضف مقاولًا أو وسّع الفلاتر', 'i-truck')) +
    '</div>';
}
const lastDeal = cid => S.deals.filter(d => d.contractorId === cid)
  .sort((a, b) => b.at - a.at)[0] || null;

/* ---------- إضافة مقاول ---------- */
function contractorNew() {
  S.drawer = { title:'مقاول عفاشة جديد', sub:'بالحفظ تصل رسالته النصية فورًا',
    icon:'i-truck', body:
    '<div class="card">' + head('بياناته', 'ثلاثة تكفي للبدء') +
      '<label class="fl2" style="margin-top:0">اسم المقاول</label>' +
      '<input class="fld" id="q-cn" data-q="cn" value="' + E(qOf('cn')) + '" ' +
        'placeholder="مثال: سعد بن مبارك">' +
      '<label class="fl2">الشركة</label>' +
      '<input class="fld" id="q-cc" data-q="cc" value="' + E(qOf('cc')) + '" ' +
        'placeholder="مثال: مؤسسة السند لخدمات العفش">' +
      '<label class="fl2">رقم الجوال</label>' +
      '<input class="fld" id="q-cp" data-q="cp" value="' + E(qOf('cp')) + '" ' +
        'placeholder="+9665…" dir="ltr" style="text-align:right">' +
      '<label class="fl2">عدد العمّال</label>' +
      '<input class="fld" id="q-cw" data-q="cw" value="' + E(qOf('cw')) + '" ' +
        'placeholder="مثال: ١٢">' +
    '</div>' +
    '<div class="quote">' + icon('i-send','s14') +
      ' بالحفظ تُنشأ له بيانات دخول وتُرسَل برسالة نصية إلى رقمه، ' +
      'وصلاحيته لا تتجاوز <b>الموافقة على العقد</b>.</div>' +
    '<button class="btn p" style="width:100%" data-a="csave">' +
      icon('i-checkc','s16') + 'حفظ وإرسال بيانات الدخول</button>'
  };
  renderDrawer();
}

/* ---------- إرسال عقد ---------- */
function dealNew(cid) {
  const c = contractorById(cid); if (!c) return;
  S.pendDeal = cid;
  S.drawer = { title:'عقد مع ' + c.name, sub:c.company + ' · ' + AR(c.workers) + ' عاملًا',
    icon:'i-doc', body:
    '<div class="card">' + head('تفاصيل التعاقد', 'ما سيقرؤه قبل أن يقبل') +
      '<label class="fl2" style="margin-top:0">عنوان العقد</label>' +
      '<input class="fld" id="q-dt" data-q="dt" value="' + E(qOf('dt') ||
        'تعاقد نقل عفش الحجاج — موسم ١٤٤٨ هـ') + '">' +
      '<label class="fl2">النطاق والمدّة</label>' +
      '<textarea class="fld" id="q-db" data-q="db" rows="4" ' +
        'placeholder="ما المطلوب؟ وأين؟ وكم مدّته؟">' + E(qOf('db') ||
        'نقل عفش الحجاج بين الفنادق والمشاعر طوال الموسم، بعدد عمّال لا يقلّ عن المتّفق عليه، ' +
        'وبإشراف مشرف السكن في كل فندق.') + '</textarea>' +
      '<div class="grid g2" style="gap:10px;margin-top:12px">' +
        '<span><label class="fl2" style="margin-top:0">القيمة (ريال)</label>' +
        '<input class="fld" id="q-dv" data-q="dv" value="' + E(qOf('dv') || '٤٥٠٠٠') + '"></span>' +
        '<span><label class="fl2" style="margin-top:0">مدّة الردّ (ساعة)</label>' +
        '<input class="fld" id="q-dh" data-q="dh" value="' + E(qOf('dh') || '٤٨') + '"></span>' +
      '</div>' +
      '<div style="margin-top:12px">' + filePick('deal') + '</div>' +
    '</div>' +
    '<div class="fl" style="gap:10px">' +
      '<button class="btn p" style="flex:1" data-a="dsend">' + icon('i-send','s16') +
        'إرسال العقد إليه</button>' +
      '<button class="btn l" data-a="doffline">' + icon('i-checkc','s16') +
        'تُعوقد خارج النظام</button>' +
    '</div>'
  };
  renderDrawer();
}

/* ---------- ملفّ المقاول ---------- */
function contractorDrawer(id) {
  const c = contractorById(id); if (!c) return;
  const ds = S.deals.filter(d => d.contractorId === id).sort((a, b) => b.at - a.at);
  const sm = SMS_ST[c.sms] || SMS_ST.queued;
  S.drawer = { title:c.name, sub:c.company, icon:'i-truck', body:
    '<div class="meta">' +
      '<div><span class="k">العمّال</span><b class="num">' + AR(c.workers) + '</b></div>' +
      '<div><span class="k">العقود</span><b class="num">' + AR(ds.length) + '</b></div>' +
      '<div><span class="k">منذ</span><b>' + ago(c.at) + '</b></div>' +
    '</div>' +

    '<div class="card">' + head('البيانات والدخول', 'صلاحيته: الموافقة على العقد فقط') +
      '<div class="kvlist">' +
        kvRow('i-phone','الجوال', c.phone, true) +
        kvRow('i-user','اسم الدخول', c.user, true) +
        kvRow('i-key','الرقم السرّي', c.pass, true) +
        kvRow('i-shield','الصفة', 'مقاول عفاشة') +
      '</div>' +
      '<div class="fl" style="gap:10px;margin-top:13px;flex-wrap:wrap">' +
        '<span class="smsbox ' + sm.c + '">' + icon(sm.i,'s14') +
          '<span>الرسالة: ' + E(sm.ar) + (c.smsAt ? ' · ' + ago(c.smsAt) : '') + '</span></span>' +
        '<button class="btn l sm" data-a="csms" data-id="' + c.id + '">' +
          icon('i-send','s14') + 'إعادة إرسال بيانات الدخول</button>' +
      '</div>' +
      '<div class="quote" style="margin-top:12px">' + E(smsText(c)) + '</div>' +
    '</div>' +

    '<div class="card">' + head('العقود', AR(ds.length) + ' عقدًا',
        '<button class="btn p sm" data-a="cdeal" data-id="' + c.id + '">عقد جديد</button>') +
      (ds.length ? '<div class="plist">' + ds.map(d => {
        const st = DEAL_ST[d.state];
        return '<div class="prow" style="flex-wrap:wrap">' +
          '<span class="ico">' + icon('i-doc','s16') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(d.title) + '</b>' +
          '<span>' + LTR(d.no) + ' · ' + AR(d.value) + ' ريال · ' + ago(d.at) + '</span></span>' +
          pill(st.ar, st.c) +
          '<div style="width:100%">' +
            '<div class="quote">' + E(d.body) + '</div>' +
            (d.file ? '<div style="margin-top:9px">' + fileChip(d.file) + '</div>' : '') +
            (d.state === 'sent' ? '<div class="fl" style="gap:9px;margin-top:11px">' +
              '<button class="btn p sm" data-a="cagree" data-id="' + d.id + '">موافقة نيابةً عنه</button>' +
              '<button class="btn d sm" data-a="crefuse" data-id="' + d.id + '">تسجيل رفضه</button></div>' : '') +
            (d.reason ? '<div class="tiny" style="margin-top:8px;color:var(--gold3)">' +
              E(d.reason) + '</div>' : '') +
          '</div></div>';
      }).join('') + '</div>' : empty('لا عقد بعد', 'أرسل له أوّل عقد', 'i-doc')) +
    '</div>'
  };
  renderDrawer();
}

const smsText = c => 'مُحسن · الكنترول: أهلًا ' + c.name + '، بيانات دخولك: ' +
  'المستخدم ' + c.user + ' والرقم السرّي ' + c.pass + '. ' +
  'ادخل للاطّلاع على العقد والموافقة عليه.';
