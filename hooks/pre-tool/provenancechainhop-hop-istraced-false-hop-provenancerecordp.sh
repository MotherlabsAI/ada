#!/bin/bash
# Invariant: hop.isTraced === false ? hop.provenanceRecordPostcode === null : true
# Entity: ProvenanceChainHop
# Description: an untraced hop must not claim a postcode — that would be false evidence of tracing
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.isTraced === false ? hop.provenanceRecordPostcode === null : true
exit 0
