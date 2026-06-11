import '@/styles/gdz.css'

export default function GdzLayout({ children }: { children: React.ReactNode }) {
  return <div className="gdz-scope">{children}</div>
}
