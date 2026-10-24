// Run with node scripts/check-tax-setup-flow.cjs. No browser, DB, or network writes.
// 전자 발급 시작하기 단계 규칙(2026-10-25) — 앱 test/tax_setup_flow_test.dart 와 같은 기대값
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
const f = load(path.join(root, 'src/lib/boss/taxSetupFlow.ts'));
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS ' + name); }
const st = (stage, extra = {}) => ({ stage, reviewStatus: null, serviceConfigured: true, memberLinked: null, ...extra });

check('처음(고르기 전) 회사 없음 · 신청 전은 소개부터', () => {
  assert.equal(f.anchorStep(st('NEED_COMPANY'), null, false), 'intro');
  assert.equal(f.anchorStep(st('NOT_REGISTERED'), null, false), 'intro');
});
check('고른 뒤에는 회사 없음도 사업자번호부터(회사 등록 화면으로 보내지 않는다)', () => {
  assert.equal(f.anchorStep(st('NEED_COMPANY'), 'BOTH', false), 'bizno');
  assert.equal(f.anchorStep(st('NOT_REGISTERED'), 'CASH', false), 'bizno');
});
check('반려는 고르기와 상관없이 사업자번호부터(사유를 위에 보인다)', () => {
  assert.equal(f.anchorStep(st('REJECTED'), null, false), 'bizno');
  assert.equal(f.anchorStep(st('PENDING_VERIFICATION', { reviewStatus: 'REJECTED' }), null, false), 'bizno');
});
check('심사 중', () => assert.equal(f.anchorStep(st('PENDING_VERIFICATION', { reviewStatus: 'PENDING' }), 'BOTH', false), 'pending'));
check('승인 뒤 팝빌 가입 · 확인 불가 · 설정 준비 중', () => {
  assert.equal(f.anchorStep(st('VERIFIED', { memberLinked: false }), 'BOTH', false), 'linkId');
  assert.equal(f.anchorStep(st('VERIFIED', { memberLinked: null }), 'BOTH', false), 'linkUnknown');
  assert.equal(f.anchorStep(st('VERIFIED', { serviceConfigured: false, memberLinked: false }), 'BOTH', false), 'notConfigured');
  assert.equal(f.anchorStep(st('VERIFIED', { memberLinked: true }), 'BOTH', false), 'notConfigured');
});
check('인증서 단계 — 현금영수증만 고르고 현금 준비면 끝, 아니면 인증서', () => {
  assert.equal(f.anchorStep(st('NEEDS_CERTIFICATE', { memberLinked: true }), 'CASH', true), 'doneCash');
  assert.equal(f.anchorStep(st('NEEDS_CERTIFICATE', { memberLinked: true }), 'CASH', false), 'certificate');
  assert.equal(f.anchorStep(st('NEEDS_CERTIFICATE', { memberLinked: true }), 'BOTH', true), 'certificate');
  assert.equal(f.anchorStep(st('NEEDS_CERTIFICATE', { memberLinked: true }), null, true), 'certificate');
});
check('준비 완료', () => assert.equal(f.anchorStep(st('READY', { memberLinked: true }), null, false), 'doneTax'));
check('화면 안 순서 — 소개 → 고르기 → 사업자 5칸 → 확인, 팝빌 아이디 → 비밀번호 → 확인', () => {
  const seq = ['intro'];
  for (let s = 'intro'; f.nextStep(s); s = f.nextStep(s)) seq.push(f.nextStep(s));
  assert.deepEqual(seq, ['intro', 'choose', 'bizno', 'names', 'address', 'business', 'contact', 'confirm']);
  assert.equal(f.nextStep('linkId'), 'linkPassword');
  assert.equal(f.nextStep('linkPassword'), 'linkConfirm');
  assert.equal(f.nextStep('linkConfirm'), null);
  assert.equal(f.nextStep('confirm'), null);
});
check('진행 막대 6칸', () => {
  assert.equal(f.STAGE_NAMES.length, 6);
  assert.deepEqual(['intro', 'bizno', 'pending', 'linkId', 'certificate', 'doneCash'].map(f.stageIndex), [0, 1, 2, 3, 4, 5]);
});
const sup = { bizNo: '', name: '한빛도배', ceo: '', address: '', bizType: '', bizKind: '', email: 'x', phone: '' };
check('화면마다 그 칸만 검사', () => {
  assert.deepEqual(Object.keys(f.supplierStepErrors('bizno', sup)), ['bizNo']);
  assert.deepEqual(Object.keys(f.supplierStepErrors('names', sup)), ['ceo']);
  assert.deepEqual(Object.keys(f.supplierStepErrors('contact', sup)).sort(), ['email', 'phone']);
  assert.equal(Object.keys(f.supplierStepErrors('confirm', sup)).length, 7);
  // 체크섬이 맞는 번호(코드랩타이거 744-50-01045)는 통과
  assert.deepEqual(f.supplierStepErrors('bizno', { ...sup, bizNo: '744-50-01045' }), {});
  assert.ok(f.supplierStepErrors('bizno', { ...sup, bizNo: '744-50-01046' }).bizNo);
});
check('팝빌 아이디 추천 · 비밀번호 조건', () => {
  assert.equal(f.suggestMemberId('744-50-01045'), 'dbm7445001045');
  assert.equal(f.suggestMemberId('123'), '');
  assert.deepEqual(f.linkStepErrors('linkId', { memberId: 'dbm7445001045', password: '', passwordConfirm: '' }), {});
  assert.ok(f.linkStepErrors('linkId', { memberId: 'ab', password: '', passwordConfirm: '' }).memberId);
  assert.deepEqual(Object.keys(f.linkStepErrors('linkPassword', { memberId: 'x', password: 'abc', passwordConfirm: 'abd' })).sort(), ['password', 'passwordConfirm']);
  assert.deepEqual(f.linkStepErrors('linkPassword', { memberId: 'x', password: 'dobae2026!', passwordConfirm: 'dobae2026!' }), {});
  assert.deepEqual(f.passwordChecks('dobae2026!').map((c) => c.ok), [true, true, true, true, true]);
  assert.deepEqual(f.passwordChecks('한글비번').map((c) => c.ok), [false, false, false, false, false]);
});
console.log(`\n${checks} checks passed`);
