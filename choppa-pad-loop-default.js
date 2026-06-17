(() => {
  if (window.choppaPadLoopDefaultLoaded) return;
  window.choppaPadLoopDefaultLoaded = true;
  const byId = id => document.getElementById(id);
  const keyPads = ['1','2','3','4','5','6','7','8','q','w','e','r','t','y','u','i'];
  let working = false;

  function choose(select, label) {
    if (!select) return;
    const want = String(label).toLowerCase();
    const opt = Array.from(select.options).find(o => String(o.textContent).toLowerCase() === want || String(o.value).toLowerCase() === want);
    if (opt && select.value !== opt.value) {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function padIndex(node) {
    const pad = node?.closest?.('.pad');
    if (!pad) return -1;
    for (const name of pad.classList) {
      const match = name.match(/^p(\d+)$/);
      if (match) return Number(match[1]);
    }
    const raw = (pad.querySelector('span')?.textContent || '').trim();
    const number = Number(raw);
    return Number.isFinite(number) ? number - 1 : -1;
  }

  function defaults() {
    choose(byId('triggerMode'), 'Choke');
    const hold = byId('holdLoopBtn');
    if (hold && !hold.classList.contains('active')) hold.click();
  }

  async function loopOnly(index) {
    if (working || index < 0) return;
    const select = byId('padSelect');
    const clear = byId('clearLoopBtn');
    const loop = byId('loopSelected');
    if (!select || !clear || !loop) return;
    working = true;
    defaults();
    select.value = String(index);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    clear.click();
    await new Promise(r => setTimeout(r, 20));
    loop.click();
    document.querySelectorAll('.pad').forEach((pad, i) => pad.classList.toggle('queued', i === index));
    setTimeout(() => { working = false; }, 90);
  }

  function install() {
    defaults();
    document.addEventListener('pointerdown', event => {
      const index = padIndex(event.target);
      if (index < 0 || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      loopOnly(index);
    }, true);
    document.addEventListener('keydown', event => {
      if (event.target?.matches?.('input,select,textarea,button')) return;
      const index = keyPads.indexOf(event.key.toLowerCase());
      if (index < 0 || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      loopOnly(index);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
