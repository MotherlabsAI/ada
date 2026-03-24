#!/bin/bash
# Invariant: gap.isResolved === true ? gap.resolutionProvenancePostcode !== null : true
# Entity: C3AssignmentGap
# Description: resolution must be traceable to a provenance record or it cannot be validated by the ENT gate
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === true ? gap.resolutionProvenancePostcode !== null : true
exit 0
