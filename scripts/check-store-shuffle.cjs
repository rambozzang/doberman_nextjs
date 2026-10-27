// Run with node scripts/check-store-shuffle.cjs. No browser, DB, or network writes.
// 도배 용품 — 열 때마다 상품 순서를 섞는다(2026-10-27)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const src = fs.readFileSync(path.join(__dirname, '../src/app/guides/dobae-supplies/StoreCatalogView.tsx'), 'utf8');
const fn = src.slice(src.indexOf('export function shuffleProducts'), src.indexOf('export default function'));
const js = ts.transpileModule(fn.replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const shuffleProducts = new Function(js + '; return shuffleProducts;')();
const list = [1, 2, 3, 4, 5, 6];
const s = shuffleProducts(list);
assert.deepEqual([...s].sort(), list, '같은 상품');
assert.deepEqual(list, [1, 2, 3, 4, 5, 6], '원본은 그대로');
const firsts = new Set(Array.from({ length: 40 }, () => shuffleProducts(list)[0]));
assert.ok(firsts.size > 2, '맨 앞 상품이 한 가지로 고정되지 않는다');
console.log('PASS 도배 용품 섞기 3');
