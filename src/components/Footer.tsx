import chrome from '@/site-navigation/chrome.json'
export default function Footer() {
  return <div className="ps-chrome ps-chrome-footer" data-navigation-version={chrome.version} dangerouslySetInnerHTML={{ __html: chrome.footer }} />
}
