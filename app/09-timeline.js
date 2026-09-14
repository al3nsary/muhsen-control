/* ============================================================
   الخط الزمني للموسم — كل مهام كل الفرق في شاشة واحدة
   ترى التداخل والفجوة والضغط بنظرة، وتفتح أيّ مهمة بنقرة.
   ============================================================ */

function tlWindow() {
  const all = V.tasks;
  if (!all.length) return { a: now() - DAY, b: now() + DAY };
  const a = Math.min.apply(null, all.map(t => t.start)) - 4 * HR;
  const b = Math.max.apply(null, all.map(t => t.end)) + 4 * HR;
  return { a, b };
}



/* أكثر عدد مهام متزامنة في الموسم */
function peakOverlap() {
  const pts = [];
  V.tasks.forEach(t => { pts.push([t.start, 1]); pts.push([t.end, -1]); });
  pts.sort((a, b) => a[0] - b[0]);
  let cur = 0, peak = 0;
  pts.forEach(p => { cur += p[1]; if (cur > peak) peak = cur; });
  return peak;
}
