import {createRequire} from 'node:module';
export async function sendRecoveryMail(email,url,env=process.env){
 if(!env.CAREER_SMTP_HOST||!env.CAREER_SMTP_USER||!(env.CAREER_SMTP_PASSWORD||env.CAREER_SMTP_PASS)||!env.CAREER_SMTP_FROM)return false;
 try{const require=createRequire(env.CAREER_NODE_MODULE_ROOT?env.CAREER_NODE_MODULE_ROOT+'/package.json':import.meta.url),nodemailer=require('nodemailer');const transport=nodemailer.createTransport({host:env.CAREER_SMTP_HOST,port:Number(env.CAREER_SMTP_PORT||465),secure:env.CAREER_SMTP_SECURE!=='false',requireTLS:env.CAREER_SMTP_SECURE==='false',auth:{user:env.CAREER_SMTP_USER,pass:env.CAREER_SMTP_PASSWORD||env.CAREER_SMTP_PASS},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:10000,tls:{minVersion:'TLSv1.2',rejectUnauthorized:true}});
 const info=await transport.sendMail({from:env.CAREER_SMTP_FROM,to:email,subject:'Ваша карта интересов ProSchools',text:'Ваша карта интересов сохранена.\n\nОткрыть результат: '+url+'\n\nЭто персональная ссылка: не пересылайте её посторонним. Ссылка действует90дней, результат хранится180дней. На странице результата можно удалить данные. Это сервисное письмо, заявки партнёрам отправляются только по вашему отдельному выбору.'});transport.close();return Array.isArray(info.accepted)&&info.accepted.length>0;
 }catch{return false}
}
