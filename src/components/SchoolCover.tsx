'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { School } from '@/data/schools'
import { schoolCover } from '@/lib/school-media'

type Props = { school: Pick<School, 'slug' | 'type'> & Partial<Pick<School, 'website'>>; hero?: boolean }
export default function SchoolCover({ school, hero = false }: Props) {
  const [failed, setFailed] = useState(false)
  const cover = schoolCover(school, failed)
  return <div className="absolute inset-0 bg-white">
    <Image src={cover.src} alt={cover.alt} fill sizes={hero ? '(max-width: 1280px) 100vw, 1200px' : '(max-width: 768px) 100vw, 400px'} className={cover.label === 'Иллюстрация' || cover.label === 'Фото школы' ? 'object-cover object-top' : 'object-contain p-4'} onError={() => setFailed(true)} />
    <span className="absolute top-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm">{cover.label}</span>
  </div>
}
