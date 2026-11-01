# Weekend activities published 2026-10-31

Five practical tutorials and the native blog collection `/blog/poprobuj-novoe-za-vyhodnye/`.
Three existing course guides link back to the collection. Download links are ungated.

Assets: five built-in ImageGen covers, seven original vector diagrams, five printable
PDFs (18 pages total), and one original Scratch .sb3 project. Prompts and provenance:
`data/blog-visuals/weekend-20261031.json`. The covers are illustrative; diagrams and
instructions describe the actual procedures. Scratch was checked in the real VM and
browser renderer, including a one-point pixel collision. All 640 eligible 1089 inputs,
all six grid selections and the quest's deterministic answers were checked.

Content published without a Next build or application restart. Live root was
`/srv/portfolio/proschools/releases/competitor-coverage-20261028`. Sources are committed
in main; future releases must retain the content and public assets. Publication merges
current manifests/search/sitemap by keys and preserves unrelated entries.
Backup: `/srv/portfolio/proschools/archives/weekend-20261031/`.

A scoped Nginx static location was added (see adjacent .conf) because Next's startup
public inventory did not include the newly added directory. Nginx configuration was
backed up, syntax checked, and reloaded; no application restart. Keep this location
when replacing the site configuration. It only serves files below the dated directory.
