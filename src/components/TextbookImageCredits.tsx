import type { TextbookImageData } from '@/lib/textbook-images'

export default function TextbookImageCredits({ images }: { images: Array<TextbookImageData | null> }) {
  const unique = [...new Map(images.filter((image): image is TextbookImageData => Boolean(image)).map(image => [image.source, image])).values()]
  if (!unique.length) return null

  return (
    <details className="mt-10 text-xs text-slate-500">
      <summary className="cursor-pointer font-medium hover:text-slate-700">Авторы и лицензии изображений</summary>
      <p className="mt-2">Миниатюры в карточках кадрированы для оформления.</p>
      <ul className="mt-3 space-y-2 pl-4 list-disc">
        {unique.map(image => (
          <li key={image.source}>
            <a href={image.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">{image.alt}</a>
            {' — '}{image.author}{' · '}
            {image.licenseUrl ? <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">{image.license}</a> : image.license}
          </li>
        ))}
      </ul>
    </details>
  )
}
