# BENGALOOP website architecture — student-powered business growth ecosystem

## Product direction
BENGALOOP is an independent, student-powered business growth ecosystem. It connects businesses with multidisciplinary student talent and applies academic knowledge to practical business challenges. The website is not a local business directory, neighbourhood discovery portal, listing marketplace or PG/accommodation discovery product.

S.G. Palya and nearby areas are the starting geography for the model, not the product identity. The longer-term ambition is to work with startups, emerging ventures, professional firms and growing organisations as capability, capacity and suitable partnerships develop.

BENGALOOP is not an official project of, affiliated with or endorsed by CHRIST (Deemed to be University) or its Department of Professional Studies. Do not add university logos, endorsement language or official-project claims without formal permission. Any future institutional collaboration requires formal approval.

## Public pages
- `index.html`: positioning, business/student value model, six capability-led workstreams, multidisciplinary project examples, business enquiry and leadership preview.
- `our-team.html`: one Founder and eighteen Members, with current role descriptions and profiles.
- `join-us.html`: Experiment Lab, four academic pathways, six departments, nineteen role pathways, learning model and student application preview.

Legacy routes remain noindex redirects for continuity. They do not represent active products or services.

## Experiment Lab is the capability foundation
The homepage workstreams map to the six Experiment Lab departments:
1. Business Strategy & Research
2. Finance & Business Analysis
3. Brand, Marketing & Creative
4. Business Development & Client Partnerships
5. Technology & Digital Solutions
6. Operations, Projects & People

The four academic pathways remain:
- B.Com Global Management Accounting & Strategy — integrated with CIMA UK.
- B.Com International Accountancy & Finance — integrated with ACCA.
- B.Com Branding & Entrepreneurship.
- B.Com Accountancy & Finance — integrated with CA (ICAI).

The nineteen role pathways are functional learning opportunities, not rigid course-to-role mappings or a promise to recruit exactly nineteen people. Allocation must consider interest, aptitude, demonstrated readiness, appropriate oversight and actual project needs.

Service descriptions are capability areas, not blanket guarantees. Each engagement must be assessed against team readiness, time, oversight, scope and the business's needs. Finance work is limited to management information and decision support; do not imply statutory audit, tax filing, legal advice or regulated investment services. Do not promise outcomes or claim delivery without evidence.

## Forms and data handling
- The business enquiry form remains a front-end preview until a secure HTTPS server-side receiver is configured in `data-form-endpoint`. While blank, it sends and stores nothing; its notice must tell visitors not to enter real business details.
- The student application preview retains exactly four fields: full name, register number, class/course & section, and preferred department. While its endpoint is blank, applications are not collected and details are not sent or stored.
- Before student applications open, publish the recruitment notice and privacy information, add an explicit consent control, configure a secure HTTPS receiver, and establish a review process. The shared handler blocks student submission if consent is absent.
- Never put API secrets or private credentials in frontend HTML or JavaScript. Validate and protect submissions server-side.

## Static architecture
- `index.html`, `our-team.html`, `join-us.html`: three public static pages.
- `style.css`: shared reset, foundational styles and retained team-page styles; legacy selectors should only be removed after coverage-based regression testing.
- `agency.css`: shared ecosystem layout, navigation, business workstreams, enquiry, leadership and responsive styling.
- `ecosystem-home.css`: homepage-only ecosystem model.
- `experiment-lab.css`: Experiment Lab-only design.
- `relaunch.js`: shared navigation, footer year and guarded form handlers.

## Quality checks
- `python tools/validate_site.py`
- `node --check relaunch.js`
- `node tools/browser_smoke_test.mjs`

GitHub Actions runs structural, link, asset, form-contract, JavaScript and Playwright desktop/mobile checks on pushes to main and pull requests to main.
