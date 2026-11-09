#!/usr/bin/env python3
"""Quality checks for the BENGALOOP local marketing website."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote,urlsplit
import re
ROOT=Path(__file__).resolve().parents[1]
ROUTES={"explore.html":"index.html#services","directory.html":"index.html#services","pg-housing.html":"index.html#services","for-businesses.html":"index.html#business-enquiry","business-registration.html":"index.html#business-enquiry","our-story.html":"index.html","what-we-do.html":"index.html#services","departments.html":"our-team.html#team"}
EXT={"http","https","mailto","tel","sms","data","javascript"}
class Inspector(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.ids=[];self.dups=set();self.seen=set();self.links=[];self.assets=[];self.tags=Counter()
 def handle_starttag(self,t,a):
  self.tags[t]+=1;v={k.lower():(x or "") for k,x in a};i=v.get("id","")
  if i:
   self.ids.append(i)
   if i in self.seen:self.dups.add(i)
   self.seen.add(i)
  h=v.get("href","")
  if t=="a" and h:self.links.append(h)
  if t in {"img","script","source","iframe","audio","video"} and v.get("src"):self.assets.append((t,v["src"]))
  if t=="link" and h:self.assets.append(("link",h))
def ck(e,c,m):
 if not c:e.append(m)
def target(raw):
 p=urlsplit(raw)
 if p.scheme.lower() in EXT or p.netloc:return None,""
 x=ROOT/unquote(p.path or "index.html").lstrip("/")
 try:x.resolve().relative_to(ROOT.resolve())
 except ValueError:return None,unquote(p.fragment)
 if x.is_dir():x=x/"index.html"
 return x,unquote(p.fragment)
def main():
 e=[];hp=ROOT/"index.html";tp=ROOT/"our-team.html"
 ck(e,hp.is_file(),"index.html missing");ck(e,tp.is_file(),"our-team.html missing")
 if e:print("\n".join(e));return 1
 h=hp.read_text(encoding="utf-8");t=tp.read_text(encoding="utf-8");p=Inspector();p.feed(h);q=Inspector();q.feed(t)
 ck(e,p.tags["h1"]==1,"homepage needs one H1");ck(e,not p.dups,"duplicate homepage IDs")
 ck(e,'name="robots" content="index,follow,max-image-preview:large"' in h,"homepage must be indexable")
 ck(e,'rel="canonical" href="https://sgpalya.in/"' in h,"homepage canonical URL missing")
 for s in ("Google &amp; Maps presence","Social media management","Content &amp; creative production","WhatsApp Business setup"):ck(e,s in h,"missing launch service "+s)
 ck(e,h.count('class="agency-service-card"')==4,"homepage must feature four initial services")
 ck(e,h.count('<details class="agency-next-card">')==6,"additional services should remain secondary/expandable")
 for s in ("Paid advertising","Websites &amp; digital catalogues","Local &amp; offline campaigns","Customer retention","Strategy &amp; reputation","Business training"):ck(e,s in h,"missing secondary service "+s)
 ck(e,'id="businessEnquiryForm"' in h and 'id="businessEnquiryStatus"' in h,"business enquiry form/status missing")
 ck(e,'data-form-endpoint=""' in h and "Online submissions are being connected" in h and "nothing is sent or stored" in h,"form must clearly explain that submissions are disabled until a secure endpoint is configured")
 ck(e,'name="consent"' in h and 'name="businessName"' in h and 'name="phone"' in h,"form required fields/consent missing")
 ck(e,f'<span class="member-count-number">{15}</span>' in h and 'href="our-team.html"' in h,"15-member team bar must link to full team")
 ck(e,h.count('class="agency-leader-card')==3,"homepage should show Founder and two Co-founders only")
 ck(e,"listingGrid" not in h and "department-grid" not in h and "ZERO FROM SCRATCH" not in h and "19 current roles" not in h,"old directory/recruitment content still on homepage")
 ck(e,not (ROOT/"SITE_SUSPENDED").exists(),"suspension marker must be removed")
 ck(e,'name="robots" content="index,follow"' in t,"team page must be indexable")
 for n in ("Naval Aggarwal","Rhythm Mehrotra","Yuval Ostwal","Ripunjay Raj","Su Mayur","Rahul Raj Gupta","Pranjita Devi","Misbah Ur Rahman","Bhavana Chandrashekar","Swara Upadhayay","Pradyumn Verma","Rajath. R","Anon Biju","Mohammed Jawadh","Johan Biju","Subhankar Raj Gupta","Nidhish Aggarwal","Mohansh Arora"):ck(e,n in t,"missing team profile "+n)
 ck(e,'id="team"' in t and "team-level-cofounders" in t and "team-level-members" in t,"team hierarchy missing")
 ck(e,'Junior Web Developer &amp; Technical Support Member' in t and "Chief Technology Officer" not in t,"Subhankar role classification changed")
 for raw in p.links:
  x,f=target(raw)
  if x and f and x.resolve()==hp.resolve():ck(e,f in p.ids,"broken homepage anchor #"+f)
  if x and f and x.resolve()==tp.resolve():ck(e,f in q.ids,"broken team page anchor #"+f)
 for kind,raw in p.assets+q.assets:
  x,_=target(raw)
  if x is not None:ck(e,x.is_file(),f"missing {kind}: {raw}")
 for name,dest in ROUTES.items():
  x=ROOT/name;ck(e,x.is_file(),"legacy page missing "+name)
  if x.is_file():
   s=x.read_text(encoding="utf-8");ck(e,'content="noindex,follow"' in s,name+" should be noindex");ck(e,dest in s,name+" wrong destination")
 css=(ROOT/"agency.css").read_text(encoding="utf-8");js=(ROOT/"relaunch.js").read_text(encoding="utf-8")
 ck(e,"@media(max-width:600px)" in css and "prefers-reduced-motion:reduce" in css,"mobile/reduced motion styles missing")
 ck(e,'credentials' in js and 'omit' in js and 'fetch(endpoint' in js,"form submission privacy boundary missing")
 robots=(ROOT/"robots.txt").read_text(encoding="utf-8");sm=(ROOT/"sitemap.xml").read_text(encoding="utf-8")
 ck(e,"Allow: /" in robots and "Disallow: /" not in robots,"robots must allow crawl")
 ck(e,sm.count("<loc>")==2 and "https://sgpalya.in/our-team.html" in sm,"sitemap should list homepage and team")
 ck(e,(ROOT/"CNAME").read_text(encoding="utf-8").strip()=="sgpalya.in","custom domain mapping changed")
 if e:
  for x in e:print("FAIL: "+x)
  return 1
 print("PASS: BENGALOOP marketing model, four launch services, form boundary, team hierarchy and crawl settings.")
 return 0
if __name__=="__main__":raise SystemExit(main())
