import { crmMailer } from '@/lib/crm-mailer'

export const runtime = 'nodejs'

async function unsubscribe(request: Request) {
  let token = new URL(request.url).searchParams.get('token') || ''
  if (request.method === 'POST' && !token) {
    const form = await request.formData().catch(() => null)
    token = String(form?.get('token') || '')
  }
  if (/^[\w-]{32,64}$/.test(token)) {
    try { await crmMailer('unsubscribe', { token }) } catch { return new Response('Отписка временно недоступна. Напишите на hello@pro-schools.ru.', { status: 503 }) }
  }
  return new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><title>Отписка</title><body style="font:16px Arial,sans-serif;max-width:560px;margin:60px auto;padding:20px"><h1>Вы отписаны</h1><p>Рекламные письма больше не придут.</p><a href="https://pro-schools.ru/">На главную</a></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

export const GET = unsubscribe
export const POST = unsubscribe
