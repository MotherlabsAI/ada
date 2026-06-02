# AI-Native Service Business Command Center

> tattoo studio command center

**Build objective.** A command center to manage clients, bookings, staff, payments, content, campaigns, reviews, and automations.

**Trust objective.** Deterministic checks (starting with no-double-booking) that catch the failures that matter.

**Map.** 45 nodes · 39 edges · clusters: ROOT, L2C, DOMAIN, WORKFLOW, DATA, CHECK, BLUEPRINT, CLAUDE.

## Start here (high-value nodes)
- ⟡ ● ∴ κ ⇒ **ROOT.007** Language-to-Code Spine — The translation layer that turns human language into software primitives: nouns into entities, verbs into actions, rules into checks.
- κ ● ∴ κ **ROOT.008** C Verification Engine — The deterministic trust layer. Runnable pass/fail predicates that survive model changes because they check outputs directly.
- ! ● ∵ **ROOT.011** Human Governance Layer — Humans govern, agents execute. C0-C2 surfaces and high-risk actions are gates.
- ◇ ● ∴ κ ⇒ **L2C.001** Nouns -> Entities — Nouns in user language become durable software entities: clients, bookings, staff, services, payments.
- ◇ ● ∴ κ ⇒ **L2C.002** Verbs -> Actions — Verbs become services, jobs, and API actions: book, reschedule, cancel, charge, refund.
- ! ● ∴ κ ⇒ **L2C.003** Roles -> Permissions — Roles become permissions and policies: owner, staff, front-desk, client.
- ◇ ● ∴ κ ⇒ **L2C.004** States -> State Machines — Lifecycle words become state machines: lead -> booked -> deposit-paid -> completed | cancelled | no-show.
- ◇ ● ∴ κ ⇒ **L2C.005** Events -> Event Log — Things that happen become an append-only event log: booking.created, payment.captured.
- ◇ ● ∴ κ ⇒ **L2C.006** Time Phrases -> Schedules — Time language becomes schedules and reminders: '24h before', 'every Monday', 'within 2 business days'.
- ◇ ● ∴ κ ⇒ **L2C.007** Money Terms -> Ledger Objects — Money words become ledger objects in integer minor units: deposits, balances, refunds.
- κ ● ∴ κ **L2C.010** Rules -> Validations — Hard rules become validations: minimum deposit, cancellation window, max party size.
- ◇ ● ∴ κ ⇒ **L2C.011** Must-Language -> Acceptance Criteria — 'Must' / 'never' phrases become acceptance criteria the executor builds against.
- ◌ ● Ω **L2C.012** Unknowns -> Residue — What cannot be answered yet becomes visible residue instead of a fabricated answer.
- λ ● ∴ ⇒ **L2C.013** Repeated Procedures -> Skills — Procedures the operator repeats become Claude Code skills the executor can invoke.
- ◇ ● ∴ ⇒ **L2C.014** Desired UX -> Routes / Components — Experience language becomes routes and components: a calendar, a lead inbox, a payments view.
- ◇ ● ∴ κ ⇒ **L2C.015** Relationship Language -> Foreign Keys — 'Belongs to' / 'has many' becomes foreign keys and referential integrity.
- κ ● ∴ κ **L2C.016** Failure Language -> C Candidate — 'It must never X' becomes a candidate deterministic check.
- ◇ ● ∴ κ ⇒ **DOMAIN.003** Staff Member — A person who delivers services and owns a calendar of bookings.
- ◇ ● ∴ κ ⇒ **DOMAIN.004** Client / Customer — A person who books and pays for services.
- ◇ ● ∴ κ ⇒ **DOMAIN.006** Service Offering — Something bookable, with a duration and a price.
- κ ● ∴ κ ⇒ **DOMAIN.007** Appointment — A booked slot: a client, a staff member, a service, a start and end time, and a lifecycle state.
- ◇ ● ∴ κ ⇒ **DOMAIN.009** Deposit — An up-front partial payment that holds a booking.
- κ ● ∴ κ ⇒ **DOMAIN.010** Payment — Money moving in or out, recorded in the ledger in integer minor units.
- κ ● ∴ κ ⇒ **WORKFLOW.005** Booking Flow — Select service -> choose staff and slot -> confirm -> hold with deposit. The flow the double-booking check guards.
- κ ● ∴ κ ⇒ **WORKFLOW.006** Deposit Flow — Capture a deposit at booking time and reconcile it at checkout.
- ◇ ● ∴ κ ⇒ **DATA.001** Canonical Entity Registry — The de-duplicated list of domain entities and their canonical names.
- ◇ ● ∴ κ ⇒ **DATA.002** Database Schema — The canonical relational schema the executor builds and migrates against.
- ◇ ● ∴ κ ⇒ **DATA.003** Client Table — clients(id, name, contact, created_at).
- ◇ ● ∴ κ ⇒ **DATA.004** Staff Table — staff(id, name, role, active).
- ◇ ● ∴ κ ⇒ **DATA.006** Appointment Table — bookings(id, staff_id, client_id, service_id, starts_at, ends_at, status).
- ◇ ● ∴ κ ⇒ **DATA.007** Payment Table — payments(id, booking_id, amount_cents, kind).
- κ ● ∵ κ **CHECK.001** no_double_booking — No active booking may overlap another active booking for the same staff member.
- κ ● ∵ κ **CHECK.002** non_negative_payment — Every payment amount is non-negative; refunds are a refund kind with a positive amount.
- κ ● ∵ κ **CHECK.003** booking_well_formed — Every active booking references a staff, client, and service, and starts before it ends.
- π ● ∴ κ ⇒ **BLUEPRINT.001** Blueprint Object — The deterministic build contract: scope, stack, data model, routes, tasks, tests, acceptance, done.
- ◇ ● ∴ κ ⇒ **BLUEPRINT.006** Data Model Plan — The tables, columns, and constraints the executor must create.
- κ ● ∴ κ ⇒ **BLUEPRINT.015** Acceptance Criteria — The must-pass conditions for the booking feature, including 'no double-booking'.
- λ ● ∴ ⇒ **CLAUDE.002** CLAUDE.md Export — Project instructions telling Claude Code which pack to load, what matters, what not to touch, and when to ask.
- λ ● ∴ ⇒ **CLAUDE.003** SKILL.md Export — A loadable skill that teaches Claude Code how to use the Ada pack and run its C checks.
- λ ● ∴ κ ⇒ **CLAUDE.008** C Verifier Subagent — A subagent that runs the pack's verify.mjs and reports pass/fail before code is accepted.

## Sections
- [Glossary](glossary.md)
- [Data model](data-model.md)
- [Workflows](workflows.md)
- [C checks](c-checks.md)
- [Open questions](open-questions.md)
- [Risks](risks.md)
