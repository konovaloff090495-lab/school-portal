import { NextRequest, NextResponse } from 'next/server'
import {publishedSchools} from '@/lib/school-submissions/catalog'
import { revalidatePath } from 'next/cache'
import { submissions, SubmissionError, wakeSchoolModerator } from '@/lib/school-submissions/store'
import { checkOrigin, owner, requireAdmin, sameSecret, adminSession, ipHash, validId } from '@/lib/school-submissions/auth'
import type { SchoolApplication, SubmissionReceipt } from '@/lib/school-submissions/types'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{action:string}> }
const json = (body:unknown,status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
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
 try {
  const {action}=await params
  if(action==='unsubscribe') {
   const id=req.nextUrl.searchParams.get('id')||'', token=req.nextUrl.searchParams.get('token')||''
   if(!validId(id)||!/^[a-f0-9]{64}$/.test(token))throw new SubmissionError('Недействительная ссылка',403)
   await submissions('unsubscribe',{id,token});return new NextResponse('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Готово</title><body style="font:16px sans-serif;background:#fff8f0;padding:40px"><h1>Вы отписаны от рассылки</h1><p>Письма со статусами заявки продолжат приходить.</p></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
  }
  checkOrigin(req)
  if(action==='submit'||action==='subscribe')return json({error:'Приём заявок завершён'},410)
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
  if(!['confirm','resend','feedback'].includes(action))throw new SubmissionError('Неизвестное действие')
  const before=action==='confirm'?await submissions<SchoolApplication>('get',auth):undefined
  const result=await submissions(action,{...body,...auth})
  if(action==='confirm'&&before?.status==='unconfirmed')wakeSchoolModerator()
  return json(result)
 }catch(error){return failure(error)}
}
