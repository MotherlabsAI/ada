# Open questions — the unknown-unknowns (Ω)

These are honest residue: design decisions the surface cannot yet answer. Naming them is the point — an unexamined assumption is more dangerous than a marked gap (A4).

## Ω UNK.100 · Light mode / adaptive theme — only a dark reference exists
Every token and contrast figure is measured against one dark reference (#1B1410 / #1E1E1E). Whether Ada needs a light-terminal theme — and whether AdaptiveColor (lipgloss) is worth the complexity — is unanswered. A user on a light terminal today gets earth tones tuned for dark.

*Why it's load-bearing:* A meaningful slice of terminals run light backgrounds; the surface's legibility there is currently unverified.

*If ignored:* Earth tones tuned for dark wash out on a light terminal and the premium feel inverts into a muddy mess.

## Ω UNK.101 · Mouse / OSC-8 hyperlinks — adopt or stay keyboard-pure?
Modern terminals support mouse events and OSC-8 hyperlinks (clickable node ids, file paths to the pack on disk). Whether Ada adopts any pointer affordance or stays deliberately keyboard-pure is an open identity decision, not just a feature toggle.

*Why it's load-bearing:* Clickable pack paths could make A5 (filesystem-backed) tangible; mouse could also dilute the keyboard-first identity.

*If ignored:* Either a half-mouse surface that works in some terminals and not others, or a missed cheap win (clickable .ada/ paths).

## Ω UNK.102 · The editable playground (A1 D3) — how does it FEEL in a TUI?
Axiom A1/D3 makes the exploratory graph USER-EDITABLE: spawn nodes, drag edges, push deeper, co-excavating alongside the engine. What the verbs, gestures, and feedback for that look like in a terminal — and how user-authored ∵ nodes visually differ from engine ∴/Ω — is entirely unexcavated.

*Why it's load-bearing:* This is a load-bearing product capability with zero surface design yet; it could be the most important screen Ada doesn't have.

*If ignored:* The editable layer ships as raw file editing because no interaction model was designed; the 'playground' promise is hollow.

## Ω UNK.103 · True first-run onboarding — is recognition enough?
The welcome assumes the user knows what a 'pack', a 'node', a 'graph' is. For a genuine first-ever run (never seen Ada, non-technical) recognition-over-recall may not be enough — there may need to be a one-time guided compile. Unverified whether the menu alone carries a true novice.

*Why it's load-bearing:* First-run is where non-technical users are won or lost; the current design is optimised for the returning 'Alex', not the stranger.

*If ignored:* A first-time non-technical user recognises the buttons but not the concepts, compiles nothing, and leaves.

## Ω UNK.104 · i18n / non-Latin wordmark / RTL — scope or debt?
The wordmark, tag, and all copy are Latin/English; box-drawing widths assume monospace Latin. Whether Ada ever needs non-Latin labels, RTL layout, or a non-Latin wordmark fallback is undecided — currently latent debt, not a plan.

*Why it's load-bearing:* Naming the boundary now prevents a silent monolingual assumption from hardening into the layout engine.

*If ignored:* CJK/RTL support is retrofitted later against width assumptions baked into every box — expensive and fragile.

## Ω UNK.105 · Persistent chat-input beside the tree — two focus regions
The research defers useFocusManager until 'the persistent chat-input-beside-the-tree milestone lands and two interactive regions are on screen at once.' That milestone's layout, focus-cycling, and motion-quiet-zones are unexcavated — today's one-pane model is a deliberate simplification with a known expansion point.

*Why it's load-bearing:* It's the named next architectural step for the surface; designing it early prevents the one-pane assumptions from calcifying.

*If ignored:* Two interactive regions get bolted on without a focus model and single-letter motions start firing into the chat input.

## Ω UNK.106 · Notifications on long compile vs sovereignty (A9)
A long compile might warrant a terminal bell or OS notification when done. But A9 (no phone-home, runs-and-exits) and the calm-motion ethic both push back. Whether ANY out-of-band signal fits Ada — and how it stays local-only — is unresolved.

*Why it's load-bearing:* It sits on a real tension between attentiveness and Ada's sovereignty/calm identity; resolving it wrong violates an axiom or annoys the user.

*If ignored:* A notification feature quietly reaches for an OS service that phones home, breaching A9; or a bell shatters the calm.

## Ω UNK.107 · Theme-ability vs identity dilution — the base16 trap
tokens.ts is built to re-skin the whole shell from one file — inviting user themes. But the more a user remaps, the less Ada looks like Ada (the base16/ngrok identity trap the palette work warns about). How much customization the surface should expose before the brand dissolves is an open product line.

*Why it's load-bearing:* It's a direct tension between the token system's flexibility and the 'sister to Claude Code' identity that flexibility could erase.

*If ignored:* Full theme exposure turns every install into a different-looking tool; the recognisable Ada identity evaporates.
