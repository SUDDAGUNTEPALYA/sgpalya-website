// S.G. PALYA live public directory
// Reads only the published PUBLIC DIRECTORY tab and displays rows marked "Approved".
const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeiGcRaqwTJ955a5DtxYZcWAcJa0fbelGYFspJ6abBgTrVXWQ/viewform?usp=dialog";
const CSV_URL = document.querySelector('meta[name="sgpalya-directory-csv"]')?.content || "";

const menu = document.getElementById("menu");
const nav = document.getElementById("nav");
if (menu && nav) menu.addEventListener("click", () => nav.classList.toggle("open"));

const grid = document.getElementById("listingGrid");
const emptyBox = document.getElementById("listingsEmpty");
const emptyTitle = document.getElementById("emptyTitle");
const resultText = document.getElementById("result");
const countText = document.getElementById("listingCount");
const statusPill = document.getElementById("listingStatus");
const queryInput = document.getElementById("q");
const refreshButton = document.getElementById("refreshListings");

let approvedListings = [];
let activeCategory = "Everything";

function normaliseHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
      } else if (ch !== "\r") field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => String(cell).trim() !== ""));
}

function safeURL(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") ? url.href : "";
  } catch { return ""; }
}

function fieldValue(record, names) {
  for (const name of names) {
    const key = normaliseHeader(name);
    if (record[key] !== undefined && String(record[key]).trim() !== "") return String(record[key]).trim();
  }
  return "";
}

function rowsToListings(csvText) {
  const rows = parseCSV(csvText);
  if (!rows.length) return [];
  const headers = rows[0].map(normaliseHeader);
  if (!headers.includes("businessname") || !headers.includes("listingstatus")) {
    throw new Error("The published tab must contain the Business Name and Listing Status columns. Check that the PUBLIC DIRECTORY tab is the one published as CSV.");
  }
  return rows.slice(1).map(row => {
    const record = {};
    headers.forEach((header, i) => { record[header] = row[i] || ""; });
    return {
      name: fieldValue(record, ["Business Name"]),
      category: fieldValue(record, ["Category"]),
      description: fieldValue(record, ["Description"]),
      address: fieldValue(record, ["Address"]),
      phone: fieldValue(record, ["Contact Number"]),
      whatsapp: fieldValue(record, ["WhatsApp Number"]),
      map: fieldValue(record, ["Google Maps Link"]),
      hours: fieldValue(record, ["Opening Hours"]),
      photo: fieldValue(record, ["Business Photo URL"]),
      status: fieldValue(record, ["Listing Status"])
    };
  }).filter(item => item.name && item.status.toLowerCase() === "approved");
}

function makeText(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = value;
  return el;
}

function makeLink(label, href, className) {
  if (!href) return null;
  const a = document.createElement("a");
  a.className = className || "listing-link";
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  return a;
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function whatsappDigits(value) {
  let digits = phoneDigits(value);
  // India: convert a plain 10-digit mobile number to international format.
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

function renderListings() {
  if (!grid || !emptyBox) return;
  const term = (queryInput?.value || "").trim().toLowerCase();
  const shown = approvedListings.filter(item => {
    const categoryMatch = activeCategory === "Everything" ||
      item.category.toLowerCase() === activeCategory.toLowerCase();
    const haystack = [item.name, item.category, item.description, item.address].join(" ").toLowerCase();
    return categoryMatch && (!term || haystack.includes(term));
  });

  grid.replaceChildren();
  const hasResults = shown.length > 0;
  emptyBox.hidden = hasResults;
  grid.hidden = !hasResults;

  if (!approvedListings.length) {
    emptyTitle.textContent = "Your next local favourite belongs here.";
    resultText.textContent = "We're building the S.G. Palya directory. Approved business listings will appear here as they are reviewed. Local businesses can register for free.";
    statusPill.textContent = "LISTINGS OPENING SOON";
  } else if (!hasResults) {
    emptyTitle.textContent = "No matching businesses yet.";
    resultText.textContent = "Try another search or category. You can also register a local business to help grow the directory.";
    statusPill.textContent = `${approvedListings.length} APPROVED LISTINGS`;
  } else {
    statusPill.textContent = `${approvedListings.length} APPROVED LISTINGS`;
  }

  shown.forEach(item => {
    const card = document.createElement("article");
    card.className = "listing-card";

    const imageURL = safeURL(item.photo);
    if (imageURL) {
      const image = document.createElement("img");
      image.className = "listing-photo";
      image.src = imageURL;
      image.alt = `${item.name} photograph`;
      image.loading = "lazy";
      image.onerror = () => image.remove();
      card.appendChild(image);
    } else {
      card.appendChild(makeText("div", "listing-photo listing-photo-placeholder", "✳"));
    }

    const body = document.createElement("div");
    body.className = "listing-body";
    const top = document.createElement("div");
    top.className = "listing-card-top";
    top.appendChild(makeText("span", "listing-category", item.category || "Local business"));
    body.appendChild(top);
    body.appendChild(makeText("h3", "listing-name", item.name));

    if (item.description) body.appendChild(makeText("p", "listing-description", item.description));
    if (item.address) body.appendChild(makeText("p", "listing-detail", `⌖  ${item.address}`));
    if (item.hours) body.appendChild(makeText("p", "listing-detail", `◷  ${item.hours}`));

    const actions = document.createElement("div");
    actions.className = "listing-actions";
    const phone = phoneDigits(item.phone);
    const whatsapp = whatsappDigits(item.whatsapp || item.phone);
    const phoneLink = phone ? makeLink("Call", `tel:${phone}`, "listing-action") : null;
    const whatsLink = whatsapp ? makeLink("WhatsApp", `https://wa.me/${whatsapp}`, "listing-action listing-action-primary") : null;
    const mapLink = makeLink("Directions ↗", safeURL(item.map), "listing-action");
    [phoneLink, whatsLink, mapLink].filter(Boolean).forEach(link => actions.appendChild(link));
    if (actions.childElementCount) body.appendChild(actions);

    card.appendChild(body);
    grid.appendChild(card);
  });

  countText.textContent = `${shown.length} matching approved listing${shown.length === 1 ? "" : "s"} · ${approvedListings.length} approved in total`;
}

async function loadListings() {
  if (!CSV_URL) {
    resultText.textContent = "The public directory feed has not been configured yet.";
    countText.textContent = "Directory feed unavailable";
    return;
  }
  if (statusPill) statusPill.textContent = "UPDATING DIRECTORY";
  if (resultText && approvedListings.length === 0) resultText.textContent = "Loading approved S.G. Palya listings…";
  if (refreshButton) refreshButton.disabled = true;
  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}.`);
    const csvText = await response.text();
    const responseStart = csvText.trimStart().slice(0, 40).toLowerCase();
    if (responseStart.startsWith("<!doctype") || responseStart.startsWith("<html")) {
      throw new Error("Google did not return CSV data. Confirm that the PUBLIC DIRECTORY tab is published as CSV.");
    }
    approvedListings = rowsToListings(csvText);
    renderListings();
  } catch (error) {
    if (approvedListings.length === 0) {
      emptyBox.hidden = false;
      emptyTitle.textContent = "The directory could not load just now.";
      resultText.textContent = "Please refresh in a moment. If this keeps happening, check that the PUBLIC DIRECTORY tab is published to the web as CSV.";
    }
    statusPill.textContent = "DIRECTORY TEMPORARILY UNAVAILABLE";
    countText.textContent = `Could not refresh the directory: ${error.message}`;
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}

document.querySelectorAll(".categories button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".categories button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.cat || "Everything";
    if (queryInput) queryInput.value = "";
    renderListings();
    document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
  });
});

function runSearch() {
  renderListings();
  document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
}
document.getElementById("search")?.addEventListener("click", runSearch);
queryInput?.addEventListener("keydown", event => { if (event.key === "Enter") runSearch(); });
refreshButton?.addEventListener("click", loadListings);

// Load the public CSV at startup and allow a manual refresh.
loadListings();
