/* BENGALOOP — S.G. Palya Edition
   Reads only the published PUBLIC DIRECTORY CSV and renders rows marked Approved.
   Private Form Responses and internal master data are never requested by this script.
*/
(() => {
  "use strict";

  const CSV_URL = document.querySelector('meta[name="bengaloop-directory-csv"]')?.content?.trim() || "";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const elements = {
    menu: $("#menu"),
    nav: $("#nav"),
    searchForm: $("#searchForm"),
    query: $("#q"),
    directorySearch: $("#directorySearch"),
    sort: $("#sortListings"),
    refresh: $("#refreshListings"),
    grid: $("#listingGrid"),
    empty: $("#listingsEmpty"),
    emptyTitle: $("#emptyTitle"),
    result: $("#result"),
    count: $("#listingCount"),
    status: $("#listingStatus"),
    year: $("#year")
  };

  let approvedListings = [];
  let activeCategory = "Everything";
  let requestInProgress = false;
  let searchTimer = 0;

  const CATEGORY_ALIASES = new Map([
    ["everything", "everything"],
    ["fooddining", "fooddining"], ["food", "fooddining"], ["cafe", "fooddining"], ["cafes", "fooddining"], ["restaurant", "fooddining"], ["restaurants", "fooddining"],
    ["pgshousing", "pgshousing"], ["pgstay", "pgshousing"], ["pg", "pgshousing"], ["pgs", "pgshousing"], ["housing", "pgshousing"], ["accommodation", "pgshousing"], ["hostel", "pgshousing"], ["hostels", "pgshousing"], ["rentals", "pgshousing"],
    ["shopping", "shopping"], ["shops", "shopping"], ["retail", "shopping"], ["business", "shopping"], ["store", "shopping"], ["stores", "shopping"], ["grocery", "shopping"], ["supermarket", "shopping"],
    ["healthcare", "healthcare"], ["health", "healthcare"], ["medical", "healthcare"], ["pharmacy", "healthcare"], ["pharmacies", "healthcare"],
    ["beautyfitness", "beautyfitness"], ["wellness", "beautyfitness"], ["beauty", "beautyfitness"], ["fitness", "beautyfitness"], ["salon", "beautyfitness"], ["salons", "beautyfitness"], ["gym", "beautyfitness"], ["gyms", "beautyfitness"],
    ["education", "education"], ["tuition", "education"], ["coaching", "education"],
    ["localservices", "localservices"], ["services", "localservices"], ["repair", "localservices"], ["laundry", "localservices"],
    ["transport", "transport"], ["automotive", "transport"], ["bankingutilities", "bankingutilities"], ["other", "other"]
  ]);

  function normalise(value) {
    return String(value ?? "").replace(/^\uFEFF/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function canonicalCategory(value) {
    const key = normalise(value);
    return CATEGORY_ALIASES.get(key) || key;
  }

  function parseCSV(text) {
    // Handles quoted commas, escaped quotes, CRLF/LF and a possible UTF-8 BOM.
    const source = String(text ?? "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      if (quoted) {
        if (ch === '"') {
          if (source[i + 1] === '"') {
            field += '"';
            i += 1;
          } else {
            quoted = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"' && field.length === 0) {
        quoted = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter(cells => cells.some(cell => String(cell).trim() !== ""));
  }

  function fieldValue(record, names) {
    for (const name of names) {
      const key = normalise(name);
      if (record[key] !== undefined) {
        const value = String(record[key] ?? "").trim();
        if (value) return value;
      }
    }
    return "";
  }

  function rowsToListings(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(normalise);
    if (!headers.includes("businessname") || !headers.includes("listingstatus")) {
      throw new Error("Required directory columns were not found.");
    }

    return rows.slice(1).map(cells => {
      const record = {};
      headers.forEach((header, index) => { record[header] = cells[index] ?? ""; });
      return {
        name: fieldValue(record, ["Business Name", "Name"]),
        category: fieldValue(record, ["Category", "Business Category"]),
        description: fieldValue(record, ["Description", "About"]),
        address: fieldValue(record, ["Address", "Location"]),
        phone: fieldValue(record, ["Contact Number", "Phone", "Mobile"]),
        whatsapp: fieldValue(record, ["WhatsApp Number", "WhatsApp", "WhatsApp Contact"]),
        map: fieldValue(record, ["Google Maps Link", "Maps Link", "Google Maps"]),
        hours: fieldValue(record, ["Opening Hours", "Hours", "Business Hours"]),
        photo: fieldValue(record, ["Business Photo URL", "Photo URL", "Image URL"]),
        status: fieldValue(record, ["Listing Status", "Status"])
      };
    }).filter(item => item.name && normalise(item.status) === "approved");
  }

  function safeHttpsURL(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function phoneHref(value) {
    let digits = String(value ?? "").replace(/[^\d+]/g, "");
    if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
    if (/^\d{10}$/.test(digits)) digits = `+91${digits}`;
    if (!/^\+?\d{8,15}$/.test(digits)) return "";
    return `tel:${digits}`;
  }

  function whatsappHref(value) {
    let digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
    else if (digits.startsWith("00")) digits = digits.slice(2);
    if (!/^\d{11,15}$/.test(digits)) return "";
    return `https://wa.me/${digits}`;
  }

  function makeText(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    return element;
  }

  function makeAction(label, href, className, options = {}) {
    if (!href) return null;
    const link = document.createElement("a");
    link.className = className || "listing-action";
    link.href = href;
    link.textContent = label;
    if (options.external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    return link;
  }

  function makeDetail(value, icon, label) {
    if (!value) return null;
    const line = document.createElement("p");
    line.className = "listing-detail";
    const symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    symbol.setAttribute("viewBox", "0 0 24 24");
    symbol.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", icon);
    symbol.appendChild(path);
    line.append(symbol, document.createTextNode(`${label}${value}`));
    return line;
  }

  function makePhoto(item) {
    const wrap = document.createElement("div");
    wrap.className = "listing-photo-wrap";
    const approved = makeText("span", "listing-approved", "Reviewed listing");
    const photoURL = safeHttpsURL(item.photo);

    if (photoURL) {
      const image = document.createElement("img");
      image.className = "listing-photo";
      image.src = photoURL;
      image.alt = `${item.name} business photograph`;
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        image.remove();
        const placeholder = document.createElement("div");
        placeholder.className = "listing-photo-placeholder";
        placeholder.setAttribute("aria-label", "No business photo provided");
        placeholder.appendChild(makeText("span", "", "B."));
        wrap.insertBefore(placeholder, approved);
      }, { once: true });
      wrap.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "listing-photo-placeholder";
      placeholder.setAttribute("aria-label", "No business photo provided");
      placeholder.appendChild(makeText("span", "", "B."));
      wrap.appendChild(placeholder);
    }
    wrap.appendChild(approved);
    return wrap;
  }

  function mapSearchURL(item) {
    const supplied = safeHttpsURL(item.map);
    if (supplied) return supplied;
    const query = [item.name, item.address, "S.G. Palya, Bengaluru"].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function buildCard(item) {
    const card = document.createElement("article");
    card.className = "listing-card";
    card.appendChild(makePhoto(item));

    const body = document.createElement("div");
    body.className = "listing-body";
    const categoryTop = document.createElement("div");
    categoryTop.className = "listing-card-top";
    categoryTop.appendChild(makeText("span", "listing-category", item.category || "Local business"));
    body.appendChild(categoryTop);
    body.appendChild(makeText("h3", "listing-name", item.name));

    if (item.description) body.appendChild(makeText("p", "listing-description", item.description));
    const address = makeDetail(item.address, "M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z M12 10a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 12 10Z", "");
    const hours = makeDetail(item.hours, "M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "");
    if (address) body.appendChild(address);
    if (hours) body.appendChild(hours);

    const actions = document.createElement("div");
    actions.className = "listing-actions";
    const call = makeAction("Call", phoneHref(item.phone), "listing-action");
    const whatsapp = makeAction("WhatsApp", whatsappHref(item.whatsapp || item.phone), "listing-action listing-action-primary", { external: true });
    const directions = makeAction("Directions ↗", mapSearchURL(item), "listing-action", { external: true });
    [call, whatsapp, directions].filter(Boolean).forEach(action => actions.appendChild(action));
    if (actions.childElementCount) body.appendChild(actions);
    card.appendChild(body);
    return card;
  }

  function currentQuery() {
    return String(elements.query?.value || elements.directorySearch?.value || "").trim().toLocaleLowerCase("en-IN");
  }

  function filteredListings() {
    const term = currentQuery();
    const normalizedTerm = normalise(term);
    const queryCategory = canonicalCategory(term);
    const isCategoryShortcut = CATEGORY_ALIASES.has(normalizedTerm);
    const wantedCategory = canonicalCategory(activeCategory);
    const result = approvedListings.filter(item => {
      const category = canonicalCategory(item.category);
      const categoryMatch = wantedCategory === "everything" || category === wantedCategory;
      const haystack = normalise([item.name, item.category, item.description, item.address, item.hours].join(" "));
      const textMatch = !normalizedTerm || haystack.includes(normalizedTerm);
      const categoryShortcutMatch = isCategoryShortcut && category === queryCategory;
      return categoryMatch && (textMatch || categoryShortcutMatch);
    });

    const sort = elements.sort?.value || "default";
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name, "en-IN", { sensitivity: "base" }));
    if (sort === "category") result.sort((a, b) => (a.category || "").localeCompare(b.category || "", "en-IN") || a.name.localeCompare(b.name, "en-IN"));
    return result;
  }

  function updateActiveFilters() {
    $$('[data-filter]').forEach(button => {
      const selected = canonicalCategory(button.dataset.filter) === canonicalCategory(activeCategory);
      button.classList.toggle("active", selected && button.classList.contains("filter-chip"));
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function renderListings() {
    const { grid, empty, emptyTitle, result, count, status } = elements;
    if (!grid || !empty || !emptyTitle || !result || !count || !status) return;

    const visible = filteredListings();
    grid.replaceChildren();
    grid.setAttribute("aria-busy", "false");

    if (!approvedListings.length) {
      grid.hidden = true;
      empty.hidden = false;
      emptyTitle.textContent = "A few good finds are on their way.";
      result.textContent = "Approved S.G. Palya listings will appear here as they are reviewed. Know a good local business? Invite them to join BENGALOOP.";
      status.textContent = "LISTINGS OPENING";
      count.textContent = "No approved public listings yet.";
    } else if (!visible.length) {
      grid.hidden = true;
      empty.hidden = false;
      emptyTitle.textContent = "No local match just yet.";
      result.textContent = "Try a different search or category. You can also invite a local business to join the directory.";
      status.textContent = `${approvedListings.length} APPROVED`;
      count.textContent = `0 matching listings · ${approvedListings.length} approved in total`;
    } else {
      visible.forEach(item => grid.appendChild(buildCard(item)));
      grid.hidden = false;
      empty.hidden = true;
      status.textContent = `${approvedListings.length} APPROVED`;
      count.textContent = `${visible.length} matching listing${visible.length === 1 ? "" : "s"} · ${approvedListings.length} approved in total`;
    }
  }

  function syncSearch(source) {
    if (source === elements.query && elements.directorySearch) elements.directorySearch.value = elements.query.value;
    if (source === elements.directorySearch && elements.query) elements.query.value = elements.directorySearch.value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(renderListings, 80);
  }

  function setCategory(category, shouldScroll = true) {
    activeCategory = category || "Everything";
    updateActiveFilters();
    renderListings();
    if (shouldScroll) {
      document.querySelector("#directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function loadListings() {
    if (requestInProgress) return;
    const { refresh, status, count, result, grid, empty, emptyTitle } = elements;
    if (!CSV_URL) {
      if (status) status.textContent = "FEED NOT CONFIGURED";
      if (count) count.textContent = "The public directory feed has not been configured.";
      return;
    }

    requestInProgress = true;
    if (refresh) refresh.disabled = true;
    if (status) status.textContent = "UPDATING LISTINGS";
    if (grid) {
      grid.setAttribute("aria-busy", "true");
      if (!approvedListings.length) grid.hidden = true;
    }
    if (!approvedListings.length && empty && emptyTitle && result) {
      empty.hidden = false;
      emptyTitle.textContent = "Finding local places…";
      result.textContent = "Loading approved public listings for S.G. Palya. This usually takes a moment.";
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 16000);

    try {
      const response = await fetch(CSV_URL, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Directory feed returned HTTP ${response.status}.`);
      const csvText = await response.text();
      const preview = csvText.trimStart().slice(0, 80).toLowerCase();
      if (preview.startsWith("<!doctype") || preview.startsWith("<html")) {
        throw new Error("The published URL returned a webpage instead of CSV data.");
      }
      approvedListings = rowsToListings(csvText);
      renderListings();
    } catch (error) {
      console.warn("[BENGALOOP] Could not load the public directory feed:", error);
      if (!approvedListings.length && empty && emptyTitle && result) {
        grid.hidden = true;
        empty.hidden = false;
        emptyTitle.textContent = "The directory couldn't refresh just now.";
        result.textContent = error.name === "AbortError"
          ? "The connection took too long. Please try Refresh listings in a moment."
          : "Please try again shortly. If the issue continues, check that the PUBLIC DIRECTORY tab is still published as CSV.";
      }
      if (status) status.textContent = "FEED TEMPORARILY UNAVAILABLE";
      if (count) count.textContent = approvedListings.length
        ? `Showing ${approvedListings.length} previously loaded approved listing${approvedListings.length === 1 ? "" : "s"}. Refresh to try again.`
        : "Could not connect to the public directory feed.";
      if (grid) grid.setAttribute("aria-busy", "false");
    } finally {
      window.clearTimeout(timeoutId);
      requestInProgress = false;
      if (refresh) refresh.disabled = false;
    }
  }

  function initialiseNavigation() {
    const { menu, nav } = elements;
    const backdrop = $("#navBackdrop");
    const closeButton = $("#navClose");
    if (!menu || !nav) return;
    const closeMenu = () => {
      nav.classList.remove("open");
      nav.setAttribute("aria-hidden", "true");
      nav.inert = true;
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation");
      backdrop?.setAttribute("hidden", "");
      document.body.classList.remove("nav-open");
    };
    const openMenu = () => {
      nav.classList.add("open");
      nav.setAttribute("aria-hidden", "false");
      nav.inert = false;
      menu.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-label", "Close navigation");
      backdrop?.removeAttribute("hidden");
      document.body.classList.add("nav-open");
      closeButton?.focus();
    };
    nav.inert = true;
    menu.addEventListener("click", () => nav.classList.contains("open") ? closeMenu() : openMenu());
    closeButton?.addEventListener("click", closeMenu);
    backdrop?.addEventListener("click", closeMenu);
    $$("a", nav).forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        closeMenu();
        menu.focus();
      }
    });
  }
  function initialiseSearch() {
    elements.searchForm?.addEventListener("submit", event => {
      event.preventDefault();
      if (elements.directorySearch && elements.query) elements.directorySearch.value = elements.query.value;
      renderListings();
      document.querySelector("#directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.query?.addEventListener("input", () => syncSearch(elements.query));
    elements.directorySearch?.addEventListener("input", () => syncSearch(elements.directorySearch));
    elements.sort?.addEventListener("change", renderListings);
    $$('[data-search-term]').forEach(button => {
      button.addEventListener("click", () => {
        const value = button.dataset.searchTerm || "";
        if (elements.query) elements.query.value = value;
        if (elements.directorySearch) elements.directorySearch.value = value;
        setCategory("Everything", false);
        document.querySelector("#directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initialiseFilters() {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    const requestedSearch = params.get("q");
    if (requestedCategory) activeCategory = requestedCategory;
    if (requestedSearch && elements.directorySearch) {
      elements.directorySearch.value = requestedSearch;
      if (elements.query) elements.query.value = requestedSearch;
    }
    $('[data-filter]').forEach(button => {
      button.addEventListener("click", () => {
        if (elements.query) elements.query.value = "";
        if (elements.directorySearch) elements.directorySearch.value = "";
        setCategory(button.dataset.filter || "Everything", true);
      });
    });
    updateActiveFilters();
  }

  function initialise() {
    if (elements.year) elements.year.textContent = String(new Date().getFullYear());
    initialiseNavigation();
    initialiseSearch();
    initialiseFilters();
    elements.refresh?.addEventListener("click", loadListings);
    loadListings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
