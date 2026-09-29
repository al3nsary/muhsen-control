/* ============================================================
   حارسُ اللغات — يستخرج كلَّ نصٍّ عربيٍّ معروضٍ ويقارنه بالقاموس

   القاعدة: النصُّ العربيُّ هو المفتاح. فما لم يكن في القاموس ظهر عربيًّا
   في شاشةٍ إنجليزيّة — وهذا عطبٌ لا تكشفه تجربةُ العربيّة إطلاقًا.

   ويميّز الحارسُ بين ما يُعرض وما هو منطق: `data-v="منجزة"` قيمةٌ
   تُقارن ولا تُترجَم، و`'منجزة'` في مقارنةٍ كذلك. ولا يُبلّغ إلّا عمّا
   يراه المستخدم.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const AR = /[\u0600-\u06FF]/;
/* ما يُستثنى: تعليقاتٌ ومنطقٌ وأسماءُ أعلام */
const SKIP_FILES = /^(i18n-scan|build|audit|smoke|shot)\.cjs$/;

/* سلاسلُ لا تُعرض: تُقارَن أو تُستعمل مفاتيحَ */
function isLogic(line, lit) {
  /* مقارنة: === 'x'  أو  !== 'x'  أو  indexOf('x') */
  const esc = lit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp('[=!]==?\\s*[\'"]' + esc + '[\'"]').test(line)) return true;
  if (new RegExp('indexOf\\(\\s*[\'"]' + esc + '[\'"]').test(line)) return true;
  /* مفتاحُ كائن:  'x':  */
  if (new RegExp('[\'"]' + esc + '[\'"]\\s*:').test(line)) return true;
  /* قيمةُ سمةِ منطق: data-v="x" أو data-id أو data-n */
  if (new RegExp('data-(v|id|n|k|s|g|u)="\\s*[\'"]?' + esc).test(line)) return true;
  return false;
}

function strip(src) {
  /* تُزال التعليقات كي لا تُعدّ نصوصًا */
  return src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
            .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, ' '));
}

function scanDir(dir) {
  const found = new Map();      /* نصّ → {files:Set, lines:Set} */
  fs.readdirSync(dir)
    .filter(f => /\.(js|html)$/.test(f) && !SKIP_FILES.test(f))
    .forEach(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const src = strip(raw);
      src.split('\n').forEach((line, ln) => {
        const m = line.match(/'[^'\\\n]*[\u0600-\u06FF][^'\\\n]*'|"[^"\\\n]*[\u0600-\u06FF][^"\\\n]*"/g);
        if (!m) return;
        m.forEach(q => {
          const lit = q.slice(1, -1);
          if (!AR.test(lit)) return;
          if (isLogic(line, lit)) return;
          const key = lit.trim();
          if (!key || !AR.test(key)) return;
          if (!found.has(key)) found.set(key, { files:new Set(), line:f + ':' + (ln + 1) });
          found.get(key).files.add(f);
        });
      });
    });
  return found;
}

/* القاموسُ من ملفّه */
function readDict(p) {
  if (!fs.existsSync(p)) return { en:{}, ms:{} };
  const src = fs.readFileSync(p, 'utf8');
  const out = { en:{}, ms:{} };
  ['en', 'ms'].forEach(L => {
    const m = src.match(new RegExp('DICT\\.' + L + '\\s*=\\s*(\\{[\\s\\S]*?\\n\\});'));
    if (!m) return;
    try { out[L] = (new Function('return ' + m[1]))(); } catch (e) {}
  });
  return out;
}

module.exports = { scanDir, readDict };

if (require.main === module) {
  const dir = process.argv[2] || __dirname;
  const dictPath = process.argv[3] || path.join(dir, '41-dict.js');
  const found = scanDir(dir);
  const dict = readDict(dictPath);
  const keys = [...found.keys()];
  const miss = { en:[], ms:[] };
  keys.forEach(k => {
    if (dict.en[k] == null) miss.en.push(k);
    if (dict.ms[k] == null) miss.ms.push(k);
  });
  console.log('نصوصٌ معروضة: ' + keys.length);
  console.log('  الإنجليزية: ' + (keys.length - miss.en.length) + '/' + keys.length +
    ' — ينقص ' + miss.en.length);
  console.log('  الماليزية:  ' + (keys.length - miss.ms.length) + '/' + keys.length +
    ' — ينقص ' + miss.ms.length);
  if (process.argv.indexOf('--list') >= 0) {
    const L = process.argv[process.argv.indexOf('--list') + 1] || 'en';
    const n = +(process.argv[process.argv.indexOf('--list') + 2] || 40);
    miss[L].slice(0, n).forEach(k =>
      console.log('  · ' + k + '   [' + found.get(k).line + ']'));
  }
  if (process.argv.indexOf('--json') >= 0) {
    fs.writeFileSync(process.argv[process.argv.indexOf('--json') + 1],
      JSON.stringify({ keys, miss, where: keys.reduce((a, k) => {
        a[k] = found.get(k).line; return a; }, {}) }, null, 0));
  }
  if (process.argv.indexOf('--strict') >= 0 && (miss.en.length || miss.ms.length))
    process.exitCode = 1;
}
