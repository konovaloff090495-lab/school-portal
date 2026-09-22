import type { Metadata } from 'next'
import { DocRoute, docMeta, docParams } from '@/components/exam/routes'

interface Props { params: Promise<{ subject: string; task: string }> }
export function generateStaticParams() { return docParams('ege') }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { subject, task } = await params; return docMeta('ege', subject, task) }
export default async function Page({ params }: Props) { const { subject, task } = await params; return <DocRoute exam="ege" subject={subject} task={task} /> }
