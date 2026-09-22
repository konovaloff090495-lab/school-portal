import '@/styles/gdz.css'
import '@/styles/olimp.css'
import '@/styles/exam.css'

// Раздел ЕГЭ/ОГЭ живёт в стилях ГДЗ/Олимпиад (gdz-scope): тёплая палитра, «контент + рекламная рельса».
export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <div className="gdz-scope olimp-scope exam-scope">{children}</div>
}
