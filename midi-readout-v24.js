(() => {
  if (window.__choppaMidiReadoutV24) return;
  window.__choppaMidiReadoutV24 = true;

  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const logs = [];
  let midiAccess = null;
  let armed = false;

  function css(){
    if ($('midi-readout-v24-css')) return;
    const style = document.createElement('style');
    style.id = 'midi-readout-v24-css';
    style.textContent = `
      .midiReadoutScreen{order:2;margin:0 0 14px;border:1px solid rgba(32,231,255,.34);border-radius:16px;background:linear-gradient(180deg,rgba(8,13,20,.94),rgba(3,5,9,.86));box-shadow:0 18px 44px rgba(0,0,0,.34);overflow:hidden;color:#fff7e8}
      .midiReadoutScreen *{box-sizing:border-box}.midiReadoutHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12);background:linear-gradient(90deg,rgba(32,231,255,.12),rgba(255,63,167,.10))}.midiReadoutHead h2{margin:0;font:900 1.05rem Space Grotesk,Inter,sans-serif;letter-spacing:-.02em}.midiReadoutHead p{margin:3px 0 0;color:#bdb3a5;font:700 .78rem Inter,system-ui,sans-serif}.midiReadoutActions{display:flex;gap:8px;flex-wrap:wrap}.midiReadoutBtn{min-height:38px;border:1px solid rgba(255,255,255,.16);border-radius:9px;background:rgba(12,15,22,.94);color:#fff;font:900 .72rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.03em;padding:8px 11px}.midiReadoutBtn.primary{background:linear-gradient(180deg,#20e7ff,#136d8e);color:#031015}.midiReadoutBtn.safe{background:linear-gradient(180deg,#75ff35,#1f7e16);color:#061707}.midiReadoutBody{display:grid;grid-template-columns:minmax(280px,.72fr) minmax(360px,1fr);gap:12px;padding:14px}.midiReadoutCard{border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(0,0,0,.24);padding:12px;min-width:0}.midiReadoutLabel{display:block;margin-bottom:6px;color:#bdb3a5;font:800 .68rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em}.midiReadoutBig{font:900 clamp(1.35rem,3vw,2.35rem)/1.05 Space Grotesk,Inter,sans-serif;letter-spacing:-.04em;overflow-wrap:anywhere}.midiReadoutSub{margin-top:8px;color:#e7dfd2;font:700 .92rem Inter,system-ui,sans-serif;line-height:1.35}.midiReadoutGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.midiReadoutValue{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.045);padding:10px}.midiReadoutValue b{display:block;margin-bottom:4px;color:#fff;font:900 .72rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}.midiReadoutValue span{font:800 1rem Inter,system-ui,sans-serif;color:#f6ff2e;overflow-wrap:anywhere}.midiReadoutBytes{font-family:JetBrains Mono,ui-monospace,monospace!important;letter-spacing:.02em}.midiReadoutLog{display:grid;gap:7px;max-height:260px;overflow:auto;padding-right:3px}.midiReadoutLogItem{display:grid;grid-template-columns:84px minmax(0,1fr);gap:9px;align-items:start;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);padding:8px 10px}.midiReadoutTime{color:#20e7ff;font:800 .72rem JetBrains Mono,ui-monospace,monospace}.midiReadoutMsg strong{display:block;color:#fff;font:900 .82rem Inter,system-ui,sans-serif}.midiReadoutMsg span{display:block;margin-top:2px;color:#bdb3a5;font:700 .76rem Inter,system-ui,sans-serif;overflow-wrap:anywhere}.midiReadoutStatus{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 10px;color:#bdb3a5;font:900 .7rem Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em}.midiReadoutDot{width:8px;height:8px;border-radius:50%;background:#ff3a36;box-shadow:0 0 10px currentColor}.midiReadoutStatus.on{color:#75ff35}.midiReadoutStatus.on .midiReadoutDot{background:#75ff35}.midiReadoutStatus.warn{color:#f6ff2e}.midiReadoutStatus.warn .midiReadoutDot{background:#f6ff2e}@media(max-width:960px){.midiReadoutBody{grid-template-columns:1fr}.midiReadoutGrid{grid-template-columns:1fr}.midiReadoutHead{align-items:flex-start;flex-direction:column}.midiReadoutLogItem{grid-template-columns:72px minmax(0,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function install(){
    if ($('midiReadoutScreen')) return;
    css();
    const screen = document.createElement('section');
    screen.id = 'midiReadoutScreen';
    screen.className = 'midiReadoutScreen';
    screen.innerHTML = `
      <div class="midiReadoutHead">
        <div>
          <h2>MIDI Readout Screen</h2>
          <p>Diagnostic only. It listens and displays. It does not remap or trigger anything.</p>
        </div>
        <div class="midiReadoutActions">
          <span id="midiReadoutStatus" class="midiReadoutStatus warn"><i class="midiReadoutDot"></i> Monitor Off</span>
          <button id="midiReadoutStart" class="midiReadoutBtn primary">Start Readout</button>
          <button id="midiReadoutClear" class="midiReadoutBtn">Clear</button>
        </div>
      </div>
      <div class="midiReadoutBody">
        <div class="midiReadoutCard">
          <span class="midiReadoutLabel">Latest Hardware Message</span>
          <div id="midiReadoutType" class="midiReadoutBig">Waiting for MIDI</div>
          <div id="midiReadoutDesc" class="midiReadoutSub">Click Start Readout, then press a Launchkey button, pad, knob, wheel, or strip.</div>
          <div class="midiReadoutGrid">
            <div class="midiReadoutValue"><b>Source</b><span id="midiReadoutSource">None</span></div>
            <div class="midiReadoutValue"><b>Channel</b><span id="midiReadoutChannel">-</span></div>
            <div class="midiReadoutValue"><b>Signature</b><span id="midiReadoutSig" class="midiReadoutBytes">-</span></div>
            <div class="midiReadoutValue"><b>Raw Bytes</b><span id="midiReadoutBytes" class="midiReadoutBytes">-</span></div>
          </div>
        </div>
        <div class="midiReadoutCard">
          <span class="midiReadoutLabel">Readable Event Log</span>
          <div id="midiReadoutLog" class="midiReadoutLog"><div class="midiReadoutLogItem"><div class="midiReadoutTime">--:--:--</div><div class="midiReadoutMsg"><strong>No messages yet</strong><span>No tiny corner goblin text. Revolutionary.</span></div></div></div>
        </div>
      </div>`;
    const main = q('main.app') || q('.app.wrap') || document.body;
    const anchor = q('.mainGrid') || q('.waveCard') || q('.helpGrid');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(screen, anchor);
    else main.appendChild(screen);
    $('midiReadoutStart').addEventListener('click', start);
    $('midiReadoutClear').addEventListener('click', clear);
  }

  function status(text, cls){
    const el = $('midiReadoutStatus');
    if (!el) return;
    el.className = 'midiReadoutStatus ' + (cls || '');
    el.innerHTML = '<i class="midiReadoutDot"></i> ' + text;
  }

  function time(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  }

  function sig(data){
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

  function parse(data){
    const st = data[0], cmd = st & 240, ch = (st & 15) + 1, d1 = data[1] ?? 0, d2 = data[2] ?? 0;
    if (cmd === 144 && d2 > 0) return {type:'NOTE ON', desc:'Note ' + d1 + ' · velocity ' + d2, ch};
    if (cmd === 128 || (cmd === 144 && d2 === 0)) return {type:'NOTE OFF', desc:'Note ' + d1 + ' released', ch};
    if (cmd === 176) return {type:'CONTROL CHANGE', desc:'CC ' + d1 + ' · value ' + d2, ch};
    if (cmd === 224) {
      const raw = d1 + (d2 << 7);
      const pct = Math.round(((raw - 8192) / 8192) * 100);
      return {type:'PITCH BEND', desc:'Raw ' + raw + ' · ' + pct + '%', ch};
    }
    if (cmd === 192) return {type:'PROGRAM CHANGE', desc:'Program ' + d1, ch};
    if (cmd === 208) return {type:'CHANNEL PRESSURE', desc:'Pressure ' + d1, ch};
    if (cmd === 160) return {type:'POLY AFTERTOUCH', desc:'Note ' + d1 + ' · pressure ' + d2, ch};
    if (st >= 248) return {type:'REALTIME / TRANSPORT', desc:'Status byte ' + st, ch:'system'};
    return {type:'RAW MIDI', desc:'Unclassified message', ch};
  }

  function renderLog(){
    const box = $('midiReadoutLog');
    if (!box) return;
    box.innerHTML = logs.slice(0, 10).map(item => `
      <div class="midiReadoutLogItem">
        <div class="midiReadoutTime">${item.time}</div>
        <div class="midiReadoutMsg"><strong>${item.type}</strong><span>${item.desc} · ${item.sig}</span></div>
      </div>`).join('');
  }

  function onMidi(ev){
    const data = Array.from(ev.data || []);
    if (!data.length) return;
    const parsed = parse(data);
    const signature = sig(data);
    const source = ev.currentTarget?.name || ev.target?.name || 'MIDI device';
    $('midiReadoutType').textContent = parsed.type;
    $('midiReadoutDesc').textContent = parsed.desc;
    $('midiReadoutSource').textContent = source;
    $('midiReadoutChannel').textContent = String(parsed.ch);
    $('midiReadoutSig').textContent = signature;
    $('midiReadoutBytes').textContent = data.join(', ');
    logs.unshift({time:time(), type:parsed.type, desc:parsed.desc, sig:signature});
    logs.splice(10);
    renderLog();
  }

  function attachInputs(){
    if (!midiAccess) return;
    let count = 0;
    midiAccess.inputs.forEach(input => {
      count++;
      if (input.__choppaReadoutV24) return;
      input.__choppaReadoutV24 = true;
      input.addEventListener('midimessage', onMidi);
    });
    status(count ? 'Monitoring ' + count + ' Input' + (count === 1 ? '' : 's') : 'No MIDI Inputs', count ? 'on' : 'warn');
  }

  async function start(){
    if (armed) { attachInputs(); return; }
    if (!navigator.requestMIDIAccess) {
      status('MIDI Unsupported', '');
      $('midiReadoutDesc').textContent = 'This browser does not support Web MIDI.';
      return;
    }
    try {
      status('Requesting MIDI', 'warn');
      midiAccess = await navigator.requestMIDIAccess();
      armed = true;
      attachInputs();
      midiAccess.addEventListener?.('statechange', attachInputs);
      $('midiReadoutDesc').textContent = 'Press any Launchkey control. This screen will capture the exact message without changing Choppa behavior.';
    } catch (err) {
      status('MIDI Blocked', '');
      $('midiReadoutDesc').textContent = 'MIDI permission was blocked or unavailable: ' + err.message;
    }
  }

  function clear(){
    logs.length = 0;
    $('midiReadoutType').textContent = 'Waiting for MIDI';
    $('midiReadoutDesc').textContent = 'Log cleared. Press a Launchkey control.';
    $('midiReadoutSource').textContent = 'None';
    $('midiReadoutChannel').textContent = '-';
    $('midiReadoutSig').textContent = '-';
    $('midiReadoutBytes').textContent = '-';
    renderLog();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
