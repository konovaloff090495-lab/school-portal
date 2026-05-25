import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

const FORMSPREE_ID = process.env.FORMSPREE_ID

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, question, school, pd_agreed, marketing_agreed } = body

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
          pd_agreed,
          marketing_agreed,
          _subject: `Заявка со школьного портала: ${school ?? 'общая'}`,
        }),
      }).catch(() => {})
    }

    // Telegram notification
    const schoolLabel = school && school !== 'Не указана' ? school : null
    let msg = `🔔 <b>Новая заявка</b>\n\n`
    msg += `👤 Имя: <b>${name}</b>\n`
    msg += `📞 Телефон: <b>${phone}</b>\n`
    msg += `📧 Email: ${email}\n`
    if (schoolLabel) msg += `🏫 Школа: ${schoolLabel}\n`
    if (question) msg += `\n💬 Вопрос: ${question}`

    await sendTelegramMessage(msg)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('leads submit error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
