import { NextRequest,NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isAdmin,owner,validId } from '@/lib/school-submissions/auth'
import { submissions,storeDirectory } from '@/lib/school-submissions/store'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string;photo:string}>}) {
 const {id,photo}=await params
 if(!validId(id)||!/^([a-f0-9]{32})\.jpg$/.test(photo))return new NextResponse(null,{status:404})
 try {
  let token='';try{const auth=owner(req);if(auth.id===id)token=auth.token}catch{}
  const result=await submissions<{file:string;public:boolean}>('image',{id,photo,token,admin:isAdmin(req)})
  const bytes=await readFile(path.join(storeDirectory,'photos',id,result.file))
  return new NextResponse(bytes,{headers:{'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff','Cache-Control':result.public?'public, max-age=86400, immutable':'private, no-store','Referrer-Policy':'no-referrer'}})
 }catch{return new NextResponse(null,{status:404,headers:{'Cache-Control':'no-store'}})}
}
