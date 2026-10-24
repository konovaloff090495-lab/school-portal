import { constants, createCipheriv, createHash, createHmac, publicEncrypt, randomBytes, randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename } from 'node:fs/promises'
import { join } from 'node:path'

type WriterConfig = { public_key: string; operator: string; site: string; endpoint: string; ingest_token: string; spool: string }
async function config(): Promise<WriterConfig> {
  return JSON.parse(await readFile(process.env.LEAD_VAULT_CONFIG || '/etc/portfolio/proschools/lead-vault.json', 'utf8'))
}

/** Commit ciphertext and fsync before any external delivery. No private key is held by Next. */
export async function captureLeadSubmission(payload: Record<string, unknown>): Promise<string> {
  const cfg = await config()
  const publicKey = await readFile(cfg.public_key, 'utf8')
  const secret = randomBytes(64), iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', secret.subarray(0, 32), iv)
  const raw = JSON.stringify(payload)
  if (Buffer.byteLength(raw) > 65536) throw new Error('payload_too_large')
  const envelope = {
    v: 1, id: randomUUID(), operator: cfg.operator, site: cfg.site,
    created_at: new Date().toISOString(), key_id: createHash('sha256').update(publicKey.trim()).digest('hex').slice(0, 24),
    key: publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' }, secret).toString('base64'),
    iv: iv.toString('base64'), data: Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]).toString('base64'), mac: '',
  }
  envelope.mac = createHmac('sha256', secret.subarray(32)).update(['portfolio-lead-v1', envelope.id, envelope.operator, envelope.site, envelope.created_at, envelope.key_id, envelope.key, envelope.iv, envelope.data].join('\n')).digest('hex')
  await mkdir(cfg.spool, { recursive: true, mode: 0o700 })
  const path = join(cfg.spool, envelope.id + '.pending'), temp = path + '.incoming'
  const file = await open(temp, 'wx', 0o600)
  try { await file.writeFile(JSON.stringify(envelope)); await file.sync() } finally { await file.close() }
  await rename(temp, path)
  const directory = await open(cfg.spool, 'r')
  try { await directory.sync() } finally { await directory.close() }
  try {
    const response = await fetch(cfg.endpoint + '/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.ingest_token }, body: JSON.stringify(envelope), signal: AbortSignal.timeout(3000) })
    const receipt = await response.json()
    if (response.ok && receipt.stored && receipt.id === envelope.id) await rename(path, join(cfg.spool, envelope.id + '.json'))
  } catch { /* A scheduled relay retries the durable encrypted local copy. */ }
  return envelope.id
}

export async function recordVaultDelivery(id: string, status: 'sent' | 'failed' | 'unknown' | 'pending'): Promise<void> {
  try {
    const cfg = await config()
    const value = JSON.stringify({ id, channel: 'crm', status })
    const path = join(cfg.spool, id + '.delivery')
    const file = await open(path + '.incoming', 'w', 0o600)
    try { await file.writeFile(value); await file.sync() } finally { await file.close() }
    await rename(path + '.incoming', path)
    const response = await fetch(cfg.endpoint + '/delivery', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.ingest_token }, body: value, signal: AbortSignal.timeout(3000) })
    if (response.ok) await rename(path, path + '.json')
  } catch { /* Durable metadata is retried by the relay; the encrypted original is retained. */ }
}
