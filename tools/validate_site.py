#!/usr/bin/env python3
"""Structural checks for BENGALOOP's mobile-first multi-page website."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
ROOT=Path(__file__).resolve().parents[1]
PAGES=("index.html","what-we-do.html","departments.html","our-team.html","explore.html","directory.html","pg-housing.html","for-businesses.html","business-registration.html","our-story.html")
NAV={"index.html","what-we-do.html","departments.html","our-team.html#members","explore.html","directory.html","pg-housing.html","for-businesses.html","our-story.html"}
class Audit(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.ids=[];self.dups=set();self.seen=set();self.links=[];self.resources=[];self.nav=[];self.in_nav=False;self.h1=0
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=="h1":self.h1+=1
  if a.get("id"):
   self.ids.append(a["id"])
   if a["id"] in self.seen:self.dups.add(a["id"])
   self.seen.add(a["id"])
  if t=="nav":self.in_nav=True
  if t=="a" and a.get("href"):
   self.links.append(a["href"])
   if self.in_nav:self.nav.append(a["href"])
  if t in {"img","script","source","iframe","audio","video"} and a.get("src"):self.resources.append(a["src"])
  if t=="link" and a.get("href"):self.resources.append(a["href"])
 def handle_endtag(self,t):
  if t=="nav":self.in_nav=False
def main():
 errors=[];pages={}
 def ck(ok,msg):
  if not ok:errors.append(msg)
 for name in PAGES:
  path=ROOT/name
  ck(path.is_file(),"Missing page "+name)
  if not path.is_file():continue
  html=path.read_text(encoding="utf-8");a=Audit();a.feed(html);pages[name]=(html,a)
  for tag in ("html","head","body","header","nav","main","footer"):ck(html.count("<"+tag)==1 or (tag=="html" and html.count("<html")==1),name+": expected one "+tag)
  ck(a.h1==1,name+": expected exactly one H1");ck(not a.dups,name+": duplicate IDs "+str(sorted(a.dups)))
  ck('class="brand-edition"' not in html and 'width="310" height="75"' in html,name+": header branding regressed")
  ck("window.location.replace" not in html,name+": expected an actual page, not a redirect")
  for href in a.links:
   u=urlsplit(href)
   if u.scheme or u.netloc:continue
   target=path if not u.path else (ROOT/unquote(u.path)).resolve()
   try:target.relative_to(ROOT.resolve())
   except ValueError:continue
   ck(target.is_file(),name+": broken link "+href)
   if u.fragment and target.is_file() and target.suffix==".html":
    dest=target.read_text(encoding="utf-8");ck(('id="'+unquote(u.fragment)+'"') in dest,name+": broken fragment "+href)
  for raw in a.resources:
   u=urlsplit(raw)
   if u.scheme or u.netloc:continue
   target=(ROOT/unquote(u.path)).resolve()
   try:target.relative_to(ROOT.resolve())
   except ValueError:continue
   ck(target.is_file(),name+": missing asset "+raw)
 for name,(html,a) in pages.items():
  for href in NAV:ck(href in a.nav,name+": missing nav route "+href)
  ck('href="business-registration.html"' in a.nav,name+": missing registration action")
 home=pages["index.html"][0]
 for x in ("home","what-we-do","recruitment-open","departments","leadership"):ck('id="'+x+'"' in home,"Homepage missing #"+x)
 for x in ("listingGrid","businessRegistrationForm","team-level-members","directory","housing","for-businesses","story","app-launch","vision","explore"):ck('id="'+x+'"' not in home and 'class="team-level-members"' not in home,"Non-core content on homepage: "+x)
 ck('class="team-level-founder"' in home and home.count('class="team-status">CO-FOUNDER</span>')==2,"Homepage must show Founder and two Co-founders only")
 ck('id="member-count-link"' in home and 'href="our-team.html#members"' in home and "<span>15</span> MEMBERS" in home,"Homepage member-count route missing")
 team=pages["our-team.html"][0];count=len(re.findall(r'<article class="team-card team-card-partner',team))
 ck('id="members"' in team and 'class="team-level team-level-members"' in team,"Dedicated Members page missing")
 ck(count==15,"Expected 15 member cards, found "+str(count))
 ck("team-level-founder" not in team and "team-level-cofounders" not in team,"Team page should focus on Members")
 recruitment=(ROOT/"recruitment.js").read_text(encoding="utf-8")
 roles=len(re.findall(r'\{id:"[^"]+",name:"[^"]+",summary:',recruitment));ck(roles==19,"Expected 19 recruitment roles")
 for name in ("index.html","departments.html"):
  page=pages[name][0];card_ids=set(re.findall(r'data-department-id=["\']([^"\']+)["\']',page))
  ck(len(card_ids)==6,name+": all six departments must remain available")
  ck('id="departmentExplorer"' in page and "19 current roles" in page,name+": role explorer/count missing")
 what=pages["what-we-do.html"][0]
 ck('id="what-we-do"' in what and 'id="vision"' in what and 'class="local-loop-board"' in what,"What-we-do model missing")
 script=(ROOT/"script.js").read_text(encoding="utf-8")
 ck('if (elements.grid) {' in script,"Directory loading must be page-specific")
 ck('normalise(item.status) === "approved"' in script and 'credentials: "omit"' in script and 'cache: "no-store"' in script,"Directory approval/privacy contract changed")
 for name in ("explore.html","directory.html","pg-housing.html"):
  ck('id="listingGrid"' in pages[name][0] and 'name="bengaloop-directory-csv"' in pages[name][0],name+": directory integration missing")
 reg=pages["business-registration.html"][0];regjs=(ROOT/"business-registration.js").read_text(encoding="utf-8")
 ck('id="businessRegistrationForm"' in reg and "Preview only" in regjs and "No information has been sent or saved" in regjs,"Registration preview must remain separate")
 story=pages["our-story.html"][0]
 ck('id="app-launch"' in story and "January 2027" in story and "Google Play Store" in story and "Apple App Store" in story,"App launch details missing")
 ck(len(re.findall(r"<details(?:\s|>)",story,re.I))>=6,"Story FAQ section missing")
 css=(ROOT/"style.css").read_text(encoding="utf-8")
 for val in ("prefers-reduced-motion: reduce",".scroll-reveal","team-members-count-link"):ck(val in css,"Responsive style missing "+val)
 sitemap=(ROOT/"sitemap.xml").read_text(encoding="utf-8");ck(sitemap.count("<loc>")==len(PAGES),"Sitemap should list all ten pages")
 for name in PAGES:
  url="https://sgpalya.in/" if name=="index.html" else "https://sgpalya.in/"+name
  ck(url in sitemap,"Sitemap missing "+url)
 print("Inspected "+str(len(pages))+" pages, 15 members, six departments and 19 roles.")
 if errors:print("\n".join("FAIL: "+e for e in errors));return 1
 print("PASS: all BENGALOOP multi-page checks passed.");return 0
if __name__=="__main__":raise SystemExit(main())
