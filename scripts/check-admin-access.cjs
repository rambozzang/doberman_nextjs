// Run with node scripts/check-admin-access.cjs. No network or account changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

let userInfo = null;
const context = {
  module: { exports: {} },
  require(name) {
    assert.equal(name, '@/lib/bossAuth');
    return { BossAuthManager: { getUserInfo: () => userInfo } };
  },
};
context.exports = context.module.exports;
const file = path.resolve(__dirname, '../src/lib/boss/admin.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, context, { filename: file });
const { isBossAdmin, currentBossIsAdmin } = context.module.exports;

for (const id of ['irambo7', 'judoli3', 'irambo5', 'wallpaper_man', 'irambo', 'irambo1', 'irambo99', 'irambo_test']) {
  assert.equal(isBossAdmin(id), true, id);
}
for (const id of [null, undefined, '', ' ', 'owner1', 'xirambo7', 'not-irambo7', 'IRAMBO7', ' irambo7']) {
  assert.equal(isBossAdmin(id), false, String(id));
}
assert.equal(currentBossIsAdmin(), false, 'server rendering has no browser identity');
context.window = {};
assert.equal(currentBossIsAdmin(), false, 'signed out');
userInfo = { userId: 'irambo99' };
assert.equal(currentBossIsAdmin(), true, 'prefix admin browser identity');
userInfo = { userId: 'owner1' };
assert.equal(currentBossIsAdmin(), false, 'ordinary browser identity');
console.log('21 admin identity and browser checks passed');
