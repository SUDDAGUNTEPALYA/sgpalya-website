# BENGALOOP — S.G. Palya Edition

Public website: https://sgpalya.in  
Production repository: `SUDDAGUNTEPALYA/sgpalya-website`  
Production branch: `main`  
Hosting: GitHub Pages

BENGALOOP is a neighbourhood discovery and community initiative starting in S.G. Palya, Bengaluru. This repository contains the static website: ten HTML pages, shared CSS and JavaScript, local image/brand assets and hosting metadata.

## Pages

| Page | File |
|---|---|
| Homepage | `index.html` |
| Explore | `explore.html` |
| Business directory | `directory.html` |
| PG & housing | `pg-housing.html` |
| For businesses | `for-businesses.html` |
| Business registration preview | `business-registration.html` |
| Departments & roles | `departments.html` |
| Our story | `our-story.html` |
| Our team | `our-team.html` |
| What we do | `what-we-do.html` |

## Source map

- `style.css` — shared design system, page layouts, responsive behaviour and interaction states.
- `script.js` — shared navigation and public business-directory experience.
- `recruitment.js` — six departments, role descriptions and interactive role explorer.
- `business-registration.js` — preview-only form interaction.
- `ARCHITECTURE.md` — current page map, data boundaries, dependencies, risks and rebuild recommendations.
- `tools/validate_site.py` — dependency-free repository structure and integration checks.

## Data and privacy boundaries

### Public business directory
Only `directory.html` and `pg-housing.html` load the published PUBLIC DIRECTORY Google Sheets CSV. The browser filters for listings marked `Approved`. Do not point the public website at internal/master data or private form-response tabs.

### Recruitment
The department and role explorer is client-side content. It does not collect applications or manage applicant records.

### Business registration
The registration page is a preview only. It does not transmit or save entered information. Do not enter real business or personal information into the current preview form. A secure server-side submission service must be designed and reviewed before the form is activated.

## Local preview

The pages are static. From the repository root, run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Quality checks

The repository quality gate uses Python's standard library and Node.js; it requires no third-party packages:

```bash
python tools/validate_site.py
node --check script.js
node --check recruitment.js
node --check business-registration.js
```

GitHub Actions runs the same checks on pushes to `main` and pull requests targeting `main`.

## Publishing

The production website is published from the `main` branch using GitHub Pages. Make changes in a branch, run quality checks, review the diff, then merge the approved change to `main`. Confirm the Pages deployment succeeds before announcing that a change is live.

Keep the root `CNAME` file and existing GitHub Pages/custom-domain settings. Do not change DNS records as part of routine content or design work.

## Rollback reference

The pre-improvement production baseline is preserved at:

- Branch: `backup/pre-improvement-baseline-2026-11-07`
- Commit: `b67b8d0827c988c219d4395c0178a27b43f2d2c2`

See `ARCHITECTURE.md` for the complete technical overview and migration principles.
