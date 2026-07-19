# Audio Path Audit

Step 2 audit target: trace every way The Choppa can make sound before changing audio behavior. No runtime code changes belong in this document-only pass.

## Scope guard

This audit does not change:

- Audio graph wiring
- MIDI behavior
- Pad mappings
- Loop timing
- UI colors or layout
- Service worker behavior

## Core engine path

The main app creates one shared Web Audio graph in `index.html`:

```text
AudioBufferSourceNode
  -> gate gain
  -> tap gain
  -> stereo pan
  -> pre gain
  -> waveshaper
  -> lowpass filter
  -> master gain
  -> limiter
  -> analyser
  -> destination
```

FX sends also branch from the filter node into delay and reverb paths before returning to master:

```text
filter -> delay -> feedback -> delay -> delayGain -> master
filter -> reverbGain -> convolver -> master
```

## Load/decode paths

### Demo preload

- `preloadDemo()` fetches `assets/mattbear-amen-to-that-demo.mp3`.
- It calls `audio(false)`, so the context can be created without resume.
- It decodes the demo into global `buffer`.
- It calls `smart()` to create slices.

### Manual upload

- `loadFile(file)` validates file type or extension.
- It calls `audio()`.
- It decodes uploaded audio into global `buffer`.
- It calls `smart()` to create slices.

### Demo reload

- `demo()` calls `audio()`.
- If `demoAB` exists, it decodes that into global `buffer` again.
- If no demo asset exists, it creates a synthetic generated buffer.
- It calls `smart()` or `equal(16)`.

## Playback paths

### One-shot pad playback

- Pointer/keyboard pad input calls `padDown()`.
- `padDown()` calls `audio()` before playback.
- `play(i)` calls `makeSrc(i, false)`.
- `makeSrc()` creates an `AudioBufferSourceNode`, assigns global `buffer`, sets the slice offset/duration, connects through the core graph, then starts/stops the source.

### Loop pad playback

- Loop mode or hold-loop calls `requestLoop(i)`.
- `requestLoop(i)` calls `audio()`.
- It resolves quantization with `nextGrid()`.
- `startLoop(i, when, q)` stops an old loop at the next start time, creates a new looping source with `makeSrc(i, true, when)`, and marks the pad queued until the scheduled start.

### Full-loop playback

- `toggleFull()` calls `audio()`.
- If no buffer exists, it calls `demo()`.
- `startFull()` creates a looping source from the full global `buffer`, connects it directly to `tap`, and starts it on the selected quant grid.

### MIDI pad playback

- `onMidi()` maps note-on events to pads.
- It calls `play(pad)` directly.
- Unlike pointer/keyboard pad paths, this path does not call `audio()` first.

### FX compact bank / voice panel

`fx-v21.js` creates a separate `bankCtx` for compact bank samples, synth stings, and voice-related sounds. Those sounds connect directly to that context destination, not through the core Choppa graph.

That split may be intentional, but it means core pads and compact-bank/voice sounds do not share the same master FX, limiter, analyser, or panic path except where `hardStop()` manually stops bank sources.

## Findings

### 1. Loaded-buffer replacement can desync active playback

`loadFile()` and `demo()` replace the global `buffer` and rebuild slices, but they do not stop active one-shots, pad loops, or full loops first.

Risk:

- Old audio can keep playing from the previous buffer.
- UI state, waveform, slices, loop region, and playhead can switch to the new buffer.
- `activePlay` can reference a source/slice from the old buffer while `updatePlayhead()` calculates against the new global `buffer.duration`.

Likely fix lane:

- Before assigning a new decoded buffer, stop active pad sources, active pad loop, and full loop.
- Clear queued pad state.
- Then assign `buffer`, rebuild slices, redraw waveform, and reset playhead state.

### 2. MIDI note-on path does not guarantee audio resume

Pointer and keyboard pad paths call `audio()` before playing. MIDI note-on calls `play(pad)` directly.

Risk:

- MIDI can trigger pad logic while the browser audio context is still suspended.
- MIDI input can appear to work while sound does not fire until another UI gesture resumes audio.

Likely fix lane:

- Route MIDI pad hits through an async helper that ensures `audio()` has been called/resumed before `play(pad)`.
- Preserve MIDI learn behavior before triggering playback.

### 3. First-load versus service-worker-controlled-load behavior differs

`index.html` registers `sw.js`, but it does not explicitly include `fx-v21.js` or `align-v22.js` script tags.

`sw.js` patches navigated HTML and injects those scripts when missing. On a first fresh load, the page is not controlled by that service worker yet, so injected behavior may only appear after reload/navigation.

Risk:

- First visit and reload can have different UI/audio-adjacent behavior.
- The compact bank, voice panel, panic-key override, pad-stop overlay, and alignment layer may not be consistently present.

Likely fix lane:

- Make enhancement script loading explicit in `index.html`, or keep service-worker patching only as a backward-compatibility fallback.
- Do this after confirming cache behavior so stale clients do not get trapped in a tiny browser-powered swamp.

### 4. Core app and compact bank use separate audio contexts

The core app uses `ctx`; `fx-v21.js` uses `bankCtx`.

Risk:

- Different output routing.
- Separate resume policies.
- Core limiter/analyser/FX do not affect bank/voice sounds.
- Panic stop relies on `hardStop()` also stopping `bankSources`.

Likely fix lane:

- Decide whether compact bank/voice should stay independent or route through the core graph.
- Do not merge contexts until the loaded-loop bug is fixed first.

### 5. Silent pad miss path

`play(i)` returns silently when `buffer` or `slices[i]` is missing.

Risk:

- MIDI or pad hits can fail without a visible status message.

Likely fix lane:

- Add a low-noise status message when a pad hit has no buffer/slice.
- Avoid logging every repeated MIDI miss.

## Recommended fix order

1. Stop active playback before replacing the global loaded buffer.
2. Make MIDI pad hits resume/initialize audio the same way pointer and keyboard hits do.
3. Make enhancement script loading deterministic between first load and reload.
4. Decide whether compact bank/voice should remain on separate `bankCtx` or route through core master.
5. Add low-noise status for pad hits with no loaded slice.

## Status

Audit complete. No runtime behavior changed in this pass.
