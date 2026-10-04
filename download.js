/* =====================================================================
   download.js — the download buttons on download.html (the page the
   sign-up email links to). Puts the visitor's own OS first as the solid
      button. Phones, Linux and unknown platforms keep both as-is.
      Each button downloads its installer from this repo's latest GitHub
      Release; an OS with no installer there shows "coming soon".
   ===================================================================== */
(function downloadPicker() {
  const row = document.getElementById("downloadRow");
  const note = document.getElementById("downloadNote");
  if (!row) return;
  const buttons = {
    mac: row.querySelector('[data-os="mac"]'),
    windows: row.querySelector('[data-os="windows"]'),
  };

  function detectOS() {
    const uaPlatform = (navigator.userAgentData && navigator.userAgentData.platform) || "";
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    if (/android|iphone|ipad|ipod/i.test(ua) || (navigator.userAgentData && navigator.userAgentData.mobile)) return "mobile";
    // iPadOS reports itself as a Mac; touch support gives it away.
    if (/mac/i.test(uaPlatform + platform + ua) && navigator.maxTouchPoints > 1) return "mobile";
    if (/mac/i.test(uaPlatform + platform + ua)) return "mac";
    if (/win/i.test(uaPlatform + platform + ua)) return "windows";
    return "other";
  }

  const os = detectOS();
  if (os === "mac" || os === "windows") {
    const mine = buttons[os];
    const other = buttons[os === "mac" ? "windows" : "mac"];
    mine.classList.replace("btn-ghost", "btn-primary");
    other.classList.replace("btn-primary", "btn-ghost");
    row.prepend(mine);
    note.textContent = os === "mac"
      ? "Looks like you're on a Mac. Need the Windows version? It's right there too."
      : "Looks like you're on Windows. Need the Mac version? It's right there too.";
  } else if (os === "mobile") {
    note.textContent = "Focus Buddy is a desktop app. Open this page on your Mac or Windows PC to install it.";
  }

  // Point each button at its installer in this repo's latest GitHub
  // Release: the first .dmg for Mac, the first .exe for Windows (never a
  // .blockmap). A release with no installer for an OS, or no release at
  // all, shows "coming soon" for it. If the API can't be reached (offline,
  // rate-limited), the buttons keep linking to the latest release page.
  const LATEST_RELEASE_API = "https://api.github.com/repos/justin09us-beep/focus-buddy-site/releases/latest";
  const PATTERNS = { mac: /\.dmg$/i, windows: /\.exe$/i };

  function markSoon(btn) {
    btn.classList.add("is-soon");
    btn.removeAttribute("href");
    btn.setAttribute("aria-disabled", "true");
    btn.firstChild.textContent = btn.dataset.os === "mac" ? "Mac version coming soon" : "Windows version coming soon";
  }

  fetch(LATEST_RELEASE_API, { headers: { Accept: "application/vnd.github+json" } })
    .then((res) => {
      if (res.status === 404) return { assets: [] }; // no release published yet
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json();
    })
    .then((release) => {
      const assets = release.assets || [];
      let missing = 0;
      Object.entries(buttons).forEach(([key, btn]) => {
        const asset = assets.find((a) => PATTERNS[key].test(a.name));
        if (asset) {
          btn.href = asset.browser_download_url;
        } else {
          markSoon(btn);
          missing += 1;
        }
      });
      if (missing === 2 && os !== "mobile") note.textContent = "The first beta builds are on their way. Check back soon.";
    })
    .catch(() => {});
})();
