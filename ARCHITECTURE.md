# BENGALOOP website architecture — local marketing model

## Public pages
- `index.html`: local marketing proposition, four launch services, add-on
  capabilities, process, business enquiry form and leadership preview.
- `our-team.html`: complete Founder → two Co-founders → 15 Members hierarchy.

## Launch offer
Four initial services: Google Business Profile / Maps presence, social media
management, content and creative production, and WhatsApp Business setup.
Paid ads, websites/catalogues, offline campaigns, retention, strategy,
reputation support and training are additional services by consultation.
Advertising spend and third-party subscription costs remain separate from
service fees and must be agreed before launch.

## Enquiry data
The form is a front-end design until a secure server-side receiver is configured
in `data-form-endpoint`. While blank, the form does not transmit or store data
and clearly warns visitors not to enter real business details.

## Team and search
Full team profiles remain on `our-team.html`; the homepage shows only leadership.
robots.txt permits crawling; sitemap.xml lists home and team. Legacy pages redirect
to the new model and are marked noindex. CNAME remains sgpalya.in.

## Recovery
Suspended state backup: `backup/pre-new-marketing-model-2026-11-09`.
Original pre-suspension site: `backup/pre-website-suspension-2026-11-08`.
