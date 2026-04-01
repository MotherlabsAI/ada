---
name: self-improvement-amendment-cycle
description: "Use when Session ends with finalConfidence recorded and at least 1 driftEvent observed during session pattern detected."
---

# self-improvement-amendment-cycle

Trigger: Session ends with finalConfidence recorded and at least 1 driftEvent observed during session

## Steps
1. **extract-skill-candidates-from-session**
   - Pre: `Session record has status=ended with finalConfidence and toolCallCount > 0; Session.driftEvents list is non-empty; WorldState version at session end is recorded`
   - Action: `analyze Session tool call log and driftEvents to identify repeatable successful patterns, extract SkillCandidates with name, description, preconditions, and postconditions fields, assign confidence score to each candidate based on repetition count and outcome consistency within session`
   - Post: `at least 1 SkillCandidate is written to self-improvement store with confidence >= 0.6; each SkillCandidate references Session.sessionId as origin; SkillCandidates are linked to the CompilationRun that governed the session via blueprintPostcode`

2. **propose-amendment-from-skill-candidates**
   - Pre: `at least 1 SkillCandidate has confidence >= 0.6; no pending Amendment targeting the same targetSection already exists in under-review status`
   - Action: `synthesize Amendment record from SkillCandidates: populate description from candidate patterns, set targetSection to the agent file or Blueprint section most relevant to the skill, set proposedBy to session agent identifier, set status=proposed, verify targetSection does not reference governance-core sections (pipeline stages, invariants, delegation policy)`
   - Post: `Amendment record written with status=proposed; Amendment.targetSection is not a governance-core section; Amendment references originating SkillCandidate postcodes in its provenance; Amendment is queued for governance review`

3. **governance-review-of-amendment**
   - Pre: `Amendment has status=proposed and is present in governance review queue; Blueprint postcode from CompilationRun that originated the governing session is retrievable; Amendment.targetSection resolves to an existing artifact section`
   - Action: `retrieve targeted artifact section from storage, evaluate Amendment description against section content, verify Amendment would improve coverage or coherence without reducing existing invariant coverage, compute amendment risk score, transition Amendment to status=under-review, require explicit approval action to advance`
   - Post: `Amendment has status=under-review with risk score computed; targeted artifact section is unchanged; review record is written with reviewer identity and timestamp; Amendment remains blocked from apply until approval action is received`

4. **apply-approved-amendment**
   - Pre: `Amendment has status=under-review with explicit approval recorded; Amendment.targetSection resolves to a mutable artifact; governance-core immutability check has passed (targetSection is not in immutable set); current Blueprint postcode matches postcode at time of amendment proposal`
   - Action: `retrieve artifact containing targetSection, apply Amendment changes to the section, re-postcode the modified artifact, write ProvenanceRecord linking new artifact postcode to Amendment.id and prior artifact postcode, transition Amendment to status=approved, update MacroPlan or WorldState if affected artifact is a runtime-governance artifact`
   - Post: `modified artifact exists in storage with new postcode; ProvenanceRecord links new postcode to Amendment.id; Amendment.status=approved; prior artifact version is archived not deleted; if CLAUDE.md or agent file was modified, self-improvement loop records that governing artifacts have changed and flags that next CompilationRun should incorporate the amendment`
