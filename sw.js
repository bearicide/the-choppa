const CHOPPA_CACHE = 'the-choppa-standalone-v17';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/choppa-icon.svg',
  './assets/the-choppa-bg.png',
  './assets/the-choppa-hero.png',
  './assets/the-choppa-shortcuts.png',
  './assets/mattbear-amen-to-that-demo.mp3'
];

const EXTRA_PATCH = `
<style id="pad-toggle-v17-style">
.choppa-extra-banks{margin:16px 0;border:1px solid rgba(117,255,53,.45);border-radius:14px;background:linear-gradient(180deg,rgba(7,9,13,.92),rgba(3,4,7,.82));box-shadow:0 12px 38px rgba(0,0,0,.35);overflow:hidden}.choppa-extra-banks .ceb-head{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.14)}.choppa-extra-banks h2{margin:0;font:900 1.05rem Space Grotesk,Inter,sans-serif;letter-spacing:-.03em}.choppa-extra-banks .ceb-body{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px}.choppa-extra-banks .ceb-box{border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(0,0,0,.28);padding:12px}.choppa-extra-banks .ceb-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.choppa-extra-banks .ceb-btn{min-height:36px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(12,14,20,.9);color:#fff;font:900 .68rem JetBrains Mono,monospace;text-transform:uppercase;padding:7px 10px}.choppa-extra-banks .ceb-btn.green{background:linear-gradient(180deg,#75ff35,#1f7e16);color:#061707}.choppa-extra-banks .ceb-btn.yellow{background:linear-gradient(180deg,#f6ff2e,#878300);color:#101100}.choppa-extra-banks .ceb-btn.red{background:linear-gradient(180deg,#ff3a36,#7f0909)}.choppa-extra-banks .ceb-btn.active{outline:2px solid rgba(246,255,46,.65)}.choppa-extra-banks .ceb-note{margin:8px 0 0;color:#bdb3a5;font:800 .72rem Inter,sans-serif;line-height:1.35}.choppa-extra-banks .ceb-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.choppa-extra-banks .ceb-slot{height:44px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:linear-gradient(180deg,#1a150b,#0b0907);color:#f6ff2e;font:900 .62rem JetBrains Mono,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px}.choppa-extra-banks .ceb-slot.loaded{background:linear-gradient(180deg,#12300e,#071407);color:#75ff35;border-color:rgba(117,255,53,.62)}.choppa-extra-banks input[type=range]{accent-color:#75ff35;max-width:160px}.choppa-extra-banks input[type=file]{display:none}.pad.pad-kill-flash{transition:none!important;filter:brightness(.55)!important}@media(max-width:900px){.choppa-extra-banks .ceb-body{grid-template-columns:1fr}.choppa-extra-banks .ceb-slots{grid-template-columns:repeat(2,1fr)}}
</style>
<script id="pad-toggle-v17">
(() => {
  const isTypingTarget = el => {
    const tag = (el && el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'select' || tag === 'textarea' || (el && el.isContentEditable);
  };

  const bankKeys = ['1','2','3','4','q','w','e','r','a','s','d','f','z','x','c','v'];
  let bankCtx = null;
  let bankBuffers = new Array(16).fill(null);
  let bankNames = new Array(16).fill('EMPTY');
  let bankPadMode = false;
  let bankSources = new Set();
  let bankVolume = 0.85;
  let killUntil = 0;

  function showStatus(text) {
    const currentRead = document.getElementById('currentRead');
    if (currentRead) currentRead.textContent = text;
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) uploadStatus.textContent = text;
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const fxBanks = {
    clean: { filter: 15000, reverb: .05, delay: .02, drive: .03, crush: 0, gate: 0, pitch: 0, pan: 0 },
    dirt: { filter: 9800, reverb: .07, delay: .04, drive: .38, crush: .28, gate: .06, pitch: 0, pan: 0 },
    dub: { filter: 10500, reverb: .22, delay: .42, drive: .14, crush: .04, gate: 0, pitch: 0, pan: 0 },
    robot: { filter: 6800, reverb: .04, delay: .08, drive: .24, crush: .78, gate: .18, pitch: -5, pan: 0 },
    wide: { filter: 14500, reverb: .18, delay: .12, drive: .06, crush: .02, gate: 0, pitch: 0, pan: .55 },
    chip: { filter: 12000, reverb: .03, delay: .03, drive: .18, crush: .92, gate: .04, pitch: 7, pan: 0 },
    swamp: { filter: 3400, reverb: .31, delay: .22, drive: .31, crush: .19, gate: .09, pitch: -3, pan: -.18 },
    panicclean: { filter: 15000, reverb: 0, delay: 0, drive: 0, crush: 0, gate: 0, pitch: 0, pan: 0 }
  };

  function applyFxBank(name) {
    const bank = fxBanks[name];
    if (!bank) return;
    Object.entries(bank).forEach(([id, value]) => setVal(id, value));
    showStatus('FX bank: ' + name.toUpperCase());
  }

  function randomFx() {
    setVal('filter', Math.round(900 + Math.random() * 16500));
    setVal('reverb', +(Math.random() * .36).toFixed(2));
    setVal('delay', +(Math.random() * .45).toFixed(2));
    setVal('drive', +(Math.random() * .72).toFixed(2));
    setVal('crush', +(Math.random() * .9).toFixed(2));
    setVal('gate', +(Math.random() * .35).toFixed(2));
    setVal('pitch', +(Math.random() * 14 - 7).toFixed(1));
    setVal('pan', +(Math.random() * 2 - 1).toFixed(2));
    showStatus('FX randomized');
  }

  function visualOff(pad, forceOff = false) {
    if (!pad) return;
    pad.classList.add('pad-kill-flash');
    pad.classList.remove('playing', 'looping', 'queued', 'is-on');
    pad.classList.remove(forceOff ? 'is-neutral' : 'is-off');
    pad.classList.add(forceOff ? 'is-off' : 'is-neutral');
    setTimeout(() => pad.classList.remove('pad-kill-flash'), 90);
  }

  function allPadsOff() {
    document.querySelectorAll('.pad').forEach(pad => visualOff(pad, false));
  }

  function hardStop(label = 'STOPPED') {
    killUntil = performance.now() + 450;
    const stop = document.getElementById('stopBtn') || document.getElementById('mobStop');
    if (stop) stop.click();
    bankSources.forEach(src => { try { src.stop(); } catch (_) {} });
    bankSources.clear();
    allPadsOff();
    const loopState = document.getElementById('loopState');
    if (loopState) {
      loopState.className = 'pill hot';
      loopState.innerHTML = label === 'PANIC STOP' ? 'PANIC <strong>Stopped</strong>' : 'Loop <strong>Off</strong>';
    }
    showStatus(label);
  }

  function isLitPad(pad) {
    return pad && pad.classList && (
      pad.classList.contains('playing') ||
      pad.classList.contains('looping') ||
      pad.classList.contains('queued') ||
      pad.classList.contains('is-on')
    );
  }

  function makeCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!bankCtx) bankCtx = new AC({ latencyHint: 'interactive' });
    return bankCtx;
  }

  async function loadBankFiles(files) {
    const ctx = makeCtx();
    const list = Array.from(files || []).filter(file => file.type.startsWith('audio') || /\.(mp3|wav|m4a|ogg|flac|aac|webm)$/i.test(file.name)).slice(0, 16);
    if (!list.length) {
      showStatus('No audio files found in that bank load. Tiny tragedy.');
      return;
    }
    showStatus('Loading sound bank: ' + list.length + ' file(s)');
    for (let i = 0; i < list.length; i++) {
      try {
        const raw = await list[i].arrayBuffer();
        bankBuffers[i] = await ctx.decodeAudioData(raw.slice(0));
        bankNames[i] = list[i].name.replace(/\.[^.]+$/, '').slice(0, 18);
      } catch (err) {
        bankBuffers[i] = null;
        bankNames[i] = 'BAD FILE';
      }
    }
    renderSlots();
    showStatus('Sound bank loaded: ' + list.length + ' slot(s)');
  }

  async function playBankSlot(i) {
    const buf = bankBuffers[i];
    if (!buf) return false;
    const ctx = makeCtx();
    await ctx.resume();
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = bankVolume;
    src.connect(gain).connect(ctx.destination);
    src.start();
    bankSources.add(src);
    src.onended = () => bankSources.delete(src);
    const pad = document.querySelectorAll('.pad')[i];
    if (pad) {
      pad.classList.add('playing', 'is-on');
      pad.classList.remove('is-off', 'is-neutral');
      setTimeout(() => visualOff(pad, false), Math.min(1800, Math.max(260, buf.duration * 1000)));
    }
    return true;
  }

  function renderSlots() {
    document.querySelectorAll('.ceb-slot').forEach((btn, i) => {
      btn.textContent = (i + 1) + ' ' + bankNames[i];
      btn.classList.toggle('loaded', !!bankBuffers[i]);
      const pad = document.querySelectorAll('.pad')[i];
      if (pad && bankBuffers[i]) {
        const em = pad.querySelector('em');
        if (em) em.textContent = 'BANK';
      }
    });
  }

  function autoPadOff(pad, ms = 700) {
    if (!pad) return;
    clearTimeout(pad.__autoOffTimer);
    pad.__autoOffTimer = setTimeout(() => {
      if (!pad.classList.contains('looping')) visualOff(pad, false);
    }, ms);
  }

  function installPadAutoOff() {
    const obs = new MutationObserver(items => {
      items.forEach(item => {
        const pad = item.target;
        if (isLitPad(pad) && !pad.classList.contains('looping')) autoPadOff(pad, 850);
      });
    });
    document.querySelectorAll('.pad').forEach(pad => obs.observe(pad, { attributes: true, attributeFilter: ['class'] }));
    document.addEventListener('pointerup', e => {
      const pad = e.target && e.target.closest && e.target.closest('.pad');
      if (pad && !pad.classList.contains('looping')) autoPadOff(pad, 120);
    }, true);
  }

  function injectPanel() {
    if (document.querySelector('.choppa-extra-banks')) return;
    const panel = document.createElement('section');
    panel.className = 'choppa-extra-banks wrap';
    panel.innerHTML = '<div class="ceb-head"><h2>More FX + Sound Banks</h2><div class="ceb-row"><button id="cebBankMode" class="ceb-btn yellow">Bank Pads OFF</button><button id="cebStopBank" class="ceb-btn red">Stop Bank</button></div></div><div class="ceb-body"><div class="ceb-box"><div class="ceb-row"><button class="ceb-btn" data-fxbank="clean">Clean</button><button class="ceb-btn" data-fxbank="dirt">Dirt</button><button class="ceb-btn" data-fxbank="dub">Dub</button><button class="ceb-btn" data-fxbank="robot">Robot</button><button class="ceb-btn" data-fxbank="wide">Wide</button><button class="ceb-btn" data-fxbank="chip">Chip</button><button class="ceb-btn" data-fxbank="swamp">Swamp</button><button class="ceb-btn" id="cebRandom">Random</button><button class="ceb-btn green" data-fxbank="panicclean">Reset FX</button></div><p class="ceb-note">FX banks set the existing knobs. Simple. No cathedral of menus.</p></div><div class="ceb-box"><div class="ceb-row"><label class="ceb-btn green" for="cebFiles">Load Sound Bank</label><input id="cebFiles" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac,.webm" multiple><label class="ceb-note">Vol <input id="cebVol" type="range" min="0" max="1" step=".01" value=".85"></label></div><div id="cebSlots" class="ceb-slots"></div><p class="ceb-note">Load up to 16 audio files. Bank Pads ON makes pads/keys play bank slots. Tap a lit pad to shut it off.</p></div></div>';
    const anchor = document.querySelector('.mainGrid') || document.querySelector('.waveCard') || document.querySelector('main');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor);
    else document.body.appendChild(panel);

    const slots = panel.querySelector('#cebSlots');
    for (let i = 0; i < 16; i++) {
      const btn = document.createElement('button');
      btn.className = 'ceb-slot';
      btn.textContent = (i + 1) + ' EMPTY';
      btn.addEventListener('click', () => playBankSlot(i));
      slots.appendChild(btn);
    }

    panel.querySelectorAll('[data-fxbank]').forEach(btn => btn.addEventListener('click', () => applyFxBank(btn.dataset.fxbank)));
    panel.querySelector('#cebRandom').addEventListener('click', randomFx);
    panel.querySelector('#cebFiles').addEventListener('change', e => loadBankFiles(e.target.files));
    panel.querySelector('#cebVol').addEventListener('input', e => { bankVolume = +e.target.value; });
    panel.querySelector('#cebStopBank').addEventListener('click', () => hardStop('BANK STOP'));
    panel.querySelector('#cebBankMode').addEventListener('click', e => {
      bankPadMode = !bankPadMode;
      e.currentTarget.classList.toggle('active', bankPadMode);
      e.currentTarget.textContent = bankPadMode ? 'Bank Pads ON' : 'Bank Pads OFF';
      showStatus(bankPadMode ? 'Sound bank pads armed' : 'Sound bank pads off');
    });
  }

  document.addEventListener('pointerdown', e => {
    const pad = e.target && e.target.closest && e.target.closest('.pad');
    if (!pad) return;

    if (performance.now() < killUntil) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    if (isLitPad(pad)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      hardStop('PAD OFF');
      return;
    }

    if (bankPadMode) {
      const i = Array.from(document.querySelectorAll('.pad')).indexOf(pad);
      if (i > -1 && bankBuffers[i]) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        playBankSlot(i);
      }
    }
  }, true);

  window.addEventListener('keydown', e => {
    if (isTypingTarget(e.target)) return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      hardStop('PANIC STOP');
      return;
    }
    if (performance.now() < killUntil) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }
    if (bankPadMode) {
      const i = bankKeys.indexOf(e.key.toLowerCase());
      if (i > -1 && bankBuffers[i]) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        playBankSlot(i);
      }
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectPanel(); installPadAutoOff(); });
  } else {
    injectPanel();
    installPadAutoOff();
  }
})();
</script>`;

async function patchHtml(response) {
  const html = await response.text();
  if (html.includes('pad-toggle-v17')) return new Response(html, response);
  return new Response(html.replace('</body>', `${EXTRA_PATCH}\n</body>`), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

function shouldPatch(request) {
  const url = new URL(request.url);
  return request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CHOPPA_CACHE)
      .then(cache => Promise.allSettled(CORE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CHOPPA_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (shouldPatch(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          if (response.ok) caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
          return patchHtml(response);
        })
        .catch(() => caches.match(event.request).then(cached => cached ? patchHtml(cached) : cached))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        const url = new URL(event.request.url);
        if (url.origin === location.origin && response.ok) {
          caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
