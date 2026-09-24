/**
 * Пиктограммы для плиток витрины подарков. Одна линия, 1.6px, наследуют currentColor —
 * рисуются белым на цветной плитке оффера (см. WallOffer.icon в src/lib/offerwall.ts).
 */
import type { WallIcon } from '@/lib/offerwall'

const PATHS: Record<WallIcon, React.ReactNode> = {
  school: <><path d="M3 10.5 12 4l9 6.5" /><path d="M5.5 12v7.5h13V12" /><path d="M10 19.5v-4.5h4v4.5" /></>,
  rocket: <><path d="M13.5 4.5c3.5 1 5 3.5 5.5 7-2.5 3-5.5 5-9 6l-3-3c1-3.5 3-6.5 6.5-10Z" /><circle cx="14" cy="10" r="1.6" /><path d="M7 15.5 4.5 19l3.5-1" /></>,
  home: <><path d="M4 11 12 4.5 20 11" /><path d="M6 12.5V20h12v-7.5" /><path d="M10.5 20v-4h3v4" /></>,
  certificate: <><rect x="4.5" y="4" width="15" height="12" rx="2" /><path d="M8 8h8M8 11.5h5" /><path d="M12 16v4l2-1.3 2 1.3v-4" /></>,
  moon: <><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  target: <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.5" /><path d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3" /></>,
  puzzle: <><path d="M10 4.5h4v2.2a1.8 1.8 0 1 0 3.5 0V9.5h2v4h-2.2a1.8 1.8 0 1 0 0 3.5h2.2v2h-4v-2.2a1.8 1.8 0 1 0-3.5 0V19.5h-4v-4h2.2a1.8 1.8 0 1 0 0-3.5H6.5v-4H10Z" /></>,
  exam: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" /></>,
  teacher: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" /></>,
  play: <><circle cx="12" cy="12" r="8" /><path d="M10.5 9.2 15 12l-4.5 2.8V9.2Z" /></>,
  blocks: <><rect x="4" y="12.5" width="7" height="7" rx="1.5" /><rect x="13" y="12.5" width="7" height="7" rx="1.5" /><rect x="8.5" y="4.5" width="7" height="7" rx="1.5" /></>,
  palette: <><path d="M12 4a8 8 0 0 0 0 16c1.2 0 1.8-.9 1.4-2-.4-1.1.3-2 1.5-2H17a3.5 3.5 0 0 0 3.5-3.5C20.5 8 16.7 4 12 4Z" /><circle cx="8.5" cy="11" r="1.1" /><circle cx="12" cy="8.5" r="1.1" /><circle cx="15.5" cy="11" r="1.1" /></>,
  code: <><path d="m9 8.5-4.5 3.5L9 15.5M15 8.5l4.5 3.5-4.5 3.5M13.5 5.5l-3 13" /></>,
  heart: <><path d="M12 19.5s-7-4.2-7-9A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5c0 4.8-7 9-7 9Z" /></>,
  college: <><path d="M4 20h16M5.5 20v-9M18.5 20v-9M9 20v-9M15 20v-9" /><path d="M3.5 11 12 5l8.5 6" /></>,
  cap: <><path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" /><path d="M7 11.5v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" /></>,
  globe: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.2 2.3 3.3 5 3.3 8S14.2 17.7 12 20c-2.2-2.3-3.3-5-3.3-8S9.8 6.3 12 4Z" /></>,
  route: <><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M9 6.5h5a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5" /></>,
  pdf: <><path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5.5-5.5Z" /><path d="M13.5 3.5V9H19" /><path d="M8.5 13.5h7M8.5 16.5h4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  ticket: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 3.8v2A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.3v-2a2 2 0 0 0 0-3.8v-2Z" /><path d="M13.5 7.5v2M13.5 14.5v2" /></>,
  mountain: <><path d="m3.5 19 5.5-9 3.5 5.5 2-3L20.5 19H3.5Z" /><circle cx="17" cy="7" r="2" /></>,
}

export default function OfferIcon({ name, className = 'w-7 h-7' }: { name: WallIcon; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  )
}
