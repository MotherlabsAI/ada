#!/bin/bash
# Invariant: stdout.encoding !== null && stdout.encoding.length > 0
# Entity: Stdout
# Description: stdout must declare a non-empty encoding
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stdout.encoding !== null && stdout.encoding.length > 0
exit 0
