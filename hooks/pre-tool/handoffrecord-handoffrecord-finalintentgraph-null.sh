#!/bin/bash
# Invariant: handoffRecord.finalIntentGraph !== null
# Entity: HandoffRecord
# Description: a handoff without a finalIntentGraph has no content to pass to the compilation pipeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.finalIntentGraph !== null
exit 0
