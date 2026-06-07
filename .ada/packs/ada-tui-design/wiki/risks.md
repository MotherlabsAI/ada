# Risks

The failure modes each cluster guards against, distilled.

## ROOT — Design world model & north-star
- Each screen gets designed in isolation; the shell drifts into confetti and inconsistency.
- The surface reads as a LangChain-clone dashboard — busy, cool-toned, generic — and the premium promise breaks on first contact.
- The surface is beautiful only on the designer's 120-col truecolor iTerm; everyone else gets a broken first impression.
## IDENT — Visual identity — wordmark, mascot, gradient
- The banner clips, mis-wraps, or spews box-drawing noise into a pipe — the first impression is broken before the product speaks.
- A fully animated mascot competes with the cursor and the compile heartbeat — three moving things, the opposite of calm.
- A rainbow per-letter wordmark turns the signature mark into confetti and adds a dependency for 20 lines of owned code.
- The user stares at a pretty ADA block with no idea what it compiles or why they should trust it.
## PALETTE — Colour system — tokens, contrast, degradation
- Roles borrow from the area palette (today slate=body, rose=failure, cyan=link) so restyling the chrome silently changes what colours MEAN.
- Accent leaks past 10% and the 'one warm pop' becomes wallpaper; nothing draws the eye because everything does.
- textMuted #7A6650 (~3.4:1) ships as body text on bg and low-vision users — who paid — cannot read the metadata.
- Brand colours render wrong or invisible on a 256-colour terminal; the user blames Ada for a 'broken' screen.
- Each new area mints a new near-duplicate hue; at 10 clusters the tree is indistinguishable noise.
## LAYOUT — Spatial structure — skeleton, whitespace, focus
- Panes drift between screens; the footer floats mid-body; the user re-reads the layout every transition.
- Following an edge swaps the whole screen; the user loses their place and their sense of where they are.
- Inconsistent gaps make the screen feel hand-assembled and cheap, even with a perfect palette.
- Every pane gets a box; the screen becomes a grid of cells and the signature frame loses all weight.
- During scroll the inverse bar strobes and the selected node loses its identity colour exactly when you're trying to identify it.
## MOTION — Calm motion — one clock, heartbeat, restraint
- Three timers drift out of phase, the banner and spinner stutter against each other, and a 'calm' surface jitters.
- A generic spinner hides the work; the user can't tell a 9-stage compile from a hang and loses trust at the exact moment it's earned.
- Border and mascot pulse simultaneously and the home screen feels anxious instead of inviting.
- A spinner appears, the layout jumps a row, and motion-sensitive users get no way to turn it off.
- Twitching counts and pulsing idle borders train the user to ignore motion — so they miss it when it finally means something.
## NAV — Navigation — prune-filter, edges, keymap
- Today's onCommand('search') jumps the cursor and discards structure; the user finds a match but loses the map.
- The user follows three edges across areas and the breadcrumb still shows the original folder path — orientation is lost.
- Edges are invisible in tree mode and the back-stack is reader-only; the user can't traverse the web they were promised.
- The footer lists keys that don't work in this mode, or the `?` overlay drifts from the real bindings — every shown key is now suspect.
## FLOW — Journeys — welcome, compile, open, reader
- A blank prompt expecting a command the user has never been taught — the non-technical user bounces immediately.
- The compile feels like a black-box spinner; the user can't distinguish progress from a hang and never trusts the output.
- Every return starts from a cold menu with no memory of the last session; the tool feels stateless and disposable.
- The capsule opens with no sense of where it sits; the reader becomes a wall of text disconnected from the graph.
## STATE — States & edge cases — empty, error, resize, non-TTY
- A new user sees an empty panel and a blinking cursor with no idea that 'Compile an idea' is the way in.
- A frozen-looking screen during a 20s compile reads as a crash; the user kills it mid-pack.
- A raw stack trace or a silently empty pack; the non-technical user is stranded with no recoverable next step.
- The user resizes their terminal and the layout is wrong until they press a key — a visible, latent bug.
- Piping `ada` into a file captures escape soup and box-drawing characters instead of readable text.
## A11Y — Accessibility — colour-free legibility, SR, keyboard
- A status communicated by colour alone vanishes for ~8% of men and 100% of NO_COLOR users; meaning is silently lost.
- NO_COLOR is ignored or FORCE_COLOR can't force colour back; power users and accessibility users both get the wrong output.
- A screen reader reads the box-drawing wordmark character by character and never reaches the actual menu.
- A letter motion fires while the user is typing an intent, mangling their input — the classic modal-TUI bug.
## VOICE — Voice & microcopy — calm, premium, honest
- Either a wall of compiler jargon (alienating) or cutesy hand-holding (insulting); both break the premium contract.
- Vague labels ('Start', 'Go', 'New') force the user to guess; the menu stops being self-explanatory.
- Provenance is shown only in colour or only in words; under NO_COLOR or at a glance the user can't tell a fact from a guess.
- Cheerful copy papers over a failure ('All done!') and the user discovers the lie later — the worst trust outcome.
