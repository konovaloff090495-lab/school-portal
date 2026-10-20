import 'server-only'
import type { School, SchoolType } from '@/data/schools'
import { submissions } from './store'
import type { PublishedSchool } from './types'
import { submissionTypes } from './validate'
export async function publishedSchools(): Promise<School[]> {
  const list = await submissions<PublishedSchool[]>('public')
  return list.map(({id,data,photos,published})=>({
    id:'submitted-'+id,slug:'s-'+id,name:data.school,type:submissionTypes[data.type] as SchoolType,region:data.region,city:data.city,address:data.address,
    phone:data.schoolPhone,email:data.schoolEmail,website:data.website||undefined,remoteOnly:data.format==='Онлайн',
    description:data.description.slice(0,300),fullDescription:data.description,grades:data.grades.length?data.grades.join(', '):data.age,
    license:data.license||undefined,features:data.features.split(/[·\n]/).map(s=>s.trim()).filter(Boolean),rating:null,reviewCount:0,
    priceFrom:data.priceFrom,imageAlt:data.school,photoCount:photos.length,photoUrls:photos.map(p=>'/api/school-submissions/images/'+id+'/'+p.file+'/'),
    sourceUrl:data.website||undefined,checkedAt:new Date(published*1000).toISOString().slice(0,10),
    photoCaptions:photos.map(p=>p.caption),admission:data.admission,priceDescription:data.price,representativeSubmitted:true,
  }))
}
export async function submittedSchool(slug:string) { return /^s-[a-f0-9]{32}$/.test(slug)?(await publishedSchools()).find(s=>s.slug===slug):undefined }
