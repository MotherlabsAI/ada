#!/bin/bash
# Invariant: stdout.fileDescriptor === 1
# Entity: Stdout
# Description: stdout must always have file descriptor 1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stdout.fileDescriptor === 1
exit 0
