import { crmMailer } from '@/lib/crm-mailer'

export const runtime = 'nodejs'

function page(message: string, button?: string, token?: string) {
  return new Response(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Рассылка pro-schools.ru</title><body style="font:16px Arial,sans-serif;max-width:560px;margin:60px auto;padding:20px;color:#0f172a"><h1>Письма о программах обучения</h1><p>${message}</p>${button && token ? `<form method="post"><input type="hidden" name="token" value="${token}"><button style="background:#0369a1;color:white;border:0;border-radius:8px;padding:12px 18px;cursor:pointer">${button}</button></form>` : ''}<p><a href="https://pro-schools.ru/">Вернуться на сайт</a></p></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!/^[\w-]{32,64}$/.test(token)) return page('Ссылка недействительна.')
  return page('Подтвердите, что хотите получать письма о программах онлайн-школы «Синергия». Не чаще одного письма в две недели; отписаться можно в любой момент.', 'Подтвердить подписку', token)
}

export async function POST(request: Request) {
  const form = await request.formData()
  const token = String(form.get('token') || '')
  if (!/^[\w-]{32,64}$/.test(token)) return page('Ссылка недействительна.')
  try {
    const result = await crmMailer('confirm', { token })
    return page(result.status === 'active' ? 'Подписка подтверждена. Первое письмо придёт через неделю.' : 'Подписка не активирована. Возможно, вы уже отписались или ссылка недействительна.')
  } catch { return page('Пока не удалось подтвердить подписку. Попробуйте позже.') }
}
