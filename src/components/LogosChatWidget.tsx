'use client'

import { useEffect } from 'react'
import Script from 'next/script'

const WIDGET_URL = 'https://ssynergy.logos.unis.studio/widget.js?tenant=ssynergy'

// The vendor renders into a shadow root. Keep only the launcher clickable while
// closed: its large floating preview and notification areas used to cover CTAs.
const WIDGET_CSS = `
  :host { pointer-events: none !important; }
  .uc-main { pointer-events: auto !important; left: auto !important; right: 20px !important; }
  .uc-main:not(.open) { bottom: calc(24px + var(--ps-widget-clearance, 0px)) !important; }
  :host(.mobile) .uc-main.open { left: 0 !important; right: 0 !important; }
  .uc-preview, .uc-actions, .uc-campaign-bubble, .uc-campaign-takeover { display: none !important; }
  .uc-overlay { pointer-events: none !important; }
  .uc-overlay.visible { pointer-events: auto !important; }
`

export default function LogosChatWidget() {
  useEffect(() => {
    function protectWidget() {
      const host = document.getElementById('Logos-widget')
      if (!host?.shadowRoot || host.shadowRoot.getElementById('ps-widget-click-area')) return false

      const style = document.createElement('style')
      style.id = 'ps-widget-click-area'
      style.textContent = WIDGET_CSS
      host.shadowRoot.appendChild(style)
      return true
    }

    if (protectWidget()) return
    const observer = new MutationObserver(() => {
      if (protectWidget()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true })
    return () => observer.disconnect()
  }, [])

  return <Script src={WIDGET_URL} strategy="afterInteractive" data-position="bottom-right" />
}
