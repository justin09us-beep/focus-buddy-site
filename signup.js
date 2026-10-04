/* =====================================================================
   signup.js — the "Get the beta" email form.
   The form posts straight to Kit (see its action URL in index.html),
   which stores the address and sends the download email. It's submitted
   into a hidden iframe so the visitor stays on this page; Kit's reply
   isn't readable from here (it's another site), so a finished load of
   that iframe is taken as "sent".
   ===================================================================== */

(function signupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  const input = document.getElementById("signupEmail");
  const button = document.getElementById("signupBtn");
  const status = document.getElementById("signupStatus");
  const sink = document.querySelector('iframe[name="signupSink"]');

  // Same shape browsers use for type="email": something@something.tld
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const SENT_FALLBACK_MS = 6000; // if the iframe never reports back

  function show(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  form.addEventListener("submit", (event) => {
    const email = input.value.trim();
    if (!EMAIL.test(email)) {
      event.preventDefault();
      show("Please enter a valid email address.", "error");
      input.focus();
      return;
    }
    // Not connected to a Kit form yet — don't pretend it worked.
    if (form.action.includes("KIT_FORM_ID")) {
      event.preventDefault();
      show("Sign-ups aren't open quite yet. Please check back soon.", "error");
      return;
    }

    input.value = email;
    button.disabled = true;
    show("Sending…");

    let done = false;
    function sent() {
      if (done) return;
      done = true;
      form.hidden = true;
      show(`Almost there: check ${email} and confirm your address. Your download link arrives right after.`, "ok");
    }
    sink.addEventListener("load", sent, { once: true });
    setTimeout(sent, SENT_FALLBACK_MS);
    // No preventDefault: the browser posts the form into the iframe.
  });

  input.addEventListener("input", () => {
    if (status.dataset.kind === "error") show("");
  });
})();
