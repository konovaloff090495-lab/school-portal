import { NextRequest, NextResponse } from 'next/server'
import {publishedSchools} from '@/lib/school-submissions/catalog'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { submissions, SubmissionError, storeDirectory } from '@/lib/school-submissions/store'
import { checkOrigin, owner, requireAdmin, sameSecret, adminSession, ipHash, validId } from '@/lib/school-submissions/auth'
import { validateSubmission } from '@/lib/school-submissions/validate'
import type { SchoolApplication, SubmissionPhoto, SubmissionReceipt } from '@/lib/school-submissions/types'
import { sendTelegramMessage } from '@/lib/telegram'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{action:string}> }
const json = (body:unknown,status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
const escapeHtml = (text:string) => text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
function failure(error:unknown) { if(error instanceof SubmissionError)return json({error:error.message},error.status);console.error('[School applications] request failed',error instanceof Error?error.name:'unknown');return json({error:'Не удалось обработать запрос. Попробуйте позже.'},500) }
function setOwner(response:NextResponse,receipt:SubmissionReceipt) { response.cookies.set('ps_school_owner',receipt.id+'.'+receipt.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/school-submissions/',maxAge:30*86400});return response }
export async function GET(req:NextRequest,{params}:Context) {
 try {
  const {action}=await params
  if(action==='catalog') return NextResponse.json(await publishedSchools(),{headers:{'Cache-Control':'public, max-age=30'}})
  if(action==='get') { const auth=owner(req);return json(await submissions('get',auth)) }
  if(action==='admin') { requireAdmin(req);return json(await submissions('admin-list')) }
  if(action==='unsubscribe') {
   const id=req.nextUrl.searchParams.get('id')||'', token=req.nextUrl.searchParams.get('token')||''
   // The POST from this explicit button, or a mail client's One-Click POST, performs the change.
   if(!validId(id)||!/^[a-f0-9]{64}$/.test(token))return json({error:'Недействительная ссылка'},400)
   const page='<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Отписка — Про-Скул</title><body style="background:#fff8f0;font:16px/1.8 sans-serif;padding:30px"><main style="max-width:550px;margin:60px auto"><h1>Отписаться от рассылки для школ?</h1><p>Статусы вашей заявки продолжат приходить.</p><form method="post"><button style="padding:15px 24px;border:0;border-radius:9px;background:#fa754b">Отписаться от рассылки</button></form></main></body></html>'
   return new NextResponse(page,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
  }
  return json({error:'Страница не найдена'},404)
 }catch(error){return failure(error)}
}
export async function POST(req:NextRequest,{params}:Context) {
 const newFiles:string[]=[]
 try {
  const {action}=await params
  if(action==='unsubscribe') {
   const id=req.nextUrl.searchParams.get('id')||'', token=req.nextUrl.searchParams.get('token')||''
   if(!validId(id)||!/^[a-f0-9]{64}$/.test(token))throw new SubmissionError('Недействительная ссылка',403)
   await submissions('unsubscribe',{id,token});return new NextResponse('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Готово</title><body style="font:16px sans-serif;background:#fff8f0;padding:40px"><h1>Вы отписаны от рассылки</h1><p>Письма со статусами заявки продолжат приходить.</p></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
  }
  checkOrigin(req)
  if(action==='submit') {
   await submissions('rate',{key:'upload:'+ipHash(req),cap:30,window:3600})
   if(Number(req.headers.get('content-length')||0)>45*1024*1024)throw new SubmissionError('Файлы слишком большие',413)
   const form=await req.formData()
   const rawText=form.get('payload');if(typeof rawText!=='string'||rawText.length>24000)throw new SubmissionError('Некорректная заявка')
   const payload=JSON.parse(rawText)
   if(payload.website_check)throw new SubmissionError('Не удалось отправить форму')
   const data=validateSubmission(payload.data)
   let auth: {id:string;token:string}|undefined, previous:SchoolApplication|undefined
   if(payload.id){auth=owner(req);if(auth.id!==payload.id)throw new SubmissionError('Недействительная ссылка',403);previous=await submissions<SchoolApplication>('get',auth)}
   const id=auth?.id||randomBytes(16).toString('hex')
   const specs=payload.photos
   if(!Array.isArray(specs)||specs.length>8)throw new SubmissionError('Можно добавить до 8 фотографий')
   const photos:SubmissionPhoto[]=[]
   for(let i=0;i<specs.length;i++) {
    const spec=specs[i];if(typeof spec.caption!=='string'||spec.caption.length>160)throw new SubmissionError('Проверьте подпись фото')
    const uploaded=form.get('photo_'+i)
    if(uploaded instanceof File) {
     if(uploaded.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(uploaded.type))throw new SubmissionError('Фото: JPG, PNG или WebP, до 5 МБ после обработки')
     const source=Buffer.from(await uploaded.arrayBuffer())
     const processor=sharp(source,{limitInputPixels:40_000_000,animated:false,failOn:'error'})
     const info=await processor.metadata()
     if(!['jpeg','png','webp'].includes(info.format||'')||!info.width||!info.height)throw new SubmissionError('Не удалось прочитать фото')
     const image=await processor.rotate().resize({width:1800,height:1400,fit:'inside',withoutEnlargement:true}).jpeg({quality:86}).toBuffer()
     const file=randomBytes(16).toString('hex')+'.jpg',dir=path.join(storeDirectory,'photos',id)
     await mkdir(dir,{recursive:true,mode:0o700});const destination=path.join(dir,file);await writeFile(destination,image,{mode:0o600});newFiles.push(destination);photos.push({file,caption:spec.caption.trim()})
    } else {
     if(!previous?.photos.some(p=>p.file===spec.file))throw new SubmissionError('Загрузите фотографии заново')
     photos.push({file:spec.file,caption:spec.caption.trim()})
    }
   }
   if(new Set(photos.map(p=>p.file)).size!==photos.length)throw new SubmissionError('Удалите дубли фотографий')
   if(typeof payload.request_id!=='string'||!/^[a-f0-9-]{20,60}$/i.test(payload.request_id))throw new SubmissionError('Обновите страницу и повторите отправку')
   const receipt=await submissions<SubmissionReceipt>(auth?'resubmit':'create',{id,...auth,request_id:payload.request_id,data,photos,ip:ipHash(req)})
   if(receipt.id!==id)await Promise.all(newFiles.map(f=>unlink(f).catch(()=>{})))
   return setOwner(json(receipt),receipt)
  }
  if(Number(req.headers.get('content-length')||0)>10000)throw new SubmissionError('Запрос слишком большой',413)
  const body=await req.json()
  if(action==='admin-login') {
   await submissions('rate',{key:'admin:'+ipHash(req),cap:12,window:900})
   if(!process.env.ADMIN_SECRET||typeof body.secret!=='string'||!sameSecret(body.secret,process.env.ADMIN_SECRET))throw new SubmissionError('Неверный ключ доступа',401)
   const response=json({ok:true});response.cookies.set('ps_school_admin',adminSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/school-submissions/',maxAge:8*3600});return response
  }
  if(action==='admin-logout'){const response=json({ok:true});response.cookies.set('ps_school_admin','',{path:'/api/school-submissions/',maxAge:0});return response}
  if(action==='moderate') {
   requireAdmin(req)
   if(!validId(body.id))throw new SubmissionError('Некорректная заявка')
   const result=await submissions('moderate',body)
   revalidatePath('/shkola/s-'+body.id+'/');revalidatePath('/shkoly/');revalidatePath('/sitemap.xml')
   // City pages render on demand; all catalogue filters share the same published list.
   revalidatePath('/shkoly/[region]','page');revalidatePath('/shkoly/[region]/[type]','page')
   return json(result)
  }
  const auth=owner(req)
  if(action==='access'){const result=await submissions<SchoolApplication>('get',auth);return setOwner(json(result),auth)}
  if(!['confirm','resend','feedback','subscribe'].includes(action))throw new SubmissionError('Неизвестное действие')
  const before=action==='confirm'?await submissions<SchoolApplication>('get',auth):undefined
  const result=await submissions(action,{...body,...auth})
  if(action==='confirm'&&before?.status==='unconfirmed')await sendTelegramMessage('🏫 <b>Школа на модерации</b>\n'+escapeHtml(before.data.school)+' · '+escapeHtml(before.data.city)+'\n<a href="https://pro-schools.ru/admin/shkoly/">Открыть модерацию</a>')
  return json(result)
 }catch(error){await Promise.all(newFiles.map(f=>unlink(f).catch(()=>{})));return failure(error)}
}
