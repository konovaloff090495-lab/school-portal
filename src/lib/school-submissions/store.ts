import 'server-only'
import { spawn } from 'node:child_process'
import path from 'node:path'
export const storeDirectory = process.env.SCHOOL_SUBMISSIONS_DIR || (process.env.NODE_ENV === 'production' ? '/var/lib/school-portal/school-submissions' : path.join(process.cwd(), 'data-private/school-submissions'))
export class SubmissionError extends Error { constructor(message: string, public status = 400) { super(message) } }
export function submissions<T = Record<string, unknown>>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [path.join(process.cwd(), 'scripts/school-submissions.py'), action], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, SCHOOL_SUBMISSIONS_DIR: storeDirectory } })
    let output = '', error = ''
    const timer = setTimeout(() => child.kill(), 15000)
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk })
    child.on('error', err => { clearTimeout(timer); reject(err) })
    child.on('close', code => {
      clearTimeout(timer)
      try {
        const result = JSON.parse(output)
        if (result.error) return reject(new SubmissionError(result.error, result.forbidden ? 403 : 400))
        if (code !== 0) throw new Error('Worker failed')
        resolve(result)
      } catch (err) {
        if (err instanceof SubmissionError) return reject(err)
        console.error('[School applications] worker failure:', action, error.slice(0,120))
        reject(new SubmissionError('Не удалось обработать заявку. Попробуйте позже.', 503))
      }
    })
    child.stdin.on('error', () => {})
    child.stdin.end(JSON.stringify(payload))
  })
}

// The durable scanner is also run by cron, so an interrupted request cannot lose a card.
export function wakeSchoolModerator() {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return
  const child=spawn('python3',[path.join(process.cwd(),'scripts/school-submissions.py'),'telegram-run'],{detached:true,stdio:'ignore',env:{...process.env,SCHOOL_SUBMISSIONS_DIR:storeDirectory}})
  child.on('error',()=>console.error('[School moderation] notification worker unavailable'))
  child.unref()
}
