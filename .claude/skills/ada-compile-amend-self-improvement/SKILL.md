---
name: ada-compile-amend-self-improvement
description: "Use when user executes 'ada compile --amend' after 'ada review-skills' or 'ada review-amendments' approves at least one Amendment pattern detected."
---

# ada-compile-amend-self-improvement

Trigger: user executes 'ada compile --amend' after 'ada review-skills' or 'ada review-amendments' approves at least one Amendment

## Steps
1. **session-log-ingestion**
   - Pre: `at least one Session in COMPLETED state exists in storage with session.logs non-empty AND a prior CompilationRun in COMPLETED state exists with blueprintPostcode resolvable`
   - Action: `read all COMPLETED Session logs from storage since last amendment recompile timestamp; extract SkillCandidate records by pattern-matching on successful tool-call sequences, repeated problem-solving patterns, and novel constraint discoveries; filter out any SkillCandidate containing Ada-the-language terminology; store SkillCandidates in self-improvement bounded context`
   - Post: `SkillCandidate records exist in storage (count may be zero if no patterns detected); all SkillCandidates are free of Ada-the-language terms; each SkillCandidate references the Session.runId it was extracted from; extraction timestamp recorded`

2. **human-gate-skill-review**
   - Pre: `SkillCandidate records exist in storage (count >= 0) AND user has invoked 'ada review-skills' command AND no Amendment is currently in HUMAN_REVIEW state (one review at a time)`
   - Action: `present each SkillCandidate to human reviewer via CLI interactive session: display extracted pattern, source session excerpt, proposed Skill definition; human marks each as APPROVED or REJECTED; approved SkillCandidates transition to Skill records; rejected SkillCandidates are marked REJECTED and archived; human may also author new Amendment records directly describing governance changes; all human decisions are recorded with timestamp and reviewer identity`
   - Post: `each SkillCandidate has a APPROVED or REJECTED disposition; Skill records exist for all APPROVED candidates; any authored Amendment records are in CANDIDATE state; human-gate is recorded as completed in provenance.db with reviewer timestamp`

3. **amendment-invariant-gate**
   - Pre: `at least one Amendment in CANDIDATE state exists AND GovernorDecision from baseline CompilationRun is resolvable AND DelegationContract immutable hash is verifiable`
   - Action: `for each CANDIDATE Amendment: load the immutable DelegationContract and invariants from baseline GovernorDecision; check Amendment.proposedChange does not modify: (a) compiled intent postcode chain, (b) DelegationContract invariants, (c) delegation policy, (d) GovernorDecision itself; if Amendment targets only downstream artifacts (CLAUDE.md content, agent behavioral guidance, skill additions) mark as GATE_PASSED; if Amendment targets governance core mark as GATE_REJECTED with specific violation; transition GATE_PASSED amendments to APPROVED state`
   - Post: `every CANDIDATE Amendment has either APPROVED or GATE_REJECTED disposition; no APPROVED Amendment targets the governance core; GATE_REJECTED Amendments have specific violation descriptions; gate decision recorded in provenance.db with immutable-hash verification timestamp`

4. **scoped-recompile**
   - Pre: `at least one Amendment in APPROVED state exists AND amendment-invariant-gate completed with no GATE_REJECTED violations on APPROVED amendments AND baseline CompilationRun.blueprintPostcode is resolvable`
   - Action: `determine recompile scope: identify which pipeline stages are affected by APPROVED Amendments (e.g., a skill about process modeling affects PRO and downstream; a skill about vocabulary affects SYN and downstream); re-run only affected stages from earliest affected stage forward; preserve immutable governance core (GOV stage is NOT re-run unless explicitly required by Amendment scope and human-approved); re-issue postcodes for all re-run stages, chaining them from the last preserved stage's postcode; update CLAUDE.md, agent files, and BUILD.md with amendment delta; mark all APPROVED Amendments as COMPILED with new postcode reference`
   - Post: `new CompilationRun record created with parentRunId referencing baseline run; all re-run stages have new postcodes chained correctly; artifacts on disk updated; APPROVED Amendments status = COMPILED; governance core (DelegationContract, immutable invariants) unchanged and hash-verified; CompilationRun transitions to COMPLETED`
