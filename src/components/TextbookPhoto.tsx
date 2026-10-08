import Image from 'next/image'
import type { TextbookImageData } from '@/lib/textbook-images'

export default function TextbookPhoto({ image, caption, eager = false }: {
  image: TextbookImageData
  caption?: string
  eager?: boolean
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <Image
        src={image.url}
        alt={image.alt}
        width={image.width}
        height={image.height}
        unoptimized
        loading={eager ? 'eager' : 'lazy'}
        className="w-full max-h-[420px] object-contain"
      />
      <figcaption className="bg-white px-4 py-3 text-xs text-slate-500 leading-relaxed border-t border-slate-200">
        {caption && <span className="block text-sm text-slate-700 font-medium mb-1">{caption}</span>}
        <a href={image.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">
          {image.author}
        </a>
        {' · Wikimedia Commons · '}
        {image.licenseUrl ? (
          <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">{image.license}</a>
        ) : image.license}
      </figcaption>
    </figure>
  )
}
