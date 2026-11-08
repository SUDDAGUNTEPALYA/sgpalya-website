BENGALOOP — S.G. Palya Edition
=================================

BENGALOOP is a static neighbourhood discovery website for S.G. Palya, Bengaluru.

TEMPORARY PUBLIC SUSPENSION (8 NOVEMBER 2026)
------------------------------------------------
The public website is currently paused. The live homepage is a small maintenance
notice marked noindex; the former homepage, team, recruitment content, assets,
directory and code have not been deleted.

Recovery point:
  backup/pre-website-suspension-2026-11-08
  pre-suspension commit: cf5e3d1a4e6a73f5d344c356519562c80e95cc5f

To revive the original website, restore the public-site files from that backup
(or revert the suspension commit) and remove SITE_SUSPENDED. Keep CNAME pointing
to sgpalya.in. Do not delete the repository, domain configuration or backup.
Search engines need to recrawl the noindex landing page before old results
disappear; this is not necessarily immediate.

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
