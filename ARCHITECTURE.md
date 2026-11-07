# BENGALOOP website architecture

Last audited: 7 November 2026  
Production repository: `SUDDAGUNTEPALYA/sgpalya-website`  
Production branch: `main`

## 1. Current technical shape

BENGALOOP is a multi-page static website published through GitHub Pages and served at `https://sgpalya.in`. The repository root is the website document root. There is no framework build step, package manager manifest, server application or first-party database in the current production implementation.

Every HTML page follows the shared outer structure:

```text
body
└── .site-shell
    ├── skip link
    ├── header / navigation drawer
    ├── navigation backdrop
    ├── main (one page-specific composition)
    └── footer
```

The common shell and navigation/footer markup are currently repeated in each page. `style.css` supplies existing page and component layouts, while `design-system.css` defines shared typography, spacing, radius and motion tokens plus the floating navigation treatment. The shared shell is a structural convention, not a server-side template.

## 2. Page inventory

| File | Responsibility | Runtime script |
|---|---|---|
| `index.html` | Home, introduction, recruitment invitation, discovery links, founder and community | `script.js` |
| `explore.html` | Search entry point and category discovery | `script.js` |
| `directory.html` | Approved local business directory | `script.js` |
| `pg-housing.html` | Same directory engine with an accommodation category default | `script.js` |
| `for-businesses.html` | Business proposition, benefits and staged service model | `script.js` |
| `business-registration.html` | Registration-form preview | `script.js`, `business-registration.js` |
| `departments.html` | Six-department, 19-role recruitment explorer | `script.js`, `recruitment.js` |
| `our-story.html` | Initiative and neighbourhood story | `script.js` |
| `our-team.html` | Team profiles and separate technical-leadership block | `script.js` |
| `what-we-do.html` | Operating model and roadmap | `script.js` |

The homepage, explore and directory flows are connected through URL query parameters: `q` for search and `category` for category selection.

## 3. Shared source files

- `style.css`: existing page layouts, responsive rules, directory cards, recruitment UI, team cards and form styles. It remains a large stylesheet whose page components will migrate incrementally.
- `design-system.css`: shared Manrope typography foundation, named text styles, spacing/radius/motion tokens, focus/active states and floating navigation treatment.
- `script.js`: shared navigation plus the public directory data pipeline, search, filters, sorting, refresh and business action links.
- `recruitment.js`: static department/role data and the client-side department/role explorer.
- `business-registration.js`: preview-only form behaviour. It prevents submission and explicitly tells visitors that information is not sent or saved.

## 4. Data boundaries and integrations

### Public directory
`directory.html` and `pg-housing.html` declare the same published Google Sheets CSV URL in the `bengaloop-directory-csv` meta tag. `script.js` fetches this public feed, parses CSV rows, requires the business-name and listing-status columns, and displays only records marked `Approved`. It builds business cards using DOM nodes and `textContent`, checks supplied URLs for HTTPS, and creates Call, WhatsApp and Maps actions when usable fields exist.

This is a browser-side public-feed integration, not a private database. Approval filtering is performed by the visitor's browser. Do not expose private spreadsheets or form-response tabs through the public feed.

### Recruitment
The six department cards are declared in `departments.html`; corresponding department and role descriptions are stored in `recruitment.js`. IDs must stay aligned. The explorer is client-side and does not submit applications or maintain applicant records.

### Business registration
The form markup is in `business-registration.html`. The companion JavaScript is deliberately preview-only. No backend, Excel connection, storage or submission endpoint is configured in this repository. Do not describe it as a live submission workflow until a separately reviewed secure service exists.

### Team
Visible team profiles are authored in `our-team.html`. Rhythm Mehrotra and Yuval Ostwal are the only co-founders. The CTO appears in a distinct Technical Leadership section. The hidden profile template is not a data store.

## 5. Current hosting and release

- GitHub repository: `SUDDAGUNTEPALYA/sgpalya-website`
- Production branch: `main`
- Hosting: GitHub Pages
- Custom domain file: `CNAME` (`sgpalya.in`)
- Search assets: `robots.txt` and `sitemap.xml`
- Browser metadata: `site.webmanifest`, `favicon.svg`, `bengaloop-avatar.png`

The site is static: changes to root HTML/CSS/JS/assets are served directly after a successful Pages deployment. Hard-refresh or cache-bust changed assets when required.

## 6. Quality and maintenance risks identified

1. Shared header, navigation and footer HTML are duplicated across ten pages. Shared changes require coordinated updates.
2. The 1,278-line stylesheet contains repeated selectors and many media-query blocks. New overrides can have unexpected cascade interactions.
3. Navigation and directory responsibilities are combined in `script.js`, which loads on every page.
4. Department cards and role data are split between HTML and JavaScript.
5. Team records are manually authored in HTML.
6. The registration form is visual/interaction preview only.
7. The sitemap and README should be maintained as routes and architecture evolve.
8. Root-level static assets include some older/duplicate profile image files; confirm references before removing anything.
9. There is no dependency-backed browser regression suite in the current production structure.

## 7. Recommended direction for a future major rebuild

Treat the future work as an architecture migration, not a sequence of CSS patches.

1. Agree the sitemap, page responsibilities and visitor journeys first.
2. Establish design tokens and documented responsive layout rules.
3. Introduce genuinely reusable header, navigation, footer, cards and form components.
4. Move department, team and other repeatable content into clearly defined data models.
5. Separate navigation, directory, recruitment and form behaviour into independent modules.
6. Keep public directory data, private applicant information and any future registration service strictly separated.
7. Add quality gates before broad page migration.
8. Migrate one representative page, validate desktop/mobile and accessibility, then migrate the rest.
9. Keep production deploys reversible and preserve the existing route URLs or provide redirects.

A framework or static-site generator may help with reusable layouts, but it should be selected after the new sitemap, hosting constraints, update workflow and operational budget are agreed—not assumed in advance.

## 8. Non-negotiable contracts

- Preserve the `sgpalya.in` domain and current DNS/Pages configuration unless a specifically planned migration requires changes.
- Keep directory publication limited to the intended public approved feed.
- Do not expose private spreadsheet tabs or applicant information.
- Do not claim registration or recruitment submissions are live until secure storage and processing are configured.
- Keep the two existing co-founders distinct from all ordinary team profiles.
- Keep CTO leadership separate from the co-founder designation.
- Preserve accessible navigation, keyboard interaction, reduced-motion support and usable touch targets.
- Do not remove existing routes, content or assets until references and visitor journeys have been checked.

## 9. Rollback

Before improvements, the production state was preserved on branch:

`backup/pre-redesign-2026-11-07` (current pre-redesign production state, commit `a5aae7b54ff2dff3e252e4cb6b4311490fdffba0`), and `backup/pre-improvement-baseline-2026-11-07` (earlier baseline, commit `b67b8d0827c988c219d4395c0178a27b43f2d2c2`)

Baseline commit:

`b67b8d0827c988c219d4395c0178a27b43f2d2c2`

Use this reference to compare or restore the exact pre-improvement version. Prefer a revert commit or reviewed branch restoration over force-pushing production history.
