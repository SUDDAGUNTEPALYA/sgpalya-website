BENGALOOP — S.G. PALYA EDITION
FINAL STATIC WEBSITE PACK

WHAT THIS PACKAGE IS
A redesigned, mobile-responsive BENGALOOP website for the S.G. Palya neighbourhood. It stays compatible with the existing GitHub Pages repository and existing custom domain (sgpalya.in). The website continues to read only the published PUBLIC DIRECTORY Google Sheets CSV and displays only rows whose Listing Status is Approved.

FILES INCLUDED
- index.html                 Homepage, SEO metadata, navigation, directory, story and founder sections
- style.css                  Responsive visual design and accessible interaction states
- script.js                  CSV parsing, approved-listing filter, search, category filters, sort, refresh, Call/WhatsApp/Maps links
- bengaloop-logo.svg         Main logo lockup
- bengaloop-logo-light.svg   Footer logo lockup for dark backgrounds
- brand-mark.svg             Standalone BENGALOOP brand symbol
- bengaloop-avatar.png       Square brand/profile image (512 x 512)
- favicon.svg                Browser tab icon
- bengaloop-hero.webp        Optimised local neighbourhood hero photograph
- bengaloop-social.jpg       Social sharing / Open Graph image
- naval-aggarwal.jpeg       Existing founder portrait, retained from the current website
- site.webmanifest           Browser / home-screen metadata
- robots.txt                 Allows crawling and points to the sitemap
- sitemap.xml                Homepage sitemap
- CNAME                      Existing custom domain: sgpalya.in

IMPORTANT INTEGRATIONS PRESERVED
1. Business registration form:
   https://docs.google.com/forms/d/e/1FAIpQLSeiGcRaqwTJ955a5DtxYZcWAcJa0fbelGYFspJ6abBgTrVXWQ/viewform?usp=dialog
2. Public directory CSV (PUBLIC DIRECTORY tab only):
   https://docs.google.com/spreadsheets/d/e/2PACX-1vSLyv6U-v_9HpsTDy9ydU9R_8kB1ofTKDM9pJIt7AINRa-EZKqS_x0kTryRc-TI-RWXqmRy-FhnKVLI/pub?gid=1528710176&single=true&output=csv
3. Only approved rows with a Business Name are displayed. Form Responses 1 and internal/master data are not fetched or exposed by the site.
4. The existing custom domain remains sgpalya.in. No DNS change is required for this redesign.

PUBLISH TO THE EXISTING GITHUB REPOSITORY
1. Download and extract this ZIP on your computer.
2. Open the existing repository: SUDDAGUNTEPALYA / sgpalya-website.
3. Open the Code tab, then choose Add file > Upload files.
4. Upload every file from the extracted package into the repository root (the same level as index.html). Do not upload the ZIP itself.
5. If GitHub asks about replacing existing files, confirm replacement for files with matching names. Keep the assets in the repository root exactly as shown in this package.
6. Commit directly to the main branch with a message such as: Publish BENGALOOP redesign.
7. Wait for the GitHub Pages deployment to show a green success/check mark.
8. Open https://sgpalya.in and hard-refresh with Ctrl+Shift+R.

DO NOT
- Change or delete the GoDaddy DNS records.
- Change the GitHub Pages custom domain or disable Enforce HTTPS.
- Publish the Form Responses 1 tab or any private/internal spreadsheet data.
- Add unapproved listings to the public directory.
- Upload the ZIP archive itself to the repository.

FUNCTIONALITY
- Search works from the hero search field and directory search field; both remain synchronised.
- Category tiles and directory filter chips filter approved listings.
- Sort options support default sheet order, name A-Z and category.
- Refresh listings reloads the public CSV. The page shows a clear empty/error state if the feed cannot be reached.
- Business cards use textContent to display CSV values (not raw HTML), accept HTTPS links only, and expose Call, WhatsApp and Directions only when usable details exist.
- Mobile navigation opens/closes with its button, links and Escape key.
- The map illustration is explicitly marked as illustrative and not to scale; the Maps button opens Google Maps for the locality. The hero street image is a generated illustrative visual, not a documentary photograph of a specific S.G. Palya street.

TESTING NOTES
The package has been checked for file presence, HTML structure, JavaScript syntax, XML/JSON validity, asset references, ZIP integrity and responsive CSS breakpoints. The public Google Sheets CSV and GitHub Pages deployment still require a live browser/network test after you publish, because those are external services and are not modified by this ZIP.
