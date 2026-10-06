import nodemailer from 'nodemailer'
import { getSchoolBySlug, schools, type School } from '@/data/schools'
import { SU_PRODUCTS, SU_UTM_SOURCE } from '@/lib/su-products'

const FROM = 'hello@pro-schools.ru'
const BASE = 'https://pro-schools.ru'

export interface WelcomeLead {
  name: string
  email: string
  school?: string
  city?: string
  pageUrl?: string
  marketingAgreed: boolean
  confirmationToken?: string
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!)

function requestedSchool(lead: WelcomeLead): School | undefined {
  let slug: string | undefined
  try {
    const url = new URL(lead.pageUrl || '')
    if (url.hostname === 'pro-schools.ru' || url.hostname === 'www.pro-schools.ru') {
      slug = url.pathname.match(/^\/shkola\/([^/]+)\/?$/)?.[1]
    }
  } catch { /* Other forms do not have a school page. */ }
  if (slug) {
    try {
      const found = getSchoolBySlug(decodeURIComponent(slug))
      if (found && (!lead.school || found.name === lead.school)) return found
    } catch { /* Invalid URL slug cannot block the welcome message. */ }
  }
  if (lead.school) {
    return schools.find(s => s.name === lead.school && (!lead.city || s.city === lead.city))
  }
  return undefined
}

export function renderWelcome(lead: WelcomeLead) {
  const school = requestedSchool(lead)
  const safeName = escapeHtml(lead.name.trim().split(/\s+/)[0].slice(0, 60))
  const schoolUrl = school ? `${BASE}/shkola/${encodeURIComponent(school.slug)}/` : ''
  const partnerUrl = (key: string) => {
    const url = new URL(SU_PRODUCTS[key].path, 'https://school-university.com')
    url.search = new URLSearchParams({
      utm_source: SU_UTM_SOURCE, utm_medium: 'email',
      utm_campaign: 'proschools_welcome', utm_content: key,
    }).toString()
    return url.toString()
  }
  const unsubscribeUrl = lead.confirmationToken ? `${BASE}/api/mail/unsubscribe/?token=${lead.confirmationToken}` : ''
  const confirmUrl = lead.confirmationToken ? `${BASE}/api/mail/confirm/?token=${lead.confirmationToken}` : ''

  const schoolHtml = school ? `
    <div style="padding:22px;border:1px solid #dbeafe;border-radius:14px;background:#f8fbff;margin:24px 0">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Карточка школы, которую вы выбрали</div>
      <h2 style="font-size:20px;line-height:1.3;color:#0f172a;margin:8px 0 14px">${escapeHtml(school.name)}</h2>
      <p style="margin:5px 0;color:#334155">📍 ${escapeHtml(school.city)}${school.address ? `, ${escapeHtml(school.address)}` : ''}</p>
      ${school.grades ? `<p style="margin:5px 0;color:#334155">Классы: ${escapeHtml(school.grades)}</p>` : ''}
      <p style="margin:12px 0;color:#475569;line-height:1.55">${escapeHtml(school.description.slice(0, 350))}</p>
      <a href="${schoolUrl}" style="display:inline-block;margin-top:8px;padding:11px 17px;background:#0369a1;border-radius:8px;color:#fff;text-decoration:none;font-weight:600">Открыть карточку школы</a>
    </div>` : ''

  const featured = [
    ['online-school', 'Полная онлайн-школа', 'Живые и записанные уроки для 5–11 классов, наставник и аттестация.'],
    ['externat', 'Экстернат', 'Можно пройти два класса за год, аттестации — онлайн.'],
    ['attestaciya', 'Аттестация', 'Прикрепление и проверка знаний за класс.'],
    ['kursy-ege', 'Подготовка к ЕГЭ', 'Предметные курсы и пробные экзамены.'],
    ['kursy-oge', 'Подготовка к ОГЭ', 'Курсы для девятиклассников.'],
    ['kursy-dlya-detey', 'Курсы для детей', 'IT, творчество и другие направления.'],
  ] as const
  const synergyHtml = lead.marketingAgreed ? `
    <div style="padding:22px;border-radius:14px;background:#eef6ff;margin:24px 0">
      <h2 style="font-size:19px;color:#0f172a;margin:0 0 10px">Другие варианты обучения в «Синергии»</h2>
      <p style="color:#334155;line-height:1.55">Если выбранная школа вам не подойдёт, посмотрите форматы онлайн-обучения и дополнительные программы:</p>
      ${featured.map(([key, title, description]) => `<p style="margin:10px 0;line-height:1.45"><a href="${partnerUrl(key)}" style="color:#0369a1;font-weight:600">${title}</a> — ${description}</p>`).join('')}
      <p style="font-size:12px;color:#64748b">Это партнёрские предложения. Условия и стоимость уточняйте на странице программы.</p>
    </div>${confirmUrl ? `<div style="padding:18px;border:1px solid #cbd5e1;border-radius:10px"><b>Хотите получать подробности о программах?</b><p style="line-height:1.5">Подтвердите подписку. Затем придут четыре тематических письма за семь недель, не чаще одного в две недели. Без подтверждения продолжения не будет.</p><a href="${confirmUrl}" style="display:inline-block;padding:11px 17px;background:#0369a1;border-radius:8px;color:#fff;text-decoration:none">Подтвердить подписку</a></div>` : ''}` : ''

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"></head><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden"><div style="background:#0f3a5f;color:#fff;padding:23px 28px;font-size:20px;font-weight:bold">pro-schools.ru</div><div style="padding:28px"><h1 style="font-size:23px;margin:0 0 12px">${safeName}, спасибо за заявку!</h1><p style="line-height:1.6;color:#334155">Мы получили вашу заявку на pro-schools.ru. Ниже — информация, которая поможет продолжить выбор.</p>${schoolHtml}${synergyHtml}<p style="font-size:13px;line-height:1.5;color:#64748b">Данные карточки взяты из каталога pro-schools.ru. Актуальные условия приёма уточняйте в школе.</p><p style="font-size:13px;color:#64748b">Вопросы: <a href="mailto:${FROM}">${FROM}</a>.</p>${unsubscribeUrl ? `<p style="font-size:12px"><a href="${unsubscribeUrl}">Отписаться от рекламных писем</a></p>` : ''}</div></div></body></html>`

  const text = [
    `${lead.name.trim().split(/\s+/)[0]}, спасибо за заявку на pro-schools.ru!`,
    'Мы получили вашу заявку.',
    school ? `Школа: ${school.name}. ${school.city}, ${school.address}. Классы: ${school.grades}. ${schoolUrl}` : '',
    lead.marketingAgreed ? `Другие программы «Синергии»:\n${featured.map(([key, title]) => `${title}: ${partnerUrl(key)}`).join('\n')}` : '',
    confirmUrl ? `Для серии из четырёх тематических писем подтвердите подписку: ${confirmUrl}` : '',
    `Вопросы: ${FROM}`,
    unsubscribeUrl ? `Отписаться: ${unsubscribeUrl}` : '',
  ].filter(Boolean).join('\n\n')

  return { subject: school ? `Ваша заявка: ${school.name}` : 'Мы получили вашу заявку на pro-schools.ru', html, text }
}

export async function sendWelcome(lead: WelcomeLead): Promise<'sent' | 'not-configured'> {
  const password = process.env.PROSCHOOLS_SMTP_PASSWORD
  if (!password) return 'not-configured'
  const message = renderWelcome(lead)
  const unsubscribeUrl = lead.confirmationToken ? `${BASE}/api/mail/unsubscribe/?token=${lead.confirmationToken}` : ''
  const transport = nodemailer.createTransport({
    host: 'smtp.beget.com', port: 465, secure: true,
    auth: { user: FROM, pass: password },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  })
  try {
    await transport.sendMail({
      from: `Школы России <${FROM}>`, to: lead.email, replyTo: FROM,
      ...(unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
      ...message,
    })
  } finally {
    transport.close()
  }
  return 'sent'
}
