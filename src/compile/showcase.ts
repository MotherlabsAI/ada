/**
 * The showcase compile target: AI-Native Service Business Command Center (spec §15).
 *
 * This is a DETERMINISTIC seed (DECISION D6): the graph is authored from the spec,
 * fully provenance-traceable, not model-generated. The LLM-driven intent->graph layer
 * slots into this same contract later, behind the human gate (AXIOM A2/A4).
 */
import type {
  NodeCapsule,
  Edge,
  Graph,
  Seed,
  PackModel,
  Colour,
  Glyph,
  TruthClass,
  CheckClass,
  Depth,
  Projection,
} from "../core/types.js";
import { TRUTH_GLYPH } from "../core/grammar.js";
import { clusterOf } from "../core/ids.js";
import { projectWiki } from "../pack/wiki.js";

interface Spec {
  id: string;
  label: string;
  summary: string;
  why: string;
  failure: string;
  colour?: Colour;
  glyph?: Glyph;
  truth?: TruthClass;
  depth?: Depth;
  check?: CheckClass;
  candidates?: string[];
  targets?: Projection[];
  parents?: string[];
  children?: string[];
  siblings?: string[];
  dependsOn?: string[];
  exportsTo?: string[];
  guardedBy?: string[];
  assumptions?: string[];
  unknowns?: string[];
  nodeType?: string;
  open?: "high" | "medium" | "low";
}

function graphSymbol(
  glyph: Glyph,
  truth: TruthClass,
  check: CheckClass,
  targets: Projection[],
): string {
  const parts = [glyph, "●", TRUTH_GLYPH[truth]];
  if (check === "C3" || check === "C4" || check === "C5") parts.push("κ");
  if (targets.some((t) => t === "claude" || t === "blueprint" || t === "pack"))
    parts.push("⇒");
  return parts.join(" ");
}

function badges(
  depth: Depth,
  targets: Projection[],
  check: CheckClass,
): string[] {
  const b: string[] = [depth];
  if (targets.includes("code")) b.push("code");
  b.push(check);
  if (targets.some((t) => t === "claude" || t === "blueprint"))
    b.push("exportable");
  return b;
}

function n(s: Spec): NodeCapsule {
  const truth = s.truth ?? "inference";
  const check = s.check ?? "C2";
  const depth = s.depth ?? "L4";
  const glyph = s.glyph ?? "◇";
  const targets = s.targets ?? ["graph", "wiki"];
  return {
    id: s.id,
    label: s.label,
    glyph,
    colour: s.colour ?? "deep_blue",
    status: "finished",
    depth,
    truth,
    role: {
      cluster: clusterOf(s.id),
      nodeType: s.nodeType ?? "context_node",
      compileTargets: targets,
    },
    localContext: {
      summary: s.summary,
      whyItMatters: s.why,
      failureIfMissing: s.failure,
    },
    worldLinks: {
      parents: s.parents ?? [],
      children: s.children ?? [],
      siblings: s.siblings ?? [],
      dependsOn: s.dependsOn ?? [],
      exportsTo: s.exportsTo ?? [],
      guardedBy: s.guardedBy ?? [],
    },
    epistemics: {
      claimClass: s.nodeType ?? "semantic_mapping",
      confidence: truth === "residue" ? "low" : "high",
      sourceStatus:
        truth === "source" ? "user_or_spec_provided" : "derived_from_intent",
      assumptions: s.assumptions ?? [],
      unknowns: s.unknowns ?? [],
    },
    checkability: {
      class: check,
      explanation: checkExplain(check),
      candidates: s.candidates ?? [],
    },
    ui: {
      visibleBadges: badges(depth, targets, check),
      graphSymbol: graphSymbol(glyph, truth, check, targets),
      openPriority: s.open ?? (depth === "L5" ? "high" : "medium"),
    },
    quality: {
      gateStatus: "passed",
      genericnessScore: "low",
      actionEnablementScore: "high",
    },
  };
}

function checkExplain(c: CheckClass): string {
  switch (c) {
    case "C0":
      return "Uncheckable context; explanatory only.";
    case "C1":
      return "Human review only; no deterministic predicate.";
    case "C2":
      return "Rubric or LLM-assisted; not a guarantee.";
    case "C3":
      return "Deterministic predicate is possible.";
    case "C4":
      return "Property-based / generative check is possible.";
    case "C5":
      return "Static, type, or database-level constraint is possible.";
  }
}

// ── Nodes ────────────────────────────────────────────────────────────────────────

const ROOT: NodeCapsule[] = [
  n({
    id: "ROOT.007",
    label: "Language-to-Code Spine",
    colour: "deep_blue",
    depth: "L5",
    check: "C3",
    glyph: "⟡",
    nodeType: "spine",
    targets: ["graph", "wiki", "blueprint", "claude", "c"],
    summary:
      "The translation layer that turns human language into software primitives: nouns into entities, verbs into actions, rules into checks.",
    why: "Without it, the executor builds around vague prose instead of stable domain objects.",
    failure:
      "Inconsistent names, duplicate models, weak schemas, UI that does not match the domain.",
    children: ["L2C.001", "L2C.002", "L2C.003"],
    exportsTo: ["CLAUDE.md", "BLUEPRINT.md"],
  }),
  n({
    id: "ROOT.008",
    label: "C Verification Engine",
    colour: "green",
    depth: "L5",
    check: "C5",
    glyph: "κ",
    nodeType: "verification",
    targets: ["c"],
    summary:
      "The deterministic trust layer. Runnable pass/fail predicates that survive model changes because they check outputs directly.",
    why: "Generated code is disposable and prompts go stale; executable invariants are the compounding trust asset.",
    failure:
      "Wrong output looks coherent and ships, because nothing checked it.",
    children: ["CHECK.001", "CHECK.002", "CHECK.003"],
  }),
  n({
    id: "ROOT.011",
    label: "Human Governance Layer",
    colour: "rose",
    depth: "L5",
    check: "C1",
    glyph: "!",
    nodeType: "governance",
    truth: "source",
    targets: ["gov"],
    summary:
      "Humans govern, agents execute. C0-C2 surfaces and high-risk actions are gates.",
    why: "Users pay real money; one confident wrong build is reputational damage.",
    failure:
      "Ada fabricates ground truth where none exists — the exact failure it exists to prevent.",
    assumptions: [
      "The operator (Alex) defines what 'good' looks like at C0-C2.",
    ],
  }),
];

const L2C: NodeCapsule[] = [
  n({
    id: "L2C.001",
    label: "Nouns -> Entities",
    depth: "L5",
    check: "C3",
    glyph: "◇",
    nodeType: "translation_primitive",
    targets: ["graph", "wiki", "code", "blueprint", "claude", "c"],
    summary:
      "Nouns in user language become durable software entities: clients, bookings, staff, services, payments.",
    why: "Entities are the stable spine of the schema; everything else hangs off them.",
    failure:
      "Duplicate or vague models the executor cannot build a coherent schema from.",
    parents: ["ROOT.007"],
    children: ["DATA.001"],
    siblings: ["L2C.002", "L2C.003"],
    candidates: [
      "schema.no_duplicate_entity_names",
      "schema.entity_names_match_context_pack",
    ],
    exportsTo: ["BLUEPRINT.md", "CONTEXT.md"],
    unknowns: ["Exact persistence engine not yet selected."],
    open: "high",
  }),
  n({
    id: "L2C.002",
    label: "Verbs -> Actions",
    depth: "L5",
    check: "C3",
    targets: ["code", "blueprint", "c"],
    nodeType: "translation_primitive",
    summary:
      "Verbs become services, jobs, and API actions: book, reschedule, cancel, charge, refund.",
    why: "Actions define the executable surface area and the permission boundaries around it.",
    failure:
      "Behaviour scattered across UI handlers with no service layer to test or guard.",
    parents: ["ROOT.007"],
    siblings: ["L2C.001", "L2C.003"],
  }),
  n({
    id: "L2C.003",
    label: "Roles -> Permissions",
    colour: "rose",
    depth: "L5",
    check: "C4",
    glyph: "!",
    nodeType: "translation_primitive",
    targets: ["code", "blueprint", "c", "gov"],
    summary:
      "Roles become permissions and policies: owner, staff, front-desk, client.",
    why: "Who-can-do-what is a security invariant, not a UI detail.",
    failure:
      "Privilege bugs: a client cancels another client's booking; staff sees the full ledger.",
    parents: ["ROOT.007"],
    siblings: ["L2C.001", "L2C.002"],
    guardedBy: ["GOV.005"],
    candidates: ["authz.every_action_has_required_role"],
  }),
  n({
    id: "L2C.004",
    label: "States -> State Machines",
    depth: "L5",
    check: "C4",
    nodeType: "translation_primitive",
    targets: ["code", "blueprint", "c"],
    summary:
      "Lifecycle words become state machines: lead -> booked -> deposit-paid -> completed | cancelled | no-show.",
    why: "Illegal transitions are a major source of silent data corruption.",
    failure:
      "A cancelled booking gets charged; a completed booking is rebooked.",
    candidates: ["state.no_illegal_transition"],
  }),
  n({
    id: "L2C.005",
    label: "Events -> Event Log",
    depth: "L5",
    check: "C4",
    targets: ["code", "blueprint", "c"],
    nodeType: "translation_primitive",
    summary:
      "Things that happen become an append-only event log: booking.created, payment.captured.",
    why: "Auditability and recovery depend on an immutable record of what occurred.",
    failure: "No way to reconstruct how the system reached a bad state.",
  }),
  n({
    id: "L2C.006",
    label: "Time Phrases -> Schedules",
    depth: "L5",
    check: "C4",
    targets: ["code", "blueprint", "c"],
    nodeType: "translation_primitive",
    summary:
      "Time language becomes schedules and reminders: '24h before', 'every Monday', 'within 2 business days'.",
    why: "Timezones, business hours, and DST are quietly hard and easy to get wrong.",
    failure: "Reminders fire at 3am; 'next day' crosses a timezone and slips.",
  }),
  n({
    id: "L2C.007",
    label: "Money Terms -> Ledger Objects",
    depth: "L5",
    check: "C5",
    targets: ["code", "blueprint", "c"],
    nodeType: "translation_primitive",
    summary:
      "Money words become ledger objects in integer minor units: deposits, balances, refunds.",
    why: "Floats and ad-hoc money math cause real financial errors.",
    failure:
      "Rounding drift; negative balances; a refund that exceeds the payment.",
    candidates: [
      "ledger.amounts_are_integer_minor_units",
      "ledger.non_negative_payment",
    ],
  }),
  n({
    id: "L2C.008",
    label: "Locations -> Branch Objects",
    depth: "L4",
    check: "C3",
    targets: ["code", "blueprint"],
    nodeType: "translation_primitive",
    summary:
      "Place language becomes branch/location objects with their own hours and staff.",
    why: "Multi-location businesses need scoping or data leaks across branches.",
    failure:
      "A booking lands at the wrong location; staff appear available where they are not.",
  }),
  n({
    id: "L2C.009",
    label: "Documents -> Templates",
    colour: "sage",
    depth: "L4",
    check: "C3",
    targets: ["code", "blueprint"],
    nodeType: "translation_primitive",
    summary:
      "Recurring documents become templates: consent forms, quotes, receipts.",
    why: "Templated documents are auditable and consistent; ad-hoc ones are not.",
    failure: "Missing consent on file; inconsistent quote wording.",
  }),
  n({
    id: "L2C.010",
    label: "Rules -> Validations",
    colour: "green",
    depth: "L5",
    check: "C4",
    glyph: "κ",
    targets: ["c"],
    nodeType: "translation_primitive",
    summary:
      "Hard rules become validations: minimum deposit, cancellation window, max party size.",
    why: "Rules stated in prose are not enforced; rules as validations are.",
    failure: "Policy exists on paper but the system happily violates it.",
  }),
  n({
    id: "L2C.011",
    label: "Must-Language -> Acceptance Criteria",
    colour: "green",
    depth: "L5",
    check: "C3",
    nodeType: "translation_primitive",
    targets: ["blueprint", "c"],
    summary:
      "'Must' / 'never' phrases become acceptance criteria the executor builds against.",
    why: "Acceptance criteria turn intent into a testable definition of done.",
    failure:
      "The build is 'finished' but nobody can say whether it meets intent.",
  }),
  n({
    id: "L2C.012",
    label: "Unknowns -> Residue",
    colour: "amber",
    depth: "L5",
    check: "C1",
    glyph: "◌",
    truth: "residue",
    nodeType: "residue",
    targets: ["wiki"],
    summary:
      "What cannot be answered yet becomes visible residue instead of a fabricated answer.",
    why: "A hole is better than a lie (AXIOM A4).",
    failure:
      "The system invents a constraint the user never set and builds on it.",
    unknowns: [
      "Deposit amount policy",
      "Refund window",
      "Whether multi-location is in scope",
    ],
  }),
  n({
    id: "L2C.013",
    label: "Repeated Procedures -> Skills",
    colour: "cyan",
    depth: "L5",
    check: "C2",
    glyph: "λ",
    targets: ["claude"],
    nodeType: "translation_primitive",
    summary:
      "Procedures the operator repeats become Claude Code skills the executor can invoke.",
    why: "Repeated work belongs in a named, reusable procedure, not re-explained each time.",
    failure: "The same instructions get re-typed and drift.",
    exportsTo: ["SKILL.md"],
  }),
  n({
    id: "L2C.014",
    label: "Desired UX -> Routes / Components",
    depth: "L5",
    check: "C2",
    targets: ["code", "blueprint"],
    nodeType: "translation_primitive",
    summary:
      "Experience language becomes routes and components: a calendar, a lead inbox, a payments view.",
    why: "UX intent must map to concrete screens or it stays a vibe.",
    failure: "The executor guesses the screens and builds the wrong workflow.",
  }),
  n({
    id: "L2C.015",
    label: "Relationship Language -> Foreign Keys",
    depth: "L5",
    check: "C5",
    targets: ["code", "blueprint", "c"],
    nodeType: "translation_primitive",
    summary:
      "'Belongs to' / 'has many' becomes foreign keys and referential integrity.",
    why: "Relationships expressed in prose do not enforce integrity; keys do.",
    failure: "Orphaned bookings; payments pointing at deleted clients.",
    candidates: ["schema.booking_references_existing_staff_and_client"],
  }),
  n({
    id: "L2C.016",
    label: "Failure Language -> C Candidate",
    colour: "green",
    depth: "L5",
    check: "C4",
    glyph: "κ",
    targets: ["c"],
    nodeType: "translation_primitive",
    summary: "'It must never X' becomes a candidate deterministic check.",
    why: "Stated failure modes are the richest source of durable invariants.",
    failure:
      "Known failure modes recur because nothing was written to catch them.",
    candidates: ["c.no_double_booking"],
  }),
];

const DOMAIN: NodeCapsule[] = [
  n({
    id: "DOMAIN.003",
    label: "Staff Member",
    depth: "L5",
    check: "C4",
    nodeType: "entity",
    targets: ["code", "blueprint", "c"],
    summary: "A person who delivers services and owns a calendar of bookings.",
    why: "Bookings, availability, and the double-booking invariant all hang off staff identity.",
    failure: "Bookings cannot be scoped to who actually performs them.",
    children: ["DATA.004"],
  }),
  n({
    id: "DOMAIN.004",
    label: "Client / Customer",
    depth: "L5",
    check: "C4",
    nodeType: "entity",
    targets: ["code", "blueprint", "c"],
    summary: "A person who books and pays for services.",
    why: "The core relationship the whole command center revolves around.",
    failure:
      "No durable customer record; history and payments cannot be tied together.",
    children: ["DATA.003"],
  }),
  n({
    id: "DOMAIN.006",
    label: "Service Offering",
    depth: "L5",
    check: "C3",
    nodeType: "entity",
    targets: ["code", "blueprint"],
    summary: "Something bookable, with a duration and a price.",
    why: "Duration drives scheduling; price drives the ledger.",
    failure:
      "Bookings have no canonical duration, so overlap and capacity cannot be computed.",
    children: ["DATA.005"],
  }),
  n({
    id: "DOMAIN.007",
    label: "Appointment",
    colour: "deep_blue",
    depth: "L5",
    check: "C4",
    glyph: "κ",
    nodeType: "entity",
    targets: ["code", "blueprint", "c"],
    summary:
      "A booked slot: a client, a staff member, a service, a start and end time, and a lifecycle state.",
    why: "The central transactional object; the double-booking invariant lives here.",
    failure:
      "Overlapping or malformed bookings corrupt the calendar and the day-of-service flow.",
    children: ["DATA.006"],
    guardedBy: ["CHECK.001", "CHECK.003"],
    candidates: ["c.no_double_booking", "c.booking_well_formed"],
  }),
  n({
    id: "DOMAIN.009",
    label: "Deposit",
    depth: "L5",
    check: "C5",
    nodeType: "entity",
    targets: ["code", "blueprint", "c"],
    summary: "An up-front partial payment that holds a booking.",
    why: "Deposits reduce no-shows and must reconcile against the final balance.",
    failure: "A deposit exceeds the total, or is lost on reschedule.",
    guardedBy: ["CHECK.002"],
  }),
  n({
    id: "DOMAIN.010",
    label: "Payment",
    colour: "deep_blue",
    depth: "L5",
    check: "C5",
    glyph: "κ",
    nodeType: "entity",
    targets: ["code", "blueprint", "c"],
    summary:
      "Money moving in or out, recorded in the ledger in integer minor units.",
    why: "Financial correctness is non-negotiable; this is where money math is checked.",
    failure: "Negative amounts, float drift, or refunds exceeding payments.",
    children: ["DATA.007"],
    guardedBy: ["CHECK.002"],
    candidates: ["c.non_negative_payment"],
  }),
];

const WORKFLOW: NodeCapsule[] = [
  n({
    id: "WORKFLOW.005",
    label: "Booking Flow",
    depth: "L5",
    check: "C4",
    glyph: "κ",
    nodeType: "workflow",
    targets: ["blueprint", "c"],
    summary:
      "Select service -> choose staff and slot -> confirm -> hold with deposit. The flow the double-booking check guards.",
    why: "The highest-traffic, highest-stakes workflow in the command center.",
    failure:
      "Two clients hold the same staff slot; the day falls apart at the desk.",
    dependsOn: ["DOMAIN.007", "DOMAIN.003"],
    guardedBy: ["CHECK.001"],
    open: "high",
  }),
  n({
    id: "WORKFLOW.006",
    label: "Deposit Flow",
    depth: "L5",
    check: "C5",
    glyph: "κ",
    nodeType: "workflow",
    targets: ["blueprint", "c"],
    summary: "Capture a deposit at booking time and reconcile it at checkout.",
    why: "Deposits are money; they must reconcile exactly.",
    failure: "Deposit double-counted or dropped on reschedule.",
    dependsOn: ["DOMAIN.009", "DOMAIN.010"],
    guardedBy: ["CHECK.002"],
  }),
  n({
    id: "WORKFLOW.007",
    label: "Reschedule Flow",
    depth: "L4",
    check: "C4",
    glyph: "κ",
    nodeType: "workflow",
    targets: ["blueprint", "c"],
    summary:
      "Move a booking to a new slot without losing the deposit or creating an overlap.",
    why: "Reschedules are where double-bookings and lost deposits sneak in.",
    failure:
      "The old slot stays held, or the new slot overlaps another booking.",
    dependsOn: ["DOMAIN.007"],
    guardedBy: ["CHECK.001"],
  }),
  n({
    id: "WORKFLOW.008",
    label: "Cancellation Flow",
    depth: "L4",
    check: "C4",
    glyph: "κ",
    nodeType: "workflow",
    targets: ["blueprint", "c"],
    summary: "Release a slot and apply the cancellation policy to the deposit.",
    why: "Cancellation policy is real money and must be enforced, not implied.",
    failure: "A cancelled booking still blocks the slot or is still charged.",
    dependsOn: ["DOMAIN.007"],
    guardedBy: ["CHECK.001"],
  }),
];

const DATA: NodeCapsule[] = [
  n({
    id: "DATA.001",
    label: "Canonical Entity Registry",
    depth: "L5",
    check: "C4",
    nodeType: "registry",
    targets: ["code", "blueprint", "c"],
    summary:
      "The de-duplicated list of domain entities and their canonical names.",
    why: "One agreed name per entity prevents duplicate models and naming drift.",
    failure: "The executor invents three names for the same thing.",
    parents: ["L2C.001"],
    children: ["DATA.002"],
    candidates: ["schema.no_duplicate_entity_names"],
  }),
  n({
    id: "DATA.002",
    label: "Database Schema",
    depth: "L5",
    check: "C5",
    nodeType: "schema",
    targets: ["code", "blueprint", "c"],
    summary:
      "The canonical relational schema the executor builds and migrates against.",
    why: "One source of truth for shape; constraints live closest to the data.",
    failure: "Drifting ad-hoc tables that no constraint protects.",
    children: ["DATA.003", "DATA.004", "DATA.005", "DATA.006", "DATA.007"],
  }),
  n({
    id: "DATA.003",
    label: "Client Table",
    depth: "L5",
    check: "C5",
    nodeType: "table",
    targets: ["code", "blueprint", "c"],
    summary: "clients(id, name, contact, created_at).",
    why: "Durable customer identity for history and payments.",
    failure: "Duplicate or anonymous clients break reporting and follow-up.",
    parents: ["DATA.002"],
  }),
  n({
    id: "DATA.004",
    label: "Staff Table",
    depth: "L5",
    check: "C5",
    nodeType: "table",
    targets: ["code", "blueprint", "c"],
    summary: "staff(id, name, role, active).",
    why: "Scopes bookings and availability to a real person.",
    failure: "Bookings cannot be attributed; availability is meaningless.",
    parents: ["DATA.002"],
  }),
  n({
    id: "DATA.005",
    label: "Service Table",
    depth: "L4",
    check: "C5",
    nodeType: "table",
    targets: ["code", "blueprint", "c"],
    summary: "services(id, name, minutes, price_cents).",
    why: "Duration and price drive scheduling and the ledger.",
    failure: "No canonical duration; overlap and pricing cannot be computed.",
    parents: ["DATA.002"],
  }),
  n({
    id: "DATA.006",
    label: "Appointment Table",
    depth: "L5",
    check: "C5",
    nodeType: "table",
    targets: ["code", "blueprint", "c"],
    summary:
      "bookings(id, staff_id, client_id, service_id, starts_at, ends_at, status).",
    why: "The transactional heart; the overlap and well-formedness checks run against this.",
    failure: "Overlapping or orphaned bookings.",
    parents: ["DATA.002"],
    guardedBy: ["CHECK.001", "CHECK.003"],
  }),
  n({
    id: "DATA.007",
    label: "Payment Table",
    depth: "L5",
    check: "C5",
    nodeType: "table",
    targets: ["code", "blueprint", "c"],
    summary: "payments(id, booking_id, amount_cents, kind).",
    why: "The ledger; amounts are integer minor units.",
    failure: "Negative amounts or floats produce financial errors.",
    parents: ["DATA.002"],
    guardedBy: ["CHECK.002"],
  }),
];

const CHECK: NodeCapsule[] = [
  n({
    id: "CHECK.001",
    label: "no_double_booking",
    colour: "green",
    depth: "L5",
    check: "C4",
    glyph: "κ",
    nodeType: "deterministic_check",
    truth: "source",
    targets: ["c"],
    summary:
      "No active booking may overlap another active booking for the same staff member.",
    why: "The signature trust invariant of the showcase; the spec's 'first trust moment'.",
    failure:
      "Double-booked staff — the failure Ada exists to catch before the executor ships it.",
    parents: ["ROOT.008"],
    dependsOn: ["DATA.006"],
    candidates: ["c.no_double_booking"],
  }),
  n({
    id: "CHECK.002",
    label: "non_negative_payment",
    colour: "green",
    depth: "L5",
    check: "C5",
    glyph: "κ",
    nodeType: "deterministic_check",
    truth: "source",
    targets: ["c"],
    summary:
      "Every payment amount is non-negative; refunds are a refund kind with a positive amount.",
    why: "Financial correctness, enforced at the data edge.",
    failure: "Negative or malformed money.",
    parents: ["ROOT.008"],
    dependsOn: ["DATA.007"],
    candidates: ["c.non_negative_payment"],
  }),
  n({
    id: "CHECK.003",
    label: "booking_well_formed",
    colour: "green",
    depth: "L5",
    check: "C5",
    glyph: "κ",
    nodeType: "deterministic_check",
    truth: "source",
    targets: ["c"],
    summary:
      "Every active booking references a staff, client, and service, and starts before it ends.",
    why: "Referential and temporal integrity for the core object.",
    failure: "Orphaned or inverted-interval bookings.",
    parents: ["ROOT.008"],
    dependsOn: ["DATA.006"],
    candidates: ["c.booking_well_formed"],
  }),
];

const BLUEPRINT: NodeCapsule[] = [
  n({
    id: "BLUEPRINT.001",
    label: "Blueprint Object",
    colour: "slate",
    depth: "L5",
    check: "C3",
    glyph: "π",
    nodeType: "blueprint",
    targets: ["blueprint"],
    summary:
      "The deterministic build contract: scope, stack, data model, routes, tasks, tests, acceptance, done.",
    why: "The execution boundary; where exploration stops and constraint begins (AXIOM A1).",
    failure:
      "The executor over-engineers or under-specifies without a contract.",
    children: ["BLUEPRINT.006", "BLUEPRINT.015"],
  }),
  n({
    id: "BLUEPRINT.006",
    label: "Data Model Plan",
    depth: "L5",
    check: "C4",
    nodeType: "blueprint",
    targets: ["blueprint", "c"],
    summary: "The tables, columns, and constraints the executor must create.",
    why: "Pins the schema so checks and code agree.",
    failure: "Schema drift between code and checks.",
    parents: ["BLUEPRINT.001"],
    dependsOn: ["DATA.002"],
  }),
  n({
    id: "BLUEPRINT.015",
    label: "Acceptance Criteria",
    colour: "green",
    depth: "L5",
    check: "C3",
    glyph: "κ",
    nodeType: "blueprint",
    targets: ["blueprint", "c"],
    summary:
      "The must-pass conditions for the booking feature, including 'no double-booking'.",
    why: "Turns intent into a testable definition of done.",
    failure: "'Done' is a matter of opinion.",
    parents: ["BLUEPRINT.001"],
    dependsOn: ["L2C.011", "CHECK.001"],
  }),
];

const CLAUDE: NodeCapsule[] = [
  n({
    id: "CLAUDE.002",
    label: "CLAUDE.md Export",
    colour: "cyan",
    depth: "L5",
    check: "C2",
    glyph: "λ",
    nodeType: "claude_export",
    targets: ["claude"],
    summary:
      "Project instructions telling Claude Code which pack to load, what matters, what not to touch, and when to ask.",
    why: "The executor's entry point into the compiled world.",
    failure: "Claude builds from a raw prompt with no governed context.",
    dependsOn: ["ROOT.007", "ROOT.011"],
  }),
  n({
    id: "CLAUDE.003",
    label: "SKILL.md Export",
    colour: "cyan",
    depth: "L5",
    check: "C2",
    glyph: "λ",
    nodeType: "claude_export",
    targets: ["claude"],
    summary:
      "A loadable skill that teaches Claude Code how to use the Ada pack and run its C checks.",
    why: "Packages the procedure so it is invoked, not re-explained.",
    failure: "Pack sits unused; benefit unrealized.",
    dependsOn: ["L2C.013"],
  }),
  n({
    id: "CLAUDE.008",
    label: "C Verifier Subagent",
    colour: "cyan",
    depth: "L5",
    check: "C3",
    glyph: "λ",
    nodeType: "claude_subagent",
    targets: ["claude", "c"],
    summary:
      "A subagent that runs the pack's verify.mjs and reports pass/fail before code is accepted.",
    why: "Wires the trust layer into the executor's loop.",
    failure: "Code ships without the checks ever running.",
    dependsOn: ["ROOT.008", "CHECK.001"],
  }),
];

function edges(): Edge[] {
  const e: Edge[] = [];
  const contain = (from: string, to: string) =>
    e.push({ from, to, type: "contains" });
  // spine -> primitives
  e.push({
    from: "L2C.001",
    to: "DATA.001",
    type: "compiles_to",
    note: "nouns become the entity registry",
  });
  e.push({ from: "L2C.001", to: "DATA.003", type: "compiles_to" });
  e.push({ from: "L2C.007", to: "DATA.007", type: "compiles_to" });
  e.push({ from: "L2C.015", to: "DATA.006", type: "compiles_to" });
  e.push({
    from: "L2C.016",
    to: "CHECK.001",
    type: "generalizes_to",
    note: "failure language became the overlap check",
  });
  // entities -> tables
  e.push({ from: "DOMAIN.004", to: "DATA.003", type: "compiles_to" });
  e.push({ from: "DOMAIN.003", to: "DATA.004", type: "compiles_to" });
  e.push({ from: "DOMAIN.006", to: "DATA.005", type: "compiles_to" });
  e.push({ from: "DOMAIN.007", to: "DATA.006", type: "compiles_to" });
  e.push({ from: "DOMAIN.010", to: "DATA.007", type: "compiles_to" });
  // checks verify
  e.push({
    from: "CHECK.001",
    to: "WORKFLOW.005",
    type: "verified_by",
    note: "booking flow is guarded by no_double_booking",
  });
  e.push({ from: "CHECK.001", to: "DATA.006", type: "verified_by" });
  e.push({ from: "CHECK.002", to: "DATA.007", type: "verified_by" });
  e.push({ from: "CHECK.003", to: "DATA.006", type: "verified_by" });
  // blueprint + acceptance
  e.push({ from: "BLUEPRINT.006", to: "DATA.002", type: "depends_on" });
  e.push({
    from: "BLUEPRINT.015",
    to: "CHECK.001",
    type: "depends_on",
    note: "acceptance includes no double-booking",
  });
  // exports
  e.push({ from: "ROOT.007", to: "CLAUDE.002", type: "exports_to" });
  e.push({ from: "L2C.013", to: "CLAUDE.003", type: "exports_to" });
  e.push({ from: "CHECK.001", to: "CLAUDE.008", type: "exports_to" });
  // governance guards
  e.push({ from: "L2C.003", to: "ROOT.011", type: "guarded_by" });
  // spine containment (illustrative)
  for (const node of L2C) contain("ROOT.007", node.id);
  for (const node of CHECK) contain("ROOT.008", node.id);
  return e;
}

export function showcaseSeed(intent: string): Seed {
  return {
    rootIntent: intent,
    domain: "AI-Native Service Business Command Center",
    userRole: "Owner-operator of a local service business",
    buildObjective:
      "A command center to manage clients, bookings, staff, payments, content, campaigns, reviews, and automations.",
    knowledgeObjective:
      "A navigable world model of the business so Claude Code builds from structure, not a raw prompt.",
    trustObjective:
      "Deterministic checks (starting with no-double-booking) that catch the failures that matter.",
    knownContext: [
      "Bookings are tied to a staff member, a service, and a time slot.",
      "Deposits hold bookings; payments are real money.",
    ],
    unknownContext: [
      "Deposit amount / policy",
      "Cancellation and refund windows",
      "Whether multiple locations are in scope",
      "Exact persistence engine",
    ],
    assumptions: [
      "The product requires persistent data.",
      "A single location to start.",
    ],
    sources: ["Founder goal brief (Ada world-model schema graph, §13/§15)"],
    constraints: [
      "Local-first; no cloud account in P0.",
      "No subjective taste disguised as deterministic C.",
    ],
    risks: [
      "Customer data is sensitive.",
      "Payment actions are high-stakes and gated.",
    ],
  };
}

export function buildShowcasePack(slug: string, intent: string): PackModel {
  const nodes = [
    ...ROOT,
    ...L2C,
    ...DOMAIN,
    ...WORKFLOW,
    ...DATA,
    ...CHECK,
    ...BLUEPRINT,
    ...CLAUDE,
  ];
  const seed = showcaseSeed(intent);
  const graph: Graph = {
    id: `graph-${slug}`,
    version: "0.1.0",
    packSlug: slug,
    nodes,
    edges: edges(),
  };
  const wiki = projectWiki(graph, seed);
  return {
    slug,
    seed,
    graph,
    wiki,
    provenance:
      "Deterministically seeded from the founder goal brief and its Ada world-model schema graph (§13/§15), provided as the product spec. No model-generated content (AXIOM A2/D6).",
  };
}
