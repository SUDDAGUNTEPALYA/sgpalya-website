import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.BENGALOOP_BASE_URL || "http://127.0.0.1:8000";
const screenshotDir = process.env.BENGALOOP_SCREENSHOT_DIR || "artifacts";
fs.mkdirSync(screenshotDir, { recursive: true });

async function capture(page, filename, fullPage = false) {
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage });
}

async function captureSection(page, selector, filename) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, filename);
}
const csv = [
  "Business Name,Category,Description,Address,Contact Number,WhatsApp Number,Google Maps Link,Opening Hours,Listing Status",
  "Test Cafe,Food & Dining,Fresh coffee,12 Main Road,9876543210,9876543210,,8 AM to 8 PM,Approved",
  "S.G. Clinic,Healthcare,Neighbourhood clinic,14 Main Road,9876543211,9876543211,,9 AM to 6 PM,Approved",
  "Green PG,PGs & Housing,Student accommodation,16 Main Road,9876543212,9876543212,,24 hours,Approved",
  "Hidden Draft,Shopping,This must not be public,18 Main Road,9876543213,9876543213,,10 AM to 8 PM,Pending"
].join("\n");

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];

async function watch(page, label) {
  page.on("pageerror", error => failures.push(label + ": " + error.message));
  await page.route("https://docs.google.com/**", route => route.fulfill({
    status: 200,
    contentType: "text/csv; charset=utf-8",
    headers: { "access-control-allow-origin": "*" },
    body: csv
  }));
}

async function openPage(viewport, label) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  await watch(page, label);
  await page.goto(baseURL + "/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 3);
  return page;
}

async function noHorizontalOverflow(page, label) {
  const size = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll("main > section *"))
      .filter(element => !element.closest(".filter-chips"))
      .map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          element: element.tagName.toLowerCase()
            + (element.id ? "#" + element.id : "")
            + (element.classList?.length ? "." + Array.from(element.classList).slice(0, 2).join(".") : ""),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          position: style.position,
          visibility: style.visibility,
          display: style.display
        };
      })
      .filter(item => item.width > 0 && item.visibility !== "hidden"
        && item.display !== "none" && !["absolute", "fixed"].includes(item.position)
        && (item.left < -1 || item.right > viewport + 1))
      .slice(0, 12);
    return {
      viewport,
      pageScrollX: window.scrollX,
      rootOverflowX: getComputedStyle(document.documentElement).overflowX,
      offenders
    };
  });
  assert.equal(size.pageScrollX, 0, label + " should not be horizontally scrollable");
  assert.equal(size.rootOverflowX, "clip", label + " root must clip accidental horizontal overflow");
  assert.deepEqual(size.offenders, [],
    label + " has visible main-content elements outside the viewport: " + JSON.stringify(size.offenders));
}

try {
  const desktop = await openPage({ width: 1440, height: 900 }, "desktop");
  assert.equal(await desktop.locator("h1").count(), 1, "the page must expose exactly one H1");
  assert.equal(await desktop.locator("#listingGrid .listing-card").count(), 3,
    "only approved CSV listings should render");
  assert.equal(await desktop.locator("#listingGrid").innerText().then(value => value.includes("Hidden Draft")), false,
    "non-approved listings must never render");
  await capture(desktop, "desktop-home.png");

  await desktop.locator("#menu").click();
  await desktop.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  await desktop.locator('#nav a[href="#team"]').click();
  await desktop.waitForFunction(() => location.hash === "#team");
  await desktop.waitForFunction(() => !document.querySelector("#nav").classList.contains("open"));
  await desktop.waitForTimeout(500);
  const anchorGeometry = await desktop.evaluate(() => ({
    teamTop: document.querySelector("#team").getBoundingClientRect().top,
    headerBottom: document.querySelector(".site-header").getBoundingClientRect().bottom,
    scrollY: window.scrollY,
    scrollPaddingTop: getComputedStyle(document.documentElement).scrollPaddingTop,
    headerPosition: getComputedStyle(document.querySelector(".site-header")).position
  }));
  console.log("Desktop section-anchor geometry: " + JSON.stringify(anchorGeometry));
  assert.ok(anchorGeometry.teamTop >= anchorGeometry.headerBottom - 2
    && anchorGeometry.teamTop <= anchorGeometry.headerBottom + 110,
    "team anchor should land clear of the sticky header: " + JSON.stringify(anchorGeometry));

  await desktop.locator('button.explore-category-card[data-filter="Healthcare"]').click();
  await desktop.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 1
    && document.querySelector("#listingGrid").innerText.includes("S.G. Clinic"));
  assert.equal(await desktop.locator('.filter-chip[data-filter="Healthcare"]').getAttribute("aria-pressed"), "true");

  await desktop.locator("#exploreSearch").fill("cafe");
  await desktop.locator('#exploreSearchForm button[type="submit"]').click();
  await desktop.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 1
    && document.querySelector("#listingGrid").innerText.includes("Test Cafe"));

  await desktop.locator('.housing-filter-callout button[data-filter="PGs & Housing"]').click();
  await desktop.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 1
    && document.querySelector("#listingGrid").innerText.includes("Green PG"));

  await desktop.locator('#departments [data-department-id="business"]').click();
  await desktop.waitForFunction(() => !document.querySelector("#departmentExplorer").hidden
    && document.querySelector("#departmentExplorer").classList.contains("is-open"));
  assert.equal(await desktop.locator("#departmentRoleList .department-role-option").count(), 4,
    "business department should expose its four roles");
  await desktop.locator('#departmentRoleList [data-role-id="business-outreach"]').click();
  await desktop.waitForFunction(() => document.querySelector("#roleDetailPanel h5")?.textContent === "Business Outreach Associate");

  await desktop.locator("#businessRegistrationForm").evaluate(form =>
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await desktop.waitForFunction(() => document.querySelector("#registrationFormStatus").textContent.includes("No information has been sent or saved"));
  await captureSection(desktop, "#explore", "desktop-explore.png");
  await captureSection(desktop, "#directory", "desktop-directory.png");
  await captureSection(desktop, "#team", "desktop-team.png");
  await captureSection(desktop, "#departments", "desktop-departments.png");
  await desktop.addStyleTag({ content: "html{scroll-behavior:auto!important} .scroll-reveal{opacity:1!important;transform:none!important;filter:none!important} *{animation:none!important;transition:none!important}" });
  await capture(desktop, "desktop-full-page.png", true);
  await noHorizontalOverflow(desktop, "desktop");
  await desktop.close();
  console.log("PASS: desktop navigation, anchors, directory, recruitment and registration-preview interactions.");

  const mobile = await openPage({ width: 390, height: 844 }, "mobile");
  await capture(mobile, "mobile-home-390.png");
  await mobile.locator("#menu").click();
  await mobile.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  await capture(mobile, "mobile-menu-390.png");
  await mobile.locator('#nav a[href="#departments"]').click();
  await mobile.waitForFunction(() => location.hash === "#departments");
  await mobile.waitForFunction(() => !document.querySelector("#nav").classList.contains("open"));
  await mobile.waitForFunction(() => getComputedStyle(document.querySelector("#nav")).visibility === "hidden");
  await captureSection(mobile, "#departments", "mobile-departments-390.png");
  await mobile.addStyleTag({ content: "html{scroll-behavior:auto!important} .scroll-reveal{opacity:1!important;transform:none!important;filter:none!important} *{animation:none!important;transition:none!important}" });
  await capture(mobile, "mobile-full-page-390.png", true);
  await noHorizontalOverflow(mobile, "mobile 390px");
  await mobile.close();

  // Open a fresh 360px page rather than resizing an already-laid-out 390px viewport.
  const narrow = await openPage({ width: 360, height: 800 }, "mobile 360px");
  await noHorizontalOverflow(narrow, "mobile 360px");
  await narrow.close();
  console.log("PASS: mobile menu, section navigation and fresh 390px/360px layout checks.");

  const legacy = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  await watch(legacy, "legacy route");
  await legacy.goto(baseURL + "/pg-housing.html", { waitUntil: "domcontentloaded" });
  await legacy.waitForFunction(() => location.pathname.endsWith("/index.html")
    && location.hash === "#directory"
    && new URLSearchParams(location.search).get("category") === "PGs & Housing");
  await legacy.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 1);
  assert.equal(await legacy.locator('.filter-chip[data-filter="PGs & Housing"]').getAttribute("aria-pressed"), "true");
  await legacy.close();
  console.log("PASS: legacy PG & housing bookmark redirects to the filtered canonical directory.");

  assert.deepEqual(failures, [], "browser runtime errors were detected: " + failures.join(" | "));
  console.log("PASS: no uncaught browser JavaScript errors.");
} finally {
  await browser.close();
}