# Review storage and moderation

The web process stores reviews as JSON data in a private writable state directory. It has no GitHub token and does not edit source files. Existing compiled reviews remain visible. Newly approved reviews are read through the public reviews endpoint, so moderation needs no rebuild.

Production configuration:

- REVIEWS_STATE_DIR: private directory outside the release and public folders, writable by the isolated site user.
- ADMIN_SECRET: a new random administrator password with at least 32 characters. Rotate it to invalidate all moderation sessions. Never put it in a URL or client component.
- ADMIN_ORIGIN: exact public origin; defaults to https://pro-schools.ru.
- TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID: optional notification integration. Missing notifications do not prevent durable queue storage.

The moderation page is /admin/otzyvy/. Login creates a four-hour HttpOnly, Secure, SameSite=Strict cookie. Approval and login require the exact allowed Origin. The reverse proxy must replace X-Real-IP with the actual peer address, cap request bodies to 16 KiB, set request timeouts, rate-limit submission/login, and exclude authentication requests and cookies from logs. State and consent databases must be part of encrypted daily backups. Refresh old-server data immediately before the final traffic cutover.

Import old pending reviews as data after validating them; preserve original submissions in the backup. Do not restore GitHub write credentials to the web process. The directory is part of the site's mutable data, so operating-system isolation and independent immutable backups remain necessary.

Checks: node --experimental-strip-types scripts/test-review-store.mjs; after a production build, node scripts/test-review-http.mjs. These tests use temporary state and disable real notifications.
