# BENGALOOP website architecture — business growth ecosystem

## Public pages
- `index.html`: BENGALOOP's positioning as an independent, student-led business growth ecosystem; the two-sided value model; current business services; business enquiry; and leadership preview.
- `our-team.html`: Founder → 18 Members hierarchy and individual team profiles.
- `join-us.html`: Experiment Lab — four academic pathways, the business-growth learning model, six departments, nineteen role pathways, future expansion direction, collaboration intent and student application form.

## Positioning and status
BENGALOOP is an independent student-led initiative. It is not an official project of, affiliated with or endorsed by CHRIST (Deemed to be University) or its Department of Professional Studies. Any future institutional collaboration requires formal approval. Do not add university logos, endorsement language or official-project claims without permission.

Core proposition: a student-powered business growth ecosystem that aims to help businesses improve while providing students with practical, real-world learning. Initial business focus: local businesses in S.G. Palya. Longer-term ambition: startups, emerging ventures, professional firms and medium-sized enterprises, subject to expertise, capacity and partnerships.

## Business services
The current homepage offer retains four launch services: Google Business Profile / Maps presence, social media management, content and creative production, and WhatsApp Business setup. Paid advertising, websites/catalogues, offline campaigns, retention, strategy/reputation support and training remain additional services by consultation. Scope, costs and deliverables must be agreed before work begins. Do not imply that every future business-improvement capability is already an active service.

## Experiment Lab
Four invited academic pathways:
- B.Com Global Management Accounting & Strategy — integrated with CIMA UK.
- B.Com International Accountancy & Finance — integrated with ACCA.
- B.Com Branding & Entrepreneurship.
- B.Com Accountancy & Finance — integrated with CA (ICAI).

Six departments and nineteen role pathways are described on the Experiment Lab page. These are functional opportunities, not rigid course-to-role mappings or a promise to recruit exactly nineteen people. Selection should consider interest, aptitude, readiness and project needs.

Student application fields must remain the existing four: full name, register number, class/course & section, and preferred department. The form has no live endpoint. While `data-form-endpoint` is blank, submissions must not be sent or stored and the page must clearly state that applications are not being collected.

## Business enquiry data
The business enquiry form is a front-end design until a secure server-side receiver is configured in `data-form-endpoint`. While blank, it does not transmit or store data and must warn visitors not to enter real business details.

## Team and routes
The team page displays one Founder and eighteen Members; there is no co-founder tier. Legacy pages redirect to the current experience and remain noindex. CNAME remains `sgpalya.in`; robots.txt allows crawling; sitemap.xml lists the homepage, team page and Experiment Lab.

## Design and scripts
- `style.css`: original shared style foundation.
- `agency.css`: current shared agency/site components and responsive relaunch layer.
- `ecosystem-home.css`: additive homepage ecosystem section.
- `experiment-lab.css`: Experiment Lab page-specific responsive design.
- `relaunch.js`: shared navigation, year label and business enquiry form behaviour.
- `tools/validate_site.py`: structural, link, asset and integration-contract checks.
- `tools/browser_smoke_test.mjs`: Playwright desktop/mobile interaction and overflow tests.

## Quality checks
`python tools/validate_site.py`  
`node --check relaunch.js`  
`node tools/browser_smoke_test.mjs`

The GitHub Actions workflow runs these checks on pull requests to main and uploads visual QA screenshots.
