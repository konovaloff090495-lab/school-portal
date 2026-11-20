import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function importSource(path) {
  const text = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const result = ts.transpileModule(text, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(result.outputText).toString('base64'))
}

const { POST } = await importSource('src/app/api/leads/submit/route.ts')
assert.equal(POST().status, 410)

const { LEAD_CONSENT_VERSION, PDN_CONSENT_TEXT, MARKETING_CONSENT_TEXT } =
  await importSource('src/lib/lead-consent.ts')
assert.equal(LEAD_CONSENT_VERSION, '2026-11-20-v3')
assert.match(MARKETING_CONSENT_TEXT, /ИП Герасимова Евгения Сергеевича/)
assert.doesNotMatch(PDN_CONSENT_TEXT + MARKETING_CONSENT_TEXT, /Синерг|АНО ВО|9702078886|1257700508493/i)
console.log('Closed lead endpoint and current consent verified')
