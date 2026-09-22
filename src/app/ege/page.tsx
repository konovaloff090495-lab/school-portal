import type { Metadata } from 'next'
import { HubRoute, hubMeta } from '@/components/exam/routes'

export const metadata: Metadata = hubMeta('ege')
export default function Page() { return <HubRoute exam="ege" /> }
