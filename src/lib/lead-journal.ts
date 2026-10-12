import { randomUUID } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const journalPath = process.env.LEAD_JOURNAL_PATH || (
  process.env.NODE_ENV === 'production'
    ? '/var/lib/school-portal/lead-journal.jsonl'
    : join(process.cwd(), 'data-private', 'lead-journal.jsonl')
)

/** Private, append-only source for reconciling website submissions against the CRM export. */
export async function recordLeadSubmission(
  body: Record<string, unknown>,
  crm: { status: 'accepted' | 'failed' | 'not_requested'; id?: string | null; error?: string },
): Promise<void> {
  await mkdir(dirname(journalPath), { recursive: true, mode: 0o700 })
  const entry = {
    event_id: randomUUID(),
    ts: new Date().toISOString(),
    site: 'pro-schools.ru',
    ...body,
    crm,
  }
  await appendFile(journalPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 })
}
