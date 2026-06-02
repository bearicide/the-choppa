(() => {
  const $ = (id) => document.getElementById(id);
  const STEP_COUNT = 16;
  const padNotes = [40,41,42,43,48,49,50,51,36,37,38,39,44,45,46,47];
  const noteNames = ["E2","F2","F#2","G2","C3","C#3","D3","D#3","C2","C#2","D2","D#2","G#2","A2","A#2","B2"];
  const qwerty = ["1","2","3","4","5","6","7","8","q","w","e","r","t","y","u","i"];
  const keys = [60,62,64,65,67,69,71,72,74,76];
  const keyLetters = ["Z","X","C","V","B","N","M",",",".","/"];
  const knobTargets = ["fxCutoff","fxRes","fxDelayMix","fxDelayTime","fxReverb","fxCrush","fxPitch","fxGate"];
  const fixedCCMap = {1:"fxGate",21:"fxCutoff",22:"fxRes",23:"fxDelayMix",24:"fxDelayTime",25:"fxReverb",26:"fxCrush",27:"fxPitch",28:"fxGate",71:"fxCutoff",72:"fxRes",73:"fxDelayMix",74:"fxDelayTime",75:"fxReverb",76:"fxCrush",77:"fxPitch",78:"fxGate"};
  const timingOptions = [
    {label:"1/16", steps:1},
    {label:"1/8", steps:2},
    {label:"1/4", steps:4},
    {label:"1/2", steps:8},
    {label:"1 BAR", steps:16},
    {label:"2 BAR", steps:32}
  ];
  const padModes = Array(STEP_COUNT).fill("loop");
  const padTimings = Array(STEP_COUNT).fill(4);

  let ctx, master, filter, analyser, fx, buffer, gateTimer;
  let slices = [], active = [], fileName = "none", ready = false;
  let autoCCMap = {}, autoCCNext = 0, autoPadMap = {}, autoPadNext = 0;
  let loopPads = new Map(), loopScheduler = null, nextLoopTime = 0, nextLoopStep = 0, transportStart = 0;
  let gateSources = new Map();

  function status(msg){ const el = $("status"); if(el) el.textContent = msg; }
  function midiMon(msg){ const el = $("midiMon"); if(el) el.textContent = msg; }
  function nice(id){ return id.replace("fx","").replace("DelayMix","Delay").replace("DelayTime","Time"); }
  function timingLabel(steps){ const o = timingOptions.find((x) => x.steps === Number(steps)); return o ? o.label : String(steps); }
  function baseStepLength(){ return buffer ? Math.max(.06, buffer.duration / STEP_COUNT) : .25; }
  function stepAt(time){ const len = baseStepLength(); const n = Math.floor((time - transportStart + 0.0001) / len); return ((n % STEP_COUNT) + STEP_COUNT) % STEP_COUNT; }
  function nextGridTime(){ const len = baseStepLength(), now = ctx.currentTime, base = transportStart || now; return base + Math.ceil((now - base + 0.012) / len) * len; }
  function resetTransport(){ if(ctx){ transportStart = ctx.currentTime + 0.02; nextLoopTime = transportStart; nextLoopStep = 0; } }

  function setPadMode(i, mode){
    padModes[i] = mode;
    if(mode !== "loop" && loopPads.has(i)) loopPads.delete(i);
    if(mode !== "gate") stopGatePad(i);
    renderPads(); renderSliceControls(); updateMap();
    status("Pad " + (i + 1) + " mode: " + mode.toUpperCase() + ".");
  }

  function setPadTiming(i, steps){
    padTimings[i] = Number(steps) || 4;
    renderPads(); renderSliceControls(); updateMap();
    status("Pad " + (i + 1) + " loop timing: " + timingLabel(padTimings[i]) + ".");
  }

  function nextPadMode(i){
    const order = ["loop","oneshot","gate"];
    setPadMode(i, order[(order.indexOf(padModes[i]) + 1) % order.length]);
  }

  function ensureSliceModePanel(){
    if($("sliceModes")) return;
    const pads = $("pads");
    if(!pads || !pads.parentNode) return;
    const panel = document.createElement("div");
    panel.id = "sliceModes";
    panel.style.cssText = "display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px";
    pads.insertAdjacentElement("afterend", panel);
    renderSliceControls();
  }

  function renderSliceControls(){
    const panel = $("sliceModes");
    if(!panel) return;
    panel.innerHTML = "";
    for(let i = 0; i < STEP_COUNT; i++){
      const label = document.createElement("label");
      label.className = "smallControl";
      label.style.margin = "0";
      label.innerHTML = `Pad ${i + 1}<select data-mode-pad="${i}"><option value="loop">Loop</option><option value="oneshot">One-shot</option><option value="gate">Gate</option></select><select data-time-pad="${i}" style="margin-top:4px"><option value="1">1/16</option><option value="2">1/8</option><option value="4">1/4</option><option value="8">1/2</option><option value="16">1 BAR</option><option value="32">2 BAR</option></select>`;
      const modeSel = label.querySelector("[data-mode-pad]");
      const timeSel = label.querySelector("[data-time-pad]");
      modeSel.value = padModes[i];
      timeSel.value = String(padTimings[i]);
      modeSel.onchange = () => setPadMode(i, modeSel.value);
      timeSel.onchange = () => setPadTiming(i, timeSel.value);
      panel.appendChild(label);
    }
  }

  function applyDefaultSettings(){
    const defaults = {vol:.9,pitch:0,attack:.005,release:.08,filter:12000,fxCutoff:12000,fxRes:.7,fxDelayMix:0,fxDelayTime:.25,fxReverb:0,fxCrush:0,fxPitch:0,fxGate:0};
    Object.entries(defaults).forEach(([id,value]) => { const el = $(id); if(el){ el.value = value; el.dispatchEvent(new Event("input", {bubbles:true})); } });
    if($("velocityMode")) $("velocityMode").value = "fixed";
    if($("choke")) $("choke").value = "on";
    if($("playMode")) $("playMode").value = "oneshot";
    for(let i = 0; i < STEP_COUNT; i++){ padModes[i] = "loop"; padTimings[i] = 4; }
    clearLoopPads(); stopAllGates(); resetTransport();
    renderPads(); renderSliceControls(); updateMap();
    status("Defaults restored. LOOP pads default to 1/4 timing, adjustable per pad.");
  }

  function renderPads(){
    const box = $("pads");
    if(!box) return;
    box.innerHTML = "";
    for(let i = 0; i < STEP_COUNT; i++){
      const s = slices[i];
      const pad = document.createElement("button");
      pad.type = "button";
      pad.className = "pad" + (s ? " loaded" : "") + (loopPads.has(i) || gateSources.has(i) ? " active" : "");
      pad.dataset.pad = String(i);
      pad.dataset.mode = padModes[i];
      pad.title = "Click to play/toggle. Right-click or double-click to change mode.";
      pad.innerHTML = `<b>${i + 1}</b><span>${noteNames[i]} ${padNotes[i]} / ${qwerty[i].toUpperCase()}</span><small>${padModes[i].toUpperCase()} • ${timingLabel(padTimings[i])} • ${s ? s.start.toFixed(2) + "-" + s.end.toFixed(2) + "s" : "empty"}</small>`;
      pad.addEventListener("pointerdown", (e) => { e.preventDefault(); if(e.shiftKey || e.altKey || e.ctrlKey){ nextPadMode(i); return; } playSlice(i); });
      pad.addEventListener("dblclick", (e) => { e.preventDefault(); nextPadMode(i); });
      pad.addEventListener("contextmenu", (e) => { e.preventDefault(); nextPadMode(i); });
      box.appendChild(pad);
    }
  }

  function flashPad(i){
    const pad = document.querySelector(`[data-pad='${i}']`);
    if(!pad) return;
    pad.classList.add("active");
    setTimeout(() => { if(!loopPads.has(i) && !gateSources.has(i)) pad.classList.remove("active"); }, 135);
  }

  function renderKeys(){
    const box = $("keyboard");
    if(!box) return;
    box.innerHTML = "";
    keys.forEach((note, i) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "key white";
      k.textContent = keyLetters[i];
      k.addEventListener("pointerdown", () => playTone(note));
      box.appendChild(k);
    });
    [{n:61,x:7},{n:63,x:17},{n:66,x:37},{n:68,x:47},{n:70,x:57},{n:73,x:77},{n:75,x:87}].forEach((o) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "key black";
      k.style.left = o.x + "%";
      k.addEventListener("pointerdown", () => playTone(o.n));
      box.appendChild(k);
    });
  }

  async function startAudio(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC){ status("AudioContext not supported in this browser."); return; }
      ctx = new AC();
      transportStart = ctx.currentTime;
      master = ctx.createGain(); master.gain.value = Number($("vol").value);
      filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = Number($("filter").value);
      analyser = ctx.createAnalyser(); analyser.fftSize = 512;
      setupFX();
      filter.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
      meterLoop();
    }
    if(ctx.state !== "running") await ctx.resume();
    ready = true;
    if(!buffer) buildDemoLoop("autoload");
    status("Audio ready. Per-pad timing active: 1/16 through 2 BAR.");
  }

  async function ensureAudio(){ if(!ready) await startAudio(); }
  function stopOneShots(){ active.forEach((s) => { try{s.stop();}catch(e){} }); active = []; }
  function stopAll(){ stopOneShots(); clearLoopPads(); stopAllGates(); }

  function impulse(sec=1.25, dec=2.4){
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, dec); }
    return b;
  }

  function crushCurve(amount=0){
    const n = 1024, c = new Float32Array(n), steps = Math.max(2, Math.floor(2 + amount * 46));
    for(let i = 0; i < n; i++){ const x = i * 2 / n - 1; c[i] = Math.round(x * steps) / steps; }
    return c;
  }

  function setupFX(){
    const delaySend = ctx.createGain(), delay = ctx.createDelay(.95), feedback = ctx.createGain(), delayReturn = ctx.createGain();
    const verbSend = ctx.createGain(), convolver = ctx.createConvolver(), verbReturn = ctx.createGain();
    const crushSend = ctx.createGain(), crusher = ctx.createWaveShaper(), crushReturn = ctx.createGain();
    const gateSend = ctx.createGain(), gate = ctx.createGain();
    delay.delayTime.value = .25; feedback.gain.value = .24; delayReturn.gain.value = .72;
    convolver.buffer = impulse(); verbReturn.gain.value = .7;
    crusher.curve = crushCurve(0); crusher.oversample = "2x"; crushReturn.gain.value = .55;
    gate.gain.value = 1;
    filter.connect(delaySend); delaySend.connect(delay); delay.connect(delayReturn); delayReturn.connect(master); delay.connect(feedback); feedback.connect(delay);
    filter.connect(verbSend); verbSend.connect(convolver); convolver.connect(verbReturn); verbReturn.connect(master);
    filter.connect(crushSend); crushSend.connect(crusher); crusher.connect(crushReturn); crushReturn.connect(master);
    filter.connect(gateSend); gateSend.connect(gate); gate.connect(master);
    fx = { delaySend, delay, verbSend, crushSend, crusher, gateSend, gate };
    refreshFX();
  }

  function setCut(v){ if(filter) filter.frequency.setTargetAtTime(Number(v), ctx.currentTime, .015); $("filter").value = v; $("fxCutoff").value = v; }
  function setPitch(v){ $("pitch").value = v; $("fxPitch").value = v; }
  function setGate(v){
    if(!fx || !ctx) return;
    const amount = Number(v);
    fx.gateSend.gain.setTargetAtTime(amount * .8, ctx.currentTime, .02);
    if(gateTimer){ clearInterval(gateTimer); gateTimer = null; fx.gate.gain.setTargetAtTime(1, ctx.currentTime, .01); }
    if(amount > .01){ let open = true; gateTimer = setInterval(() => { open = !open; fx.gate.gain.setTargetAtTime(open ? 1 : Math.max(.02, 1 - amount), ctx.currentTime, .01); }, Math.max(45, 170 - amount * 120)); }
  }

  function refreshFX(){
    if(!ctx) return;
    filter.Q.setTargetAtTime(Number($("fxRes").value), ctx.currentTime, .015);
    if(!fx) return;
    fx.delaySend.gain.setTargetAtTime(Number($("fxDelayMix").value), ctx.currentTime, .02);
    fx.delay.delayTime.setTargetAtTime(Number($("fxDelayTime").value), ctx.currentTime, .02);
    fx.verbSend.gain.setTargetAtTime(Number($("fxReverb").value), ctx.currentTime, .02);
    const cr = Number($("fxCrush").value);
    fx.crushSend.gain.setTargetAtTime(cr * .85, ctx.currentTime, .02);
    fx.crusher.curve = crushCurve(cr);
    setGate($("fxGate").value);
  }

  function gridChop(){
    if(!buffer){ status("Load a loop first, or hit Demo."); return; }
    slices = [];
    const step = buffer.duration / STEP_COUNT;
    for(let i = 0; i < STEP_COUNT; i++) slices.push({start:i * step, end:(i + 1) * step});
    clearLoopPads(false); stopAllGates(); resetTransport(); renderPads(); drawWave(); updateMap();
    status("Grid chopped. LOOP timing defaults to 1/4 and is adjustable per pad.");
  }

  function smartChop(){
    if(!buffer){ status("Load a loop first, or hit Demo."); return; }
    const data = buffer.getChannelData(0), sr = buffer.sampleRate, win = Math.floor(sr * .012), hop = Math.floor(sr * .006), hits = [];
    let prev = 0;
    for(let i = 0; i < data.length - win; i += hop){
      let e = 0;
      for(let j = 0; j < win; j++){ const v = data[i + j]; e += v * v; }
      e = Math.sqrt(e / win);
      const rise = e - prev;
      if(rise > .035 && e > .045) hits.push({time:i / sr, score:rise + e * .25});
      prev = prev * .92 + e * .08;
    }
    hits.sort((a,b) => b.score - a.score);
    const chosen = [0], gap = buffer.duration / 28;
    for(const h of hits){ if(h.time > .01 && chosen.every((t) => Math.abs(t - h.time) > gap)) chosen.push(h.time); if(chosen.length >= STEP_COUNT) break; }
    while(chosen.length < STEP_COUNT) chosen.push(chosen.length / STEP_COUNT * buffer.duration);
    chosen.sort((a,b) => a - b);
    slices = [];
    for(let i = 0; i < STEP_COUNT; i++) slices.push({start:chosen[i], end:Math.max(chosen[i] + .03, chosen[i + 1] || buffer.duration)});
    clearLoopPads(false); stopAllGates(); resetTransport(); renderPads(); drawWave(); updateMap();
    status("Smart chop complete. Adjust timing per pad if a loop feels too fast or loose.");
  }

  async function loadFile(file){ await startAudio(); buffer = await ctx.decodeAudioData(await file.arrayBuffer()); fileName = file.name || "loaded-loop"; resetTransport(); gridChop(); }

  function buildDemoLoop(source="demo"){
    if(!ctx) return;
    const bpm = 130, dur = 60 / bpm * 8, sr = ctx.sampleRate, b = ctx.createBuffer(1, Math.floor(sr * dur), sr), d = b.getChannelData(0), beat = 60 / bpm;
    function hit(t,type){
      const st = Math.floor(t * sr), len = Math.floor(sr * (type === "h" ? .05 : type === "s" ? .18 : .28));
      for(let i = 0; i < len; i++){
        const x = i / sr, n = st + i;
        if(n >= d.length) break;
        if(type === "k"){ const f = 52 + 120 * Math.exp(-x * 20); d[n] += Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 9) * .85; }
        else if(type === "s") d[n] += (Math.random() * 2 - 1) * Math.exp(-x * 18) * .5 + Math.sin(2 * Math.PI * 190 * x) * Math.exp(-x * 16) * .35;
        else d[n] += (Math.random() * 2 - 1) * Math.exp(-x * 60) * .18;
      }
    }
    for(let bar = 0; bar < 2; bar++){
      const o = bar * 4 * beat;
      hit(o,"k"); hit(o + 2 * beat,"k"); hit(o + beat,"s"); hit(o + 3 * beat,"s");
      for(let s = 0; s < 8; s++) hit(o + s * beat / 2,"h");
    }
    for(let i = 0; i < d.length; i++) d[i] = Math.tanh(d[i] * 1.6);
    buffer = b; fileName = source === "autoload" ? "autoload-built-in-kit.wav" : "built-in-demo-loop.wav";
    resetTransport(); gridChop();
    if(source === "autoload") status("Built-in kit loaded. LOOP timing options are active.");
  }

  async function demo(){ await startAudio(); buildDemoLoop("demo"); status("Demo kit regenerated. Per-pad timing active."); }

  function triggerSliceAt(i, vel=1, when=null, forcedDur=null, trackAs="active"){
    if(!buffer || !slices[i]) return null;
    const now = when == null ? ctx.currentTime : when, s = slices[i], rawDur = Math.max(.025, s.end - s.start);
    const playDur = forcedDur || (padModes[i] === "gate" ? Math.min(rawDur, .42) : rawDur);
    const src = ctx.createBufferSource(), gain = ctx.createGain(), velocity = $("velocityMode").value === "fixed" ? 1 : vel;
    src.buffer = buffer; src.playbackRate.value = Math.pow(2, Number($("pitch").value) / 12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(Math.max(.05, velocity), now + Number($("attack").value));
    gain.gain.setValueAtTime(Math.max(.05, velocity), now + Math.max(.02, playDur - Number($("release").value)));
    gain.gain.linearRampToValueAtTime(.0001, now + playDur);
    src.connect(gain); gain.connect(filter); src.start(now, s.start, playDur); src.stop(now + playDur + .02);
    if(trackAs === "active") active.push(src);
    src.onended = () => { active = active.filter((x) => x !== src); if(gateSources.get(i) === src) gateSources.delete(i); flashPad(i); };
    flashPad(i);
    return src;
  }

  async function playSlice(i, vel=1){
    await ensureAudio();
    if(!buffer || !slices[i]){ status("Load a loop first, or hit Demo."); return; }
    const mode = padModes[i];
    if(mode === "loop"){ toggleLoopPad(i, vel); return; }
    if(mode === "gate"){ startGatePad(i, vel, false); return; }
    if($("choke").value === "on") stopOneShots();
    triggerSliceAt(i, vel, null, null, "active");
    status("Pad " + (i + 1) + " one-shot.");
  }

  function toggleLoopPad(i, vel=1){
    stopGatePad(i);
    if(loopPads.has(i)){
      loopPads.delete(i);
      const pad = document.querySelector(`[data-pad='${i}']`); if(pad) pad.classList.remove("active");
      status("Pad " + (i + 1) + " loop OFF.");
      if(loopPads.size === 0) stopLoopScheduler();
      return;
    }
    loopPads.set(i, vel);
    const pad = document.querySelector(`[data-pad='${i}']`); if(pad) pad.classList.add("active");
    startLoopScheduler();
    status("Pad " + (i + 1) + " loop ON at " + timingLabel(padTimings[i]) + ".");
  }

  function startGatePad(i, vel=1, held=true){
    stopGatePad(i);
    const span = slices[i] ? Math.max(.08, Math.min(slices[i].end - slices[i].start, 8)) : .42;
    const src = triggerSliceAt(i, vel, null, held ? span : .42, "gate");
    if(src) gateSources.set(i, src);
    status("Pad " + (i + 1) + " gate " + (held ? "held" : "hit") + ".");
    renderPads();
  }

  function stopGatePad(i){ const src = gateSources.get(i); if(src){ try{ src.stop(); }catch(e){} gateSources.delete(i); } renderPads(); }
  function stopAllGates(){ [...gateSources.keys()].forEach(stopGatePad); gateSources.clear(); }
  function startLoopScheduler(){ if(loopScheduler) return; nextLoopTime = nextGridTime(); nextLoopStep = stepAt(nextLoopTime); loopScheduler = setInterval(scheduleLoopPads, 20); }
  function stopLoopScheduler(){ if(loopScheduler){ clearInterval(loopScheduler); loopScheduler = null; } }
  function clearLoopPads(update=true){ loopPads.clear(); stopLoopScheduler(); if(update) renderPads(); }

  function shouldFirePadAtStep(pad, step){
    const timing = Math.max(1, Number(padTimings[pad]) || 4);
    const offset = pad % Math.min(timing, STEP_COUNT);
    return step % timing === offset;
  }

  function scheduleLoopPads(){
    if(!ctx || loopPads.size === 0){ stopLoopScheduler(); return; }
    const len = baseStepLength();
    while(nextLoopTime < ctx.currentTime + .16){
      const step = nextLoopStep % STEP_COUNT;
      loopPads.forEach((vel, pad) => {
        if(padModes[pad] === "loop" && shouldFirePadAtStep(pad, step)){
          const timing = Math.max(1, Number(padTimings[pad]) || 4);
          const dur = Math.max(.025, Math.min(len * timing * .96, slices[pad] ? slices[pad].end - slices[pad].start : len * timing));
          triggerSliceAt(pad, vel, nextLoopTime, dur, "loop");
        }
      });
      nextLoopStep = (nextLoopStep + 1) % STEP_COUNT;
      nextLoopTime += len;
    }
  }

  async function playTone(note, vel=.85){
    await ensureAudio();
    const now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "sawtooth"; osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.16 * vel, now + .015); gain.gain.exponentialRampToValueAtTime(.001, now + .45);
    osc.connect(gain); gain.connect(filter); osc.start(now); osc.stop(now + .48);
  }

  function drawWave(){
    const c = $("wave"), r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    c.width = Math.max(320, Math.floor(r.width * dpr)); c.height = Math.max(90, Math.floor(r.height * dpr));
    const x = c.getContext("2d"), mid = c.height / 2; x.fillStyle = "#05070b"; x.fillRect(0,0,c.width,c.height);
    if(buffer){ const data = buffer.getChannelData(0), step = Math.ceil(data.length / c.width); x.strokeStyle = "#6dff7a"; x.lineWidth = Math.max(2,dpr*2); x.beginPath(); for(let px = 0; px < c.width; px++){ let min = 1, max = -1; for(let j = 0; j < step; j++){ const v = data[px * step + j] || 0; if(v < min) min = v; if(v > max) max = v; } x.moveTo(px, mid + min * mid * .86); x.lineTo(px, mid + max * mid * .86); } x.stroke(); }
    drawSlices();
  }

  function drawSlices(){ const box = $("sliceMarks"); if(!box) return; box.innerHTML = ""; if(!buffer) return; slices.forEach((s) => { const m = document.createElement("i"); m.style.left = (s.start / buffer.duration * 100) + "%"; box.appendChild(m); }); }
  function drawScope(time, avg){
    const c = $("scope"), mode = $("visualMode").value, r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1, w = Math.max(320, Math.floor(r.width * dpr)), h = Math.max(90, Math.floor(r.height * dpr));
    if(c.width !== w || c.height !== h){ c.width = w; c.height = h; }
    const x = c.getContext("2d"); x.fillStyle = "#020305"; x.fillRect(0,0,w,h);
    if(mode === "off"){ x.fillStyle = "rgba(247,248,252,.45)"; x.font = Math.floor(13*dpr) + "px Bahnschrift,Arial"; x.fillText("VISUAL OFF",12*dpr,28*dpr); return; }
    const alpha = mode === "calm" ? .52 : .95, mid = h / 2, amp = mode === "calm" ? .52 : .86;
    x.strokeStyle = `rgba(81,234,255,${alpha})`; x.lineWidth = Math.max(2,dpr*2); x.beginPath();
    for(let i = 0; i < time.length; i++){ const px = i / (time.length - 1) * w, py = mid + ((time[i] - 128) / 128) * mid * amp; if(i === 0) x.moveTo(px,py); else x.lineTo(px,py); }
    x.stroke(); x.strokeStyle = `rgba(109,255,122,${mode === "calm" ? .18 : .32})`; x.lineWidth = Math.max(1,dpr);
    for(let px = 0; px < w; px += Math.max(18, Math.floor(w / 24))){ x.beginPath(); x.moveTo(px,0); x.lineTo(px,h); x.stroke(); }
    const glow = Math.min(1, avg / 90); x.fillStyle = `rgba(109,255,122,${.08 + glow * .16})`; x.fillRect(0,h-8*dpr,w*glow,8*dpr);
  }

  function idleScope(){ const z = new Uint8Array(512); z.fill(128); drawScope(z,0); }
  function meterLoop(){ const freq = new Uint8Array(analyser.frequencyBinCount), time = new Uint8Array(analyser.fftSize); function loop(){ if(analyser){ analyser.getByteFrequencyData(freq); analyser.getByteTimeDomainData(time); const avg = freq.reduce((a,b) => a + b,0) / freq.length; $("meterFill").style.width = Math.min(100, avg * 1.25) + "%"; drawScope(time, avg); } requestAnimationFrame(loop); } loop(); }

  function padIndexFromNote(note){ let idx = padNotes.indexOf(note); if(idx >= 0) return idx; if(note >= 36 && note <= 51) return note - 36; if(autoPadMap[note] === undefined){ autoPadMap[note] = autoPadNext % STEP_COUNT; autoPadNext++; status("Auto-mapped MIDI note " + note + " to pad " + (autoPadMap[note] + 1) + "."); } return autoPadMap[note]; }
  function midiRange(id, val){ const el = $(id), min = Number(el.min || 0), max = Number(el.max || 1), step = Number(el.step || 0); let next = min + (max - min) * (val / 127); if(step) next = Math.round(next / step) * step; el.value = String(next); el.dispatchEvent(new Event("input", {bubbles:true})); }
  function handleCC(cc, val){ let target = fixedCCMap[cc]; if(!target){ if(!autoCCMap[cc]){ autoCCMap[cc] = knobTargets[autoCCNext % knobTargets.length]; autoCCNext++; status("Auto-mapped knob CC " + cc + " to " + nice(autoCCMap[cc]) + "."); } target = autoCCMap[cc]; } midiRange(target, val); midiMon("MIDI CC " + cc + " value " + val + " → " + nice(target)); return true; }

  async function enableMIDI(){
    await startAudio();
    if(!navigator.requestMIDIAccess){ status("MIDI not supported here. Use Chrome/Edge desktop."); midiMon("MIDI unavailable: browser does not expose Web MIDI."); return; }
    try{ const midi = await navigator.requestMIDIAccess({sysex:false}); const bind = () => { let names = []; for(const input of midi.inputs.values()){ input.onmidimessage = onMIDI; names.push(input.name || "MIDI input"); } const msg = names.length ? "MIDI enabled: " + names.join(", ") + ". Per-pad timing active." : "MIDI enabled, but no input detected. Replug Launchkey, then press MIDI again."; status(msg); midiMon(msg); }; bind(); midi.onstatechange = bind; }
    catch(e){ status("MIDI permission failed or was denied."); midiMon("MIDI error: " + (e && e.message ? e.message : e)); }
  }

  function onMIDI(e){
    const data = [...e.data], cmd = data[0] || 0, d1 = data[1] || 0, d2 = data[2] || 0, type = cmd & 240, ch = (cmd & 15) + 1;
    midiMon("MIDI raw ch" + ch + " status " + type + " data " + data.join(","));
    if(type === 176){ handleCC(d1,d2); return; }
    if(type === 224){ const bend = ((d2 << 7) | d1) - 8192, semi = Math.max(-12, Math.min(12, Math.round(bend / 8192 * 12))); setPitch(semi); midiMon("Pitch bend → " + semi + " semitones"); return; }
    if(type === 144 && d2 > 0){ const idx = padIndexFromNote(d1); if(padModes[idx] === "gate") startGatePad(idx, d2 / 127, true); else playSlice(idx, d2 / 127); return; }
    if(type === 128 || (type === 144 && d2 === 0)){ const idx = padIndexFromNote(d1); if(padModes[idx] === "gate") stopGatePad(idx); return; }
    if(type === 160){ const idx = padIndexFromNote(d1); flashPad(idx); return; }
    if(d1 || d2) status("MIDI seen but unmapped: status " + type + " data " + data.join(","));
  }

  function updateMap(){ const map = {file:fileName, transport:"timed-16-step", pads:slices.map((s,i) => ({pad:i+1,mode:padModes[i],timing:timingLabel(padTimings[i]),timingSteps:padTimings[i],note:noteNames[i],midi:padNotes[i],key:qwerty[i],start:+s.start.toFixed(4),end:+s.end.toFixed(4)})), fx:{k1:"cutoff",k2:"resonance",k3:"delay",k4:"delay time",k5:"reverb",k6:"crush",k7:"pitch",k8:"gate",cc:"21-28, 71-78, CC1, pitchbend, plus auto-captured unknown CCs"}}; $("bankText").value = JSON.stringify(map,null,2); }
  function exportMap(){ const blob = new Blob([$("bankText").value], {type:"application/json"}), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "the-choppa-pad-map.json"; a.click(); }

  $("startBtn").onclick = startAudio; $("midiBtn").onclick = enableMIDI; $("panicBtn").onclick = () => { stopAll(); status("Stopped all one-shots, gates, and loops."); };
  $("loopUpload").onchange = (e) => { if(e.target.files[0]) loadFile(e.target.files[0]); };
  $("gridChopBtn").onclick = gridChop; $("transientChopBtn").onclick = smartChop; $("reverseBtn").onclick = () => { if(slices.length){ slices.reverse(); clearLoopPads(false); stopAllGates(); resetTransport(); renderPads(); drawWave(); updateMap(); status("Pad order reversed. Transport reset."); } };
  $("demoBtn").onclick = demo; $("exportBtn").onclick = exportMap; $("visualMode").onchange = idleScope;
  $("vol").oninput = (e) => { if(master) master.gain.value = Number(e.target.value); };
  $("filter").oninput = (e) => setCut(e.target.value); $("pitch").oninput = (e) => setPitch(e.target.value); $("fxCutoff").oninput = (e) => setCut(e.target.value); $("fxPitch").oninput = (e) => setPitch(e.target.value);
  ["fxRes","fxDelayMix","fxDelayTime","fxReverb","fxCrush","fxGate"].forEach((id) => $(id).oninput = refreshFX);
  window.addEventListener("keydown", (e) => { if(e.repeat) return; const k = e.key.toLowerCase(), p = qwerty.indexOf(k); if(p >= 0){ playSlice(p); return; } const n = ["z","x","c","v","b","n","m",",",".","/"].indexOf(k); if(n >= 0) playTone(keys[n]); });
  window.addEventListener("resize", () => { drawWave(); idleScope(); });
  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; $("installBar").classList.add("show"); });
  $("installBtn").onclick = async () => { if(!deferred) return; deferred.prompt(); await deferred.userChoice.catch(() => null); deferred = null; $("installBar").classList.remove("show"); };
  if("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  ensureSliceModePanel();
  const defaultBtn = $("defaultSettingsBtn"); if(defaultBtn) defaultBtn.addEventListener("click", applyDefaultSettings);
  if($("velocityMode")) $("velocityMode").value = "fixed";
  renderPads(); renderKeys(); renderSliceControls(); updateMap(); idleScope();
  status("Ready. LOOP pads now have timing options: 1/16 to 2 BAR. Timing is the instrument.");
})();
