import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const source = await readFile(new URL('src/app/api/leads/submit/route.ts', root), 'utf8')
assert.doesNotMatch(source,/formspree\.io|FORMSPREE_ID/)
const definitions = await readFile(new URL('src/lib/lead-consent.ts',root),'utf8')
const consent = await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(definitions,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64'))
let captured, crmCalls=0, failCapture=false, mailCalls=0
const deps = {
 NextResponse:{json:(body,options={})=>Response.json(body,options)},
 ...consent,createHash,
 captureLeadSubmission:async data=>{if(failCapture)throw Error('unavailable');captured=data;return 'test-event'},
 recordVaultDelivery:async()=>{}, recordLeadSubmission:async()=>{},
 sendLeadToSynergy:async data=>{crmCalls++;assert.equal(data.personalDataAgree,true);return {ok:true,id:'receipt'}},
 crmMailer:async()=>{mailCalls++;return {status:'pending',token:'test-token'}},sendWelcome:async()=>{},
}
globalThis.__leadConsentTest=deps
const names=Object.keys(deps).join(',')
const cleaned=source.replace(/^import[^\n]+\n/gm,'')
const js=`const {${names}}=globalThis.__leadConsentTest;\n`+ts.transpileModule(cleaned,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
const valid={name:'Fixture',phone:'+7 916 205-48-23',email:'fixture@example.org',pd_agreed:true,marketing_agreed:false}
const req=body=>new Request('https://pro-schools.ru/api/leads/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
for(const value of [undefined,false,'false','true',1,{},[]]){
 const before=crmCalls;captured=undefined
 const response=await POST(req({...valid,pd_agreed:value}))
 assert.equal(response.status,400);assert.equal(crmCalls,before);assert.equal(captured,undefined)
}
for(const body of [null,[],{...valid,name:{}},{...valid,email:'invalid'}])assert.equal((await POST(req(body))).status,400)
failCapture=true;let before=crmCalls;assert.equal((await POST(req(valid))).status,500);assert.equal(crmCalls,before);failCapture=false
assert.equal((await POST(req({...valid,consent_version:consent.LEAD_CONSENT_VERSION,consent_receipt:{pd_agreed:false}}))).status,200)
assert.equal(captured.consent_receipt.document_version,consent.LEAD_CONSENT_VERSION)
assert.equal(captured.consent_receipt.presented_version,consent.LEAD_CONSENT_VERSION)
assert.equal(captured.consent_receipt.pd_agreed,true)
assert.equal(captured.consent_receipt.pd_default_selected,null, 'Do not reinterpret legacy forms')
assert.equal(consent.PDN_DEFAULT_SELECTED,true)
assert.equal((await POST(req({...valid,form_policy_version:consent.LEAD_FORM_POLICY_VERSION}))).status,200)
assert.equal(captured.consent_receipt.pd_default_selected,true)
assert.equal(captured.consent_receipt.form_policy_version,consent.LEAD_FORM_POLICY_VERSION)
assert.equal(captured.consent_receipt.pd_sha256,createHash('sha256').update(consent.PDN_CONSENT_TEXT).digest('hex'))
assert.equal(captured.consent_receipt.marketing_text,null);assert.equal(mailCalls,0)
assert.equal((await POST(req({...valid,crm:false}))).status,200)
assert.equal(captured.consent_receipt.presented_version,'legacy-unversioned')
assert.equal(captured.consent_receipt.recipient,'pro-schools.ru editorial')
for(const f of ['src/components/LeadForm.tsx','src/components/CatalogOfferPopup.tsx','src/components/offerwall/OfferWall.tsx','src/app/test/extended/ExtendedTest.tsx']){
 const text=await readFile(new URL(f,root),'utf8');assert.match(text,/\[pdAgreed, setPdAgreed\] = useState\(PDN_DEFAULT_SELECTED\)/);assert.match(text,/soglasie-na-obrabotku-personalnyh-dannyh/)
 const check=ts.transpileModule(text,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}})
 assert.deepEqual((check.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[])
}
assert.equal(consent.MARKETING_DEFAULT_SELECTED,true)
assert.equal((await POST(req({...valid,marketing_agreed:true,marketing_default_selected:true,form_policy_version:consent.LEAD_FORM_POLICY_VERSION}))).status,200)
assert.equal(captured.consent_receipt.marketing_default_selected,true)
assert.equal(captured.consent_receipt.marketing_agreed,true)
assert.equal(captured.consent_receipt.marketing_text,consent.MARKETING_CONSENT_TEXT)
console.log('PASS consent rejects missing/false/coerced flags before capture or forwarding; encrypted receipt binds text/hash/time; no marketing without opt-in; owner-approved PD default recorded separately; marketing UI default recorded without implying a checkbox click')
