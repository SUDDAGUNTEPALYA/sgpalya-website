import assert from "node:assert/strict";
import {chromium} from "playwright";
const base=process.env.BENGALOOP_BASE_URL||"http://127.0.0.1:8000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const csv=["Business Name,Category,Description,Address,Contact Number,WhatsApp Number,Google Maps Link,Opening Hours,Listing Status","Test Cafe,Food & Dining,Fresh coffee,12 Main Road,9876543210,9876543210,,8 AM,Approved","S.G. Clinic,Healthcare,Clinic,14 Main Road,9876543211,9876543211,,9 AM,Approved","Green PG,PGs & Housing,Student rooms,16 Main Road,9876543212,9876543212,,24 hours,Approved","Hidden Draft,Shopping,Hidden,18 Main Road,9876543213,9876543213,,10 AM,Pending"].join("\n");
const failures=[];
async function openPage(name,width=390){const p=await browser.newPage({viewport:{width,height:844},reducedMotion:"no-preference"});p.on("pageerror",e=>failures.push(e.message));await p.route("https://docs.google.com/**",r=>r.fulfill({status:200,contentType:"text/csv",headers:{"access-control-allow-origin":"*"},body:csv}));await p.goto(base+"/"+name,{waitUntil:"domcontentloaded"});if(await p.locator("#listingGrid").count())await p.waitForFunction(()=>document.querySelectorAll("#listingGrid .listing-card").length>=1);return p}
try{
 const p=await openPage("index.html");assert.equal(await p.locator("#listingGrid").count(),0);assert.equal(await p.locator("#businessRegistrationForm").count(),0);
 assert.equal(await p.locator(".team-level-founder").count(),1);assert.equal(await p.locator(".team-level-cofounders .team-card").count(),2);assert.equal(await p.locator(".team-level-members").count(),0);
 assert.equal(await p.locator("#member-count-link").getAttribute("href"),"our-team.html#members");
 await p.locator("#menu").click();await p.waitForFunction(()=>document.querySelector("#nav").classList.contains("open"));await p.locator('a[href="our-team.html#members"]').click();await p.waitForURL(/our-team\.html#members$/);assert.equal(await p.locator(".team-level-members .team-card").count(),15);await p.close();
 const d=await openPage("departments.html");assert.equal(await d.locator("[data-department-id]").count(),6);await d.locator('#departments [data-department-id="business"]').click();await d.waitForFunction(()=>!document.querySelector("#departmentExplorer").hidden);assert.equal(await d.locator("#departmentRoleList .department-role-option").count(),4);await d.close();
 const l=await openPage("directory.html",360);assert.equal(await l.locator("#listingGrid .listing-card").count(),3);assert.equal(await l.locator("#listingGrid").innerText().then(x=>x.includes("Hidden Draft")),false);await l.close();
 const e=await openPage("explore.html");await e.locator("#exploreSearch").fill("cafe");await e.locator('#exploreSearchForm button[type="submit"]').click();await e.waitForFunction(()=>document.querySelectorAll("#listingGrid .listing-card").length===1);await e.close();
 const f=await openPage("business-registration.html");await f.locator("#businessRegistrationForm").evaluate(x=>x.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));await f.waitForFunction(()=>document.querySelector("#registrationFormStatus").textContent.includes("No information has been sent or saved"));await f.close();
 assert.deepEqual(failures,[],"Browser errors: "+failures.join("|"));console.log("PASS: homepage scope, Team routing, 15 members, department roles, approved directory and registration preview.");
}finally{await browser.close()}
