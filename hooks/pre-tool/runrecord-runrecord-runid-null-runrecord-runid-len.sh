#!/bin/bash
# Invariant: runRecord.runId !== null && runRecord.runId.length > 0
# Entity: RunRecord
# Description: every run record must have a non-empty runId — anonymous run records cannot be queried
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.runId !== null && runRecord.runId.length > 0
exit 0
