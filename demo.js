/* =====================================================================
   demo.js — three things on this page (the third, the download
   picker, is at the bottom):
     1) the small auto-playing loop in the hero (pure decoration, no
        input, cycles on its own forever)
     2) the big interactive demo lower on the page (a real, clickable
        walk-through of the actual intervention state machine, the drift
        wait compressed from the real app's 10s down to a few seconds so
        visitors don't have to wait)
   Neither of these touches a real screen or a real window — this is a
   self-contained simulation for the page, not the actual watcher.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1) Mini hero preview — loops forever, no interaction.
   --------------------------------------------------------------------- */
(function heroPreview() {
  const frame = document.getElementById("previewFrame");
  const caption = document.getElementById("previewCaption");
  const stages = [
    { stage: "calm", caption: "watching, quietly", hold: 2200 },
    { stage: "warning", caption: "drifting…", hold: 1800 },
    { stage: "takeover", caption: "one honest intervention", hold: 2600 },
    { stage: "praise", caption: "back on track", hold: 1800 },
  ];
  let i = 0;
  function tick() {
    const s = stages[i];
    frame.dataset.stage = s.stage;
    caption.textContent = s.caption;
    i = (i + 1) % stages.length;
    setTimeout(tick, s.hold);
  }
  tick();
})();

/* ---------------------------------------------------------------------
   2) The big interactive demo.
   --------------------------------------------------------------------- */
(function interactiveDemo() {
  const goalInput = document.getElementById("goalInput");
  const startBtn = document.getElementById("startDemoBtn");
  const restartBtn = document.getElementById("restartDemoBtn");
  const screen = document.getElementById("demoScreen");
  const status = document.getElementById("demoStatus");
  const url = document.getElementById("demoUrl");
  const bubble = document.getElementById("demoBubble");
  const cardLine = document.getElementById("demoCardLine");
  const cardActions = document.getElementById("demoCardActions");
  const cardReason = document.getElementById("demoCardReason");
  const reasonInput = document.getElementById("demoReasonInput");
  const reasonConfirmBtn = document.getElementById("demoReasonConfirmBtn");
  const reasonCancelBtn = document.getElementById("demoReasonCancelBtn");
  const backBtn = document.getElementById("demoBackBtn");
  const graceBtn = document.getElementById("demoGraceBtn");
  const hint = document.getElementById("demoHint");

  // Timing, compressed from the real app's 10s drift window.
  const WATCH_MS = 2400;
  const DRIFT_MS = 2800;
  const SETTLE_MS = 2200;

  let runToken = 0; // bumped on every (re)start so stale timers no-op

  function showBubble(text) {
    if (!text) { bubble.classList.remove("show"); return; }
    bubble.textContent = text;
    bubble.classList.add("show");
  }

  function setStage(stage) {
    screen.dataset.stage = stage;
  }

  function wait(ms, token) {
    return new Promise((resolve, reject) => {
      setTimeout(() => (token === runToken ? resolve() : reject(new Error("stale"))), ms);
    });
  }

  function showActions() {
    cardReason.hidden = true;
    cardActions.hidden = false;
  }

  function unlockControls() {
    startBtn.disabled = false;
    goalInput.disabled = false;
  }

  async function run(goal, token) {
    try {
      // Watching, quietly.
      setStage("watching");
      showActions();
      url.textContent = "your-screen";
      status.textContent = `Watching your screen for: "${goal}"`;
      showBubble("");
      hint.textContent = "Watching, quietly. It stays small in the corner while you're on track.";
      await wait(WATCH_MS, token);

      // Drift onto a distraction.
      url.textContent = "youtube.com/watch?v=…";
      status.textContent = "";
      setStage("drifting");
      hint.textContent = "Drifted off goal. The edges darken as a quiet early warning. Still silent.";
      await wait(DRIFT_MS, token);

      // Still drifted — the full intervention.
      setStage("escalated");
      cardLine.textContent = `You said you were working on "${goal}." This looks like YouTube.`;
      hint.textContent = "Screen darkens, video pauses, sound mutes, and it names the exact distraction. Two honest ways out below.";
    } catch (e) {
      // A restart cancelled this run — nothing to clean up, the new
      // run already owns the screen.
    }
  }

  async function settle(message, token) {
    setStage("praise");
    showActions();
    url.textContent = "your-screen";
    showBubble(message);
    hint.textContent = 'Back to idle. Click "Start focus session" to run it again.';
    unlockControls();
    try {
      await wait(SETTLE_MS, token);
      setStage("idle");
      showBubble("");
    } catch (e) {
      // Cancelled by a restart — fine, the new run has already taken over.
    }
  }

  startBtn.addEventListener("click", () => {
    const goal = goalInput.value.trim() || "finishing my essay";
    runToken += 1;
    const token = runToken;
    startBtn.disabled = true;
    goalInput.disabled = true;
    restartBtn.disabled = false;
    run(goal, token);
  });

  restartBtn.addEventListener("click", () => {
    runToken += 1; // cancels any in-flight run
    setStage("idle");
    showActions();
    showBubble("");
    status.textContent = "";
    url.textContent = "your-screen";
    unlockControls();
    hint.textContent = 'Type a goal (or leave the default) and click "Start focus session" to begin.';
  });

  backBtn.addEventListener("click", () => {
    settle("Nice — back on track.", runToken);
  });

  // "Yeah, I need this" doesn't confirm anything by itself: staying
  // takes a typed reason, same as the real app.
  graceBtn.addEventListener("click", () => {
    cardActions.hidden = true;
    cardReason.hidden = false;
    reasonInput.value = "";
    reasonConfirmBtn.disabled = true;
    reasonInput.focus();
    hint.textContent = "Staying takes a real reason. Confirm stays disabled until you type one.";
  });

  reasonInput.addEventListener("input", () => {
    reasonConfirmBtn.disabled = reasonInput.value.trim().length === 0;
  });
  reasonInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !reasonConfirmBtn.disabled) reasonConfirmBtn.click();
  });

  reasonCancelBtn.addEventListener("click", () => {
    showActions();
    hint.textContent = "Screen darkens, video pauses, sound mutes, and it names the exact distraction. Two honest ways out below.";
  });

  reasonConfirmBtn.addEventListener("click", () => {
    if (reasonInput.value.trim().length === 0) return;
    settle("Okay — taking a breather. I'll check back in.", runToken);
  });
})();

/* ---------------------------------------------------------------------
   3) Download picker — puts the visitor's own OS first as the solid
      button. Phones, Linux and unknown platforms keep both as-is.
      If a build hasn't been uploaded yet (the file 404s on the live
      site), its button turns into "coming soon" instead of a dead link.
   --------------------------------------------------------------------- */
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

  // Only a real 404 means "not uploaded yet". Opened from disk (file://),
  // fetch can't check, so the buttons are left alone.
  if (location.protocol === "file:") return;
  let missing = 0;
  Object.values(buttons).forEach((btn) => {
    fetch(btn.getAttribute("href"), { method: "HEAD" })
      .then((res) => {
        if (res.status !== 404) return;
        missing += 1;
        if (missing === 2 && os !== "mobile") note.textContent = "The first beta builds are on their way. Check back soon.";
        btn.classList.add("is-soon");
        btn.removeAttribute("href");
        btn.setAttribute("aria-disabled", "true");
        btn.firstChild.textContent = btn.dataset.os === "mac" ? "Mac version coming soon" : "Windows version coming soon";
      })
      .catch(() => {});
  });
})();
