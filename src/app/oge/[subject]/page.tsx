import type { Metadata } from 'next'
import { SubjectRoute, subjectMeta, subjectParams } from '@/components/exam/routes'

interface Props { params: Promise<{ subject: string }> }
export function generateStaticParams() { return subjectParams('oge') }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { subject } = await params; return subjectMeta('oge', subject) }
export default async function Page({ params }: Props) { const { subject } = await params; return <SubjectRoute exam="oge" subject={subject} /> }
