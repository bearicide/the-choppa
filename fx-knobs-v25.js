// THE CHOPPA — intuitive FX-over-pads hotfix v25
// Moves FX knobs above pads, spreads them out, and limits pitch knob to +/- 6 semitones.
(() => {
  if (window.__choppaFxKnobsV25) return;
  window.__choppaFxKnobsV25 = true;

  const $ = id => document.getElementById(id);

  const labels = {
    filter: ['Brightness', 'dark ← → clear'],
    reverb: ['Space', 'dry ← → roomy'],
    delay: ['Echo', 'tight ← → repeats'],
    drive: ['Crunch', 'clean ← → hot'],
    crush: ['Lo-Fi', 'smooth ← → broken'],
    gate: ['Tight Chop', 'loose ← → clipped'],
    pitch: ['Pitch ±6', 'down ← → up'],
    pan: ['Left / Right', 'left ← center → right']
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setStatus(text) {
    const upload = $('uploadStatus');
    const badge = $('badge');
    if (upload) upload.textContent = text;
    if (badge) badge.textContent = text;
  }

  function clampPitch() {
    const pitch = $('pitch');
    if (!pitch) return;
    pitch.min = '-6';
    pitch.max = '6';
    pitch.step = '0.1';
    const next = clamp(Number(pitch.value || 0), -6, 6);
    if (Number(pitch.value) !== next) {
      pitch.value = String(next);
      pitch.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const out = $('pitchVal');
    if (out) out.textContent = (next > 0 ? '+' : '') + next.toFixed(1);
  }

  function relabelKnobs() {
    document.querySelectorAll('#fx .knob').forEach(knob => {
      const input = knob.querySelector('input[type="range"]');
      if (!input || !labels[input.id]) return;
      const [name, hint] = labels[input.id];
      const strong = knob.querySelector('strong');
      if (strong) strong.textContent = name;
      let note = knob.querySelector('.fxHintV25');
      if (!note) {
        note = document.createElement('span');
        note.className = 'fxHintV25';
        knob.appendChild(note);
      }
      note.textContent = hint;
      knob.dataset.fxName = name;
    });
  }

  function moveFxAbovePads() {
    const fxCard = $('fx')?.closest('.card');
    const padsCard = $('pads')?.closest('.card');
    const grid = padsCard?.closest('.mainGrid') || fxCard?.closest('.mainGrid');
    if (!fxCard || !padsCard || !grid) return;

    fxCard.classList.add('fxTopV25');
    padsCard.classList.add('padsBelowV25');

    if (fxCard.nextElementSibling !== padsCard) {
      grid.insertBefore(fxCard, padsCard);
    }

    const title = fxCard.querySelector('.title h2');
    if (title) title.textContent = '🎚 Touch FX — shape the pads';

    let helper = fxCard.querySelector('.fxExplainV25');
    if (!helper) {
      helper = document.createElement('div');
      helper.className = 'fxExplainV25';
      helper.textContent = 'Big controls first: brightness, space, echo, crunch, lo-fi, tightness, pitch, stereo.';
      fxCard.querySelector('.title')?.appendChild(helper);
    }
  }

  function injectCss() {
    if ($('fx-knobs-v25-css')) return;
    const style = document.createElement('style');
    style.id = 'fx-knobs-v25-css';
    style.textContent = `
      .mainGrid{grid-template-columns:1fr!important;align-items:start!important;gap:14px!important}
      .mainGrid>.fxTopV25{order:-30!important;grid-column:1/-1!important;border-color:rgba(255,63,167,.58)!important}
      .mainGrid>.padsBelowV25{order:-20!important;grid-column:1/-1!important}
      .fxTopV25 .title{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;flex-wrap:wrap!important;padding:10px 18px!important}
      .fxExplainV25{color:var(--muted);font:800 .72rem Inter,sans-serif;line-height:1.25;max-width:620px;text-align:right}
      #fx{grid-template-columns:repeat(8,minmax(92px,1fr))!important;gap:16px!important;padding:18px 20px 16px!important;align-items:stretch!important}
      #fx .knob{min-height:172px!important;display:grid!important;grid-template-rows:auto 82px auto auto!important;align-items:center!important;gap:7px!important;padding:10px 9px!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:13px!important;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(0,0,0,.22))!important;text-align:center!important}
      #fx .knob strong{min-height:2.15em!important;display:grid!important;place-items:center!important;font:900 .82rem/1.08 Space Grotesk,Inter,sans-serif!important;letter-spacing:-.02em!important;text-transform:uppercase!important;color:#fff!important}
      #fx .dial{width:78px!important;height:78px!important;margin:0 auto!important}
      #fx .dial i{height:27px!important;transform-origin:50% 30px!important}
      #fx input[type=range]{width:100%!important;max-width:126px!important;margin:0 auto!important}
      #fx output{font:900 .76rem JetBrains Mono,monospace!important;color:#fff!important}
      .fxHintV25{display:block!important;min-height:2.2em!important;color:var(--muted)!important;font:800 .60rem/1.15 Inter,sans-serif!important;text-transform:uppercase!important;letter-spacing:.035em!important}
      @media(max-width:1180px){#fx{grid-template-columns:repeat(4,minmax(0,1fr))!important}.fxExplainV25{text-align:left}}
      @media(max-width:720px){#fx{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;padding:12px!important}#fx .knob{min-height:150px!important;grid-template-rows:auto 66px auto auto!important}.fxTopV25 .title{padding:9px 12px!important}.fxExplainV25{font-size:.66rem!important}#fx .dial{width:62px!important;height:62px!important}#fx .dial i{height:20px!important;transform-origin:50% 23px!important}}
    `;
    document.head.appendChild(style);
  }

  function boot() {
    injectCss();
    moveFxAbovePads();
    relabelKnobs();
    clampPitch();

    document.addEventListener('input', event => {
      if (event.target?.id === 'pitch') clampPitch();
    }, true);

    document.addEventListener('click', () => {
      requestAnimationFrame(() => {
        moveFxAbovePads();
        relabelKnobs();
        clampPitch();
      });
    }, true);

    setTimeout(() => {
      moveFxAbovePads();
      relabelKnobs();
      clampPitch();
      setStatus('FX moved above pads · pitch limited to ±6');
    }, 650);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
