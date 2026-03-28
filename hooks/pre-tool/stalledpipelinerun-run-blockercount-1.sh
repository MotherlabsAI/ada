#!/bin/bash
# Invariant: run.blockerCount >= 1
# Entity: StalledPipelineRun
# Description: a stalled run with no blockers is a contradiction — if there are no blockers it should not be stalled
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.blockerCount >= 1
exit 0
