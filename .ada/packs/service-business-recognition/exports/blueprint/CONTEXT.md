# Context — Context engineering for a local service-business recognition system

A website/context system that ranks, gets cited by agents, converts attention to bookings, and gives Claude Code a real map.

## Known
- The user works in Claude Code.
- The output must feed Claude Code as governed context.

## Deliberately open (do not invent answers)
- Agent transactability gap: ranking and being recognized are not the same as being bookable by an agent
- Which booking surface the target vertical's customers' agents actually invoke (Reserve with Google vs vertical platforms like Booksy vs raw endpoint) — varies by trade and region
- Whether the business has any real-time availability source at all, or runs on manual phone scheduling
- Whether an open, agent-facing booking protocol/standard will stabilize before launch or stay fragmented per-agent
- Entity disambiguation: the agent must resolve WHICH business you are before it can recommend you
- Whether a same-named or duplicate listing already exists in the target market that will collide
- Whether the business has (or qualifies for) a Wikidata/notability anchor, or must rely solely on directory sameAs
- Exact set of canonical-profile providers a given AI uses for the target vertical and country
