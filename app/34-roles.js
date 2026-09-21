/* ============================================================
   الصلاحيات الدقيقة — أفعالٌ لا شاشات

   كانت الصلاحية «يرى هذه الشاشة أو لا يراها»، و«يعدّل أو لا يعدّل».
   وهذا خشنٌ لا يكفي: مَن يُسنِد مهمّةً ليس بالضرورة من يحذفها، ومن
   يعتمد دفعة اكسترا كوتا ليس من يُصدّر بيانات الحجّاج.

   فصارت الصلاحية **مصفوفة**: لكل **مورد** خمسة أفعال — اطّلاع،
   وإضافة، وتعديل، وحذف، واعتماد. وتُجمع الأفعال في **مجموعةٍ مسمّاة**
   تُمنح للصفة، فتُبنى مرّةً وتُمنح مرارًا.

   وقاعدةٌ حاكمة: **الإدارة العليا لا تُقيَّد**، وما عداها لا يملك فعلًا
   حتى يُمنحه صراحةً.
   ============================================================ */

/* الموارد: ما يُملَك فعلٌ عليه */
const RES = [
  { k:'tasks',   ar:'مهام الحجّ',       i:'i-kaaba',  g:'العمليات' },
  { k:'enrich',  ar:'إثراء التجربة',    i:'i-pin',    g:'العمليات' },
  { k:'pilgrim', ar:'بيانات الحجاج',    i:'i-idcard', g:'العمليات' },
  { k:'quota',   ar:'الاكسترا كوتا',    i:'i-idcard', g:'العمليات' },
  { k:'comply',  ar:'الامتثال',         i:'i-clip',   g:'العمليات' },
  { k:'guides',  ar:'أدلة التنفيذ',     i:'i-guide',  g:'العمليات' },
  { k:'signal',  ar:'البلاغات والحوادث', i:'i-warn',  g:'العمليات' },

  { k:'staff',   ar:'سجلّ الموظفين',    i:'i-idcard', g:'الموظفون' },
  { k:'form',    ar:'التشكيل',          i:'i-users',  g:'الموظفون' },
  { k:'shifts',  ar:'الشِفتات',         i:'i-swap',   g:'الموظفون' },
  { k:'acts',    ar:'الإجراءات',        i:'i-shield', g:'الموظفون' },
  { k:'warns',   ar:'الإنذارات',        i:'i-warn',   g:'الموظفون' },

  { k:'trans',   ar:'النقل والرحلات',   i:'i-bus',    g:'الحركة' },
  { k:'ctrs',    ar:'عقود النقل',       i:'i-doc',    g:'الحركة' },
  { k:'gmv',     ar:'المرشدون',         i:'i-users',  g:'الحركة' },

  { k:'tickets', ar:'التذاكر',          i:'i-ticket', g:'المتابعة' },
  { k:'reports', ar:'التقارير',         i:'i-flag',   g:'المتابعة' },
  { k:'support', ar:'طلبات الدعم',      i:'i-send',   g:'المتابعة' },

  { k:'orgs',    ar:'الجهات والفنادق',  i:'i-flag',   g:'الإدارة' },
  { k:'cast',    ar:'الإشعارات والبثّ', i:'i-bell',   g:'الإدارة' },
  { k:'perms',   ar:'الصلاحيات',        i:'i-shield', g:'الإدارة' },
  { k:'audit',   ar:'سجل النظام',       i:'i-hist',   g:'الإدارة' },
  { k:'cfg',     ar:'إعدادات الموقع',   i:'i-gear',   g:'الإدارة' }
];
const RES_G = [...new Set(RES.map(r => r.g))];

/* الأفعال الخمسة */
const ACT = [
  { k:'view',    ar:'اطّلاع',  i:'i-eye',    d:'يرى ولا يمسّ' },
  { k:'add',     ar:'إضافة',   i:'i-plus',   d:'يُنشئ جديدًا' },
  { k:'edit',    ar:'تعديل',   i:'i-edit',   d:'يغيّر القائم' },
  { k:'del',     ar:'حذف',     i:'i-x',      d:'يُزيل — وهو أخطرها' },
  { k:'approve', ar:'اعتماد',  i:'i-checkc', d:'يُقرّ ما يُلزم الميدان' }
];

/* ---------- مجموعات جاهزة تُبنى مرّةً وتُمنح مرارًا ---------- */
function seedRoles(st) {
  const all = (acts) => RES.reduce((a, r) => { a[r.k] = acts.slice(); return a; }, {});
  const only = (keys, acts) => keys.reduce((a, k) => { a[k] = acts.slice(); return a; }, {});
  st.roleSets = [
    { id:'RS1', name:'قراءة فقط', d:'يرى كلّ شيء ولا يمسّ شيئًا', sys:true,
      m:all(['view']) },
    { id:'RS2', name:'مشغّل غرفة', d:'يُسنِد ويؤشّر ويردّ — ولا يحذف ولا يعتمد', sys:true,
      m:Object.assign(all(['view']),
        only(['tasks','comply','signal','tickets','reports','support','warns','acts'],
          ['view','add','edit'])) },
    { id:'RS3', name:'مشرف عمليات', d:'يعتمد ما يُلزم الميدان ويعدّل التشكيل', sys:true,
      m:Object.assign(all(['view']),
        only(['tasks','comply','signal','tickets','reports','support','form','warns','acts',
              'quota','trans','ctrs'], ['view','add','edit','approve'])) },
    { id:'RS4', name:'بيانات الحجّاج', d:'يُدخل ويُصدِّر ويعتمد الاكسترا كوتا — لا غير', sys:true,
      m:Object.assign(only(['pilgrim','quota'], ['view','add','edit','approve']),
        only(['tasks'], ['view'])) },
    { id:'RS5', name:'إدارة الحركة', d:'النقل والعقود والمرشدون وحدها', sys:true,
      m:Object.assign(only(['trans','ctrs','gmv'], ['view','add','edit','del','approve']),
        only(['tasks','staff'], ['view'])) },
    { id:'RS6', name:'الجزاءات', d:'الإنذارات والإجراءات — إضافةً واعتمادًا', sys:true,
      m:Object.assign(only(['warns','acts'], ['view','add','edit','approve']),
        only(['staff','tasks'], ['view'])) }
  ];
  /* الصفات تُربط بمجموعة — والإدارة العليا لا تُقيَّد */
  st.roleOf = { admin:null, mission:'RS1', company:'RS1', sup:'RS2',
    mashaer:'RS2', food:'RS2', trans:'RS5', centers:'RS1', medina:'RS1' };
}

/* ---------- الفحص ---------- */
const roleSetOf = permK => (S.roleSets || []).find(x => x.id === (S.roleOf || {})[permK]) || null;
/* القاعدة: الإدارة العليا تملك كل شيء، وما عداها لا يملك حتى يُمنح */
function can(res, act) {
  const p = curPerm();
  if (p.scope === 'all') return true;
  const rs = roleSetOf(p.k);
  if (!rs) return act === 'view';
  const a = (rs.m || {})[res];
  return !!(a && a.indexOf(act) >= 0);
}
const canAdd = r => can(r, 'add');
const canEdit2 = r => can(r, 'edit');
const canDel = r => can(r, 'del');
const canApprove = r => can(r, 'approve');
/* عدد الأفعال الممنوحة — يُعرض في البطاقة */
const setCount = rs => Object.keys(rs.m || {}).reduce((a, k) => a + rs.m[k].length, 0);

/* ============================================================
   الشاشة — تُضاف إلى «الصلاحيات» تبويبًا ثانيًا
   ============================================================ */
function screenRoles() {
  const seg = S.tab.pm || 'sets';
  return '<div class="card">' +
      head('الصلاحيات', 'مجموعاتٌ مسمّاة من الأفعال، تُبنى مرّةً وتُمنح للصفات',
        seg === 'sets' ? '<button class="btn p sm" data-a="rsnew">' + icon('i-plus','s16') +
          'مجموعة جديدة</button>' : '', 'i-shield') +
      '<div class="tools">' + segmented('pm', [
        ['sets','مجموعات الصلاحيات · ' + AR((V.roleSets || []).length)],
        ['grant','منح الصفات'],
        ['screens','الشاشات']
      ], seg) + '</div>' +
    '</div>' +
    (seg === 'grant' ? rolesGrant() : seg === 'screens' ? screenPerms() : rolesSets());
}

function rolesSets() {
  const sets = V.roleSets || [];
  return '<div class="card">' +
    head('المجموعات', 'كل مجموعةٍ مصفوفةُ أفعالٍ على الموارد',
      pill(AR(sets.length), 'gold'), 'i-list') +
    '<div class="gcards">' + sets.map(rs => {
      const used = Object.keys(S.roleOf || {}).filter(k => S.roleOf[k] === rs.id);
      const res = Object.keys(rs.m || {}).filter(k => (rs.m[k] || []).length);
      const danger = res.filter(k => (rs.m[k] || []).indexOf('del') >= 0).length;
      return '<div class="gcard">' +
        '<span class="gtop" style="background:' + (danger ? 'var(--red)' : 'var(--g3)') + '"></span>' +
        '<div class="fl" style="margin-bottom:11px">' +
          '<span class="ico" style="color:var(--gold2)">' + icon('i-shield','s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(rs.name) + '</b>' +
          '<span>' + E(rs.d) + '</span></span>' +
          (rs.sys ? pill('جاهزة','grey') : pill('مخصّصة','gold')) + '</div>' +
        '<div class="mrow">' +
          '<span class="mchip">' + icon('i-list','s14') + AR(res.length) + ' موردًا</span>' +
          '<span class="mchip">' + icon('i-checkc','s14') + AR(setCount(rs)) + ' فعلًا</span>' +
          (danger ? '<span class="mchip" style="color:var(--red)">' + icon('i-x','s14') +
            AR(danger) + ' حذف</span>' : '') +
          '<span class="mchip">' + icon('i-users','s14') + AR(used.length) + ' صفة</span>' +
        '</div>' +
        '<div class="pfoot">' +
          '<span class="ok">' + (used.length
            ? used.map(k => permOf(k).ar).join('، ') : 'غير ممنوحة لأحد') + '</span>' +
          '<span class="fl" style="gap:7px">' +
            '<button class="btn l sm" data-a="rsedit" data-id="' + rs.id + '">تعديل</button>' +
            '<button class="btn l sm" data-a="rsclone" data-id="' + rs.id + '">نسخ</button>' +
            (rs.sys ? '' : '<button class="btn l sm" data-a="rsdel" data-id="' + rs.id + '">حذف</button>') +
          '</span></div></div>';
    }).join('') + '</div></div>';
}

function rolesGrant() {
  return '<div class="card">' +
    head('منح الصفات', 'لكل صفةٍ مجموعةٌ واحدة — والإدارة العليا لا تُقيَّد',
      '', 'i-users') +
    '<div class="plist">' + PERMS.map(p => {
      const rs = roleSetOf(p.k);
      const isAdmin = p.scope === 'all';
      return '<div class="prow">' +
        '<span class="ico" style="color:var(--gold2)">' + icon(p.i, 's18') + '</span>' +
        '<span class="nm" style="flex:1"><b>' + E(p.ar) + '</b>' +
        '<span>' + E(p.d) + '</span></span>' +
        (isAdmin ? pill('غير مقيَّدة', 'live')
          : '<label class="fsel' + (rs ? ' on' : '') + '"><span>المجموعة</span>' +
            '<select data-q2="rg_' + p.k + '">' +
              '<option value="">بلا مجموعة — اطّلاع فقط</option>' +
              (V.roleSets || []).map(x => '<option value="' + x.id + '"' +
                (rs && rs.id === x.id ? ' selected' : '') + '>' + E(x.name) + '</option>').join('') +
            '</select>' + icon('i-fwd','s14') + '</label>') +
        (rs ? pill(AR(setCount(rs)) + ' فعلًا', 'gold') : '') +
        '</div>';
    }).join('') + '</div>' +
    '<div class="quote" style="margin-top:14px">من لا مجموعة له يرى ما مُنح من شاشات ' +
      'ولا يملك فعلًا — لا إضافةً ولا تعديلًا ولا حذفًا.</div>' +
  '</div>';
}

/* ---------- محرّر المجموعة: مصفوفةٌ تُنقر ---------- */
function roleEdit(id) {
  const rs = (S.roleSets || []).find(x => x.id === id);
  if (!rs) return;
  const cell = (r, a) => {
    const on = ((rs.m || {})[r.k] || []).indexOf(a.k) >= 0;
    return '<button class="mxc' + (on ? ' on' : '') + (a.k === 'del' && on ? ' danger' : '') +
      '" data-a="rstog" data-id="' + rs.id + '" data-k="' + r.k + '" data-v="' + a.k + '" ' +
      'aria-label="' + E(r.ar + ' — ' + a.ar) + '" title="' + E(r.ar + ' — ' + a.ar) + '">' +
      (on ? icon('i-check','s13') : '') + '</button>';
  };
  S.drawer = { title:rs.name, sub:rs.d + (rs.sys ? ' · مجموعة جاهزة' : ''),
    icon:'i-shield', paper:true, expand:id, body:

    '<div class="rpbar">' +
      '<button class="btn l sm" data-a="rsall" data-id="' + rs.id + '" data-v="view">' +
        icon('i-eye','s14') + 'اطّلاع على الكلّ</button>' +
      '<button class="btn l sm" data-a="rsall" data-id="' + rs.id + '" data-v="none">' +
        icon('i-x','s14') + 'تفريغ الكلّ</button>' +
      '<span class="fsp"></span>' +
      '<span class="tiny faint">' + AR(setCount(rs)) + ' فعلًا ممنوحًا</span>' +
      '<button class="btn l sm" data-a="go" data-n="perms">' + icon('i-back','s14') + 'رجوع</button>' +
    '</div>' +

    '<div class="card">' +
      head('اسم المجموعة ووصفها', 'الاسم هو ما يُمنح — فليكن مفهومًا', '', 'i-edit') +
      '<label class="fl2">الاسم</label>' +
      '<input class="fld" id="q-rs_n" data-q="rs_n" value="' + E(rs.name) + '">' +
      '<label class="fl2">الوصف</label>' +
      '<input class="fld" id="q-rs_d" data-q="rs_d" value="' + E(rs.d) + '">' +
      '<button class="btn l sm" style="width:100%;margin-top:11px" data-a="rsname" ' +
        'data-id="' + rs.id + '">' + icon('i-check','s14') + 'حفظ الاسم والوصف</button>' +
    '</div>' +

    '<div class="card">' +
      head('المصفوفة', 'صفٌّ لكل مورد، وعمودٌ لكل فعل — انقر الخانة', '', 'i-list') +
      '<div class="mxlegend">' + ACT.map(a =>
        '<span>' + icon(a.i,'s13') + '<b>' + E(a.ar) + '</b>' + E(a.d) + '</span>').join('') + '</div>' +
      '<div class="xtwrap"><div class="mx">' +
        '<div class="mxhead"><span class="mxn">المورد</span>' +
          ACT.map(a => '<span>' + E(a.ar) + '</span>').join('') +
          '<span class="mxn2">الكلّ</span></div>' +
        RES_G.map(g => '<div class="mxg">' + E(g) + '</div>' +
          RES.filter(r => r.g === g).map(r =>
            '<div class="mxr"><span class="mxn">' + icon(r.i,'s14') + E(r.ar) + '</span>' +
            ACT.map(a => cell(r, a)).join('') +
            '<button class="mxall" data-a="rsrow" data-id="' + rs.id + '" data-k="' + r.k + '" ' +
              'aria-label="كل الأفعال">' + icon('i-checkc','s13') + '</button></div>').join('')
        ).join('') +
      '</div></div>' +
    '</div>' };
  renderDrawer();
}

/* ============================================================
   ربط الصلاحية بالفعل — وإلّا كانت المصفوفة زينةً لا حُكمًا

   كل فعلٍ في المُوجِّه يُنسب إلى مورده وإلى نوعه. وما لم يُذكر هنا
   فهو اطّلاعٌ أو تنقّل — يمرّ بلا سؤال.
   ============================================================ */
const GATE = (function () {
  const m = {};
  const put = (res, act, list) => list.forEach(a => { m[a] = [res, act]; });

  put('tasks','add',    ['txreqnew','txfilenew','txfilesave']);
  put('tasks','del',    ['txreqdel','txfiledel']);
  put('tasks','edit',   ['txassign','txunassign','txpull','txaddres','txaddresdo','txattend','txswap',
                         'txstart','txnotesave','txsub','txreq','txreqph','txtpl','txtplpick',
                         'tguide','tguideset','tguideclr','seatres','txreqneed']);
  put('tasks','approve',['txclose','txclosedo','txreopen']);

  put('enrich','edit',  ['xassign']);

  put('pilgrim','edit', ['phnsave','pcstep','phealth','phnote']);
  put('quota','add',    ['qtnew','qtsave','qprow']);
  put('quota','approve',['qtok','qtno']);

  put('comply','add',   ['fnew','schsave']);
  put('comply','edit',  ['fedit','fbscope','fbadd','fbup','fbdel','fbsave','fassign','fatarget',
                         'fsched','schoteb','schall','schnone','schslot','schprio','schmode',
                         'schwho','careassign','caswap','caprio','funfo']);
  put('comply','approve',['fapproveall']);

  put('guides','add',   ['gdnew','gbadd','gbmadd']);
  put('guides','edit',  ['gdedit','gbscope','gbup','gbsave']);
  put('guides','del',   ['gbdel','gbmdel']);
  put('guides','approve',['gbsavepub','gdpub','gdunpub']);

  put('signal','add',   ['signew','sgsave']);
  put('signal','edit',  ['sgcat','sgkt','sgsrc','sgch','sgcls','sgrisk','sigver','sigfix',
                         'sigcls','sigrisk','sigrule','sigown','sigfollow','sigreply']);
  put('signal','approve',['sigconfirm','sigclose','sigreopen']);

  put('staff','add',    ['gnew']);
  put('staff','edit',   ['bsave','bspec','borg','bhotel','bsup','blead','bclrlead','bmem',
                         'supassign','supswap','suprm','gleadswap','ghotel','ghotelset']);
  put('staff','del',    ['bdel']);

  put('form','edit',    ['seatdrop','soutr','soutdo','mseatin','mseatout','gswap','swapdo']);
  put('form','approve', ['gstate']);

  put('acts','edit',    ['acwhy','acsms','acpen','acperf']);
  put('acts','approve', ['acclose']);

  put('warns','add',    ['wsave']);
  put('warns','edit',   ['wlvl','wstate','wnote','wsms','wkind','wnlvl']);

  put('trans','add',    ['trnew']);
  put('trans','edit',   ['trmove','trdone','trbus','trbusset','trider','trrmv']);

  put('ctrs','add',     ['ctrnew','ctrsave','ccar','cdaif']);
  put('ctrs','edit',    ['ctrdaif','ctrdfsave','ctrstate']);

  put('tickets','edit', ['tkassign','tkcat','tkpri','tkreply']);
  put('tickets','approve',['tkclose']);
  put('reports','edit', ['rpassign','rpreply']);
  put('reports','approve',['rpclose']);
  put('support','edit', ['roomapply']);
  put('support','approve',['swok','swno','spok','spno']);

  put('orgs','add',     ['orgnew','orgsave','hotnew','hotsave']);
  put('orgs','edit',    ['otype','hcity']);

  put('cast','add',     ['castsend']);
  put('cast','del',     ['castclear']);

  put('perms','add',    ['rsnew','rsclone']);
  put('perms','edit',   ['rstog','rsrow','rsall','rsname','pgtog','pgall','pgdef','pgnone']);
  put('perms','del',    ['rsdel']);

  /* لوحة المستخدم وساعته تفضيلُ عرضٍ لا تغييرَ بيانات — فلا تُحجب */
  put('cfg','edit',     ['cfgtog','cfgsave']);
  put('cfg','del',      ['reset']);
  return m;
})();

/* رسالةٌ تقول ما نقص بالضبط — لا «ليست لديك صلاحية» */
function gateBlock(a) {
  const pair = GATE[a];
  if (!pair) return null;                        /* لم يُنسب: اطّلاعٌ أو تنقّل */
  if (can(pair[0], pair[1])) return null;
  const r = RES.find(x => x.k === pair[0]) || { ar: pair[0] };
  const act = ACT.find(x => x.k === pair[1]) || { ar: pair[1] };
  const rs = roleSetOf(curPerm().k);
  return act.ar + ' في «' + r.ar + '» غير ممنوحٍ لـ' +
    (rs ? 'مجموعة «' + rs.name + '»' : 'صفتك');
}
