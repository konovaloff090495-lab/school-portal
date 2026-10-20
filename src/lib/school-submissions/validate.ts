import { regionLabels, regionSlugs } from '@/data/schools'
import { validatePhone } from '@/lib/phone'
import { SubmissionError } from './store'
import type { SubmissionData } from './types'
export const submissionTypes: Record<string,string> = { 'Частная школа':'chastnie','Государственная школа':'gosudarstvennye','Онлайн-школа':'online','Семейная школа':'semejnye','Школа программирования':'programmirovanie','Языковая школа':'yazykovye','Другое':'profilnye' }
export function validateSubmission(raw: Record<string, unknown>): SubmissionData {
  const text = (key:string,max:number,required=false) => { const v=raw[key]; if (v!==undefined && typeof v!=='string') throw new SubmissionError('Проверьте поле '+key); const s=(v as string || '').trim(); if (!['description','features','admission'].includes(key) && /[\r\n\x00-\x1f]/.test(s)) throw new SubmissionError('Уберите переносы строк из поля '+key); if ((required&&!s)||s.length>max) throw new SubmissionError('Заполните поле «'+({school:'Название школы',city:'Город',address:'Адрес',description:'О школе',name:'Ваше имя',role:'Ваша роль',email:'Почта для заявки'}[key]||key)+'» корректно'); return s }
  const data = Object.fromEntries(Object.entries({school:160,type:80,format:30,city:120,address:250,description:4000,age:80,price:180,license:300,features:2500,admission:2500,website:500,schoolPhone:30,schoolEmail:200,name:100,role:120,email:200}).map(([key,max])=>[key,text(key,max,['school','type','format','city','description','name','role','email'].includes(key))])) as unknown as SubmissionData
  if (!submissionTypes[data.type] || !['Очно','Онлайн','Очно и онлайн'].includes(data.format)) throw new SubmissionError('Выберите тип школы и формат обучения')
  if (data.format!=='Онлайн'&&!data.address) throw new SubmissionError('Укажите адрес занятий')
  if (data.description.length<100) throw new SubmissionError('Расскажите о школе подробнее: не менее 100 знаков')
  const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/
  if (!email.test(data.email) || /[\r\n]/.test(data.email) || (data.schoolEmail&&!email.test(data.schoolEmail))) throw new SubmissionError('Проверьте адрес электронной почты')
  data.email=data.email.toLowerCase()
  if (data.schoolPhone && validatePhone(data.schoolPhone)) throw new SubmissionError('Проверьте телефон школы')
  for (const key of ['website','license'] as const) if (data[key] && /^https?:/i.test(data[key])) { try { const url=new URL(data[key]);if (!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error() }catch{throw new SubmissionError('Проверьте ссылку')} }
  if (data.website&&!/^https?:\/\//i.test(data.website)) throw new SubmissionError('Укажите сайт начиная с https://')
  const normalize=(s:string)=>s.toLowerCase().replaceAll('ё','е').trim()
  data.region=regionSlugs.find(key=>normalize(regionLabels[key])===normalize(data.city)) || ''
  if (!data.region && data.format!=='Онлайн') throw new SubmissionError('Выберите город из подсказок')
  if (!data.region) data.region='online'
  data.grades=Array.isArray(raw.grades)?[...new Set(raw.grades.filter((v):v is number=>Number.isInteger(v)&&Number(v)>=1&&Number(v)<=11))]:[]
  if (!data.grades.length&&!data.age)throw new SubmissionError('Выберите классы или укажите возраст учеников')
  if (raw.pd_agreed!==true||raw.rights!==true)throw new SubmissionError('Подтвердите согласие на обработку данных и полномочия представителя')
  data.pd_agreed=true;data.rights=true;data.marketing_agreed=raw.marketing_agreed===true
  if (data.price) { const m=data.price.replace(/\s/g,'').match(/^(?:от)?(\d+)/i); if(m&&/(?:месяц|мес)/i.test(data.price)){const amount=Number(m[1]);if(!Number.isFinite(amount)||amount>1_000_000_000)throw new SubmissionError('Проверьте стоимость');data.priceFrom=amount;}else if(/^бесплатно$/i.test(data.price))data.priceFrom=0 }
  return data
}
