// THE CHOPPA — loop / pad-light state hotfix v24
// Keeps tap-loop UI from relighting after stop/clear and makes touch taps release cleanly.
(() => {
  if (window.__choppaLoopStateV24) return;
  window.__choppaLoopStateV24 = true;

  const $ = id => document.getElementById(id);
  const padList = () => Array.from(document.querySelectorAll('.pad'));
  let cleanUntil = 0;
  let lastCleanReason = '';

  function setStatus(text) {
    const upload = $('uploadStatus');
    const badge = $('badge');
    if (upload) upload.textContent = text;
    if (badge) badge.textContent = text;
  }

  function hasSlice(pad) {
    return !!pad?.querySelector?.('.slicetag')?.textContent?.trim();
  }

  function normalizePad(pad) {
    if (!pad) return;
    pad.classList.remove('playing', 'looping', 'queued', 'is-on', 'is-neutral');
    pad.classList.toggle('is-ready', hasSlice(pad));
    pad.classList.toggle('is-off', !hasSlice(pad));
  }

  function normalizeLoopUi() {
    const loopState = $('loopState');
    if (loopState) {
      loopState.className = 'pill';
      loopState.innerHTML = 'Loop <strong>Off</strong>';
    }
    ['loopBtn', 'mobLoop', 'topLoopBtn'].forEach(id => {
      const btn = $(id);
      if (!btn) return;
      btn.classList.remove('active');
      btn.textContent = 'Tap Loop';
    });
    const region = $('loopRegion');
    const playhead = $('playhead');
    if (region) region.style.display = 'none';
    if (playhead) playhead.style.display = 'none';
  }

  function cleanPads(reason = 'Loop cleared') {
    cleanUntil = performance.now() + 2600;
    lastCleanReason = reason;
    padList().forEach(normalizePad);
    normalizeLoopUi();
    setStatus(reason);
  }

  function pulseClean(reason) {
    cleanPads(reason);
    [40, 120, 260, 520, 900, 1400, 2100, 2800].forEach(ms => {
      setTimeout(() => {
        if (performance.now() <= cleanUntil + 80) cleanPads(reason);
      }, ms);
    });
  }

  function stopLoopNow(reason = 'Loop cleared') {
    const clear = $('clearLoopBtn');
    if (clear) clear.click();
    pulseClean(reason);
  }

  function bindPointerCapture() {
    document.addEventListener('pointerdown', event => {
      const pad = event.target?.closest?.('.pad');
      if (!pad) return;
      try { pad.setPointerCapture(event.pointerId); } catch {}
    }, true);
  }

  function bindStops() {
    ['stopBtn', 'mobStop', 'clearLoopBtn'].forEach(id => {
      const btn = $(id);
      if (!btn || btn.__loopStateV24) return;
      btn.__loopStateV24 = true;
      btn.addEventListener('click', () => pulseClean(id === 'clearLoopBtn' ? 'Loop cleared' : 'Stopped'), false);
    });

    ['loopBtn', 'mobLoop', 'topLoopBtn'].forEach(id => {
      const btn = $(id);
      if (!btn || btn.__loopOffV24) return;
      btn.__loopOffV24 = true;
      btn.addEventListener('click', () => {
        setTimeout(() => {
          if (!btn.classList.contains('active')) stopLoopNow('Tap Loop off');
        }, 0);
      }, false);
    });
  }

  function watchLateLights() {
    const observer = new MutationObserver(items => {
      if (performance.now() > cleanUntil) return;
      items.forEach(item => {
        const pad = item.target;
        if (pad?.classList?.contains('playing') || pad?.classList?.contains('looping') || pad?.classList?.contains('queued') || pad?.classList?.contains('is-on')) {
          normalizePad(pad);
          setStatus(lastCleanReason || 'Loop cleared');
        }
      });
      normalizeLoopUi();
    });

    const attach = () => padList().forEach(pad => {
      if (pad.__loopStateObsV24) return;
      pad.__loopStateObsV24 = true;
      observer.observe(pad, { attributes: true, attributeFilter: ['class'] });
    });

    attach();
    const bodyObs = new MutationObserver(attach);
    bodyObs.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    bindPointerCapture();
    bindStops();
    watchLateLights();
    setTimeout(bindStops, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
