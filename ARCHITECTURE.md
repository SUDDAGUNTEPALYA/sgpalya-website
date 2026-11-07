# BENGALOOP website architecture

## Canonical experience
BENGALOOP is delivered as one continuous, long-scrolling page at `index.html`.
The primary navigation uses same-document anchors. The canonical page owns the
shared header, footer, all visible content sections and all interactive systems.

## Main section anchors
- `#home` — hero and homepage introduction
- `#explore` — neighbourhood categories and search
- `#directory` — one shared approved-listings directory
- `#housing` — PG and housing introduction; filters the shared directory
- `#for-businesses` — business-owner information
- `#business-registration` — registration form preview (not connected to storage)
- `#what-we-do` — BENGALOOP operating model and roadmap
- `#story` — neighbourhood story and timeline
- `#team` — team profiles and technical leadership
- `#departments` — six departments and 19 role profiles

## Legacy route compatibility
The former page URLs remain as small, noindex route bridges. They preserve existing
bookmarks and external links, then redirect to the relevant section of `index.html`.
They do not contain a second copy of the website.

## Shared functionality
- `style.css`: design tokens, layout, responsive styling, navigation and interactions.
- `script.js`: navigation drawer, same-page search, category filtering, sorting,
  public directory loading, scroll reveals and active-section navigation.
- `recruitment.js`: six departments and their 19 role profiles.
- `business-registration.js`: explicitly preview-only registration interaction.

## Directory data boundary
The website reads only the published public directory CSV specified by the
`bengaloop-directory-csv` meta tag. Only rows marked Approved are rendered.
The script does not request private form responses or internal master data.

## Release and recovery
Design work must be developed on a separate branch and reviewed before merging.
The pre-consolidation state is preserved on
`backup/pre-single-page-consolidation-2026-11-07`.
