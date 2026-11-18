#!/usr/bin/env python3
"""Quality checks for the BENGALOOP business-growth ecosystem website."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

ROOT = Path(__file__).resolve().parents[1]
ROUTES = {
    "explore.html": "index.html#services",
    "directory.html": "index.html#services",
    "pg-housing.html": "index.html#services",
    "for-businesses.html": "index.html#business-enquiry",
    "business-registration.html": "index.html#business-enquiry",
    "our-story.html": "index.html",
    "what-we-do.html": "index.html#services",
    "departments.html": "our-team.html#team",
}
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "sms", "data", "javascript"}

class Inspector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.duplicates = set()
        self.seen = set()
        self.links = []
        self.assets = []
        self.tags = Counter()

    def handle_starttag(self, tag, attrs):
        self.tags[tag] += 1
        values = {key.lower(): (value or "") for key, value in attrs}
        element_id = values.get("id", "")
        if element_id:
            self.ids.append(element_id)
            if element_id in self.seen:
                self.duplicates.add(element_id)
            self.seen.add(element_id)
        href = values.get("href", "")
        if tag == "a" and href:
            self.links.append(href)
        if tag in {"img", "script", "source", "iframe", "audio", "video"} and values.get("src"):
            self.assets.append((tag, values["src"]))
        if tag == "link" and href:
            self.assets.append(("link", href))

def check(errors, condition, message):
    if not condition:
        errors.append(message)

def local_target(raw):
    parsed = urlsplit(raw)
    if parsed.scheme.lower() in EXTERNAL_SCHEMES or parsed.netloc:
        return None, ""
    target = ROOT / unquote(parsed.path or "index.html").lstrip("/")
    try:
        target.resolve().relative_to(ROOT.resolve())
    except ValueError:
        return None, unquote(parsed.fragment)
    if target.is_dir():
        target = target / "index.html"
    return target, unquote(parsed.fragment)

def main():
    errors = []
    paths = {
        "home": ROOT / "index.html",
        "team": ROOT / "our-team.html",
        "lab": ROOT / "join-us.html",
    }
    for label, path in paths.items():
        check(errors, path.is_file(), f"{label} page missing: {path.name}")
    if errors:
        print("\n".join(errors))
        return 1

    home = paths["home"].read_text(encoding="utf-8")
    team = paths["team"].read_text(encoding="utf-8")
    lab = paths["lab"].read_text(encoding="utf-8")
    home_doc, team_doc, lab_doc = Inspector(), Inspector(), Inspector()
    home_doc.feed(home)
    team_doc.feed(team)
    lab_doc.feed(lab)

    # Homepage: indexability, central message, two-beneficiary model and current offer.
    check(errors, home_doc.tags["h1"] == 1, "homepage needs exactly one H1")
    check(errors, not home_doc.duplicates, "duplicate homepage IDs")
    check(errors, 'name="robots" content="index,follow,max-image-preview:large"' in home,
          "homepage must be indexable")
    check(errors, 'rel="canonical" href="https://sgpalya.in/"' in home, "homepage canonical missing")
    check(errors, "Student-Powered Business Growth Ecosystem" in home,
          "homepage title/positioning is not updated")
    check(errors, "Growing businesses." in home and "Developing people." in home,
          "homepage brand message missing")
    check(errors, home.count('class="eco-model-card"') == 2,
          "homepage should explain both business and student outcomes")
    check(errors, home.count('class="eco-journey-step"') == 3,
          "homepage should show the three-stage growth direction")
    check(errors, home.count('class="agency-service-card"') == 6,
          "homepage must show all six Experiment Lab-aligned business workstreams")
    for service in (
        "Business strategy &amp; research", "Finance &amp; business analysis",
        "Brand, marketing &amp; creative", "Digital &amp; technology solutions",
        "Business development &amp; client partnerships", "Operations, projects &amp; people",
    ):
        check(errors, service in home, "missing Experiment Lab-aligned workstream: " + service)
    check(errors, home.count('<details class="agency-next-card">') == 3,
          "homepage must show three multidisciplinary project examples")
    for phrase in ("Business clarity &amp; performance", "Brand, customer &amp; digital growth",
                   "Operational improvement", "Capability-led, not one-size-fits-all"):
        check(errors, phrase in home, "missing project example or capability boundary: " + phrase)
    check(errors, "statutory audit" in home and "tax filing" in home,
          "finance work boundaries must be stated")
    check(errors, 'value="Business strategy & research"' in home and
          'value="Operations, projects & people"' in home,
          "business enquiry options must match Experiment Lab workstreams")
    check(errors, 'id="businessEnquiryForm"' in home and 'id="businessEnquiryStatus"' in home,
          "business enquiry form/status missing")
    check(errors, 'data-form-endpoint=""' in home and "nothing is sent or stored" in home,
          "business enquiry must clearly state that submissions are disabled")
    check(errors, 'name="consent"' in home and 'name="businessName"' in home and 'name="phone"' in home,
          "business enquiry required fields/consent missing")
    check(errors, "PG / Hostel / Accommodation" not in home and
          "Startups &amp; Technology" in home and
          "Manufacturing &amp; Business Services" in home,
          "business categories must reflect the current growth-ecosystem audience, not the retired directory model")
    check(errors, '<span class="member-count-number">18</span>' in home and 'href="our-team.html"' in home,
          "homepage team count/link must show eighteen members")
    check(errors, home.count('class="agency-leader-card') == 2,
          "homepage should retain two leadership/team preview cards")
    check(errors, "Experiment Lab" in home and 'href="join-us.html"' in home,
          "homepage Experiment Lab link missing")
    check(errors, "Not affiliated with or endorsed by CHRIST University." in home,
          "homepage institutional-independence note missing")
    check(errors, "s.g. palya and nearby areas" in home.lower() and "our starting point" in home.lower(),
          "homepage must frame S.G. Palya as the starting geography")
    check(errors, not re.search(r"local business directory|neighbourhood directory|local discovery platform", home, re.I),
          "retired local-directory positioning must not appear on homepage")

    # Team page: one founder plus eighteen ordinary members.
    check(errors, 'name="robots" content="index,follow"' in team, "team page must be indexable")
    check(errors, '<meta property="og:title" content="Our Team | BENGALOOP">' in team and
          '<meta name="twitter:card" content="summary_large_image">' in team,
          "team page social metadata missing")
    for person in (
        "Naval Aggarwal", "Yuval Ostwal", "Rhythm Mehrotra", "Ripunjay Raj", "Su Mayur",
        "Rahul Raj Gupta", "Pranjita Devi", "Misbah Ur Rahman", "Bhavana Chandrashekar",
        "Swara Upadhayay", "Pradyumn Verma", "Rajath. R", "Anon Biju", "Mohammed Jawadh",
        "Johan Biju", "Subhankar Raj Gupta", "Nidhish Aggarwal", "Mohansh Arora", "Jenneth Pinto",
    ):
        check(errors, person in team, "missing team profile: " + person)
    members_section = (
        team.split('<section class="team-level team-level-members"', 1)[1].split("</section>", 1)[0]
        if '<section class="team-level team-level-members"' in team else ""
    )
    member_cards = re.findall(r'<article class="[^"]*team-card[^"]*">[\s\S]*?</article>', members_section)
    check(errors, 'id="team"' in team and "team-level-members" in team,
          "Founder-to-members hierarchy missing")
    check(errors, len(member_cards) == 18, "members category must contain eighteen visible profiles")
    check(errors, all('<span class="team-status">TEAM MEMBER</span>' in card for card in member_cards),
          "every member profile must display the TEAM MEMBER badge")
    check(errors, all("team-card-new" not in card for card in member_cards),
          "member profiles must use standard team-card styling")
    check(errors, "01 Founder" in team and "18 Members" in team and "Co-founder" not in team,
          "team counts must show one founder and eighteen members, with no co-founder tier")
    check(errors, "Experiment Lab" in team and "Not affiliated with or endorsed by CHRIST University." in team,
          "team page Experiment Lab link or independence note missing")

    # Experiment Lab: four courses, six departments, nineteen role pathways.
    check(errors, 'rel="canonical" href="https://sgpalya.in/join-us.html"' in lab,
          "Experiment Lab canonical missing")
    check(errors, '<meta name="twitter:card" content="summary_large_image">' in lab,
          "Experiment Lab Twitter metadata missing")
    check(errors, lab_doc.tags["h1"] == 1 and not lab_doc.duplicates,
          "Experiment Lab needs exactly one H1 and unique IDs")
    check(errors, "EXPERIMENT LAB" in lab and "independent student-led initiative" in lab,
          "Experiment Lab identity/independence statement missing")
    check(errors, lab.count('class="lab-course-card"') == 4,
          "Experiment Lab must show four academic pathways")
    check(errors, lab.count('class="lab-dept-card"') == 6,
          "Experiment Lab must show six departments")
    check(errors, lab.count('class="lab-role"') == 19,
          "Experiment Lab must describe nineteen role pathways")
    for pathway in (
        "B.Com Global Management Accounting &amp; Strategy", "Integrated with CIMA UK",
        "B.Com International Accountancy &amp; Finance", "Integrated with ACCA",
        "B.Com Branding &amp; Entrepreneurship", "B.Com Accountancy &amp; Finance",
        "Integrated with CA – ICAI",
    ):
        check(errors, pathway in lab, "missing academic pathway detail: " + pathway)
    for department in (
        "Business Strategy &amp; Research", "Finance &amp; Business Analysis",
        "Brand, Marketing &amp; Creative", "Business Development &amp; Client Partnerships",
        "Technology &amp; Digital Solutions", "Operations, Projects &amp; People",
    ):
        check(errors, department in lab, "missing Experiment Lab department: " + department)
    lower_lab = lab.lower()
    for phrase in ("not an official project of", "not affiliated with", "endorsed by"):
        check(errors, phrase in lower_lab, "Experiment Lab institutional disclosure missing: " + phrase)
    check(errors, "exploring opportunities for academic collaboration" in lower_lab,
          "academic collaboration invitation missing")
    check(errors, "illustrative scenario" in lower_lab and "not a claim" in lower_lab,
          "illustrative business case should be clearly labelled")

    # Preserve the exact four-field recruitment form and disabled-submission boundary.
    check(errors, 'id="studentApplicationForm"' in lab and 'data-form-endpoint=""' in lab,
          "student application form or disabled endpoint missing")
    application = re.search(r'<form[^>]*id="studentApplicationForm"[^>]*>([\s\S]*?)</form>', lab)
    application_names = re.findall(r'name="([^"]+)"', application.group(1)) if application else []
    check(errors, application_names == ["name", "registerNumber", "class", "department"],
          "student application form must retain exactly the original four fields")
    check(errors, "applications are not being collected yet" in lab.lower() and
          "not been sent or stored" in lab.lower(),
          "student form must clearly state that applications are not being collected")
    check(errors, 'data-requires-consent="true"' in lab and
          "privacy information" in lab and "explicit consent" in lab,
          "student application preview must require privacy and consent before activation")
    check(errors, lab.count("<option>Business Strategy &amp; Research</option>") == 1 and
          lab.count("<option>Operations, Projects &amp; People</option>") == 1,
          "student application department choices missing or duplicated")
    check(errors, 'id="studentApplicationStatus"' in lab,
          "student application status region missing")
    check(errors, "not currently affiliated with" in lower_lab and
          "CHRIST (Deemed to be University)" in lab and "endorsed by" in lower_lab,
          "Experiment Lab institutional footer note missing")

    # Reject legacy local-directory product language in business categories and redirects.
    # Shared navigation and local links.
    check(errors, 'href="join-us.html"' in home and 'href="join-us.html"' in team and
          "Experiment Lab" in home and "Experiment Lab" in team,
          "Experiment Lab navigation missing from homepage or team page")
    for source, doc, label in (
        (home, home_doc, "homepage"),
        (team, team_doc, "team"),
        (lab, lab_doc, "Experiment Lab"),
    ):
        for raw in doc.links:
            if raw.startswith("#"):
                check(errors, raw[1:] in doc.ids, f"broken {label} local anchor {raw}")
                continue
            target, fragment = local_target(raw)
            if target and fragment and target.resolve() == (ROOT / "index.html").resolve():
                check(errors, fragment in home_doc.ids, f"broken {label} homepage anchor #{fragment}")
            elif target and fragment and target.resolve() == (ROOT / "our-team.html").resolve():
                check(errors, fragment in team_doc.ids, f"broken {label} team anchor #{fragment}")
            elif target and fragment and target.resolve() == (ROOT / "join-us.html").resolve():
                check(errors, fragment in lab_doc.ids, f"broken {label} Experiment Lab anchor #{fragment}")
        for kind, raw in doc.assets:
            target, _ = local_target(raw)
            if target is not None:
                check(errors, target.is_file(), f"missing {label} {kind}: {raw}")

    for name, destination in ROUTES.items():
        route = ROOT / name
        check(errors, route.is_file(), "legacy route missing: " + name)
        if route.is_file():
            route_html = route.read_text(encoding="utf-8")
            check(errors, 'content="noindex,follow"' in route_html, name + " should be noindex")
            check(errors, destination in route_html, name + " has the wrong destination")
            check(errors, "local marketing experience" not in route_html.lower(),
                  name + " still describes the retired model")
            check(errors, "student-powered business growth ecosystem" in route_html.lower(),
                  name + " should identify the current ecosystem")

    agency_css = (ROOT / "agency.css").read_text(encoding="utf-8")
    ecosystem_css_path = ROOT / "ecosystem-home.css"
    lab_css_path = ROOT / "experiment-lab.css"
    check(errors, ecosystem_css_path.is_file(), "homepage ecosystem stylesheet missing")
    check(errors, lab_css_path.is_file(), "Experiment Lab stylesheet missing")
    ecosystem_css = ecosystem_css_path.read_text(encoding="utf-8") if ecosystem_css_path.is_file() else ""
    lab_css = lab_css_path.read_text(encoding="utf-8") if lab_css_path.is_file() else ""
    check(errors, "@media(max-width:600px)" in agency_css and
          "prefers-reduced-motion:reduce" in agency_css,
          "shared mobile/reduced-motion styles missing")
    check(errors, ".eco-model-section" in ecosystem_css and "@media(max-width:600px)" in ecosystem_css,
          "homepage ecosystem stylesheet lacks responsive rules")
    check(errors, ".lab-course-card" in lab_css and ".lab-dept-card" in lab_css and
          "@media(max-width:520px)" in lab_css,
          "Experiment Lab stylesheet lacks responsive components")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    check(errors, "Allow: /" in robots and "Disallow: /" not in robots,
          "robots.txt must allow crawling")
    check(errors, sitemap.count("<loc>") == 3 and
          "https://sgpalya.in/our-team.html" in sitemap and
          "https://sgpalya.in/join-us.html" in sitemap,
          "sitemap should list homepage, team and Experiment Lab")
    check(errors, (ROOT / "CNAME").read_text(encoding="utf-8").strip() == "sgpalya.in",
          "custom domain mapping changed")
    check(errors, not (ROOT / "SITE_SUSPENDED").exists(), "suspension marker must be absent")

    if errors:
        for error in errors:
            print("FAIL: " + error)
        return 1
    print("PASS: BENGALOOP ecosystem, business services, four academic pathways, six departments, "
          "nineteen roles, unchanged four-field form, team hierarchy, links, assets and crawl settings.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
