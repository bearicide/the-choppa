(() => {
  if (window.choppaPadLoopDefaultLoaded) return;
  window.choppaPadLoopDefaultLoaded = true;
  const byId = id => document.getElementById(id);
  const keyPads = ['1','2','3','4','5','6','7','8','q','w','e','r','t','y','u','i'];
  const trackedSources = new Set();
  let working = false;
  let bendSemis = 0;
  let modAmount = 0;

  function injectBackground() {
    if (byId('choppaHunterOrangePatch')) return;
    const style = document.createElement('style');
    style.id = 'choppaHunterOrangePatch';
    style.textContent = `
      html,body{background:#ff5a00!important;font-size:18px!important;}
      body{font-size:1.12rem!important;}
      body::before{
        background:linear-gradient(180deg,rgba(255,90,0,.74),rgba(217,71,0,.86)),url('assets/the-choppa-bg.png') center/cover fixed no-repeat!important;
        background-blend-mode:multiply,normal!important;
        background-size:cover!important;
        background-position:center!important;
        opacity:1!important;
      }
      body::after{opacity:calc(.32 + var(--beat,0)*.74)!important;}
      .card,.panel,.top,.nav,.xyPanel{background-color:rgba(5,6,9,.76)!important;}
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

  function choose(select, label) {
    if (!select) return;
    const want = String(label).toLowerCase();
    const opt = Array.from(select.options).find(o => String(o.textContent).toLowerCase() === want || String(o.value).toLowerCase() === want);
    if (opt && select.value !== opt.value) {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
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
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  function padIndex(node) {
    const pad = node?.closest?.('.pad');
    if (!pad) return -1;
    for (const name of pad.classList) {
      const match = name.match(/^p(\d+)$/);
      if (match) return Number(match[1]);
    }
    const raw = (pad.querySelector('span')?.textContent || '').trim();
    const number = Number(raw);
    return Number.isFinite(number) ? number - 1 : -1;
  }

  function defaults() {
    choose(byId('triggerMode'), 'Choke');
    const hold = byId('holdLoopBtn');
    if (hold && !hold.classList.contains('active')) hold.click();
  }

  async function loopOnly(index) {
    if (working || index < 0) return;
    const select = byId('padSelect');
    const clear = byId('clearLoopBtn');
    const loop = byId('loopSelected');
    if (!select || !clear || !loop) return;
    working = true;
    defaults();
    select.value = String(index);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    clear.click();
    await new Promise(r => setTimeout(r, 20));
    loop.click();
    document.querySelectorAll('.pad').forEach((pad, i) => pad.classList.toggle('queued', i === index));
    setTimeout(() => { working = false; }, 90);
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
      const status = document.querySelector('.status');
      status?.appendChild(read);
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
    if (byId('crush')) setInput('crush', Math.min(Number(byId('crush').max || 1), modAmount));
    if (byId('gate')) setInput('gate', Math.min(Number(byId('gate').max || 1), modAmount * 0.75));
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
      // Browser denied MIDI. Existing app controls still work.
    }
  }

  function install() {
    injectBackground();
    defaults();
    armPitchModMidi();
    document.addEventListener('pointerdown', event => {
      const index = padIndex(event.target);
      if (index < 0 || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      loopOnly(index);
    }, true);
    document.addEventListener('keydown', event => {
      if (event.target?.matches?.('input,select,textarea,button')) return;
      const index = keyPads.indexOf(event.key.toLowerCase());
      if (index < 0 || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      loopOnly(index);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
