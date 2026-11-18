(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const menu=$("#menu"),nav=$("#nav"),backdrop=$("#navBackdrop"),closeButton=$("#navClose"),reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;let closeTimer=0;
if(menu&&nav){
 const finish=()=>{if(menu.getAttribute("aria-expanded")==="true"||nav.classList.contains("open"))return;nav.inert=true;nav.setAttribute("aria-hidden","true");if(backdrop)backdrop.hidden=true};
 const close=({restoreFocus=false}={})=>{clearTimeout(closeTimer);const was=nav.classList.contains("open");nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Open navigation");document.body.classList.remove("nav-open");if(was)closeTimer=setTimeout(finish,reduced?0:390);else finish();if(restoreFocus)menu.focus()};
 const open=()=>{clearTimeout(closeTimer);nav.inert=false;nav.setAttribute("aria-hidden","false");if(backdrop)backdrop.hidden=false;requestAnimationFrame(()=>nav.classList.add("open"));menu.setAttribute("aria-expanded","true");menu.setAttribute("aria-label","Close navigation");document.body.classList.add("nav-open");closeButton?.focus()};
 nav.inert=true;nav.setAttribute("aria-hidden","true");menu.addEventListener("click",()=>menu.getAttribute("aria-expanded")==="true"?close():open());closeButton?.addEventListener("click",()=>close({restoreFocus:true}));backdrop?.addEventListener("click",()=>close({restoreFocus:true}));
 $$("a[href]",nav).forEach(a=>a.addEventListener("click",()=>close()));nav.addEventListener("keydown",e=>{if(e.key!=="Tab"||!nav.classList.contains("open"))return;const f=$$('a[href],button:not([disabled])',nav).filter(x=>x.offsetParent!==null);if(!f.length)return;if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open"))close({restoreFocus:true})});nav.addEventListener("transitionend",e=>{if(e.target===nav&&e.propertyName==="transform")finish()});
}
const year=$("#year");if(year)year.textContent=String(new Date().getFullYear());
const form=$("#businessEnquiryForm"),status=$("#businessEnquiryStatus");if(form&&status){const endpoint=String(form.dataset.formEndpoint||"").trim();form.addEventListener("submit",async e=>{e.preventDefault();status.dataset.state="";if(!form.reportValidity()){status.textContent="Please complete the required fields and review your consent.";status.dataset.state="error";return}if(!endpoint){status.textContent="Business enquiries are not being collected yet. Your details have not been sent or stored. Please do not enter real business information until the live enquiry notice is published.";status.dataset.state="error";return}let destination;try{destination=new URL(endpoint,window.location.href)}catch{status.textContent="The submission destination is not configured correctly.";status.dataset.state="error";return}if(destination.protocol!=="https:"){status.textContent="The submission destination must use a secure HTTPS connection.";status.dataset.state="error";return}const btn=form.querySelector('button[type="submit"]');if(btn)btn.disabled=true;try{const fd=new FormData(form),payload=Object.fromEntries(fd.entries());payload.services=fd.getAll("services");const r=await fetch(destination.href,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload),credentials:"omit"});if(!r.ok)throw Error("Submission failed");form.reset();status.textContent="Thank you. Your business enquiry has been submitted to BENGALOOP.";status.dataset.state="success"}catch{status.textContent="We could not submit your enquiry just now. Please try again later.";status.dataset.state="error"}finally{if(btn)btn.disabled=false}})}
const studentForm=$("#studentApplicationForm"),studentStatus=$("#studentApplicationStatus");
if(studentForm&&studentStatus){
 studentForm.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!studentForm.reportValidity()){studentStatus.textContent="Please complete the required fields.";studentStatus.dataset.state="error";return}
  const endpoint=String(studentForm.dataset.formEndpoint||"").trim();
  if(!endpoint){studentStatus.textContent="Applications are not being collected yet. Your details have not been sent or stored. Please wait for a formal BENGALOOP recruitment notice.";studentStatus.dataset.state="error";return}
  const consent=studentForm.querySelector('[name="consent"]');
  if(studentForm.dataset.requiresConsent==="true"&&(!consent||!consent.checked)){studentStatus.textContent="Applications cannot open until a privacy notice and explicit consent control are provided.";studentStatus.dataset.state="error";return}
  let destination;
  try{destination=new URL(endpoint,window.location.href)}catch{studentStatus.textContent="The application destination is not configured correctly.";studentStatus.dataset.state="error";return}
  if(destination.protocol!=="https:"){studentStatus.textContent="The application destination must use a secure HTTPS connection.";studentStatus.dataset.state="error";return}
  const button=studentForm.querySelector('button[type="submit"]');if(button)button.disabled=true;
  try{
   const payload=Object.fromEntries(new FormData(studentForm).entries());
   const response=await fetch(destination.href,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload),credentials:"omit"});
   if(!response.ok)throw Error("Submission failed");
   studentForm.reset();studentStatus.textContent="Thank you. Your student application has been submitted to BENGALOOP.";studentStatus.dataset.state="success"
  }catch{studentStatus.textContent="We could not submit your application just now. Please try again later.";studentStatus.dataset.state="error"}
  finally{if(button)button.disabled=false}
 })
}
})();