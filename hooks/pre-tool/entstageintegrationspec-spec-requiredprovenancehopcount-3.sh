#!/bin/bash
# Invariant: spec.requiredProvenanceHopCount === 3
# Entity: ENTStageIntegrationSpec
# Description: provenance chain must have exactly 3 hops per G2; fewer hops mean incomplete lineage validation
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: spec.requiredProvenanceHopCount === 3
exit 0
