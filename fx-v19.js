(() => {
  const MARK = 'fx-v19-loaded';
  if (window[MARK]) return;
  window[MARK] = true;

  const $ = id => document.getElementById(id);
  const padKeys = ['1','2','3','4','q','w','e','r','a','s','d','f','z','x','c','v'];
  let bankCtx = null;
  let bankBuffers = Array(16).fill(null);
  let bankNames = Array(16).fill('EMPTY');
  let bankMode = false;
  let bankVol = 0.85;
  let bankSources = new Set();
  let blockUntil = 0;

  const css = `
    .app.wrap{display:flex!important;flex-direction:column!important;gap:14px!important}.deck{order:1!important;margin-bottom:0!important}.mainGrid{order:2!important;display:grid!important;grid-template-columns:minmax(430px,560px) minmax(440px,1fr)!important;gap:14px!important;margin-bottom:0!important}.mainGrid>.card:has(#pads){order:-1!important}.waveCard{order:3!important}.fxMegaPanel{order:4!important}.helpGrid{order:5!important}.padsWrap{padding:12px!important}.pads{gap:10px!important}.pad{height:92px!important}.pad.padOffNow{transition:none!important;filter:brightness(.42)!important;box-shadow:none!important}.fxMegaPanel{margin:0;border:1px solid rgba(255,63,167,.48);border-radius:14px;background:linear-gradient(180deg,rgba(9,10,16,.95),rgba(3,4,7,.86));box-shadow:0 12px 38px rgba(0,0,0,.35);overflow:hidden}.fxMegaPanel .head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.14)}.fxMegaPanel h2{margin:0;font:900 1.08rem Space Grotesk,Inter,sans-serif;letter-spacing:-.03em}.fxMegaPanel .body{display:grid;grid-template-columns:1.15fr .85fr;gap:12px;padding:12px}.fxMegaPanel .box{border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(0,0,0,.28);padding:12px}.fxMegaPanel .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.fxBtn{min-height:36px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(12,14,20,.92);color:#fff;font:900 .66rem JetBrains Mono,monospace;text-transform:uppercase;padding:7px 9px}.fxBtn:hover{filter:brightness(1.18)}.fxBtn.green{background:linear-gradient(180deg,#75ff35,#1f7e16);color:#061707}.fxBtn.yellow{background:linear-gradient(180deg,#f6ff2e,#878300);color:#101100}.fxBtn.red{background:linear-gradient(180deg,#ff3a36,#7f0909)}.fxNote{margin:8px 0 0;color:#bdb3a5;font:800 .72rem Inter,sans-serif;line-height:1.35}.bankSlots{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.bankSlot{height:42px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:linear-gradient(180deg,#1a150b,#0b0907);color:#f6ff2e;font:900 .6rem JetBrains Mono,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px}.bankSlot.loaded{background:linear-gradient(180deg,#12300e,#071407);color:#75ff35;border-color:rgba(117,255,53,.62)}.fxMegaPanel input[type=file]{display:none}.fxMegaPanel input[type=range]{accent-color:#75ff35;max-width:150px}@media(max-width:1160px){.mainGrid{grid-template-columns:1fr!important}.fxMegaPanel .body{grid-template-columns:1fr}}@media(max-width:720px){.pad{height:76px!important}.pads{gap:7px!important}.bankSlots{grid-template-columns:repeat(2,1fr)}}`;

  const banks = {
    Clean:{filter:16000,reverb:0,delay:0,drive:0,crush:0,gate:0,pitch:0,pan:0},
    Fat:{filter:12800,reverb:.08,delay:.05,drive:.45,crush:.08,gate:.02,pitch:0,pan:0},
    Punch:{filter:11800,reverb:.04,delay:.02,drive:.62,crush:.05,gate:.22,pitch:0,pan:0},
    Dub:{filter:8600,reverb:.70,delay:1.35,drive:.18,crush:.04,gate:0,pitch:0,pan:0},
    Space:{filter:15000,reverb:1,delay:.55,drive:.04,crush:0,gate:0,pitch:0,pan:.45},
    Dirt:{filter:7600,reverb:.12,delay:.12,drive:1.25,crush:.34,gate:.05,pitch:-1,pan:0},
    Shred:{filter:6300,reverb:.06,delay:.08,drive:1.5,crush:.55,gate:.12,pitch:-2,pan:0},
    Glitch:{filter:11200,reverb:.08,delay:.22,drive:.32,crush:1,gate:.35,pitch:7,pan:0},
    Crusher:{filter:9800,reverb:.04,delay:.03,drive:.75,crush:1,gate:.08,pitch:0,pan:0},
    Stutter:{filter:12500,reverb:.05,delay:.08,drive:.2,crush:.25,gate:1,pitch:0,pan:0},
    Robot:{filter:6200,reverb:.06,delay:.10,drive:.38,crush:.85,gate:.22,pitch:5,pan:0},
    Chip:{filter:12500,reverb:.02,delay:.03,drive:.18,crush:1,pitch:12,gate:.08,pan:0},
    Telephone:{filter:2600,reverb:.03,delay:.02,drive:.36,crush:.18,gate:.02,pitch:0,pan:0},
    Underwater:{filter:1800,reverb:.55,delay:.18,drive:.22,crush:.12,gate:.08,pitch:-5,pan:-.25},
    Tunnel:{filter:4200,reverb:1,delay:.34,drive:.12,crush:.06,gate:0,pitch:-2,pan:.18},
    Ghost:{filter:9200,reverb:.95,delay:.42,drive:.03,crush:.02,gate:.05,pitch:-7,pan:-.35},
    Tape:{filter:8800,reverb:.10,delay:.06,drive:.34,crush:.12,gate:0,pitch:-.8,pan:0},
    Vinyl:{filter:7800,reverb:.16,delay:.04,drive:.22,crush:.22,gate:.03,pitch:-1.5,pan:0},
    Bass:{filter:3200,reverb:.04,delay:.02,drive:.58,crush:.05,gate:.03,pitch:-12,pan:0},
    SubBoom:{filter:1900,reverb:.08,delay:.05,drive:.86,crush:.08,gate:.05,pitch:-12,pan:0},
    Laser:{filter:17000,reverb:.10,delay:.16,drive:.45,crush:.35,gate:.18,pitch:12,pan:.65},
    Wobble:{filter:2600,reverb:.12,delay:.18,drive:.38,crush:.15,gate:.18,pitch:-4,pan:.75},
    Wide:{filter:14500,reverb:.22,delay:.16,drive:.07,crush:.02,gate:0,pitch:0,pan:1},
    Left:{filter:14000,reverb:.08,delay:.06,drive:.05,crush:0,gate:0,pitch:0,pan:-1},
    Right:{filter:14000,reverb:.08,delay:.06,drive:.05,crush:0,gate:0,pitch:0,pan:1},
    HalfTime:{filter:9000,reverb:.08,delay:.03,drive:.16,crush:.04,gate:0,pitch:-12,pan:0},
    OctUp:{filter:15000,reverb:.06,delay:.04,drive:.12,crush:.08,gate:0,pitch:12,pan:0},
    Demon:{filter:4200,reverb:.33,delay:.18,drive:1.45,crush:.42,gate:.06,pitch:-12,pan:0},
    Angel:{filter:17000,reverb:1,delay:.32,drive:.04,crush:0,gate:0,pitch:12,pan:0},
    Needle:{filter:1400,reverb:.04,delay:.02,drive:.5,crush:.55,gate:.15,pitch:0,pan:0},
    Air:{filter:18000,reverb:.35,delay:.08,drive:0,crush:0,gate:0,pitch:0,pan:.2},
    Reset:{filter:14000,reverb:.08,delay:.04,drive:.08,crush:.06,gate:0,pitch:0,pan:0}
  };

  const isTyping = el => { const t = (el && el.tagName || '').toLowerCase(); return ['input','select','textarea'].includes(t) || el?.isContentEditable; };
  const status = text => { const u = $('uploadStatus'); if (u) u.textContent = text; const b = $('badge'); if (b) b.textContent = text; };

  function installCss(){ if(document.getElementById('fx-v19-css'))return; const s=document.createElement('style'); s.id='fx-v19-css'; s.textContent=css; document.head.appendChild(s); }
  function setVal(id,val){ const e=$(id); if(!e)return; e.min = Math.min(+e.min || 0, val); e.max = Math.max(+e.max || 0, Math.abs(val), val); e.value = String(val); e.dispatchEvent(new Event('input',{bubbles:true})); }
  function applyBank(name){ const b=banks[name]; if(!b)return; Object.entries(b).forEach(([k,v])=>setVal(k,v)); status('FX: '+name.toUpperCase()); }
  function randomFx(){ ['filter','reverb','delay','drive','crush','gate','pitch','pan'].forEach(id=>{ const e=$(id); if(!e)return; const min=+e.min||0, max=+e.max||1; setVal(id, +(min + Math.random()*(max-min)).toFixed(id==='filter'?0:2)); }); status('FX: RANDOM CHAOS'); }
  function padOff(p){ if(!p)return; p.classList.add('padOffNow'); p.classList.remove('playing','looping','queued','is-on'); p.classList.add('is-neutral'); setTimeout(()=>p.classList.remove('padOffNow'),100); }
  function hardStop(label='STOPPED'){ blockUntil=performance.now()+420; const stop=$('stopBtn')||$('mobStop'); if(stop) stop.click(); bankSources.forEach(s=>{try{s.stop()}catch{}}); bankSources.clear(); document.querySelectorAll('.pad').forEach(padOff); const loop=$('loopState'); if(loop){loop.className='pill hot';loop.innerHTML=label==='PANIC STOP'?'PANIC <strong>Stopped</strong>':'Loop <strong>Off</strong>';} status(label); }
  function layoutFix(){ const pads=$('pads'); if(!pads)return; const padCard=pads.closest('.card'), main=padCard?.closest('.mainGrid'), wave=document.querySelector('.waveCard'); if(main&&padCard){ main.insertBefore(padCard,main.firstElementChild); if(wave?.parentNode) wave.parentNode.insertBefore(main,wave); } }
  function installPadStop(){ document.addEventListener('pointerdown', e=>{ const pad=e.target?.closest?.('.pad'); if(!pad)return; if(performance.now()<blockUntil){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return;} const lit=pad.classList.contains('is-on')||pad.classList.contains('playing')||pad.classList.contains('looping')||pad.classList.contains('queued'); if(lit){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();hardStop('PAD OFF');return;} if(bankMode){ const i=[...document.querySelectorAll('.pad')].indexOf(pad); if(i>-1&&bankBuffers[i]){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();playBank(i);} } }, true); const obs=new MutationObserver(items=>items.forEach(it=>{ const p=it.target; if(p.classList.contains('playing')&&!p.classList.contains('looping')){ clearTimeout(p.__off); p.__off=setTimeout(()=>padOff(p),520); } })); document.querySelectorAll('.pad').forEach(p=>obs.observe(p,{attributes:true,attributeFilter:['class']})); }

  function makePanel(){
    if(document.querySelector('.fxMegaPanel'))return;
    const panel=document.createElement('section'); panel.className='fxMegaPanel wrap';
    const fxButtons=Object.keys(banks).map(n=>`<button class="fxBtn" data-fx="${n}">${n}</button>`).join('');
    panel.innerHTML=`<div class="head"><h2>MORE FX. MORE. RIDICULOUSLY MORE.</h2><div class="row"><button id="bankModeV19" class="fxBtn yellow">Bank Pads OFF</button><button id="bankStopV19" class="fxBtn red">Stop Bank</button></div></div><div class="body"><div class="box"><div class="row">${fxButtons}<button id="randomFxV19" class="fxBtn green">Random</button></div><p class="fxNote">32 macro FX banks. They push the same 8 real knobs: Filter, Reverb, Delay, Drive, Crush, Gate, Pitch, Pan. No fake menu goblinry.</p></div><div class="box"><div class="row"><label class="fxBtn green" for="bankFilesV19">Load Sound Bank</label><input id="bankFilesV19" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac,.webm" multiple><label class="fxNote">Vol <input id="bankVolV19" type="range" min="0" max="1" step=".01" value=".85"></label></div><div id="bankSlotsV19" class="bankSlots"></div><p class="fxNote">Load up to 16 audio files. Bank Pads ON routes pads/keys to those slots. Still simple, because apparently we are not building the Space Shuttle today.</p></div></div>`;
    const wave=document.querySelector('.waveCard'), main=document.querySelector('.mainGrid'); (wave?.parentNode||main?.parentNode||document.body).insertBefore(panel, wave?.nextSibling||main?.nextSibling||null);
    panel.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>applyBank(b.dataset.fx)); $('randomFxV19').onclick=randomFx; $('bankModeV19').onclick=e=>{bankMode=!bankMode; e.currentTarget.classList.toggle('active',bankMode); e.currentTarget.textContent=bankMode?'Bank Pads ON':'Bank Pads OFF'; status(bankMode?'Bank pads armed':'Bank pads off');}; $('bankStopV19').onclick=()=>hardStop('BANK STOP'); $('bankVolV19').oninput=e=>bankVol=+e.target.value; $('bankFilesV19').onchange=e=>loadBank(e.target.files); renderSlots();
  }
  function ctxBank(){ const AC=window.AudioContext||window.webkitAudioContext; if(!bankCtx)bankCtx=new AC({latencyHint:'interactive'}); return bankCtx; }
  async function loadBank(files){ const ctx=ctxBank(); const list=[...files].filter(f=>f.type.startsWith('audio')||/\.(mp3|wav|m4a|ogg|flac|aac|webm)$/i.test(f.name)).slice(0,16); if(!list.length)return status('No audio files found'); status('Loading bank...'); for(let i=0;i<list.length;i++){try{bankBuffers[i]=await ctx.decodeAudioData((await list[i].arrayBuffer()).slice(0)); bankNames[i]=list[i].name.replace(/\.[^.]+$/,'').slice(0,16);}catch{bankBuffers[i]=null; bankNames[i]='BAD FILE';}} renderSlots(); status('Bank loaded: '+list.length); }
  function renderSlots(){ const s=$('bankSlotsV19'); if(!s)return; s.innerHTML=''; for(let i=0;i<16;i++){ const b=document.createElement('button'); b.className='bankSlot '+(bankBuffers[i]?'loaded':''); b.textContent=(i+1)+' '+bankNames[i]; b.onclick=()=>playBank(i); s.appendChild(b); } }
  async function playBank(i){ const buf=bankBuffers[i]; if(!buf)return; const ctx=ctxBank(); await ctx.resume(); const src=ctx.createBufferSource(), g=ctx.createGain(); src.buffer=buf; g.gain.value=bankVol; src.connect(g).connect(ctx.destination); src.start(); bankSources.add(src); src.onended=()=>bankSources.delete(src); const pad=document.querySelectorAll('.pad')[i]; if(pad){pad.classList.remove('is-off','is-neutral'); pad.classList.add('playing','is-on'); setTimeout(()=>padOff(pad),Math.min(1500,Math.max(240,buf.duration*1000)));} }
  window.addEventListener('keydown',e=>{ if(isTyping(e.target))return; if(e.code==='Space'||e.key===' '){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();hardStop('PANIC STOP');return;} if(bankMode){const i=padKeys.indexOf(e.key.toLowerCase()); if(i>-1&&bankBuffers[i]){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();playBank(i);}} }, true);
  function boot(){ installCss(); layoutFix(); makePanel(); installPadStop(); setTimeout(layoutFix,500); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();
