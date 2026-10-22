// Run with node scripts/check-answer-template.cjs. No browser, DB, or network writes.
// 답변 양식 자동 채우기(2026-10-23) — 앱 test/answer_template_fill_test.dart 와 같은 기대값
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
const t = load(path.join(root, 'src/lib/boss/answerTemplate.ts'));
const d = load(path.join(root, 'src/lib/boss/defaultTemplates.ts'));
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS ' + name); }

// 운영 요청 1997 · 1993 과 같은 모양
const full = { region: '경기도 의정부시', buildingType: '[아파트]', constructionLocation: '[전체],[거실],[방 3개],[주방]', area: 22, areaSize: 72.73,
  wallpaper: '[실크벽지]', ceiling: '전체', preferredDate: '2026-12-28', specialInfo: '기존 벽지 제거, 당일 시공', specialInfoDetail: '', hasItems: '짐이 있음' };
const bare = { region: '서울특별시 마포구', buildingType: '[빌라]', constructionLocation: '[방 1개]', area: '4.50', areaSize: 14.88, wallpaper: '[합지벽지]', ceiling: '전체' };

check('요청 값 다듬기', () => {
  const v = t.templateValues(full, '한빛도배');
  assert.equal(v.지역, '경기도 의정부시');
  assert.equal(v.건물, '아파트');
  assert.equal(v.면적, '22평 (72.73㎡)');
  assert.equal(v.범위, '전체 (거실 · 방 3개 · 주방)');
  assert.equal(v.벽지, '실크벽지');
  assert.equal(v.천장, '포함');
  assert.equal(v.희망일, '2026.12.28');
  assert.equal(v.추가, '기존 벽지 제거 · 당일 시공');
  assert.equal(v.짐, '있음');
  assert.equal(v.요약, '아파트 · 22평 · 실크벽지');
  assert.equal(v.회사, '한빛도배');
});
check('희망일이 없으면 협의 가능, 4.50평은 4.5평', () => {
  const v = t.templateValues(bare, '');
  assert.equal(v.희망일, '협의 가능');
  assert.equal(v.면적, '4.5평 (14.88㎡)');
  assert.equal(v.추가, '');
  assert.equal(v.짐, '');
});
check('값이 빈 칸이 든 줄은 빠지고, 모르는 칸은 그대로', () => {
  const v = t.templateValues(bare, '');
  const out = t.fillTemplate('- 추가 요청: {추가}\n- 벽지: {벽지}\n- 가격: {가격}\n{회사} 드림', v);
  assert.equal(out, '- 벽지: 합지벽지\n- 가격: {가격}');
});
check('기본 양식 3개 — 채우면 중괄호가 하나도 안 남는다', () => {
  assert.equal(d.DEFAULT_TEMPLATES.length, 3);
  for (const tpl of d.DEFAULT_TEMPLATES) {
    for (const req of [full, bare, {}]) {
      const v = t.templateValues(req, req === full ? '한빛도배' : '');
      const body = t.fillTemplate(tpl.content, v);
      const title = t.fillTitle(tpl.title, v);
      assert.ok(!/[{}]/.test(body), tpl.name + ' 본문: ' + body);
      assert.ok(!/[{}]/.test(title), tpl.name + ' 제목: ' + title);
      assert.ok(!/\n{3,}/.test(body), tpl.name + ' 빈 줄 겹침');
      assert.ok(!/  /.test(title), tpl.name + ' 제목 띄어쓰기');
    }
  }
});
check('기본 견적을 운영 요청으로 채운 모습', () => {
  const v = t.templateValues(full, '한빛도배');
  const tpl = d.DEFAULT_TEMPLATES[0];
  assert.equal(t.fillTitle(tpl.title, v), '경기도 의정부시 아파트 도배 견적 드립니다');
  const body = t.fillTemplate(tpl.content, v);
  assert.ok(body.includes('- 면적: 22평 (72.73㎡)'));
  assert.ok(body.includes('- 짐: 있음'));
  assert.ok(body.endsWith('감사합니다.\n한빛도배 드림'));
  // 회사가 없으면 '드림' 줄만 빠진다
  const noCo = t.fillTemplate(tpl.content, t.templateValues(bare, ''));
  assert.ok(noCo.endsWith('감사합니다.'));
  assert.ok(!noCo.includes('- 짐:'));
  assert.ok(!noCo.includes('- 추가 요청:'));
  assert.ok(noCo.includes('- 희망 일정: 협의 가능'));
});
check('제목에 지역만 있어도 자연스럽게', () => {
  assert.equal(t.fillTitle('{지역} {건물} 도배 견적 드립니다', t.templateValues({ region: '전국' }, '')), '전국 도배 견적 드립니다');
  assert.equal(t.fillTitle('{지역} {건물}', t.templateValues({}, '')), '도배 견적 보내드립니다');
});
check('서식(HTML) 양식은 줄을 빼지 않고 칸만 바꾼다', () => {
  const v = t.templateValues(bare, '');
  assert.equal(t.fillTemplateHtml('<p>- 벽지: {벽지}</p><p>- 짐: {짐}</p><p>{가격}</p>', v), '<p>- 벽지: 합지벽지</p><p>- 짐: </p><p>{가격}</p>');
  assert.equal(t.fillTemplateHtml('<p>{회사}</p>', t.templateValues({}, '<b>도배</b>')), '<p>&lt;b&gt;도배&lt;/b&gt;</p>');
});
console.log(`\n${checks} checks passed`);
