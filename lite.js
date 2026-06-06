(() => {
  const STYLE_ID = "choppa-lite-style";
  const STEP_MS = 125;
  let playhead = 0;
  let running = false;
  let timer = null;

  function $(sel, root = document){ return root.querySelector(sel); }
  function $all(sel, root = document){ return [...root.querySelectorAll(sel)]; }

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pad{transition:transform .08s ease, filter .12s ease, box-shadow .12s ease, background .12s ease;}
      .pad.choppa-playhead{outline:3px solid rgba(81,234,255,.95);outline-offset:2px;box-shadow:0 0 22px rgba(81,234,255,.62), inset 0 0 18px rgba(81,234,255,.22)!important;}
      .pad.choppa-next{outline:2px solid rgba(255,228,94,.92);outline-offset:-3px;filter:saturate(1.25) brightness(1.14);}
      .pad.choppa-hit{animation:choppaHit .18s ease-out;}
      .pad.active{animation:choppaLoopPulse .72s ease-in-out infinite alternate;}
      @keyframes choppaHit{0%{transform:scale(.96);filter:brightness(1.7)}100%{transform:scale(1);filter:brightness(1)}}
      @keyframes choppaLoopPulse{0%{box-shadow:0 0 20px rgba(109,255,122,.35), inset 0 0 8px rgba(255,255,255,.22)}100%{box-shadow:0 0 38px rgba(109,255,122,.72),0 0 18px rgba(81,234,255,.32), inset 0 0 16px rgba(255,255,255,.32)}}
      .choppa-lite-pill{display:inline-flex;align-items:center;gap:6px;margin-left:6px;padding:4px 8px;border:1px solid rgba(81,234,255,.34);border-radius:999px;background:rgba(81,234,255,.08);color:#dffaff;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;vertical-align:middle;}
      .choppa-lite-dot{width:7px;height:7px;border-radius:99px;background:#51eaff;box-shadow:0 0 10px #51eaff;}
    `;
    document.head.appendChild(style);
  }

  function pads(){ return $all(".pad[data-pad]").sort((a,b) => Number(a.dataset.pad) - Number(b.dataset.pad)); }
  function hasActivePads(){ return pads().some((p) => p.classList.contains("active")); }

  function clearTransient(){
    pads().forEach((p) => p.classList.remove("choppa-playhead", "choppa-next"));
  }

  function paint(){
    const list = pads();
    if(!list.length) return;
    clearTransient();
    const current = playhead % list.length;
    const next = (current + 1) % list.length;
    if(list[current]) list[current].classList.add("choppa-playhead");
    if(list[next]) list[next].classList.add("choppa-next");
  }

  function start(){
    running = true;
    if(timer) return;
    timer = setInterval(() => {
      if(running || hasActivePads()){
        paint();
        playhead += 1;
      }
    }, STEP_MS);
  }

  function stop(){
    running = false;
    playhead = 0;
    clearTransient();
  }

  function bumpPad(pad){
    pad.classList.remove("choppa-hit");
    void pad.offsetWidth;
    pad.classList.add("choppa-hit");
    setTimeout(() => pad.classList.remove("choppa-hit"), 220);
  }

  function bindPadLights(){
    const box = $("#pads");
    if(!box || box.dataset.liteBound) return;
    box.dataset.liteBound = "1";
    box.addEventListener("pointerdown", (e) => {
      const pad = e.target.closest(".pad[data-pad]");
      if(!pad) return;
      start();
      playhead = Number(pad.dataset.pad) || playhead;
      bumpPad(pad);
      paint();
    }, true);
  }

  function bindTransportButtons(){
    const startBtn = $("#startBtn"), demoBtn = $("#demoBtn"), panicBtn = $("#panicBtn"), midiBtn = $("#midiBtn");
    if(startBtn && !startBtn.dataset.liteBound){ startBtn.dataset.liteBound = "1"; startBtn.addEventListener("click", start); }
    if(demoBtn && !demoBtn.dataset.liteBound){ demoBtn.dataset.liteBound = "1"; demoBtn.addEventListener("click", start); }
    if(midiBtn && !midiBtn.dataset.liteBound){ midiBtn.dataset.liteBound = "1"; midiBtn.addEventListener("click", start); }
    if(panicBtn && !panicBtn.dataset.liteBound){ panicBtn.dataset.liteBound = "1"; panicBtn.addEventListener("click", stop); }
  }

  function addBadge(){
    const h = $(".card h2");
    if(!h || $(".choppa-lite-pill", h)) return;
    const pill = document.createElement("span");
    pill.className = "choppa-lite-pill";
    pill.innerHTML = `<i class="choppa-lite-dot"></i> lights`;
    h.appendChild(pill);
  }

  function boot(){
    injectStyle();
    bindPadLights();
    bindTransportButtons();
    addBadge();
    paint();
  }

  const mo = new MutationObserver(boot);
  window.addEventListener("DOMContentLoaded", () => { boot(); mo.observe(document.body, {childList:true, subtree:true}); });
  window.addEventListener("beforeunload", () => { if(timer) clearInterval(timer); });
})();