# DATA_MODEL.md — projected from L2C.001

Use these canonical entities unless later context overrides them.

| Entity | Classification | Notes |
|---|---|---|
| Client | primary_domain_entity | contains customer data |
| Appointment | primary_workflow_entity | double booking |
| Payment | financial_entity | negative payment |
| StaffMember | actor_entity | — |
| ContentAsset | supporting_content_entity | Ambiguous — Could be CMS content, social content, portfolio content, or internal asset. |
| Review | proof_entity | review authenticity |
| Automation | workflow_support_entity | Ambiguous — Could mean background jobs, AI agents, scheduled tasks, or Claude Code workflows. |

## Rule
Claude Code MUST NOT create additional primary domain entities unless it records them in `proposed_entities.yaml` and explains why existing entities do not cover it, where it appears in context, whether it is MVP-required, and whether it creates new C checks.

## Warnings
- Do not use `User` as a synonym for `Client`.
- Do not split `Booking` and `Appointment` unless the workflow requires it.
- Do not model `Deposit` as a loose number if reconciliation matters.
- Do not treat `Review` as trusted proof without a `source` field.
- Do not implement `Automation` until its trigger/action/scope is defined.
