BENGALOOP — STUDENT-POWERED BUSINESS GROWTH ECOSYSTEM
=======================================================

BENGALOOP is an independent, student-led initiative working towards a
business growth ecosystem: practical support for businesses and real-world
learning opportunities for students. It is not currently affiliated with or
endorsed by CHRIST (Deemed to be University) or its Department of Professional
Studies. Any future institutional collaboration requires formal approval.

Public pages:
  index.html             Business growth ecosystem proposition, current services,
                         business enquiry and leadership preview
  our-team.html          Founder → 18 Members hierarchy and profiles
  join-us.html           Experiment Lab: academic pathways, departments, roles,
                         learning model, future direction and student application

Styles:
  style.css              Original shared style foundation
  agency.css             Shared agency/site components and responsive relaunch layer
  ecosystem-home.css     Additive homepage ecosystem section
  experiment-lab.css     Experiment Lab page-specific responsive design
  relaunch.js             Shared navigation, year label and business enquiry form

Experiment Lab invites students from four academic programmes:
  B.Com Global Management Accounting & Strategy — CIMA UK integrated
  B.Com International Accountancy & Finance — ACCA integrated
  B.Com Branding & Entrepreneurship
  B.Com Accountancy & Finance — CA (ICAI) integrated

The programme pathways are not rigid role assignments. The page describes six
functional departments and nineteen role pathways; actual opportunities depend
on skills, readiness and project requirements.

FORM STATUS:
The student application form retains four fields: full name, register number,
class/course & section, and preferred department. The form is a preview until a
secure submission destination is configured in data-form-endpoint. While blank,
student details are not sent or stored and the page clearly says applications
are not being collected.

The business enquiry form is also not live until its secure server-side receiver
is configured. While blank, no enquiry details are sent or stored.

Checks:
  python tools/validate_site.py
  node --check relaunch.js
  node tools/browser_smoke_test.mjs

Custom domain mapping remains sgpalya.in (CNAME).
