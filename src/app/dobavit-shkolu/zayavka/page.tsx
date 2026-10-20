import type {Metadata} from 'next'
import SubmissionWidget from '@/components/school-submissions/SubmissionWidget'
import {regionSlugs,regionLabels} from '@/data/schools'
import '../submission.css'
export const metadata:Metadata={title:'Моя заявка на добавление школы — Про-Скул',robots:{index:false,follow:false},referrer:'no-referrer'}
export default function SchoolApplication(){return <SubmissionWidget mode="status" regions={regionSlugs.map(slug=>({slug,label:regionLabels[slug]}))}/>}
