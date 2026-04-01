---
name: self-improvement-feedback-cycle
description: "Use when SessionEnd hook fires and .ada/sessions/{id}.json is written pattern detected."
---

# self-improvement-feedback-cycle

Trigger: SessionEnd hook fires and .ada/sessions/{id}.json is written

## Steps
1. **extract-skills-from-session**
   - Pre: `.ada/sessions/{sessionId}.json exists and is complete (no .tmp suffix) AND session.toolCallCount > 0 AND extract_skills MCP tool is available`
   - Action: `invoke extract_skills tool with sessionId; scan session-log.jsonl for repeated successful tool-call patterns, resolved drift events, and high-confidence sub-tasks; construct SkillCandidate records with evidence postcodes pointing back to session; write SkillCandidates to self-improvement bounded context storage`
   - Post: `SkillCandidate records written with sessionId provenance; each candidate has evidence postcode linking back to originating session tool calls; SkillCandidates are queryable by future compilation runs`

2. **propose-and-govern-amendment**
   - Pre: `SkillCandidates exist for current session AND propose_amendment MCP tool available AND CompilationRun record accessible for current runId`
   - Action: `invoke propose_amendment with SkillCandidates and current blueprintPostcode; generate Amendment record describing proposed change to blueprint, agent configuration, or hook behavior; run amendment through abbreviated GOV evaluation (coherence check only, no full pipeline re-run); set Amendment.status=PROPOSED|APPROVED|REJECTED; if APPROVED write amendment to .ada/amendments/{id}.json`
   - Post: `Amendment record persisted with status and rationale; if APPROVED, amendment is queued for application on next compilation run OR applied as hot-patch to agent files if scope is limited to agent behavior only; ProvenanceChain updated with amendment postcode`
