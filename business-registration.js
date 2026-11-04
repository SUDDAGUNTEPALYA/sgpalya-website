/* BENGALOOP business registration — preview only.
   This page does not send, store, or publish the entered information.
   A secure server-side Excel connection must be configured before launch. */
(() => {
  "use strict";
  const form = document.querySelector("#businessRegistrationForm");
  const status = document.querySelector("#registrationFormStatus");
  if (!form || !status) return;

  form.addEventListener("submit", event => {
    event.preventDefault();
    status.textContent = "Preview only: registration submissions are not active. No information has been sent or saved. Please do not enter real business or personal details yet.";
    status.setAttribute("data-state", "preview");
  });

  form.addEventListener("input", () => {
    if (status.dataset.state === "preview") {
      status.textContent = "This is a preview form. Your entries remain in this page only and are not sent or saved.";
    }
  });
})();