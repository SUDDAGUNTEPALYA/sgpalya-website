# BENGALOOP Developer Handbook

> Working guide for maintaining the BENGALOOP website. This document describes the repository as inspected on 22 November 2026. Re-check the live branch before every change; the code, product direction and operating rules can evolve.

## 1. Project identity and non-negotiable product boundaries

BENGALOOP is an independent, student-powered business growth ecosystem. It connects businesses with multidisciplinary student talent and applies academic knowledge to practical business challenges.

- **Starting geography:** S.G. Palya and nearby areas. This is the starting point, not the product identity.
- **Core promise:** growing businesses and developing people.
- **Capability foundation:** Experiment Lab.
- **Public business workstreams:** Business Strategy & Research; Finance & Business Analysis; Brand, Marketing & Creative; Business Development & Client Partnerships; Technology & Digital Solutions; Operations, Projects & People.
- **Not the product:** a neighbourhood directory, local-discovery portal, PG/accommodation listing service or general marketplace.
- **Institutional independence:** do not imply CHRIST (Deemed to be University) or Department of Professional Studies affiliation, endorsement or official-project status without formal approval.

### Separate initiatives

**MELD** is an independent, free, non-commission campus sponsorship/collaboration introduction initiative. It has its own identity and microsite. It may draw on relationships built by BENGALOOP, but it is not a BENGALOOP service line or an automated marketplace.

**Project Vyapar Kavach** is a separately branded insurance-awareness collaboration with CUFFLINKSIA. It is education and awareness, not insurance distribution. Volunteers must not be represented as insurance agents, brokers, insurers or authorised advisers. Product-specific recommendations, quotations, solicitation and placement belong with appropriately authorised professionals. Disclose referral, sponsorship and commercial relationships.

### Capability and delivery boundaries

Website service descriptions are capability areas, not blanket guarantees. Accept work only when skills, supervision, time, scope and capacity are in place. Do not promise outcomes or imply delivery without evidence. Finance work is limited to management information and decision support; it excludes statutory audit, tax filing, legal advice and regulated investment advice.

## 2. Repository and deployment model

- **Repository:** `SUDDAGUNTEPALYA/sgpalya-website`
- **Default branch:** `main`
- **Hosting:** GitHub Pages
- **Primary domain:** `https://bengaloop.in/`
- **Architecture:** static HTML, CSS and vanilla JavaScript
- **Build tooling:** no frontend framework or conventional build step is present in the inspected repository.
- **Deployment:** GitHub Pages publishes the static site; GitHub Actions separately runs quality checks.

Do not assume a local build command, npm project or framework exists. The CI workflow installs Playwright temporarily with `npm install --no-save`; there is no package manifest in the inspected tree.

## 3. Page map: what to edit

| Page / route | Purpose | Main files |
|---|---|---|
| Homepage | Positioning, two-sided value model, six workstreams, project examples, business enquiry | `index.html`, `agency.css`, `ecosystem-home.css`, shared `style.css` |
| Team | Founder and member profiles, hierarchy, team information | `our-team.html`, `agency.css`, `style.css` |
| Experiment Lab | Four academic pathways, six departments, nineteen role pathways, student application preview | `join-us.html`, `experiment-lab.css`, `agency.css`, `style.css` |
| MELD | Independent campus sponsorship and collaboration initiative | `meld.html`, `meld.css` |
| Project Vyapar Kavach | Independent insurance-awareness collaboration | `vyapar-kavach.html`, `vyapar-kavach.css` |
| Not found | Custom 404 experience | `404.html`, shared BENGALOOP styles |

### Legacy routes — do not treat as active products

These small HTML files are intentional noindex redirects retained for old URLs:

- `business-registration.html` → homepage business-enquiry section
- `for-businesses.html` → homepage business-enquiry section
- `departments.html` → team page
- `directory.html`, `explore.html`, `pg-housing.html`, `what-we-do.html` → homepage workstreams section
- `our-story.html` → homepage

They use a meta refresh and JavaScript `window.location.replace`, with a normal anchor as fallback. Preserve them unless there is a deliberate redirect migration plan. Their repeated content/blob hashes are not, by themselves, proof of an error.

## 4. Stylesheet ownership and cascade

| Stylesheet | Responsibility | Editing rule |
|---|---|---|
| `style.css` | Foundational/reset styles and substantial retained shared/team-page styling | Treat as high blast-radius. Avoid adding unrelated homepage or microsite rules here. |
| `agency.css` | Shared BENGALOOP ecosystem layout, header/navigation, homepage/business/team components and responsive rules | Changes may affect both homepage and team; inspect both. |
| `ecosystem-home.css` | Homepage-only ecosystem model additions | Preferred home for new homepage-only presentation. |
| `experiment-lab.css` | Experiment Lab page-specific design | Scope additions under `.experiment-page`. |
| `meld.css` | Entire independent MELD visual system | Keep isolated; do not import BENGALOOP global styles without a deliberate redesign. |
| `vyapar-kavach.css` | Entire independent Vyapar Kavach visual system | Keep isolated; do not import BENGALOOP global styles without a deliberate redesign. |

### CSS risk notes

The inspected files are sizeable: `style.css` is about 123 KB and contains roughly 1,260 selector blocks; `agency.css` is about 42 KB and contains roughly 450 selector blocks. The shared files contain multiple later responsive and corrective override sections. This is a working accumulated cascade, not a clean component/CSS-module system.

Therefore:

1. Inspect the page's stylesheet load order before changing a selector.
2. Search for every occurrence of the selector/property before editing; later rules may override earlier ones.
3. Prefer page-scoped selectors (for example `.agency-home .component` or `.experiment-page .component`) and page-owned stylesheets.
4. Avoid broad selectors such as `header`, `button`, `h1`, `.card` or `body` in a page-specific stylesheet.
5. Do not delete apparently duplicated overrides as cleanup without regression testing.
6. Preserve visible focus states, reduced-motion handling, mobile breakpoints and touch target sizes.
7. Do not move microsite rules into shared CSS merely to reduce file count.

The BENGALOOP pages load styles in this order:
- Homepage: `style.css` → `agency.css` → `ecosystem-home.css`
- Team: `style.css` → `agency.css`
- Experiment Lab: `style.css` → `agency.css` → `experiment-lab.css`
- MELD: `meld.css` only
- Vyapar Kavach: `vyapar-kavach.css` only

The 404 page uses the shared BENGALOOP styles.

## 5. JavaScript and interaction map

`relaunch.js` is the shared JavaScript entry point used by the three core BENGALOOP pages. It is a self-invoking vanilla-JavaScript module and currently handles:

- Mobile navigation open/close behaviour.
- Backdrop and Escape-key closing.
- Navigation accessibility state (`aria-expanded`, `aria-hidden`, `inert`).
- Focus movement and a basic Tab focus loop within the drawer.
- Automatic current year in the footer.
- Guarded business enquiry form submission.
- Guarded student application form submission.

MELD and Vyapar Kavach are currently standalone static microsites and do not load `relaunch.js`. Their interactive disclosures use native HTML `details/summary` elements; do not assume shared navigation JavaScript exists on those pages.

When changing a shared JS handler, check all three core pages. Use null-safe element checks because not every page contains every form or footer element. Preserve reduced-motion behaviour and accessible labels/state.

## 6. Forms, privacy and security

### Business enquiry

- Form ID: `businessEnquiryForm`
- Status element: `businessEnquiryStatus`
- Endpoint attribute: `data-form-endpoint`
- Current endpoint is blank.
- While blank, the form deliberately does not send or store visitor details and tells users not to enter real business information.

### Student application

- Form ID: `studentApplicationForm`
- Status element: `studentApplicationStatus`
- Endpoint attribute: `data-form-endpoint`
- Current endpoint is blank.
- The form is a preview, not an open recruitment channel.
- It retains four intended fields: full name, register number, class/course & section, and preferred department.
- `data-requires-consent="true"` is set; the handler blocks submission without an explicit consent control.

### Before enabling either form

Do not simply paste a URL into the HTML. First establish:

1. A secure HTTPS server-side receiver.
2. Server-side validation, sanitisation and abuse/rate-limit protection.
3. Appropriate CORS configuration if the receiver is on another origin.
4. A clear privacy notice, lawful purpose, explicit consent where required, retention/deletion process and contact route.
5. Restricted access to submitted records and a defined review/response process.
6. No API keys, credentials or private secrets in browser code.

The current client-side code sends JSON with `credentials: "omit"`; this does not replace server-side security or privacy obligations.

## 7. SEO, domain and crawl rules

The primary public origin is `https://bengaloop.in/`.

- `CNAME` must contain exactly `bengaloop.in`.
- Each indexable page must have its own canonical URL on `bengaloop.in`.
- `og:url` and absolute social-image URLs must use `bengaloop.in`.
- Keep `robots.txt` sitemap reference as `https://bengaloop.in/sitemap.xml`.
- Keep sitemap URLs on the primary host.
- The sitemap currently contains exactly five indexable pages: homepage, team, Experiment Lab, Vyapar Kavach and MELD.
- `sgpalya.in` is a legacy alias and must not appear in canonical tags, social metadata, robots or sitemap. Its permanent redirect must be configured at the domain/hosting level, preserving paths and query strings.
- Keep legacy redirect pages `noindex,follow`.
- Preserve the favicon, Apple touch icon, manifest and social image references when changing brand assets.

The homepage currently uses `favicon.svg`, `bengaloop-avatar.png` for Apple/manifest icon references, and `bengaloop-social.jpg` for social sharing. Verify that a replacement asset exists at the exact referenced path and has the right format/dimensions.

## 8. Assets and naming

The inspected repository stores image and SVG assets in the repository root rather than a dedicated `assets/` directory. Examples include the BENGALOOP logos, hero/social images, team portraits, `brand-mark.svg`, `cufflinksia-logo.svg` and favicon.

When adding/replacing an asset:

- Use a descriptive, stable, lowercase filename with hyphens.
- Update every HTML/CSS/manifest reference.
- Keep image `alt` text meaningful; decorative images should use empty alt text or be hidden from assistive technology as appropriate.
- Preserve explicit width/height where used to reduce layout shift.
- Compress large photographs and use modern formats where practical.
- Do not reorganise the root assets until every reference can be updated and the full checks pass.

The tree includes multiple portrait/logo variants and repeated content hashes. Do not delete a seemingly unused or duplicate image until references and intended use have been checked.

## 9. Quality gates and browser coverage

### Run locally

From the repository root:

```bash
python tools/validate_site.py
node --check relaunch.js
```

The browser test requires Playwright and a local static server:

```bash
npm install --no-save --no-audit --no-fund playwright
npx playwright install chromium
python -m http.server 8000 --bind 127.0.0.1
```

In a second terminal:

```bash
node tools/browser_smoke_test.mjs
```

The test writes screenshots to `artifacts/`. It can be configured with:
- `BENGALOOP_BASE_URL` (default `http://127.0.0.1:8000`)
- `BENGALOOP_SCREENSHOT_DIR` (default `artifacts`)

### GitHub Actions

`.github/workflows/site-quality.yml` runs on pushes to `main` and pull requests to `main`. It:
1. Checks out the repository.
2. Sets up Python 3.12 and Node.js 22.
3. Runs `python tools/validate_site.py`.
4. Runs `node --check relaunch.js`.
5. Installs Playwright and Chromium.
6. Starts a local static server and runs `tools/browser_smoke_test.mjs`.
7. Uploads visual QA screenshots as an artifact.

The browser suite covers desktop and mobile interactions, form states, disclosures, navigation, touch targets, heading wrapping, overflow and legacy redirects. Its mobile-first sweep checks 320, 360, 375, 390 and 430 pixel widths across the six primary page experiences (including 404).

**Audit baseline:** at the inspected commit `b5f3a12411f84176cfb00ba810052aa3b71ed274`, the latest visible Site quality checks run and GitHub Pages deployment both completed successfully on 22 November 2026. This is evidence for that commit only, not a guarantee that future changes pass.

## 10. Safe change recipes

### Change homepage copy
1. Edit `index.html`.
2. Preserve the core positioning and capability/delivery boundaries.
3. Check heading hierarchy, links, CTA targets and SEO description/title.
4. Run the validator and browser suite.

### Change homepage layout or visual style
1. Inspect `index.html` markup and the loaded CSS order.
2. Prefer `ecosystem-home.css` for homepage-only components.
3. Use `agency.css` only when the component is shared with the team page.
4. Use `style.css` only for truly foundational/shared behaviour.
5. Test desktop and all mobile widths in the browser suite.

### Change team members
1. Edit the relevant profile/card in `our-team.html`.
2. Update the image reference and meaningful alt text.
3. Check counts and leadership/team hierarchy in `index.html` and the validator.
4. Check the team page on desktop and mobile.

### Change Experiment Lab pathways, departments or roles
1. Edit `join-us.html`.
2. Keep the four academic pathways, six departments and nineteen role pathways consistent unless the approved model itself changes.
3. Update any corresponding homepage workstream descriptions if the real capability model changes.
4. Update `tools/validate_site.py` and browser assertions when the approved counts/contract change.
5. Keep recruitment status and form privacy/consent rules accurate.

### Change MELD or Vyapar Kavach
1. Edit only the relevant microsite HTML and its dedicated CSS unless a deliberate shared brand/navigation change is approved.
2. Preserve the initiative's independence and its operational/legal boundaries.
3. Test narrow screens and disclosures; neither microsite currently relies on the shared BENGALOOP JS.

### Add a new public page
1. Decide whether it is a BENGALOOP core page or a separately branded initiative.
2. Give it a unique title, description, canonical URL and appropriate social metadata.
3. Choose shared styles only if it genuinely belongs to the BENGALOOP design system; otherwise isolate its CSS.
4. Add navigation links only where they make product sense.
5. Add the canonical URL to `sitemap.xml` if it should be indexed.
6. Extend `tools/validate_site.py` and browser smoke coverage.
7. Check the 404, mobile layouts, accessibility and all internal links.

### Change domain or SEO identity
Treat this as a coordinated migration. Update canonical URLs, `og:url`, social images, sitemap, robots, CNAME and external redirect configuration together. Do not perform a partial host replacement.

## 11. Recommended engineering improvements (not yet implemented)

These are recommendations, not current features:

1. **Reduce shared CSS risk gradually.** The large `style.css` and accumulated overrides make global edits risky. Extract only after mapping selectors to pages and adding regression coverage.
2. **Strengthen automated asset checks.** Validate image dimensions/size, favicon and manifest targets, and missing `alt` text.
3. **Expand accessibility checks.** Add automated checks for landmarks, label associations, contrast and keyboard behaviour; retain manual review for visual/accessibility judgement.
4. **Add a performance budget.** Track large image payloads, font loading, page weight and Core Web Vitals.
5. **Document form operations before launch.** Backend, privacy, retention, access and response ownership must be agreed before collection begins.
6. **Refresh repository metadata.** The GitHub repository description observed during this audit still says “S.G. PALYA — Local Discovery Platform”, which no longer reflects the product direction. Update the repository description separately in GitHub settings; this is repository metadata, not a website file.

## 12. Working rules for future AI-assisted edits

Before changing code, identify the requested user-visible outcome and the smallest relevant set of files. Read the current versions from `main`; do not rely on old snippets or memory when the branch may have changed.

For each change:
- State which files need to change and why.
- Check cross-page dependencies before editing shared CSS or JavaScript.
- Preserve independent initiative boundaries.
- Avoid unrelated cleanup bundled into a feature change.
- Never invent live clients, partners, services, recruitment status or institutional endorsements.
- Run the structural and browser checks, then inspect the GitHub Actions result.
- Report exactly what changed, what was tested, and what remains unverified.

If a check cannot be run, say so plainly. A successful prior CI run is not a substitute for testing the current commit.
