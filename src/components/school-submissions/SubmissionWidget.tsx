'use client'
import {useEffect,useRef,useCallback} from 'react'
import Script from 'next/script'
import {submitLead} from '@/lib/submitLead'
import {formatPhone,validatePhone} from '@/lib/phone'
import {submissionTemplate} from './template'
import type {SubmissionReceipt} from '@/lib/school-submissions/types'
declare global {interface Window { PSSubmissionMount?: (root:HTMLElement,options:{submit:(data:FormData)=>Promise<SubmissionReceipt>;formatPhone:(value:string)=>string;validatePhone:(value:string)=>string|null})=>()=>void }}
export default function SubmissionWidget({mode,regions}:{mode:'form'|'status';regions:{slug:string;label:string}[]}) {
 const root=useRef<HTMLDivElement>(null),cleanup=useRef<(()=>void)|undefined>(undefined)
 const mount=useCallback(()=>{
  if(!root.current||!window.PSSubmissionMount)return
  cleanup.current?.()
  cleanup.current=window.PSSubmissionMount(root.current,{formatPhone,validatePhone,submit:formData=>submitLead({kind:'school-submission',formData,crm:false,source:'Добавление школы'})})
 },[])
 useEffect(()=>()=>cleanup.current?.(),[])
 return <><div ref={root} className="school-submission" data-mode={mode} data-regions={JSON.stringify(regions)} dangerouslySetInnerHTML={{__html:submissionTemplate}}/><Script src="/school-submissions/form.js?v=20261020" strategy="afterInteractive" onReady={mount}/></>
}
