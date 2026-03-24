#!/bin/bash
# Invariant: gate.passed === (gate.provenanceIntact && gate.allBlockersCleared && gate.entityCount > 0)
# Entity: ENTGateRecord
# Description: gate pass is exactly the conjunction of provenance integrity, cleared blockers, and non-zero entity count; any weaker definition allows a false pass
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === (gate.provenanceIntact && gate.allBlockersCleared && gate.entityCount > 0)
exit 0
