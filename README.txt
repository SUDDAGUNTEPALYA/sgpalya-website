S.G. PALYA WEBSITE - LIVE DIRECTORY RELEASE

CONTENTS
- index.html: homepage, business registration link, Our Story and Leadership
- style.css: responsive website styling
- script.js: public directory loader, category filters, search, phone/WhatsApp/maps actions
- naval-aggarwal.jpeg: founder profile image
- CNAME: custom domain sgpalya.in
- README.txt: this guide

DIRECTORY DATA
The website fetches the published CSV for the PUBLIC DIRECTORY tab.
Only rows with a non-empty Business Name and Listing Status equal to Approved (case-insensitive) are displayed.
Keep Form Responses and internal/master data private. Publish only the PUBLIC DIRECTORY tab as CSV.
Do not publish personal data unless the business owner has explicitly agreed to public display.

REQUIRED COLUMN HEADERS (ROW 1)
Business Name | Category | Description | Address | Contact Number | WhatsApp Number | Google Maps Link | Opening Hours | Business Photo URL | Listing Status

Category values should match the registration categories:
Food & Dining, PGs & Housing, Shopping, Healthcare, Beauty & Fitness,
Education, Local Services, Transport, Banking & Utilities, Other.

PHONE NUMBERS
For WhatsApp, Indian 10-digit mobile numbers are automatically prefixed with country code 91.
If a number already includes country code, enter it with or without the + sign.

UPDATE THE EXISTING GITHUB REPOSITORY
1. Extract this ZIP into a new folder.
2. Open the existing public repository named sgpalya-website.
3. Choose Add file > Upload files.
4. Upload all six files into the repository root, replacing files with the same names.
5. Commit changes and wait for GitHub Pages to finish deploying.
6. Visit https://sgpalya.in, hard-refresh with Ctrl+F5, then test the directory.

LIVE TEST
For a safe initial test, add a clearly labelled temporary test row to PUBLIC DIRECTORY with Listing Status = Approved, verify it appears on the site, then delete the test row. Use no personal contact details for the test. If no approved rows exist, the site shows the empty-state message instead.
