# The Choppa Architecture Map

This is a plain file map for future cleanup. No behavior is changed by this document.

## Runtime entry points

| Path | Role | Notes |
|---|---|---|
| `index.html` | Main app shell, styles, pad engine, audio engine, MIDI input, loop controls | Currently contains most core app behavior inline. Keep stable during Repo Wash. |
| `sw.js` | Service worker cache and navigation patcher | Caches the app and injects enhancement scripts into navigated HTML when missing. |
| `fx-v21.js` | FX preset panel, compact bank, voice SFX, panic/stop helpers | Loaded by service worker patch path. Keep behavior stable until audio audit. |
| `align-v22.js` | Layout alignment, motion polish, section ordering | Loaded by service worker patch path. Treat as UI layer, not engine layer. |
| `manifest.webmanifest` | PWA metadata | Points to `icons/choppa-icon.svg`. |

## Assets

| Path | Role |
|---|---|
| `assets/the-choppa-bg.png` | Main page background image |
| `assets/the-choppa-hero.png` | Hero panel image |
| `assets/the-choppa-shortcuts.png` | Shortcut/help image referenced by service worker cache |
| `assets/mattbear-amen-to-that-demo.mp3` | Built-in demo loop |
| `icons/choppa-icon.svg` | PWA icon |

## Wash rules

During Repo Wash, do not change:

- Audio graph wiring
- Pad note/key mappings
- MIDI input behavior
- Loop timing or quantization
- Local storage keys
- Element IDs and selectors
- Public URLs
- Service worker cache behavior unless explicitly tested

## Known cleanup candidates

- Move inline CSS out of `index.html` after behavior is verified.
- Move inline core JavaScript out of `index.html` after behavior is verified.
- Replace service-worker HTML patching with explicit script tags only after confirming first-load and cached-load behavior.
- Rename versioned patch files only after confirming cache invalidation strategy.
