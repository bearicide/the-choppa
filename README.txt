MATTBEAR - The Choppa Package

Drop these files into the root of the GitHub Pages repo/folder for The Choppa:

- index.html
- manifest.json
- service-worker.js
- icon-192.png
- icon-512.png

Live target:
https://bearicide.github.io/the-choppa/

Notes:
- This package promotes the visualizer/oscilloscope build as the default app.
- Buttons are tightened with shorter labels, bolder text, stronger fill, and mobile wrapping.
- Launchkey Mini pads use the mapped 16-pad layout.
- FX knobs listen for CC 21-28 and fallback CC 71-78.
- Service worker cache is bumped to: the-choppa-pwa-v2-visualizer

After upload/push:
Hard-refresh the live page once if an old service worker is still showing the previous build.
