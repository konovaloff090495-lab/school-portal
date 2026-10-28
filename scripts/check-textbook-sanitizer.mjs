import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeHtml } from '../src/lib/sanitize.ts';

const topics = JSON.parse(readFileSync('src/data/textbook-topics-extra.json', 'utf8'));
const articles = JSON.parse(readFileSync('src/data/textbook-articles.json', 'utf8'));
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
for (const topic of topics) {
  const article = articles.find(a => a.subject === topic.subject && a.klass === topic.klass && a.topicSlug === topic.slug);
  assert.ok(article, `Missing article: ${topic.slug}`);
  assert.equal(text(sanitizeHtml(article.content)), text(article.content), `Sanitizer removes lesson text: ${topic.slug}`);
}
console.log(`Text preserved by sanitizer: ${topics.length} added lessons`);
