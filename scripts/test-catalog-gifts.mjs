import assert from 'node:assert/strict'
import path from 'node:path'
import {createJiti} from '../node_modules/jiti/lib/jiti.mjs'
const jiti=createJiti(import.meta.url,{alias:{'@':path.resolve('src')}})
const {CATALOG_GIFTS,dailyGiftClock,trackGift}=await jiti.import('../src/lib/catalog-gifts.ts')
assert.equal(CATALOG_GIFTS.length,10)
assert.equal(new Set(CATALOG_GIFTS.map(o=>o.id)).size,10)
assert.ok(CATALOG_GIFTS.every(o=>o.suProduct&&!o.partner&&o.badge&&o.bullets.length))
assert.deepEqual(dailyGiftClock(Date.parse('2026-10-26T20:59:59Z')),{day:'2026-10-26',date:'26.10',countdown:'00:00:01'})
assert.deepEqual(dailyGiftClock(Date.parse('2026-10-26T21:00:00Z')),{day:'2026-10-27',date:'27.10',countdown:'24:00:00'})
assert.equal(dailyGiftClock(Date.parse('2026-12-31T21:00:00Z')).day,'2027-01-01')
trackGift('view')
const calls=[]
globalThis.window={location:{pathname:'/shkoly/tipy/online/'},ym:(...args)=>calls.push(args)}
trackGift('lead_success','online-school');assert.equal(calls[0][2],'catalog_gifts_lead_success');assert.equal(calls[0][3].offer,'online-school')
window.ym=()=>{throw Error('Analytics unavailable')};trackGift('click')
delete globalThis.window
console.log(JSON.stringify({result:'passed',offers:10,midnightRollover:true,analyticsFailureSafe:true}))
