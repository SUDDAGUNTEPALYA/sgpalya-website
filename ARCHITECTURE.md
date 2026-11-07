# BENGALOOP website architecture

The mobile-first homepage focuses on two priorities: explain what BENGALOOP is,
what it does and how its local model works; and present student recruitment
across six departments with 19 current roles. The homepage introduces Founder
and Co-founders. A Member count link opens `our-team.html#members`.

Standalone pages: `what-we-do.html` (model and vision), `departments.html`
(six departments/19 roles), `our-team.html` (15 Members), `explore.html`,
`directory.html`, `pg-housing.html`, `for-businesses.html`,
`business-registration.html` (preview only), and `our-story.html`.

`script.js` loads the public directory CSV only on pages containing a listing
grid. Only Approved rows render. Registration does not send or store data.
Changes are developed on feature branches; rollback is preserved at
`backup/pre-homepage-team-navigation-2026-11-07`.
