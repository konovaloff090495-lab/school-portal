const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cohort=JSON.parse(fs.readFileSync('src/data/blog-ad-cohort.json'));
const code=fs.readFileSync('public/monetization/blog-experiment.js','utf8');
assert(cohort.length>100);for(const slug of cohort)assert(code.includes(JSON.stringify(slug)));
function run({stored=null,preview='',path='/blog/'+cohort[0]+'/',storageFail=false,phone=false,narrow=phone}={}){
 const attrs={},params=[];let value=stored;
 const window={ym(...x){params.push(x)},navigator:{userAgentData:{mobile:phone}},matchMedia(){return {matches:narrow}}};
 const ctx=vm.createContext({window,location:{pathname:path,search:preview},document:{documentElement:{setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]}}},URLSearchParams,Set,Uint32Array,decodeURIComponent,crypto:{getRandomValues(x){x[0]=1;return x}},localStorage:{getItem(){if(storageFail)throw Error();return value},setItem(k,v){value=v}}});
 vm.runInContext(code,ctx);return{window,attrs,params,value,ctx};
}
for(const arm of ['A','B']){const r=run({stored:arm});const a=r.window.__psBlogAds.getActive();assert.equal(a.arm,arm);assert.equal(a.statId,arm==='A'?611060201:611060202);assert.equal(r.params.length,1);vm.runInContext(code,r.ctx);assert.equal(r.params.length,1)}
assert.equal(run().value,'B');assert.equal(run({storageFail:true}).window.__psBlogAds.getActive().arm,'X');
for(const arm of ['A','B']){const r=run({preview:'?ps_blog_preview='+arm,stored:'A'});assert.equal(r.window.__psBlogAds.getActive().qa,true);assert.equal(r.value,'A');assert.equal(r.params[0][2].ps_blog_mid_20261106,'QA-'+arm)}
for(const path of ['/shkoly/','/shkola/example/','/blog/not-in-cohort/','/uchebnik/']){const r=run({path});assert.equal(r.window.__psBlogAds.getActive(),null);assert.equal(r.params.length,0)}
const r=run({stored:'A'});r.ctx.location.pathname='/shkoly/';assert.equal(r.window.__psBlogAds.getActive(),null);
console.log('PASS blog cohort assignment, persistence, QA exclusion, storage failure and SPA scope exit');
const book='/gdz/6-klass/matematika/vilenkin/';
for(const arm of ['A','B']){
 const device=run({stored:arm,path:book,phone:true});
 const candidate=device.window.__psBlogAds.getActive();
 assert.equal(candidate.statId,arm==='A'?611200201:611200202);
 assert.equal(device.params[0][2].ps_learning_20261120,arm);
 const preview=run({path:book,narrow:true,preview:'?ps_learning_preview='+arm});
 assert.equal(preview.window.__psBlogAds.getActive().qa,true);
 assert.equal(preview.params.length,0);
}
assert.equal(run({path:book}).window.__psBlogAds.getActive(),null);
assert.equal(run({path:book,phone:true,storageFail:true}).window.__psBlogAds.getActive().arm,'X');
assert.equal(run({path:'/uchebnik/istoriya/',phone:true}).window.__psBlogAds.getActive().statId,611200204);
console.log('PASS GDZ phone assignment, QA and separate textbook measurement');
