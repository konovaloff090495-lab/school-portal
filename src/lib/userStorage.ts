// Утилиты для хранения данных пользователя в localStorage
// Используется на страницах /test/, /test/extended/, /lk/

export interface UserProfile {
  name: string
  email: string
  phone?: string
  createdAt: string
}

export interface ExpressTestResult {
  primary: string      // RiasecType
  secondary: string
  scores: Record<string, number>
  completedAt: string
}

export interface ExtendedTestResult {
  primary: string
  secondary: string
  scores: Record<string, number>
  learningStyle: string
  socialType: string
  motivationType: string
  topSkills: string[]
  bestEnvironment: string
  careerPaths: { title: string; fit: number }[]
  completedAt: string
}

const KEYS = {
  USER: 'ps_user',
  EXPRESS: 'ps_test_express',
  EXTENDED: 'ps_test_extended',
} as const

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getUser(): UserProfile | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(KEYS.USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveUser(user: UserProfile): void {
  if (!isBrowser()) return
  localStorage.setItem(KEYS.USER, JSON.stringify(user))
}

export function getExpressResult(): ExpressTestResult | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(KEYS.EXPRESS)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveExpressResult(result: ExpressTestResult): void {
  if (!isBrowser()) return
  localStorage.setItem(KEYS.EXPRESS, JSON.stringify(result))
}

export function getExtendedResult(): ExtendedTestResult | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(KEYS.EXTENDED)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveExtendedResult(result: ExtendedTestResult): void {
  if (!isBrowser()) return
  localStorage.setItem(KEYS.EXTENDED, JSON.stringify(result))
}

export function clearAll(): void {
  if (!isBrowser()) return
  localStorage.removeItem(KEYS.USER)
  localStorage.removeItem(KEYS.EXPRESS)
  localStorage.removeItem(KEYS.EXTENDED)
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}
