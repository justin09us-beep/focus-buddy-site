/* =====================================================================
   demo.js — two things on this page:
     1) the small auto-playing loop in the hero (pure decoration, no
        input, cycles on its own forever)
     2) the big interactive demo lower on the page (a real, clickable
        walk-through of the actual intervention state machine, timing
        compressed from the real app's 20s drift window down to a few
        seconds so visitors don't have to wait)
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
  const card = document.getElementById("demoCard");
  const cardLine = document.getElementById("demoCardLine");
  const backBtn = document.getElementById("demoBackBtn");
  const graceBtn = document.getElementById("demoGraceBtn");
  const hint = document.getElementById("demoHint");
  const stagePills = Array.from(document.querySelectorAll(".stage-pill"));
  const stageCaption = document.getElementById("demoStageCaption");

  // Timing, compressed from the real app's ~20s (or, ramped, ~40s) drift window.
  const WATCH_MS = 2400;
  const DRIFT_MS = 2800;
  const SETTLE_MS = 2200;
  const SILENT_HOLD_MS = 3200; // how long we sit on "nothing happened" for session 1

  // Mirrors the real app's trust ramp (main.js: QUIET_SESSIONS=3,
  // RAMP_SESSIONS=7) — three presets a visitor can compare directly.
  const STAGES = {
    new: {
      caption: "New installs get 3 fully silent sessions before the buddy ever speaks up — try one, then compare it to session 15+.",
    },
    ramped: {
      caption: "Sessions 4–10 still get 2x as long (about 40s for real) before escalating — still finding its footing.",
    },
    full: {
      caption: "From session 11 on, this is it for good: the normal ~20s fuse, every time.",
    },
  };
  let selectedStage = "new";

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

  async function run(goal, token, stage) {
    try {
      // Watching, quietly — identical for all three stages. The
      // difference only shows up once you actually drift.
      setStage("watching");
      url.textContent = "your-screen";
      status.textContent = `Watching your screen for: "${goal}"`;
      showBubble("");
      hint.textContent = "Watching, quietly — stays small in the corner while you're on track.";
      await wait(WATCH_MS, token);

      // Drift onto a distraction.
      url.textContent = "youtube.com/watch?v=…";
      status.textContent = "";

      if (stage === "new") {
        // The trust ramp's whole point: a brand-new session says and
        // shows NOTHING here, even though it saw the exact same drift.
        setStage("watching");
        hint.textContent = 'Drifted onto YouTube — and session #1 says nothing at all. No warning, no card. Just watching.';
        await wait(SILENT_HOLD_MS, token);
        await settle('(Silence was the whole point.)', token, { silent: true });
        return;
      }

      // Ramped and full-intensity both show the same real visuals — the
      // ramp's only difference is HOW LONG this stage lasts for real
      // (about 40s vs. 20s), which we can't show directly at demo speed,
      // so the hint says it instead.
      setStage("drifting");
      hint.textContent = stage === "ramped"
        ? "Drifted off goal — still silent, but for real this stage lasts twice as long (about 40s) while it's still earning trust."
        : "Drifted off goal — the edges darken as a quiet early warning. Still silent.";
      await wait(DRIFT_MS, token);

      // Still drifted — the full intervention.
      setStage("escalated");
      cardLine.textContent = `You said you were working on "${goal}." This looks like YouTube.`;
      hint.textContent = "Screen darkens, video pauses, sound mutes — and it names the exact distraction. Two honest ways out below.";
    } catch (e) {
      // A restart cancelled this run — nothing to clean up, the new
      // run already owns the screen.
    }
  }

  async function settle(message, token, opts) {
    const options = opts || {};
    setStage(options.silent ? "watching" : "praise");
    url.textContent = "your-screen";
    showBubble(message);
    if (options.silent) {
      hint.textContent = 'That\'s the trust ramp — click "Restart demo" and try session 15+ to see the difference.';
    } else {
      hint.textContent = "Back to idle — click \"Restart demo\" to run it again.";
    }
    startBtn.disabled = false;
    goalInput.disabled = false;
    stagePills.forEach((p) => (p.disabled = false));
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
    showBubble("");
    status.textContent = "";
    url.textContent = "your-screen";
    startBtn.disabled = false;
    goalInput.disabled = false;
    stagePills.forEach((p) => (p.disabled = false));
    hint.textContent = 'Type a goal (or leave the default) and click "Start focus session" to begin.';
  });

  backBtn.addEventListener("click", () => {
    const token = runToken;
    startBtn.disabled = false;
    goalInput.disabled = false;
    settle("Nice — back on track.", token);
  });

  graceBtn.addEventListener("click", () => {
    const token = runToken;
    startBtn.disabled = false;
    goalInput.disabled = false;
    settle("Got it — I'll stay quiet for a while.", token);
  });
})();
