import { gdzSitemapChunkXml } from '@/lib/gdz-sitemap'

export const revalidate = 3600

export async function GET(_req: Request, ctx: { params: Promise<{ n: string }> }) {
  const { n } = await ctx.params
  const idx = parseInt(n, 10)
  const xml = Number.isFinite(idx) && idx > 0 ? gdzSitemapChunkXml(idx) : null
  if (!xml) return new Response('Not found', { status: 404 })
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
