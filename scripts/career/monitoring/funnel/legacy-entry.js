// Loaded only by the nine explicitly scoped legacy articles. No external code.
if (!window.PSCareerLegacyEntry) {
  window.PSCareerLegacyEntry = true;
  const version = new URL(import.meta.url).searchParams.get('v') || '20261106.2';
  import('/career-assets/client.js?v=' + encodeURIComponent(version));
}
