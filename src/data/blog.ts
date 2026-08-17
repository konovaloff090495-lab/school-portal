// Блог переехал из этого файла в content/blog/*.json — источник правды теперь
// там, а доступ к нему в src/lib/blog-content.ts (чтение с диска через fs, ISR,
// быстрая публикация без полной пересборки сайта). См. content/blog/index.json.
//
// Этот файл оставлен ТОНКИМ barrel-реэкспортом, чтобы не сломать возможных
// забытых импортёров из '@/data/blog' (BlogPost, safePublishedAt, getPostBySlug,
// getAllPostSlugs, getAllPostsMeta, BlogPostMeta). Массив blogPosts здесь больше
// НЕ хранится — импортёры массива должны перейти на getAllPostsMeta().
export * from '@/lib/blog-content'
