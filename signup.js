/* =====================================================================
   signup.js — the "Get the beta" email form.
   Sends the address to Kit (the form's action URL in index.html), which
   stores it and emails the download link. Kit allows cross-site requests
   and answers in JSON — { status: "failed", errors: { messages: [...] } }
   on a problem — so the visitor sees Kit's real result, not a guess.
   ===================================================================== */

(function signupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  const input = document.getElementById("signupEmail");
  const button = document.getElementById("signupBtn");
  const status = document.getElementById("signupStatus");

  // Same shape browsers use for type="email": something@something.tld
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function show(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!EMAIL.test(email)) {
      show("Please enter a valid email address.", "error");
      input.focus();
      return;
    }

    button.disabled = true;
    show("Sending…");
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams({ email_address: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === "failed") {
        const messages = (data.errors && data.errors.messages) || [];
        throw new Error(messages[0] || `Kit ${res.status}`);
      }
      form.hidden = true;
      show(`Almost there: check ${email} and confirm your address. Your download link arrives right after.`, "ok");
    } catch (error) {
      const known = /email address is invalid/i.test(error.message);
      show(known
        ? "That email address doesn't look right. Please check it."
        : "Something went wrong sending that. Please try again in a moment.", "error");
      button.disabled = false;
    }
  });

  input.addEventListener("input", () => {
    if (status.dataset.kind === "error") show("");
  });
})();
