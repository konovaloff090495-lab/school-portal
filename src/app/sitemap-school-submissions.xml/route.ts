import {publishedSchools} from '@/lib/school-submissions/catalog'
export const dynamic='force-dynamic'
export async function GET(){
 const schools=await publishedSchools()
 const urls=['<url><loc>https://pro-schools.ru/dobavit-shkolu/</loc></url>',...schools.map(s=>`<url><loc>https://pro-schools.ru/shkola/${s.slug}/</loc>${s.checkedAt?`<lastmod>${s.checkedAt}</lastmod>`:''}</url>`)]
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=60'}})
}
