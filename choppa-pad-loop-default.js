(() => {
  if (window.choppaPadLoopDefaultLoaded) return;
  window.choppaPadLoopDefaultLoaded = true;

  const byId = id => document.getElementById(id);
  const trackedSources = new Set();
  let bendSemis = 0;
  let modAmount = 0;

  function injectVisualPatch() {
    if (byId('choppaHunterOrangePatch')) return;
    const style = document.createElement('style');
    style.id = 'choppaHunterOrangePatch';
    style.textContent = `
      html,body{background:#ff5a00!important;font-size:18px!important;}
      body{font-size:1.12rem!important;background:#ff5a00!important;}
      body::before{background:#ff5a00!important;background-image:none!important;filter:none!important;opacity:1!important;mix-blend-mode:normal!important;}
      body::after{background:radial-gradient(circle at 18% 12%,rgba(255,220,120,.28),transparent 30%),linear-gradient(180deg,rgba(255,106,0,.55),rgba(204,58,0,.68))!important;filter:none!important;mix-blend-mode:normal!important;opacity:.9!important;}
      .app,main,.wrap{background:transparent!important;}
      .card,.panel,.top,.nav,.xyPanel{background-color:rgba(5,6,9,.78)!important;}
      .brand b{font-size:clamp(2.1rem,4.2vw,3.4rem)!important;line-height:.9!important;}
      h1,.title{font-size:clamp(4.8rem,14vw,14rem)!important;}
      h2{font-size:clamp(1.45rem,2.6vw,2.35rem)!important;line-height:1!important;}
      h3{font-size:clamp(1.25rem,2.2vw,1.9rem)!important;}
      .pill,.btn,.mini,.box,.small,label,select,input,output{font-size:1rem!important;}
      .pill{min-height:42px!important;padding:9px 14px!important;}
      .btn{min-height:50px!important;padding:.7rem .9rem!important;}
      .mini{min-height:40px!important;padding:.55rem .75rem!important;}
      .step,.midiRow,.slider,.helpGrid,.inside,p{font-size:1.08rem!important;line-height:1.42!important;}
      .pad{font-size:clamp(1.65rem,4vw,3.1rem)!important;}
      .pad small,.pad em{font-size:.72rem!important;}
      .knob strong{font-size:.92rem!important;}
      .knob output{font-size:.86rem!important;}
      .status{gap:12px!important;}
      @media(max-width:720px){html,body{font-size:17px!important}.brand b{font-size:2rem!important}.pill,.btn,.mini,.box,label,select,input,output{font-size:.95rem!important}.pad small,.pad em{font-size:.66rem!important}}
    `;
    document.head.appendChild(style);
  }

  function fire(el, type = 'change') {
    if (!el) return;
    el.dispatchEvent(new Event(type, { bubbles: true }));
  }

  function choose(select, value) {
    if (!select) return false;
    const want = String(value).toLowerCase();
    const option = Array.from(select.options || []).find(o => String(o.value).toLowerCase() === want || String(o.textContent).toLowerCase() === want);
    if (!option) return false;
    if (select.value !== option.value) {
      select.value = option.value;
      fire(select, 'input');
      fire(select, 'change');
    }
    return true;
  }

  function applySafeDefaults() {
    choose(byId('choke'), 'on');
    choose(byId('velocityMode'), 'fixed');
    if (typeof window.choppaSetGrooveMode === 'function' && window.choppaGrooveMode?.() !== 'chop') {
      window.choppaSetGrooveMode('chop');
    }
  }

  function setInput(id, value) {
    const el = byId(id);
    if (!el) return false;
    const min = Number(el.min || 0);
    const max = Number(el.max || 1);
    const next = Math.max(min, Math.min(max, value));
    if (String(el.value) !== String(next)) {
      el.value = next;
      fire(el, 'input');
      fire(el, 'change');
    }
    return true;
  }

  function patchAudioContext() {
    const targets = [window.AudioContext, window.webkitAudioContext].filter(Boolean);
    for (const Ctor of targets) {
      if (Ctor.prototype.choppaPitchModPatched) continue;
      Ctor.prototype.choppaPitchModPatched = true;
      const original = Ctor.prototype.createBufferSource;
      Ctor.prototype.createBufferSource = function patchedCreateBufferSource() {
        const source = original.apply(this, arguments);
        source.choppaBaseRate = source.playbackRate?.value || 1;
        const originalStart = source.start;
        source.start = function patchedStart() {
          source.choppaBaseRate = source.playbackRate?.value || source.choppaBaseRate || 1;
          trackedSources.add(source);
          source.addEventListener?.('ended', () => trackedSources.delete(source), { once: true });
          return originalStart.apply(source, arguments);
        };
        return source;
      };
    }
  }

  function applyPitch() {
    const ratio = Math.pow(2, bendSemis / 12);
    trackedSources.forEach(source => {
      try {
        const base = source.choppaBaseRate || 1;
        const ctx = source.context;
        if (source.playbackRate?.setTargetAtTime && ctx) source.playbackRate.setTargetAtTime(base * ratio, ctx.currentTime, 0.01);
        else if (source.playbackRate) source.playbackRate.value = base * ratio;
      } catch {
        trackedSources.delete(source);
      }
    });
  }

  function showMidiReadout() {
    let read = byId('choppaPitchModReadout');
    if (!read) {
      read = document.createElement('span');
      read.id = 'choppaPitchModReadout';
      read.className = 'pill ok';
      document.querySelector('.status')?.appendChild(read);
    }
    if (read) read.innerHTML = 'Wheel <strong>' + bendSemis.toFixed(1) + 'st</strong> Mod <strong>' + Math.round(modAmount * 100) + '%</strong>';
  }

  function applyMod() {
    modAmount = Math.max(0, Math.min(1, modAmount));
    const filter = byId('filter');
    if (filter) {
      const min = Number(filter.min || 300);
      const max = Number(filter.max || 18000);
      setInput('filter', min + (max - min) * (0.35 + modAmount * 0.65));
    }
    if (byId('fxCrush')) setInput('fxCrush', Math.min(Number(byId('fxCrush').max || 1), modAmount));
    if (byId('fxGate')) setInput('fxGate', Math.min(Number(byId('fxGate').max || 1), modAmount * 0.75));
    showMidiReadout();
  }

  function handleMidiMessage(event) {
    const data = event.data || [];
    const status = data[0] & 240;
    if (status === 224) {
      const raw = (data[2] << 7) + data[1];
      bendSemis = ((raw - 8192) / 8192) * 12;
      applyPitch();
      showMidiReadout();
    }
    if (status === 176 && data[1] === 1) {
      modAmount = (data[2] || 0) / 127;
      applyMod();
    }
  }

  async function armPitchModMidi() {
    patchAudioContext();
    showMidiReadout();
    if (!navigator.requestMIDIAccess) return;
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      const bind = () => {
        access.inputs.forEach(input => {
          if (input.choppaPitchModListener) return;
          input.choppaPitchModListener = true;
          input.addEventListener('midimessage', handleMidiMessage);
        });
      };
      bind();
      access.addEventListener?.('statechange', bind);
    } catch {
      // Web MIDI was denied or unavailable. The main app still runs.
    }
  }

  function install() {
    injectVisualPatch();
    applySafeDefaults();
    setTimeout(applySafeDefaults, 350);
    setTimeout(applySafeDefaults, 1200);
    armPitchModMidi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
