# ! ● ∴ κ ⇒ L2C.003 — Roles -> Permissions

## ⟡ Summary
Roles become permissions and policies: owner, staff, front-desk, client.

## ∴ Why it matters
Who-can-do-what is a security invariant, not a UI detail.

## ! Failure if missing
Privilege bugs: a client cancels another client's booking; staff sees the full ledger.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: derived_from_intent

## ⊢ Compiles to
- code
- blueprint
- c
- gov

## κ Checkability
Class **C4** — property-based. Property-based / generative check is possible.

Candidate checks:
- `authz.every_action_has_required_role`

## ↔ Links
- **Parents:** ROOT.007
- **Siblings:** L2C.001, L2C.002
- **Guarded by:** GOV.005
