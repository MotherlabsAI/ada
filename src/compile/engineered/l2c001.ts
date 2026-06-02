/**
 * Engineered node payload: L2C.001 — Nouns → Entities (Alex's reference spec, 2026-06-02).
 * Data only. The emitter (emit.ts) turns this into the on-disk fat node + runnable C +
 * projections. This is what "Ada produced an engineered node" means — regenerable, not
 * hand-faked. Generalizing the emitter to all nodes is the follow-up.
 */

export interface EntityCand {
  id: string;
  canonicalName: string;
  classification: string;
  confidence: "high" | "medium" | "low";
  definition: string;
  fieldHints: string[];
  relationshipHints?: string[];
  lifecycleHints?: string[];
  riskHints?: string[];
  ambiguity?: string[];
  residue?: string[];
  checkability: string;
}

export interface CCandidate {
  id: string;
  title: string;
  class: string;
  predicate: string;
  failureClass: string;
}

export const L2C001 = {
  id: "L2C.001",
  label: "Nouns → Entities",
  display: "◇ ● ∴ κ ⇒ L2C.001 — Nouns → Entities",
  cluster: { id: "L2C", label: "Language-to-Code Translation" },
  status: {
    lifecycle: "finished",
    maturity: "engineered_v0.2",
    qualityGate: "required",
  },
  role: {
    type: "translation_primitive",
    purpose:
      "Convert raw noun phrases into candidate software/domain entities.",
    boundedClaim:
      "Entity extraction improves downstream code generation by stabilizing the objects Claude Code should reason about. It does not guarantee full schema correctness.",
  },
  ioContract: {
    accepts: [
      "raw_prompt",
      "SEED.root_intent",
      "SEED.domain",
      "user_notes",
      "source_documents",
      "existing_repo_context",
    ],
    required: ["raw_prompt"],
    optional: [
      "business_type",
      "target_stack",
      "existing_schema",
      "existing_page_map",
      "existing_brand_terms",
    ],
    emits: [
      "canonical_entity_registry",
      "candidate_entity_list",
      "alias_map",
      "ambiguous_noun_residue",
      "relationship_hints",
      "field_hints",
      "ownership_hints",
      "lifecycle_hints",
      "risk_hints",
      "wiki_article",
      "C_candidates",
      "Claude_instructions",
      "blueprint_hints",
    ],
  },
  localContext: {
    summary:
      "User language contains nouns that may represent durable objects in the working world. This node extracts and classifies those nouns so later agents build stable schemas, routes, UI screens, wiki sections, and checks.",
    whyItMatters:
      "Claude Code often builds weak systems when nouns stay vague — duplicate models, inconsistent names, missing relationships, UI that does not match the domain. This node stops raw nouns from drifting.",
    failureIfMissing: [
      "Duplicate entities appear under different names.",
      "Important business objects are treated as loose text.",
      "Database schema does not match the user's domain.",
      "UI navigation is organized around generic pages instead of domain objects.",
      "Claude Code invents entities that were never intended.",
      "C checks cannot bind to stable objects.",
    ],
  },
  epistemics: {
    truthStatus: "semantic_inference",
    sourceStatus: "derived_from_user_language",
    confidence: "medium",
    requiresHumanReviewWhen: [
      "noun could be entity or attribute",
      "noun implies legal/payment/customer-data risk",
      "noun is domain-specific and ambiguous",
      "noun appears only once but may be important",
    ],
  },
  subnodes: [
    "Raw Noun Surface",
    "Noun Phrase Extraction",
    "Candidate Entity Detection",
    "Entity vs Attribute Split",
    "Entity vs Action Split",
    "Entity vs View Split",
    "Entity vs Document Split",
    "Canonical Naming",
    "Synonym / Alias Merge",
    "Plural / Singular Normalization",
    "Relationship Hinting",
    "Ownership Hinting",
    "Status / Lifecycle Hinting",
    "Required Field Hinting",
    "Risk Hinting",
    "Source Evidence Attachment",
    "Ambiguous Noun Residue",
    "C Candidate Generation",
  ],
  edges: {
    parents: [
      { id: "ROOT.007", label: "Language-to-Code Spine", edge: "contains" },
      { id: "SEED.003", label: "Domain Field", edge: "depends_on" },
      { id: "INTAKE.001", label: "Raw Prompt", edge: "derived_from" },
    ],
    children: [
      {
        id: "DATA.001",
        label: "Canonical Entity Registry",
        edge: "compiles_to",
      },
      { id: "DATA.002", label: "Database Schema", edge: "compiles_to" },
      { id: "BLUEPRINT.006", label: "Data Model Plan", edge: "compiles_to" },
      { id: "UI.010", label: "Client List View", edge: "enables" },
      { id: "CLAUDE.002", label: "CLAUDE.md Export", edge: "exports_to" },
      { id: "C.001", label: "C Registry", edge: "verified_by" },
    ],
    siblings: [
      { id: "L2C.002", label: "Verbs → Actions", edge: "adjacent_to" },
      { id: "L2C.003", label: "Roles → Permissions", edge: "adjacent_to" },
      { id: "L2C.004", label: "States → State Machines", edge: "adjacent_to" },
      {
        id: "L2C.015",
        label: "Relationship Language → Foreign Keys",
        edge: "adjacent_to",
      },
    ],
    riskEdges: [
      { id: "GOV.005", label: "Customer Data Gate", edge: "guarded_by" },
      { id: "GOV.012", label: "Unsupported Claim Rule", edge: "guarded_by" },
    ],
    residueEdges: [
      { id: "SEED.012", label: "Unknown Context Field", edge: "residue_of" },
      { id: "PACK.011", label: "residue.md", edge: "exports_to" },
    ],
  },
  entityCandidates: [
    {
      id: "ENTITY.client",
      canonicalName: "Client",
      classification: "primary_domain_entity",
      confidence: "high",
      definition:
        "A person or organization receiving services from the business.",
      fieldHints: [
        "id",
        "name",
        "email",
        "phone",
        "status",
        "source",
        "created_at",
        "updated_at",
      ],
      relationshipHints: [
        "Client has many Appointments",
        "Client has many Payments",
        "Client has many Notes",
      ],
      riskHints: ["contains customer data", "requires privacy boundary"],
      checkability: "C4",
    },
    {
      id: "ENTITY.appointment",
      canonicalName: "Appointment",
      classification: "primary_workflow_entity",
      confidence: "high",
      definition:
        "A scheduled service interaction between a client and a staff member.",
      fieldHints: [
        "id",
        "client_id",
        "staff_id",
        "service_id",
        "starts_at",
        "ends_at",
        "status",
        "deposit_id",
        "created_at",
      ],
      relationshipHints: [
        "Appointment belongs to Client",
        "Appointment belongs to StaffMember",
        "Appointment may have Deposit",
        "Appointment may have Payment",
      ],
      lifecycleHints: [
        "requested",
        "confirmed",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show",
      ],
      riskHints: [
        "double booking",
        "timezone mismatch",
        "cancelled appointment accepting payment",
      ],
      checkability: "C4",
    },
    {
      id: "ENTITY.payment",
      canonicalName: "Payment",
      classification: "financial_entity",
      confidence: "high",
      definition:
        "A recorded monetary transaction linked to a client, appointment, or service.",
      fieldHints: [
        "id",
        "client_id",
        "appointment_id",
        "amount",
        "currency",
        "status",
        "provider",
        "provider_reference",
        "created_at",
      ],
      riskHints: [
        "negative payment",
        "currency mismatch",
        "ledger mismatch",
        "refund handling",
      ],
      checkability: "C5",
    },
    {
      id: "ENTITY.staff_member",
      canonicalName: "StaffMember",
      classification: "actor_entity",
      confidence: "high",
      definition:
        "A person who performs services, manages workflow, or has system permissions.",
      fieldHints: ["id", "name", "role", "active", "schedule", "created_at"],
      relationshipHints: [
        "StaffMember has many Appointments",
        "StaffMember may offer many Services",
      ],
      checkability: "C4",
    },
    {
      id: "ENTITY.content_asset",
      canonicalName: "ContentAsset",
      classification: "supporting_content_entity",
      confidence: "medium",
      definition:
        "A reusable media or text asset used for website, social, campaign, or internal knowledge purposes.",
      fieldHints: [
        "id",
        "title",
        "type",
        "status",
        "file_url",
        "caption",
        "created_at",
      ],
      ambiguity: [
        "Could be CMS content, social content, portfolio content, or internal asset.",
      ],
      residue: ["Ask what content types matter first."],
      checkability: "C3",
    },
    {
      id: "ENTITY.review",
      canonicalName: "Review",
      classification: "proof_entity",
      confidence: "medium",
      definition:
        "A third-party or user-provided proof object used to support trust claims.",
      fieldHints: [
        "id",
        "client_name",
        "rating",
        "body",
        "source",
        "published_at",
      ],
      riskHints: ["review authenticity", "source attribution"],
      checkability: "C3",
    },
    {
      id: "ENTITY.automation",
      canonicalName: "Automation",
      classification: "workflow_support_entity",
      confidence: "low",
      definition:
        "A triggered or agent-assisted workflow that performs or suggests repeated work.",
      fieldHints: ["id", "trigger", "action", "scope", "status"],
      ambiguity: [
        "Could mean background jobs, AI agents, scheduled tasks, or Claude Code workflows.",
      ],
      residue: [
        "Branch into AGENT and WORKFLOW clusters before implementation.",
      ],
      checkability: "C2",
    },
  ] as EntityCand[],
  aliasMap: {
    Client: {
      accepted: ["client", "customer", "lead after conversion"],
      rejected: ["user"],
      note: "Avoid User unless system/auth identity is meant.",
    },
    Appointment: {
      accepted: ["booking", "appointment", "calendar slot", "session"],
      preferred: "Appointment",
      note: "Preserve Booking as a workflow/action term unless the domain prefers Booking.",
    },
    StaffMember: {
      accepted: ["staff", "employee", "artist", "provider", "team member"],
      preferred: "StaffMember",
      note: "Avoid generic User unless it is an authenticated account.",
    },
    Payment: {
      accepted: ["payment", "transaction", "checkout", "paid amount"],
      preferred: "Payment",
    },
    Deposit: {
      accepted: ["deposit", "retainer", "booking fee"],
      preferred: "Deposit",
      note: "May be a separate object or a Payment subtype — keep as a design decision.",
    },
    ContentAsset: {
      accepted: ["content", "asset", "media", "post", "portfolio image"],
      preferred: "ContentAsset",
    },
    Review: {
      accepted: ["review", "testimonial", "proof"],
      preferred: "Review",
    },
  } as Record<
    string,
    {
      accepted: string[];
      rejected?: string[];
      preferred?: string;
      note?: string;
    }
  >,
  ambiguousNouns: [
    {
      term: "command center",
      possibleMeanings: [
        "dashboard",
        "admin app",
        "internal operations system",
        "AI workflow hub",
      ],
      action: "preserve as residue until UI/product scope is selected",
    },
    {
      term: "content",
      possibleMeanings: [
        "social media content",
        "website content",
        "portfolio assets",
        "internal knowledge",
      ],
      action: "ask lightweight follow-up or branch into ContentAsset subtypes",
    },
    {
      term: "AI automations",
      possibleMeanings: [
        "agent tasks",
        "background jobs",
        "content generation",
        "customer-service assistant",
        "Claude Code workflows",
      ],
      action: "branch into AGENT and WORKFLOW clusters",
    },
  ],
  residue: [
    { term: "command center", reason: "Needs UI/product scope decision." },
    {
      term: "content",
      reason:
        "Needs content-type scope (social vs website vs portfolio vs internal).",
    },
    {
      term: "AI automations",
      reason: "Needs workflow and agent scope decision.",
    },
  ],
  cCandidates: [
    {
      id: "schema.no_duplicate_entity_names",
      title: "No duplicate canonical entity names",
      class: "C3",
      predicate:
        "The canonical entity registry must not contain duplicate canonical_name values.",
      failureClass: "duplicate_entity",
    },
    {
      id: "schema.primary_entities_have_definitions",
      title: "Primary entities must have definitions",
      class: "C3",
      predicate:
        "Every primary/workflow/financial/actor entity must include a non-empty definition.",
      failureClass: "undefined_primary_entity",
    },
    {
      id: "residue.ambiguous_nouns_preserved",
      title: "Ambiguous nouns must be preserved as residue",
      class: "C3",
      predicate: "Any noun marked ambiguous must appear in residue.",
      failureClass: "lost_ambiguity",
    },
    {
      id: "claude.no_unregistered_primary_entities",
      title: "Claude must not introduce unregistered primary entities",
      class: "C4",
      predicate:
        "Generated code/specs must not introduce new primary entity names unless listed as proposed or residue.",
      failureClass: "silent_entity_drift",
    },
  ] as CCandidate[],
  checkability: {
    class: "C3_C4_candidate",
    deterministicSurface: [
      "graph schema",
      "entity registry",
      "route map",
      "database schema",
      "UI map",
      "Claude export",
      "C registry",
    ],
    notDeterministic: [
      "perfect entity judgment",
      "domain-expert naming taste",
      "business-priority selection",
      "which entities belong in MVP",
    ],
    humanReviewRequired: [
      "entity vs attribute decision",
      "MVP inclusion decision",
      "domain-specific naming choice",
      "ambiguous noun resolution",
    ],
  },
  qualityGates: [
    "has_clear_bounded_scope",
    "has_failure_if_missing",
    "has_input_output_contract",
    "has_world_links",
    "has_wiki_projection",
    "has_checkability_class",
    "has_c_candidates",
    "preserves_ambiguity",
  ],
  exportTargets: ["graph", "wiki", "blueprint", "claude", "c", "residue"],
};

export type L2C001Node = typeof L2C001;
