# Operational data and two-factor access

State: 24 October 2026. No private records, passwords or keys are stored in Git.

## ProSchools / Gerasimov

Newsletter and school application workers run as `lead-gerasimov`. The website and `lead-konovalov` cannot read their databases or encryption keys. School data is in `/var/lib/portfolio-leads/gerasimov/school-submissions/applications.sqlite3`; field and existing link keys are in `/etc/portfolio-leads/gerasimov/school-fields.key` and `school-auth.key`. Questionnaire JSON, photo metadata, comments, feedback and audit text are encrypted; email rate keys use HMAC. Existing confirmation, unsubscribe and Telegram webhook tokens are preserved.

The public release's `scripts/school-submissions.py` links to `/opt/portfolio-school/proschools/client.py`. Its private implementation lives under `/opt/portfolio-school/proschools/releases/encrypted-20261024/scripts`. This compatibility client preserves existing website operations and authorization. It has no database key, but remains a trusted service client for its allowed operations, including existing moderation. An application compromise still requires incident response and revoking its service access.

Keep `portfolio-school-bridge-prepare.service` and `portfolio-site@proschools.service.d/private-school.conf` on every deployment. The root hook `/usr/local/sbin/portfolio-school-bridge-prepare` installs the client before Next starts. The corresponding newsletter hook remains mandatory too. Scheduled mail and moderation run under the private user, with the original timer. Photo paths remain compatible with existing public/owner pages; the private moderator has read-only ACL access to validated JPEGs. Do not grant it all public state or another operator's keys.

Telegram moderation keeps buttons, revision checks and idempotency. It sends a private card link instead of representative contacts, free-text feedback, full documents or uploaded photos. Cards and photos require the separate MFA origin `/schools/<id>`. Tests mock Telegram and SMTP.

## DELA MBA / Konovalov

The PHP5.6-compatible `_private-fields.php` layer encrypts CRM email/IP/UA/source/notes/log/error fields and complete organizer/franchise/feedback JSON files. A separate HMAC email index preserves lookup and deduplication. The migration compared all 27 subscribers, 110 queued-message records, 209 log records and 53 JSON files after decryption. Tokens, statuses, timestamps and queues were unchanged.

The site-specific key and codec live above `public_html`, in `.privacy`, with private permissions. The PHP account necessarily has trusted working access to this key. This protects stored files; it does not isolate the key from compromise of the whole shared-hosting account. The main lead vault's private key remains on the clean receiving server. Full separation of the legacy CRM from its own PHP process would require moving that application too; do not claim this separation already exists.

Requests take a shared handoff lock; migration takes it exclusively. JSON writes are atomic, and SQLite rejects legacy plaintext email writes after activation. Primary `forum` sources were synchronized only after SHA checks, preserving legal controls. The patch and before/after manifest in `scripts/privacy` contain no credentials. Reconcile future source changes before reapplying the patch.

## Education gifts / separate scope

Contacts already used application AES-GCM. The entire working directory is additionally on LUKS2/ext4: `/var/lib/portfolio-encrypted/education-gifts.luks` mounted at `/var/lib/portfolio/education-gifts`. This covers Telegram identifiers, routing, outbox and WAL as well. Native filesystem locking is retained. Concurrent SQLite writers and close/reopen recovery were tested before switching; all four live state files and table counts were then compared before restarting the existing services. Bot code and delivery statuses were unchanged.

`portfolio-gifts-storage.service` is required before both `portfolio-gifts@` services. The underlying unmounted directory has mode000, preventing fallback to an open database. Volume key and metadata are root-only. A recovery capsule containing the volume key and service configuration is encrypted with the owner's original externally saved master password, downloaded from a pinned Selectel version and decrypted. Root remains trusted. The contest operator is still being clarified; its data has not been merged into either operator's database.

## Copies and MFA

`portfolio-ops-archive.timer` creates consistent snapshots about every minute, running SQLite backup under each database owner's UID. It includes MFA state, encrypts AES-GCM and uploads changed content to independent `operational-records/<scope>/` prefixes. The fixed `delomba-records` export uses the existing read-only SSH key; arbitrary commands remain forbidden. New objects have COMPLIANCE Object Lock for31 days and are checked with pinned-version GET and decryption. `portfolio-ops-restore-verify` also checks SQLite integrity after downloading. Existing hourly restic copies remain.

MFA uses TOTP RFC6238, six digits/30 seconds, a one-step window, replay prevention and five failures per15 minutes. Recovery codes are one-use,96-bit random values; only their salted hashes are stored by the server. Sessions are random256-bit tokens, two hours, with Secure/HttpOnly/SameSite=Strict `__Host-` cookies. Logout revokes the server session. Origin and nonce checks protect login. State and spent recovery codes persist across restart and enter backups. Cards remain closed while initial owner activation is pending. Setup secrets exist only in the owner's private local AgentVault file; never commit or publish it.

Operational copy RPO is approximately one minute with normal connectivity, not synchronous replication or a zero-loss guarantee. Necessary server keys do not protect against trusted root compromise. Intentionally published business information and approved photos can remain public. Legal retention periods and operator obligations are separate.

Algorithm references: [RFC6238](https://www.rfc-editor.org/rfc/rfc6238), [cryptsetup documentation](https://gitlab.com/cryptsetup/cryptsetup/-/wikis/FrequentlyAskedQuestions).
