(() => {
  if (window.__choppaAlignV22) return;
  window.__choppaAlignV22 = true;

  const STORE = 'choppaPadMap';
  const VERSION = 'choppaPadLayoutVersion';
  const wantedKeys = ['1','2','3','4','5','6','7','8','q','w','e','r','t','y','u','i'];
  const wantedNotes = [40,41,42,43,48,49,50,51,36,37,38,39,44,45,46,47];
  const oldGridKeys = ['1','2','3','4','q','w','e','r','a','s','d','f','z','x','c','v'];
  const oldProxy = { '5':'q','6':'w','7':'e','8':'r','q':'a','w':'s','e':'d','r':'f','t':'z','y':'x','u':'c','i':'v' };
  let fallbackProxyOn = false;

  const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => String(v).toLowerCase() === String(b[i]).toLowerCase());
  const valid = map => map && Array.isArray(map.keys) && Array.isArray(map.notes) && map.keys.length === 16 && map.notes.length === 16;

  function repairStoredMap(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!valid(saved) || same(saved.keys, oldGridKeys)) {
        localStorage.setItem(STORE, JSON.stringify({ keys: wantedKeys, notes: wantedNotes }));
      }
      localStorage.setItem(VERSION, 'v23-8x2-launchkey');
    } catch {
      localStorage.setItem(STORE, JSON.stringify({ keys: wantedKeys, notes: wantedNotes }));
      localStorage.setItem(VERSION, 'v23-8x2-launchkey');
    }
  }

  const css = `
  :root{--motionEase:cubic-bezier(.2,.7,.2,1);--softShadow:0 12px 34px rgba(0,0,0,.32);--panelTint:rgba(6,8,12,.84);--lineSoft:rgba(255,255,255,.14)}
  html{scroll-behavior:smooth}body{background:#05060a!important}.wrap{width:min(1440px,calc(100% - 24px))!important}.app.wrap{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;padding-top:14px!important}.top{box-shadow:0 6px 24px rgba(0,0,0,.28)}.nav{min-height:64px!important}.status{justify-content:flex-end}.pill{border-color:var(--lineSoft)!important;background:rgba(3,5,8,.66)!important}.card,.fxVoicePanel{border-color:var(--lineSoft)!important;background:linear-gradient(180deg,rgba(10,12,18,.86),rgba(4,5,8,.78))!important;box-shadow:var(--softShadow)!important}.deck{order:1!important;display:grid!important;grid-template-columns:300px minmax(0,1fr)!important;gap:14px!important;margin:0!important}.topControl{min-height:250px!important;grid-template-columns:minmax(0,1fr) 280px!important;gap:14px!important}.topTransport{grid-template-columns:64px 64px 132px 122px minmax(210px,1fr)!important;gap:8px!important}.big{width:64px!important;height:58px!important}.tapBig,.mapBig{height:58px!important}.miniStats{gap:6px!important}.mainGrid{order:2!important;display:grid!important;grid-template-columns:minmax(360px,500px) minmax(680px,1fr)!important;gap:14px!important;margin:0!important;align-items:start!important}.mainGrid>.card:has(#pads){order:-1!important}.mainGrid>.card:has(#fx){order:2!important}.padsWrap{padding:12px!important}.pads{display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:10px!important}.pad{height:96px!important;min-width:0!important;border-radius:14px!important}.pad .key{font-size:clamp(1.45rem,2.25vw,2.25rem)!important}.pad .padnum,.pad .midinote,.pad .slicetag,.pad .state{font-size:.48rem!important}.pad span{font-size:inherit}.pad small,.pad em{font-size:.52rem!important}.pad.is-on,.pad.on{animation:padPulse 1.4s var(--motionEase) infinite!important}.pad.queued{animation:queueBlink .8s steps(2,end) infinite!important}.pad.selected:not(.is-on):not(.on){outline:2px solid rgba(32,231,255,.55)!important;box-shadow:0 0 0 3px rgba(32,231,255,.1)!important}.padControls{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}.loopControls{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important}.loopControls .btn,.padControls select{min-height:38px!important}.waveCard{order:3!important;margin:0!important}.media,.media canvas{height:150px!important}.fxVoicePanel{order:4!important}.fxVoicePanel .body{grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr)!important;align-items:start}.fxVoicePanel .box{min-width:0}.fxVoicePanel .row{gap:7px!important}.fxBtn,.btn{transition:transform .12s var(--motionEase),filter .12s var(--motionEase),box-shadow .12s var(--motionEase)!important}.fxBtn:hover,.btn:hover{transform:translateY(-1px);filter:brightness(1.12)}.fxBtn:active,.btn:active{transform:translateY(1px) scale(.99)}.bankSlots{grid-template-columns:repeat(4,minmax(0,1fr))!important}.bankSlot{min-width:0}.helpGrid{order:5!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}.box,.read,.fxNote{overflow-wrap:anywhere}.controlGrid{align-content:start}.xyLive,.xy{height:198px!important}.xyDot{transition:left .08s linear,top .08s linear}.fx{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;padding:12px!important}.presets{grid-template-columns:repeat(4,minmax(0,1fr))!important;padding:0 12px 12px!important}.dial{width:58px!important;height:58px!important;box-shadow:0 0 12px currentColor!important}.knob strong{font-size:.68rem!important}.knob output{font-size:.62rem!important}@keyframes padPulse{0%,100%{filter:brightness(1);box-shadow:0 0 18px rgba(117,255,53,.45),inset 0 -7px rgba(0,0,0,.25)}50%{filter:brightness(1.14);box-shadow:0 0 28px rgba(117,255,53,.72),0 0 48px rgba(117,255,53,.24),inset 0 -7px rgba(0,0,0,.22)}}@keyframes queueBlink{50%{filter:brightness(1.4)}}@media(max-width:1180px){.deck,.mainGrid,.fxVoicePanel .body{grid-template-columns:1fr!important}.topControl{grid-template-columns:1fr!important}.controlGrid{max-width:520px}.pads{grid-template-columns:repeat(8,minmax(0,1fr))!important}.pad{height:88px!important}.fx{grid-template-columns:repeat(4,minmax(0,1fr))!important}}@media(max-width:760px){.wrap{width:calc(100% - 14px)!important}.nav{gap:8px}.brand b{font-size:1.35rem!important}.status .pill:nth-child(n+4){display:none!important}.app.wrap{gap:10px!important;padding-top:10px!important}.topTransport{grid-template-columns:repeat(4,1fr)!important}.miniStats{grid-column:1/-1!important;grid-template-columns:repeat(3,1fr)!important}.pads{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important}.pad{height:82px!important}.pad .key{font-size:1.9rem!important}.media,.media canvas{height:120px!important}.fx{grid-template-columns:repeat(2,minmax(0,1fr))!important}.helpGrid{grid-template-columns:1fr!important}.fxVoicePanel .head{align-items:flex-start;flex-direction:column}.bankSlots{grid-template-columns:repeat(2,minmax(0,1fr))!important}.xyLive,.xy{height:170px!important}.padControls,.loopControls{grid-template-columns:1fr!important}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
  `;

  function installCss(){
    if(document.getElementById('align-v22-css')) return;
    const style=document.createElement('style');
    style.id='align-v22-css';
    style.textContent=css;
    document.head.appendChild(style);
  }

  function moveSections(){
    const main=document.querySelector('.mainGrid');
    const wave=document.querySelector('.waveCard');
    const pads=document.getElementById('pads');
    const padCard=pads&&pads.closest('.card');
    if(main&&padCard) main.insertBefore(padCard, main.firstElementChild);
    if(main&&wave&&wave.parentNode) wave.parentNode.insertBefore(main,wave);
  }

  function visiblePadKeys(){
    return [...document.querySelectorAll('#pads .pad .key')].map(el => (el.textContent || '').trim().toLowerCase());
  }

  function enableFallbackProxyIfNeeded(){
    const keys = visiblePadKeys();
    fallbackProxyOn = keys.length === 16 && same(keys, oldGridKeys);
    const read = document.getElementById('mapRead');
    if(read && !read.dataset.layoutNote){
      read.dataset.layoutNote = '1';
      read.textContent += fallbackProxyOn ? ' · 8x2 fallback active' : ' · 8x2 pad layout active';
    }
  }

  function proxyKey(ev, type){
    if(!fallbackProxyOn || !ev.isTrusted) return;
    const tag=(ev.target && ev.target.tagName || '').toLowerCase();
    if(['input','select','textarea'].includes(tag)) return;
    const key = String(ev.key || '').toLowerCase();
    const mapped = oldProxy[key];
    if(!mapped) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    window.dispatchEvent(new KeyboardEvent(type, { key: mapped, code: 'Key' + mapped.toUpperCase(), bubbles: true, cancelable: true, repeat: ev.repeat }));
  }

  function markMotionStates(){
    document.querySelectorAll('.pad').forEach(p=>{
      const on=p.classList.contains('playing')||p.classList.contains('looping')||p.classList.contains('is-on')||p.classList.contains('on');
      p.toggleAttribute('data-live',on);
    });
  }

  function installObservers(){
    const pads=document.getElementById('pads');
    if(!pads) return;
    const obs=new MutationObserver(markMotionStates);
    obs.observe(pads,{subtree:true,attributes:true,attributeFilter:['class']});
    markMotionStates();
  }

  function boot(){
    repairStoredMap();
    installCss();
    moveSections();
    enableFallbackProxyIfNeeded();
    installObservers();
    setTimeout(moveSections,400);
    setTimeout(enableFallbackProxyIfNeeded,425);
    setTimeout(markMotionStates,450);
  }

  window.addEventListener('keydown', e => proxyKey(e, 'keydown'), true);
  window.addEventListener('keyup', e => proxyKey(e, 'keyup'), true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
