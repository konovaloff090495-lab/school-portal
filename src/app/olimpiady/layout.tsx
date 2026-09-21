import '@/styles/gdz.css'
import '@/styles/olimp.css'

// Раздел «Олимпиады» живёт в тех же стилях, что ГДЗ (gdz-scope): тёплая палитра,
// сетка «контент + рекламная рельса». Свои дополнения — в olimp.css.
export default function OlimpLayout({ children }: { children: React.ReactNode }) {
  return <div className="gdz-scope olimp-scope">{children}</div>
}
