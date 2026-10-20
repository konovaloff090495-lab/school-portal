import {NextRequest,NextResponse} from 'next/server'
import {revalidatePath} from 'next/cache'
import {sameSecret,validId} from '@/lib/school-submissions/auth'
import {submissions} from '@/lib/school-submissions/store'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest){
 const supplied=req.headers.get('x-telegram-bot-api-secret-token')||''
 if(!/^[a-f0-9]{64}$/.test(supplied))return NextResponse.json({ok:false},{status:403})
 try{
  const {secret}=await submissions<{secret:string}>('telegram-secret')
  if(!sameSecret(supplied,secret))return NextResponse.json({ok:false},{status:403})
  if(Number(req.headers.get('content-length')||0)>100000)return NextResponse.json({ok:false},{status:413})
  const text=await req.text()
  if(Buffer.byteLength(text)>100000)return NextResponse.json({ok:false},{status:413})
  let update:unknown
  try{update=JSON.parse(text)}catch{return NextResponse.json({ok:false},{status:400})}
  if(!update||typeof update!=='object'||!Number.isSafeInteger((update as {update_id?:unknown}).update_id))return NextResponse.json({ok:false},{status:400})
  const result=await submissions<{id?:string}>('telegram-update',{update})
  if(result.id&&validId(result.id)){
   revalidatePath('/shkola/s-'+result.id+'/');revalidatePath('/shkoly/');revalidatePath('/sitemap.xml')
   revalidatePath('/shkoly/[region]','page');revalidatePath('/shkoly/[region]/[type]','page')
  }
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}})
 }catch{console.error('[School moderation] Telegram update failed');return NextResponse.json({ok:false},{status:503})}
}
