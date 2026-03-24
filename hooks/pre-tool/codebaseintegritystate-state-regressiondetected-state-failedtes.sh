#!/bin/bash
# Invariant: state.regressionDetected === (state.failedTestCount > 0)
# Entity: CodebaseIntegrityState
# Description: regression is exactly the condition of having failed tests; calling it false when tests fail conceals breakage
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: state.regressionDetected === (state.failedTestCount > 0)
exit 0
