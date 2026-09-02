/* أداة البناء — تجمع الوحدات في ملف واحد وتفحصه قبل النشر */
const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const imgs = JSON.parse(read('assets/images.json'));

/* الصور تُعرَّف مرة واحدة كأصناف — لا تتكرر في كل رسم */
const imgCSS = '<style>\n' +
  Object.keys(imgs).filter(k => /_t$/.test(k)).map(k =>
    '.bg-' + k.replace(/_t$/, '') + '{background-image:url(' + imgs[k] + ')}').join('\n') + '\n' +
  '.mlogo{background-image:url(' + imgs.logo_white + ')}\n' +
  '.mlockup{background-image:url(' + imgs.logo_lockup + ')}\n' +
  '.mnozoly{background-image:url(' + imgs.nozoly_dark + ')}\n' +
  '</style>\n';

const JS = ['02-data.js', '03-core.js', '04-shell.js', '05-ops.js', '06-screens.js', '07-router.js'];

const shell =
  '<div class="bg"><span class="grid"></span></div>\n' +
  '<div id="room">\n' +
  '  <div id="railwrap" style="display:contents"></div>\n' +
  '  <div id="sidewrap" style="display:contents"></div>\n' +
  '  <div id="stagewrap" class="stage"></div>\n' +
  '</div>\n' +
  '<div id="toastwrap"></div>\n';

const out =
  read('01-style.html') + '\n' +
  read('00-defs.html') + '\n' +
  imgCSS +
  shell +
  '<script>window.IMG={"logo_white":' + JSON.stringify(imgs.logo_white) + '};</scr' + 'ipt>\n' +
  '<script>\n' + JS.map(read).join('\n') + '\n</scr' + 'ipt>\n';

const dest = path.join(__dirname, '..', 'control.html');
fs.writeFileSync(dest, out);
console.log('built:', dest);
console.log('size:', Math.round(fs.statSync(dest).size / 1024) + 'KB');

/* نسخة الاستضافة */
const deploy = path.join(__dirname, '..', 'docs');
fs.mkdirSync(deploy, { recursive: true });
const page = '<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<meta name="theme-color" content="#070D0A">\n' +
  '<meta name="description" content="مُحسن · الكنترول — غرفة عمليات موسم الحج">\n' +
  '</head>\n<body>\n' + out + '</body>\n</html>';
fs.writeFileSync(path.join(deploy, 'index.html'), page);
console.log('docs/index.html:', Math.round(fs.statSync(path.join(deploy, 'index.html')).size / 1024) + 'KB');

/* ---------- حُرّاس ---------- */
const js = JS.map(read).join('\n');
try { new Function(js); console.log('syntax: OK'); }
catch (e) { console.log('SYNTAX ERROR:', e.message); process.exitCode = 1; }

const RESERVED = ['top','self','parent','window','document','location','history','navigator','screen',
  'frames','length','name','status','origin','close','closed','open','focus','blur','print','stop',
  'alert','confirm','prompt','event','external','opener','scrollX','scrollY','innerWidth','innerHeight'];
const declared = new Set();
const re = /(?:^|\n)(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;
let m; while ((m = re.exec(js))) declared.add(m[1]);
const clash = RESERVED.filter(r => declared.has(r));
if (clash.length) { console.log('GLOBAL CLASH:', clash.join(', ')); process.exitCode = 1; }
else console.log('globals: OK');

const routed = [...new Set([...(js.match(/:\s*(screen[A-Za-z]+)/g) || [])].map(s => s.split(':')[1].trim()))];
const defined = new Set([...(js.match(/function\s+(screen[A-Za-z]+)/g) || [])].map(s => s.split(/\s+/)[1]));
[...(js.match(/const\s+(screen[A-Za-z]+)\s*=/g) || [])].forEach(s => defined.add(s.split(/\s+/)[1]));
const missing = routed.filter(n => !defined.has(n));
if (missing.length) { console.log('MISSING SCREENS:', missing.join(', ')); process.exitCode = 1; }
else console.log('screens: OK (' + defined.size + ')');

/* كل قسم في القائمة له شاشة */
const navKeys = [...(read('04-shell.js').match(/k:'([a-z]+)'/g) || [])].map(s => s.slice(3, -1));
const screenKeys = Object.keys(
  (js.match(/const SCREENS = \{[\s\S]*?\};/) || [''])[0]
    .split('\n').slice(1, -1).join(' ')
    .split(',').reduce((a, p) => { const k = p.split(':')[0].trim(); if (k) a[k] = 1; return a; }, {}));
const noScreen = [...new Set(navKeys)].filter(k => screenKeys.indexOf(k) < 0);
if (noScreen.length) { console.log('NAV WITHOUT SCREEN:', noScreen.join(', ')); process.exitCode = 1; }
else console.log('nav: OK (' + new Set(navKeys).size + ')');
