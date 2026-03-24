#!/bin/bash
# Invariant: gap.isResolved === false ? gap.resolvedPackage === null : true
# Entity: C3AssignmentGap
# Description: an unresolved gap must not claim a resolved package — that would be a false provenance record
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === false ? gap.resolvedPackage === null : true
exit 0
