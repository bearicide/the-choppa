# The Choppa Status

This file is the working baseline for the current project state. It exists so the repo stops relying on scattered chat memory, because apparently civilization requires labels.

## Links

- Live: https://bearicide.github.io/the-choppa/
- Repo: https://github.com/bearicide/the-choppa
- Issues: https://github.com/bearicide/the-choppa/issues
- Actions: https://github.com/bearicide/the-choppa/actions

## Current baseline

- Loop mode works.
- Global phase lock is implemented.
- Per-pad timing is implemented.
- MIDI input works.
- Launchkey Mini MK3 is the primary controller.
- MIDI output / LED feedback is unfinished.
- Chop Mode is planned as a fuller dedicated workflow.
- Loaded-loop playback path needs investigation.

## Completed steps

1. Repo Wash: complete.
2. Audio-path audit: documented in `docs/AUDIO_PATH_AUDIT.md`.

## Current priority order

1. Audio-path fix pass
2. LED feedback
3. Chop Mode
4. UI cleanup

## Active audio audit findings

- Stop active playback before replacing the global loaded buffer.
- Make MIDI pad hits initialize/resume audio like pointer and keyboard hits.
- Make enhancement script loading deterministic between first load and reload.
- Decide whether compact bank and voice sounds stay on their separate audio context.
- Add low-noise status for pad hits with no loaded slice.

## Working definition

**Repo Wash** means a zero-behavior cleanup pass: remove clutter, organize project knowledge, standardize formatting defaults, and document structure without changing runtime behavior, selectors, mappings, URLs, timing, audio routing, or MIDI behavior.
