# Additional textbook topics

Existing topic definitions in `src/data/textbook.ts` retain their URLs and ordering.
Additional metadata lives in `src/data/textbook-topics-extra.json`; full articles
remain in `src/data/textbook-articles.json`. New subject definitions use
`src/data/textbook-subjects-extra.json`. All topics share the existing textbook
templates, ads, navigation, indexes and sitemap. Metadata keys must be unique and
must reference an available subject/class.

The first release needs the normal reviewed cloud build because the loader changed.
Subsequent data batches require preserving live content overlays, backing up each
changed JSON file, a cold runtime check, service reload and textbook revalidation.
The JSON arrays are loaded when the server module starts. Revalidation alone does
not reload an already imported array. Do not run the legacy deployment script.

`scripts/check-textbook-extra-http.mjs` checks all added lesson routes against the
compiled server, their canonical URLs, full content and a genuine unknown-topic 404.
