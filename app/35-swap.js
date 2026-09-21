/* ============================================================
   الاستبدال — احتياطيٌّ مكان شخصٍ بعينه، في فعلٍ واحد

   كان الاستبدال فعلين منفصلين: تُخرج فلانًا، ثم تبحث عن بديلٍ
   فتُدخله. وبينهما ثغرة: مقعدٌ فارغٌ لا يعلم به أحد، وسجلّان لا
   يربطهما رابط — فلا يُعرف بعد شهرٍ أنّ هذا حلَّ محلّ ذاك.

   فصار فعلًا واحدًا: **اخترِ البديل، واكتب السبب، فيقع الخروجُ
   والدخول معًا** — ويُكتب في ملفّ الخارج أنه استُبدل بفلان، وفي ملفّ
   الداخل أنه حلَّ محلّ فلان. والسبب واحدٌ في السجلّين.
   ============================================================ */

/* البدلاء: الاحتياط أوّلًا، فهو الموضوع لهذا. ثم من لا مجموعة له. */
function swapCands(outU) {
  const res = (V.users || []).filter(u =>
    u.role === 'muhsen' && u.reserve && u.id !== (outU || {}).id);
  const free = (V.users || []).filter(u =>
    u.role === 'muhsen' && !u.reserve && !staffGroup(u) && u.id !== (outU || {}).id);
  /* الأقربُ تخصّصًا أوّلًا — فالبديل يُراد لعمله لا لعدده */
  const near = u => (u.specialty === (outU || {}).specialty ? 0 : 1);
  return res.sort((a, b) => near(a) - near(b)).concat(free);
}

/* يُفتح المنتقي لاختيار البديل. scope: 'task' أو 'group' */
function swapAsk(scope, refId, outId) {
  const out = userById(outId); if (!out) return;
  const ref = scope === 'task' ? taskById(refId)
                               : (S.groups || []).find(x => x.id === refId);
  if (!ref) return;
  S.pendSwap = { scope, refId, outId };
  const cands = swapCands(out);
  if (!cands.length) { toast('لا بديل متاحًا — الاحتياط فارغ', 'r'); return; }
  openPicker('swap', refId, {
    title: 'بديلٌ عن ' + out.name,
    note: 'الاحتياط أوّلًا، والأقربُ تخصّصًا في أعلى القائمة. ' +
          'تخصّص ' + (out.specialty || '—') + ' — ' + (ref.title || ref.no || ''),
    cands
  });
}

/* ما يقع بعد كتابة السبب: خروجٌ ودخولٌ في قيدٍ واحد */
function swapDo(why) {
  const p = S.pendSwap; if (!p) return;
  const out = userById(p.outId), inn = userById(p.inId);
  S.pendSwap = null; S.why = null;
  if (!out || !inn) return;
  const where = p.scope === 'task' ? (taskById(p.refId) || {})
                                   : ((S.groups || []).find(x => x.id === p.refId) || {});
  const label = where.title || where.no || '';

  if (p.scope === 'task') {
    const t = ensureTask(where); if (!t) return;
    t.assigned = (t.assigned || []).filter(x => x !== out.id);
    t.attended = (t.attended || []).filter(x => x !== out.id);
    if (t.assigned.indexOf(inn.id) < 0) t.assigned.push(inn.id);
    txLog(t, 'استبدل الكنترول ' + out.name + ' بـ' + inn.name +
      (inn.reserve ? ' من الاحتياط' : '') + ' — السبب: ' + why, 'assign');
  } else {
    const g = where;
    snapForm('استبدال ' + out.name + ' بـ' + inn.name + ' في ' + g.no);
    const org = orgById(g.orgId) || {};
    const spec = (g.members.find(m => m.id === out.id) || {}).spec ||
      inn.specialty || SPECS[0];
    g.members = g.members.filter(m => m.id !== out.id);
    out.groupId = null; out.leaderId = null; out.kt = '—';
    g.members.push({ id:inn.id, spec });
    inn.groupId = g.id; inn.leaderId = g.leaderId; inn.kt = org.kt;
    if (inn.reserve) inn.reserve = false;
    /* مهامُّ ليدر المجموعة تنتقل من الخارج إلى الداخل */
    let n = 0;
    (S.tasks || []).forEach(t => {
      if (t.leaderId !== g.leaderId) return;
      t.assigned = (t.assigned || []).filter(x => x !== out.id);
      t.attended = (t.attended || []).filter(x => x !== out.id);
      if (t.assigned.indexOf(inn.id) < 0) { t.assigned.push(inn.id); n++; }
    });
    formLog(g, 'استُبدل ' + out.name + ' بـ' + inn.name + ' على ' + AR(n) +
      ' مهمة — السبب: ' + why);
    if (gState(g) === 'approved') { g.state = 'draft'; formLog(g, 'عادت مسودّةً بعد التعديل'); }
  }

  /* الرابط بين الملفّين: كلٌّ يعرف بمن استُبدل */
  whyOnUser(out.id, 'استُبدل بـ' + inn.name + ' في «' + label + '» — ' + why, 'swapRes');
  whyOnUser(inn.id, 'حلَّ محلّ ' + out.name + ' في «' + label + '» — ' + why, 'swapRes');
  logIt('استُبدل ' + out.name + ' بـ' + inn.name + ' في ' + label + ' — ' + why, 'assign');
  toast(inn.name + ' مكان ' + out.name);
  S.picker = null; S.drawer = null; clearDrawerStack();
  save();
  if (p.scope === 'task') taskDrawer(p.refId); else render();
}
