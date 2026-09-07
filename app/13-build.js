/* ============================================================
   التشكيل والتسكين
   ثلاث لوحات مصدر — مشرفون · ليدرز · محسنون —
   وصندوق في الوسط تُبنى فيه المجموعة، ثم تُربط بجهة الحج.
   قاعدتان لا تُكسران:
     · المحسن لا ينضمّ لمجموعتين — يخرج من الإتاحة فور تسكينه.
     · الليدر يقود مجموعتين، ولكلٍّ محسنوها.
   ============================================================ */

const DRAFT0 = () => ({ leaderId:null, members:[], orgId:null, hotelId:null, supervisorId:null, editing:null });
const draft = () => (S.draft = S.draft || DRAFT0());

/* بطاقة شخص في لوحة المصدر */
function personCard(u, act, extra) {
  const g = u.groupId ? groupById(u.groupId) : null;
  return '<button class="pcard' + (act ? '' : ' off') + '" ' +
    (act ? 'data-a="' + act + '" data-id="' + u.id + '"' : 'disabled') + '>' +
    avatar(u, 'sm') +
    '<span class="nm"><b>' + E(u.name) + '</b>' +
      '<span>' + LTR(u.code) + (u.specialty ? ' · ' + E(u.specialty) : '') + '</span></span>' +
    (extra || (g ? pill(g.no, 'grey') : '')) + '</button>';
}

function screenBuild() {
  const d = draft();
  const q = qOf('bld');
  /* من وُضع في الصندوق خرج من الإتاحة فورًا — لا ينتظر الحفظ */
  let free = freeMuhsens().filter(u => !d.members.some(m => m.id === u.id));
  if (q) free = free.filter(u => (u.name + ' ' + u.code + ' ' + u.specialty).indexOf(q) >= 0);
  const L = d.leaderId ? userById(d.leaderId) : null;
  const org = d.orgId ? orgById(d.orgId) : null;
  const hotel = d.hotelId ? hotelById(d.hotelId) : null;
  const sv = d.supervisorId ? userById(d.supervisorId) : null;
  const ready = d.leaderId && d.members.length === 5 && d.orgId;

  return '<div class="grid g4">' +
      stat({ label:'مجموعات مشكَّلة', n:S.groups.length, ic:'i-users', cls:'up',
        sub:'تُسكَّن مهامها تلقائيًّا', series:[1,2,2,3,4,4,5,S.groups.length] }) +
      stat({ label:'محسنون بلا مجموعة', n:free.length, ic:'i-user',
        cls:free.length ? 'warn' : 'up', sub:'هؤلاء وحدهم متاحون للتشكيل',
        series:[25,20,15,10,7,4,2,Math.max(0, freeMuhsens().length)] }) +
      stat({ label:'مشرفون', n:supervisors().length, ic:'i-shield',
        sub:'على ' + AR(HOTELS.length) + ' فنادق', series:[1,2,2,3,3,4,4,supervisors().length] }) +
      stat({ label:'جهات الحجّ', n:S.orgs.length, ic:'i-flag',
        sub:'بعثات وشركات', series:[1,2,3,3,4,4,5,S.orgs.length] }) +
    '</div>' +

    '<div class="board3">' +
      /* ═════ المصادر ═════ */
      '<div class="card src">' +
        head('المصادر', 'انقر لتضيفه إلى التشكيل', '', 'i-users') +
        '<div class="srcgrp"><span class="slab">' + icon('i-shield','s14') + 'مشرفون</span>' +
          supervisors().map(u => personCard(u, 'bsup',
            pill(hotelById(u.hotelId).ar || '—', d.supervisorId === u.id ? 'live' : 'gold'))).join('') +
        '</div>' +
        '<div class="srcgrp"><span class="slab">' + icon('i-star','s14') + 'ليدرز' +
          '<i class="cnt">' + AR(leaders().length) + '</i></span>' +
          leaders().map(u => {
            const gn = groupsOf(u.id).length;
            const same = d.leaderId === u.id;
            return personCard(u, gn >= 2 && !same ? null : 'blead',
              same ? pill('في التشكيل', 'live')
                : gn >= 2 ? pill('مكتمل — مجموعتان', 'no')
                : gn ? pill('يقود ' + AR(gn), 'wait') : pill('حرّ', 'live'));
          }).join('') +
        '</div>' +
        '<div class="srcgrp"><span class="slab">' + icon('i-user','s14') + 'محسنون متاحون' +
          '<i class="cnt">' + AR(free.length) + '</i></span>' +
          '<div style="margin:0 0 9px">' + search('bld', 'ابحث في المتاحين…', freeMuhsens().length) + '</div>' +
          (free.length ? free.map(u => personCard(u, 'bmem')).join('')
            : '<div class="tiny faint" style="padding:14px 6px">لا محسن متاح — كلّهم مسكَّنون.</div>') +
        '</div>' +
      '</div>' +

      /* ═════ صندوق التشكيل ═════ */
      '<div class="card gold buildbox">' +
        head(d.editing ? 'تعديل ' + E(groupById(d.editing).no) : 'تشكيل مجموعة جديدة',
          'ليدر واحد وخمسة محسنين — ستّة',
          '<span class="cnt2' + (ready ? ' ok' : '') + '">' +
            AR(d.members.length + (d.leaderId ? 1 : 0)) + ' / ٦</span>', 'i-users') +

        '<div class="slot lead">' +
          '<span class="sl">الليدر</span>' +
          (L ? '<div class="fl" style="flex:1;gap:11px">' + avatar(L, 'sm') +
              '<span class="nm" style="flex:1"><b>' + E(L.name) + '</b>' +
              '<span>' + LTR(L.code) + ' · ' + E(L.kt) + ' · ' + AR(L.pilgrims) + ' حاجًّا</span></span>' +
              '<button class="xbtn" data-a="bclrlead">' + icon('i-x','s14') + '</button></div>'
            : '<span class="ph">اختر ليدرًا من المصادر</span>') +
        '</div>' +

        '<div class="slots">' + [0,1,2,3,4].map(i => {
          const m = d.members[i];
          const u = m ? userById(m.id) : null;
          return '<div class="slot' + (u ? ' full' : '') + '">' +
            '<span class="sl">محسن ' + AR(i + 1) + '</span>' +
            (u ? '<div class="fl" style="flex:1;gap:10px">' + avatar(u, 'sm') +
                '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
                '<span>' + LTR(u.code) + ' · ' + AR(u.age || 29) + ' سنة</span></span>' +
                '<select class="spec" data-a="bspec" data-id="' + u.id + '">' +
                  SPECS.map(s => '<option' + (s === m.spec ? ' selected' : '') + '>' + E(s) + '</option>').join('') +
                '</select>' +
                '<button class="xbtn" data-a="bdel" data-id="' + u.id + '">' + icon('i-x','s14') + '</button></div>'
              : '<span class="ph">فارغ</span>') +
          '</div>';
        }).join('') + '</div>' +

        '<div class="pickrow"><span class="sl">جهة الحجّ</span>' +
          '<div class="chips">' + S.orgs.map(o =>
            '<button class="chip2' + (d.orgId === o.id ? ' on' : '') + '" data-a="borg" data-id="' + o.id + '">' +
            E(o.kt) + ' · ' + E(o.ar) + '</button>').join('') + '</div></div>' +

        '<div class="pickrow"><span class="sl">السكن</span>' +
          '<div class="chips">' + HOTELS.map(h =>
            '<button class="chip2' + (d.hotelId === h.id ? ' on' : '') + '" data-a="bhotel" data-id="' + h.id + '">' +
            E(h.ar) + '</button>').join('') + '</div></div>' +

        (hotel ? '<div class="quote">' + E(hotel.ar) + ' · ' + E(hotel.dist) + ' · ' +
          AR(hotel.rooms) + ' غرفة' +
          (sv ? ' — المشرف ' + E(sv.name) : ' — بلا مشرف بعد') + '</div>' : '') +

        '<div class="fl" style="gap:10px;margin-top:16px">' +
          '<button class="btn p" style="flex:1"' + (ready ? '' : ' disabled') +
            ' data-a="bsave">' + icon('i-checkc','s16') +
            (d.editing ? 'حفظ التعديل' : 'حفظ المجموعة وتسكين مهامها') + '</button>' +
          '<button class="btn l" data-a="bclear">تفريغ</button>' +
        '</div>' +
        '<div class="tiny faint" style="margin-top:10px">' +
          'بالحفظ تُسكَّن كلّ مهام ' + (org ? E(org.kt) : 'الجهة') +
          ' على هذه المجموعة تلقائيًّا، ويخرج محسنوها من قوائم الإتاحة.</div>' +
      '</div>' +

      /* ═════ المجموعات القائمة ═════ */
      '<div class="card src">' +
        head('المجموعات القائمة', AR(S.groups.length) + ' مجموعة', '', 'i-checkc') +
        (S.groups.length ? S.groups.map(g => {
          const gl = userById(g.leaderId) || {}, go = orgById(g.orgId) || {};
          const gh = hotelById(g.hotelId), gs = g.supervisorId ? userById(g.supervisorId) : null;
          const tn = S.tasks.filter(t => t.leaderId === g.leaderId).length;
          return '<div class="gitem' + (d.editing === g.id ? ' on' : '') + '">' +
            '<div class="fl" style="gap:10px">' + avatar(gl, 'sm') +
              '<span class="nm" style="flex:1"><b>' + LTR(g.no) + ' · ' + E(gl.name || '') + '</b>' +
              '<span>' + E(go.kt || '') + ' · ' + E(go.ar || '') + '</span></span>' +
              pill(AR(g.members.length + 1), 'gold') + '</div>' +
            '<div class="faces">' + g.members.map(m => {
              const mu = userById(m.id);
              return mu ? '<span class="fw" title="' + E(mu.name + ' — ' + m.spec) + '">' +
                avatar(mu, 'sm') + '</span>' : '';
            }).join('') + '</div>' +
            '<div class="pfoot">' +
              '<span class="ok">' + E(gh.ar || '—') + (gs ? ' · ' + E(gs.name) : '') + '</span>' +
              '<span class="fl" style="gap:7px">' + pill(AR(tn) + ' مهمة', 'grey') +
                '<button class="btn l sm" data-a="bedit" data-id="' + g.id + '">تعديل</button></span>' +
            '</div></div>';
        }).join('') : empty('لا مجموعات بعد', 'شكّل أولى مجموعاتك من الوسط', 'i-users')) +
      '</div>' +
    '</div>' +

    /* ═════ المشرفون على الفنادق ═════ */
    '<div class="card">' +
      head('المشرفون على الفنادق', 'المشرف يتبع الفندق لا الجهة — وقد يجتمع تحته ليدر بعثة وليدر شركة',
        '', 'i-shield') +
      '<div class="grid g2">' + HOTELS.map(h => {
        const sup = supervisors().filter(u => u.hotelId === h.id);
        const gs = S.groups.filter(g => g.hotelId === h.id);
        return '<div class="hotel">' +
          '<div class="fl" style="gap:11px;margin-bottom:11px">' +
            '<span class="ico">' + icon('i-key','s18') + '</span>' +
            '<span class="nm" style="flex:1"><b>' + E(h.ar) + '</b>' +
            '<span>' + E(h.city) + ' · ' + E(h.dist) + ' · ' + AR(h.rooms) + ' غرفة</span></span>' +
            pill(AR(gs.length) + ' مجموعة', gs.length ? 'live' : 'grey') +
            '<button class="btn l sm" data-a="supassign" data-id="' + h.id + '">' +
              (sup.length ? 'تغيير المشرف' : 'تسكين مشرف') + '</button></div>' +
          (sup.length ? '<div class="plist">' + sup.map(u =>
            '<div class="prow" style="padding:9px 11px">' + avatar(u, 'sm') +
            '<span class="nm" style="flex:1"><b>' + E(u.name) + '</b>' +
            '<span>' + LTR(u.code) + ' · مشرف سكن</span></span>' +
            pill('مشرف', 'gold') + '</div>').join('') + '</div>'
            : '<div class="tiny faint">بلا مشرف</div>') +
          (gs.length ? '<div class="hgroups">' + gs.map(g => {
            const gl = userById(g.leaderId) || {}, go = orgById(g.orgId) || {};
            return '<span class="hchip">' + avatar(gl, 'sm') +
              '<span class="tiny"><b>' + LTR(g.no) + '</b><br>' +
              '<span class="faint">' + E(go.type || '') + ' · ' + E(go.kt || '') + '</span></span></span>';
          }).join('') + '</div>' : '') +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
}
