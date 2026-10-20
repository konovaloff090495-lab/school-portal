import type {Metadata} from 'next'
import SchoolModeration from '@/components/school-submissions/SchoolModeration'
import '../../dobavit-shkolu/submission.css'
export const metadata:Metadata={title:'Модерация школ — Про-Скул',robots:{index:false,follow:false},referrer:'no-referrer'}
export default function ModerateSchools(){return <SchoolModeration/>}
