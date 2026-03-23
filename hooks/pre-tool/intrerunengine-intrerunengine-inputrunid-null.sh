#!/bin/bash
# Invariant: intRerunEngine.inputRunId !== null
# Entity: IntRerunEngine
# Description: engine must be instantiated with a valid run ID before execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intRerunEngine.inputRunId !== null
exit 0
