#!/bin/bash
# Invariant: assignment.componentId !== null && assignment.componentId.length > 0
# Entity: ComponentPackageAssignment
# Description: assignments must reference a real component ID or they cannot be correlated with the registry
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.componentId !== null && assignment.componentId.length > 0
exit 0
