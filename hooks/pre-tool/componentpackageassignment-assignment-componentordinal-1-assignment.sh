#!/bin/bash
# Invariant: assignment.componentOrdinal >= 1 && assignment.componentOrdinal <= 10
# Entity: ComponentPackageAssignment
# Description: assignments must reference valid ordinals within the 10-component spec
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.componentOrdinal >= 1 && assignment.componentOrdinal <= 10
exit 0
