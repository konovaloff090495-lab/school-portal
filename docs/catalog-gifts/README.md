# Catalog gifts experiment

`PartnerStickyBanner` now opens an on-site native dialog with 10 offers from the
same `WALL_OFFERS` registry as `/spasibo/`. Selecting an offer shows its terms and
the shared `LeadForm`. It calls `submitLead` with CRM enabled, a dedicated source,
the selected product and offer in qualification.goal; successful requests go to
`/spasibo/`. No external landing visit is required before submitting.

The date and countdown refresh at Moscow midnight. The timer explicitly describes
refreshing the selection, not the expiration of a partner's contractual offer.
Closing the strip suppresses it until the next Moscow date. It hides near existing
lead forms and other native dialogs. Escape, native focus trapping, scroll locking,
resize and restoration of the opener are supported.

Offers reuse existing gift descriptions; conditional bonuses retain their condition
(e.g. for online-school students). Current public sources checked 2026-10-26:
https://school-university.com/ , /kursy-ege/ , /kursy-oge/ , /repetitor/ ,
/nachalnaya-shkola/ , /programmirovanie-dlya-detey/ , /soft-skills/ , /lektoriy/ ,
/profilnye-klassy/ , /vneurochka/ .

New goals are listed in goals.json. `view` requires >=50% visibility of the strip,
once per pathname and Moscow date in a component lifetime. Form start excludes
consent checkbox changes. Success follows an accepted submitLead result; errors
have a separate goal. Only fixed campaign labels, path, date and offer IDs are sent;
no contacts. Old partner_banner_click stays historical and is not emitted for this
new on-site flow. Existing lead_submit/card_lead remain available.

Verification: test-catalog-gifts.mjs covers real offer count and midnight/year
rollover. test-catalog-gifts-http.mjs tests five widths, ten full mock lead paths,
consent refusal, source/product, a failed submission and retry, all ten analytics
events, dismissal and next-day return. All analytics/external requests are isolated.
