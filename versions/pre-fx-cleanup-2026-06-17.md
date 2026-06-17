# The Choppa pre-cleanup checkpoint

Saved before the FX cleanup / eight-knob rebuild pass.

Current important repo state before cleanup:

- `index.html` blob SHA: `ef16343a287078d0d52d1b61315e84d21c3fb082`
- `service-worker.js` blob SHA: `df9515088182d4887b501a950c90e24767698408`
- `sw.js` blob SHA before cleanup: `9ecd6d60ade136bdc6c5611e854af7850240b841`
- helper patch blob SHA before cleanup: `e04d024dc8e0c0863f9918db973f2c6a4705b7a6`

Reason for checkpoint: preserve the current working Choppa before removing service-worker/helper trash and rebuilding the FX section with 8 knobs, bigger reverb, and gated/stuttered delay.

If this goes sideways, restore `index.html` from the saved blob/history. Humanity may continue pretending this is a sane development workflow.
