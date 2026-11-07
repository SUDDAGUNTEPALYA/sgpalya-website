BENGALOOP — S.G. Palya Edition
=================================

BENGALOOP is a static neighbourhood discovery website for S.G. Palya, Bengaluru.

The canonical user experience is one long-scrolling page:
  index.html

Main navigation links scroll to section anchors on that page. Former page URLs
remain as lightweight noindex redirects so existing bookmarks and shared links
continue to work.

Core files:
  index.html                 Canonical single-page website
  style.css                  Shared design system and responsive components
  script.js                  Navigation, search, directory and scroll behaviour
  recruitment.js             Six departments and 19 role profiles
  business-registration.js   Preview-only business registration interaction
  tools/validate_site.py      Structural and integration checks

Directory data:
The public business directory reads the published public CSV configured in the
index.html meta tag. Only rows marked Approved are displayed. Private form data
is not requested by the directory script.

Run quality checks from the repository root:
  python tools/validate_site.py
  node --check script.js
  node --check recruitment.js
  node --check business-registration.js

See ARCHITECTURE.md for section anchors, integrations and release safeguards.
