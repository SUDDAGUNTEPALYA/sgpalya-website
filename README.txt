BENGALOOP — Local Marketing & Creative Studio
================================================

BENGALOOP is a local marketing and creative studio serving businesses in
S.G. Palya, Bengaluru.

Active public pages:
  index.html       Local marketing services, business enquiry preview and leadership
  our-team.html    Founder → 2 Co-founders → 16 Members
  join-us.html     Campus recruitment overview and application preview
  agency.css       Mobile-first relaunch design system
  relaunch.js      Shared navigation and business enquiry behaviour

Team structure:
  Founder & CEO: Naval Aggarwal
  Co-founders: Rhythm Mehrotra and Yuval Ostwal
  Chief Technology Officer: Subhankar Raj Gupta (Member tier)
  Other team members: 15
  Total: 19 people

Launch service focus: Google Business Profile / Maps presence, social media
management, content and creative production, and WhatsApp Business setup.
Additional capabilities are offered by consultation.

FORM STATUS: Both the business enquiry and student application forms are
preview-only. The business form's data-form-endpoint is blank, and the student
form's submit handler only displays a preview notice. Neither form sends or
stores submitted details. Do not collect real data until secure server-side
submission and access controls are configured.

LEGACY FILES: script.js (CSV directory), recruitment.js (six-department role
explorer) and business-registration.js (old registration preview) are retained
for reference and are not loaded by the current public pages.

Checks:
  python tools/validate_site.py
  node --check relaunch.js
  node --check script.js
  node --check recruitment.js
  node --check business-registration.js
  node tools/browser_smoke_test.mjs

CNAME remains sgpalya.in.
