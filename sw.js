const CHOPPA_CACHE = 'the-choppa-standalone-v18';
const CORE = [
  './', './index.html', './manifest.webmanifest', './icons/choppa-icon.svg',
  './assets/the-choppa-bg.png', './assets/the-choppa-hero.png', './assets/the-choppa-shortcuts.png',
  './assets/mattbear-amen-to-that-demo.mp3'
];

const HOTFIX = `
<style id="hotfix-v18-style">
/* bring pads up, stop layout wandering like a drunk robot */
.app.wrap{display:flex!important;flex-direction:column!important;gap:14px!important}.mainGrid{order:2!important;display:grid!important;grid-template-columns:minmax(430px,560px) minmax(440px,1fr)!important;gap:14px!important;margin-bottom:0!important}.mainGrid>.card:has(#pads){order:-1!important}.waveCard{order:3!important}.helpGrid{order:5!important}.deck{order:1!important;margin-bottom:0!important}.choppa-extra-banks,.fxHotPanel{order:4!important}.padsWrap{padding:12px!important}.pads{gap:10px!important}.pad{height:92px!important}.pad.padOffNow{transition:none!important;filter:brightness(.42)!important;box-shadow:none!important}.fxHotPanel{margin:0;border:1px solid rgba(32,231,255,.45);border-radius:14px;background:linear-gradient(180deg,rgba(8,10,15,.94),rgba(3,4,7,.84));box-shadow:0 12px 38px rgba(0,0,0,.35);overflow:hidden}.fxHotPanel .hotHead{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.14)}.fxHotPanel h2{margin:0;font:900 1.05rem Space Grotesk,Inter,sans-serif;letter-spacing:-.03em}.fxHotPanel .hotBody{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px}.fxHotPanel .hotBox{border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(0,0,0,.28);padding:12px}.hotRow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.hotBtn{min-height:36px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(12,14,20,.92);color:#fff;font:900 .68rem JetBrains Mono,monospace;text-transform:uppercase;padding:7px 10px}.hotBtn.green{background:linear-gradient(180deg,#75ff35,#1f7e16);color:#061707}.hotBtn.yellow{background:linear-gradient(180deg,#f6ff2e,#878300);color:#101100}.hotBtn.red{background:linear-gradient(180deg,#ff3a36,#7f0909)}.hotNote{margin:8px 0 0;color:#bdb3a5;font:800 .72rem Inter,sans-serif;line-height:1.35}.hotSlots{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.hotSlot{height:42px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:linear-gradient(180deg,#1a150b,#0b0907);color:#f6ff2e;font:900 .6rem JetBrains Mono,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px}.hotSlot.loaded{background:linear-gradient(180deg,#12300e,#071407);color:#75ff35;border-color:rgba(117,255,53,.62)}.fxHotPanel input[type=file]{display:none}.fxHotPanel input[type=range]{accent-color:#75ff35;max-width:150px}@media(max-width:1160px){.mainGrid{grid-template-columns:1fr!important}.fxHotPanel .hotBody{grid-template-columns:1fr}}@media(max-width:720px){.pad{height:76px!important}.pads{gap:7px!important}.fxHotPanel .hotSlots{grid-template-columns:repeat(2,1fr)}}
</style>
<script id="hotfix-v18-script">
(()=>{
  const $=id=>document.getElementById(id);
  const keys=['1','2','3','4','q','w','e','r','a','s','d','f','z','x','c','v'];
  let bankCtx=null,bankBuffers=Array(16).fill(null),bankNames=Array(16).fill('EMPTY'),bankMode=false,bankVol=.85,bankSources=new Set();
  let blockUntil=0;
  const isTyping=el=>{const tag=(el&&el.tagName||'').toLowerCase();return ['input','select','textarea'].includes(tag)||el?.isContentEditable};
  const status=t=>{const a=$('uploadStatus');if(a)a.textContent=t;const b=$('badge');if(b)b.textContent=t};
  const setv=(id,v)=>{const e=$(id);if(!e)return;e.max=Math.max(+e.max||0,Math.abs(v));e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}))};
  const banks={
    clean:{filter:16000,reverb:0,delay:0,drive:0,crush:0,gate:0,pitch:0,pan:0},
    fat:{filter:13000,reverb:.08,delay:.05,drive:.45,crush:.08,gate:.02,pitch:0,pan:0},
    dub:{filter:9000,reverb:.55,delay:1.25,drive:.18,crush:.05,gate:0,pitch:0,pan:0},
    dirt:{filter:7600,reverb:.12,delay:.12,drive:1.15,crush:.35,gate:.05,pitch:-1,pan:0},
    glitch:{filter:11200,reverb:.08,delay:.22,drive:.32,crush:1,gate:.32,pitch:7,pan:0},
    space:{filter:15000,reverb:.85,delay:.48,drive:.04,crush:0,gate:0,pitch:0,pan:.45},
    underwater:{filter:2200,reverb:.45,delay:.18,drive:.22,crush:.12,gate:.08,pitch:-5,pan:-.25},
    stutter:{filter:12500,reverb:.05,delay:.08,drive:.2,crush:.25,gate:.85,pitch:0,pan:0}
  };
  function applyBank(n){const b=banks[n];if(!b)return;Object.entries(b).forEach(([k,v])=>setv(k,v));status('FX '+n.toUpperCase())}
  function randomFx(){setv('filter',Math.round(600+Math.random()*17200));setv('reverb',+(Math.random()*1).toFixed(2));setv('delay',+(Math.random()*1.35).toFixed(2));setv('drive',+(Math.random()*1.4).toFixed(2));setv('crush',+(Math.random()).toFixed(2));setv('gate',+(Math.random()).toFixed(2));setv('pitch',+(Math.random()*16-8).toFixed(1));setv('pan',+(Math.random()*2-1).toFixed(2));status('FX randomized')}
  function padOff(p){if(!p)return;p.classList.add('padOffNow');p.classList.remove('playing','looping','queued','is-on');p.classList.add('is-neutral');setTimeout(()=>p.classList.remove('padOffNow'),95)}
  function allPadsOff(){document.querySelectorAll('.pad').forEach(padOff)}
  function hardStop(label='STOPPED'){
    blockUntil=performance.now()+420;
    const stop=$('stopBtn')||$('mobStop'); if(stop) stop.click();
    bankSources.forEach(s=>{try{s.stop()}catch{}}); bankSources.clear();
    allPadsOff();
    const loop=$('loopState'); if(loop){loop.className='pill hot';loop.innerHTML=label==='PANIC STOP'?'PANIC <strong>Stopped</strong>':'Loop <strong>Off</strong>'}
    status(label);
  }
  function layoutFix(){
    const pads=$('pads'); if(!pads)return;
    const padCard=pads.closest('.card'), main=padCard?.closest('.mainGrid'), wave=document.querySelector('.waveCard');
    if(main&&padCard){main.insertBefore(padCard,main.firstElementChild); if(wave&&wave.parentNode) wave.parentNode.insertBefore(main,wave)}
  }
  function installPadStop(){
    document.addEventListener('pointerdown',e=>{
      const pad=e.target?.closest?.('.pad'); if(!pad)return;
      if(performance.now()<blockUntil){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}
      const lit=pad.classList.contains('is-on')||pad.classList.contains('playing')||pad.classList.contains('looping')||pad.classList.contains('queued');
      if(lit){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();hardStop('PAD OFF');return}
      if(bankMode){const list=[...document.querySelectorAll('.pad')],i=list.indexOf(pad);if(i>-1&&bankBuffers[i]){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();playBank(i)}}
    },true);
    const obs=new MutationObserver(items=>{items.forEach(it=>{const p=it.target;if(p.classList.contains('playing')&&!p.classList.contains('looping')){clearTimeout(p.__off);p.__off=setTimeout(()=>padOff(p),520)}})});
    document.querySelectorAll('.pad').forEach(p=>obs.observe(p,{attributes:true,attributeFilter:['class']}));
  }
  function makePanel(){
    if(document.querySelector('.fxHotPanel'))return;
    const panel=document.createElement('section');panel.className='fxHotPanel wrap';
    panel.innerHTML='<div class="hotHead"><h2>FX That Actually Bite + Sound Banks</h2><div class="hotRow"><button id="bankModeHot" class="hotBtn yellow">Bank Pads OFF</button><button id="bankStopHot" class="hotBtn red">Stop Bank</button></div></div><div class="hotBody"><div class="hotBox"><div class="hotRow"><button class="hotBtn" data-fx="clean">Clean</button><button class="hotBtn" data-fx="fat">Fat</button><button class="hotBtn" data-fx="dub">Dub</button><button class="hotBtn" data-fx="dirt">Dirt</button><button class="hotBtn" data-fx="glitch">Glitch</button><button class="hotBtn" data-fx="space">Space</button><button class="hotBtn" data-fx="underwater">Underwater</button><button class="hotBtn" data-fx="stutter">Stutter</button><button id="randomFxHot" class="hotBtn green">Random</button></div><p class="hotNote">Presets push the existing 8 knobs harder: filter, reverb, delay, drive, crush, gate, pitch, pan.</p></div><div class="hotBox"><div class="hotRow"><label class="hotBtn green" for="bankFilesHot">Load Sound Bank</label><input id="bankFilesHot" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac,.webm" multiple><label class="hotNote">Vol <input id="bankVolHot" type="range" min="0" max="1" step=".01" value=".85"></label></div><div id="bankSlotsHot" class="hotSlots"></div><p class="hotNote">Load up to 16 audio files. Bank Pads ON makes pads/keys trigger those files. Keep it simple, load anything the browser can decode.</p></div></div>';
    const main=document.querySelector('.mainGrid'),wave=document.querySelector('.waveCard'); (wave?.parentNode||document.querySelector('main')||document.body).insertBefore(panel, wave?.nextSibling||main?.nextSibling||null);
    panel.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>applyBank(b.dataset.fx));$('randomFxHot').onclick=randomFx;$('bankModeHot').onclick=e=>{bankMode=!bankMode;e.currentTarget.classList.toggle('active',bankMode);e.currentTarget.textContent=bankMode?'Bank Pads ON':'Bank Pads OFF';status(bankMode?'Bank pads armed':'Bank pads off')};$('bankStopHot').onclick=()=>hardStop('BANK STOP');$('bankVolHot').oninput=e=>bankVol=+e.target.value;$('bankFilesHot').onchange=e=>loadBank(e.target.files);renderSlots();
  }
  function ctxBank(){const AC=window.AudioContext||window.webkitAudioContext;if(!bankCtx)bankCtx=new AC({latencyHint:'interactive'});return bankCtx}
  async function loadBank(files){const ctx=ctxBank();const list=[...files].filter(f=>f.type.startsWith('audio')||/\.(mp3|wav|m4a|ogg|flac|aac|webm)$/i.test(f.name)).slice(0,16);if(!list.length)return status('No audio files found');status('Loading bank...');for(let i=0;i<list.length;i++){try{bankBuffers[i]=await ctx.decodeAudioData((await list[i].arrayBuffer()).slice(0));bankNames[i]=list[i].name.replace(/\.[^.]+$/,'').slice(0,16)}catch{bankBuffers[i]=null;bankNames[i]='BAD FILE'}}renderSlots();status('Bank loaded: '+list.length)}
  function renderSlots(){const s=$('bankSlotsHot');if(!s)return;s.innerHTML='';for(let i=0;i<16;i++){const b=document.createElement('button');b.className='hotSlot '+(bankBuffers[i]?'loaded':'');b.textContent=(i+1)+' '+bankNames[i];b.onclick=()=>playBank(i);s.appendChild(b)}}
  async function playBank(i){const buf=bankBuffers[i];if(!buf)return;const ctx=ctxBank();await ctx.resume();const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=buf;g.gain.value=bankVol;src.connect(g).connect(ctx.destination);src.start();bankSources.add(src);src.onended=()=>bankSources.delete(src);const pad=document.querySelectorAll('.pad')[i];if(pad){pad.classList.remove('is-off','is-neutral');pad.classList.add('playing','is-on');setTimeout(()=>padOff(pad),Math.min(1500,Math.max(240,buf.duration*1000)))}}
  window.addEventListener('keydown',e=>{if(isTyping(e.target))return;if(e.code==='Space'||e.key===' '){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();hardStop('PANIC STOP');return}if(bankMode){const i=keys.indexOf(e.key.toLowerCase());if(i>-1&&bankBuffers[i]){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();playBank(i)}}},true);
  function boot(){layoutFix();makePanel();installPadStop();setTimeout(layoutFix,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
</script>`;

async function patchHtml(response) {
  const html = await response.text();
  if (html.includes('hotfix-v18-script')) return new Response(html, response);
  return new Response(html.replace('</body>', `${HOTFIX}\n</body>`), { status: response.status, statusText: response.statusText, headers: response.headers });
}
function shouldPatch(request) { const url = new URL(request.url); return request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'); }
self.addEventListener('install', event => { event.waitUntil(caches.open(CHOPPA_CACHE).then(cache => Promise.allSettled(CORE.map(url => cache.add(url)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CHOPPA_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (shouldPatch(event.request)) { event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); if (response.ok) caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy)); return patchHtml(response); }).catch(() => caches.match(event.request).then(cached => cached ? patchHtml(cached) : cached))); return; }
  event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); const url = new URL(event.request.url); if (url.origin === location.origin && response.ok) caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request)));
});
