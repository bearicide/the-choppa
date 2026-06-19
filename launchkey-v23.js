(() => {
  if (window.__choppaLaunchkeyV23) return;
  window.__choppaLaunchkeyV23 = true;

  const PAD_KEYS = ['1','2','3','4','5','6','7','8','q','w','e','r','t','y','u','i'];
  const PAD_NOTES = [40,41,42,43,48,49,50,51,36,37,38,39,44,45,46,47];
  const PAD_COLORS = ['#ff3a36','#ff7a18','#f6ff2e','#75ff35','#20e7ff','#3d8bff','#a65cff','#ff3fa7','#ff3a36','#ff7a18','#f6ff2e','#75ff35','#20e7ff','#3d8bff','#a65cff','#ff3fa7'];
  const KNOB_MAP = {21:'Filter',22:'Reverb',23:'Delay',24:'Drive',25:'Crush',26:'Gate',27:'Pitch',28:'Pan'};
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const qsa = sel => [...document.querySelectorAll(sel)];
  const activeKeys = new Set();
  let hwShift = false;
  let lastAction = 'ready';
  let lifeDepth = 0;

  const DEFAULT_BUTTONS = {
    'rt:250':'play',
    'rt:251':'play',
    'rt:252':'stop',
    'mmc:1':'stop',
    'mmc:2':'play',
    'mmc:3':'play',
    'mmc:6':'record',
    'cc:115':'play',
    'cc:116':'record',
    'cc:117':'stop',
    'cc:118':'right',
    'cc:119':'shift',
    'cc:104':'octDown',
    'cc:105':'octUp',
    'cc:106':'transpose',
    'cc:107':'arp',
    'cc:108':'fixedChord',
    'cc:109':'stopMode',
    'note:115':'play',
    'note:116':'record',
    'note:117':'stop',
    'note:118':'right',
    'note:119':'shift',
    'note:104':'octDown',
    'note:105':'octUp',
    'note:106':'transpose',
    'note:107':'arp',
    'note:108':'fixedChord',
    'note:109':'stopMode'
  };

  function css() {
    if ($('launchkey-v23-css')) return;
    const style = document.createElement('style');
    style.id = 'launchkey-v23-css';
    style.textContent = `
      :root{--lk-life:0;--lk-pitch:0;--lk-gap:10px;}
      body.lk-v23 .app.wrap{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;}
      body.lk-v23 .deck{display:grid!important;grid-template-columns:minmax(270px,.34fr) minmax(0,1fr)!important;gap:12px!important;order:1!important;}
      body.lk-v23 .topControl{min-height:190px!important;grid-template-columns:minmax(0,1fr) 230px!important;padding:12px!important;}
      body.lk-v23 .heroTitle{font-size:clamp(1.9rem,3.2vw,3.3rem)!important;}
      body.lk-v23 .topTransport{grid-template-columns:56px 56px 120px 110px minmax(180px,1fr)!important;gap:8px!important;}
      body.lk-v23 .big{width:56px!important;height:52px!important;}
      body.lk-v23 .tapBig,body.lk-v23 .mapBig{height:52px!important;}
      body.lk-v23 .xyLive{height:132px!important;}
      body.lk-v23 .mainGrid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;order:2!important;}
      body.lk-v23 .mainGrid>.card:has(#pads){order:1!important;}
      body.lk-v23 .mainGrid>.card:has(#fx){order:2!important;}
      body.lk-v23 .padsWrap{padding:12px!important;}
      body.lk-v23 .pads{display:grid!important;grid-template-columns:repeat(8,minmax(58px,1fr))!important;gap:var(--lk-gap)!important;}
      body.lk-v23 .pad{height:76px!important;border-radius:12px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--padColor,#f6ff2e) 28%,#151318),#09090d)!important;border-color:color-mix(in srgb,var(--padColor,#f6ff2e) 76%,#fff)!important;color:#fff!important;box-shadow:inset 0 -6px rgba(0,0,0,.34),0 0 calc(7px + var(--lk-life)*18px) color-mix(in srgb,var(--padColor,#f6ff2e) 48%,transparent)!important;}
      body.lk-v23 .pad.is-off{filter:brightness(.58) saturate(.78)!important;}
      body.lk-v23 .pad.is-ready{filter:brightness(.94) saturate(1.1)!important;}
      body.lk-v23 .pad.is-on,body.lk-v23 .pad.playing,body.lk-v23 .pad.looping{filter:brightness(1.18) saturate(1.25)!important;transform:translateY(-1px);}
      body.lk-v23 .pad .key{position:absolute!important;inset:0!important;display:grid!important;place-items:center!important;transform:none!important;font:900 clamp(1.45rem,3vw,2.35rem)/1 JetBrains Mono,monospace!important;letter-spacing:.02em!important;text-shadow:0 2px 12px rgba(0,0,0,.6)!important;}
      body.lk-v23 .pad .padnum,body.lk-v23 .pad .midinote,body.lk-v23 .pad .slicetag,body.lk-v23 .pad .state{display:none!important;}
      body.lk-v23 .padControls{grid-template-columns:repeat(2,minmax(0,1fr))!important;margin-top:10px!important;}
      body.lk-v23 .loopControls{grid-template-columns:repeat(6,minmax(0,1fr))!important;margin-top:10px!important;}
      body.lk-v23 .fx{grid-template-columns:repeat(8,minmax(72px,1fr))!important;gap:8px!important;padding:12px!important;}
      body.lk-v23 .knob{display:grid!important;grid-template-rows:auto 50px auto auto;gap:4px;min-width:0;}
      body.lk-v23 .knob strong{font-size:.72rem!important;letter-spacing:.02em!important;}
      body.lk-v23 .dial{width:50px!important;height:50px!important;box-shadow:0 0 9px currentColor!important;}
      body.lk-v23 .dial i{height:17px!important;transform-origin:50% 20px!important;}
      body.lk-v23 .knob output{font-size:.68rem!important;}
      body.lk-v23 .presets{grid-template-columns:repeat(4,minmax(0,1fr))!important;padding:0 12px 12px!important;}
      body.lk-v23 .waveCard{order:4!important;max-width:440px!important;justify-self:end!important;opacity:.9!important;}
      body.lk-v23 .waveCard .title{padding:6px 10px!important;min-height:34px!important;}
      body.lk-v23 .waveCard h2{font-size:.88rem!important;}
      body.lk-v23 .waveCard .tools{display:none!important;}
      body.lk-v23 .media,body.lk-v23 .media canvas{height:88px!important;}
      body.lk-v23 .helpGrid{display:none!important;}
      body.lk-v23 .fxVoicePanel{order:5!important;max-width:680px!important;justify-self:end!important;}
      body.lk-v23 .fxVoicePanel .body{grid-template-columns:1fr!important;}
      .launchkeyPanel{order:3;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:linear-gradient(180deg,rgba(9,11,17,.9),rgba(4,5,8,.78));box-shadow:0 12px 34px rgba(0,0,0,.32);padding:12px;display:grid;gap:10px;}
      .launchkeyPanel .lkTop{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
      .launchkeyPanel h2{margin:0;font:900 1rem Space Grotesk,Inter,sans-serif;letter-spacing:-.02em;}
      .lkRead{font:800 .68rem JetBrains Mono,monospace;color:#bdb3a5;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.24);border-radius:8px;padding:7px 9px;}
      .lkGrid{display:grid;grid-template-columns:170px 170px minmax(0,1fr);gap:10px;align-items:stretch;}
      .lkStrip{border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(0,0,0,.24);padding:9px;display:grid;grid-template-rows:auto 1fr auto;gap:7px;min-height:92px;}
      .lkStrip b{font:900 .68rem JetBrains Mono,monospace;color:#fff;}
      .lkMeter{height:12px;border-radius:999px;background:rgba(255,255,255,.11);overflow:hidden;align-self:center;}
      .lkMeter i{display:block;width:50%;height:100%;border-radius:999px;background:linear-gradient(90deg,#20e7ff,#f6ff2e,#ff3fa7);transform-origin:left center;transition:width .05s linear,transform .05s linear;}
      .lkStrip small{font:800 .62rem JetBrains Mono,monospace;color:#bdb3a5;}
      .lkMap{display:grid;grid-template-columns:repeat(5,minmax(90px,1fr));gap:7px;}
      .lkMap span{border:1px solid rgba(255,255,255,.11);border-radius:8px;background:rgba(0,0,0,.22);padding:7px 8px;font:800 .62rem JetBrains Mono,monospace;color:#d8d1c8;}
      .lkMap b{color:#fff;display:block;margin-bottom:2px;}
      @media(max-width:1100px){body.lk-v23 .deck{grid-template-columns:1fr!important;}body.lk-v23 .topControl{grid-template-columns:1fr!important;}body.lk-v23 .fx{grid-template-columns:repeat(4,minmax(72px,1fr))!important;}.lkGrid{grid-template-columns:1fr 1fr}.lkMap{grid-column:1/-1;grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media(max-width:760px){body.lk-v23 .pads{grid-template-columns:repeat(4,minmax(58px,1fr))!important;}body.lk-v23 .pad{height:68px!important;}body.lk-v23 .loopControls{grid-template-columns:repeat(2,minmax(0,1fr))!important;}body.lk-v23 .fx{grid-template-columns:repeat(2,minmax(72px,1fr))!important;}.lkGrid{grid-template-columns:1fr}.lkMap{grid-template-columns:1fr}.launchkeyPanel{padding:10px}.waveCard{max-width:none!important;justify-self:stretch!important;}}
    `;
    document.head.appendChild(style);
  }

  function click(id) {
    const el = $(id);
    if (el) el.click();
  }

  function setStatus(text) {
    lastAction = text;
    const read = $('lkLast');
    if (read) read.textContent = text;
    const badge = $('badge');
    if (badge) badge.textContent = text;
    const upload = $('uploadStatus');
    if (upload) upload.textContent = text;
  }

  function setRange(id, value) {
    const el = $(id);
    if (!el) return;
    const min = Number(el.min || 0);
    const max = Number(el.max || 1);
    const next = Math.max(min, Math.min(max, value));
    el.value = String(next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function bumpRange(id, amount) {
    const el = $(id);
    if (!el) return;
    setRange(id, Number(el.value || 0) + amount);
  }

  function cycleSelect(id, dir = 1) {
    const el = $(id);
    if (!el || !el.options.length) return;
    el.selectedIndex = (el.selectedIndex + dir + el.options.length) % el.options.length;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function action(name, down = true) {
    if (!down && name !== 'shift') return true;
    switch (name) {
      case 'shift':
        hwShift = down;
        document.body.classList.toggle('lk-shift', hwShift);
        setStatus(hwShift ? 'SHIFT HELD: alternate layer' : 'SHIFT OFF');
        return true;
      case 'play':
        click(hwShift ? 'demoBtn' : 'playBtn');
        setStatus(hwShift ? 'SHIFT+PLAY: demo reload' : 'PLAY: full loop toggle');
        return true;
      case 'record':
        click(hwShift ? 'smartBtn' : 'loopSelected');
        setStatus(hwShift ? 'SHIFT+REC: smart chop' : 'REC: loop selected pad');
        return true;
      case 'stop':
      case 'stopMode':
        click('stopBtn');
        setStatus('STOP: panic / all stop');
        return true;
      case 'right':
        if (hwShift) cycleSelect('quantSelect', 1);
        else cycleSelect('padSelect', 1);
        setStatus(hwShift ? 'SHIFT+RIGHT: next quant' : 'RIGHT: next pad');
        return true;
      case 'octDown':
        if (hwShift) bumpRange('bpm', -1);
        else bumpRange('pitch', -12);
        setStatus(hwShift ? 'SHIFT+OCT-: BPM -1' : 'OCT-: pitch -12');
        return true;
      case 'octUp':
        if (hwShift) bumpRange('bpm', 1);
        else bumpRange('pitch', 12);
        setStatus(hwShift ? 'SHIFT+OCT+: BPM +1' : 'OCT+: pitch +12');
        return true;
      case 'transpose':
        setRange('pitch', 0);
        setStatus('TRANSPOSE: pitch reset');
        return true;
      case 'arp':
        click('allQuantBtn');
        setStatus('ARP: apply quant to all pads');
        return true;
      case 'fixedChord':
        click('holdLoopBtn');
        setStatus('FIXED CHORD: hold-loop mode toggle');
        return true;
      case 'clear':
        click('clearLoopBtn');
        setStatus('CLEAR LOOP');
        return true;
      default:
        return false;
    }
  }

  function installPanel() {
    if ($('launchkeyPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'launchkeyPanel';
    panel.className = 'launchkeyPanel';
    panel.innerHTML = `
      <div class="lkTop"><h2>Launchkey Control Surface</h2><div id="lkLast" class="lkRead">${lastAction}</div></div>
      <div class="lkGrid">
        <div class="lkStrip"><b>PITCH STRIP</b><div class="lkMeter"><i id="lkPitchMeter"></i></div><small id="lkPitchRead">±0 semis</small></div>
        <div class="lkStrip"><b>MOD / LIFE</b><div class="lkMeter"><i id="lkModMeter"></i></div><small id="lkModRead">Life 0%</small></div>
        <div class="lkMap">
          <span><b>PLAY</b>full loop</span><span><b>REC</b>loop selected</span><span><b>STOP</b>panic stop</span><span><b>OCT ±</b>pitch octave</span><span><b>TRANSPOSE</b>pitch reset</span>
          <span><b>RIGHT</b>next pad</span><span><b>ARP</b>quant all</span><span><b>FIXED</b>hold-loop</span><span><b>SHIFT</b>alt layer</span><span><b>MOD</b>Life Motion</span>
        </div>
      </div>`;
    const main = qs('main.app') || qs('.app.wrap') || document.body;
    const wave = qs('.waveCard');
    if (wave && wave.parentNode) wave.parentNode.insertBefore(panel, wave);
    else main.appendChild(panel);
  }

  function padElements() {
    return qsa('#pads .pad');
  }

  function enforcePadLabels() {
    const pads = padElements();
    pads.forEach((pad, i) => {
      pad.style.setProperty('--padColor', PAD_COLORS[i % PAD_COLORS.length]);
      const key = pad.querySelector('.key');
      if (key && key.textContent !== PAD_KEYS[i].toUpperCase()) key.textContent = PAD_KEYS[i].toUpperCase();
    });
  }

  function firePad(i, down) {
    const pad = padElements()[i];
    if (!pad) return;
    const type = down ? 'pointerdown' : 'pointerup';
    try {
      pad.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 823, pointerType: 'mouse', button: 0, buttons: down ? 1 : 0 }));
    } catch {
      pad.dispatchEvent(new MouseEvent(down ? 'mousedown' : 'mouseup', { bubbles: true, cancelable: true, button: 0, buttons: down ? 1 : 0 }));
    }
  }

  function typingTarget(el) {
    const tag = (el && el.tagName || '').toLowerCase();
    return ['input','select','textarea'].includes(tag) || el?.isContentEditable;
  }

  function keyboardAction(e, down) {
    if (typingTarget(e.target)) return false;
    const k = e.key.toLowerCase();
    const idx = PAD_KEYS.indexOf(k);
    if (idx > -1) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (down && !e.repeat && !activeKeys.has(k)) {
        activeKeys.add(k);
        firePad(idx, true);
      }
      if (!down && activeKeys.has(k)) {
        activeKeys.delete(k);
        firePad(idx, false);
      }
      return true;
    }
    if (!down || e.repeat) return false;
    const map = {
      ' ': 'stop',
      'escape': 'stop',
      'enter': 'record',
      'p': 'play',
      'l': 'record',
      'j': 'right',
      'k': 'right',
      '[': 'octDown',
      ']': 'octUp',
      '\\': 'transpose',
      'a': 'arp',
      'h': 'fixedChord',
      'backspace': 'clear'
    };
    const name = map[k];
    if (name) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      action(name, true);
      return true;
    }
    return false;
  }

  function updatePitchStrip(semi) {
    const pct = Math.max(0, Math.min(100, 50 + semi / 24 * 100));
    const meter = $('lkPitchMeter');
    if (meter) meter.style.width = pct + '%';
    const read = $('lkPitchRead');
    if (read) read.textContent = (semi >= 0 ? '+' : '') + semi.toFixed(1) + ' semis';
    document.documentElement.style.setProperty('--lk-pitch', (semi / 12).toFixed(3));
  }

  function updateModStrip(v) {
    lifeDepth = Math.max(0, Math.min(1, v));
    document.documentElement.style.setProperty('--lk-life', lifeDepth.toFixed(3));
    const meter = $('lkModMeter');
    if (meter) meter.style.width = Math.round(lifeDepth * 100) + '%';
    const read = $('lkModRead');
    if (read) read.textContent = 'Life ' + Math.round(lifeDepth * 100) + '%';
    if ($('reverb')) setRange('reverb', Math.min(0.45, 0.04 + lifeDepth * 0.25));
    if ($('delay')) setRange('delay', Math.min(0.60, 0.02 + lifeDepth * 0.28));
    setStatus('MOD: Life Motion ' + Math.round(lifeDepth * 100) + '%');
  }

  function pitchFromMidi(data) {
    const raw = data[1] + (data[2] << 7);
    return (raw - 8192) / 8192;
  }

  function signature(data) {
    const st = data[0];
    const cmd = st & 0xf0;
    if (st >= 0xf8) return 'rt:' + st;
    if (st === 0xf0 && data.length > 5 && data[3] === 0x06) return 'mmc:' + data[4];
    if (cmd === 0xb0) return 'cc:' + data[1];
    if (cmd === 0x90 || cmd === 0x80) return 'note:' + data[1];
    return 'raw:' + [...data].join('-');
  }

  function handleMidi(ev, appHandler) {
    const data = [...ev.data];
    const st = data[0];
    const cmd = st & 0xf0;
    const sig = signature(data);
    const isDown = cmd === 0x90 ? data[2] > 0 : cmd === 0xb0 ? data[2] > 0 : st >= 0xf8 || st === 0xf0;

    if (cmd === 0xe0) {
      const bend = pitchFromMidi(data);
      const semi = bend * 12;
      setRange('pitch', semi);
      updatePitchStrip(semi);
      setStatus('PITCH STRIP: ' + (semi >= 0 ? '+' : '') + semi.toFixed(1));
      return true;
    }

    if (cmd === 0xb0 && data[1] === 1) {
      updateModStrip(data[2] / 127);
      return true;
    }

    if (cmd === 0xb0 && KNOB_MAP[data[1]]) {
      setStatus('K' + (data[1] - 20) + ': ' + KNOB_MAP[data[1]] + ' ' + data[2]);
      return false;
    }

    if ((cmd === 0x90 || cmd === 0x80) && PAD_NOTES.includes(data[1])) {
      return false;
    }

    const mapped = DEFAULT_BUTTONS[sig];
    if (mapped) {
      return action(mapped, isDown);
    }

    if (isDown) {
      const read = $('lkLast');
      if (read) read.textContent = 'UNMAPPED MIDI ' + sig + ' [' + data.join(',') + ']';
    }
    return false;
  }

  function wrapMidiInput(input) {
    if (!input || input.__choppaLaunchkeyWrapped) return;
    input.__choppaLaunchkeyWrapped = true;
    let appHandler = null;
    try {
      Object.defineProperty(input, 'onmidimessage', {
        configurable: true,
        get() { return appHandler; },
        set(fn) { appHandler = typeof fn === 'function' ? fn : null; }
      });
      input.addEventListener('midimessage', ev => {
        const handled = handleMidi(ev, appHandler);
        if (!handled && appHandler) appHandler.call(input, ev);
      });
    } catch {
      input.addEventListener('midimessage', ev => handleMidi(ev, null));
    }
  }

  function patchMidiAccess() {
    if (!navigator.requestMIDIAccess || navigator.__choppaLaunchkeyMidiPatch) return;
    navigator.__choppaLaunchkeyMidiPatch = true;
    const original = navigator.requestMIDIAccess.bind(navigator);
    navigator.requestMIDIAccess = async options => {
      const access = await original(options || undefined);
      access.inputs.forEach(wrapMidiInput);
      access.addEventListener?.('statechange', () => access.inputs.forEach(wrapMidiInput));
      return access;
    };
  }

  function boot() {
    document.body.classList.add('lk-v23');
    css();
    installPanel();
    enforcePadLabels();
    patchMidiAccess();
    document.addEventListener('keydown', e => keyboardAction(e, true), true);
    document.addEventListener('keyup', e => keyboardAction(e, false), true);
    const pads = $('pads');
    if (pads) {
      new MutationObserver(enforcePadLabels).observe(pads, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    }
    setInterval(enforcePadLabels, 650);
    setStatus('Launchkey map loaded: pads = 1-8 / Q-I');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
