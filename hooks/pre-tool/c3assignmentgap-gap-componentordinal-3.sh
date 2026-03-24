#!/bin/bash
# Invariant: gap.componentOrdinal === 3
# Entity: C3AssignmentGap
# Description: C3AssignmentGap is definitionally about ordinal 3; any other ordinal would be a different gap record
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.componentOrdinal === 3
exit 0
