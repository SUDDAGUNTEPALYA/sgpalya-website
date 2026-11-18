# BENGALOOP website architecture — local marketing model

## Active public pages
- `index.html`: local marketing proposition, four launch services, add-on
  capabilities, process, business enquiry preview and leadership preview.
- `our-team.html`: Founder → two Co-founders → sixteen Members.
- `join-us.html`: campus recruitment overview, six departments, nineteen
  interactive role profiles and an application preview.

## Launch offer
Four initial services: Google Business Profile / Maps presence, social media
management, content and creative production, and WhatsApp Business setup.
Paid ads, websites/catalogues, offline campaigns, retention, strategy,
reputation support and training are additional services by consultation.
Advertising spend and third-party subscription costs remain separate from
service fees and must be agreed before launch.

## Form and data boundaries
The business enquiry form in `index.html` and student application form in
`join-us.html` are preview-only. Neither form currently sends or stores
submissions. The business form's `data-form-endpoint` is intentionally blank;
the student form is handled by an inline preview-only submit listener. Do not
collect real information until a secure server-side receiver, validation,
access controls, privacy notice and retention process are implemented.

## Team and recruitment
The published team structure is one Founder, two Co-founders and sixteen
Members (nineteen people total). Naval Aggarwal is Founder & CEO; Rhythm
Mehrotra and Yuval Ostwal are Co-founders; Subhankar Raj Gupta is Chief
Technology Officer and remains in the Member tier. `recruitment.js` powers
the six-department / nineteen-role explorer on `join-us.html`.

## Legacy source files
`script.js` contains the former CSV-powered local directory, and
`business-registration.js` supports the former registration preview. These
files are retained for historical/reference purposes and are not loaded by the
current public pages. The legacy routes redirect to the current experience.

## Search and deployment
`robots.txt` permits crawling; `sitemap.xml` lists the homepage, team and
recruitment pages. Legacy pages are marked noindex. GitHub Pages serves the
static site; `CNAME` remains `sgpalya.in`. GitHub Actions validates structure,
all retained JavaScript syntax and desktop/mobile browser interactions.

## Recovery
Suspended state backup: `backup/pre-new-marketing-model-2026-11-09`.
Original pre-suspension site: `backup/pre-website-suspension-2026-11-08`.
