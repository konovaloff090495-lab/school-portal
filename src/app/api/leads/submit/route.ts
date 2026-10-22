import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendLeadToSynergy } from '@/lib/synergy'
import { sendWelcome } from '@/lib/welcome-mail'
import { crmMailer } from '@/lib/crm-mailer'
import { recordLeadSubmission } from '@/lib/lead-journal'

const FORMSPREE_ID = process.env.FORMSPREE_ID

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, phone, email, question, school, city, source, pd_agreed, marketing_agreed,
      crm = true, utm, page_url, referrer, ym_client_id, landing_url, first_referrer,
      form_id, product, qualification, growth_release, selected_route,
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
    let crmFailed = false
    let crmReceipt: { status: 'accepted' | 'failed' | 'not_requested'; id?: string | null; error?: string } = { status: 'not_requested' }
    if (crm !== false) {
      const commentParts: string[] = []
      if (schoolLabel) commentParts.push(`Школа: ${schoolLabel}${city ? ` (${city})` : ''}`)
      else if (city) commentParts.push(`Город: ${city}`)
      if (question) commentParts.push(`Комментарий: ${question}`)
      if (page_url) commentParts.push(`Страница: ${page_url}`)
      if (landing_url) commentParts.push(`Страница входа: ${landing_url}`)
      if (form_id || source) commentParts.push(`Форма: ${form_id || source}`)
      if (typeof selected_route === 'string') commentParts.push(`Выбранный маршрут: ${selected_route.slice(0, 80)}`)
      if (product) commentParts.push(`Продукт: ${product}`)
      if (qualification && typeof qualification === 'object') {
        for (const [key, label] of [['goal', 'Цель'], ['audience', 'Кому нужно обучение'], ['callback_time', 'Время звонка']]) {
          const value = qualification[key]
          if (typeof value === 'string' && value) commentParts.push(`${label}: ${value.slice(0, 160)}`)
        }
      }

      const result = await sendLeadToSynergy({
        name, phone, email,
        formTitle: source ?? 'Заявка с сайта pro-schools.ru',
        comment: commentParts.join('. ') || undefined,
        utm: utm && typeof utm === 'object' ? utm : undefined,
        pageUrl: page_url,
        landingUrl: landing_url,
        firstReferrer: first_referrer,
        formId: form_id || source,
        product,
        referrer,
        ymClientId: ym_client_id,
        personalDataAgree: pd_agreed !== false,
        marketingAgree: marketing_agreed === true,
        extra: { school: schoolLabel ?? undefined, city: city ?? undefined, source, qualification, growth_release, selected_route },
      })
      if (result.ok) {
        crmReceipt = { status: 'accepted', id: result.id }
        // Keep a receipt without contact details so accepted leads can be traced in Synergy.
        console.info('[Synergy] sendLead accepted:', JSON.stringify({ id: result.id, source: source ?? 'unknown' }))
        crmLine = `\n✅ CRM Синергии: лид #${result.id ?? '?'}`
      } else {
        crmReceipt = { status: 'failed', error: result.error }
        console.error('[Synergy] sendLead failed:', result.error)
        crmFailed = true
        crmLine = `\n⚠️ CRM Синергии: не отправлено (${result.error})`
      }
    }

    if (crm !== false) {
      try {
        await recordLeadSubmission(body, crmReceipt)
      } catch (error) {
        console.error('[Lead journal] write failed:', error instanceof Error ? error.message : 'unknown')
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

    if (crmFailed) {
      return NextResponse.json({ error: 'Заявка не дошла до CRM. Попробуйте ещё раз.' }, { status: 502 })
    }
    let confirmationToken: string | undefined
    if (crm !== false && marketing_agreed === true) {
      try {
        const enrolled = await crmMailer('enroll', { email, name, source: source ?? page_url ?? 'site', consent: true })
        if (enrolled.status === 'pending' || enrolled.status === 'active') confirmationToken = enrolled.token
      } catch (error) {
        console.error('[CRM mailer] enroll failed:', error instanceof Error ? error.message : 'unknown')
      }
    }
    try {
      const mail = await sendWelcome({
        name, email, school: schoolLabel ?? undefined, city,
        pageUrl: page_url, marketingAgreed: !!confirmationToken,
        confirmationToken,
      })
      console.info('[Welcome] result:', mail)
    } catch (error) {
      // A mail outage must not duplicate an accepted CRM lead when the visitor retries.
      console.error('[Welcome] send failed:', error instanceof Error ? error.message : 'unknown')
    }
    return NextResponse.json({ success: true, crm_id: crmReceipt.id ?? null })
  } catch (err) {
    console.error('leads submit error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
