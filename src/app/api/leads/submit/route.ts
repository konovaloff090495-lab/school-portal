import { NextRequest, NextResponse } from 'next/server'
import { captureLeadSubmission, recordVaultDelivery } from '@/lib/lead-vault'
import { sendLeadToSynergy } from '@/lib/synergy'
import { sendWelcome } from '@/lib/welcome-mail'
import { crmMailer } from '@/lib/crm-mailer'
import { recordLeadSubmission } from '@/lib/lead-journal'

import { createHash } from 'node:crypto'
import { LEAD_CONSENT_VERSION, LEAD_FORM_POLICY_VERSION, PDN_DEFAULT_SELECTED, PDN_CONSENT_TEXT, MARKETING_CONSENT_TEXT } from '@/lib/lead-consent'

export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 65536) return NextResponse.json({ error: 'Слишком большой запрос' }, { status: 413 })
    const body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.byteLength(JSON.stringify(body)) > 65536) return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
    const {
      name, phone, email, question, school, city, source, pd_agreed, marketing_agreed,
      crm = true, utm, page_url, referrer, ym_client_id, landing_url, first_referrer,
      form_id, product, qualification, growth_release, selected_route,
    } = body

    if (typeof name !== 'string' || typeof phone !== 'string' || typeof email !== 'string' || !name.trim() || phone.replace(/\D/g, '').length < 10 || phone.replace(/\D/g, '').length > 15 || name.length > 120 || phone.length > 40 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    if (pd_agreed !== true) return NextResponse.json({ error: 'Необходимо согласие на обработку данных' }, { status: 400 })
    // Fail before forwarding if durable encrypted capture is unavailable.
    const receipt = {
      captured_at: new Date().toISOString(),
      document_version: LEAD_CONSENT_VERSION,
      presented_version: body.consent_version === LEAD_CONSENT_VERSION ? LEAD_CONSENT_VERSION : 'legacy-unversioned',
      pd_agreed: true,
      form_policy_version: body.form_policy_version === LEAD_FORM_POLICY_VERSION ? LEAD_FORM_POLICY_VERSION : null,
      pd_default_selected: body.form_policy_version === LEAD_FORM_POLICY_VERSION ? PDN_DEFAULT_SELECTED : null,
      pd_text: PDN_CONSENT_TEXT,
      pd_sha256: createHash('sha256').update(PDN_CONSENT_TEXT).digest('hex'),
      marketing_agreed: marketing_agreed === true,
      marketing_text: marketing_agreed === true ? MARKETING_CONSENT_TEXT : null,
      marketing_sha256: marketing_agreed === true ? createHash('sha256').update(MARKETING_CONSENT_TEXT).digest('hex') : null,
      recipient: crm === false ? 'pro-schools.ru editorial' : 'ANO VO Moscow University Synergy INN 9702078886',
    }
    const eventId = await captureLeadSubmission({ ...body, consent_receipt: receipt })

    const schoolLabel = school && school !== 'Не указана' ? school : null

    // CRM Синергии (GraphQL sendLead). B2B-формы (crm=false) туда не идут.
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
        personalDataAgree: pd_agreed === true,
        marketingAgree: marketing_agreed === true,
        extra: { school: schoolLabel ?? undefined, city: city ?? undefined, source, qualification, growth_release, selected_route },
      })
      if (result.ok) {
        crmReceipt = { status: 'accepted', id: result.id }
        // Keep a receipt without contact details so accepted leads can be traced in Synergy.
        console.info('[Synergy] sendLead accepted:', JSON.stringify({ id: result.id, event_id: eventId }))
      } else {
        crmReceipt = { status: 'failed', error: result.error }
        console.error('[Synergy] sendLead failed:', JSON.stringify({ event_id: eventId }))
        crmFailed = true
      }
    }

    if (crm !== false) {
      try {
        await recordLeadSubmission({ event_id: eventId }, crmReceipt)
      } catch (error) {
        console.error('[Lead journal] write failed:', error instanceof Error ? error.message : 'unknown')
      }
    }

    // Telegram notices are queued by the isolated vault, without contact details.
    if (crm !== false) await recordVaultDelivery(eventId, crmFailed ? 'failed' : 'sent')

    if (crmFailed) {
      return NextResponse.json({ error: 'Заявка не дошла до CRM. Попробуйте ещё раз.' }, { status: 502 })
    }
    let confirmationToken: string | undefined
    if (crm !== false && marketing_agreed === true) {
      try {
        const enrolled = await crmMailer('enroll', { email, name, source: source ?? page_url ?? 'site', consent: true })
        if (enrolled.status === 'pending' || enrolled.status === 'active') confirmationToken = enrolled.token
      } catch (error) {
        console.error('[CRM mailer] enroll failed:', JSON.stringify({ event_id: eventId }))
      }
    }
    try {
      await sendWelcome({
        name, email, school: schoolLabel ?? undefined, city,
        pageUrl: page_url, marketingAgreed: !!confirmationToken,
        confirmationToken,
      })
      console.info('[Welcome] completed:', JSON.stringify({ event_id: eventId }))
    } catch (error) {
      // A mail outage must not duplicate an accepted CRM lead when the visitor retries.
      console.error('[Welcome] send failed:', JSON.stringify({ event_id: eventId }))
    }
    return NextResponse.json({ success: true, crm_id: crmReceipt.id ?? null })
  } catch (err) {
    console.error('leads submit error:', err instanceof Error ? err.name : 'unknown')
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
