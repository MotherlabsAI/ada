# ⟦ SEED ⟧

**Root intent.** tattoo studio command center

**Domain.** AI-Native Service Business Command Center
**User role.** Owner-operator of a local service business

**Build objective.** A command center to manage clients, bookings, staff, payments, content, campaigns, reviews, and automations.
**Knowledge objective.** A navigable world model of the business so Claude Code builds from structure, not a raw prompt.
**Trust objective.** Deterministic checks (starting with no-double-booking) that catch the failures that matter.

## Known context
- Bookings are tied to a staff member, a service, and a time slot.
- Deposits hold bookings; payments are real money.

## Unknown context (residue)
- Deposit amount / policy
- Cancellation and refund windows
- Whether multiple locations are in scope
- Exact persistence engine

## Assumptions
- The product requires persistent data.
- A single location to start.

## Sources
- Founder goal brief (Ada world-model schema graph, §13/§15)

## Constraints
- Local-first; no cloud account in P0.
- No subjective taste disguised as deterministic C.

## Risks
- Customer data is sensitive.
- Payment actions are high-stakes and gated.

> Provenance: Deterministically seeded from the founder goal brief and its Ada world-model schema graph (§13/§15), provided as the product spec. No model-generated content (AXIOM A2/D6).
