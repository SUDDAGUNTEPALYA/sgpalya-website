#!/usr/bin/env python3
"""Dependency-free structural and integration checks for the BENGALOOP static site.

Run from the repository root:
    python tools/validate_site.py

This intentionally checks architecture contracts, not visual appearance. A future
redesign can change page markup, but this validator must then be updated deliberately
to reflect the new documented architecture.
"""
from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "sms", "data", "javascript"}
PLACEHOLDER_LINK = re.compile(r"^(?:LINKEDIN PROFILE URL|PROFILE URL|YOUR LINKEDIN URL)$", re.I)


class PageInspector(HTMLParser):
    def __init__(self, page: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.page = page
        self.tag_counts: Counter[str] = Counter()
        self.ids: list[str] = []
        self.duplicate_ids: set[str] = set()
        self._seen_ids: set[str] = set()
        self.images_missing_alt: list[str] = []
        self.resources: list[tuple[str, str]] = []
        self.internal_links: list[str] = []
        self.nav_links: list[str] = []
        self.footer_links: list[str] = []
        self.meta_names: dict[str, str] = {}
        self.titles = 0
        self.in_nav = False
        self.in_footer = False
        self.label_depth = 0
        self.unlabelled_controls: list[str] = []
        self.labels_for: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): (value or "") for key, value in attrs}
        self.tag_counts[tag] += 1

        element_id = attributes.get("id", "").strip()
        if element_id:
            self.ids.append(element_id)
            if element_id in self._seen_ids:
                self.duplicate_ids.add(element_id)
            self._seen_ids.add(element_id)

        if tag == "title":
            self.titles += 1
        if tag == "nav":
            self.in_nav = True
        if tag == "footer":
            self.in_footer = True
        if tag == "label":
            self.label_depth += 1
            if attributes.get("for"):
                self.labels_for.add(attributes["for"])
        if tag in {"input", "select", "textarea"}:
            control_type = attributes.get("type", "").lower()
            if control_type not in {"hidden", "submit", "button", "reset", "image"}:
                control_id = attributes.get("id", "")
                accessible = (
                    bool(attributes.get("aria-label"))
                    or bool(attributes.get("aria-labelledby"))
                    or self.label_depth > 0
                    or (bool(control_id) and control_id in self.labels_for)
                )
                # Explicit for= labels may occur after the control, so the final
                # label check is completed in validate_site() as well.
                if not accessible and control_id:
                    self.unlabelled_controls.append(control_id)

        if tag == "meta":
            name = attributes.get("name", "").lower()
            if name:
                self.meta_names[name] = attributes.get("content", "")
        if tag == "img" and "alt" not in attributes:
            self.images_missing_alt.append(attributes.get("src", "(image without src)"))

        href = attributes.get("href", "").strip()
        if tag == "a" and href:
            self.internal_links.append(href)
            if self.in_nav:
                self.nav_links.append(href)
            if self.in_footer:
                self.footer_links.append(href)
        elif tag == "link" and href:
            self.resources.append(("link", href))

        src = attributes.get("src", "").strip()
        if tag in {"img", "script", "source", "iframe", "audio", "video"} and src:
            self.resources.append((tag, src))

    def handle_endtag(self, tag: str) -> None:
        if tag == "nav":
            self.in_nav = False
        elif tag == "footer":
            self.in_footer = False
        elif tag == "label" and self.label_depth:
            self.label_depth -= 1


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def local_target(raw_url: str, source_page: Path) -> tuple[Path | None, str]:
    """Resolve a local href/src. Return (target file, fragment)."""
    parsed = urlsplit(raw_url.strip())
    if parsed.scheme.lower() in EXTERNAL_SCHEMES or parsed.netloc:
        return None, ""
    path_text = unquote(parsed.path)
    fragment = unquote(parsed.fragment)
    if not path_text:
        return source_page, fragment
    if path_text.startswith("/"):
        candidate = (ROOT / path_text.lstrip("/")).resolve()
    else:
        candidate = (ROOT / path_text).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None, fragment
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate, fragment


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("FAIL: no root HTML pages found")
        return 1

    inspectors: dict[Path, PageInspector] = {}
    html_sources: dict[Path, str] = {}
    for page in pages:
        source = page.read_text(encoding="utf-8")
        parser = PageInspector(page)
        parser.feed(source)
        parser.close()
        inspectors[page] = parser
        html_sources[page] = source

        required_counts = {"html": 1, "head": 1, "body": 1, "header": 1, "nav": 1, "main": 1, "footer": 1}
        for tag, expected in required_counts.items():
            actual = parser.tag_counts[tag]
            if actual != expected:
                fail(errors, f"{page.name}: expected {expected} <{tag}> element(s), found {actual}")

        if parser.tag_counts['div'] < 1 or source.count('class="site-shell"') != 1:
            fail(errors, f"{page.name}: expected exactly one shared .site-shell wrapper")
        if parser.duplicate_ids:
            fail(errors, f"{page.name}: duplicate IDs: {', '.join(sorted(parser.duplicate_ids))}")
        if parser.images_missing_alt:
            fail(errors, f"{page.name}: images without alt text: {', '.join(parser.images_missing_alt)}")
        if "viewport" not in parser.meta_names:
            fail(errors, f"{page.name}: missing viewport meta tag")
        if parser.titles != 1:
            fail(errors, f"{page.name}: expected one document title, found {parser.titles}")
        if not re.search(r"<\s*body\s*>\s*<div\s+class=[\"']site-shell[\"']", source, re.I):
            fail(errors, f"{page.name}: .site-shell must be the first element inside <body>")

        for kind, raw_url in parser.resources:
            if raw_url.startswith("#"):
                continue
            if PLACEHOLDER_LINK.match(raw_url):
                warnings.append(f"{page.name}: placeholder resource/link remains: {raw_url}")
                continue
            target, _ = local_target(raw_url, page)
            if target is not None and not target.is_file():
                fail(errors, f"{page.name}: missing local {kind} asset: {raw_url}")

    # Validate internal page links and fragment IDs after every page has been parsed.
    ids_by_page = {page.resolve(): set(parser.ids) for page, parser in inspectors.items()}
    for page, parser in inspectors.items():
        for href in parser.internal_links:
            if PLACEHOLDER_LINK.match(href):
                warnings.append(f"{page.name}: hidden/profile placeholder link: {href}")
                continue
            target, fragment = local_target(href, page)
            if target is None:
                continue
            if not target.is_file():
                fail(errors, f"{page.name}: broken internal link: {href}")
                continue
            if fragment and target.suffix.lower() == ".html":
                target_ids = ids_by_page.get(target.resolve())
                if target_ids is None:
                    target_parser = PageInspector(target)
                    target_parser.feed(target.read_text(encoding="utf-8"))
                    target_ids = set(target_parser.ids)
                if fragment not in target_ids:
                    fail(errors, f"{page.name}: link target does not exist: {href}")

    # Shared navigation/footer are deliberately kept consistent across all pages.
    first_page = pages[0]
    reference_nav = inspectors[first_page].nav_links
    reference_footer = inspectors[first_page].footer_links
    for page, parser in inspectors.items():
        if parser.nav_links != reference_nav:
            fail(errors, f"{page.name}: navigation links differ from {first_page.name}")
        if parser.footer_links != reference_footer:
            fail(errors, f"{page.name}: footer links differ from {first_page.name}")

    expected_pages = {
        "index.html", "explore.html", "directory.html", "pg-housing.html",
        "for-businesses.html", "business-registration.html", "departments.html",
        "our-story.html", "our-team.html", "what-we-do.html",
    }
    actual_pages = {page.name for page in pages}
    missing_pages = expected_pages - actual_pages
    if missing_pages:
        fail(errors, f"missing expected site pages: {', '.join(sorted(missing_pages))}")

    # Check page-specific integration contracts.
    def read(name: str) -> str:
        path = ROOT / name
        if not path.is_file():
            fail(errors, f"required source file is missing: {name}")
            return ""
        return path.read_text(encoding="utf-8")

    shared_js = read("script.js")
    css = read("style.css")
    recruitment_js = read("recruitment.js")
    registration_js = read("business-registration.js")

    for page in pages:
        if 'script.js?' not in html_sources[page]:
            fail(errors, f"{page.name}: shared script.js is not loaded")

    directory_pages = [ROOT / "directory.html", ROOT / "pg-housing.html"]
    feed_urls = []
    for page in directory_pages:
        source = html_sources.get(page, "")
        match = re.search(r'<meta\s+name=["\']bengaloop-directory-csv["\']\s+content=["\']([^"\']+)["\']', source, re.I)
        if not match:
            fail(errors, f"{page.name}: public directory CSV configuration is missing")
        else:
            feed_urls.append(match.group(1))
        for required_id in ("listingGrid", "directorySearch", "sortListings", "refreshListings", "listingStatus"):
            if f'id="{required_id}"' not in source:
                fail(errors, f"{page.name}: required directory control #{required_id} is missing")
    if len(feed_urls) == 2 and feed_urls[0] != feed_urls[1]:
        fail(errors, "directory.html and pg-housing.html use different CSV feeds")
    if "normalise(item.status) === \"approved\"" not in shared_js:
        fail(errors, "shared directory script no longer enforces Approved listing status")
    if 'credentials: "omit"' not in shared_js or 'cache: "no-store"' not in shared_js:
        fail(errors, "public directory fetch privacy/cache settings have changed; review deliberately")

    departments_html = html_sources.get(ROOT / "departments.html", "")
    card_ids = set(re.findall(r'data-department-id=["\']([^"\']+)["\']', departments_html))
    js_department_ids = set(re.findall(r'^\s*id:"(business|marketing|creative|technology|community|operations)"', recruitment_js, re.M))
    if len(card_ids) != 6 or card_ids != js_department_ids:
        fail(errors, "department card IDs do not match the six recruitment data groups")
    if 'recruitment.js?' not in departments_html:
        fail(errors, "departments.html does not load recruitment.js")
    if 'recruitment.js?' in html_sources.get(ROOT / "our-team.html", ""):
        fail(errors, "our-team.html must remain separate from the department explorer")

    team_html = html_sources.get(ROOT / "our-team.html", "")
    cofounder_badges = team_html.count('<span class="team-status">CO-FOUNDER</span>')
    if cofounder_badges != 2 or "Rhythm Mehrotra" not in team_html or "Yuval Ostwal" not in team_html:
        fail(errors, "team leadership contract changed: Rhythm and Yuval must remain the only co-founder profiles")

    registration_html = html_sources.get(ROOT / "business-registration.html", "")
    if 'business-registration.js?' not in registration_html:
        fail(errors, "business-registration.html does not load its preview script")
    if "Preview only" not in registration_js or "No information has been sent or saved" not in registration_js:
        fail(errors, "registration workflow status changed; verify its data-handling boundary deliberately")

    if "prefers-reduced-motion: reduce" not in css:
        fail(errors, "shared stylesheet is missing reduced-motion support")
    if "width: 100vw" not in css or ".site-shell" not in css:
        fail(errors, "shared viewport-sized site shell styles are missing")
    for asset in re.findall(r"url\(\s*[\"']?([^\"')]+)", css):
        target, _ = local_target(asset, ROOT / "style.css")
        if target is not None and not target.is_file():
            fail(errors, f"style.css: missing local CSS asset: {asset}")

    # Design-system contracts introduced by the November 2026 refresh.
    for page, source in html_sources.items():
        if "family=Manrope" not in source:
            fail(errors, f"{page.name}: the shared Manrope typeface is not loaded")
        if 'property="og:title"' not in source or 'property="og:description"' not in source:
            fail(errors, f"{page.name}: Open Graph title/description metadata is missing")
        if page.name != "404.html" and source.count('aria-current="page"') != 1:
            fail(errors, f"{page.name}: expected exactly one current-page navigation marker")

    homepage = html_sources.get(ROOT / "index.html", "")
    if 'class="tagline-section"' not in homepage or homepage.count("data-tagline-word") < 8:
        fail(errors, "index.html: the word-activated BENGALOOP tagline section is missing")
    faq_items = len(re.findall(r"<details(?:\s|>)", homepage, re.I))
    if faq_items < 6:
        fail(errors, f"index.html: expected at least 6 factual FAQ items, found {faq_items}")
    if not (ROOT / "404.html").is_file():
        fail(errors, "branded 404.html page is missing")
    if "https://sgpalya.in/departments.html" not in read("sitemap.xml"):
        fail(errors, "sitemap.xml does not include departments.html")
    if ".scroll-reveal" not in css or ".tagline-inner.tagline-enhanced" not in css:
        fail(errors, "shared stylesheet is missing the scroll-reveal/tagline motion system")
    if ":active" not in css:
        fail(errors, "shared stylesheet is missing active interaction states")

    # Report the actual number of role records without freezing future role growth.
    role_count = len(re.findall(r'\{id:"[^"]+",name:"[^"]+",summary:', recruitment_js))
    print(f"Inspected {len(pages)} HTML pages; {len(reference_nav)} shared nav links; {role_count} recruitment roles.")
    print(f"Checked local links/assets, page shells, IDs, accessibility basics and integration boundaries.")
    for warning in sorted(set(warnings)):
        print(f"WARNING: {warning}")
    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        print(f"\n{len(errors)} site quality check(s) failed.")
        return 1
    print("PASS: all BENGALOOP site quality checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
