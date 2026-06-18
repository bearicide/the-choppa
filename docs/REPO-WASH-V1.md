# The Choppa — Repo Wash v1

Status: active cleanup/audit branch.

Live site: https://bearicide.github.io/the-choppa/
Repo: https://github.com/bearicide/the-choppa
Primary file: `index.html`

## Scope

This pass is a **Repo Wash**, not a rewrite.

Rules:

- Preserve existing behavior.
- Preserve current single-page GitHub Pages deployment.
- Preserve pad labels, default key map, MIDI note map, FX names, and existing asset paths.
- Do not add new feature creep until the current performance surface is stable.
- Prefer small, inspectable changes over giant rebuilds.

## Current structure

`index.html` currently contains all major systems:

- CSS theme/layout
- HTML shell
- audio engine
- slicing engine
- pad engine
- loop engine
- keyboard mapping
- MIDI input
- MIDI CC knob mapping
- waveform drawing
- mobile controls
- boot/bind sequence

This is workable, but it makes debugging slower because state, UI, MIDI, and audio are all packed into one file.

## System map

```txt
User input / MIDI / keyboard
        ↓
padDown / padUp / onMidi
        ↓
play / requestLoop / startLoop
        ↓
makeSrc
        ↓
Web Audio graph
        ↓
tap → pan → pregain → waveshaper → filter → master → limiter → analyser → output
```

## Current strengths

- Dynamic 16-pad generation.
- Clear default QWERTY map.
- Clear default MIDI note map.
- FX definitions are centralized in `fxDefs`.
- Audio graph is compact and understandable.
- Pad labels keep keyboard/MIDI/slice info separated.
- Demo autoload fallback exists.
- GitHub Pages deployment remains simple.

## Current cleanup targets

### 1. State organization

Current state is stored as many loose globals:

```js
slices, active, byPad, loopPad, loopSrc, fullSrc, loopMode, holdLoop, mode, choke, xy, selectedPad, padQuant, midiEnabled
```

Target future shape:

```js
const STATE = {
  audio: {},
  pads: {},
  loop: {},
  midi: {},
  ui: {}
}
```

Do this only after behavior is locked.

### 2. Function grouping

Suggested script sections:

```txt
CONSTANTS
STATE
STATUS / LOGGING
AUDIO ENGINE
FX ENGINE
PAD ENGINE
LOOP ENGINE
SLICE ENGINE
WAVEFORM ENGINE
MIDI ENGINE
KEYBOARD ENGINE
UI BINDINGS
BOOT
```

### 3. MIDI knob audit

Current CC mapping uses:

```js
21 → filter
22 → reverb
23 → delay
24 → drive
25 → crush
26 → gate
27 → pitch
28 → pan
```

That is valid for one Launchkey-style custom layout, but hardware mode can change CC numbers. Keep this map centralized before expanding it.

### 4. Loop/status audit

`loopMode` is currently tap-loop arming, not the same thing as an actively playing loop. UI wording should avoid implying that turning off tap-loop kills the currently playing loop unless it actually does.

### 5. Debug visibility

Add optional internal diagnostics later:

```js
const DEBUG = false;
function trace(area, data) { if (DEBUG) console.log('[CHOPPA]', area, data); }
```

Useful trace points:

- audio init/resume
- demo loaded
- file decoded
- slice count
- pad down/up
- source start/stop
- loop queued/start/stop
- MIDI note input
- MIDI CC input

## Bug-hunt priority

1. Confirm demo autoload on live GitHub Pages.
2. Confirm every QWERTY pad triggers audio.
3. Confirm uploaded audio decodes and slices.
4. Confirm MIDI note input fires matching pads.
5. Confirm CC 21-28 move the 8 FX knobs.
6. Confirm stop clears active sources and pad visuals.
7. Confirm loops start immediately with Quant Off.
8. Confirm quantized loops start on the expected grid.
9. Confirm mobile upload/play/stop/midi buttons call the same handlers.
10. Confirm service worker cache is not serving stale JS.

## Safe next code pass

Recommended first code pass:

- Add section comments only.
- Add `MIDI_CC_MAP` top-level constant.
- Add `DEBUG` and `trace()` without changing behavior.
- Add trace calls behind `DEBUG=false`.
- Keep current UI and audio logic intact.

## Do not do yet

- Do not split files until one stable readable single-file baseline exists.
- Do not redesign UI.
- Do not add HOSS/extra synth layer in this branch.
- Do not change pad note defaults without hardware test.
- Do not replace the live page blindly.
