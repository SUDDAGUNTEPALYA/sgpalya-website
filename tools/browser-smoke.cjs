/* Desktop and mobile smoke suite for the BENGALOOP static site.
   Uses a harmless in-memory directory fixture. No external form or data is submitted. */
"use strict";

const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:4173";
const ROUTES = [
  "index.html", "explore.html", "directory.html", "pg-housing.html",
  "for-businesses.html", "business-registration.html", "departments.html",
  "our-story.html", "our-team.html", "what-we-do.html"
];
const VIEWPORTS = [
  { width: 320, height: 800, name: "narrow-mobile" },
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1440, height: 1000, name: "desktop" }
];
const DIRECTORY_FIXTURE = [
  "Business Name,Category,Description,Address,Contact Number,WhatsApp Number,Google Maps Link,Opening Hours,Business Photo URL,Listing Status",
  "Green Leaf Cafe,Food & Dining,Fresh vegetarian meals and coffee,12 Main Road S.G. Palya Bengaluru,9000000001,9000000001,,9 AM to 9 PM,,Approved",
  "Campus Stay,PGs & Housing,Shared accommodation near campus,18 College Road S.G. Palya Bengaluru,9000000002,9000000002,,Open all day,,Approved",
  "Pending Test Listing,Food & Dining,This record must stay private,Private Test Address,9000000003,9000000003,,, ,Pending"
].join("\n");

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE + "/index.html");
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error("The local static server did not start.");
}

async function installDirectoryFixture(page) {
  let fixtureHits = 0;
  await page.route("https://docs.google.com/spreadsheets/**", async route => {
    fixtureHits += 1;
    await route.fulfill({
      status: 200,
      contentType: "text/csv; charset=utf-8",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type"
      },
      body: DIRECTORY_FIXTURE
    });
  });
  return () => fixtureHits;
}

async function inspectViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.width <= 390,
    hasTouch: viewport.width <= 390,
    reducedMotion: "no-preference"
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    await installDirectoryFixture(page);
    const response = await page.goto(BASE + "/" + route, { waitUntil: "domcontentloaded" });
    assert.ok(response && response.ok(), route + " failed to load at " + viewport.name);
    await page.locator("#main h1").waitFor({ state: "visible" });

    const state = await page.evaluate(() => {
      const header = document.querySelector(".site-header");
      const rect = header?.getBoundingClientRect();
      return {
        title: document.title,
        h1Count: document.querySelectorAll("#main h1").length,
        currentNavCount: document.querySelectorAll("#nav a[aria-current='page']").length,
        hasDesignSystem: [...document.styleSheets].some(sheet => sheet.href?.includes("design-system.css")),
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        headerLeft: rect?.left ?? -1,
        headerRight: rect?.right ?? Infinity
      };
    });

    assert.ok(state.title, route + " has no title");
    assert.equal(state.h1Count, 1, route + " should have one main heading");
    assert.equal(state.currentNavCount, 1, route + " should mark exactly one current navigation item");
    assert.ok(state.hasDesignSystem, route + " did not load design-system.css");
    assert.ok(state.documentWidth <= state.viewportWidth + 1, route + " has document horizontal overflow at " + viewport.width);
    assert.ok(state.bodyWidth <= state.viewportWidth + 1, route + " has body horizontal overflow at " + viewport.width);
    assert.ok(state.headerLeft >= -1 && state.headerRight <= state.viewportWidth + 1, route + " has an off-screen shared header");

    if (viewport.name === "mobile" || viewport.name === "desktop") {
      const filename = route.replace(/\.html$/, "") || "home";
      await page.screenshot({
        path: path.join(process.cwd(), "test-results", viewport.name + "-" + filename + ".png"),
        fullPage: true,
        animations: "disabled"
      });
    }

    await page.close();
  }
  await context.close();
}

async function inspectNavigation(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
  await page.locator("#menu").click();
  await page.waitForFunction(() => document.querySelector("#menu")?.getAttribute("aria-expanded") === "true");
  assert.ok(await page.locator("#nav").evaluate(node => node.classList.contains("open")), "mobile drawer did not open");
  assert.equal(await page.locator("#nav").getAttribute("aria-hidden"), "false");
  await page.locator("#nav a[href='explore.html']").click();
  await page.waitForURL("**/explore.html");
  assert.match(new URL(page.url()).pathname, /explore\.html$/);
  await context.close();
}

async function inspectDirectory(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("console", message => { if (message.type() === "error" || message.type() === "warning") pageErrors.push(message.text()); });
  page.on("requestfailed", request => pageErrors.push("REQUEST FAILED: " + request.url() + " :: " + request.failure()?.errorText));
  const fixtureHitCount = await installDirectoryFixture(page);
  await page.goto(BASE + "/directory.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#listingGrid")?.getAttribute("aria-busy") === "false", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(150);
  const state = await page.evaluate(() => ({
    feedUrl: document.querySelector('meta[name="bengaloop-directory-csv"]')?.content || "",
    status: document.querySelector("#listingStatus")?.textContent || "",
    count: document.querySelector("#listingCount")?.textContent || "",
    result: document.querySelector("#result")?.textContent || "",
    gridBusy: document.querySelector("#listingGrid")?.getAttribute("aria-busy"),
    gridHidden: document.querySelector("#listingGrid")?.hidden,
    cardCount: document.querySelectorAll("#listingGrid .listing-card").length
  }));
  assert.equal(fixtureHitCount(), 1, "directory CSV fixture was not requested; state=" + JSON.stringify(state) + "; errors=" + pageErrors.join(" | "));
  assert.equal(state.cardCount, 2, "expected two approved fixture listings; state=" + JSON.stringify(state) + "; errors=" + pageErrors.join(" | "));
  await page.locator("#directorySearch").fill("Cafe");
  await page.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 1);
  await page.locator("[data-filter='Food & Dining']").click();
  await page.waitForFunction(() => document.querySelectorAll("#listingGrid .listing-card").length === 1);
  await context.close();
}

async function inspectRecruitment(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE + "/departments.html", { waitUntil: "domcontentloaded" });
  await page.locator("[data-department-id='business']").click();
  await page.locator("#departmentRoleList .department-role-option").first().waitFor({ state: "visible" });
  assert.ok(await page.locator("#departmentRoleList .department-role-option").count() >= 1);
  await page.locator("#departmentRoleList .department-role-option").first().click();
  await page.locator("#roleDetailPanel .role-detail-content h5").waitFor({ state: "visible" });
  await context.close();
}

async function inspectRegistrationPreview(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(BASE + "/business-registration.html", { waitUntil: "domcontentloaded" });
  await page.locator("[name='business_name']").fill("Example Neighbourhood Cafe");
  await page.locator("[name='category']").selectOption({ label: "Food & Dining" });
  await page.locator("[name='description']").fill("A browser test fixture. No information is transmitted.");
  await page.locator("[name='address']").fill("S.G. Palya, Bengaluru");
  await page.locator("[name='contact_person']").fill("Test User");
  await page.locator("[name='public_phone']").fill("9000000001");
  await page.locator("[name='accuracy_consent']").check();
  await page.getByRole("button", { name: /Preview submission/i }).click();
  await page.locator("#registrationFormStatus").filter({ hasText: "Preview only" }).waitFor({ state: "visible" });
  assert.match(await page.locator("#registrationFormStatus").innerText(), /not been sent or saved/i);
  await context.close();
}

(async () => {
  const server = spawn("python3", ["-m", "http.server", "4173", "--bind", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "ignore"
  });
  let browser;
  try {
    mkdirSync(path.join(process.cwd(), "test-results"), { recursive: true });
    await waitForServer();
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    for (const viewport of VIEWPORTS) await inspectViewport(browser, viewport);
    await inspectNavigation(browser);
    await inspectDirectory(browser);
    await inspectRecruitment(browser);
    await inspectRegistrationPreview(browser);
    process.stdout.write("PASS: 10 pages checked at 320, 390, 768 and 1440px; navigation, directory, recruitment and registration preview interactions passed.\n");
  } catch (error) {
    process.stderr.write((error?.stack || String(error)) + "\n");
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
})();
