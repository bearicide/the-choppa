// THE CHOPPA — targeted runtime patch v28
// Keeps the current index build, patches loop toggling/lane behavior during navigation fetch.
// No offline cache. No asset cache. Browser network stays normal.

const CHOPPA_CACHE_PREFIX = 'the-choppa-';
const INDEX_PATHS = new Set(['/the-choppa/', '/the-choppa/index.html']);

async function clearOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(CHOPPA_CACHE_PREFIX) || key.includes('choppa')).map(key => caches.delete(key)));
}

function patchIndex(html) {
  let out = html;

  out = out.replace(
    "let slices=[],active=[],byPad=new Map(),loopPad=-1,loopSrc=null,fullSrc=null,loopMode=false,holdLoop=true,mode='trigger',choke=true,xy={x:.5,y:.5},lastXY=0,raf=0,activePlay=null,learnMidi=false,learnKey=false,holds=new Map(),selectedPad=0,padQuant=Array(16).fill('off'),transportStart=0,demoAB=null,demoName='mattbear - amen to that',midiEnabled=false;",
    "let slices=[],active=[],byPad=new Map(),loopPad=-1,loopSrc=null,loopSrcs=new Map(),fullSrc=null,loopMode=true,holdLoop=false,mode='trigger',choke=true,xy={x:.5,y:.5},lastXY=0,raf=0,activePlay=null,learnMidi=false,learnKey=false,holds=new Map(),selectedPad=0,padQuant=Array(16).fill('off'),transportStart=0,demoAB=null,demoName='mattbear - amen to that',midiEnabled=false;"
  );

  out = out.replace(
    '<select id="triggerMode"><option>Choke</option><option>Normal</option></select>',
    '<select id="triggerMode"><option value="Choke">Single Lane</option><option value="Normal">Layer Loops</option></select>'
  );

  out = out.replace(
    "function stopLoop(at){if(loopSrc){try{loopSrc.src.stop(at||0)}catch{}loopSrc=null}if(loopPad>-1){$('pads').children[loopPad]?.classList.remove('looping');loopPad=-1}if(!at){stat('loopState','Loop <strong>Off</strong>','');hideRegion()}updatePadStates()}function startLoop(i,when,q){let old=loopSrc;if(old){try{old.src.stop(when)}catch{}}let e=makeSrc(i,true,when);if(!e)return;loopSrc=e;loopPad=i;activePlay=e;clearQueued();let pad=$('pads').children[i];pad.classList.add('queued');setTimeout(()=>{clearQueued();pad.classList.add('looping');stat('loopState','Loop <strong>Pad '+(i+1)+'</strong>','ok');showRegion(e.slice);updatePadStates()},Math.max(0,(when-ctx.currentTime)*1000));log((q&&q!=='off'?'Queued '+q:'Loop')+' Pad '+(i+1))}async function requestLoop(i){await audio();selectPad(i);let q=padQuant[i]||'off',when=nextGrid(q);startLoop(i,when,q)}",
    "function loopLane(){return $('triggerMode')&&$('triggerMode').value==='Normal'?'layer':'single'}function syncLoopRefs(){let first=loopSrcs.size?[...loopSrcs.entries()][0]:null;loopPad=first?first[0]:-1;loopSrc=first?first[1]:null}function stopLoop(iOrAt,maybeAt){let specific=Number.isInteger(iOrAt)?iOrAt:null,at=Number.isInteger(iOrAt)?maybeAt:iOrAt,when=at||0;if(loopSrcs&&loopSrcs.size){if(specific!=null){let e=loopSrcs.get(specific);if(e){try{e.src.stop(when)}catch{}loopSrcs.delete(specific);$('pads').children[specific]?.classList.remove('looping','queued')}}else{loopSrcs.forEach((e,p)=>{try{e.src.stop(when)}catch{};$('pads').children[p]?.classList.remove('looping','queued')});loopSrcs.clear()}}else if(loopSrc){try{loopSrc.src.stop(when)}catch{}loopSrc=null;if(loopPad>-1){$('pads').children[loopPad]?.classList.remove('looping','queued');loopPad=-1}}syncLoopRefs();if(!at&&specific==null){stat('loopState','Loop <strong>Off</strong>','');hideRegion()}else if(!loopSrcs.size){stat('loopState','Loop <strong>Off</strong>','');hideRegion()}else{stat('loopState','Loop <strong>'+loopSrcs.size+' Active</strong>','ok')}updatePadStates()}function startLoop(i,when,q){if(loopSrcs.has(i)){stopLoop(i);log('Loop Pad '+(i+1)+' off');return}if(loopLane()==='single'){loopSrcs.forEach((old,p)=>{try{old.src.stop(when)}catch{};$('pads').children[p]?.classList.remove('looping','queued')});loopSrcs.clear()}let e=makeSrc(i,true,when);if(!e)return;loopSrcs.set(i,e);syncLoopRefs();activePlay=e;clearQueued();let pad=$('pads').children[i];pad.classList.add('queued');setTimeout(()=>{if(loopSrcs.get(i)!==e)return;pad.classList.remove('queued');pad.classList.add('looping');stat('loopState','Loop <strong>'+(loopLane()==='single'?'Pad '+(i+1):loopSrcs.size+' Active')+'</strong>','ok');showRegion(e.slice);updatePadStates()},Math.max(0,(when-ctx.currentTime)*1000));log((q&&q!=='off'?'Queued '+q:'Loop')+' Pad '+(i+1)+' · '+(loopLane()==='single'?'Single Lane':'Layer'))}async function requestLoop(i){await audio();selectPad(i);let q=padQuant[i]||'off';if(loopSrcs.has(i)){stopLoop(i);log('Loop Pad '+(i+1)+' off');return}let when=nextGrid(q);startLoop(i,when,q)}"
  );

  out = out.replace(
    "function bind(){build();",
    "function bind(){build();setTimeout(()=>setLoop(true),0);"
  );

  out = out.replace(
    "<div class=\"box\"><b>Actual label fix:</b> center key is not reused for slice or MIDI. Corners handle the boring bookkeeping.</div><div class=\"box\"><b>Visual scan:</b> active pads get a moving scan bar while they play/loop. Waveform playhead still runs.</div><div class=\"box\"><b>Mapping:</b> select pad, Key Learn or MIDI Learn, then press the control.</div>",
    "<div class=\"box\"><b>Loop behavior:</b> Tap a pad to loop it. Tap the same pad again to turn it off.</div><div class=\"box\"><b>Lane mode:</b> Single Lane replaces the current loop. Layer Loops lets multiple pads run together.</div><div class=\"box\"><b>Mapping:</b> Select a pad, then use Key Learn or MIDI Learn.</div>"
  );

  return out;
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isIndex = event.request.mode === 'navigate' || INDEX_PATHS.has(url.pathname);
  if (!isIndex) return;

  event.respondWith((async () => {
    const response = await fetch(event.request, { cache: 'no-store' });
    const html = await response.text();
    return new Response(patchIndex(html), {
      status: response.status,
      statusText: response.statusText,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
    });
  })());
});
