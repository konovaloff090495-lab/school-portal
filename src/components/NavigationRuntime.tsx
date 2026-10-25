'use client'
import Script from 'next/script'
import {useEffect} from 'react'
import {usePathname} from 'next/navigation'
export default function NavigationRuntime(){
 const pathname=usePathname()
 useEffect(()=>{window.dispatchEvent(new Event('ps:navigation-route'))},[pathname])
 return <><Script src="/site-navigation/navigation.js?v=20261020" strategy="afterInteractive" /><Script src="/monetization/varioqub.js?v=20261025" strategy="afterInteractive" /></>
}
