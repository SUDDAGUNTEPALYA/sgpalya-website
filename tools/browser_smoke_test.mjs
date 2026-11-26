import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BENGALOOP_BASE_URL || "http://127.0.0.1:8000";
const out = process.env.BENGALOOP_SCREENSHOT_DIR || "artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];

async function openPage(route, viewport, label, contextOptions = {}) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce", ...contextOptions });
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

async function checkTactileButtons(page, selector, label) {
  const controls = page.locator(selector);
  const count = await controls.count();
  assert.ok(count > 0, label + " should contain visible tactile controls");
  const states = await controls.evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { borderWidth: style.borderTopWidth, shadow: style.boxShadow, text: node.textContent || "" };
  }));
  for (const state of states) {
    assert.equal(state.borderWidth, "2px", label + " control should have a tactile 2px border");
    assert.notEqual(state.shadow, "none", label + " control should have a hard offset shadow");
    assert.ok(/(?:4|5|6|7|8)px (?:4|5|6|7|8)px 0px/.test(state.shadow), label + " control should use a hard, zero-blur shadow");
  }
}

async function checkNoArrowGlyphs(page, label) {
  const result = await page.evaluate(() => {
    const bodyText = document.body.textContent || "";
    const pseudoContent = Array.from(document.querySelectorAll("*")).flatMap(node =>
      ["::before", "::after"].map(pseudo => getComputedStyle(node, pseudo).content || "")
    ).join(" ");
    const arrowPattern = /[\u2190-\u21FF\u27F0-\u27FF\u2900-\u297F]/u;
    return { bodyHasArrow: arrowPattern.test(bodyText), pseudoHasArrow: arrowPattern.test(pseudoContent) };
  });
  assert.equal(result.bodyHasArrow, false, label + " should not contain arrow glyphs in markup");
  assert.equal(result.pseudoHasArrow, false, label + " should not generate arrow glyphs through CSS");
}

async function checkDisclosure(page, selector, expectedCount, expectedItems, label) {
  const disclosures = page.locator(selector);
  assert.equal(await disclosures.count(), expectedCount, label + " disclosure count");
  const first = disclosures.first();
  assert.equal(await first.getAttribute("open"), null, label + " should start collapsed");
  const summary = first.locator("summary");
  assert.ok(await summary.isVisible(), label + " expand control should be visible");
  const list = first.locator("ul");
  assert.equal(await list.isVisible(), false, label + " detail list should start hidden");
  await summary.click();
  assert.notEqual(await first.getAttribute("open"), null, label + " should open on activation");
  assert.equal(await list.isVisible(), true, label + " detail list should be visible when expanded");
  assert.equal(await list.locator("li").count(), expectedItems, label + " expanded item count");
  await noOverflow(page, label + " expanded");
  await summary.click();
  assert.equal(await first.getAttribute("open"), null, label + " should collapse on second activation");
  assert.equal(await list.isVisible(), false, label + " detail list should hide after collapse");
  await summary.focus();
  await page.keyboard.press("Enter");
  assert.notEqual(await first.getAttribute("open"), null, label + " should expand with the keyboard");
  await page.keyboard.press("Enter");
  assert.equal(await first.getAttribute("open"), null, label + " should collapse with the keyboard");
}

async function checkMobileAlignment(page, width, label) {
  await noOverflow(page, label + " " + width + "px");
  const report = await page.evaluate(() => {
    const visible = element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" &&
        style.visibility !== "hidden" && Number(style.opacity) > 0;
    };
    const selectors = [
      "main h1", "main h2", "main h3", ".agency-service-card", ".lab-course-card",
      ".lab-dept-card", ".team-card", ".meld-audience-card", ".meld-support-grid article",
      ".meld-process-step", ".vk-risk-card", ".vk-stage", ".vk-compare-grid article",
      ".site-header .header-inner", ".meld-mobile-menu", ".vk-collaboration", ".vk-back-link",
      ".meld-event-type", ".meld-board-label", ".meld-fit-row", ".meld-match-foot"
    ];
    const bounds = Array.from(document.querySelectorAll(selectors.join(",")))
      .filter(visible)
      .map(node => {
        const rect = node.getBoundingClientRect();
        return {
          selector: node.tagName.toLowerCase() + (node.className && typeof node.className === "string" ? "." + node.className.trim().split(/\\s+/).join(".") : ""),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10
        };
      });
    const outOfBounds = bounds.filter(item => item.left < -1 || item.right > window.innerWidth + 1);
    const textOverflow = Array.from(document.querySelectorAll(
      "main h1, main h2, main h3, main h4, main p, main li, main summary, main button, main a, main label, main small, main strong, .meld-event-type, .meld-board-label, .meld-fit-row, .meld-match-foot"
    ))
      .filter(visible)
      .filter(node => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2)
      .map(node => (node.textContent || "").trim().slice(0, 70));
    const smallFormLabels = Array.from(document.querySelectorAll(
      ".agency-field>span, .join-fields>label"
    ))
      .filter(visible)
      .filter(node => parseFloat(getComputedStyle(node).fontSize) < 10.5)
      .map(node => (node.textContent || "").trim().slice(0, 70));
    const undersizedFields = Array.from(document.querySelectorAll(
      "input:not([type=checkbox]):not([type=radio]), select, textarea"
    ))
      .filter(visible)
      .filter(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.height < 44 || parseFloat(style.fontSize) < 16;
      })
      .map(node => node.name || node.tagName);
    const tapTargets = Array.from(document.querySelectorAll(
      "button, summary, a.agency-button, a.nav-cta, a.meld-button, a.vk-button, a.join-submit"
    )).filter(visible).map(node => {
      const rect = node.getBoundingClientRect();
      return {label:(node.innerText || node.getAttribute("aria-label") || node.tagName).trim().slice(0,70),
        width:rect.width,height:rect.height};
    });
    const smallTargets = tapTargets.filter(item => item.width < 40 || item.height < 40);
    const header = document.querySelector("header");
    const headerRect = header?.getBoundingClientRect();
    const brand = document.querySelector(".agency-home .site-header .brand img, .meld-wordmark-header, .vk-collaboration");
    return {
      viewport: document.documentElement.clientWidth,
      bodyPaddingTop: getComputedStyle(document.body).paddingTop,
      headerTop: headerRect ? Math.round(headerRect.top) : null,
      headerHeight: headerRect ? Math.round(headerRect.height) : null,
      headerVisible: !!header && visible(header),
      brandVisible: !!brand && visible(brand),
      outOfBounds: outOfBounds.slice(0, 12),
      textOverflow: textOverflow.slice(0, 12),
      smallFormLabels: smallFormLabels.slice(0, 12),
      undersizedFields: undersizedFields.slice(0, 12),
      smallTargets: smallTargets.slice(0, 12)
    };
  });
  assert.ok(report.headerVisible, label + " header should be visible at " + width + "px: " + JSON.stringify(report));
  assert.ok(report.brandVisible, label + " brand/partner identity should be visible at " + width + "px: " + JSON.stringify(report));
  assert.ok(report.headerHeight >= 44, label + " header must retain a usable mobile height: " + JSON.stringify(report));
  assert.deepEqual(report.outOfBounds, [], label + " key content should stay inside the viewport: " + JSON.stringify(report.outOfBounds));
  assert.deepEqual(report.textOverflow, [], label + " visible text should wrap instead of clipping: " + JSON.stringify(report.textOverflow));
  assert.deepEqual(report.smallFormLabels, [], label + " mobile form labels should remain readable: " + JSON.stringify(report.smallFormLabels));
  assert.deepEqual(report.undersizedFields, [], label + " form controls should be at least 44px tall with 16px text: " + JSON.stringify(report.undersizedFields));
  assert.deepEqual(report.smallTargets, [], label + " primary controls need usable touch targets: " + JSON.stringify(report.smallTargets));
  assert.ok(report.headerTop <= 1, label + " header should begin at the top edge, not leave a blank strip");
  if (label.startsWith("BENGALOOP") || label === "Experiment Lab") {
    assert.equal(report.bodyPaddingTop, "0px", label + " should not use legacy fixed-header body padding");
  }
}

async function assertHomepageDrawerAnchored(page, label) {
  const geometry = await page.locator("#nav").evaluate(nav => {
    const rect = nav.getBoundingClientRect();
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const style = getComputedStyle(nav);
    const probeX = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
    const probeY = Math.min(window.innerHeight - 1, Math.max(0, rect.top + 12));
    const hit = document.elementFromPoint(probeX, probeY);
    return {
      position: style.position,
      visibility: style.visibility,
      display: style.display,
      opacity: Number(style.opacity),
      top: rect.top,
      bottom: rect.bottom,
      headerBottom: header.bottom,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      hitInsideDrawer: !!hit && (hit === nav || nav.contains(hit))
    };
  });
  assert.equal(geometry.position, "absolute",
    label + " drawer must be anchored to the sticky header like MELD's menu: " + JSON.stringify(geometry));
  assert.ok(geometry.visibility === "visible" && geometry.display !== "none" && geometry.opacity > 0,
    label + " drawer must be visibly open: " + JSON.stringify(geometry));
  assert.ok(geometry.top >= geometry.headerBottom - 1,
    label + " drawer must begin below the sticky header: " + JSON.stringify(geometry));
  assert.ok(geometry.bottom <= geometry.viewportHeight + 1,
    label + " drawer must fit inside the current viewport: " + JSON.stringify(geometry));
  assert.ok(geometry.hitInsideDrawer,
    label + " drawer must be in front of the page and receive pointer hits: " + JSON.stringify(geometry));
}

async function auditMobileHeaderInteractions(page, label, { touch = false } = {}) {
  const bengaloopToggle = page.locator("#menu");
  if (await bengaloopToggle.count()) {
    assert.ok(await bengaloopToggle.isVisible(), label + " BENGALOOP menu toggle should be visible");
    const box = await bengaloopToggle.boundingBox();
    assert.ok(box && box.width >= 40 && box.height >= 40, label + " menu toggle should be easy to tap");
    // Exercise the drawer from the bottom of the page, not just at scroll position zero.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
    const menuBeforeClick = await bengaloopToggle.boundingBox();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    assert.ok(menuBeforeClick && menuBeforeClick.y >= 0 && menuBeforeClick.y + menuBeforeClick.height <= viewportHeight,
      label + " menu toggle must be inside the viewport before a real pointer click");
    const headerBeforeOpen = await page.locator(".site-header").boundingBox();
    assert.ok(headerBeforeOpen && Math.abs(headerBeforeOpen.y) <= 1,
      label + " header should remain pinned to the viewport at the bottom of the page");
    // Trigger the already-visible control without Playwright's scrollIntoViewIfNeeded().
    // That helper can scroll sticky headers before the click handler is dispatched.
    if (touch) await page.touchscreen.tap(menuBeforeClick.x + menuBeforeClick.width / 2,
      menuBeforeClick.y + menuBeforeClick.height / 2);
    else await bengaloopToggle.dispatchEvent("click");
    await page.waitForFunction(() => document.querySelector("#nav")?.classList.contains("open"));
    if (label.startsWith("BENGALOOP homepage")) await assertHomepageDrawerAnchored(page, label);
    const scrollAfterOpen = await page.evaluate(() => window.scrollY);
    assert.ok(Math.abs(scrollAfterOpen - scrollBeforeOpen) <= 2,
      label + " opening the navigation must preserve scroll position (before " +
      scrollBeforeOpen + ", after " + scrollAfterOpen + ")");

    await noOverflow(page, label + " navigation open");
    const closeBox = await page.locator("#navClose").boundingBox();
    assert.ok(closeBox, label + " navigation close button should be visible");
    await page.locator("#navClose").dispatchEvent("click");
    await page.waitForFunction(() => !document.querySelector("#nav")?.classList.contains("open"));
    const scrollAfterClose = await page.evaluate(() => window.scrollY);
    assert.ok(Math.abs(scrollAfterClose - scrollBeforeOpen) <= 2,
      label + " closing the navigation must preserve the current scroll position");
  }
  const meldMenu = page.locator(".meld-mobile-menu");
  if (await meldMenu.count()) {
    const summary = meldMenu.locator("summary");
    assert.ok(await summary.isVisible(), label + " MELD mobile menu should be visible");
    await summary.click();
    assert.notEqual(await meldMenu.getAttribute("open"), null, label + " MELD menu should expand");
    assert.equal(await meldMenu.locator("nav a").count(), 4, label + " MELD mobile menu should expose all destinations");
    await noOverflow(page, label + " MELD menu open");
    await summary.click();
    assert.equal(await meldMenu.getAttribute("open"), null, label + " MELD menu should close");
  }
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
  await checkDisclosure(desktop, ".agency-service-details", 6, 4, "BENGALOOP service details");
  assert.equal(await desktop.locator(".agency-next-card").count(), 3);
  assert.equal(await desktop.locator('#businessEnquiryForm input[name="services"]').count(), 6);
  assert.ok((await desktop.locator("#services").innerText()).includes("Business strategy & research"));
  assert.ok((await desktop.locator("#services").innerText()).includes("Operations, projects & people"));
  assert.equal(await desktop.locator(".agency-leader-card").count(), 1);
  const homepageLeadership = await desktop.locator("#leadership").innerText();
  assert.ok(homepageLeadership.includes("Naval Aggarwal"));
  assert.equal(homepageLeadership.includes("Rhythm Mehrotra"), false);
  const homepageSocials = desktop.locator("#social .agency-social-link");
  assert.equal(await homepageSocials.count(), 3);
  const expectedSocialUrls = [
    "https://www.linkedin.com/company/bengaloop/",
    "https://www.instagram.com/bengaloop/",
    "https://www.facebook.com/profile.php?id=61595860486907"
  ];
  for (let i = 0; i < expectedSocialUrls.length; i++) {
    const link = homepageSocials.nth(i);
    assert.equal(await link.getAttribute("href"), expectedSocialUrls[i]);
    assert.equal(await link.getAttribute("target"), "_blank");
    assert.ok((await link.getAttribute("rel")).includes("noopener"));
    assert.ok(await link.isVisible());
  }
  assert.ok((await desktop.locator(".agency-final-cta").innerText()).includes("LET'S START WITH A CONVERSATION"));
  assert.ok((await desktop.locator(".agency-final-cta").innerText()).includes("Register your business"));
  assert.equal(await desktop.locator("#leadership").evaluate(el => !!(el.compareDocumentPosition(document.querySelector("#social")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  assert.equal(await desktop.locator("#social").evaluate(el => !!(el.compareDocumentPosition(document.querySelector(".agency-final-cta")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  await checkTactileButtons(desktop, "button, .agency-button, .nav-cta, .agency-text-link, .agency-member-count, .agency-social-link, .agency-service-details>summary", "BENGALOOP homepage");
  await checkNoArrowGlyphs(desktop, "BENGALOOP homepage");
  assert.ok((await desktop.locator(".agency-member-count").innerText()).includes("18"));
  assert.equal(await desktop.locator("#businessEnquiryForm").getAttribute("data-form-endpoint"), "");
  await noOverflow(desktop, "desktop homepage");
  await desktop.screenshot({ path: path.join(out, "desktop-ecosystem-home.png"), fullPage: true });

  await desktop.locator("#menu").click();
  await desktop.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  assert.ok((await desktop.locator("#nav").innerText()).includes("Experiment Lab"));
  assert.equal(await desktop.locator("#nav .nav-meld-link").count(), 1);
  assert.equal(await desktop.locator("#nav .nav-meld-link").getAttribute("href"), "meld.html");
  assert.equal(await desktop.locator("#nav .nav-project-link").count(), 1);
  assert.equal(await desktop.locator("#nav .nav-project-link").getAttribute("href"), "vyapar-kavach.html");
  await desktop.locator('#nav a[href="#ecosystem"]').click();
  await desktop.waitForFunction(() => location.hash === "#ecosystem");
  await desktop.locator("#menu").click();
  await desktop.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  await desktop.locator('#nav a[href="our-team.html"]').click();
  await desktop.waitForURL("**/our-team.html");

  // Team hierarchy remains unchanged.
  assert.equal(await desktop.locator(".team-level-cofounders .team-card").count(), 0);
  assert.equal(await desktop.locator(".team-level-members .team-card").count(), 18);
  assert.equal(await desktop.locator(".team-level-members .team-card").filter({ hasText: "Rhythm Mehrotra" }).count(), 1);
  assert.equal(await desktop.locator(".team-level-members .team-status").count(), 18);
  await checkTactileButtons(desktop, "button, .agency-button, .nav-cta, .agency-text-link, .team-linkedin, .profile-linkedin", "BENGALOOP team page");
  await checkNoArrowGlyphs(desktop, "BENGALOOP team page");
  assert.equal(await desktop.locator(".team-level-members .team-card-new").count(), 0);
  assert.equal(await desktop.locator(".team-level-members .team-card").filter({ hasText: "Jenneth Pinto" }).count(), 1);
  const jennethPhoto = desktop.locator(".team-level-members .team-card").filter({ hasText: "Jenneth Pinto" }).locator("img");
  await jennethPhoto.scrollIntoViewIfNeeded();
  await jennethPhoto.evaluate(img => { img.loading = "eager"; });
  await jennethPhoto.waitForFunction(img => img.complete && img.naturalWidth > 0);
  await desktop.screenshot({ path: path.join(out, "desktop-full-team.png"), fullPage: true });
  await noOverflow(desktop, "desktop team");
  await desktop.close();

  // Standalone Vyapar Kavach collaboration microsite.
  const vkDesktop = await openPage("/vyapar-kavach.html", { width: 1440, height: 960 }, "desktop Vyapar Kavach");
  assert.ok((await vkDesktop.title()).includes("Vyapar Kavach"));
  assert.equal(await vkDesktop.locator("h1").count(), 1);
  assert.equal(await vkDesktop.locator(".vk-stage").count(), 3);
  await checkDisclosure(vkDesktop, ".vk-stage-details", 3, 4, "Vyapar Kavach stage activities");
  assert.ok((await vkDesktop.locator(".vk-collaboration").innerText()).includes("CUFFLINKSIA"));
  assert.ok((await vkDesktop.locator("#vk-unbiased").innerText()).includes("No insurer preferred by default"));
  await checkTactileButtons(vkDesktop, "button, .vk-button, .vk-stage-details>summary", "Vyapar Kavach");
  await checkNoArrowGlyphs(vkDesktop, "Vyapar Kavach");
  await noOverflow(vkDesktop, "desktop Vyapar Kavach");
  await vkDesktop.screenshot({ path: path.join(out, "desktop-vyapar-kavach.png"), fullPage: true });
  await vkDesktop.close();

  const vkMobile = await openPage("/vyapar-kavach.html", { width: 390, height: 844 }, "mobile Vyapar Kavach 390");
  assert.equal(await vkMobile.locator(".vk-stage").count(), 3);
  await checkNoArrowGlyphs(vkMobile, "mobile Vyapar Kavach");
  await checkDisclosure(vkMobile, ".vk-stage-details", 3, 4, "mobile Vyapar Kavach stage activities");
  await checkTactileButtons(vkMobile, "button, .vk-button, .vk-stage-details>summary", "mobile Vyapar Kavach");
  await noOverflow(vkMobile, "mobile Vyapar Kavach 390");
  await vkMobile.screenshot({ path: path.join(out, "mobile-vyapar-kavach-390.png"), fullPage: true });
  await vkMobile.close();

  const vkNarrow = await openPage("/vyapar-kavach.html", { width: 360, height: 800 }, "mobile Vyapar Kavach 360");
  await noOverflow(vkNarrow, "mobile Vyapar Kavach 360");
  await vkNarrow.close();


  // Standalone MELD sponsorship and collaboration microsite.
  const meldDesktop = await openPage("/meld.html", { width: 1440, height: 960 }, "desktop MELD");
  assert.ok((await meldDesktop.title()).includes("MELD"));
  assert.equal(await meldDesktop.locator("h1").count(), 1);
  assert.equal(await meldDesktop.locator(".meld-audience-card").count(), 2);
  assert.equal(await meldDesktop.locator(".meld-fit-row").count(), 3);
  assert.equal(await meldDesktop.locator(".meld-support-grid article").count(), 4);
  assert.equal(await meldDesktop.locator(".meld-process-step").count(), 4);
  assert.equal(await meldDesktop.locator(".meld-faq-list details").count(), 5);
  await checkDisclosure(meldDesktop, ".meld-audience-details", 2, 4, "MELD audience details");
  await checkTactileButtons(meldDesktop, "button, .meld-button, .meld-faq-list summary, .meld-audience-details>summary, .meld-mobile-menu>summary", "MELD");
  await checkNoArrowGlyphs(meldDesktop, "MELD");
  assert.ok((await meldDesktop.locator(".meld-independent-note").innerText()).includes("independent initiative"));
  assert.ok((await meldDesktop.locator(".meld-network-copy").innerText()).includes("BENGALOOP's network"));
  await meldDesktop.locator(".meld-faq-list details").last().locator("summary").click();
  assert.ok((await meldDesktop.locator(".meld-faq-list details").last().innerText()).includes("Not yet"));
  await noOverflow(meldDesktop, "desktop MELD");
  await meldDesktop.screenshot({ path: path.join(out, "desktop-meld.png"), fullPage: true });
  await meldDesktop.close();

  const meldMobile = await openPage("/meld.html", { width: 390, height: 844 }, "mobile MELD 390");
  assert.equal(await meldMobile.locator(".meld-audience-card").count(), 2);
  assert.equal(await meldMobile.locator(".meld-process-step").count(), 4);
  await checkNoArrowGlyphs(meldMobile, "mobile MELD");
  await checkDisclosure(meldMobile, ".meld-audience-details", 2, 4, "mobile MELD audience details");
  await checkTactileButtons(meldMobile, "button, .meld-button, .meld-faq-list summary, .meld-audience-details>summary", "mobile MELD");
  await noOverflow(meldMobile, "mobile MELD 390");
  await meldMobile.screenshot({ path: path.join(out, "mobile-meld-390.png"), fullPage: true });
  await meldMobile.close();

  const meldNarrow = await openPage("/meld.html", { width: 360, height: 800 }, "mobile MELD 360");
  await noOverflow(meldNarrow, "mobile MELD 360");
  await meldNarrow.close();

  // Experiment Lab at desktop: all programme/department/role data and form contract.
  const labDesktop = await openPage("/join-us.html", { width: 1440, height: 960 }, "desktop Experiment Lab");
  assert.ok((await labDesktop.title()).includes("Experiment Lab"));
  assert.equal(await labDesktop.locator(".lab-course-card").count(), 4);
  assert.equal(await labDesktop.locator(".lab-dept-card").count(), 6);
  assert.equal(await labDesktop.locator(".lab-role").count(), 19);
  await checkDisclosure(labDesktop, ".lab-course-details", 4, 5, "Experiment Lab course contributions");
  await checkDisclosure(labDesktop, ".lab-dept-details", 6, 3, "Experiment Lab role pathways");
  await checkTactileButtons(labDesktop, "button, .agency-button, .nav-cta, .join-submit, .lab-course-details>summary, .lab-dept-details>summary", "Experiment Lab");
  await checkNoArrowGlyphs(labDesktop, "Experiment Lab");
  assert.equal(await labDesktop.locator(".nav-project-link").count(), 1);
  assert.ok((await labDesktop.locator(".lab-independence").innerText()).includes("not an official project"));
  await noOverflow(labDesktop, "desktop Experiment Lab");
  await labDesktop.screenshot({ path: path.join(out, "desktop-experiment-lab.png"), fullPage: true });
  await checkStudentForm(labDesktop, "desktop Experiment Lab");
  await labDesktop.close();

  // Mobile homepage, drawer and business-enquiry disabled-submission boundary.
  const mobile = await openPage("/index.html", { width: 390, height: 844 }, "mobile homepage 390");
  await mobile.screenshot({ path: path.join(out, "mobile-ecosystem-home-390.png"), fullPage: true });
  await checkDisclosure(mobile, ".agency-service-details", 6, 4, "mobile BENGALOOP service details");
  assert.equal(await mobile.locator("#social .agency-social-link").count(), 3);
  await checkTactileButtons(mobile, "button, .agency-button, .nav-cta, .agency-text-link, .agency-member-count, .agency-social-link, .agency-service-details>summary", "mobile BENGALOOP homepage");
  await checkNoArrowGlyphs(mobile, "mobile BENGALOOP homepage");
  await mobile.locator("#menu").click();
  await mobile.waitForFunction(() => document.querySelector("#nav").classList.contains("open"));
  await mobile.screenshot({ path: path.join(out, "mobile-ecosystem-menu-390.png") });
  await mobile.locator('#nav .nav-cta[href="#business-enquiry"]').click();
  await mobile.waitForFunction(() => location.hash === "#business-enquiry");
  await mobile.locator('[name="businessName"]').fill("Sample Cafe");
  await mobile.locator('[name="contactName"]').fill("Sample Owner");
  await mobile.locator('[name="category"]').selectOption({ label: "Food & Hospitality" });
  assert.equal(await mobile.locator('[name="category"] option').filter({ hasText: "PG / Hostel / Accommodation" }).count(), 0);
  assert.equal(await mobile.locator('[name="category"] option').filter({ hasText: "Startups & Technology" }).count(), 1);
  await mobile.locator('[name="locality"]').fill("S.G. Palya, Bengaluru");
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
  await checkTactileButtons(teamMobile, "button, .agency-button, .nav-cta, .agency-text-link, .team-linkedin, .profile-linkedin", "mobile BENGALOOP team");
  await checkNoArrowGlyphs(teamMobile, "mobile BENGALOOP team");
  await teamMobile.close();

  const labMobile = await openPage("/join-us.html", { width: 390, height: 844 }, "mobile Experiment Lab 390");
  assert.equal(await labMobile.locator(".lab-course-card").count(), 4);
  assert.equal(await labMobile.locator(".lab-dept-card").count(), 6);
  assert.equal(await labMobile.locator(".lab-role").count(), 19);
  await checkDisclosure(labMobile, ".lab-course-details", 4, 5, "mobile Experiment Lab course contributions");
  await checkDisclosure(labMobile, ".lab-dept-details", 6, 3, "mobile Experiment Lab role pathways");
  await checkTactileButtons(labMobile, "button, .agency-button, .nav-cta, .join-submit, .lab-course-details>summary, .lab-dept-details>summary", "mobile Experiment Lab");
  await checkNoArrowGlyphs(labMobile, "mobile Experiment Lab");
  await noOverflow(labMobile, "mobile Experiment Lab 390");
  await labMobile.screenshot({ path: path.join(out, "mobile-experiment-lab-390.png"), fullPage: true });
  await checkStudentForm(labMobile, "mobile Experiment Lab");
  await labMobile.close();

  const narrowLab = await openPage("/join-us.html", { width: 360, height: 800 }, "mobile Experiment Lab 360");
  await noOverflow(narrowLab, "mobile Experiment Lab 360");
  await narrowLab.close();

  // The custom not-found page uses the same arrow-free tactile button system.
  const notFound = await openPage("/404.html", { width: 1440, height: 900 }, "desktop 404");
  await checkTactileButtons(notFound, "button, .agency-button", "404 page");
  await checkNoArrowGlyphs(notFound, "404 page");
  await notFound.close();

  // Mobile-first audit: all public pages at narrow-phone through large-phone widths.
  const mobileRoutes = [
    { route: "/index.html", label: "BENGALOOP homepage", file: "home" },
    { route: "/our-team.html", label: "BENGALOOP team", file: "team" },
    { route: "/join-us.html", label: "Experiment Lab", file: "experiment-lab" },
    { route: "/meld.html", label: "MELD", file: "meld" },
    { route: "/vyapar-kavach.html", label: "Vyapar Kavach", file: "vyapar-kavach" },
    { route: "/404.html", label: "404 page", file: "404" }
  ];
  for (const width of [320, 360, 375, 390, 430]) {
    for (const item of mobileRoutes) {
      const page = await openPage(item.route, { width, height: 844 }, item.label + " mobile audit");
      await checkMobileAlignment(page, width, item.label);
      if (width === 320) {
        await page.screenshot({ path: path.join(out, "mobile-audit-320-" + item.file + ".png") });
        await auditMobileHeaderInteractions(page, item.label);
      }
      await page.close();
    }
  }

  // Reproduce the bottom-of-page drawer interaction with a real mobile touch input.
  const touchHome = await openPage("/index.html", { width: 390, height: 844 }, "touch homepage", {
    isMobile: true, hasTouch: true
  });
  await auditMobileHeaderInteractions(touchHome, "BENGALOOP homepage touch", { touch: true });
  // Repeat at mid-page because the reported jump occurred both mid-scroll and near the footer.
  await touchHome.evaluate(() => window.scrollTo(0, Math.floor(document.documentElement.scrollHeight / 2)));
  await touchHome.waitForTimeout(100);
  const midScrollBeforeOpen = await touchHome.evaluate(() => window.scrollY);
  const midMenuBox = await touchHome.locator("#menu").boundingBox();
  assert.ok(midMenuBox && midMenuBox.y >= 0 && midMenuBox.y + midMenuBox.height <= 844,
    "BENGALOOP homepage mid-scroll menu must remain in the viewport");
  await touchHome.touchscreen.tap(midMenuBox.x + midMenuBox.width / 2, midMenuBox.y + midMenuBox.height / 2);
  await touchHome.waitForFunction(() => document.querySelector("#nav")?.classList.contains("open"));
  await assertHomepageDrawerAnchored(touchHome, "BENGALOOP homepage mid-scroll");
  const midScrollAfterOpen = await touchHome.evaluate(() => window.scrollY);
  assert.ok(Math.abs(midScrollAfterOpen - midScrollBeforeOpen) <= 2,
    "BENGALOOP homepage opening the navigation mid-scroll must preserve scroll position (before " +
    midScrollBeforeOpen + ", after " + midScrollAfterOpen + ")");
  await touchHome.locator("#navClose").dispatchEvent("click");
  await touchHome.waitForFunction(() => !document.querySelector("#nav")?.classList.contains("open"));
  const midScrollAfterClose = await touchHome.evaluate(() => window.scrollY);
  assert.ok(Math.abs(midScrollAfterClose - midScrollBeforeOpen) <= 2,
    "BENGALOOP homepage closing the navigation mid-scroll must preserve scroll position");
  await touchHome.close();

  // Legacy URLs must redirect to the canonical host, not a relative path on the old host.
  // Fulfil the canonical request locally so the test never depends on public DNS or hosting.
  const legacy = await browser.newPage();
  await legacy.route("https://bengaloop.in/**", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><body><section id=\"business-enquiry\">Redirect target</section></body></html>"
  }));
  await legacy.goto(base + "/business-registration.html", { waitUntil: "domcontentloaded" });
  await legacy.waitForURL("https://bengaloop.in/#business-enquiry", { waitUntil: "domcontentloaded" });
  await legacy.locator("#business-enquiry").waitFor();
  await legacy.close();

  assert.deepEqual(errors, [], "browser errors: " + errors.join(" | "));
  console.log("PASS: desktop and mobile-first audit across 320/360/375/390/430px for all six public pages, including headers, touch targets, heading wrapping, card bounds, menus, expanders, forms and legacy route.");
} finally {
  await browser.close();
}
