'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApproveButtonProps {
  filename: string
  adminSecret: string
}

export default function ApproveButton({ filename, adminSecret }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: adminSecret,
        },
        body: JSON.stringify({ filename }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Ошибка')
      } else {
        setDone(true)
        router.refresh()
      }
    } catch {
      setError('Не удалось подключиться к серверу')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <span className="text-green-600 text-sm font-medium">Одобрено ✓</span>
  }

  return (
    <div>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-60 cursor-pointer"
      >
        {loading ? 'Одобряем...' : 'Одобрить'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
