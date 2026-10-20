import chrome from '@/site-navigation/chrome.json'
// SSR links are shared with the standalone course renderer.
export default function Header() {
  return <div className="ps-chrome ps-chrome-header" data-navigation-version={chrome.version} dangerouslySetInnerHTML={{ __html: chrome.header }} />
}
