import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BENGALOOP_BASE_URL || "http://127.0.0.1:8000";
const out = process.env.BENGALOOP_SCREENSHOT_DIR || "artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];

async function openPage(route, viewport, label) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  page.on("pageerror", error => errors.push(label + ": " + error.message));
  await page.goto(base + route, { waitUntil: "domcontentloaded" });
  return page;
}

async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    label + " horizontal overflow " + JSON.stringify(dimensions)
  );
}

async function checkStudentForm(page, label) {
  const form = page.locator("#studentApplicationForm");
  assert.equal(await form.getAttribute("data-form-endpoint"), "", label + " form must remain safely disabled");
  assert.equal(await form.getAttribute("data-requires-consent"), "true", label + " form must require explicit consent before activation");
  const names = await form.locator("[name]").evaluateAll(nodes => nodes.map(node => node.name));
  assert.deepEqual(names, ["name", "registerNumber", "class", "department"], label + " must retain the original four fields");
  assert.equal(await form.locator('[name="department"] option').count(), 7, label + " must have a placeholder and six departments");
  await form.locator('[name="name"]').fill("Sample Applicant");
  await form.locator('[name="registerNumber"]').fill("SAMPLE123");
  await form.locator('[name="class"]').fill("B.Com GMAS, 2nd year, Section 2");
  await form.locator('[name="department"]').selectOption({ label: "Business Development & Client Partnerships" });
  await form.locator('button[type="submit"]').click();
  await page.waitForFunction(() =>
    document.querySelector("#studentApplicationStatus")?.innerText.includes("Applications are not being collected yet")
  );
  assert.ok((await page.locator("#studentApplicationStatus").innerText()).includes("not been sent or stored"));
}

try {
  // Desktop homepage and shared navigation.
  const desktop = await openPage("/index.html", { width: 1440, height: 960 }, "desktop homepage");
  assert.equal(await desktop.locator("h1").count(), 1);
  assert.ok((await desktop.title()).includes("Business Growth Ecosystem"));
  assert.equal(await desktop.locator(".eco-model-card").count(), 2);
  assert.equal(await desktop.locator(".eco-journey-step").count(), 3);
  assert.equal(await desktop.locator(".agency-service-card").count(), 6);
  assert.equal(await desktop.locator(".agency-next-card").count(), 3);
  assert.equal(await desktop.locator('#businessEnquiryForm input[name="services"]').count(), 6);
  assert.ok((await desktop.locator("#services").innerText()).includes("Business strategy & research"));
  assert.ok((await desktop.locator("#services").innerText()).includes("Operations, projects & people"));
  assert.equal(await desktop.locator(".agency-leader-card").count(), 2);
  assert.ok((await desktop.locator(".agency-member-count").innerText()).includes("18"));
  assert.equal(await desktop.locator("#businessEnquiryForm").getAttribute("data-form-endpoint"), "");
  await noOverflow(desktop, "desktop homepage");
  await desktop.screenshot({ path: path.join(out, "desktop-ecosystem-home.png"), fullPage: true });

  await desktop.locator("#menu").click();
  await desktop.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  assert.ok((await desktop.locator("#nav").innerText()).includes("Experiment Lab"));
  await desktop.locator('#nav a[href="#ecosystem"]').click();
  await desktop.waitForFunction(() => location.hash === "#ecosystem");
  await desktop.locator("#menu").click();
  await desktop.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  await desktop.locator('#nav a[href="our-team.html"]').click();
  await desktop.waitForURL("**/our-team.html");

  // Team hierarchy remains unchanged.
  assert.equal(await desktop.locator(".team-level-cofounders .team-card").count(), 0);
  assert.equal(await desktop.locator(".team-level-members .team-card").count(), 18);
  assert.equal(await desktop.locator(".team-level-members .team-status").count(), 18);
  assert.equal(await desktop.locator(".team-level-members .team-card-new").count(), 0);
  assert.equal(await desktop.locator(".team-level-members .team-card").filter({ hasText: "Jenneth Pinto" }).count(), 1);
  const jennethPhoto = desktop.locator(".team-level-members .team-card").filter({ hasText: "Jenneth Pinto" }).locator("img");
  await jennethPhoto.scrollIntoViewIfNeeded();
  await jennethPhoto.evaluate(img => { img.loading = "eager"; });
  await jennethPhoto.waitForFunction(img => img.complete && img.naturalWidth > 0);
  await desktop.screenshot({ path: path.join(out, "desktop-full-team.png"), fullPage: true });
  await noOverflow(desktop, "desktop team");
  await desktop.close();

  // Experiment Lab at desktop: all programme/department/role data and form contract.
  const labDesktop = await openPage("/join-us.html", { width: 1440, height: 960 }, "desktop Experiment Lab");
  assert.ok((await labDesktop.title()).includes("Experiment Lab"));
  assert.equal(await labDesktop.locator(".lab-course-card").count(), 4);
  assert.equal(await labDesktop.locator(".lab-dept-card").count(), 6);
  assert.equal(await labDesktop.locator(".lab-role").count(), 19);
  assert.ok((await labDesktop.locator(".lab-independence").innerText()).includes("not an official project"));
  await noOverflow(labDesktop, "desktop Experiment Lab");
  await labDesktop.screenshot({ path: path.join(out, "desktop-experiment-lab.png"), fullPage: true });
  await checkStudentForm(labDesktop, "desktop Experiment Lab");
  await labDesktop.close();

  // Mobile homepage, drawer and business-enquiry disabled-submission boundary.
  const mobile = await openPage("/index.html", { width: 390, height: 844 }, "mobile homepage 390");
  await mobile.screenshot({ path: path.join(out, "mobile-ecosystem-home-390.png"), fullPage: true });
  await mobile.locator("#menu").click();
  await mobile.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  await mobile.screenshot({ path: path.join(out, "mobile-ecosystem-menu-390.png") });
  await mobile.locator('#nav .nav-cta[href="#business-enquiry"]').click();
  await mobile.waitForFunction(() => location.hash === "#business-enquiry");
  await mobile.locator('[name="businessName"]').fill("Sample Cafe");
  await mobile.locator('[name="contactName"]').fill("Sample Owner");
  await mobile.locator('[name="category"]').selectOption({ label: "Food & Beverage" });
  await mobile.locator('[name="phone"]').fill("9876543210");
  await mobile.locator('[name="consent"]').check();
  await mobile.locator('button[type="submit"]').click();
  await mobile.waitForFunction(() => document.querySelector("#businessEnquiryStatus")?.dataset.state === "error");
  assert.ok((await mobile.locator("#businessEnquiryStatus").innerText()).includes("not being collected yet"));
  await noOverflow(mobile, "mobile homepage 390");
  await mobile.screenshot({ path: path.join(out, "mobile-business-enquiry-390.png"), fullPage: true });
  await mobile.close();

  // Mobile team page and recruitment page.
  const teamMobile = await openPage("/our-team.html", { width: 390, height: 844 }, "mobile team");
  assert.equal(await teamMobile.locator(".team-level-members .team-card").count(), 18);
  assert.equal(await teamMobile.locator(".team-level-members .team-status").count(), 18);
  await noOverflow(teamMobile, "mobile team 390");
  await teamMobile.screenshot({ path: path.join(out, "mobile-full-team-390.png"), fullPage: true });
  await teamMobile.close();

  const labMobile = await openPage("/join-us.html", { width: 390, height: 844 }, "mobile Experiment Lab 390");
  assert.equal(await labMobile.locator(".lab-course-card").count(), 4);
  assert.equal(await labMobile.locator(".lab-dept-card").count(), 6);
  assert.equal(await labMobile.locator(".lab-role").count(), 19);
  await noOverflow(labMobile, "mobile Experiment Lab 390");
  await labMobile.screenshot({ path: path.join(out, "mobile-experiment-lab-390.png"), fullPage: true });
  await checkStudentForm(labMobile, "mobile Experiment Lab");
  await labMobile.close();

  const narrowLab = await openPage("/join-us.html", { width: 360, height: 800 }, "mobile Experiment Lab 360");
  await noOverflow(narrowLab, "mobile Experiment Lab 360");
  await narrowLab.close();

  // Legacy entry route still lands on the business enquiry section.
  const legacy = await browser.newPage();
  await legacy.goto(base + "/business-registration.html", { waitUntil: "domcontentloaded" });
  await legacy.waitForURL("**/index.html#business-enquiry");
  await legacy.close();

  assert.deepEqual(errors, [], "browser errors: " + errors.join(" | "));
  console.log("PASS: homepage, shared navigation, team hierarchy, Experiment Lab desktop/mobile layouts, four-field student form, disabled business enquiry, and legacy route.");
} finally {
  await browser.close();
}
