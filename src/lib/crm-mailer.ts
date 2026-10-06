import { spawn } from 'node:child_process'
import path from 'node:path'

type MailerAction = 'enroll' | 'confirm' | 'unsubscribe' | 'reserve-welcome'

export async function crmMailer(action: MailerAction, payload: Record<string, unknown>): Promise<{ status: string; token?: string }> {
  const script = path.join(process.cwd(), 'scripts', 'crm-mailer.py')
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [script, action], { stdio: ['pipe', 'pipe', 'pipe'] })
    let output = ''
    let error = ''
    const timer = setTimeout(() => child.kill(), 5000)
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk })
    child.on('error', reject)
    child.on('close', code => {
      clearTimeout(timer)
      if (code !== 0) return reject(new Error(`CRM mailer ${action} failed: ${error.slice(0, 120)}`))
      try { resolve(JSON.parse(output)) } catch { reject(new Error(`CRM mailer ${action} returned invalid data`)) }
    })
    child.stdin.end(JSON.stringify(payload))
  })
}
