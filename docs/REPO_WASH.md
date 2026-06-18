# Repo Wash Plan

Repo Wash is the cleanup lane. It is intentionally boring. That is how we avoid transforming a working music tool into a modern art installation called *404 With Reverb*.

## Scope

Repo Wash may include:

- Formatting defaults
- Ignore rules
- File map documentation
- Status documentation
- Dead-file identification
- Duplicate-file identification
- Naming notes
- Cleanup TODOs

Repo Wash must not include:

- Audio behavior changes
- MIDI behavior changes
- Timing changes
- Pad mapping changes
- Selector or ID changes
- Asset path changes
- Service worker cache strategy changes without a test pass

## Step 1 checklist

- [x] Create a wash branch.
- [x] Add local/editor junk ignore rules.
- [x] Add editor formatting defaults.
- [x] Add current status document.
- [x] Add architecture/file map.
- [ ] Compare branch against `main`.
- [ ] Merge only if diff is documentation/config-only.

## Next after wash

The next project lane is the **audio-path audit**. That should trace every sound path before touching LED output or Chop Mode.
