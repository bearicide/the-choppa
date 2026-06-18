(() => {
  if (window.__choppaAlignV22) return;
  window.__choppaAlignV22 = true;

  const css = `
  :root{--motionEase:cubic-bezier(.2,.7,.2,1);--softShadow:0 12px 34px rgba(0,0,0,.32);--panelTint:rgba(6,8,12,.84);--lineSoft:rgba(255,255,255,.14)}
  html{scroll-behavior:smooth}body{background:#05060a!important}.wrap{width:min(1440px,calc(100% - 24px))!important}.app.wrap{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;padding-top:14px!important}.top{box-shadow:0 6px 24px rgba(0,0,0,.28)}.nav{min-height:64px!important}.status{justify-content:flex-end}.pill{border-color:var(--lineSoft)!important;background:rgba(3,5,8,.66)!important}.card,.fxVoicePanel{border-color:var(--lineSoft)!important;background:linear-gradient(180deg,rgba(10,12,18,.86),rgba(4,5,8,.78))!important;box-shadow:var(--softShadow)!important}.deck{order:1!important;display:grid!important;grid-template-columns:300px minmax(0,1fr)!important;gap:14px!important;margin:0!important}.topControl{min-height:250px!important;grid-template-columns:minmax(0,1fr) 280px!important;gap:14px!important}.topTransport{grid-template-columns:64px 64px 132px 122px minmax(210px,1fr)!important;gap:8px!important}.big{width:64px!important;height:58px!important}.tapBig,.mapBig{height:58px!important}.miniStats{gap:6px!important}.mainGrid{order:2!important;display:grid!important;grid-template-columns:minmax(420px,540px) minmax(420px,1fr)!important;gap:14px!important;margin:0!important}.mainGrid>.card:has(#pads){order:-1!important}.mainGrid>.card:has(#fx){order:2!important}.padsWrap{padding:12px!important}.pads{gap:9px!important}.pad{height:86px!important;border-radius:14px!important}.pad span{font-size:1.85rem!important}.pad small,.pad em{font-size:.52rem!important}.pad.is-on,.pad.on{animation:padPulse 1.4s var(--motionEase) infinite!important}.pad.queued{animation:queueBlink .8s steps(2,end) infinite!important}.pad.selected:not(.is-on):not(.on){outline:2px solid rgba(32,231,255,.55)!important;box-shadow:0 0 0 3px rgba(32,231,255,.1)!important}.waveCard{order:3!important;margin:0!important}.media,.media canvas{height:150px!important}.fxVoicePanel{order:4!important}.fxVoicePanel .body{grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr)!important;align-items:start}.fxVoicePanel .box{min-width:0}.fxVoicePanel .row{gap:7px!important}.fxBtn,.btn{transition:transform .12s var(--motionEase),filter .12s var(--motionEase),box-shadow .12s var(--motionEase)!important}.fxBtn:hover,.btn:hover{transform:translateY(-1px);filter:brightness(1.12)}.fxBtn:active,.btn:active{transform:translateY(1px) scale(.99)}.bankSlots{grid-template-columns:repeat(4,minmax(0,1fr))!important}.bankSlot{min-width:0}.helpGrid{order:5!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}.box,.read,.fxNote{overflow-wrap:anywhere}.controlGrid{align-content:start}.xyLive,.xy{height:198px!important}.xyDot{transition:left .08s linear,top .08s linear}.loopControls,.padControls{gap:8px!important}.loopControls .btn,.padControls select{min-height:38px!important}.fx{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;padding:12px!important}.presets{grid-template-columns:repeat(4,minmax(0,1fr))!important;padding:0 12px 12px!important}.dial{width:58px!important;height:58px!important;box-shadow:0 0 12px currentColor!important}.knob strong{font-size:.68rem!important}.knob output{font-size:.62rem!important}@keyframes padPulse{0%,100%{filter:brightness(1);box-shadow:0 0 18px rgba(117,255,53,.45),inset 0 -7px rgba(0,0,0,.25)}50%{filter:brightness(1.14);box-shadow:0 0 28px rgba(117,255,53,.72),0 0 48px rgba(117,255,53,.24),inset 0 -7px rgba(0,0,0,.22)}}@keyframes queueBlink{50%{filter:brightness(1.4)}}@media(max-width:1180px){.deck,.mainGrid,.fxVoicePanel .body{grid-template-columns:1fr!important}.topControl{grid-template-columns:1fr!important}.controlGrid{max-width:520px}.fx{grid-template-columns:repeat(4,minmax(0,1fr))!important}}@media(max-width:760px){.wrap{width:calc(100% - 14px)!important}.nav{gap:8px}.brand b{font-size:1.35rem!important}.status .pill:nth-child(n+4){display:none!important}.app.wrap{gap:10px!important;padding-top:10px!important}.topTransport{grid-template-columns:repeat(4,1fr)!important}.miniStats{grid-column:1/-1!important;grid-template-columns:repeat(3,1fr)!important}.pad{height:72px!important}.pad span{font-size:1.35rem!important}.pads{gap:7px!important}.media,.media canvas{height:120px!important}.fx{grid-template-columns:repeat(2,minmax(0,1fr))!important}.helpGrid{grid-template-columns:1fr!important}.fxVoicePanel .head{align-items:flex-start;flex-direction:column}.bankSlots{grid-template-columns:repeat(2,minmax(0,1fr))!important}.xyLive,.xy{height:170px!important}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
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
    installCss();
    moveSections();
    installObservers();
    setTimeout(moveSections,400);
    setTimeout(markMotionStates,450);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
