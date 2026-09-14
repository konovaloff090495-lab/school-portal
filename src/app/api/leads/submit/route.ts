import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendLeadToSynergy } from '@/lib/synergy'

const FORMSPREE_ID = process.env.FORMSPREE_ID

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, phone, email, question, school, city, source, pd_agreed, marketing_agreed,
      crm = true, utm, page_url, referrer, ym_client_id,
    } = body

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    // Forward to Formspree if configured
    if (FORMSPREE_ID) {
      fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name, phone, email, question,
          school: school ?? 'Не указана',
          source: source ?? 'Сайт',
          pd_agreed,
          marketing_agreed,
          _subject: `Заявка со школьного портала: ${source ?? school ?? 'общая'}`,
        }),
      }).catch(() => {})
    }

    const schoolLabel = school && school !== 'Не указана' ? school : null

    // CRM Синергии (GraphQL sendLead). B2B-формы (crm=false) туда не идут.
    let crmLine = ''
    if (crm !== false) {
      const commentParts: string[] = []
      if (schoolLabel) commentParts.push(`Школа: ${schoolLabel}${city ? ` (${city})` : ''}`)
      else if (city) commentParts.push(`Город: ${city}`)
      if (question) commentParts.push(`Комментарий: ${question}`)
      if (page_url) commentParts.push(`Страница: ${page_url}`)

      const result = await sendLeadToSynergy({
        name, phone, email,
        formTitle: source ?? 'Заявка с сайта pro-schools.ru',
        comment: commentParts.join('. ') || undefined,
        utm: utm && typeof utm === 'object' ? utm : undefined,
        pageUrl: page_url,
        referrer,
        ymClientId: ym_client_id,
        personalDataAgree: pd_agreed !== false,
        marketingAgree: marketing_agreed !== false,
        extra: { school: schoolLabel ?? undefined, city: city ?? undefined, source },
      })
      if (result.ok) {
        crmLine = `\n✅ CRM Синергии: лид #${result.id ?? '?'}`
      } else {
        console.error('[Synergy] sendLead failed:', result.error)
        crmLine = `\n⚠️ CRM Синергии: не отправлено (${result.error})`
      }
    }

    // Telegram notification
    let msg = `🔔 <b>Новая заявка</b>\n\n`
    msg += `👤 Имя: <b>${name}</b>\n`
    msg += `📞 Телефон: <b>${phone}</b>\n`
    msg += `📧 Email: ${email}\n`
    if (schoolLabel) msg += `🏫 Школа: ${schoolLabel}${city ? ` (${city})` : ''}\n`
    if (source) msg += `📍 Источник: <b>${source}</b>\n`
    if (question) msg += `\n💬 Вопрос: ${question}`
    msg += crmLine

    await sendTelegramMessage(msg)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('leads submit error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
