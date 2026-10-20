import type {Metadata} from 'next'
import SubmissionWidget from '@/components/school-submissions/SubmissionWidget'
import {regionSlugs,regionLabels} from '@/data/schools'
import './submission.css'
export const metadata:Metadata={title:'Добавить школу в каталог — Про-Скул',description:'Расскажите о вашей школе, загрузите фотографии и отправьте заявку на проверку редакции. Основное размещение бесплатно.',alternates:{canonical:'https://pro-schools.ru/dobavit-shkolu/'}}
export default function AddSchool(){return <SubmissionWidget mode="form" regions={regionSlugs.map(slug=>({slug,label:regionLabels[slug]}))}/>}
