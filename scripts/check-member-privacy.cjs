// Synthetic data only. Run: node scripts/check-member-privacy.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
let clock = 0;
let sequence = 0;
const timers = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const out = { exports: {} };
  cache.set(file, out.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) => name.startsWith('@/') ? load(path.join(root, 'src', name.slice(2) + '.ts'))
    : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
  const context = { require: localRequire, module: out, exports: out.exports, AbortController, __dirname: path.dirname(file), __filename: file, process,
    setTimeout: (run, delay) => { const id = ++sequence; timers.set(id, { at: clock + delay, run }); return id; },
    clearTimeout: (id) => timers.delete(id) };
  vm.runInNewContext(code, context, { filename: file });
  return out.exports;
}
async function tick(ms) {
  const end = clock + ms;
  while (true) {
    const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
    if (!next) break;
    const [id, timer] = next; timers.delete(id); clock = timer.at;
    timer.run(); await Promise.resolve(); await Promise.resolve();
  }
  clock = end; await Promise.resolve(); await Promise.resolve();
}
const p = load(path.join(root, 'src/lib/boss/memberPrivacy.ts'));
const admin = load(path.join(root, 'src/lib/boss/platformAdmin.ts'));
const masked = { id: 1, userId: 'o***', name: '김***', phone: '010-****-****', email: 'o***@***', status: 'ACTIVE', privacyMasked: true, isSelf: false, isOperator: false };
const field = { memberId: 1, field: 'phone', value: '010-9999-8888', expiresInSeconds: 10 };
let checks = 0;
async function check(name, run) { timers.clear(); await run(); checks++; console.log('PASS ' + name); }
function harness(send) {
  const h = { state: null, current: true, requests: [], forbidden: 0 };
  h.session = new p.MemberRevealSession({
    current: () => h.current,
    change: (state) => { h.state = state; },
    forbidden: () => { h.forbidden++; },
    send: async (...args) => { h.requests.push(args); return send ? send(...args) : { ok: true, data: field }; },
  });
  return h;
}

(async () => {
  await check('old server raw member response fails closed', () => assert.equal(admin.parseMember({ ...masked, privacyMasked: undefined, phone: field.value }), null));
  await check('masked response preserves trusted self/operator metadata', () => assert.equal(admin.parseMember({ ...masked, isSelf: true }).isSelf, true));
  await check('malformed privacy metadata is rejected', () => assert.equal(admin.parseMember({ ...masked, isSelf: 'true' }), null));
  await check('masked self identity still blocks self suspension', () => assert.ok(admin.memberStatusBlockers({ ...masked, isSelf: true }, 'actual-admin', '사유', true).some(x => x.includes('본인'))));
  await check('operator metadata blocks suspension without revealing user ID', () => assert.ok(admin.memberStatusBlockers({ ...masked, isOperator: true }, 'actual-admin', '사유', true).some(x => x.includes('운영자'))));
  await check('one-field response accepted', () => assert.equal(p.parseMemberFieldValue(field, 1, 'phone').value, field.value));
  await check('different member response rejected', () => assert.equal(p.parseMemberFieldValue(field, 2, 'phone'), null));
  await check('different field response rejected', () => assert.equal(p.parseMemberFieldValue(field, 1, 'name'), null));
  await check('bulk value rejected', () => assert.equal(p.parseMemberFieldValue({ ...field, value: { phone: field.value } }, 1, 'phone'), null));
  for (const ttl of [0, -1, NaN, Infinity, '10']) await check('reject invalid TTL ' + ttl, () => assert.equal(p.parseMemberFieldValue({ ...field, expiresInSeconds: ttl }, 1, 'phone'), null));
  await check('TTL capped at ten seconds', () => assert.equal(p.parseMemberFieldValue({ ...field, expiresInSeconds: 3600 }, 1, 'phone').expiresInSeconds, 10));
  await check('missing private value allowed', () => assert.equal(p.parseMemberFieldValue({ ...field, value: null }, 1, 'phone').value, null));
  await check('initial render makes no reveal request', () => assert.equal(harness().requests.length, 0));
  await check('brief pointer pass never fetches the original', async () => {
    const h = harness(); h.session.show('a', 1, 'phone'); await tick(349); h.session.hide('a'); await tick(1000);
    assert.equal(h.requests.length, 0); assert.equal(h.state, null);
  });
  await check('hover and focus on the same field send once', async () => {
    const h = harness(); h.session.show('a', 1, 'phone'); h.session.show('a', 1, 'phone'); await tick(350);
    assert.equal(h.requests.length, 1); assert.equal(h.state.value, field.value);
  });
  await check('leaving removes the value and aborts the request', async () => {
    const h = harness(); h.session.show('a', 1, 'phone'); await tick(350); h.session.hide('a');
    assert.equal(h.state, null); assert.equal(h.requests[0][2].aborted, true);
  });
  await check('expired field is removed even while still hovered', async () => {
    const h = harness(); h.session.show('a', 1, 'phone'); await tick(350); await tick(9999);
    assert.equal(h.state.value, field.value); await tick(1); assert.equal(h.state, null);
  });
  await check('switching fields removes the previous original immediately', async () => {
    const h = harness(); h.session.show('a', 1, 'phone'); await tick(350); h.session.show('b', 2, 'name');
    assert.equal(h.state.key, 'b'); assert.equal(h.state.value, null);
    h.session.hide('a'); assert.equal(h.state.key, 'b');
  });
  await check('late aborted response cannot reveal again', async () => {
    let resolve;
    const h = harness(() => new Promise(r => { resolve = r; }));
    h.session.show('a', 1, 'phone'); await tick(350); h.session.hide('a');
    resolve({ ok: true, data: field }); await tick(0); assert.equal(h.state, null);
  });
  await check('previous member response cannot replace the next member', async () => {
    let resolve;
    const h = harness(() => new Promise(r => { resolve = r; }));
    h.session.show('a', 1, 'phone'); await tick(350); h.session.show('b', 2, 'name');
    resolve({ ok: true, data: field }); await tick(0);
    assert.equal(h.state.key, 'b'); assert.equal(h.state.value, null);
  });
  await check('signed-out or changed account cannot start a request', async () => {
    const h = harness(); h.current = false; h.session.show('a', 1, 'phone'); await tick(350);
    assert.equal(h.requests.length, 0); assert.equal(h.state, null);
  });
  await check('account change during response discards the original', async () => {
    let resolve;
    const h = harness(() => new Promise(r => { resolve = r; }));
    h.session.show('a', 1, 'phone'); await tick(350); h.current = false;
    resolve({ ok: true, data: field }); await tick(0); assert.equal(h.state, null);
  });
  await check('permission revocation clears the field and closes admin access', async () => {
    const h = harness(async () => ({ ok: false, failure: 'forbidden', message: '거절' }));
    h.session.show('a', 1, 'phone'); await tick(350);
    assert.equal(h.state, null); assert.equal(h.forbidden, 1);
  });
  await check('rate limit shows no original and never retries automatically', async () => {
    const h = harness(async () => ({ ok: false, failure: 'rejected', message: '잠시 제한되었습니다' }));
    h.session.show('a', 1, 'phone'); await tick(350); await tick(60_000);
    assert.equal(h.requests.length, 1); assert.equal(h.state.value, null); assert.equal(h.state.error, '잠시 제한되었습니다');
  });
  await check('wrong response identity is discarded by the session', async () => {
    const h = harness(async () => ({ ok: true, data: { ...field, memberId: 999 } }));
    h.session.show('a', 1, 'phone'); await tick(350); assert.equal(h.state.value, null); assert.ok(h.state.error);
  });
  await check('network failure never reveals a stale or cached value', async () => {
    const h = harness(async () => { throw Error('network'); });
    h.session.show('a', 1, 'phone'); await tick(350);
    assert.equal(h.state.value, null); assert.ok(h.state.error); assert.equal(h.requests.length, 1);
  });
  await check('boss API overrides shared API cache settings', async () => {
    const config = load(path.join(root, 'next.config.ts')).default;
    const rules = await config.headers();
    const bossRule = rules.findLast(r => r.source === '/api/boss/:path*');
    assert.ok(rules.indexOf(bossRule) > rules.findIndex(r => r.source === '/api/(.*)'));
    assert.ok(bossRule.headers.some(h => h.key === 'Cache-Control' && h.value.includes('no-store') && h.value.includes('private')));
  });
  console.log(`${checks} member privacy checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
