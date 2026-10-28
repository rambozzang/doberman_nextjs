const {test, afterEach} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve('src/lib/consultation.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let customerToken = 'customer-test-token', expertToken = 'expert-test-token';
const loaded = new Module(filename,module);
loaded.require = name => name === '@/lib/auth' ? {AuthManager:{getToken:()=>customerToken}} : name === '@/lib/bossAuth' ? {BossAuthManager:{getToken:()=>expertToken}} : require(name);
loaded._compile(compiled,filename);
const {consultationApi,consultationPath,validateVisitSlots,visitLabel} = loaded.exports;
const now = Date.parse('2026-10-28T00:00:00+09:00');
const originalFetch = global.fetch;
afterEach(()=>{global.fetch=originalFetch;customerToken='customer-test-token';expertToken='expert-test-token';});
test('room scope keeps expert ID as an escaped path segment',()=>{assert.equal(consultationPath(52,'expert/a?#'),'/consultations/52/expert%2Fa%3F%23');});
test('invalid request and blank expert are rejected before network',()=>{for(const id of [0,-1,NaN,1.2])assert.throws(()=>consultationPath(id,'expert'));assert.throws(()=>consultationPath(2,' '));});
test('1–3 future Korea-local times accepted independently of machine timezone',()=>{assert.equal(validateVisitSlots(['2026-10-28T00:01','2026-10-28T01:00','2026-10-28T23:59'],now),null);});
test('empty, excessive and repeated options rejected',()=>{assert.ok(validateVisitSlots([],now));assert.ok(validateVisitSlots(Array(4).fill('2026-11-01T10:00'),now));assert.ok(validateVisitSlots(Array(2).fill('2026-11-01T10:00'),now));});
test('past, now, UTC suffix and invalid leap dates rejected',()=>{for(const time of ['2026-10-27T23:59','2026-10-28T00:00','2026-11-01T10:00Z','2027-02-29T10:00','2026-11-31T10:00','2026-12-01T24:00'])assert.ok(validateVisitSlots([time],now),time);});
test('calendar valid leap date accepted and label uses Korea time',()=>{assert.equal(validateVisitSlots(['2028-02-29T10:00'],Date.parse('2028-02-01T00:00:00+09:00')),null);assert.match(visitLabel('2026-11-01T14:30'),/2:30/);});
function stub(response={visits:[],customerId:null}) {const calls=[];global.fetch=async(url,options)=>{calls.push({url,...options});return{ok:true,json:async()=>({success:true,data:response})};};return calls;}
test('WEB appointment read uses customer bearer, root API and no-store',async()=>{const calls=stub();await consultationApi('WEB',5,'boss').get();assert.equal(calls[0].url,'/api/boss/consultations/5/boss');assert.equal(calls[0].headers.Authorization,'Bearer customer-test-token');assert.equal(calls[0].cache,'no-store');});
test('APP proposal uses boss bearer and exact slots payload',async()=>{const calls=stub();await consultationApi('APP',5,'boss').propose(['2026-11-01T10:00'],'현장에서 만나요');assert.equal(calls[0].headers.Authorization,'Bearer expert-test-token');assert.equal(calls[0].method,'POST');assert.deepEqual(JSON.parse(calls[0].body),{slots:['2026-11-01T10:00'],note:'현장에서 만나요'});});
test('confirmation/cancellation target same scoped visit and never chat transport',async()=>{const calls=stub();const api=consultationApi('WEB',5,'boss');await api.confirm(81,'2026-11-01T10:00');await api.cancel(81);assert.equal(calls[0].url,'/api/boss/consultations/5/boss/visits/81/confirm');assert.deepEqual(JSON.parse(calls[0].body),{slot:'2026-11-01T10:00'});assert.equal(calls[1].url,'/api/boss/consultations/5/boss/visits/81/cancel');assert.equal(calls[1].body,'{}');});
test('conversion sends reviewed fields in POST body; PII never enters URL',async()=>{const calls=stub({id:17,alreadyLinked:true});const api=consultationApi('APP',5,'boss');await api.draft();const result=await api.saveCustomer({name:'테스트',phone:'01000000000',email:'test@example.invalid',address1:'테스트 주소'});assert.equal(result.id,17);assert.equal(calls[0].url,'/api/boss/consultations/5/boss/customer-draft');assert.equal(calls[1].url,'/api/boss/consultations/5/boss/customer');assert.equal(JSON.parse(calls[1].body).email,'test@example.invalid');});
test('missing role token prevents network and does not fall back to other role',async()=>{let called=false;global.fetch=async()=>{called=true;};customerToken=null;await assert.rejects(()=>consultationApi('WEB',5,'boss').get(),/로그인/);assert.equal(called,false);});
test('application and HTTP errors never report success',async()=>{for(const [ok,data] of [[true,{success:false,message:'권한이 없습니다.'}],[false,{success:true,data:{}}],[true,{success:true,data:null}]]){global.fetch=async()=>({ok,json:async()=>data});await assert.rejects(()=>consultationApi('APP',5,'boss').get());}});

test('server ISO seconds render as the same Korean appointment time',()=>{assert.equal(visitLabel('2026-11-01T14:30:00'),visitLabel('2026-11-01T14:30'));});
test('malformed server dates show an explanatory fallback without crashing chat',()=>{assert.equal(visitLabel('not-a-date'),'날짜를 확인해 주세요');});

test('appointments beyond the backend 365-day limit are rejected',()=>{assert.ok(validateVisitSlots(['2027-10-29T00:00'],now));assert.equal(validateVisitSlots(['2027-10-28T00:00'],now),null);});
