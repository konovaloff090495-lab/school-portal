// Маска и валидация телефона — общий модуль для лид-форм и поп-апов.

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits
  if (local.length === 0) return '+7 ('
  if (local.length <= 3)  return `+7 (${local}`
  if (local.length <= 6)  return `+7 (${local.slice(0,3)}) ${local.slice(3)}`
  if (local.length <= 8)  return `+7 (${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6)}`
  return `+7 (${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6,8)}-${local.slice(8,10)}`
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 11) return 'Введите полный номер телефона'

  const local = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits.slice(0, 10)

  if (!['3','4','8','9'].includes(local[0]))
    return 'Некорректный номер телефона'

  const area = local.slice(0, 3)
  const rest  = local.slice(3)

  const badAreas = ['000','111','222','333','444','555','666','777','888','999','123','321']
  if (badAreas.includes(area))
    return 'Некорректный номер телефона'

  if (/^(\d)\1{9}$/.test(local))
    return 'Некорректный номер телефона'

  if (/^(\d)\1{6}$/.test(rest))
    return 'Некорректный номер телефона'

  if (['1234567','2345678','3456789','9876543','8765432','7654321'].includes(rest))
    return 'Некорректный номер телефона'

  return null
}
