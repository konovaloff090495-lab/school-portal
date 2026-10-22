/** Check complete catalog coverage and real photo slots before release. */
import fs from 'node:fs'
import path from 'node:path'
import Module, { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
const require = createRequire(import.meta.url), ts = require('typescript')
const root = path.resolve(import.meta.dirname, '../..')
function load(relative) {
  const file = path.join(root, relative), m = new Module(file)
  m.filename = file; m.paths = Module._nodeModulePaths(root)
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText.replace(/require\("@\//g, 'require("'+root+'/src/')
  m._compile(code,file);return m.exports
}
const { schools } = load('src/data/schools.ts')
const { schoolCover, schoolPhotoCount } = load('src/lib/school-media.ts')
const sourcePublic = process.argv.find(v=>v.startsWith('--source-public='))?.split('=')[1] || path.join(root,'public')
const gitAssets = new Set(execFileSync('git',['ls-tree','-r','--name-only','HEAD','public'],{cwd:root,encoding:'utf8',maxBuffer:8e6}).trim().split('\n'))
let photos=0, official=0, illustrated=0
const covers = new Set(), errors=[]
for (const s of schools) {
  const count = schoolPhotoCount(s)
  if (count) {
    photos++
    if (!s.photoUrls) for(let i=1;i<=count;i++) if(!fs.existsSync(path.join(sourcePublic,`schools/${s.slug}-${i}.jpg`))) errors.push(s.slug+' missing photo '+i)
  } else {
    const cover=schoolCover(s); covers.add(cover.src)
    cover.label==='Иллюстрация'?illustrated++:official++
    if (!fs.existsSync(path.join(root,'public',cover.src)) && !gitAssets.has('public'+cover.src)) errors.push(s.slug+' missing cover '+cover.src)
  }
  covers.add(schoolCover(s,true).src)
}
for (const cover of covers) if (!fs.existsSync(path.join(root,'public',cover)) && !gitAssets.has('public'+cover)) errors.push('Missing fallback '+cover)
// Source-aware images must never be represented as branch gallery photos.
if(schoolPhotoCount({slug:'no-photo',type:'online',photoCount:3})!==0)errors.push('Unaudited photos requested')
if(schoolPhotoCount({slug:'submitted',type:'online',photoUrls:['/upload/a.jpg']})!==1)errors.push('Submitted photos lost')
if(schoolCover({slug:'broken',type:'online',website:'invalid'}).label!=='Иллюстрация')errors.push('Missing fallback')
console.log(JSON.stringify({schools:schools.length,photos,official,illustrated,covers:covers.size,errors},null,2))
if(errors.length)process.exit(1)
