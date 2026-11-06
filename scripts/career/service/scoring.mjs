import {readFileSync} from 'node:fs';
export const questionnaire=JSON.parse(readFileSync(new URL('./questions.json',import.meta.url),'utf8'));
export function calculate(answers,grade,now=Date.now()){
 const domains=questionnaire.domains.map(d=>{const values=questionnaire.questions.flatMap((q,i)=>q.domain===d.id&&answers[i]!==null?[answers[i]]:[]);const sum=values.reduce((a,b)=>a+b,0),known=values.length;return {id:d.id,label:d.label,sum,known,mean:known?sum/known:null,status:known>=3?'ready':'insufficient'}});
 const eligible=domains.filter(d=>d.status==='ready'),max=Math.max(...eligible.map(d=>d.mean));
 let profile_status='directions',top_domains=[];
 if(eligible.length<4)profile_status='insufficient';else if(max<0.5)profile_status='low';else{top_domains=eligible.filter(d=>max-d.mean<=0.25).map(d=>d.id);if(top_domains.length===eligible.length)profile_status='broad'}
 return {version:questionnaire.version,eligible_count:eligible.length,domains,top_domains,profile_status,age_band:grade<=7?'5-7':grade<=9?'8-9':'10-11',grade,completed_at:new Date(now).toISOString(),disclaimer:questionnaire.disclaimer};
}
