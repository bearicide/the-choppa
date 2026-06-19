(() => {
  if (window.__choppaMidiCaptureV25) return;
  window.__choppaMidiCaptureV25 = true;

  const TARGETS = [
    ['shift', 'Shift'],
    ['transpose', 'Transpose'],
    ['octDown', 'Octave Down'],
    ['octUp', 'Octave Up'],
    ['right', 'Right Arrow'],
    ['stopSoloMute', 'Stop / Solo / Mute'],
    ['arp', 'Arp'],
    ['fixedChord', 'Fixed Chord'],
    ['play', 'Play'],
    ['record', 'Record'],
    ['pitch', 'Pitch Strip / Wheel'],
    ['mod', 'Mod Strip / Wheel']
  ];

  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const STORAGE_KEY = 'choppa.launchkey.capture.v25';
  let midiAccess = null;
  let activeTarget = TARGETS[0][0];
  let armed = false;
  let captures = loadCaptures();

  function loadCaptures() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch { return {}; }
  }

  function saveCaptures() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captures, null, 2));
  }

  function css() {
    if ($('midi-capture-v25-css')) return;
    const style = document.createElement('style');
    style.id = 'midi-capture-v25-css';
    style.textContent = `
      .midiCapturePanel{order:3;margin:0 0 14px;border:1px solid rgba(246,255,46,.30);border-radius:16px;background:linear-gradient(180deg,rgba(12,13,18,.94),rgba(4,5,9,.88));box-shadow:0 18px 44px rgba(0,0,0,.34);overflow:hidden;color:#fff7e8}
      .midiCapturePanel *{box-sizing:border-box}.midiCaptureHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12);background:linear-gradient(90deg,rgba(246,255,46,.13),rgba(32,231,255,.09))}.midiCaptureHead h2{margin:0;font:900 1.08rem Space Grotesk,Inter,sans-serif;letter-spacing:-.02em}.midiCaptureHead p{margin:4px 0 0;color:#bdb3a5;font:700 .79rem Inter,system-ui,sans-serif;line-height:1.35}.midiCaptureActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.midiCaptureBtn{min-height:38px;border:1px solid rgba(255,255,255,.16);border-radius:9px;background:rgba(12,15,22,.94);color:#fff;font:900 .72rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.03em;padding:8px 11px}.midiCaptureBtn.primary{background:linear-gradient(180deg,#f6ff2e,#898700);color:#101100}.midiCaptureBtn.danger{background:linear-gradient(180deg,#ff3a36,#7f0909)}.midiCaptureStatus{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 10px;color:#f6ff2e;font:900 .7rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em}.midiCaptureStatus i{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}.midiCaptureStatus.on{color:#75ff35}.midiCaptureBody{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(360px,1fr);gap:12px;padding:14px}.midiCaptureTargets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.midiCaptureTarget{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.045);padding:10px;text-align:left}.midiCaptureTarget.active{outline:2px solid rgba(246,255,46,.52);background:rgba(246,255,46,.08)}.midiCaptureTarget.done{border-color:rgba(117,255,53,.42)}.midiCaptureTarget strong{font:900 .84rem Inter,system-ui,sans-serif;color:#fff}.midiCaptureTarget small{display:block;margin-top:3px;color:#bdb3a5;font:700 .72rem Inter,system-ui,sans-serif;overflow-wrap:anywhere}.midiCaptureBadge{border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px 8px;color:#bdb3a5;font:900 .62rem Inter,system-ui,sans-serif;text-transform:uppercase}.midiCaptureTarget.done .midiCaptureBadge{color:#75ff35}.midiCaptureScreen{border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(0,0,0,.24);padding:12px;min-width:0}.midiCaptureLabel{display:block;margin-bottom:6px;color:#bdb3a5;font:800 .68rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em}.midiCaptureBig{font:900 clamp(1.45rem,3vw,2.45rem)/1.05 Space Grotesk,Inter,sans-serif;letter-spacing:-.04em;overflow-wrap:anywhere}.midiCaptureSub{margin-top:8px;color:#e7dfd2;font:700 .92rem Inter,system-ui,sans-serif;line-height:1.38}.midiCaptureData{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.midiCaptureValue{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.045);padding:10px}.midiCaptureValue b{display:block;margin-bottom:4px;color:#fff;font:900 .72rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}.midiCaptureValue span{font:800 1rem Inter,system-ui,sans-serif;color:#20e7ff;overflow-wrap:anywhere}.midiCaptureMono{font-family:JetBrains Mono,ui-monospace,monospace!important}.midiCaptureExport{width:100%;min-height:118px;margin-top:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(0,0,0,.28);color:#f6ff2e;font:800 .74rem/1.4 JetBrains Mono,ui-monospace,monospace;padding:10px;resize:vertical}@media(max-width:980px){.midiCaptureBody{grid-template-columns:1fr}.midiCaptureTargets{grid-template-columns:1fr}.midiCaptureHead{flex-direction:column}.midiCaptureActions{justify-content:flex-start}.midiCaptureData{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    if ($('midiCapturePanel')) return;
    css();
    const panel = document.createElement('section');
    panel.id = 'midiCapturePanel';
    panel.className = 'midiCapturePanel';
    panel.innerHTML = `
      <div class="midiCaptureHead">
        <div>
          <h2>Launchkey Capture Checklist</h2>
          <p>Select a control, press the matching Launchkey button once, then move on. Capture only. No remap. No triggering. No little gremlin guesses.</p>
        </div>
        <div class="midiCaptureActions">
          <span id="midiCaptureStatus" class="midiCaptureStatus"><i></i> Capture Off</span>
          <button id="midiCaptureStart" class="midiCaptureBtn primary">Start Capture</button>
          <button id="midiCaptureNext" class="midiCaptureBtn">Next Empty</button>
          <button id="midiCaptureCopy" class="midiCaptureBtn">Copy JSON</button>
          <button id="midiCaptureClear" class="midiCaptureBtn danger">Clear</button>
        </div>
      </div>
      <div class="midiCaptureBody">
        <div id="midiCaptureTargets" class="midiCaptureTargets"></div>
        <div class="midiCaptureScreen">
          <span class="midiCaptureLabel">Current Capture</span>
          <div id="midiCaptureName" class="midiCaptureBig">${labelFor(activeTarget)}</div>
          <div id="midiCaptureHelp" class="midiCaptureSub">Click Start Capture, select a Launchkey control on the left, then press the matching hardware button once.</div>
          <div class="midiCaptureData">
            <div class="midiCaptureValue"><b>Signature</b><span id="midiCaptureSig" class="midiCaptureMono">-</span></div>
            <div class="midiCaptureValue"><b>Type</b><span id="midiCaptureType">-</span></div>
            <div class="midiCaptureValue"><b>Channel</b><span id="midiCaptureChannel">-</span></div>
            <div class="midiCaptureValue"><b>Raw Bytes</b><span id="midiCaptureBytes" class="midiCaptureMono">-</span></div>
          </div>
          <textarea id="midiCaptureExport" class="midiCaptureExport" readonly spellcheck="false"></textarea>
        </div>
      </div>`;

    const main = q('main.app') || q('.app.wrap') || document.body;
    const after = $('midiReadoutScreen') || q('.mainGrid') || q('.waveCard');
    if (after && after.parentNode) after.parentNode.insertBefore(panel, after.nextSibling);
    else main.appendChild(panel);

    $('midiCaptureStart').addEventListener('click', start);
    $('midiCaptureNext').addEventListener('click', nextEmpty);
    $('midiCaptureCopy').addEventListener('click', copyJson);
    $('midiCaptureClear').addEventListener('click', clearCaptures);
    render();
  }

  function labelFor(id) {
    return (TARGETS.find(t => t[0] === id) || [id, id])[1];
  }

  function status(text, on) {
    const el = $('midiCaptureStatus');
    if (!el) return;
    el.className = 'midiCaptureStatus' + (on ? ' on' : '');
    el.innerHTML = '<i></i> ' + text;
  }

  function signature(data) {
    const st = data[0], cmd = st & 240, ch = (st & 15) + 1;
    if (st >= 248) return 'realtime:' + st;
    if (cmd === 144 || cmd === 128) return 'note:' + data[1];
    if (cmd === 176) return 'cc:' + data[1];
    if (cmd === 224) return 'pitchbend:ch' + ch;
    if (cmd === 192) return 'program:' + data[1];
    if (cmd === 208) return 'pressure:ch' + ch;
    if (cmd === 160) return 'poly:' + data[1];
    return 'raw:' + data.join('-');
  }

  function typeOf(data) {
    const st = data[0], cmd = st & 240, d2 = data[2] ?? 0;
    if (cmd === 144 && d2 > 0) return 'NOTE ON';
    if (cmd === 128 || (cmd === 144 && d2 === 0)) return 'NOTE OFF';
    if (cmd === 176) return 'CONTROL CHANGE';
    if (cmd === 224) return 'PITCH BEND';
    if (cmd === 192) return 'PROGRAM CHANGE';
    if (cmd === 208) return 'CHANNEL PRESSURE';
    if (cmd === 160) return 'POLY AFTERTOUCH';
    if (st >= 248) return 'REALTIME / TRANSPORT';
    return 'RAW MIDI';
  }

  function channelOf(data) {
    const st = data[0];
    if (st >= 240) return 'system';
    return String((st & 15) + 1);
  }

  function onMidi(ev) {
    const data = Array.from(ev.data || []);
    if (!data.length || !activeTarget) return;
    const rec = {
      label: labelFor(activeTarget),
      signature: signature(data),
      type: typeOf(data),
      channel: channelOf(data),
      raw: data,
      source: ev.currentTarget?.name || ev.target?.name || 'MIDI device',
      capturedAt: new Date().toISOString()
    };
    captures[activeTarget] = rec;
    saveCaptures();
    render();
    nextEmpty(false);
  }

  function render() {
    const box = $('midiCaptureTargets');
    if (box) {
      box.innerHTML = TARGETS.map(([id, label]) => {
        const rec = captures[id];
        return `<button class="midiCaptureTarget ${id === activeTarget ? 'active' : ''} ${rec ? 'done' : ''}" data-target="${id}">
          <span><strong>${label}</strong><small>${rec ? rec.signature + ' · ' + rec.raw.join(', ') : 'Not captured yet'}</small></span>
          <span class="midiCaptureBadge">${rec ? 'saved' : 'empty'}</span>
        </button>`;
      }).join('');
      box.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTarget = btn.dataset.target;
          render();
        });
      });
    }

    const rec = captures[activeTarget];
    if ($('midiCaptureName')) $('midiCaptureName').textContent = labelFor(activeTarget);
    if ($('midiCaptureHelp')) $('midiCaptureHelp').textContent = rec ? 'Captured. Press the control again to replace it, or move to the next empty slot.' : 'Waiting for this Launchkey control. Press it once.';
    if ($('midiCaptureSig')) $('midiCaptureSig').textContent = rec?.signature || '-';
    if ($('midiCaptureType')) $('midiCaptureType').textContent = rec?.type || '-';
    if ($('midiCaptureChannel')) $('midiCaptureChannel').textContent = rec?.channel || '-';
    if ($('midiCaptureBytes')) $('midiCaptureBytes').textContent = rec ? rec.raw.join(', ') : '-';
    if ($('midiCaptureExport')) $('midiCaptureExport').value = JSON.stringify(captures, null, 2);
  }

  function attachInputs() {
    if (!midiAccess) return;
    let count = 0;
    midiAccess.inputs.forEach(input => {
      count++;
      if (input.__choppaCaptureV25) return;
      input.__choppaCaptureV25 = true;
      input.addEventListener('midimessage', onMidi);
    });
    status(count ? 'Capturing ' + count + ' Input' + (count === 1 ? '' : 's') : 'No Inputs', !!count);
  }

  async function start() {
    if (armed) { attachInputs(); return; }
    if (!navigator.requestMIDIAccess) {
      status('MIDI Unsupported', false);
      if ($('midiCaptureHelp')) $('midiCaptureHelp').textContent = 'This browser does not support Web MIDI.';
      return;
    }
    try {
      status('Requesting MIDI', false);
      midiAccess = await navigator.requestMIDIAccess();
      armed = true;
      attachInputs();
      midiAccess.addEventListener?.('statechange', attachInputs);
      if ($('midiCaptureHelp')) $('midiCaptureHelp').textContent = 'Capture is armed. Select a control and press the matching Launchkey hardware button.';
    } catch (err) {
      status('MIDI Blocked', false);
      if ($('midiCaptureHelp')) $('midiCaptureHelp').textContent = 'MIDI permission blocked or unavailable: ' + err.message;
    }
  }

  function nextEmpty(showCurrent = true) {
    const next = TARGETS.find(([id]) => !captures[id]);
    if (next) activeTarget = next[0];
    else if (showCurrent && TARGETS[0]) activeTarget = TARGETS[0][0];
    render();
  }

  async function copyJson() {
    const text = JSON.stringify(captures, null, 2);
    if ($('midiCaptureExport')) $('midiCaptureExport').value = text;
    try {
      await navigator.clipboard.writeText(text);
      status('Copied JSON', true);
    } catch {
      status('Copy Failed', false);
      const area = $('midiCaptureExport');
      if (area) area.select();
    }
  }

  function clearCaptures() {
    captures = {};
    saveCaptures();
    activeTarget = TARGETS[0][0];
    render();
    status(armed ? 'Capturing' : 'Capture Off', armed);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
