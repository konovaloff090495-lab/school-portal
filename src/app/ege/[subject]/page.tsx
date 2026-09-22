import type { Metadata } from 'next'
import { SubjectRoute, subjectMeta, subjectParams } from '@/components/exam/routes'

interface Props { params: Promise<{ subject: string }> }
export function generateStaticParams() { return subjectParams('ege') }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { subject } = await params; return subjectMeta('ege', subject) }
export default async function Page({ params }: Props) { const { subject } = await params; return <SubjectRoute exam="ege" subject={subject} /> }
