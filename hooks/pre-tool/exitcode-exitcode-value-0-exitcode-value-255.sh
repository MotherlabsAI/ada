#!/bin/bash
# Invariant: exitCode.value >= 0 && exitCode.value <= 255
# Entity: ExitCode
# Description: exit code must be a valid single-byte unsigned integer
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: exitCode.value >= 0 && exitCode.value <= 255
exit 0
