#!/bin/bash
# Invariant: state.totalTestCount >= 0 && state.failedTestCount >= 0
# Entity: CodebaseIntegrityState
# Description: test counts cannot be negative; negative values indicate a corrupted measurement
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: state.totalTestCount >= 0 && state.failedTestCount >= 0
exit 0
