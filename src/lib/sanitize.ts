/**
 * Lightweight server-side HTML sanitizer.
 * Strips script tags, iframe, event handlers and javascript: URIs
 * from AI-generated content before rendering via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return html
    // Удаляем <script> ... </script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Удаляем <iframe> ... </iframe>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Удаляем <object>, <embed>, <form>
    .replace(/<(object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Удаляем самозакрывающиеся <embed ... /> и <object ... />
    .replace(/<(object|embed)\b[^>]*\/?>/gi, '')
    // Удаляем event-атрибуты (onclick, onload, onmouseover и т.д.)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Удаляем javascript: в href/src/action
    .replace(/(href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '$1="#"')
    // Удаляем data: URI в src (потенциальный XSS в IE)
    .replace(/src\s*=\s*["']?\s*data:[^"'\s>]*/gi, 'src=""')
}
