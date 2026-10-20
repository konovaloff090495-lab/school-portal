"use client";
import Script from 'next/script';
import { useEffect, useRef } from 'react';
declare global { interface Window { psMountHome?: () => (() => void) } }
export default function HomeRuntime() {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cleanup.current?.(), []);
  return <Script src="/homepage/runtime.js?v=20261020" strategy="afterInteractive" onReady={() => {
    cleanup.current?.(); cleanup.current = window.psMountHome?.();
  }} />;
}
