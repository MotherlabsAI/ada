#!/bin/bash
# Invariant: exitCode.value === 0
# Entity: ExitCode
# Description: successful hello-world execution must return exit code 0
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: exitCode.value === 0
exit 0
