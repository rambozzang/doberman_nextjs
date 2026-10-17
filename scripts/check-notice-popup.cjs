// Run with node scripts/check-notice-popup.cjs. No browser, DB, or network writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const out = { exports: {} }; cache.set(file, out.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = (name) => name.startsWith('@/') ? load(path.join(root, 'src', name.slice(2) + '.ts'))
    : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, out, out.exports);
  return out.exports;
}
const p = load(path.join(root, 'src/lib/boss/noticePopup.ts'));
const admin = load(path.join(root, 'src/lib/boss/platformAdmin.ts'));
const config = { ...p.EMPTY_NOTICE_POPUP, enabled: true, kind: 'FEATURE', destination: 'TAX_GUIDE', startsAt: '2026-10-17T09:00', endsAt: '2026-10-20T23:59', priority: 50 };
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS ' + name); }
check('valid leap date', () => assert.equal(p.popupDate('2028-02-29T12:00'), '2028-02-29T12:00:00'));
for (const value of ['2026-02-29T12:00', '2026-02-31T12:00', '2026-13-01T12:00', '2026-01-01T24:00', '2026-10-17T09:00:00Z', '2026-10-17T09:00:00+09:00', 'invalid']) {
  check('reject invalid or timezone-mixed date: ' + value, () => assert.equal(p.popupDate(value), null));
}
check('valid settings have no blockers', () => assert.deepEqual(p.popupBlockers(config), []));
check('same minute start/end rejected', () => assert.ok(p.popupBlockers({ ...config, endsAt: config.startsAt }).length));
check('backwards schedule rejected', () => assert.ok(p.popupBlockers({ ...config, startsAt: config.endsAt, endsAt: config.startsAt }).length));
check('unbounded schedule allowed', () => assert.deepEqual(p.popupBlockers({ ...config, startsAt: null, endsAt: null }), []));
for (const priority of [-1, 101, 1.5, NaN]) check('reject invalid priority ' + priority, () => assert.ok(p.popupBlockers({ ...config, priority }).length));
check('summary limit', () => assert.ok(p.popupBlockers({ ...config, summary: '가'.repeat(161) }).length));
check('button limit', () => assert.ok(p.popupBlockers({ ...config, ctaLabel: '가'.repeat(25) }).length));
check('unknown destination rejected', () => assert.equal(p.parseNoticePopup({ ...config, destination: 'https://evil.invalid' }), null));
check('unknown kind rejected', () => assert.equal(p.parseNoticePopup({ ...config, kind: 'SURPRISE' }), null));
check('string boolean rejected', () => assert.equal(p.parseNoticePopup({ ...config, enabled: 'true' }), null));
check('empty CTA gets safe default', () => assert.equal(p.popupPayload({ ...config, ctaLabel: '  ' }).ctaLabel, '자세히 보기'));
check('minute schedule is canonicalized', () => assert.equal(p.popupPayload(config).startsAt, '2026-10-17T09:00:00'));
check('browser timezone does not alter KST wall time', () => assert.equal(p.popupPayload(config).endsAt, '2026-10-20T23:59:00'));
const form = { title: '새 기능', content: '설명', status: 'DRAFT', publishConfirmed: false, popup: config };
const notice = { id: 1, title: form.title, content: form.content, status: form.status, popup: p.popupPayload(config) };
check('saved popup metadata matches unknown-result check', () => assert.equal(admin.noticeMatches(notice, form), true));
check('changed destination is not mistaken for saved result', () => assert.equal(admin.noticeMatches({ ...notice, popup: { ...notice.popup, destination: 'TAX_INVOICES' } }, form), false));
check('changed schedule is not mistaken for saved result', () => assert.equal(admin.noticeMatches({ ...notice, popup: { ...notice.popup, endsAt: null } }, form), false));
check('missing metadata is not mistaken for saved popup', () => assert.equal(admin.noticeMatches({ ...notice, popup: null }, form), false));
check('turning popup off is a real edit', () => assert.equal(p.samePopup(config, { ...config, enabled: false }), false));
check('legacy no-popup notice remains readable', () => assert.ok(admin.parseNotice({ id: 1, title: '구 공지', content: '안내', status: 'PUBLISHED' })));
check('unknown server settings block editing rather than silently disabling', () => assert.equal(admin.parseNotice({ ...notice, popup: { ...config, destination: 'NEW_UNSUPPORTED_FEATURE' } }), null));
check('popup config is included in save', () => assert.deepEqual(admin.noticePayload(form).popup, p.popupPayload(config)));
check('popup blockers prevent the whole notice save', () => assert.ok(admin.noticeBlockers({ ...form, popup: { ...config, priority: NaN } }).length));
check('summary markup is compared in server plain-text form', () => {
  const f = { ...form, popup: { ...config, summary: '<b>준비 안내</b>' } };
  assert.equal(admin.noticeMatches({ ...notice, popup: { ...notice.popup, summary: '준비 안내' } }, f), true);
});
const starts = Date.parse('2026-10-17T09:00:00+09:00');
const ends = Date.parse('2026-10-20T23:59:00+09:00');
check('draft popup awaits publication', () => assert.equal(p.popupVisibility('DRAFT', config, starts), '공개 대기'));
check('future popup is scheduled', () => assert.equal(p.popupVisibility('PUBLISHED', config, starts - 1), '예약됨'));
check('start is inclusive', () => assert.equal(p.popupVisibility('PUBLISHED', config, starts), '노출 중'));
check('end is exclusive', () => assert.equal(p.popupVisibility('PUBLISHED', config, ends), '기간 종료'));
check('disabled popup never marked visible', () => assert.equal(p.popupVisibility('PUBLISHED', { ...config, enabled: false }, starts), '사용 안 함'));
console.log(`${checks} popup regression checks passed`);
