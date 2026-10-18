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
// ── 이벤트 이미지 팝업(imageUrl) — 2026-10-17 23:15 계약 추가분 ──
const IMG = 'https://imagedelivery.net/AbC_12-x/0f3c2a9e-1b2c-4d5e-8f90-123456789abc/public';
const imageConfig = { ...config, kind: 'EVENT', imageUrl: IMG };
check('empty popup has no image', () => assert.equal(p.EMPTY_NOTICE_POPUP.imageUrl, null));
check('uploaded Cloudflare Images URL accepted', () => assert.deepEqual(p.popupBlockers(imageConfig), []));
// 2026-10-18: 이벤트 = 이미지 한 장만, 공지 = 글자 또는 이미지
check('enabled event without image rejected', () => assert.ok(p.popupBlockers({ ...config, enabled: true, kind: 'EVENT', imageUrl: null }).includes(p.POPUP_EVENT_IMAGE_MESSAGE)));
check('enabled event with blank image rejected', () => assert.ok(p.popupBlockers({ ...config, enabled: true, kind: 'EVENT', imageUrl: '   ' }).includes(p.POPUP_EVENT_IMAGE_MESSAGE)));
check('enabled event with uploaded image accepted', () => assert.deepEqual(p.popupBlockers({ ...imageConfig, enabled: true, kind: 'EVENT' }), []));
check('disabled event draft without image allowed', () => assert.deepEqual(p.popupBlockers({ ...config, enabled: false, kind: 'EVENT', imageUrl: null }), []));
check('notice text popup without image allowed', () => assert.deepEqual(p.popupBlockers({ ...config, enabled: true, kind: 'NOTICE', imageUrl: null }), []));
check('notice image popup allowed', () => assert.deepEqual(p.popupBlockers({ ...imageConfig, enabled: true, kind: 'NOTICE' }), []));
check('uploaded image URL parses unchanged', () => assert.equal(p.parseNoticePopup(imageConfig).imageUrl, IMG));
check('legacy server without imageUrl reads as no image', () => {
  const { imageUrl, ...legacy } = config;
  const parsed = p.parseNoticePopup(legacy);
  assert.ok(parsed);
  assert.equal(parsed.imageUrl, null);
});
check('null imageUrl reads as no image', () => assert.equal(p.parseNoticePopup({ ...config, imageUrl: null }).imageUrl, null));
for (const bad of [
  'http://imagedelivery.net/AbC/id/public',
  'https://evil.example/AbC/id/public',
  'https://imagedelivery.net.evil.example/AbC/id/public',
  'https://imagedelivery.net/AbC/id',
  'https://imagedelivery.net/AbC/id/public/extra',
  IMG + '?w=10',
  IMG + '#x',
  IMG + '\n',
  ' ' + IMG,
  'https://imagedelivery.net/AbC/i d/public',
  'https://imagedelivery.net/' + 'a'.repeat(65) + '/id/public',
  'https://imagedelivery.net/AbC/' + 'a'.repeat(101) + '/public',
  'https://imagedelivery.net/AbC/id/' + 'a'.repeat(41),
  'javascript:alert(1)',
  '',
]) {
  check('server popup with invalid imageUrl is unparseable: ' + JSON.stringify(bad).slice(0, 60), () => assert.equal(p.parseNoticePopup({ ...config, imageUrl: bad }), null));
}
check('non-string imageUrl is unparseable', () => assert.equal(p.parseNoticePopup({ ...config, imageUrl: 42 }), null));
check('longest allowed segments accepted', () => assert.ok(p.isPopupImageUrl('https://imagedelivery.net/' + 'a'.repeat(64) + '/' + 'b'.repeat(100) + '/' + 'c'.repeat(40))));
check('invalid imageUrl blocks save with server wording', () => assert.deepEqual(p.popupBlockers({ ...config, imageUrl: 'https://example.com/a.png' }), ['팝업 이미지는 이미지 올리기로 올린 주소만 사용할 수 있습니다.']));
check('blank imageUrl is not a blocker', () => assert.deepEqual(p.popupBlockers({ ...config, imageUrl: '   ' }), []));
check('payload trims imageUrl', () => assert.equal(p.popupPayload({ ...config, imageUrl: '  ' + IMG + ' ' }).imageUrl, IMG));
check('payload sends blank imageUrl as null', () => assert.equal(p.popupPayload({ ...config, imageUrl: '  ' }).imageUrl, null));
check('payload sends missing imageUrl as null', () => assert.equal(p.popupPayload({ ...config, imageUrl: undefined }).imageUrl, null));
check('adding an image is a real edit', () => assert.equal(p.samePopup(config, imageConfig), false));
check('changing the image is a real edit', () => assert.equal(p.samePopup(imageConfig, { ...imageConfig, imageUrl: IMG.replace('public', 'thumb') }), false));
check('removing the image is a real edit', () => assert.equal(p.samePopup(imageConfig, { ...imageConfig, imageUrl: null }), false));
check('whitespace around imageUrl is not an edit', () => assert.equal(p.samePopup(imageConfig, { ...imageConfig, imageUrl: ` ${IMG} ` }), true));
const imageForm = { ...form, popup: imageConfig };
const imageNotice = { ...notice, popup: p.popupPayload(imageConfig) };
check('image popup is included in save', () => assert.equal(admin.noticePayload(imageForm).popup.imageUrl, IMG));
check('saved image matches unknown-result check', () => assert.equal(admin.noticeMatches(imageNotice, imageForm), true));
check('server that dropped imageUrl is not mistaken for saved image', () => assert.equal(admin.noticeMatches({ ...imageNotice, popup: { ...imageNotice.popup, imageUrl: null } }, imageForm), false));
check('notice with foreign image host blocks editing', () => assert.equal(admin.parseNotice({ ...notice, popup: { ...config, imageUrl: 'https://example.com/a.png' } }), null));
check('invalid image blocks the whole notice save', () => assert.ok(admin.noticeBlockers({ ...form, popup: { ...config, imageUrl: 'data:image/png;base64,AAAA' } }).length));
for (const type of ['image/png', 'image/jpeg', 'image/webp']) check('upload type allowed ' + type, () => assert.equal(p.popupImageFileProblem({ type, size: 1024 }), null));
for (const type of ['image/gif', 'image/svg+xml', 'image/heic', 'application/pdf', '']) check('upload type rejected ' + (type || '(none)'), () => assert.ok(p.popupImageFileProblem({ type, size: 1024 })));
check('10MB image allowed', () => assert.equal(p.popupImageFileProblem({ type: 'image/png', size: 10 * 1024 * 1024 }), null));
check('over 10MB image rejected', () => assert.ok(p.popupImageFileProblem({ type: 'image/png', size: 10 * 1024 * 1024 + 1 })));
// 기간 한 줄 — 앱(popupPeriodLabel)과 같은 글자
check('midnight end shows the previous day', () => assert.equal(p.popupPeriodLabel('2026-11-01T00:00:00'), '10월 31일까지'));
check('midnight end across the year', () => assert.equal(p.popupPeriodLabel('2027-01-01T00:00'), '12월 31일까지'));
check('midnight end on March 1 of a leap year', () => assert.equal(p.popupPeriodLabel('2028-03-01T00:00:00'), '2월 29일까지'));
check('timed end shows the time', () => assert.equal(p.popupPeriodLabel('2026-10-20T23:59'), '10월 20일 23:59 전까지'));
check('morning end keeps two-digit hour', () => assert.equal(p.popupPeriodLabel('2026-10-20T09:05:00'), '10월 20일 09:05 전까지'));
check('no end shows no period', () => assert.equal(p.popupPeriodLabel(null), null));
check('invalid end shows no period', () => assert.equal(p.popupPeriodLabel('2026-02-31T00:00'), null));
console.log(`${checks} popup regression checks passed`);
