// THE CHOPPA — pad/layout hotfix v23
// Fixes the performance grid to 8x2 and restores the intended keyboard map.
(() => {
  const STORE = 'choppaPadMap';
  const VERSION = 'choppaPadLayoutVersion';
  const wantedKeys = ['1','2','3','4','5','6','7','8','q','w','e','r','t','y','u','i'];
  const wantedNotes = [40,41,42,43,48,49,50,51,36,37,38,39,44,45,46,47];
  const oldGridKeys = ['1','2','3','4','q','w','e','r','a','s','d','f','z','x','c','v'];

  const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => String(v).toLowerCase() === String(b[i]).toLowerCase());
  const valid = map => map && Array.isArray(map.keys) && Array.isArray(map.notes) && map.keys.length === 16 && map.notes.length === 16;

  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    const needsDefaultRepair = !valid(saved) || same(saved.keys, oldGridKeys);
    if (needsDefaultRepair) {
      localStorage.setItem(STORE, JSON.stringify({ keys: wantedKeys, notes: wantedNotes }));
    }
    localStorage.setItem(VERSION, 'v23-8x2-launchkey');
  } catch {
    localStorage.setItem(STORE, JSON.stringify({ keys: wantedKeys, notes: wantedNotes }));
    localStorage.setItem(VERSION, 'v23-8x2-launchkey');
  }

  function injectLayout() {
    if (document.getElementById('choppa-pad-layout-v23')) return;
    const style = document.createElement('style');
    style.id = 'choppa-pad-layout-v23';
    style.textContent = `
      .mainGrid{grid-template-columns:minmax(360px,500px) minmax(680px,1fr)!important;align-items:start!important}
      .pads{grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:10px!important}
      .pad{height:96px!important;min-width:0!important;border-radius:14px!important}
      .pad .key{font-size:clamp(1.45rem,2.25vw,2.25rem)!important}
      .pad .padnum,.pad .midinote,.pad .slicetag,.pad .state{font-size:.48rem!important}
      .padControls{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      .loopControls{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      #mapRead:after{content:'  · 8x2 pad layout active';color:var(--g);font-weight:900}
      @media(max-width:1180px){.mainGrid{grid-template-columns:1fr!important}.pads{grid-template-columns:repeat(8,minmax(0,1fr))!important}.pad{height:88px!important}}
      @media(max-width:760px){.pads{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important}.pad{height:82px!important}.pad .key{font-size:1.9rem!important}.padControls,.loopControls{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayout, { once: true });
  } else {
    injectLayout();
  }
})();
