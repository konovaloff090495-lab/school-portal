import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const require=createRequire(path.join(root,'package.json')),ts=require('typescript');
const out=path.join(root,'work/career/release/career-assets');await fs.mkdir(out,{recursive:true});
for(const name of ['submitLead','leadContext','leadProfile','phone','lead-consent','growth-tracking']){
 let s=await fs.readFile(path.join(root,'src/lib',name+'.ts'),'utf8');
 s=s.replaceAll("'@/lib/leadContext'","'./leadContext.js'").replaceAll("'@/lib/leadProfile'","'./leadProfile.js'").replaceAll("'@/lib/lead-consent'","'./lead-consent.js'").replaceAll("'./growth-tracking'","'./growth-tracking.js'");
 const r=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020},reportDiagnostics:true});
 if(r.diagnostics?.some(x=>x.category===ts.DiagnosticCategory.Error))throw Error('Transpile error: '+name);
 await fs.writeFile(path.join(out,name+'.js'),r.outputText);
}
await fs.copyFile(path.join(root,'scripts/career/client.js'),path.join(out,'client.js'));
console.log('Career canonical transport compiled');
