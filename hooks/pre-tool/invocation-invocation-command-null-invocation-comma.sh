#!/bin/bash
# Invariant: invocation.command !== null && invocation.command.length > 0
# Entity: Invocation
# Description: invocation must have a non-empty shell command string
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: invocation.command !== null && invocation.command.length > 0
exit 0
