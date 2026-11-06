export const OFFERS=[
 {id:'easycode-trial',partner:'EasyCode',title:'Бесплатный пробный урок программирования',age_min:10,age_max:17,env:'EASYCODE_WEBHOOK_URL'},
 {id:'ukids-diagnostic',partner:'Ukids',title:'Бесплатная диагностика гибких навыков',age_min:6,age_max:15,env:'UKIDS_WEBHOOK_URL'},
 {id:'synergy-school',partner:'Синергия',title:'Консультация по программе онлайн-школы',age_min:10,age_max:18,env:'SYNERGY_GRAPHQL_URL'}
];
function endpoint(value,kind){if(!value)return null;let u;try{u=new URL(value)}catch{throw Error('invalid_'+kind+'_config')}
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.port)throw Error('invalid_'+kind+'_config');
 const valid=kind==='easycode'?u.hostname==='school.easy-mo.ru'&&/^\/channels\/tilda\/requests\/new-form\/[a-f0-9]{32}$/.test(u.pathname):kind==='ukids'?u.hostname==='ukids-academy.bitrix24.ru'&&/^\/rest\/\d+\/[A-Za-z0-9]+\/$/.test(u.pathname):['api.school.synergy.ru','api.school.syndev.ru'].includes(u.hostname)&&u.pathname==='/graphql';
 if(!valid)throw Error('invalid_'+kind+'_config');return value;
}
export class Delivery {
 constructor(store,env=process.env,transport=fetch){this.store=store;this.env=env;this.transport=transport;this.busy=false;this.endpoints={easycode:endpoint(env.EASYCODE_WEBHOOK_URL,'easycode'),ukids:endpoint(env.UKIDS_WEBHOOK_URL,'ukids'),synergy:endpoint(env.SYNERGY_GRAPHQL_URL,'synergy')};this.timeout=Math.min(60000,Math.max(100,Number(env.CAREER_CRM_TIMEOUT_MS)||60000))}
 available(offer){return !!this.endpoints[offer.id.split('-')[0]]}
 offers(age){return OFFERS.filter(o=>age>=o.age_min&&age<=o.age_max&&this.available(o)).map(({env,...o})=>({...o,available:true}))}
 async drain(){if(this.busy)return;this.busy=true;try{for(let i=0;i<5;i++){const row=this.store.claim();if(!row)break;await this.send(row)}}finally{this.busy=false}}
 async send(row){const c=row.contact,offer=OFFERS.find(o=>o.id===row.offer_id),kind=offer.id.split('-')[0];let status='uncertain',remote=null;
 const utm={utm_source:'gerasimov_lav',utm_medium:'lkpartners',utm_campaign:'proschools_proforientaciya',utm_content:c.landing,utm_term:offer.id};
 const options={method:'POST',redirect:'error',signal:AbortSignal.timeout(this.timeout)};
 const comment=JSON.stringify({source:'proschools_career',program:offer.title,request_id:c.request_id,landing:c.landing,original_utm:c.visit_utm,pd_agreed:c.pd_agreed,marketing_agreed:c.marketing_agreed,consent_version:c.consent_version});
 try{
  if(!this.endpoints[kind]){this.store.finish(row.id,'configuration_error');return}
  let url=this.endpoints[kind];
  if(kind==='easycode'){const form=new FormData();for(const [k,v]of Object.entries({name:c.name,phone:c.phone,email:c.email,...utm,formname:'Профориентация · EasyCode',offer_id:offer.id,product_name:offer.title,comment}))form.set(k,v);options.body=form}
  if(kind==='ukids'){url+='crm.lead.add.json';options.headers={'Content-Type':'application/json'};options.body=JSON.stringify({fields:{TITLE:'Профориентация · Ukids · '+offer.title,NAME:c.name,PHONE:[{VALUE:c.phone,VALUE_TYPE:'WORK'}],EMAIL:[{VALUE:c.email,VALUE_TYPE:'WORK'}],UTM_SOURCE:utm.utm_source,UTM_MEDIUM:utm.utm_medium,UTM_CAMPAIGN:utm.utm_campaign,UTM_CONTENT:utm.utm_content,UTM_TERM:utm.utm_term,UF_CRM_1651153904:'synergy_form',UF_CRM_1663683566:'synergy',UF_CRM_1653470859:'synergy',COMMENTS:comment}})}
  if(kind==='synergy'){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify({query:`mutation SendLead($name:String,$email:String,$phone:String,$landCode:String!,$utmData:JSON,$formTitle:String,$latestComment:String,$customAttributes:JSON,$personalDataAgree:Boolean!,$marketingAgree:Boolean!){sendLead(name:$name,email:$email,phone:$phone,landCode:$landCode,utmData:$utmData,formTitle:$formTitle,latestComment:$latestComment,customAttributes:$customAttributes,personalDataAgree:$personalDataAgree,marketingAgree:$marketingAgree){success errors{field message} lead{id}}}`,variables:{name:c.name,email:c.email,phone:c.phone,landCode:this.env.SYNERGY_LAND_CODE||'mo_tilda_online_school',utmData:utm,formTitle:'Профориентация: онлайн-школа',latestComment:comment,customAttributes:{site:'pro-schools.ru',source:'career',offer_id:offer.id,request_id:c.request_id,page_url:c.landing,original_utm:c.visit_utm},personalDataAgree:true,marketingAgree:c.marketing_agreed}})}
  const res=await this.transport(url,options);
  if(!res.ok){status=res.status>=400&&res.status<500?'rejected':'uncertain';await res.body?.cancel()}
  else if(kind==='easycode'){status='delivered';await res.body?.cancel()}
  else{const b=await res.json();if(kind==='ukids'){if((typeof b.result==='number'||typeof b.result==='string')&&/^[1-9]\d*$/.test(String(b.result))&&Number.isSafeInteger(Number(b.result))){status='delivered';remote=String(b.result)}else if(Object.hasOwn(b,'error'))status='rejected'}else{const p=b.data?.sendLead;if(!b.errors?.length&&p?.success===true&&p.lead?.id){status='delivered';remote=String(p.lead.id)}else if(b.errors||p?.success===false)status='rejected'}}
 }catch{status='uncertain'}
 this.store.finish(row.id,status,remote);
 }
}
