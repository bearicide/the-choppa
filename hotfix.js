(() => {
  const trackedSources = new Set();
  let installed = false;

  function installAudioTracker(){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC || AC.prototype.__choppaPreTracked) return;
    AC.prototype.__choppaPreTracked = true;
    const originalCreateBufferSource = AC.prototype.createBufferSource;
    AC.prototype.createBufferSource = function(){
      const src = originalCreateBufferSource.apply(this, arguments);
      const originalStart = src.start;
      const originalStop = src.stop;
      let stopped = false;
      src.start = function(){
        stopped = false;
        trackedSources.add(src);
        try{ src.addEventListener("ended", () => trackedSources.delete(src), {once:true}); }catch(e){}
        return originalStart.apply(src, arguments);
      };
      src.stop = function(){
        if(stopped) return;
        stopped = true;
        trackedSources.delete(src);
        return originalStop.apply(src, arguments);
      };
      return src;
    };
  }

  function stopTrackedAudio(){
    [...trackedSources].forEach((src) => { try{ src.stop(0); }catch(e){} });
    trackedSources.clear();
  }

  function isLoopPad(pad){
    if(!pad) return false;
    const mode = (pad.dataset.mode || "").toLowerCase();
    return mode === "loop" || pad.textContent.toLowerCase().includes("loop");
  }

  function resetLightVars(){
    document.documentElement.style.setProperty("--choppaEnergy", "0");
    document.documentElement.style.setProperty("--choppaGlow", "20px");
    document.documentElement.style.setProperty("--choppaBright", "1");
    const fill = document.getElementById("meterFill");
    if(fill) fill.style.width = "0%";
  }

  function followMeter(){
    const fill = document.getElementById("meterFill");
    const raw = fill ? parseFloat(fill.style.width || "0") : 0;
    const energy = Math.max(0, Math.min(1, raw / 100));
    document.documentElement.style.setProperty("--choppaEnergy", energy.toFixed(3));
    document.documentElement.style.setProperty("--choppaGlow", Math.round(20 + energy * 58) + "px");
    document.documentElement.style.setProperty("--choppaBright", (1 + energy * .55).toFixed(3));
  }

  function installEventSeatbelts(){
    if(installed) return;
    installed = true;
    document.addEventListener("pointerdown", (e) => {
      const pad = e.target && e.target.closest ? e.target.closest(".pad[data-pad]") : null;
      const chopMode = !window.choppaGrooveMode || window.choppaGrooveMode() === "chop";
      if(isLoopPad(pad) && chopMode) stopTrackedAudio();
    }, true);
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("#panicBtn") : null;
      if(btn){ stopTrackedAudio(); resetLightVars(); }
    }, true);
    setInterval(followMeter, 40);
  }

  window.__choppaStopTrackedAudio = stopTrackedAudio;
  window.__choppaResetLightVars = resetLightVars;
  installAudioTracker();
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", installEventSeatbelts);
  else installEventSeatbelts();
})();