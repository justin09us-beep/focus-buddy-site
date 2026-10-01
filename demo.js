/* =====================================================================
   demo.js — two things on this page:
     1) the small auto-playing loop in the hero (pure decoration, no
        input, cycles on its own forever)
     2) the big interactive demo lower on the page (a real, clickable
        walk-through of the actual intervention state machine, the drift
        wait compressed from the real app's 10s down to a few seconds so
        visitors don't have to wait; the freeze runs at its real length)
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
  const stagePills = Array.from(document.querySelectorAll(".stage-pill"));
  const stageCaption = document.getElementById("demoStageCaption");

  // The drift wait is compressed from the real app's 10s; the freeze is not.
  const WATCH_MS = 2400;
  const DRIFT_MS = 2800;
  const SETTLE_MS = 2200;

  // Mirrors the real app's daily escalation (daily-escalation.js +
  // main.js's record-escalation: freezeMs = (count - 1) * 5000). The
  // first escalation each calendar day is free; every one after that
  // freezes the mouse 5s longer than the last.
  const STAGES = {
    1: { freezeSec: 0, caption: "Every day starts with one free pass: your first drift goes straight to the card. Try it, then compare it to the 2nd or 3rd." },
    2: { freezeSec: 5, caption: "Your 2nd drift of the day: the mouse freezes for 5 seconds before the card appears. Keyboard and Stop still work." },
    3: { freezeSec: 10, caption: "Every drift after that adds another 5 seconds. The count resets at midnight." },
  };
  let selectedStage = "1";

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
    stagePills.forEach((p) => (p.disabled = false));
  }

  async function run(goal, token, stage) {
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

      // Still drifted. Today's count decides whether a freeze comes first.
      const freezeSec = STAGES[stage].freezeSec;
      if (freezeSec > 0) {
        setStage("frozen");
        hint.textContent = "Drift #" + stage + " today, so the mouse freezes first. Try clicking: nothing goes through. Keyboard and Stop still work.";
        for (let left = freezeSec; left > 0; left -= 1) {
          cardLine.textContent = `Frozen — back in ${left}s`;
          await wait(1000, token);
        }
      }

      // The full intervention.
      setStage("escalated");
      cardLine.textContent = `You said you were working on "${goal}." This looks like YouTube.`;
      hint.textContent = freezeSec > 0
        ? "Now the card: video paused, sound muted, the exact distraction named. Two honest ways out below."
        : "Free pass, so no freeze. Straight to the card: video paused, sound muted, the exact distraction named.";
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
    hint.textContent = 'Back to idle. Pick another drift above and click "Start focus session" to compare.';
    unlockControls();
    try {
      await wait(SETTLE_MS, token);
      setStage("idle");
      showBubble("");
    } catch (e) {
      // Cancelled by a restart — fine, the new run has already taken over.
    }
  }

  function selectStage(stage) {
    selectedStage = stage;
    stagePills.forEach((p) => p.classList.toggle("is-active", p.dataset.stage === stage));
    stageCaption.textContent = STAGES[stage].caption;
  }
  stagePills.forEach((pill) => {
    pill.addEventListener("click", () => selectStage(pill.dataset.stage));
  });

  startBtn.addEventListener("click", () => {
    const goal = goalInput.value.trim() || "finishing my essay";
    runToken += 1;
    const token = runToken;
    startBtn.disabled = true;
    goalInput.disabled = true;
    restartBtn.disabled = false;
    stagePills.forEach((p) => (p.disabled = true));
    run(goal, token, selectedStage);
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
