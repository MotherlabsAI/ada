# A11Y.083 · Keyboard-only, one keymap source

> ∴ inference · L2 · C3 · area **A11Y** · from `docs/SURFACE-DESIGN.md`

## Summary
The surface is fully operable by keyboard with no mouse dependency; every action has a key, and all keys come from a single source of truth that also generates the footer and `?` overlay. Single-letter motions are gated behind a 'navigation has focus' state so letters never fire motions while an input owns focus.

## Why it matters
A TUI is keyboard-first by nature; a single keymap source is what keeps help, footer, and bindings provably in sync.

## Failure if missing
A letter motion fires while the user is typing an intent, mangling their input — the classic modal-TUI bug.

## Links
- parents: `A11Y.080`
- children: —
- dependsOn: `NAV.053`
- siblings: `A11Y.082`
- guardedBy: —
