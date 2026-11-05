/* BENGALOOP student recruitment explorer — local, accessible interactions. */
(() => {
  "use strict";

  const departments = [
    {
      id:"business", number:"01", name:"Local Business Outreach & Directory",
      summary:"Discover neighbourhood businesses, introduce the platform and keep the directory reliable.",
      roles:[
        {id:"business-research",name:"Business Research Associate",summary:"Find local businesses and collect accurate, useful profile information.",overview:"Help build a clear picture of the businesses that make S.G. Palya a vibrant local market. Identify relevant establishments and collect basic, shareable information for the BENGALOOP directory.",tasks:["Identify businesses in assigned streets and categories.","Record business names, categories, locations and publicly available contact details using the team template.","Flag missing or uncertain information so it can be checked before publication."],skills:"Curiosity about the neighbourhood, careful online research and attention to detail. A research template and guidance will be provided.",learn:"Local market mapping, structured research, accurate data collection and how a neighbourhood directory is developed."},
        {id:"business-outreach",name:"Business Outreach Associate",summary:"Introduce BENGALOOP to local businesses and explain how the platform works.",overview:"Be one of the first points of contact between BENGALOOP and local business owners. Introduce the platform, explain its purpose and invite businesses to participate in the free basic directory during the initial adoption phase.",tasks:["Visit or contact businesses using the agreed introduction.","Explain what BENGALOOP does and how a basic listing helps people discover local services.","Record responses and arrange a follow-up when an owner requests more information."],skills:"Clear communication, confidence in speaking with people, courtesy and willingness to listen. Previous sales experience is not required; this is not a sales role.",learn:"Professional communication, relationship-building, outreach etiquette and presenting an idea clearly."},
        {id:"business-onboarding",name:"Business Onboarding Associate",summary:"Guide business owners through registration and submission of their listing details.",overview:"Help interested business owners complete the process of joining BENGALOOP. Make onboarding straightforward and ensure information is complete and shared with the owner's permission.",tasks:["Explain the business registration form and the information requested.","Assist with collecting descriptions, opening hours, contact details and suitable photographs.","Check that the owner has reviewed the submitted details and understands that listings are reviewed before publication."],skills:"Patience, clear communication and an organised approach. Comfort using online forms and basic digital tools is helpful.",learn:"Business onboarding, service orientation, information handling and maintaining a smooth registration experience."},
        {id:"directory-management",name:"Directory Management Associate",summary:"Organise submitted listings and help keep public business information accurate.",overview:"Support the day-to-day quality of the BENGALOOP directory. Organise submitted information, identify incomplete or duplicate entries and coordinate checks before approved details appear on the website.",tasks:["Review listing information for missing fields, duplicate entries and inconsistent formatting.","Place businesses in the correct categories and keep internal records organised.","Coordinate corrections and updates, following the directory's review and approval process."],skills:"Attention to detail, consistency and comfort working with spreadsheets or structured forms. Training on the directory process will be provided.",learn:"Directory operations, data accuracy, quality checks and responsible handling of public business information."}
      ]
    },
    {
      id:"marketing",number:"02",name:"Marketing & Social Media",
      summary:"Build awareness, communicate the BENGALOOP story and grow an active online presence.",
      roles:[
        {id:"marketing-associate",name:"Marketing Associate",summary:"Help plan campaigns that introduce BENGALOOP to the neighbourhood.",overview:"Support the planning and delivery of marketing activities that make residents, students and businesses aware of BENGALOOP. The initial focus is platform awareness and adoption, not selling paid services.",tasks:["Suggest campaign ideas for students, residents and local businesses.","Help prepare a simple marketing calendar with clear activities and deadlines.","Review campaign responses and share practical ideas for improving future outreach."],skills:"Interest in communication, promotion, planning and understanding audiences. Creativity and reliability matter more than previous experience.",learn:"Marketing fundamentals, campaign planning, audience awareness and evaluating basic campaign results."},
        {id:"social-media",name:"Social Media Executive",summary:"Manage posting schedules, publish content and support audience engagement.",overview:"Help keep BENGALOOP's social channels active, consistent and useful. Coordinate publishing and community interaction in line with the agreed tone and content plan.",tasks:["Schedule and publish approved posts, stories and updates.","Monitor comments and messages, and route questions to the appropriate team member.","Maintain a simple content calendar and note which posts receive useful engagement."],skills:"Regular use of social platforms, good judgement, clear writing and consistency. Familiarity with Instagram, LinkedIn or Facebook is helpful.",learn:"Social media management, content scheduling, audience engagement and brand communication."},
        {id:"content-writer",name:"Content Writer",summary:"Write clear captions, website copy and announcements in the BENGALOOP voice.",overview:"Turn BENGALOOP's ideas and local information into concise, useful writing. Support social posts, website sections, business descriptions and community announcements.",tasks:["Draft captions, short articles, website text and announcements.","Edit content for clarity, accuracy, tone and readability.","Confirm facts and names before publishing, and coordinate edits with the marketing and creative teams."],skills:"Interest in writing, language and communicating information clearly. A willingness to edit and accept feedback is important.",learn:"Copywriting, editing, brand voice, audience-focused communication and fact-checking."}
      ]
    },
    {
      id:"creative",number:"03",name:"Creative & Media",
      summary:"Create the visual stories, designs, photography and videos that bring local places to life.",
      roles:[
        {id:"graphic-designer",name:"Graphic Designer",summary:"Create posters, social media graphics and other visual material.",overview:"Develop clean, consistent visuals for BENGALOOP's website, social channels and neighbourhood awareness activities. Designs should be readable, useful and aligned with the existing brand identity.",tasks:["Create posters, banners, social media posts and simple promotional layouts.","Adapt designs to the correct sizes and formats for each platform.","Work with the marketing team to turn campaign briefs into clear visual communication."],skills:"Interest in visual design, layout and typography. Experience with Canva, Figma or Adobe tools is helpful, but a portfolio of personal work is also welcome.",learn:"Graphic design principles, brand consistency, visual storytelling and working from a creative brief."},
        {id:"video-editor",name:"Video Editor",summary:"Edit short videos and reels for clear, engaging neighbourhood storytelling.",overview:"Shape raw footage into polished short-form videos that introduce BENGALOOP, highlight local places and communicate community activities.",tasks:["Trim and arrange footage into short, coherent videos.","Add captions, titles, sound and simple transitions where appropriate.","Export videos in suitable formats and coordinate revisions with the content team."],skills:"Interest in storytelling and video editing. Familiarity with CapCut, VN, Premiere Pro or similar tools is useful.",learn:"Video storytelling, editing workflow, pacing, captions and platform-ready production."},
        {id:"photo-video-creator",name:"Photo & Video Creator",summary:"Capture original photographs and footage of local businesses and activities.",overview:"Create the original visual material used in BENGALOOP's local stories and promotional content. Capture authentic images of places, products and activities with appropriate permission.",tasks:["Photograph businesses, products, streets and approved community activities.","Record short video clips for reels, introductions and campaign material.","Organise and share files with clear names, basic context and confirmation of permissions."],skills:"Interest in photography or video, a good eye for detail and respectful interaction with people. A capable smartphone is enough to begin.",learn:"Photography basics, framing, lighting, visual documentation and responsible content capture."}
      ]
    },
    {
      id:"technology",number:"04",name:"Technology & Website",
      summary:"Maintain and improve the website so local discovery stays simple and dependable.",
      roles:[
        {id:"web-developer",name:"Web Developer",summary:"Build and improve website features and resolve code-level issues.",overview:"Contribute to the development of the BENGALOOP website and its underlying functionality. This role is suited to students who want hands-on experience maintaining and improving a live web project.",tasks:["Work on assigned HTML, CSS and JavaScript updates.","Improve website features, responsiveness and integrations under the team's review process.","Test changes before they are published and document important updates."],skills:"An interest in web development and willingness to learn. Familiarity with HTML, CSS or JavaScript is useful; beginners can start with smaller guided tasks.",learn:"Practical web development, version control, debugging, responsive design and collaborative project work."},
        {id:"website-administrator",name:"Website Administrator",summary:"Keep website pages, links and published information current.",overview:"Look after the accuracy and day-to-day upkeep of website content. This role focuses on updates and checks rather than writing code.",tasks:["Update approved text, images, links and website information.","Check important pages, forms and navigation links at regular intervals.","Coordinate requested changes with the web developer and directory team."],skills:"Comfort using websites and digital tools, care with details and an organised approach. Coding experience is not required.",learn:"Website content management, digital operations, link checking and basic website quality practices."},
        {id:"website-testing",name:"Website Design & Testing Associate",summary:"Review the website's appearance, mobile experience and ease of use.",overview:"Experience BENGALOOP as a visitor and help identify places where the website could be clearer, easier to navigate or more reliable. You do not need to be a developer to contribute.",tasks:["Test key pages and actions on mobile and desktop devices.","Review readability, layout, navigation and accessibility basics.","Report bugs or confusing experiences with clear notes and screenshots."],skills:"Attention to detail, patience and interest in design or user experience. No coding background is necessary.",learn:"Website testing, user experience, usability review, accessibility awareness and writing clear bug reports."}
      ]
    },
    {
      id:"community",number:"05",name:"Community Engagement & Partnerships",
      summary:"Connect with residents, students and local organisations, and learn from the community.",
      roles:[
        {id:"community-outreach",name:"Community Outreach Associate",summary:"Introduce BENGALOOP to residents and student communities.",overview:"Help people in and around S.G. Palya understand what BENGALOOP offers and how they can use it. The focus is on awareness, participation and listening to local needs.",tasks:["Share information about BENGALOOP through suitable resident and student channels.","Speak with people at approved outreach activities and explain how to explore the platform.","Collect common questions and suggestions and pass them to the team."],skills:"Friendly communication, confidence approaching people and genuine interest in the neighbourhood. No prior outreach experience is required.",learn:"Community communication, public engagement, active listening and representing a student initiative."},
        {id:"community-relations",name:"Community Relations Associate",summary:"Maintain connections and bring community feedback back to the team.",overview:"Help BENGALOOP build trust over time by maintaining respectful communication with residents and platform users. This role focuses on feedback and relationships, not technical customer support.",tasks:["Follow up on feedback and questions received through community channels.","Identify recurring needs or concerns among residents and users.","Share suggestions with relevant departments and help close the feedback loop."],skills:"Empathy, reliability, patience and clear communication. An interest in people and local issues is valuable.",learn:"Relationship management, feedback collection, conflict-sensitive communication and community building."},
        {id:"institutional-partnerships",name:"Institutional & Partnerships Associate",summary:"Build connections with student groups, PG communities and local organisations.",overview:"Identify organisations whose communities could benefit from BENGALOOP and develop appropriate, mutually useful connections. During Phase 1, the emphasis is on introductions and collaboration rather than commercial deals.",tasks:["Identify relevant college groups, clubs, resident associations and PG communities.","Prepare introductions and coordinate meetings or conversations with the core team.","Maintain a record of contacts, discussions and agreed next steps."],skills:"Professional communication, organisation and confidence in coordinating with different groups. Previous partnership experience is not expected.",learn:"Partnership development, stakeholder communication, coordination and professional networking."}
      ]
    },
    {
      id:"operations",number:"06",name:"Human Resources & Operations",
      summary:"Welcome new members, coordinate activities and keep the team organised.",
      roles:[
        {id:"recruitment-member",name:"Recruitment & Member Coordinator",summary:"Coordinate applications, onboarding and basic member records.",overview:"Support a smooth and welcoming recruitment process as BENGALOOP grows its student team. Help applicants understand the initiative and make sure new members know where to begin.",tasks:["Coordinate member applications and communicate next steps to applicants.","Maintain an up-to-date member list with department preferences and contact details.","Help new members understand the team structure, expectations and onboarding information."],skills:"Organisation, discretion, clear communication and a friendly approach. Previous HR experience is not required.",learn:"Recruitment coordination, onboarding, people administration and handling information responsibly."},
        {id:"operations-coordinator",name:"Operations Coordinator",summary:"Track activities, deadlines and coordination across departments.",overview:"Help the team turn plans into completed work. Keep track of what each department is doing, identify pending tasks and help people stay aligned.",tasks:["Maintain a simple tracker of activities, owners and deadlines.","Coordinate meeting schedules, reminders and cross-department updates.","Follow up on pending tasks and flag blockers to the appropriate department head."],skills:"Reliability, time management, clear communication and comfort using shared documents or spreadsheets.",learn:"Project coordination, prioritisation, teamwork, meeting discipline and practical operations."},
        {id:"documentation-records",name:"Documentation & Records Associate",summary:"Maintain meeting notes, decisions and essential team documentation.",overview:"Create a reliable record of BENGALOOP's work so important information is easy to find and does not get lost between meetings or team changes.",tasks:["Prepare concise notes from meetings and record agreed actions.","Organise project files, reference documents and internal records.","Keep key decisions, progress updates and handover notes accessible to the team."],skills:"Clear writing, organisation and attention to detail. Familiarity with Google Docs or Sheets is useful.",learn:"Business documentation, record management, structured communication and continuity in team projects."}
      ]
    }
  ];

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const root = document.querySelector("#departments");
  if (!root) return;

  const cards = Array.from(root.querySelectorAll(".department-card"));
  const panel = root.querySelector("#departmentExplorer");
  const closeButton = root.querySelector("#closeDepartmentExplorer");
  const departmentNumber = root.querySelector("#explorerDepartmentNumber");
  const departmentTitle = root.querySelector("#explorerDepartmentTitle");
  const departmentSummary = root.querySelector("#explorerDepartmentSummary");
  const roleCount = root.querySelector("#explorerRoleCount");
  const roleList = root.querySelector("#departmentRoleList");
  const roleDetail = root.querySelector("#roleDetailPanel");
  if (!panel || !roleList || !roleDetail) return;

  let activeDepartmentId = "";
  let closeTimer = 0;

  const getDepartment = id => departments.find(department => department.id === id);

  function updateCards() {
    cards.forEach(card => {
      const id = card.dataset.departmentId;
      const active = id === activeDepartmentId && !panel.hidden;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-expanded", active ? "true" : "false");
    });
  }

  function closeExplorer() {
    if (panel.hidden) return;
    window.clearTimeout(closeTimer);
    panel.classList.remove("is-open");
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    activeDepartmentId = "";
    updateCards();
    closeTimer = window.setTimeout(() => {
      if (!panel.classList.contains("is-open")) panel.hidden = true;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300);
  }

  function showRoleDetail(department, role, activeButton) {
    roleList.querySelectorAll(".department-role-option").forEach(button => {
      const active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const tasks = role.tasks.map(task => "<li>" + escapeHTML(task) + "</li>").join("");
    roleDetail.classList.remove("is-entering");
    roleDetail.innerHTML = `
      <div class="role-detail-content">
        <div class="role-detail-topline"><span class="recruitment-kicker">ROLE PROFILE</span><span class="role-detail-department">${escapeHTML(department.name)}</span></div>
        <h5>${escapeHTML(role.name)}</h5>
        <p class="role-detail-overview">${escapeHTML(role.overview)}</p>
        <div class="role-detail-sections">
          <section><span>WHAT YOU'LL DO</span><ul>${tasks}</ul></section>
          <section><span>HELPFUL SKILLS &amp; INTERESTS</span><p>${escapeHTML(role.skills)}</p></section>
          <section><span>WHAT YOU'LL LEARN</span><p>${escapeHTML(role.learn)}</p></section>
        </div>
      </div>`;
    requestAnimationFrame(() => roleDetail.classList.add("is-entering"));
    // On smaller screens the detail panel sits below the role list; reveal it after selection.
    if (window.matchMedia("(max-width: 900px)").matches) {
      window.setTimeout(() => roleDetail.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      }), 80);
    }
  }

  function openDepartment(id) {
    const department = getDepartment(id);
    if (!department) return;
    window.clearTimeout(closeTimer);
    if (activeDepartmentId === id && !panel.hidden) {
      closeExplorer();
      return;
    }

    const wasHidden = panel.hidden;
    activeDepartmentId = id;
    departmentNumber.textContent = "DEPARTMENT " + department.number + " / 06";
    departmentTitle.textContent = department.name;
    departmentSummary.textContent = department.summary;
    roleCount.textContent = String(department.roles.length).padStart(2, "0") + " ROLES";
    roleList.innerHTML = department.roles.map(role => `
      <button class="department-role-option" type="button" data-role-id="${escapeHTML(role.id)}" aria-pressed="false">
        <span class="department-role-copy"><strong>${escapeHTML(role.name)}</strong><small>${escapeHTML(role.summary)}</small></span>
        <span class="department-role-arrow" aria-hidden="true">↗</span>
      </button>`).join("");
    roleDetail.classList.remove("is-entering");
    roleDetail.innerHTML = '<div class="role-detail-empty"><span class="recruitment-kicker">ROLE PROFILE</span><h5>Explore a role.</h5><p>Select any role from the list to view its responsibilities, helpful skills and what you can learn.</p></div>';
    if (wasHidden) {
      panel.hidden = false;
      panel.inert = false;
      panel.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => panel.classList.add("is-open"));
    } else {
      panel.hidden = false;
      panel.inert = false;
      panel.setAttribute("aria-hidden", "false");
      panel.classList.add("is-switching");
      if (!panel.classList.contains("is-open")) requestAnimationFrame(() => panel.classList.add("is-open"));
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("is-switching")));
    }
    updateCards();
    // Bring the expanded role list into view so the user never has to hunt for it.
    window.setTimeout(() => {
      if (!panel.hidden && activeDepartmentId === id) {
        panel.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }
    }, 110);
  }

  cards.forEach(card => card.addEventListener("click", () => openDepartment(card.dataset.departmentId || "")));

  roleList.addEventListener("click", event => {
    const button = event.target.closest("[data-role-id]");
    if (!button) return;
    const department = getDepartment(activeDepartmentId);
    const role = department?.roles.find(item => item.id === button.dataset.roleId);
    if (department && role) showRoleDetail(department, role, button);
  });

  closeButton?.addEventListener("click", closeExplorer);

})();