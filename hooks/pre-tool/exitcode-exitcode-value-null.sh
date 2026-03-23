#!/bin/bash
# Invariant: exitCode.value !== null
# Entity: ExitCode
# Description: exit code value must not be null
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: exitCode.value !== null
exit 0
