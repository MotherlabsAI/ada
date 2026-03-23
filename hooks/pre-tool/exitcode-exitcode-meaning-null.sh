#!/bin/bash
# Invariant: exitCode.meaning !== null
# Entity: ExitCode
# Description: exit code must have an associated meaning
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: exitCode.meaning !== null
exit 0
