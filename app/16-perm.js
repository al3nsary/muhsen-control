/* ============================================================
   الصلاحيات وأمن مستوى الصفّ (RLS)
   ─────────────────────────────────────────────────────────────
   قاعدتان تحكمان كل شيء:
     ١) لا يرى أحدٌ شاشةً لم تُسنَد لصفته — والافتراض: لا شيء.
     ٢) لا يُعدّل إلا من مُنح التعديل — والافتراض: الإدارة العليا وحدها.
   والنطاق يُطبَّق على الصفوف نفسها لا على الشاشات فقط:
   الشركة ترى محسنيها وحجاجها ومهامها، والمحسن يرى نفسه.
   ============================================================ */

const PERMS = [
  { k:'admin',   ar:'إدارة عليا',      i:'i-shield', scope:'all',   edit:true,
    d:'ترى كل شيء وتعدّل كل شيء — وهي وحدها كذلك' },
  { k:'mission', ar:'بعثة',            i:'i-flag',   scope:'org',   edit:false,
    d:'ترى محسنيها وحجاجها ومهامها — اطّلاع بلا تعديل' },
  { k:'company', ar:'شركة',            i:'i-flag',   scope:'org',   edit:false,
    d:'ترى محسنيها وحجاجها ومهامها — اطّلاع بلا تعديل' },
  { k:'sup',     ar:'مشرف',            i:'i-key',    scope:'hotel', edit:false,
    d:'يرى كل من تحته في الفندق' },
  { k:'leader',  ar:'ليدر',            i:'i-star',   scope:'team',  edit:false,
    d:'يرى فريقه ومهامه' },
  { k:'muh_mk',  ar:'محسن مكة',        i:'i-user',   scope:'self',  edit:false,
    d:'يرى بياناته ومهامه وحدها' },
  { k:'muh_md',  ar:'محسن المدينة',    i:'i-user',   scope:'self',  edit:false,
    d:'يرى بياناته ومهامه وحدها' },
  { k:'mashaer', ar:'مشاعر',           i:'i-tent',   scope:'domain', edit:false, prov:true,
    d:'مهام منى وعرفة والجمرات وحوادث التفويج' },
  { k:'food',    ar:'إعاشة',           i:'i-food',   scope:'domain', edit:false, prov:true,
    d:'تذاكر الإعاشة وحوادثها ونماذج امتثالها' },
  { k:'trans',   ar:'نقل',             i:'i-bus',    scope:'domain', edit:false, prov:true,
    d:'المطار والمغادرة والجولات ورحلات المزارات' },
  { k:'centers', ar:'مراكز',           i:'i-target', scope:'domain', edit:false, prov:true,
    d:'كل الحوادث والتذاكر والتقارير — بلا بيانات أشخاص' },
  { k:'medina',  ar:'مشرفو المدينة',   i:'i-pin',    scope:'domain', edit:false, prov:true,
    d:'المدينة المنوّرة — لا بيانات لها في هذه النسخة' }
];
const permOf = k => PERMS.find(p => p.k === k) || PERMS[0];
const SCOPE_AR = { all:'كل النظام', org:'جهته وحدها', hotel:'فندقه ومن فيه',
  team:'فريقه ومهامه', self:'بياناته وحدها', domain:'اختصاصه عبر الجهات',
  none:'لم يُحدَّد بعد' };

/* الصفة الفاعلة الآن، ومن تُمثِّله */
const curPerm = () => permOf(S.actor && S.actor.perm);
const canEdit = () => !!curPerm().edit;
/* الشاشات المسموحة لهذه الصفة — والافتراض لا شيء */
function allowed() {
  const p = curPerm();
  if (p.scope === 'all') return navItems().map(x => x.k);
  const g = S.grants && S.grants[p.k];
  return g ? g : (DEFAULT_GRANTS[p.k] || []).slice();
}
/* هل خُصِّصت هذه الصفة أم ما زالت على افتراضها؟ */
const isCustom = k => !!(S.grants && S.grants[k]);
const grantsOf = k => (S.grants && S.grants[k]) || (DEFAULT_GRANTS[k] || []).slice();
const maySee = k => allowed().indexOf(k) >= 0;


/* ============================================================
   الصلاحيات الافتراضية — لكل صفة ما يخدم عملها لا أكثر
   القاعدة في اختيار الشاشات:
     · يرى ما يخصّ عمله.
     · لا يرى أدوات قرار الكنترول (الدعم · الشِفتات · الاحتياط · التشكيل).
     · لا يرى إدارة النظام (الصلاحيات · الإعدادات · السجل · البثّ).
   ============================================================ */
const DEFAULT_GRANTS = {
  admin:   null,                     /* لا تُقيَّد أصلًا */

  /* الجهات: بياناتها التشغيلية كاملة — اطّلاعًا */
  mission: ['ops','tasks','timeline','staff','teams','pilgrims','quality','tickets','reports'],
  company: ['ops','tasks','timeline','staff','teams','pilgrims','quality','tickets','reports'],

  /* المشرف: فندقه ومن فيه — ومعه ما يُرفع عن السكن */
  sup:     ['ops','tasks','timeline','staff','teams','pilgrims','tickets','reports',
            'incidents','quality','guides'],

  /* الليدر: فريقه ومهامه — ولا يرى الاحتياط ولا يختار منه */
  leader:  ['ops','tasks','timeline','staff','teams','pilgrims','tickets','reports',
            'incidents','guides','shifts'],

  /* المحسن: نفسه ومهامه ودليل تنفيذها */
  muh_mk:  ['tasks','staff','guides'],
  muh_md:  ['tasks','staff','guides'],

  /* الخمس المؤجَّلة: نطاقها وظيفي مؤقّت حتى تُوصَف */
  mashaer: ['ops','tasks','timeline','incidents','guides'],
  food:    ['tasks','tickets','incidents','quality','guides'],
  trans:   ['ops','tasks','timeline','tickets','incidents','guides'],
  centers: ['ops','incidents','tickets','reports','timeline'],
  medina:  ['ops','tasks','staff','teams','pilgrims','incidents']
};

/* ============================================================
   النطاق الوظيفي — للصفات التي تقطع الجهات ولا تتبع واحدة
   مؤقّت حتى يصف صاحب النظام حدودها.
   ============================================================ */
const DOMAIN = {
  mashaer: { ar:'المشاعر',  kinds:['mina','arafah','jamarat'], inc:['crowd','sec'],
             tkt:['تنظيم'],  form:['مشاعر','تفويج'], enrich:false },
  food:    { ar:'الإعاشة',  kinds:[],                          inc:['food'],
             tkt:['إعاشة'],  form:['إعاشة'],          enrich:false },
  trans:   { ar:'النقل',    kinds:['airport','checkout','tour'], inc:['trans'],
             tkt:['نقل','تنظيم'], form:['نقل'],       enrich:true },
  centers: { ar:'المراكز',  kinds:[], all:true,                inc:null,
             tkt:null,      form:[],                  enrich:false },
  medina:  { ar:'المدينة',  kinds:[], city:'المدينة المنوّرة', inc:[],
             tkt:[],        form:[],                  enrich:false }
};
const domainOf = k => DOMAIN[k];

/* ============================================================
   بناء الرؤية V — نسخة مُصفّاة من S يقرأ منها كل عرض
   الإدارة العليا تقرأ S نفسه: صفر كلفة وصفر اختلاف.
   ============================================================ */
let V = null;

function buildView() {
  const p = curPerm(), a = S.actor || {};
  if (p.scope === 'all') { V = S; return; }

  /* من يدخل في النطاق: مجموعات وأشخاص وجهات */
  let groups = [], userIds = [], kts = [], orgIds = [];

  if (p.scope === 'org' && a.orgId) {
    const o = orgById(a.orgId) || {};
    orgIds = [a.orgId]; kts = [o.kt];
    groups = S.groups.filter(g => g.orgId === a.orgId);
  } else if (p.scope === 'hotel' && a.hotelId) {
    groups = S.groups.filter(g => g.hotelId === a.hotelId);
    orgIds = [...new Set(groups.map(g => g.orgId))];
    kts = orgIds.map(id => (orgById(id) || {}).kt).filter(Boolean);
  } else if (p.scope === 'team' && a.leaderId) {
    groups = S.groups.filter(g => g.leaderId === a.leaderId);
    orgIds = [...new Set(groups.map(g => g.orgId))];
    kts = orgIds.map(id => (orgById(id) || {}).kt).filter(Boolean);
  } else if (p.scope === 'domain') {
    buildDomainView(p);
    return;
  } else if (p.scope === 'self' && a.userId) {
    const u = userById(a.userId);
    const g = u && u.groupId ? groupById(u.groupId) : null;
    groups = g ? [g] : [];
    kts = u ? [u.kt] : [];
  }

  groups.forEach(g => { userIds.push(g.leaderId); g.members.forEach(m => userIds.push(m.id)); });
  if (p.scope === 'hotel' && a.hotelId)
    supervisors().filter(u => u.hotelId === a.hotelId).forEach(u => userIds.push(u.id));
  if (p.scope === 'team' && a.leaderId) userIds.push(a.leaderId);
  if (p.scope === 'self') userIds = a.userId ? [a.userId] : [];
  userIds = [...new Set(userIds.filter(Boolean))];

  const leaderIds = groups.map(g => g.leaderId);
  const has = (arr, v) => arr.indexOf(v) >= 0;
  const mine = u => has(userIds, u.id);
  /* المحسن يرى مهامه هو، ومن فوقه يرى مهام فريقه كلّها */
  const taskMine = t => p.scope === 'self'
    ? (t.assigned || []).indexOf(a.userId) >= 0 || t.leaderId === a.userId
    : has(leaderIds, t.leaderId);

  const pil = {};
  kts.forEach(k => { if (S.pilgrims[k]) pil[k] = S.pilgrims[k]; });

  V = Object.create(S);          /* ما لا يُصفّى يُقرأ من الأصل */
  V.users    = S.users.filter(mine);
  V.groups   = groups;
  V.orgs     = orgIds.length ? S.orgs.filter(o => has(orgIds, o.id)) : [];
  V.tasks    = S.tasks.filter(taskMine);
  V.pilgrims = p.scope === 'self' ? {} : pil;
  V.tickets  = S.tickets.filter(k => has(kts, k.kt));
  V.reports  = S.reports.filter(r => has(kts, r.kt));
  V.support  = S.support.filter(s => has(leaderIds, (taskById(s.taskId) || {}).leaderId));
  V.nusuk    = S.nusuk.filter(c => p.scope === 'self'
    ? c.assignedTo === a.userId : has(kts, c.kt));
  V.enrich   = S.enrich.filter(x => p.scope === 'self'
    ? x.muhsenId === a.userId : has(kts, x.kt));
  V.subs     = S.subs.filter(b => has(userIds, b.by));
  V.assigns  = S.assigns.filter(x => has(userIds, x.to));
  V.swaps    = S.swaps.filter(w => has(userIds, w.from) || has(userIds, w.to));
  V.feed     = S.feed.filter(f => !f.kt || has(kts, f.kt));
  V.log      = p.scope === 'self' ? [] : S.log;
  V.forms    = S.forms;
  V.guides   = S.guides;
  V.casts    = S.casts;
}

/* رؤية الاختصاص: تقطع الجهات ولا تتبع واحدة —
   ترى نوع العمل الذي تختصّ به، بلا بيانات أشخاص. */
function buildDomainView(p) {
  const d = domainOf(p.k) || {};
  const inArr = (arr, v) => !arr || arr.indexOf(v) >= 0;
  V = Object.create(S);
  V.tasks    = d.all ? S.tasks : S.tasks.filter(t => (d.kinds || []).indexOf(t.kind) >= 0);
  V.enrich   = d.enrich ? S.enrich : [];
  V.incidents = null;
  V.feed     = d.inc === null ? S.feed : S.feed.filter(f => (d.inc || []).indexOf(f.cat) >= 0);
  V.tickets  = d.tkt === null ? S.tickets : S.tickets.filter(k => (d.tkt || []).indexOf(k.cat) >= 0);
  V.reports  = d.all ? S.reports : [];
  V.forms    = S.forms.filter(f => (d.form || []).indexOf(f.scope) >= 0);
  V.subs     = S.subs.filter(b => V.forms.some(f => f.id === b.formId));
  V.nusuk    = [];
  /* لا بيانات أشخاص لهذه الصفات */
  V.users    = [];
  V.groups   = [];
  V.orgs     = [];
  V.pilgrims = {};
  V.support  = [];
  V.swaps    = [];
  V.assigns  = [];
  V.log      = [];
}

/* ============================================================
   شاشة إدارة الصلاحيات
   ============================================================ */
function screenPerms() {
  const sel = S.tab.pk || 'mission';
  const p = permOf(sel);
  const items = navItems().filter(x => x.k !== 'perms');
  const gr = grantsOf(sel);

  return '<div class="grid g4">' +
      stat({ label:'الصفات', n:PERMS.length, ic:'i-shield',
        sub:'واحدة تُعدّل، والبقية تطّلع', series:[4,6,8,9,10,11,12,PERMS.length] }) +
      stat({ label:'صفات مُسنَد لها', n:PERMS.filter(x => x.scope === 'all' ||
        grantsOf(x.k).length).length, ic:'i-checkc', cls:'up',
        sub:'ترى ما يخدم عملها', series:[1,3,5,7,9,10,11,12] }) +
      stat({ label:'صفات خُصِّصت', n:PERMS.filter(x => isCustom(x.k)).length, ic:'i-clip',
        sub:'عُدِّلت عن افتراضها', series:[0,0,1,1,2,2,3,3] }) +
      stat({ label:'الشاشات', n:items.length, ic:'i-list',
        sub:'كل واحدة تُمنح أو تُمنع', series:[8,10,12,14,15,16,17,items.length] }) +
    '</div>' +

    '<div class="grid g23">' +
      '<div class="card">' +
        head('الصفات', 'اختر صفةً لتضبط ما تراه', '', 'i-shield') +
        '<div class="plist">' + PERMS.map(x => {
          const n = x.scope === 'all' ? items.length : grantsOf(x.k).length;
          return '<button class="prow pick' + (x.k === sel ? ' on' : '') + '" ' +
            'data-a="seg" data-k="pk" data-v="' + x.k + '">' +
            '<span class="ico" style="color:' + (x.edit ? 'var(--gold2)' : 'var(--dim)') + '">' +
              icon(x.i, 's18') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(x.ar) + '</b>' +
            '<span>' + E(SCOPE_AR[x.scope]) + '</span></span>' +
            (x.prov ? pill('مؤقّت', 'wait') : x.edit ? pill('تعديل', 'gold') : pill('اطّلاع', 'grey')) +
            pill(AR(n) + ' شاشة', n ? 'live' : 'no') + '</button>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="card gold">' +
        head(p.ar + (p.prov ? ' — نطاق مؤقّت' : ''), p.d,
          p.edit ? pill('كل الشاشات — لا تُقيَّد', 'gold')
          : pill(AR(gr.length) + ' من ' + AR(items.length), gr.length ? 'live' : 'no'), p.i) +
        '<div class="meta">' +
          '<div><span class="k">النطاق</span><b>' + E(SCOPE_AR[p.scope]) + '</b></div>' +
          '<div><span class="k">التعديل</span><b>' + (p.edit ? 'نعم' : 'لا') + '</b></div>' +
          '<div><span class="k">الشاشات</span><b class="num">' +
            AR(p.edit ? items.length : gr.length) + '</b></div>' +
        '</div>' +
        (p.prov ? '<div class="quote" style="margin-top:14px">' +
          'هذا النطاق <b>مؤقّت</b>: بُني على اختصاص الصفة (' + E((domainOf(p.k) || {}).ar || '') +
          ') حتى تُوصَف حدودها. تراه في الشاشات ولا ترى بيانات أشخاص.</div>' : '') +
        (p.edit
          ? '<div class="quote" style="margin-top:14px">الإدارة العليا لا تُقيَّد — ' +
            'ترى كل شاشة وتملك كل إجراء. وهي الوحيدة كذلك.</div>'
          : '<div class="fl" style="gap:9px;margin:14px 0 12px;flex-wrap:wrap">' +
              '<button class="btn l sm" data-a="pgall" data-v="' + sel + '">منح الكل</button>' +
              '<button class="btn l sm" data-a="pgnone" data-v="' + sel + '">منع الكل</button>' +
              (isCustom(sel) ? '<button class="btn p sm" data-a="pgdef" data-v="' + sel +
                '">استعادة الافتراضي</button>' : '<span class="mchip">' +
                icon('i-checkc','s14') + 'على الافتراضي</span>') +
            '</div>' +
            '<div class="permgrid">' + items.map(x => {
              const on = gr.indexOf(x.k) >= 0;
              return '<button class="pchk' + (on ? ' on' : '') + '" data-a="pgtog" ' +
                'data-k="' + sel + '" data-v="' + x.k + '">' +
                '<span class="box">' + (on ? icon('i-checkc','s14') : '') + '</span>' +
                icon(x.i, 's16') + '<b>' + E(x.l) + '</b></button>';
            }).join('') + '</div>') +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      head('ما يراه صاحب كل صفة', 'النطاق يُطبَّق على الصفوف لا على الشاشات وحدها', '', 'i-eye') +
      '<div class="tbl"><div class="th" style="grid-template-columns:1fr 1.2fr .8fr 1.6fr">' +
        ['الصفة','النطاق','التعديل','ما يظهر له'].map(t =>
          '<button>' + E(t) + '</button>').join('') + '</div>' +
      '<div class="tb">' + PERMS.map(x =>
        '<div class="tr" style="grid-template-columns:1fr 1.2fr .8fr 1.6fr">' +
          '<span class="fl"><span class="ico sm" style="color:var(--gold2)">' +
            icon(x.i,'s14') + '</span><b>' + E(x.ar) + '</b></span>' +
          '<span>' + E(SCOPE_AR[x.scope]) + '</span>' +
          '<span>' + (x.edit ? pill('كامل','gold') : pill('اطّلاع','grey')) + '</span>' +
          '<span class="tiny">' + E(x.d) + '</span>' +
        '</div>').join('') + '</div></div>' +
    '</div>';
}

/* ============================================================
   شاشة «لا صلاحية» — تُعرض بدل الفراغ
   ============================================================ */
function screenDenied() {
  const p = curPerm();
  return '<div class="card gold">' +
    head('لا صلاحية بعد', 'صفتك: ' + p.ar, pill(SCOPE_AR[p.scope], 'grey'), 'i-shield') +
    '<div class="empty" style="padding:44px 20px">' + icon('i-shield','s26') +
      '<b>لم تُسنَد لهذه الصفة أي شاشة</b>' +
      '<div class="tiny" style="margin-top:8px;line-height:2">' +
      'كل صفة لها صلاحيات افتراضية تخدم عملها — وهذه مُنعت عنها كلّها.<br>' +
      'تُعاد من «إدارة الصلاحيات» بزرّ «استعادة الافتراضي».</div>' +
      '<button class="btn l" style="margin-top:18px" data-a="logout">' +
        icon('i-logout','s16') + 'الخروج وتبديل الصفة</button>' +
    '</div></div>';
}
