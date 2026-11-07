#!/usr/bin/env python3
"""Structural and integration checks for the BENGALOOP one-page static site."""
from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ROUTES = {
    "explore.html": "explore",
    "directory.html": "directory",
    "pg-housing.html": "directory",
    "for-businesses.html": "for-businesses",
    "business-registration.html": "business-registration",
    "our-story.html": "story",
    "what-we-do.html": "what-we-do",
    "our-team.html": "team",
    "departments.html": "departments",
}
LOCAL_SCHEMES = {"http", "https", "mailto", "tel", "sms", "data", "javascript"}


class Inspector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.duplicate_ids: set[str] = set()
        self._seen: set[str] = set()
        self.links: list[str] = []
        self.resources: list[tuple[str, str]] = []
        self.tags: Counter[str] = Counter()
        self.nav_links: list[str] = []
        self.in_nav = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tags[tag] += 1
        values = {key.lower(): (value or "") for key, value in attrs}
        element_id = values.get("id", "").strip()
        if element_id:
            self.ids.append(element_id)
            if element_id in self._seen:
                self.duplicate_ids.add(element_id)
            self._seen.add(element_id)
        if tag == "nav":
            self.in_nav = True
        href = values.get("href", "").strip()
        if tag == "a" and href:
            self.links.append(href)
            if self.in_nav:
                self.nav_links.append(href)
        if tag in {"img", "script", "source", "iframe", "audio", "video"}:
            src = values.get("src", "").strip()
            if src:
                self.resources.append((tag, src))
        if tag == "link" and href:
            self.resources.append(("link", href))

    def handle_endtag(self, tag: str) -> None:
        if tag == "nav":
            self.in_nav = False


def check(errors: list[str], condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def local_path(raw: str) -> tuple[Path | None, str]:
    parsed = urlsplit(raw.strip())
    if parsed.scheme.lower() in LOCAL_SCHEMES or parsed.netloc:
        return None, ""
    path = unquote(parsed.path)
    fragment = unquote(parsed.fragment)
    if not path:
        return ROOT / "index.html", fragment
    candidate = (ROOT / path.lstrip("/")).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None, fragment
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate, fragment


def main() -> int:
    errors: list[str] = []
    index_path = ROOT / "index.html"
    check(errors, index_path.is_file(), "canonical index.html is missing")
    if errors:
        print("\n".join(errors))
        return 1

    html = index_path.read_text(encoding="utf-8")
    parser = Inspector()
    parser.feed(html)
    parser.close()

    required_tags = {"html": 1, "head": 1, "body": 1, "header": 1, "nav": 1, "main": 1, "footer": 1}
    for tag, count in required_tags.items():
        check(errors, parser.tags[tag] == count,
              f"index.html: expected {count} <{tag}> element(s), found {parser.tags[tag]}")
    check(errors, html.count('class="site-shell"') == 1, "index.html: expected one .site-shell wrapper")
    check(errors, not parser.duplicate_ids,
          "index.html: duplicate IDs: " + ", ".join(sorted(parser.duplicate_ids)))
    check(errors, parser.tags["h1"] == 1, "index.html: a single-page site must have exactly one primary H1")
    check(errors, 'name="viewport"' in html, "index.html: viewport metadata is missing")
    check(errors, 'name="bengaloop-directory-csv"' in html, "index.html: public directory CSV feed is missing")
    check(errors, "family=Manrope" in html, "index.html: Manrope typeface is not loaded")
    check(errors, 'property="og:title"' in html and 'property="og:description"' in html,
          "index.html: Open Graph title/description metadata is missing")
    check(errors, html.count('name="twitter:title"') == 1
          and html.count('name="twitter:description"') == 1
          and html.count('name="twitter:image"') == 1,
          "index.html: Twitter card metadata must have one consistent title, description and image")
    check(errors, 'property="og:image:alt"' in html,
          "index.html: social sharing image alternative text is missing")

    required_sections = {
        "home", "explore", "directory", "housing", "for-businesses",
        "business-registration", "what-we-do", "vision", "story", "team", "departments", "app-launch",
    }
    actual_ids = set(parser.ids)
    for section_id in sorted(required_sections):
        check(errors, section_id in actual_ids, f"index.html: required section anchor #{section_id} is missing")

    required_nav = {f"#{section_id}" for section_id in (
        "home", "explore", "directory", "housing", "for-businesses",
        "what-we-do", "vision", "story", "team", "departments", "app-launch"
    )}
    for href in required_nav:
        check(errors, href in parser.nav_links, f"index.html: navigation link {href} is missing")

    for href in parser.links:
        target, fragment = local_path(href)
        if fragment and target is not None and target.resolve() == index_path.resolve():
            check(errors, fragment in actual_ids, f"index.html: broken same-page anchor #{fragment}")

    for kind, raw in parser.resources:
        target, _ = local_path(raw)
        if target is not None:
            check(errors, target.is_file(), f"index.html: missing local {kind} resource: {raw}")

    for filename, target in ROUTES.items():
        route = ROOT / filename
        check(errors, route.is_file(), f"missing legacy route bridge: {filename}")
        if not route.is_file():
            continue
        source = route.read_text(encoding="utf-8")
        check(errors, 'content="noindex,follow"' in source,
              f"{filename}: route bridge must be excluded from indexing")
        check(errors, "window.location.replace" in source,
              f"{filename}: client redirect is missing")
        check(errors, f'destination.hash = "{target}"' in source,
              f"{filename}: redirect target must be #{target}")
        check(errors, "index.html" in source, f"{filename}: redirect must point to index.html")

    script = (ROOT / "script.js").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    recruitment = (ROOT / "recruitment.js").read_text(encoding="utf-8")
    registration = (ROOT / "business-registration.js").read_text(encoding="utf-8")

    for required in ('id="listingGrid"', 'id="directorySearch"', 'id="sortListings"',
                     'id="refreshListings"', 'id="listingStatus"'):
        check(errors, required in html, f"index.html: required directory element {required} is missing")
    check(errors, 'normalise(item.status) === "approved"' in script,
          "directory script no longer enforces Approved listing status")
    check(errors, 'credentials: "omit"' in script and 'cache: "no-store"' in script,
          "public directory fetch privacy/cache settings changed")
    check(errors, "exploreSearchForm" in script,
          "Explore search form is not connected to the shared directory")
    check(errors, "initialiseSectionNavigation" in script,
          "scroll-aware single-page navigation is missing")
    check(errors, 'const words = $$("[data-tagline-word]")' in script,
          "tagline reveal must select all word elements, not a single element")
    check(errors, 'const sections = $$("main > section:not(.home-hero):not(.hero)")' in script,
          "scroll reveal must select all content sections, not a single element")
    check(errors, 'const links = $$(\'nav#nav a[href^="#"]\')' in script,
          "section navigation must collect every drawer link before mapping targets")


    check(errors, "$$('[data-filter]').forEach(button => {" in script,
          "filter initialisation must iterate over all category controls")
    
    card_ids = set(re.findall(r'data-department-id=["\']([^"\']+)["\']', html))
    role_ids = set(re.findall(r'^\s*id:"(business|marketing|creative|technology|community|operations)"', recruitment, re.M))
    check(errors, len(card_ids) == 6 and card_ids == role_ids,
          "department cards do not match all six recruitment data groups")
    role_count = len(re.findall(r'\{id:"[^"]+",name:"[^"]+",summary:', recruitment))
    check(errors, role_count == 19, f"expected 19 recruitment roles, found {role_count}")

    check(errors, html.count('<span class="team-status">CO-FOUNDER</span>') == 2
          and "Rhythm Mehrotra" in html and "Yuval Ostwal" in html,
          "team leadership contract changed: Rhythm and Yuval must remain the only co-founders")
    team_start = html.find('<section class="team-section"')
    team_end = html.find('<section class="departments-section"', team_start)
    founder_pos = html.find('id="leadership"', team_start, team_end)
    cofounder_pos = html.find("team-level-cofounders", team_start, team_end)
    members_pos = html.find("team-level-members", team_start, team_end)
    check(errors, team_start >= 0 and founder_pos >= 0 and cofounder_pos > founder_pos
          and members_pos > cofounder_pos,
          "team hierarchy must read Founder → Co-founders → Members")
    check(errors, 'Junior Web Developer &amp; Technical Support Member' in html
          and "Chief Technology Officer" not in html and 'team-status">CTO' not in html
          and 'id="technical-leadership-title"' not in html,
          "Subhankar must be an ordinary member, not in a separate CTO section")
    check(errors, "Nidhish Aggarwal" in html and "Institutional Partnership Associate" in html
          and "B.Com · Global Management Accounting &amp; Strategy" in html,
          "Nidhish's member profile is missing or incomplete")
    check(errors, "Mohansh Arora" in html and "Website Developer &amp; Administrator" in html
          and "Bachelor of Computer Applications" in html,
          "Mohansh's member profile is missing or incomplete")
    check(errors, 'aria-label="Initials for Rajath R.">RR</div>' in html,
          "team profiles without photographs must use a clear initials placeholder")
    check(errors, 'class="page-masthead"><div class="page-masthead-inner"><div class="section-kicker">THE BENGALOOP MODEL' not in html,
          "the What We Do section must not repeat its main heading in a redundant masthead")

    check(errors, "RECRUITMENT OPEN" in html and "19 current roles" in html
          and "co-founders, managers, team members and volunteers" in html
          and "students from across campus" in html and "ZERO FROM SCRATCH" in html,
          "ZERO FROM SCRATCH recruitment campaign must identify the audience and current opportunities")
    check(errors, "Six departments." in html and "More roles may be introduced as BENGALOOP grows." in html,
          "department recruitment section must communicate the six-department / growing-role structure")
    check(errors, 'id="vision"' in html and 'class="local-loop-board"' in html
          and "the connecting layer" in html.lower(),
          "the original local-loop mechanism or complementary ecosystem visual is missing")
    check(errors, 'id="app-launch"' in html and "January 2027" in html
          and "Google Play Store" in html and "Apple App Store" in html,
          "final January 2027 app launch announcement is incomplete")
    check(errors, 'id="businessRegistrationForm"' in html,
          "business registration preview form is missing")
    check(errors, "Preview only" in registration
          and "No information has been sent or saved" in registration,
          "business registration preview/data-handling boundary changed")

    faq_count = len(re.findall(r"<details(?:\s|>)", html, re.I))
    check(errors, faq_count >= 6, f"expected at least 6 factual FAQs, found {faq_count}")
    check(errors, 'threshold: 0,' in script and 'threshold: 0.12' not in script,
          "section reveal must support long mobile sections without a 12% visibility threshold")
    check(errors, 'class="brand-edition"' not in html and 'width="310" height="75"' in html,
          "the primary navigation must not show the S.G. Palya edition label and must use the larger logo")
    check(errors, not re.search(r"\bBANGALOOP\b", html, re.I),
          "the incorrect BANGALOOP spelling must not appear in the canonical page")
    check(errors, "prefers-reduced-motion: reduce" in css,
          "shared stylesheet is missing reduced-motion support")
    check(errors, "width: 100vw" in css and ".site-shell" in css,
          "shared viewport-sized site shell styles are missing")
    check(errors, ".scroll-reveal" in css and ".tagline-inner.tagline-enhanced" in css,
          "scroll-reveal/tagline motion system is missing")
    check(errors, ":active" in css, "shared stylesheet is missing active interaction states")
    check(errors, not re.search(r"\b(?:Inter|Arial|Georgia|Roboto|Helvetica)\b", css, re.I),
          "shared stylesheet contains an unapproved typeface")
    check(errors, not re.search(r"font:\s*italic|font-style:\s*italic", css, re.I),
          "shared stylesheet still declares italic text")
    check(errors, 'name="robots" content="noindex,follow"' in (ROOT / "404.html").read_text(encoding="utf-8"),
          "404.html must remain excluded from search indexing")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    check(errors, sitemap.count("<loc>") == 1 and "https://sgpalya.in/</loc>" in sitemap,
          "sitemap.xml must list only the canonical one-page website")

    print("Inspected the canonical one-page site, " + str(len(ROUTES)) +
          " legacy route bridges, 6 departments and " + str(role_count) + " recruitment roles.")
    print("Checked section anchors, navigation, local assets, directory privacy, team structure, form boundaries and reduced motion.")
    if errors:
        for error in errors:
            print("FAIL: " + error)
        print(str(len(errors)) + " site quality check(s) failed.")
        return 1
    print("PASS: all BENGALOOP single-page quality checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
