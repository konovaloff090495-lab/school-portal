import { gdzSitemapIndexXml } from '@/lib/gdz-sitemap'

export const revalidate = 3600

export function GET() {
  return new Response(gdzSitemapIndexXml(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
