/* ============================================================
   الإشعارات — ثلاث وجهات، ولكلٍّ فئاتها
   تطبيق المحسن · تطبيق الحاجّ · الكنترول
   ============================================================ */

const CAST_DEST = {
  muhsen: { ar:'تطبيق المحسن', i:'i-user',   c:'#0B7A4B',
            d:'يصل الميدان في جهازه — ويوقظه إن كان مغلقًا' },
  hajj:   { ar:'تطبيق الحاجّ',  i:'i-users',  c:'#6B4E9E',
            d:'يصل الحاجّ بلغته — ويظهر في إشعاراته' },
  ctl:    { ar:'الكنترول',      i:'i-target', c:'#1B6E9C',
            d:'داخل غرفة العمليات لمن يحمل الصفة' }
};

/* فئات كل وجهة — تُبنى من البيانات الحيّة لا من قائمة ثابتة */
function castAud(dest) {
  if (dest === 'muhsen') return [
    ['all',      'كل المحسنين',      S.users.filter(u => u.role === 'muhsen' && !u.reserve).length],
    ['leaders',  'الليدرز',          leaders().length],
    ['sups',     'المشرفون',         supervisors().length],
    ['reserve',  'الفريق الاحتياطي', reserveTeam().length]
  ].concat(S.orgs.map(o => ['kt:' + o.kt, o.kt + ' · ' + o.ar,
      S.users.filter(u => u.kt === o.kt && u.role === 'muhsen').length]))
   .concat(SPECS.map(s => ['sp:' + s, 'تخصّص ' + s,
      S.users.filter(u => u.specialty === s && u.role === 'muhsen').length]));

  if (dest === 'hajj') return [
    ['all', 'كل الحجاج', allPilgrimRows().length],
    ['arrived',  'من وصلوا',      allPilgrimRows().filter(p => p.state === 'وصل').length],
    ['pending',  'من لم يصلوا',   allPilgrimRows().filter(p => p.state === 'لم يصل').length],
    ['care',     'حالات الرعاية', allPilgrimRows().filter(p => p.flag).length]
  ].concat(S.orgs.map(o => ['kt:' + o.kt, o.kt + ' · ' + o.ar,
      (S.pilgrims[o.kt] || []).length]))
   .concat(HOTELS.map(h => ['ht:' + h.id, 'نُزلاء ' + h.ar,
      S.groups.filter(g => g.hotelId === h.id).reduce((a, g) =>
        a + ((S.pilgrims[(orgById(g.orgId) || {}).kt] || []).length), 0)]));

  return [['all', 'كل مستخدمي الكنترول', PERMS.length]]
    .concat(PERMS.map(p => ['pm:' + p.k, 'صفة ' + p.ar, 1]));
}
const audAr = (dest, k) => (castAud(dest).find(x => x[0] === k) || [0, k])[1];
const audN  = (dest, k) => (castAud(dest).find(x => x[0] === k) || [0, 0, 0])[2] || 0;

function screenBroadcast() {
  const dest = S.tab.cdest || 'muhsen';
  const aud  = S.tab['caud_' + dest] || 'all';
  const kind = S.tab.ck || 'عادي';
  const cs = V.casts.slice().sort((a, b) => b.at - a.at);
  const q = qOf('cst');
  const fd = fOf('cst','dest');
  let list = cs;
  if (fd) list = list.filter(c => (c.dest || 'muhsen') === fd);
  if (q) list = list.filter(c => (c.title + ' ' + c.body + ' ' + c.no).indexOf(q) >= 0);
  const reach = cs.reduce((a, c) => a + c.seen, 0), of = cs.reduce((a, c) => a + c.of, 0);

  return '<div class="grid g4">' +
      stat({ label:'رسائل مُرسَلة', n:cs.length, ic:'i-bell',
        sub:'على ثلاث وجهات', series:[2,4,6,8,10,12,13,cs.length] }) +
      stat({ label:'نسبة الفتح', n:of ? Math.round(reach / of * 100) : 0, suffix:'٪',
        ic:'i-eye', cls:'up', sub:AR(reach) + ' من ' + AR(of),
        series:[52,60,66,70,74,78,82,of ? Math.round(reach / of * 100) : 0] }) +
      stat({ label:'إلى الميدان', n:cs.filter(c => (c.dest || 'muhsen') === 'muhsen').length,
        ic:'i-user', sub:'تطبيق المحسن', series:[1,2,3,4,5,6,7,8] }) +
      stat({ label:'إلى الحجاج', n:cs.filter(c => c.dest === 'hajj').length, ic:'i-users',
        sub:'تطبيق الحاجّ', series:[0,1,1,2,2,3,3,4] }) +
    '</div>' +

    '<div class="grid g23">' +
      '<div class="card gold">' +
        head('رسالة جديدة', 'اختر الوجهة أوّلًا — فالفئات تتبعها', '', 'i-bell') +
        '<div class="compose">' +
          '<label class="fl2" style="margin-top:0">الوجهة</label>' +
          '<div class="dests">' + Object.keys(CAST_DEST).map(k => {
            const D2 = CAST_DEST[k];
            return '<button class="dest' + (dest === k ? ' on' : '') + '" ' +
              'data-a="seg" data-k="cdest" data-v="' + k + '" style="--dc:' + D2.c + '">' +
              '<span class="ico" style="color:' + D2.c + '">' + icon(D2.i,'s18') + '</span>' +
              '<b>' + E(D2.ar) + '</b><span>' + E(D2.d) + '</span></button>';
          }).join('') + '</div>' +

          '<label class="fl2">الفئة المستهدَفة</label>' +
          '<div class="chips">' + castAud(dest).map(a =>
            '<button class="chip2' + (aud === a[0] ? ' on' : '') + '" ' +
            'data-a="seg" data-k="caud_' + dest + '" data-v="' + E(a[0]) + '">' +
            E(a[1]) + '<i style="font-style:normal;opacity:.65;margin-inline-start:5px">' +
            AR(a[2]) + '</i></button>').join('') + '</div>' +

          '<label class="fl2">الأهمية</label>' +
          segmented('ck', [['عادي','عادي'],['عاجل','عاجل'],['حرج','حرج']], kind) +
          '<label class="fl2">العنوان</label>' +
          '<input class="fld" id="q-ct" data-q="ct" value="' + E(qOf('ct')) +
            '" placeholder="سطر واحد يُقرأ في الإشعار">' +
          '<label class="fl2">النصّ</label>' +
          '<textarea class="fld" id="q-cb" data-q="cb" rows="4" ' +
            'placeholder="ما الذي يجب أن يفعله من يقرأ؟">' + E(qOf('cb')) + '</textarea>' +
          '<div class="fl" style="margin-top:14px;gap:10px">' +
            '<button class="btn p" data-a="castsend" style="flex:1">' + icon('i-send','s16') +
              'بثّ إلى ' + AR(audN(dest, aud)) + ' مستلمًا</button>' +
            '<button class="btn l" data-a="castclear">مسح</button>' +
          '</div>' +
          '<div class="gnote">' + icon(CAST_DEST[dest].i,'s16') +
            '<span><b>' + E(CAST_DEST[dest].ar) + '</b> — ' + E(audAr(dest, aud)) +
            ' · ' + AR(audN(dest, aud)) + ' مستلمًا. ويُقيَّد في سجل النظام باسمك ووقته.</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="card hov">' +
        head('الوصول', 'كم فُتحت من المرسَل', '', 'i-eye') +
        '<div class="donutwrap">' + donut({ data:[
          { l:'فُتحت', v:reach, c:'var(--live)' },
          { l:'لم تُفتح', v:Math.max(0, of - reach), c:'var(--line2)' }
        ], center:'مستلم' }) + '</div>' +
        '<div class="plist" style="margin-top:14px">' + Object.keys(CAST_DEST).map(k => {
          const mine = cs.filter(c => (c.dest || 'muhsen') === k);
          const r = mine.reduce((a, c) => a + c.seen, 0);
          const o = mine.reduce((a, c) => a + c.of, 0);
          return '<div class="prow" style="padding:10px 12px">' +
            '<span class="ico" style="color:' + CAST_DEST[k].c + '">' +
              icon(CAST_DEST[k].i,'s16') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(CAST_DEST[k].ar) + '</b>' +
            '<span>' + AR(mine.length) + ' رسالة</span></span>' +
            '<span class="fl" style="gap:8px;min-width:110px">' +
              '<span class="meter" style="flex:1"><i data-w="' +
                (o ? Math.round(r / o * 100) : 0) + '"></i></span>' +
              '<b class="num">' + AR(o ? Math.round(r / o * 100) : 0) + '٪</b></span></div>';
        }).join('') + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      head('ما أُرسل', AR(list.length) + ' من ' + AR(cs.length), '', 'i-hist') +
      filterBar('cst', [
        { k:'dest', label:'الوجهة', opts:Object.keys(CAST_DEST).map(k => [k, CAST_DEST[k].ar]) }
      ], list.length, cs.length, 'ابحث بعنوان أو نصّ أو رقم…') +
      (list.length ? '<div class="plist">' + list.map((c, i) => {
        const D2 = CAST_DEST[c.dest || 'muhsen'];
        const k = c.kind === 'حرج' ? 'no' : c.kind === 'عاجل' ? 'wait' : 'grey';
        const pct = Math.round(c.seen / Math.max(1, c.of) * 100);
        return '<div class="prow" style="flex-wrap:wrap;animation-delay:' + (i * 45) + 'ms">' +
          '<span class="krail" style="background:' + D2.c + '"></span>' +
          '<span class="ico" style="color:' + D2.c + '">' + icon(D2.i,'s18') + '</span>' +
          '<span class="nm" style="flex:1"><b>' + E(c.title) + '</b>' +
          '<span>' + LTR(c.no) + ' · ' + E(D2.ar) + ' · ' + E(c.to) + '</span></span>' +
          pill(c.kind, k) + '<span class="tiny faint">' + ago(c.at) + '</span>' +
          '<div style="width:100%;margin-top:9px">' +
            '<div class="tiny muted">' + E(c.body) + '</div>' +
            '<div class="fl" style="gap:10px;margin-top:9px">' +
              '<span class="meter gold" style="flex:1"><i data-w="' + pct + '"></i></span>' +
              '<span class="tiny faint num">' + AR(c.seen) + '/' + AR(c.of) + ' فتحوها</span>' +
            '</div></div></div>';
      }).join('') + '</div>' : empty('لا رسالة تطابق', '', 'i-bell')) +
    '</div>';
}

/* ============================================================
   إعدادات الموقع
   ============================================================ */
function screenSettings() {
  const cfg = S.cfg = S.cfg || {};
  return '<div class="grid g2">' +
    '<div class="card">' + head('هوية الموقع', 'ما يظهر في الترويسة والبوّابة', '', 'i-shield') +
      '<label class="fl2" style="margin-top:0">اسم النظام</label>' +
      '<input class="fld" id="q-cfgname" data-q="cfgname" value="' +
        E(cfg.name || 'مُحسن · الكنترول') + '">' +
      '<label class="fl2">الموسم</label>' +
      '<input class="fld" id="q-cfgseason" data-q="cfgseason" value="' +
        E(cfg.season || 'موسم حج ١٤٤٨ هـ') + '">' +
      '<label class="fl2">الوضع الافتراضي عند أوّل دخول</label>' +
      segmented('cfgtheme', [['night','ليلي'],['day','نهاري'],['sys','يتبع الجهاز']],
        cfg.theme || 'sys') +
      '<button class="btn p" style="width:100%;margin-top:16px" data-a="cfgsave">' +
        icon('i-checkc','s16') + 'حفظ إعدادات الموقع</button>' +
    '</div>' +

    '<div class="card">' + head('التشغيل', 'ما يضبط سلوك النظام', '', 'i-gear') +
      '<div class="kvlist">' +
        cfgRow('sms', 'إرسال الرسائل النصية', 'يُطفأ فتُسجَّل ولا تُرسَل') +
        cfgRow('autostart', 'بدء المهام تلقائيًّا', 'إن لم يبدأها ليدرها في وقتها') +
        cfgRow('notify', 'الإشعارات الخارجية', 'توقظ الجهاز المغلق') +
        cfgRow('audit', 'تقييد كل إجراء في السجل', 'يُنصح بإبقائه') +
      '</div>' +
    '</div>' +

    '<div class="card">' + head('التجربة', 'أدوات معاينة لا تُشحن للعميل', '', 'i-hour') +
      '<div class="tiny muted" style="margin-bottom:12px">تقديم الساعة يكشف سلوك النوافذ الزمنية.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        [['-360','− ٦ ساعات'],['-60','− ساعة'],['-15','− ١٥ د'],['0','الآن'],
         ['15','+ ١٥ د'],['60','+ ساعة'],['360','+ ٦ ساعات']]
          .map(x => '<button class="btn l sm" data-a="clock" data-v="' + x[0] + '">' +
            x[1] + '</button>').join('') +
      '</div>' +
      '<div class="tiny faint" style="margin-top:12px">الإزاحة الحالية: ' +
        AR(S.clockOffset || 0) + ' دقيقة</div>' +
    '</div>' +

    '<div class="card">' + head('البيانات', 'حجمها وإعادة ضبطها', '', 'i-list') +
      '<div class="meta">' +
        '<div><span class="k">موظفون</span><b class="num">' +
          AR(S.users.filter(u => u.role !== 'x').length) + '</b></div>' +
        '<div><span class="k">حجاج</span><b class="num">' + AR(allPilgrimRows().length) + '</b></div>' +
        '<div><span class="k">مهام</span><b class="num">' + AR(S.tasks.length) + '</b></div>' +
      '</div>' +
      '<div class="tiny faint" style="margin-top:12px">' +
        'الحجم في المتصفّح: ' + AR(storeKb()) + ' ك.ب · بنية ' + AR(SCHEMA) + '</div>' +
      '<button class="btn d" style="margin-top:14px;width:100%" data-a="reset">' +
        icon('i-reset','s16') + 'إعادة ضبط كل البيانات</button>' +
    '</div>' +

    '<div class="card gold">' + head('عن النظام', APP_VER, '', 'i-info') +
      '<div class="tiny muted" style="line-height:2.1">' +
      '· هذا النظام هو <b>المصدر الأصل</b>: منه تُخلق المهام والفرق والحجاج والأدلة.<br>' +
      '· تطبيق الميدان يقرأ منه ويرفع إليه الطلبات والتقارير.<br>' +
      '· مشروعان منفصلان في مستودعين — يربطهما العقد لا الملفات.</div>' +
      '<div class="meta" style="margin-top:14px">' +
        '<div><span class="k">النسخة</span><b>' + APP_VER.replace('نسخة ', '') + '</b></div>' +
        '<div><span class="k">البنية</span><b class="num">' + AR(SCHEMA) + '</b></div>' +
        '<div><span class="k">الشاشات</span><b class="num">' +
          AR(Object.keys(SCREENS).length) + '</b></div>' +
      '</div>' +
    '</div></div>';
}
function cfgRow(k, label, note) {
  const on = S.cfg[k] !== false;
  return '<div class="kv2"><span class="ico sm">' + icon(on ? 'i-checkc' : 'i-x','s14') + '</span>' +
    '<span class="k" style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;' +
      'color:var(--ink)">' + E(label) + '</b>' + E(note) + '</span>' +
    '<button class="tgl' + (on ? ' on' : '') + '" data-a="cfgtog" data-v="' + k + '">' +
      '<i></i></button></div>';
}
const storeKb = () => {
  try { return Math.round((localStorage.getItem(KEY) || '').length / 1024); }
  catch (e) { return 0; }
};
